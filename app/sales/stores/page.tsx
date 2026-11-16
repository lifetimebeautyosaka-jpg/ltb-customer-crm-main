"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";

// 店舗別の月次集計
// 売上 ＝ 通常売上 ＋ 回数券消化（施術した分）。前受金（回数券の販売）は参考として別の列に出す
// 新規 ＝ その月の予約のうち、来店区分が「新規」（または初回フラグあり）でキャンセル以外のもの

type SaleRow = { sale_type: string | null; amount: number | null; store_name: string | null };
type ReservationRow = {
  store_name: string | null;
  visit_type: string | null;
  is_first_visit: boolean | null;
  reservation_status: string | null;
};

const STORES = ["江戸堀", "箕面", "福島", "福島P", "天満橋", "天満橋Ts", "中崎町", "江坂", "西梅田"];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start: `${month}-01`, end: next };
}

function yen(v: number) {
  return `${Math.round(v).toLocaleString("ja-JP")}円`;
}

function storeOf(name: string | null) {
  return (name || "").trim() || "未設定";
}

export default function StoreSummaryPage() {
  const [month, setMonth] = useState(currentMonth());
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
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
      const [salesRes, reservationRes] = await Promise.all([
        fetchAllRows<SaleRow>((from, to) =>
          supabase
            .from("sales")
            .select("sale_type, amount, store_name")
            .gte("sale_date", start)
            .lt("sale_date", end)
            .order("id", { ascending: true })
            .range(from, to)
        ),
        fetchAllRows<ReservationRow>((from, to) =>
          supabase
            .from("reservations")
            .select("store_name, visit_type, is_first_visit, reservation_status")
            .gte("date", start)
            .lt("date", end)
            .order("id", { ascending: true })
            .range(from, to)
        ),
      ]);
      if (!alive) return;
      const err = salesRes.error || reservationRes.error;
      if (err) setError(err.message || "読み込みに失敗しました。");
      setSales(salesRes.data);
      setReservations(reservationRes.data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [month]);

  const rows = useMemo(() => {
    const map = new Map<string, { net: number; advance: number; count: number; newCount: number }>();
    const get = (store: string) => {
      const row = map.get(store) || { net: 0, advance: 0, count: 0, newCount: 0 };
      map.set(store, row);
      return row;
    };
    STORES.forEach((s) => get(s));

    for (const s of sales) {
      const row = get(storeOf(s.store_name));
      const amount = Number(s.amount || 0);
      if ((s.sale_type || "").trim() === "前受金") row.advance += amount;
      else {
        row.net += amount;
        row.count += 1;
      }
    }

    for (const r of reservations) {
      const status = (r.reservation_status || "").trim();
      if (status.includes("キャンセル") || status.includes("無断")) continue;
      const isNew = (r.visit_type || "").trim() === "新規" || (!r.visit_type && r.is_first_visit === true);
      if (isNew) get(storeOf(r.store_name)).newCount += 1;
    }

    return Array.from(map.entries())
      .filter(([store, v]) => STORES.includes(store) || v.net || v.advance || v.newCount)
      .sort((a, b) => b[1].net - a[1].net);
  }, [sales, reservations]);

  const total = rows.reduce(
    (t, [, v]) => ({ net: t.net + v.net, advance: t.advance + v.advance, count: t.count + v.count, newCount: t.newCount + v.newCount }),
    { net: 0, advance: 0, count: 0, newCount: 0 }
  );

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>STORE SUMMARY</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>店舗別の売上・新規</h1>
          </div>
          <Link href="/sales" style={linkStyle}>売上管理へ</Link>
        </div>

        <section style={cardStyle}>
          <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569", width: 180 }}>
            <span>月</span>
            <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} style={inputStyle} />
          </label>
        </section>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {loading ? <div style={cardStyle}>読み込み中...</div> : (
          <section style={cardStyle}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>店舗</th>
                    <th style={thRight}>売上（施術分）</th>
                    <th style={thRight}>売上の割合</th>
                    <th style={thRight}>件数</th>
                    <th style={thRight}>新規</th>
                    <th style={thRight}>前受金（参考）</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([store, v]) => {
                    const share = total.net > 0 ? (v.net / total.net) * 100 : 0;
                    return (
                      <tr key={store}>
                        <td style={tdStyle}>{store}</td>
                        <td style={tdRight}>{yen(v.net)}</td>
                        <td style={tdRight}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                            <div style={{ width: 80, height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ width: `${share}%`, height: "100%", background: "#2563eb" }} />
                            </div>
                            <span style={{ minWidth: 48 }}>{share.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={tdRight}>{v.count}件</td>
                        <td style={tdRight}>{v.newCount}人</td>
                        <td style={{ ...tdRight, color: "#64748b" }}>{yen(v.advance)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: "#f8fafc" }}>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>全店舗の合計</td>
                    <td style={{ ...tdRight, fontWeight: 800 }}>{yen(total.net)}</td>
                    <td style={{ ...tdRight, fontWeight: 800 }}>100%</td>
                    <td style={{ ...tdRight, fontWeight: 800 }}>{total.count}件</td>
                    <td style={{ ...tdRight, fontWeight: 800 }}>{total.newCount}人</td>
                    <td style={{ ...tdRight, fontWeight: 800, color: "#64748b" }}>{yen(total.advance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={noteStyle}>
              売上（施術分）＝ 通常売上 ＋ 回数券消化。前受金（回数券の販売）は二重計上を避けるため売上に入れず、参考として右端に出しています。
              新規は、その月の予約のうち来店区分が「新規」のもの（キャンセル・無断キャンセルを除く）です。
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "24px 16px 80px", background: "#f1f5f9", color: "#0f172a" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,0.06)", display: "grid", gap: 10 };
const inputStyle: CSSProperties = { minHeight: 40, padding: "0 10px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 };
const noteStyle: CSSProperties = { fontSize: 12, color: "#64748b", lineHeight: 1.7 };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const thStyle: CSSProperties = { textAlign: "left", padding: "8px 6px", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" };
const thRight: CSSProperties = { ...thStyle, textAlign: "right" };
const tdStyle: CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
const tdRight: CSSProperties = { ...tdStyle, textAlign: "right" };
