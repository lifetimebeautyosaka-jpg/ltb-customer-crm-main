"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";

// LTVランキング
// LTV ＝ 純売上（通常売上＋回数券消化）。前受金は消化と二重になるので除く。
// 支払額 ＝ 通常売上＋前受金（実際にお金をいただいた額）。参考表示。

type SaleRow = {
  customer_id: number | string | null;
  customer_name: string | null;
  amount: number | null;
  sale_type: string | null;
  sale_date: string | null;
  store_name: string | null;
  staff_name: string | null;
};

type CustomerRow = { id: number | string; name: string | null };

type Ranked = {
  id: string;
  name: string;
  net: number;
  paid: number;
  visits: number;
  first: string;
  last: string;
  store: string;
  staff: string;
};

const DAY = 86400000;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const yen = (v: number) => `${Math.round(v).toLocaleString("ja-JP")}円`;
const isAdvance = (t: string | null) => String(t || "").includes("前受");
const isUsage = (t: string | null) => String(t || "").includes("消化");

function topKey(map: Map<string, number>) {
  let best = "";
  let max = -1;
  map.forEach((v, k) => {
    if (k && v > max) {
      best = k;
      max = v;
    }
  });
  return best;
}

export default function LtvRankingPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"all" | "year">("all");
  const [store, setStore] = useState("");
  const [staff, setStaff] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showAll, setShowAll] = useState(false);
  const today = ymd(new Date());

  useEffect(() => {
    if (localStorage.getItem("gymup_logged_in") !== "true") {
      window.location.href = "/login";
      return;
    }
    void (async () => {
      try {
        const [salesRes, custRes] = await Promise.all([
          fetchAllRows<SaleRow>((from, to) =>
            supabase
              .from("sales")
              .select("customer_id, customer_name, amount, sale_type, sale_date, store_name, staff_name")
              .order("id", { ascending: true })
              .range(from, to)
          ),
          fetchAllRows<CustomerRow>((from, to) =>
            supabase.from("customers").select("id, name").order("id", { ascending: true }).range(from, to)
          ),
        ]);
        if (salesRes.error) throw salesRes.error;
        if (custRes.error) throw custRes.error;
        setSales(salesRes.data);
        setCustomers(custRes.data);
      } catch (e: any) {
        setError(`読み込みに失敗しました：${e?.message || e}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stores = useMemo(
    () => Array.from(new Set(sales.map((s) => String(s.store_name || "").trim()).filter(Boolean))).sort(),
    [sales]
  );

  const ranked = useMemo<Ranked[]>(() => {
    const nameById = new Map(customers.map((c) => [String(c.id), String(c.name || "").trim()]));
    const yearStart = `${today.slice(0, 4)}-01-01`;
    const acc = new Map<
      string,
      { name: string; net: number; paid: number; dates: Set<string>; first: string; last: string; stores: Map<string, number>; staffs: Map<string, number> }
    >();

    for (const s of sales) {
      const date = String(s.sale_date || "").slice(0, 10);
      if (period === "year" && date < yearStart) continue;
      const id = s.customer_id ? String(s.customer_id) : `name:${String(s.customer_name || "").trim()}`;
      const cur =
        acc.get(id) ||
        {
          name: nameById.get(id) || String(s.customer_name || "").trim() || "名前未設定",
          net: 0,
          paid: 0,
          dates: new Set<string>(),
          first: "",
          last: "",
          stores: new Map<string, number>(),
          staffs: new Map<string, number>(),
        };
      const amount = Number(s.amount || 0);
      if (!isAdvance(s.sale_type)) {
        cur.net += amount;
        if (date) {
          cur.dates.add(date);
          if (!cur.first || date < cur.first) cur.first = date;
          if (!cur.last || date > cur.last) cur.last = date;
        }
        const st = String(s.store_name || "").trim();
        const sf = String(s.staff_name || "").trim();
        cur.stores.set(st, (cur.stores.get(st) || 0) + 1);
        cur.staffs.set(sf, (cur.staffs.get(sf) || 0) + 1);
      }
      if (!isUsage(s.sale_type)) cur.paid += amount;
      acc.set(id, cur);
    }

    return Array.from(acc.entries())
      .map(([id, v]) => ({
        id,
        name: v.name,
        net: v.net,
        paid: v.paid,
        visits: v.dates.size,
        first: v.first,
        last: v.last,
        store: topKey(v.stores),
        staff: topKey(v.staffs),
      }))
      .filter((r) => r.net > 0)
      .sort((a, b) => b.net - a.net);
  }, [sales, customers, period, today]);

  const staffs = useMemo(() => Array.from(new Set(ranked.map((r) => r.staff).filter(Boolean))).sort(), [ranked]);
  const filtered = ranked.filter(
    (r) =>
      (!store || r.store === store) &&
      (!staff || r.staff === staff) &&
      (!keyword.trim() || r.name.includes(keyword.trim()))
  );
  const shown = showAll ? filtered : filtered.slice(0, 50);
  const total = filtered.reduce((s, r) => s + r.net, 0);
  const avg = filtered.length ? total / filtered.length : 0;
  const top10Share = total ? (filtered.slice(0, 10).reduce((s, r) => s + r.net, 0) / total) * 100 : 0;
  const rankOf = new Map(ranked.map((r, i) => [r.id, i + 1]));

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>LTV RANKING</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>LTVランキング</h1>
          </div>
          <Link href="/dashboard" style={linkStyle}>ダッシュボードへ</Link>
        </div>

        <section style={cardStyle}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            <label style={labelStyle}>
              期間
              <select value={period} onChange={(e) => setPeriod(e.target.value as "all" | "year")} style={inputStyle}>
                <option value="all">全期間</option>
                <option value="year">今年</option>
              </select>
            </label>
            <label style={labelStyle}>
              店舗（よく来る店舗）
              <select value={store} onChange={(e) => setStore(e.target.value)} style={inputStyle}>
                <option value="">すべて</option>
                {stores.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              メイン担当
              <select value={staff} onChange={(e) => setStaff(e.target.value)} style={inputStyle}>
                <option value="">すべて</option>
                {staffs.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              名前で検索
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="例 森本" style={inputStyle} />
            </label>
          </div>
          <div style={{ ...noteStyle, marginTop: 10 }}>
            LTV ＝ 純売上（通常売上＋回数券消化）。前受金は消化と二重になるので含めません。
            「支払額」は実際にいただいた金額（通常売上＋回数券の購入代）です。メイン担当は一番多く担当したスタッフです。最終来店から60日以上空いている方は「離脱注意」と表示します。
          </div>
        </section>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {loading ? (
          <div style={cardStyle}>読み込み中...</div>
        ) : (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <Stat label="対象のお客様" value={`${filtered.length}人`} />
              <Stat label="LTVの合計" value={yen(total)} />
              <Stat label="1人あたりLTV" value={yen(avg)} />
              <Stat label="上位10人の割合" value={`${top10Share.toFixed(1)}%`} />
            </section>

            <section style={cardStyle}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["順位", "お客様", "LTV", "メイン担当", "支払額", "来店", "平均単価", "店舗", "初回", "最終来店"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => {
                      const gap = r.last ? Math.floor((Date.parse(today) - Date.parse(r.last)) / DAY) : 0;
                      const away = r.last && gap >= 60;
                      return (
                        <tr key={r.id}>
                          <td style={{ ...tdStyle, fontWeight: 800 }}>{rankOf.get(r.id)}</td>
                          <td style={tdStyle}>
                            {r.id.startsWith("name:") ? r.name : <Link href={`/customer/${r.id}`}>{r.name}</Link>}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 800 }}>{yen(r.net)}</td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{r.staff || "—"}</td>
                          <td style={tdStyle}>{yen(r.paid)}</td>
                          <td style={tdStyle}>{r.visits}回</td>
                          <td style={tdStyle}>{r.visits ? yen(r.net / r.visits) : "—"}</td>
                          <td style={tdStyle}>{r.store || "—"}</td>
                          <td style={tdStyle}>{r.first || "—"}</td>
                          <td style={tdStyle}>
                            {r.last || "—"}
                            {away ? <span style={warnStyle}>離脱注意 {gap}日</span> : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length > 50 ? (
                <button type="button" onClick={() => setShowAll((v) => !v)} style={{ ...buttonStyle, marginTop: 12 }}>
                  {showAll ? "上位50人だけ表示" : `すべて表示（${filtered.length}人）`}
                </button>
              ) : null}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "24px 16px 80px", background: "#f1f5f9", color: "#0f172a" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" };
const noteStyle: CSSProperties = { fontSize: 12, color: "#64748b", lineHeight: 1.6 };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const labelStyle: CSSProperties = { display: "grid", gap: 4, fontSize: 12, fontWeight: 700, color: "#475569" };
const inputStyle: CSSProperties = { padding: "8px 10px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 };
const buttonStyle: CSSProperties = { padding: "9px 16px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const warnStyle: CSSProperties = { marginLeft: 6, padding: "2px 6px", borderRadius: 6, background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700 };
const thStyle: CSSProperties = { textAlign: "left", padding: "8px 6px", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" };
const tdStyle: CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
