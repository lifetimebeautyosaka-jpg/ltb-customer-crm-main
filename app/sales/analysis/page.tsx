"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";
import {
  CATEGORY_COLORS,
  CHART_CATEGORIES,
  classifyService,
  toChartCategory,
  type ChartCategory,
} from "@/lib/serviceCategory";

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
};

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
          .select("sale_date, sale_type, amount, store_name, menu_type, customer_name, memo")
          .gte("sale_date", `${months[0]}-01`)
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
      row[toChartCategory(type)] += Number(s.amount || 0);
    }
    return months.map((m) => {
      const row = data.get(m)!;
      const total = CHART_CATEGORIES.reduce((sum, c) => sum + row[c], 0);
      const training = row["トレーニング"];
      return { month: m, row, total, training, relax: total - training };
    });
  }, [sales, store, months]);

  const maxTotal = Math.max(1, ...table.map((t) => t.total));
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
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>SERVICE ANALYSIS</div>
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
              <h2 style={titleStyle}>月別の売上（{store === "すべて" ? "全店舗" : store}）</h2>
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
                      <line x1={left} x2={W - 10} y1={y} y2={y} stroke="#e2e8f0" />
                      <text x={left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{man(maxTotal * r)}</text>
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
                        const h = (t.row[c] / maxTotal) * plotH;
                        y -= h;
                        return h > 0 ? (
                          <rect key={c} x={x} y={y} width={w} height={h} fill={CATEGORY_COLORS[c]}>
                            <title>{`${t.month} ${c}：${yen(t.row[c])}（${pct(t.row[c], t.total)}）`}</title>
                          </rect>
                        ) : null;
                      })}
                      <text x={x + w / 2} y={top + plotH - (t.total / maxTotal) * plotH - 5} textAnchor="middle" fontSize="10" fill="#0f172a">
                        {t.total ? man(t.total) : ""}
                      </text>
                      <text x={x + w / 2} y={H - 18} textAnchor="middle" fontSize="11" fill="#475569">
                        {Number(t.month.slice(5))}月
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div style={noteStyle}>棒にマウスを乗せると金額が出ます。今月（{Number(current.month.slice(5))}月）は途中までの数字です。</div>
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

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "24px 16px 80px", background: "#f1f5f9", color: "#0f172a" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,0.06)", display: "grid", gap: 10 };
const titleStyle: CSSProperties = { margin: 0, fontSize: 17 };
const noteStyle: CSSProperties = { fontSize: 12, color: "#64748b", lineHeight: 1.7 };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const chipStyle: CSSProperties = { padding: "6px 12px", borderRadius: 999, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, cursor: "pointer" };
const chipActiveStyle: CSSProperties = { background: "#0f172a", color: "#fff", borderColor: "#0f172a" };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
const thStyle: CSSProperties = { textAlign: "left", padding: "8px 6px", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" };
const thRight: CSSProperties = { ...thStyle, textAlign: "right" };
const tdStyle: CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
const tdRight: CSSProperties = { ...tdStyle, textAlign: "right" };
