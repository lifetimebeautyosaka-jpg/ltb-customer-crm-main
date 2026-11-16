"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";
import {
  SERVICE_COLORS,
  SERVICE_TYPES,
  classifyService,
  type ServiceTypeName,
} from "@/lib/serviceCategory";

// グラフ・表は細分化した6種類で出す
const CHART_CATEGORIES = SERVICE_TYPES;
const CATEGORY_COLORS = SERVICE_COLORS;
type ChartCategory = ServiceTypeName;

// サービス別の売上推移
// 売上 ＝ 通常売上＋回数券消化（前受金は含めない）
// 大分類：トレーニング ／ リラクゼーション（ストレッチ・ヘッドスパ・オイルマッサージ・足ツボ）

type SaleRow = {
  sale_date: string | null;
  sale_type: string | null;
  amount: number | null;
  store_name: string | null;
  menu_type: string | null;
  customer_name: string | null;
  memo: string | null;
  reservation_id: number | string | null;
};

// 来店1回を1件として数える（指名料・延長など、同じ来店の売上は1件にまとめる）
function visitKey(s: SaleRow) {
  return s.reservation_id ? `r-${s.reservation_id}` : `c-${(s.customer_name || "").trim()}-${s.sale_date}`;
}

const STORES = ["すべて", "江戸堀", "箕面", "福島", "福島P", "天満橋", "天満橋Ts", "中崎町", "江坂", "西梅田"];
const MONTHS_SHOWN = 12;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => monthKey(new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)));
}

function man(v: number) {
  return `${(v / 10000).toFixed(v >= 1000000 ? 0 : 1)}万`;
}

function yen(v: number) {
  return `${Math.round(v).toLocaleString("ja-JP")}円`;
}

function pct(part: number, whole: number) {
  return whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "—";
}

function growth(current: number, prev: number) {
  if (!prev) return current ? "新規" : "—";
  const g = ((current - prev) / prev) * 100;
  return `${g >= 0 ? "+" : ""}${g.toFixed(1)}%`;
}

