"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

// リピート率：期間内の新規のお客様のうち、2回以上来店した人の割合。
// 集計はDBの関数 get_repeat_rates(p_from, p_to) が行う。

type RepeatRow = {
  group_type: string;
  group_name: string | null;
  new_customers: number | string | null;
  repeat_customers: number | string | null;
  repeat_rate: number | string | null;
  avg_visits: number | string | null;
};

const GROUP_ORDER = ["スタッフ", "店舗", "流入元"] as const;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultRange() {
  const today = new Date();
  const to = new Date(today);
  to.setDate(to.getDate() - 30);
  return { from: `${today.getFullYear()}-01-01`, to: ymd(to) };
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function RepeatRatePage() {
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [rows, setRows] = useState<RepeatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("get_repeat_rates", { p_from: f, p_to: t });
      if (rpcError) throw rpcError;
      setRows((data as RepeatRow[]) || []);
    } catch (e: any) {
      setError(`読み込みに失敗しました：${e?.message || e}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("gymup_logged_in") !== "true") {
      window.location.href = "/login";
      return;
    }
    void load(initial.from, initial.to);
  }, [initial, load]);

  const total = rows.find((r) => r.group_type === "全体");
  const groups = GROUP_ORDER.map((type) => ({
    type,
    rows: rows
      .filter((r) => r.group_type === type)
      .sort((a, b) => num(b.new_customers) - num(a.new_customers)),
  }));

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#5B5E66", fontWeight: 700 }}>REPEAT RATE</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>リピート率</h1>
          </div>
          <Link href="/dashboard" style={linkStyle}>ダッシュボードへ</Link>
        </div>

        <section style={cardStyle}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            <label style={labelStyle}>
              初回来店日（から）
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              （まで）
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
            </label>
            <button type="button" onClick={() => void load(from, to)} style={buttonStyle} disabled={!from || !to || from > to}>
              集計する
            </button>
            <button
              type="button"
              onClick={() => {
                setFrom(initial.from);
                setTo(initial.to);
                void load(initial.from, initial.to);
              }}
              style={{ ...buttonStyle, background: "#DCD6CA", color: "#15171C" }}
            >
              初期値に戻す
            </button>
          </div>
          <div style={{ ...noteStyle, marginTop: 10 }}>
            ※ 最近来た新規のお客様は、まだ2回目の来店がないため、リピート率が低く出ます。
            そのため初期値は「今年1月1日〜30日前」にしています。
          </div>
        </section>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {loading ? (
          <div style={cardStyle}>読み込み中...</div>
        ) : (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <Stat label="リピート率（全体）" value={total ? `${num(total.repeat_rate).toFixed(1)}%` : "—"} />
              <Stat label="新規のお客様" value={total ? `${num(total.new_customers)}人` : "—"} />
              <Stat label="2回以上来店" value={total ? `${num(total.repeat_customers)}人` : "—"} />
              <Stat label="平均来店回数" value={total ? `${num(total.avg_visits).toFixed(1)}回` : "—"} />
            </section>

            {groups.map((g) => (
              <section key={g.type} style={cardStyle}>
                <h2 style={titleStyle}>{g.type}別</h2>
                <RateTable rows={g.rows} />
              </section>
            ))}
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, color: "#5B5E66", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function RateTable({ rows }: { rows: RepeatRow[] }) {
  if (rows.length === 0) return <div style={{ padding: 12, color: "#5B5E66", fontSize: 14 }}>該当なし</div>;
  return (
    <div style={{ overflowX: "auto", marginTop: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {["名前", "新規", "リピート", "リピート率", "平均来店回数"].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const rate = num(r.repeat_rate);
            return (
              <tr key={`${r.group_name}-${i}`}>
                <td style={tdStyle}>{r.group_name || "未設定"}</td>
                <td style={tdStyle}>{num(r.new_customers)}人</td>
                <td style={tdStyle}>{num(r.repeat_customers)}人</td>
                <td style={{ ...tdStyle, minWidth: 160 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 8, background: "#DCD6CA", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, rate)}%`, height: "100%", background: "#8A6220" }} />
                    </div>
                    <span style={{ fontWeight: 700, width: 52, textAlign: "right" }}>{rate.toFixed(1)}%</span>
                  </div>
                </td>
                <td style={tdStyle}>{num(r.avg_visits).toFixed(1)}回</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "24px 16px 80px", background: "#F7F5F0", color: "#15171C" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(21,23,28,0.06)" };
const titleStyle: CSSProperties = { margin: "0 0 6px", fontSize: 17 };
const noteStyle: CSSProperties = { fontSize: 12, color: "#5B5E66", lineHeight: 1.6 };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#15171C", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const labelStyle: CSSProperties = { display: "grid", gap: 4, fontSize: 12, fontWeight: 700, color: "#5B5E66" };
const inputStyle: CSSProperties = { padding: "8px 10px", borderRadius: 10, border: "1px solid #CFC8BA", fontSize: 14 };
const buttonStyle: CSSProperties = { padding: "9px 16px", borderRadius: 10, border: "none", background: "#8A6220", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const thStyle: CSSProperties = { textAlign: "left", padding: "8px 6px", borderBottom: "2px solid #DCD6CA", whiteSpace: "nowrap" };
const tdStyle: CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #DCD6CA", whiteSpace: "nowrap" };
