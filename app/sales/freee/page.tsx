"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";

// freee会計への書き出し（回数券の代金は「前受金」として扱う）
// - 通常売上 → 収入・売上高・課税売上10%・決済口座「現金」
// - 前受金   → 収入・前受金・対象外・決済口座「現金」
// - 回数券消化 → お金が動かないので取引CSVには入れない。前受金→売上高の振替伝票（月1件）の金額を表示する
// 税区分や計上のタイミングは税理士に確認すること。

type SaleRow = {
  sale_date: string | null;
  sale_type: string | null;
  amount: number | null;
  store_name: string | null;
};

const HEADER = [
  "収支区分", "管理番号", "発生日", "決済期日", "取引先コード", "取引先", "勘定科目", "税区分", "金額",
  "税計算区分", "税額", "備考", "品目", "部門", "メモタグ（複数指定可、カンマ区切り）",
  "セグメント1", "セグメント2", "セグメント3", "決済日", "決済口座", "決済金額",
];

const ACCOUNT = "現金"; // freeeの決済口座名

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start: `${month}-01`, end: next };
}

function lastDay(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${y}/${m}/${new Date(y, m, 0).getDate()}`;
}

function yen(v: number) {
  return `${Math.round(v).toLocaleString("ja-JP")}円`;
}

function csvCell(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function FreeeExportPage() {
  const [month, setMonth] = useState(currentMonth());
  const [byStore, setByStore] = useState(false);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("gymup_logged_in") !== "true") {
      window.location.href = "/login";
      return;
    }
    let alive = true;
    void (async () => {
      setLoading(true);
      setError("");
      const { start, end } = monthRange(month);
      const res = await fetchAllRows<SaleRow>((from, to) =>
        supabase
          .from("sales")
          .select("sale_date, sale_type, amount, store_name")
          .gte("sale_date", start)
          .lt("sale_date", end)
          .order("id", { ascending: true })
          .range(from, to)
      );
      if (!alive) return;
      if (res.error) setError(res.error.message);
      setSales(res.data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [month]);

  // 店舗（または全体）ごとの合計
  const groups = useMemo(() => {
    const map = new Map<string, { normal: number; advance: number; consume: number }>();
    for (const s of sales) {
      const key = byStore ? (s.store_name || "未設定").trim() || "未設定" : "全店舗";
      const g = map.get(key) || { normal: 0, advance: 0, consume: 0 };
      const amount = Number(s.amount || 0);
      const type = (s.sale_type || "").trim();
      if (type === "前受金") g.advance += amount;
      else if (type === "回数券消化") g.consume += amount;
      else g.normal += amount;
      map.set(key, g);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "ja"));
  }, [sales, byStore]);

  const totals = groups.reduce(
    (t, [, g]) => ({ normal: t.normal + g.normal, advance: t.advance + g.advance, consume: t.consume + g.consume }),
    { normal: 0, advance: 0, consume: 0 }
  );

  function download() {
    const date = lastDay(month);
    const mm = Number(month.slice(5));
    const lines: string[][] = [];
    for (const [store, g] of groups) {
      const dept = byStore ? store : "";
      const memo = byStore ? `${mm}月 ${store}` : `${mm}月`;
      if (g.normal) lines.push(["収入", "", date, "", "", "", "売上高", "課税売上10%", String(g.normal), "内税", "", `${memo} 通常売上（ジムアップCRM）`, "", dept, "", "", "", "", date, ACCOUNT, String(g.normal)]);
      if (g.advance) lines.push(["収入", "", date, "", "", "", "前受金", "対象外", String(g.advance), "", "", `${memo} 回数券の販売（ジムアップCRM）`, "", dept, "", "", "", "", date, ACCOUNT, String(g.advance)]);
    }
    const csv = [HEADER, ...lines].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freee取引_${month}${byStore ? "_店舗別" : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>FREEE EXPORT</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>freee用に書き出す</h1>
          </div>
          <Link href="/sales" style={linkStyle}>売上管理へ</Link>
        </div>

        <section style={cardStyle}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "end" }}>
            <label style={fieldStyle}>
              <span>月</span>
              <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, fontWeight: 700 }}>
              <input type="checkbox" checked={byStore} onChange={(e) => setByStore(e.target.checked)} />
              店舗ごとに分ける（freeeの部門に店舗名を入れる）
            </label>
          </div>
        </section>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {loading ? <div style={cardStyle}>読み込み中...</div> : (
          <>
            <section style={cardStyle}>
              <h2 style={titleStyle}>① 取引CSV（freee →「取引」→ インポート）</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>{byStore ? "店舗（部門）" : ""}</th>
                    <th style={thStyle}>売上高（通常売上）</th>
                    <th style={thStyle}>前受金（回数券の販売）</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(([store, g]) => (
                    <tr key={store}>
                      <td style={tdStyle}>{store}</td>
                      <td style={tdStyle}>{yen(g.normal)}</td>
                      <td style={tdStyle}>{yen(g.advance)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>合計</td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>{yen(totals.normal)}</td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>{yen(totals.advance)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={noteStyle}>発生日・決済日は月末（{lastDay(month)}）、決済口座は「{ACCOUNT}」、売上高は課税売上10%（内税）、前受金は対象外で出します。</div>
              <button type="button" onClick={download} disabled={groups.length === 0} style={{ ...buttonStyle, opacity: groups.length === 0 ? 0.5 : 1 }}>
                取引CSVをダウンロード
              </button>
            </section>

            <section style={cardStyle}>
              <h2 style={titleStyle}>② 振替伝票（freeeで手入力・月1件）</h2>
              <div style={{ fontSize: 15, lineHeight: 1.9 }}>
                日付：{lastDay(month)}<br />
                借方：<strong>前受金</strong>（対象外） {yen(totals.consume)}<br />
                貸方：<strong>売上高</strong>（課税売上10%） {yen(totals.consume)}<br />
                摘要：{Number(month.slice(5))}月 回数券消化（ジムアップCRM）
              </div>
              <div style={noteStyle}>来店して回数券を使った分を、前受金から売上に移します。お金は動かないので、取引CSVには入れていません。</div>
            </section>

            <div style={{ ...noteStyle, padding: "0 4px" }}>
              ※回数券を前受金にしたときの消費税の扱い（販売時か施術時か）と、切り替える月は、必ず税理士さんに確認してください。
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
const fieldStyle: CSSProperties = { display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569" };
const inputStyle: CSSProperties = { minHeight: 40, padding: "0 10px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 };
const noteStyle: CSSProperties = { fontSize: 12, color: "#64748b", lineHeight: 1.7 };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const thStyle: CSSProperties = { textAlign: "left", padding: "8px 6px", borderBottom: "2px solid #e2e8f0" };
const tdStyle: CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #e2e8f0" };
const buttonStyle: CSSProperties = { minHeight: 46, borderRadius: 12, border: "none", background: "#0f172a", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" };