export default function ServiceAnalysisPage() {
  const months = useMemo(() => lastMonths(MONTHS_SHOWN), []);
  const [store, setStore] = useState("すべて");
  // 金額で見るか、構成比（その月の合計を100%）で見るか
  const [mode, setMode] = useState<"amount" | "share">("share");
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("gymup_logged_in") !== "true") {
      window.location.href = "/login";
      return;
    }
    void (async () => {
      const res = await fetchAllRows<SaleRow>((from, to) =>
        supabase
          .from("sales")
          .select("sale_date, sale_type, amount, store_name, menu_type, customer_name, memo, reservation_id")
          .gte("sale_date", `${new Date().getFullYear() - 1}-01-01`)
          .order("id", { ascending: true })
          .range(from, to)
      );
      if (res.error) setError(res.error.message || "読み込みに失敗しました。");
      setSales(res.data);
      setLoading(false);
    })();
  }, [months]);

  // 月 × 中分類 の売上
  const table = useMemo(() => {
    const data = new Map<string, Record<ChartCategory, number>>();
    const visits = new Map<string, Set<string>>();
    months.forEach((m) => data.set(m, Object.fromEntries(CHART_CATEGORIES.map((c) => [c, 0])) as Record<ChartCategory, number>));
    for (const s of sales) {
      if ((s.sale_type || "").trim() === "前受金") continue;
      if (store !== "すべて" && (s.store_name || "").trim() !== store) continue;
      const m = (s.sale_date || "").slice(0, 7);
      const row = data.get(m);
      if (!row) continue;
      const type = classifyService({
        menuType: s.menu_type,
        storeName: s.store_name,
        text: `${s.memo || ""} ${s.customer_name || ""}`,
      });
      row[type] += Number(s.amount || 0);
      if (!visits.has(m)) visits.set(m, new Set());
      visits.get(m)!.add(visitKey(s));
    }
    return months.map((m) => {
      const row = data.get(m)!;
      const total = CHART_CATEGORIES.reduce((sum, c) => sum + row[c], 0);
      const training = row["トレーニング"];
      const visitCount = visits.get(m)?.size || 0;
      return { month: m, row, total, training, relax: total - training, visitCount, unit: visitCount ? total / visitCount : 0 };
    });
  }, [sales, store, months]);

  // 施術時間別の内訳（先月）：メモの「○分」から読み取る
  const minutesBreakdown = useMemo(() => {
    const target = months[months.length - 2];
    const map = new Map<string, { type: ServiceTypeName; minutes: string; count: number; amount: number }>();
    for (const s of sales) {
      if ((s.sale_type || "").trim() === "前受金") continue;
      if (store !== "すべて" && (s.store_name || "").trim() !== store) continue;
      if ((s.sale_date || "").slice(0, 7) !== target) continue;
      const text = `${s.memo || ""} ${s.customer_name || ""}`;
      if (text.includes("指名料") || text.includes("延長")) continue;
      const type = classifyService({ menuType: s.menu_type, storeName: s.store_name, text });
      const minutes = text.match(/(30|40|45|50|60|70|80|90|100|120|150|180)\s*分/)?.[1];
      const label = minutes ? `${minutes}分` : "時間不明";
      const key = `${type}-${label}`;
      const row = map.get(key) || { type, minutes: label, count: 0, amount: 0 };
      row.count += 1;
      row.amount += Number(s.amount || 0);
      map.set(key, row);
    }
    return {
      month: target,
      rows: Array.from(map.values()).sort(
        (a, b) => SERVICE_TYPES.indexOf(a.type) - SERVICE_TYPES.indexOf(b.type) || b.amount - a.amount
      ),
    };
  }, [sales, store, months]);

  // 年間の売上（1〜12月）
  const yearly = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, () => 0);
    const byType = Object.fromEntries(SERVICE_TYPES.map((t) => [t, 0])) as Record<ServiceTypeName, number>;
    const byStore = new Map<string, number>();
    const visitsAll = new Set<string>();
    const visitsByType = Object.fromEntries(SERVICE_TYPES.map((t) => [t, new Set<string>()])) as Record<ServiceTypeName, Set<string>>;
    for (const s of sales) {
      if ((s.sale_type || "").trim() === "前受金") continue;
      const storeName = (s.store_name || "").trim() || "未設定";
      if (store !== "すべて" && storeName !== store) continue;
      const date = s.sale_date || "";
      if (Number(date.slice(0, 4)) !== year) continue;
      const amount = Number(s.amount || 0);
      byMonth[Number(date.slice(5, 7)) - 1] += amount;
      const type = classifyService({ menuType: s.menu_type, storeName: s.store_name, text: `${s.memo || ""} ${s.customer_name || ""}` });
      byType[type] += amount;
      byStore.set(storeName, (byStore.get(storeName) || 0) + amount);
      visitsAll.add(visitKey(s));
      visitsByType[type].add(visitKey(s));
    }
    const total = byMonth.reduce((a, b) => a + b, 0);
    const now = new Date();
    const monthsWithData = year === now.getFullYear() ? now.getMonth() + 1 : 12;
    const prevYearTotal = sales.reduce((sum, s) => {
      if ((s.sale_type || "").trim() === "前受金") return sum;
      if (store !== "すべて" && ((s.store_name || "").trim() || "未設定") !== store) return sum;
      const d = s.sale_date || "";
      // 前年の同じ期間（1月〜同じ月まで）と比べる
      if (Number(d.slice(0, 4)) !== year - 1 || Number(d.slice(5, 7)) > monthsWithData) return sum;
      return sum + Number(s.amount || 0);
    }, 0);
    return {
      byMonth,
      byType,
      byStore: Array.from(byStore.entries()).sort((a, b) => b[1] - a[1]),
      total,
      average: total / monthsWithData,
      monthsWithData,
      prevYearTotal,
      visitCount: visitsAll.size,
      unit: visitsAll.size ? total / visitsAll.size : 0,
      visitsByType: Object.fromEntries(SERVICE_TYPES.map((t) => [t, visitsByType[t].size])) as Record<ServiceTypeName, number>,
    };
  }, [sales, store, year]);

  const maxTotal = Math.max(1, ...table.map((t) => t.total));
  const scaleOf = (t: { total: number }) => (mode === "share" ? (t.total || 1) : maxTotal);
  const current = table[table.length - 1];
  const prev = table[table.length - 2];
  // 今月は途中なので、比較は「先月」と「先々月」で行う
  const lastFull = prev;
  const beforeFull = table[table.length - 3];

  const W = 760, H = 300, left = 56, bottom = 40, top = 20;
  const plotH = H - bottom - top;
  const band = (W - left - 10) / table.length;

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#5B5E66", fontWeight: 700 }}>SERVICE ANALYSIS</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>サービス別の売上推移</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/sales/stores" style={linkStyle}>店舗別集計</Link>
            <Link href="/sales" style={linkStyle}>売上管理へ</Link>
          </div>
        </div>

        <section style={cardStyle}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STORES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStore(s)}
                style={{ ...chipStyle, ...(store === s ? chipActiveStyle : {}) }}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {loading ? <div style={cardStyle}>読み込み中...</div> : (
          <>
            <section style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <h2 style={titleStyle}>年間の売上（{year}年・{store === "すべて" ? "全店舗" : store}）</h2>
                <div style={{ display: "flex", gap: 6 }}>
                  {[thisYear, thisYear - 1].map((y) => (
                    <button key={y} type="button" onClick={() => setYear(y)} style={{ ...chipStyle, ...(year === y ? chipActiveStyle : {}) }}>{y}年</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                <div style={statStyle}>
                  <div style={statLabel}>年間の売上（{yearly.monthsWithData === 12 ? "1〜12月" : `1〜${yearly.monthsWithData}月`}）</div>
                  <div style={statValue}>{yen(yearly.total)}</div>
                </div>
                <div style={statStyle}>
                  <div style={statLabel}>1か月の平均</div>
                  <div style={statValue}>{yen(yearly.average)}</div>
                </div>
                <div style={statStyle}>
                  <div style={statLabel}>平均単価（来店1回あたり）</div>
                  <div style={statValue}>{yearly.visitCount ? yen(yearly.unit) : "—"}</div>
                  <div style={{ fontSize: 11, color: "#5B5E66" }}>来店 {yearly.visitCount.toLocaleString("ja-JP")}件</div>
                </div>
                <div style={statStyle}>
                  <div style={statLabel}>前年の同じ期間との比較</div>
                  <div style={statValue}>{yearly.prevYearTotal ? growth(yearly.total, yearly.prevYearTotal) : "データなし"}</div>
                </div>
              </div>
              <svg viewBox="0 0 760 180" style={{ width: "100%", height: "auto" }} role="img" aria-label="月別の売上">
                {yearly.byMonth.map((v, i) => {
                  const max = Math.max(1, ...yearly.byMonth);
                  const bw = 760 / 12;
                  const h = (v / max) * 130;
                  return (
                    <g key={i}>
                      <rect x={i * bw + bw * 0.2} y={150 - h} width={bw * 0.6} height={h} fill="#15171C" opacity={0.8}>
                        <title>{`${i + 1}月：${yen(v)}`}</title>
                      </rect>
                      <text x={i * bw + bw / 2} y={150 - h - 4} textAnchor="middle" fontSize="10" fill="#15171C">{v ? man(v) : ""}</text>
                      <text x={i * bw + bw / 2} y={168} textAnchor="middle" fontSize="11" fill="#5B5E66">{i + 1}月</text>
                    </g>
                  );
                })}
              </svg>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                <table style={tableStyle}>
                  <thead>
                    <tr><th style={thStyle}>サービス</th><th style={thRight}>年間売上</th><th style={thRight}>構成比</th><th style={thRight}>件数</th><th style={thRight}>平均単価</th></tr>
                  </thead>
                  <tbody>
                    {SERVICE_TYPES.map((t) => (
                      <tr key={t}>
                        <td style={tdStyle}>
                          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[t], marginRight: 6 }} />
                          {t}
                        </td>
                        <td style={tdRight}>{yen(yearly.byType[t])}</td>
                        <td style={tdRight}>{pct(yearly.byType[t], yearly.total)}</td>
                        <td style={tdRight}>{yearly.visitsByType[t]}件</td>
                        <td style={tdRight}>{yearly.visitsByType[t] ? yen(yearly.byType[t] / yearly.visitsByType[t]) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {store === "すべて" ? (
                  <table style={tableStyle}>
                    <thead>
                      <tr><th style={thStyle}>店舗</th><th style={thRight}>年間売上</th><th style={thRight}>構成比</th></tr>
                    </thead>
                    <tbody>
                      {yearly.byStore.map(([name, v]) => (
                        <tr key={name}>
                          <td style={tdStyle}>{name}</td>
                          <td style={tdRight}>{yen(v)}</td>
                          <td style={tdRight}>{pct(v, yearly.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
              <div style={noteStyle}>売上 ＝ 通常売上＋回数券消化（前受金は含めません）。データは2026年1月から入っています。</div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <h2 style={titleStyle}>
                  {mode === "share" ? "サービスの構成比" : "月別の売上"}（{store === "すべて" ? "全店舗" : store}）
                </h2>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => setMode("share")} style={{ ...chipStyle, ...(mode === "share" ? chipActiveStyle : {}) }}>構成比（%）</button>
                  <button type="button" onClick={() => setMode("amount")} style={{ ...chipStyle, ...(mode === "amount" ? chipActiveStyle : {}) }}>金額</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
                {CHART_CATEGORIES.map((c) => (
                  <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: CATEGORY_COLORS[c] }} />
                    {c}
                  </span>
                ))}
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img" aria-label="サービス別の月別売上">
                {[0, 0.25, 0.5, 0.75, 1].map((r) => {
                  const y = top + plotH * (1 - r);
                  return (
                    <g key={r}>
                      <line x1={left} x2={W - 10} y1={y} y2={y} stroke="#DCD6CA" />
                      <text x={left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#5B5E66">
                        {mode === "share" ? `${Math.round(r * 100)}%` : man(maxTotal * r)}
                      </text>
                    </g>
                  );
                })}
                {table.map((t, i) => {
                  const x = left + i * band + band * 0.18;
                  const w = band * 0.64;
                  let y = top + plotH;
                  return (
                    <g key={t.month}>
                      {CHART_CATEGORIES.map((c) => {
                        const h = (t.row[c] / scaleOf(t)) * plotH;
                        y -= h;
                        return h > 0 ? (
                          <g key={c}>
                            <rect x={x} y={y} width={w} height={h} fill={CATEGORY_COLORS[c]}>
                              <title>{`${t.month} ${c}：${yen(t.row[c])}（${pct(t.row[c], t.total)}）`}</title>
                            </rect>
                            {mode === "share" && h >= 14 ? (
                              <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">
                                {Math.round((t.row[c] / (t.total || 1)) * 100)}%
                              </text>
                            ) : null}
                          </g>
                        ) : null;
                      })}
                      <text x={x + w / 2} y={(mode === "share" ? top : top + plotH - (t.total / maxTotal) * plotH) - 5} textAnchor="middle" fontSize="10" fill="#15171C">
                        {t.total ? man(t.total) : ""}
                      </text>
                      <text x={x + w / 2} y={H - 18} textAnchor="middle" fontSize="11" fill="#5B5E66">
                        {Number(t.month.slice(5))}月
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div style={noteStyle}>棒にマウスを乗せると金額が出ます。今月（{Number(current.month.slice(5))}月）は途中までの数字です。</div>
            </section>

            <section style={cardStyle}>
              <h2 style={titleStyle}>サービスごとの構成比の推移</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>月</th>
                      {CHART_CATEGORIES.map((c) => (
                        <th key={c} style={thRight}>
                          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[c], marginRight: 4 }} />
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...table].reverse().map((t, i, arr) => {
                      const before = arr[i + 1];
                      return (
                        <tr key={t.month}>
                          <td style={tdStyle}>{Number(t.month.slice(5))}月</td>
                          {CHART_CATEGORIES.map((c) => {
                            const share = t.total ? (t.row[c] / t.total) * 100 : 0;
                            const prevShare = before && before.total ? (before.row[c] / before.total) * 100 : null;
                            const diff = prevShare === null ? null : share - prevShare;
                            return (
                              <td key={c} style={tdRight}>
                                {t.total ? `${share.toFixed(1)}%` : "—"}
                                {diff !== null && t.total && Math.abs(diff) >= 0.1 ? (
                                  <div style={{ fontSize: 11, color: diff > 0 ? "#16a34a" : "#dc2626" }}>
                                    {diff > 0 ? "▲" : "▼"}{Math.abs(diff).toFixed(1)}pt
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={noteStyle}>▲▼は前の月からの構成比の増減（ポイント）です。構成比が上がり続けているサービスが「伸びているサービス」です。</div>
            </section>

            <section style={cardStyle}>
              <h2 style={titleStyle}>大分類の推移（トレーニング ／ リラクゼーション）</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>月</th>
                      <th style={thRight}>トレーニング</th>
                      <th style={thRight}>リラクゼーション</th>
                      <th style={thRight}>合計</th>
                      <th style={thRight}>トレーニングの割合</th>
                      <th style={thRight}>来店数</th>
                      <th style={thRight}>平均単価</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...table].reverse().map((t) => (
                      <tr key={t.month}>
                        <td style={tdStyle}>{t.month.replace("-", "年")}月</td>
                        <td style={tdRight}>{yen(t.training)}</td>
                        <td style={tdRight}>{yen(t.relax)}</td>
                        <td style={{ ...tdRight, fontWeight: 700 }}>{yen(t.total)}</td>
                        <td style={tdRight}>{pct(t.training, t.total)}</td>
                        <td style={tdRight}>{t.visitCount}件</td>
                        <td style={{ ...tdRight, fontWeight: 700 }}>{t.visitCount ? yen(t.unit) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {lastFull && beforeFull ? (
              <section style={cardStyle}>
                <h2 style={titleStyle}>
                  伸びているサービス（{Number(lastFull.month.slice(5))}月 と {Number(beforeFull.month.slice(5))}月 の比較）
                </h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>サービス</th>
                        <th style={thRight}>{Number(beforeFull.month.slice(5))}月</th>
                        <th style={thRight}>{Number(lastFull.month.slice(5))}月</th>
                        <th style={thRight}>前月比</th>
                        <th style={thRight}>割合（{Number(lastFull.month.slice(5))}月）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CHART_CATEGORIES.map((c) => {
                        const now = lastFull.row[c];
                        const before = beforeFull.row[c];
                        const up = now >= before;
                        return (
                          <tr key={c}>
                            <td style={tdStyle}>
                              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: CATEGORY_COLORS[c], marginRight: 6 }} />
                              {c}
                            </td>
                            <td style={tdRight}>{yen(before)}</td>
                            <td style={tdRight}>{yen(now)}</td>
                            <td style={{ ...tdRight, color: up ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{growth(now, before)}</td>
                            <td style={tdRight}>{pct(now, lastFull.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <section style={cardStyle}>
              <h2 style={titleStyle}>施術の時間別（{Number(minutesBreakdown.month.slice(5))}月）</h2>
              {minutesBreakdown.rows.length === 0 ? (
                <div style={noteStyle}>データがありません。</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>サービス</th>
                        <th style={thStyle}>時間</th>
                        <th style={thRight}>件数</th>
                        <th style={thRight}>売上</th>
                        <th style={thRight}>1件あたり</th>
                      </tr>
                    </thead>
                    <tbody>
                      {minutesBreakdown.rows.map((r) => (
                        <tr key={`${r.type}-${r.minutes}`}>
                          <td style={tdStyle}>
                            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[r.type], marginRight: 6 }} />
                            {r.type}
                          </td>
                          <td style={tdStyle}>{r.minutes}</td>
                          <td style={tdRight}>{r.count}件</td>
                          <td style={tdRight}>{yen(r.amount)}</td>
                          <td style={tdRight}>{yen(r.amount / r.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={noteStyle}>時間は売上のメモ（メニュー名）にある「○分」から読み取っています。「時間不明」は、メモに時間が書かれていない売上です。</div>
            </section>

            <div style={noteStyle}>
              売上 ＝ 通常売上＋回数券消化（前受金は含めません）。サービスは売上登録の「サービス」で分けます。
              以前「ストレッチ」で登録された売上は、店舗（天満橋Ts＝ヘッドスパ、西梅田＝オイルマッサージ）や、メモ・お客様名の「ヘッド」「アロマ」「足ツボ」から推定しています。
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "24px 16px 80px", background: "#F7F5F0", color: "#15171C" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(21,23,28,0.06)", display: "grid", gap: 10 };
const titleStyle: CSSProperties = { margin: 0, fontSize: 17 };
const noteStyle: CSSProperties = { fontSize: 12, color: "#5B5E66", lineHeight: 1.7 };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#15171C", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const chipStyle: CSSProperties = { padding: "6px 12px", borderRadius: 999, border: "1px solid #CFC8BA", background: "#fff", fontSize: 13, cursor: "pointer" };
const chipActiveStyle: CSSProperties = { background: "#15171C", color: "#fff", borderColor: "#15171C" };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
const thStyle: CSSProperties = { textAlign: "left", padding: "8px 6px", borderBottom: "2px solid #DCD6CA", whiteSpace: "nowrap" };
const thRight: CSSProperties = { ...thStyle, textAlign: "right" };
const tdStyle: CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #DCD6CA", whiteSpace: "nowrap" };
const tdRight: CSSProperties = { ...tdStyle, textAlign: "right" };
const statStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#FBFAF7", display: "grid", gap: 4 };
const statLabel: CSSProperties = { fontSize: 12, color: "#5B5E66", fontWeight: 700 };
const statValue: CSSProperties = { fontSize: 22, fontWeight: 800 };
