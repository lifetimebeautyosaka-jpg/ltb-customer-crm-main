"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";

// 売上の一括取り込み
// CSVを読み込む → 一覧で確認・修正・除外 → 「○件を登録」で sales に登録する。
// 読み込んだだけでは何も保存しない。回数券消化の行は、登録時に回数券の残りを1回減らす。
//
// CSVの列（1行目は見出し。順番は自由、列名で判断）：
//   日付, 顧客名, 顧客ID(任意), サービス(ストレッチ/トレーニング), 会計区分(通常売上/前受金/回数券消化),
//   支払方法, 金額, 担当, 店舗, メニュー, メモ, 予約ID(任意)

type Customer = { id: number | string; name: string | null };

type ImportRow = {
  key: string;
  include: boolean;
  date: string;
  customerName: string;
  customerId: string;
  serviceType: string;
  saleType: string;
  paymentMethod: string;
  amount: string;
  staff: string;
  store: string;
  menu: string;
  memo: string;
  reservationId: string;
};

type ExistingSale = {
  sale_date: string | null;
  customer_id: number | string | null;
  customer_name: string | null;
  amount: number | null;
  sale_type: string | null;
};

const SALE_TYPES = ["通常売上", "前受金", "回数券消化"];
const SERVICE_TYPES = ["ストレッチ", "トレーニング"];

const HEADER_ALIASES: Record<keyof Omit<ImportRow, "key" | "include">, string[]> = {
  date: ["日付", "売上日", "date"],
  customerName: ["顧客名", "お客様", "名前", "customer_name"],
  customerId: ["顧客ID", "customer_id"],
  serviceType: ["サービス", "service"],
  saleType: ["会計区分", "区分", "sale_type"],
  paymentMethod: ["支払方法", "支払い方法", "決済", "payment_method"],
  amount: ["金額", "amount"],
  staff: ["担当", "スタッフ", "staff"],
  store: ["店舗", "store"],
  menu: ["メニュー", "menu"],
  memo: ["メモ", "memo"],
  reservationId: ["予約ID", "reservation_id"],
};

