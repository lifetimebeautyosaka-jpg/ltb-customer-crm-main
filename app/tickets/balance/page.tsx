"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";

// 前受金の残高（まだ使われていない回数券の金額）と、期限切れの回数券の一覧。
// 回数券1枚の代金は、購入日の前受金の売上から探し、なければ回数券名の「○○円」から読む。
// 残高 ＝ 代金 × 残り回数 ÷ 総回数

type TicketRow = {
  id: number | string;
  customer_id: number | string | null;
  customer_name: string | null;
  ticket_name: string | null;
  total_count: number | null;
  remaining_count: number | null;
  purchase_date: string | null;
  expiry_date: string | null;
};

type AdvanceSale = { customer_id: number | string | null; sale_date: string | null; amount: number | null };

type Computed = TicketRow & { total: number; remaining: number; price: number | null; balance: number | null; expired: boolean };

function trimmed(v: unknown) {
  return v === null || v === undefined ? "" : String(v).trim();
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yen(v: number) {
  return `${Math.round(v).toLocaleString("ja-JP")}円`;
}

function priceFromName(name: string) {
  const m = name.replace(/,/g, "").match(/(\d{4,7})\s*円/);
  return m ? Number(m[1]) : null;
}

export default function TicketBalancePage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [advances, setAdvances] = useState<AdvanceSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = todayString();

  useEffect(() => {
    if (localStorage.getItem("gymup_logged_in") !== "true") {
      window.location.href = "/login";
      return;
    }
    void (async () => {
      try {
        const [ticketRes, advanceRes] = await Promise.all([
          fetchAllRows<TicketRow>((from, to) =>
            supabase
              .from("customer_tickets")
              .select("id, customer_id, customer_name, ticket_name, total_count, remaining_count, purchase_date, expiry_date")
              .gt("remaining_count", 0)
              .order("id", { ascending: true })
              .range(from, to)
          ),
          fetchAllRows<AdvanceSale>((from, to) =>
            supabase
              .from("sales")
              .select("customer_id, sale_date, amount")
              .eq("sale_type", "前受金")
              .order("id", { ascending: true })
              .range(from, to)
          ),
        ]);
        if (ticketRes.error) throw ticketRes.error;
        if (advanceRes.error) throw advanceRes.error;
        setTickets(ticketRes.data);
        setAdvances(advanceRes.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = useMemo<Computed[]>(() => {
    const advanceMap = new Map<string, number[]>();
    for (const a of advances) {
      const k = `${trimmed(a.customer_id)}-${trimmed(a.sale_date)}`;
      advanceMap.set(k, [...(advanceMap.get(k) || []), Number(a.amount || 0)]);
    }
    return tickets.map((t) => {
      const total = Number(t.total_count || 0);
      const remaining = Number(t.remaining_count || 0);
      const fromSale = advanceMap.get(`${trimmed(t.customer_id)}-${trimmed(t.purchase_date)}`);
      const price = fromSale && fromSale.length > 0 ? Math.max(...fromSale) : priceFromName(trimmed(t.ticket_name));
      const balance = price && total > 0 ? (price * remaining) / total : null;
      const expired = !!t.expiry_date && t.expiry_date.slice(0, 10) < today;
      return { ...t, total, remaining, price, balance, expired };
    });
  }, [tickets, advances, today]);

  const active = rows.filter((r) => !r.expired).sort((a, b) => (b.balance || 0) - (a.balance || 0));
  const expired = rows.filter((r) => r.expired).sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));
  const sum = (list: Computed[]) => list.reduce((s, r) => s + (r.balance || 0), 0);
  const count = (list: Computed[]) => list.reduce((s, r) => s + r.remaining, 0);
  const unknown = rows.filter((r) => r.balance === null).length;

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>ADVANCE BALANCE</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>前受金の残高・期限切れの回数券</h1>
          </div>
          <Link href="/dashboard" style={linkStyle}>ダッシュボードへ</Link>
        </div>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {loading ? <div style={cardStyle}>読み込み中...</div> : (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <Stat label="前受金の残高（有効な回数券）" value={yen(sum(active))} sub={`${active.length}枚・残り${count(active)}回`} />
              <Stat label="期限切れで残っている分" value={yen(sum(expired))} sub={`${expired.length}枚・残り${count(expired)}回`} />
              <Stat label="金額が分からない回数券" value={`${unknown}枚`} sub="代金の売上も「○○円」の記載もないもの" />
            </section>

            <section style={cardStyle}>
              <h2 style={titleStyle}>期限切れの回数券（残りあり）</h2>
              <div style={noteStyle}>使われないまま期限が切れた分を売上に計上するかどうかは、税理士さんに確認してください。</div>
              <TicketTable rows={expired} />
            </section>

            <section style={cardStyle}>
              <h2 style={titleStyle}>有効な回数券（残りあり）</h2>
              <TicketTable rows={active} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, margin: "6px 0" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{sub}</div>
    </div>
  );
}

function TicketTable({ rows }: { rows: Computed[] }) {
  if (rows.length === 0) return <div style={{ padding: 12, color: "#64748b", fontSize: 14 }}>該当なし</div>;
  return (
    <div style={{ overflowX: "auto", marginTop: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["お客様", "回数券", "購入日", "期限", "残り", "代金", "残高"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={tdStyle}>{r.customer_id ? <Link href={`/customer/${r.customer_id}`}>{trimmed(r.customer_name) || "名前未設定"}</Link> : trimmed(r.customer_name)}</td>
              <td style={tdStyle}>{trimmed(r.ticket_name)}</td>
              <td style={tdStyle}>{trimmed(r.purchase_date) || "—"}</td>
              <td style={tdStyle}>{trimmed(r.expiry_date).slice(0, 10) || "—"}</td>
              <td style={tdStyle}>{r.remaining}/{r.total}回</td>
              <td style={tdStyle}>{r.price ? yen(r.price) : "不明"}</td>
              <td style={{ ...tdStyle, fontWeight: 700 }}>{r.balance !== null ? yen(r.balance) : "不明"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "24px 16px 80px", background: "#f1f5f9", color: "#0f172a" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" };
const titleStyle: CSSProperties = { margin: "0 0 6px", fontSize: 17 };
const noteStyle: CSSProperties = { fontSize: 12, color: "#64748b" };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const thStyle: CSSProperties = { textAlign: "left", padding: "8px 6px", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" };
const tdStyle: CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #e2e8f0" };