function trimmed(v: unknown) {
  return v === null || v === undefined ? "" : String(v).trim();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

function normalizeDate(value: string) {
  const m = value.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (!m) return value;
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

function detectService(text: string) {
  return text.includes("トレーニング") ? "トレーニング" : "ストレッチ";
}

export default function SalesImportPage() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [existing, setExisting] = useState<ExistingSale[]>([]);
  const [tickets, setTickets] = useState<Map<string, number>>(new Map());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("gymup_logged_in") !== "true") {
      window.location.href = "/login";
      return;
    }
    void (async () => {
      const res = await fetchAllRows<Customer>((from, to) =>
        supabase.from("customers").select("id, name").order("id", { ascending: true }).range(from, to)
      );
      if (res.error) setError(`顧客の読み込みに失敗しました：${res.error.message}`);
      setCustomers(res.data);
    })();
  }, []);

  const customerByName = useMemo(() => {
    const map = new Map<string, Customer[]>();
    for (const c of customers) {
      const name = trimmed(c.name).replace(/\s+/g, "");
      if (!name) continue;
      map.set(name, [...(map.get(name) || []), c]);
    }
    return map;
  }, [customers]);

  async function handleFile(file: File | null) {
    if (!file) return;
    setMessage("");
    setError("");
    const text = await file.text();
    const table = parseCsv(text);
    if (table.length < 2) {
      setError("CSVにデータがありません（1行目は見出し、2行目からデータ）。");
      return;
    }
    const header = table[0].map((h) => trimmed(h));
    const col = (field: keyof typeof HEADER_ALIASES) =>
      header.findIndex((h) => HEADER_ALIASES[field].includes(h));
    const idx = Object.fromEntries(
      (Object.keys(HEADER_ALIASES) as (keyof typeof HEADER_ALIASES)[]).map((f) => [f, col(f)])
    ) as Record<keyof typeof HEADER_ALIASES, number>;

    if (idx.date < 0 || idx.customerName < 0 || idx.amount < 0) {
      setError("CSVに「日付」「顧客名」「金額」の列が必要です。");
      return;
    }

    const parsed: ImportRow[] = table.slice(1).map((cells, i) => {
      const get = (f: keyof typeof HEADER_ALIASES) => (idx[f] >= 0 ? trimmed(cells[idx[f]]) : "");
      const name = get("customerName");
      let customerId = get("customerId");
      if (!customerId) {
        const matches = customerByName.get(name.replace(/\s+/g, "")) || [];
        if (matches.length === 1) customerId = String(matches[0].id);
      }
      const menu = get("menu");
      const saleType = SALE_TYPES.includes(get("saleType")) ? get("saleType") : "通常売上";
      return {
        key: `${i}-${Date.now()}`,
        include: true,
        date: normalizeDate(get("date")),
        customerName: name,
        customerId,
        serviceType: SERVICE_TYPES.includes(get("serviceType")) ? get("serviceType") : detectService(menu),
        saleType,
        paymentMethod: get("paymentMethod") || "カード",
        amount: get("amount").replace(/[^\d-]/g, ""),
        staff: get("staff"),
        store: get("store"),
        menu,
        memo: get("memo"),
        reservationId: get("reservationId"),
      };
    });

    setRows(parsed);

    // 既存の売上（重複チェック）と回数券の残り（消化チェック）を読む
    const dates = parsed.map((r) => r.date).filter(Boolean).sort();
    if (dates.length > 0) {
      const salesRes = await fetchAllRows<ExistingSale>((from, to) =>
        supabase
          .from("sales")
          .select("sale_date, customer_id, customer_name, amount, sale_type")
          .gte("sale_date", dates[0])
          .lte("sale_date", dates[dates.length - 1])
          .order("id", { ascending: true })
          .range(from, to)
      );
      setExisting(salesRes.data);
    }
    const ids = Array.from(new Set(parsed.filter((r) => r.saleType === "回数券消化" && r.customerId).map((r) => Number(r.customerId))));
    if (ids.length > 0) {
      const { data } = await supabase
        .from("customer_tickets")
        .select("customer_id, service_type, remaining_count")
        .in("customer_id", ids)
        .gt("remaining_count", 0);
      const map = new Map<string, number>();
      for (const t of (data as { customer_id: number; service_type: string; remaining_count: number }[] | null) || []) {
        const k = `${t.customer_id}-${t.service_type}`;
        map.set(k, (map.get(k) || 0) + Number(t.remaining_count || 0));
      }
      setTickets(map);
    } else setTickets(new Map());
  }

  function update(key: string, patch: Partial<ImportRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const warnings = useMemo(() => {
    const result = new Map<string, string[]>();
    const consumeUse = new Map<string, number>();
    for (const r of rows) {
      const list: string[] = [];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) list.push("日付の形がおかしい");
      if (!(Number(r.amount) > 0)) list.push("金額がない");
      if (!r.customerId) list.push("顧客が見つからない（顧客IDなしで登録）");
      const dup = existing.some(
        (e) =>
          trimmed(e.sale_date) === r.date &&
          Number(e.amount) === Number(r.amount) &&
          trimmed(e.sale_type) === r.saleType &&
          (r.customerId ? trimmed(e.customer_id) === r.customerId : trimmed(e.customer_name) === r.customerName)
      );
      if (dup) list.push("同じ売上がすでに登録済み");
      if (r.include && r.saleType === "回数券消化") {
        if (!r.customerId) list.push("回数券消化には顧客が必要");
        else {
          const k = `${r.customerId}-${r.serviceType}`;
          const used = (consumeUse.get(k) || 0) + 1;
          consumeUse.set(k, used);
          if (used > (tickets.get(k) || 0)) list.push("回数券の残りが足りない");
        }
      }
      if (r.saleType === "前受金") list.push("回数券の発行は「回数券購入」で別に行う");
      result.set(r.key, list);
    }
    return result;
  }, [rows, existing, tickets]);

  const blocking = (r: ImportRow) =>
    (warnings.get(r.key) || []).some((w) =>
      ["日付の形がおかしい", "金額がない", "回数券消化には顧客が必要", "回数券の残りが足りない"].includes(w)
    );

  const targets = rows.filter((r) => r.include);
  const blocked = targets.filter(blocking);

  async function handleRegister() {
    if (targets.length === 0 || blocked.length > 0) return;
    if (!window.confirm(`${targets.length}件の売上を登録します。よろしいですか？`)) return;

    setSaving(true);
    setError("");
    let done = 0;
    try {
      for (const r of targets) {
        const memo = [r.memo, r.menu ? `メニュー名: ${r.menu}` : "", "一括取り込み"].filter(Boolean).join("\n");
        const { error: insertError } = await supabase.from("sales").insert({
          customer_id: r.customerId ? Number(r.customerId) : null,
          customer_name: r.customerName,
          sale_date: r.date,
          menu_type: r.serviceType,
          sale_type: r.saleType,
          payment_method: r.paymentMethod,
          amount: Number(r.amount),
          staff_name: r.staff || "未設定",
          store_name: r.store || "未設定",
          reservation_id: r.reservationId ? Number(r.reservationId) : null,
          memo,
        });
        if (insertError) throw new Error(`${r.date} ${r.customerName}：${insertError.message}`);

        if (r.saleType === "回数券消化" && r.customerId) {
          const { data: ticketRows, error: ticketError } = await supabase
            .from("customer_tickets")
            .select("id, ticket_name, remaining_count")
            .eq("customer_id", Number(r.customerId))
            .eq("service_type", r.serviceType)
            .gt("remaining_count", 0)
            .order("created_at", { ascending: true })
            .limit(1);
          if (ticketError) throw new Error(`回数券の確認に失敗：${ticketError.message}`);
          const ticket = (ticketRows as { id: number; ticket_name: string | null; remaining_count: number }[] | null)?.[0];
          if (ticket) {
            const before = Number(ticket.remaining_count || 0);
            const after = before - 1;
            await supabase
              .from("customer_tickets")
              .update(after <= 0 ? { remaining_count: after, status: "終了" } : { remaining_count: after })
              .eq("id", ticket.id);
            await supabase.from("ticket_usages").insert({
              ticket_id: ticket.id,
              customer_id: Number(r.customerId),
              customer_name: r.customerName,
              ticket_name: ticket.ticket_name,
              service_type: r.serviceType,
              used_date: r.date,
              before_count: before,
              after_count: after,
              reservation_id: r.reservationId ? Number(r.reservationId) : null,
              note: "一括取り込み",
            });
          }
        }
        done += 1;
      }
      setMessage(`${done}件の売上を登録しました。`);
      setRows([]);
    } catch (e) {
      setError(`${done}件まで登録しました。途中でエラー：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>SALES IMPORT</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>売上の一括取り込み</h1>
          </div>
          <Link href="/sales" style={linkStyle}>売上管理へ</Link>
        </div>

        <section style={cardStyle}>
          <input type="file" accept=".csv,text/csv" onChange={(e) => void handleFile(e.target.files?.[0] || null)} />
          <div style={noteStyle}>
            CSVを選ぶと、下に一覧が出ます。この時点ではまだ登録されません。内容を確認して、外したい行はチェックを外し、最後に「登録」を押してください。
            列：日付・顧客名・顧客ID（任意）・サービス・会計区分・支払方法・金額・担当・店舗・メニュー・メモ・予約ID（任意）
          </div>
        </section>

        {message ? <div style={okStyle}>{message}</div> : null}
        {error ? <div style={errorStyle}>{error}</div> : null}

        {rows.length > 0 ? (
          <section style={cardStyle}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["登録", "日付", "顧客", "サービス", "会計区分", "支払", "金額", "担当", "店舗", "メニュー", "注意"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const w = warnings.get(r.key) || [];
                    return (
                      <tr key={r.key} style={{ background: r.include && blocking(r) ? "#fef2f2" : r.include ? "#fff" : "#f1f5f9" }}>
                        <td style={tdStyle}><input type="checkbox" checked={r.include} onChange={(e) => update(r.key, { include: e.target.checked })} /></td>
                        <td style={tdStyle}><input value={r.date} onChange={(e) => update(r.key, { date: e.target.value })} style={cellInput(100)} /></td>
                        <td style={tdStyle}>{r.customerName}{r.customerId ? <div style={{ fontSize: 11, color: "#64748b" }}>ID {r.customerId}</div> : null}</td>
                        <td style={tdStyle}>
                          <select value={r.serviceType} onChange={(e) => update(r.key, { serviceType: e.target.value })} style={cellInput(96)}>
                            {SERVICE_TYPES.map((v) => <option key={v}>{v}</option>)}
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <select value={r.saleType} onChange={(e) => update(r.key, { saleType: e.target.value })} style={cellInput(100)}>
                            {SALE_TYPES.map((v) => <option key={v}>{v}</option>)}
                          </select>
                        </td>
                        <td style={tdStyle}><input value={r.paymentMethod} onChange={(e) => update(r.key, { paymentMethod: e.target.value })} style={cellInput(80)} /></td>
                        <td style={tdStyle}><input value={r.amount} onChange={(e) => update(r.key, { amount: e.target.value })} style={cellInput(80)} /></td>
                        <td style={tdStyle}><input value={r.staff} onChange={(e) => update(r.key, { staff: e.target.value })} style={cellInput(64)} /></td>
                        <td style={tdStyle}><input value={r.store} onChange={(e) => update(r.key, { store: e.target.value })} style={cellInput(72)} /></td>
                        <td style={tdStyle}>{r.menu}</td>
                        <td style={{ ...tdStyle, color: "#b45309", fontSize: 12 }}>{w.join("／")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleRegister}
                disabled={saving || targets.length === 0 || blocked.length > 0}
                style={{ ...buttonStyle, opacity: saving || targets.length === 0 || blocked.length > 0 ? 0.5 : 1 }}
              >
                {saving ? "登録中..." : `${targets.length}件を登録する`}
              </button>
              {blocked.length > 0 ? (
                <span style={{ color: "#b91c1c", fontSize: 13 }}>赤い行（{blocked.length}件）を直すか、チェックを外してください。</span>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "24px 16px 80px", background: "#f1f5f9", color: "#0f172a" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" };
const noteStyle: CSSProperties = { marginTop: 10, fontSize: 12, color: "#64748b", lineHeight: 1.7 };
const okStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#dcfce7", color: "#166534" };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const thStyle: CSSProperties = { textAlign: "left", padding: "8px 6px", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" };
const tdStyle: CSSProperties = { padding: "6px", borderBottom: "1px solid #e2e8f0", verticalAlign: "top" };
const buttonStyle: CSSProperties = { minHeight: 44, padding: "0 20px", borderRadius: 12, border: "none", background: "#0f172a", color: "#fff", fontWeight: 800, cursor: "pointer" };
function cellInput(width: number): CSSProperties {
  return { width, minHeight: 30, padding: "0 6px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 };
}
