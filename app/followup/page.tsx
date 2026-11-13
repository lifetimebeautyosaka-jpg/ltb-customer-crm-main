"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";

// フォロー確認ページ
// 1. 回数券の期限が近いお客様（30日以内・期限切れ）
// 2. 回数券が残っているのに、次回の予約が入っていないお客様
// 3. 打刻の確認（退勤し忘れ・予約があるのに未出勤）

type TicketRow = {
  id: number | string;
  customer_id: number | string | null;
  customer_name: string | null;
  ticket_name: string | null;
  service_type: string | null;
  remaining_count: number | null;
  expiry_date: string | null;
  status: string | null;
};

type ReservationRow = {
  id: number | string;
  customer_id: number | string | null;
  customer_name: string | null;
  date: string | null;
  start_time: string | null;
  staff_name: string | null;
  reservation_status: string | null;
};

type AttendanceRow = {
  id: number | string;
  staff_id: string | null;
  staff_name: string | null;
  work_date: string | null;
  clock_in: string | null;
  clock_out: string | null;
};

type StaffRow = { staff_id: string; staff_name: string; is_active: boolean | null };

const EXPIRY_WARNING_DAYS = 30;

function trimmed(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diffDays(from: string, to: string) {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isCancelled(status?: string | null) {
  const s = trimmed(status);
  return s.includes("キャンセル") || s.includes("無断");
}

function isActiveTicket(row: TicketRow) {
  const status = trimmed(row.status);
  return Number(row.remaining_count || 0) > 0 && status !== "終了" && status !== "無効";
}

export default function FollowupPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const today = todayString();

  useEffect(() => {
    if (localStorage.getItem("gymup_logged_in") !== "true") {
      window.location.href = "/login";
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const since = addDays(today, -31);
        const [ticketRes, reservationRes, attendanceRes, staffRes] = await Promise.all([
          fetchAllRows<TicketRow>((from, to) =>
            supabase
              .from("customer_tickets")
              .select("id, customer_id, customer_name, ticket_name, service_type, remaining_count, expiry_date, status")
              .gt("remaining_count", 0)
              .order("id", { ascending: true })
              .range(from, to)
          ),
          // 過去180日〜未来の予約（最後の来店日と次回予約の確認に使う）
          fetchAllRows<ReservationRow>((from, to) =>
            supabase
              .from("reservations")
              .select("id, customer_id, customer_name, date, start_time, staff_name, reservation_status")
              .gte("date", addDays(today, -180))
              .order("id", { ascending: true })
              .range(from, to)
          ),
          fetchAllRows<AttendanceRow>((from, to) =>
            supabase
              .from("staff_attendance")
              .select("id, staff_id, staff_name, work_date, clock_in, clock_out")
              .gte("work_date", since)
              .order("id", { ascending: true })
              .range(from, to)
          ),
          supabase.from("staff_master").select("staff_id, staff_name, is_active").eq("is_active", true),
        ]);

        const firstError = ticketRes.error || reservationRes.error || attendanceRes.error || staffRes.error;
        if (firstError) throw firstError;

        setTickets(ticketRes.data.filter(isActiveTicket));
        setReservations(reservationRes.data);
        setAttendance(attendanceRes.data);
        setStaffList((staffRes.data as StaffRow[] | null) || []);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [today]);

  // 1. 期限が近い回数券
  const expiringTickets = useMemo(() => {
    const limit = addDays(today, EXPIRY_WARNING_DAYS);
    return tickets
      .filter((t) => t.expiry_date && t.expiry_date.slice(0, 10) <= limit)
      .sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));
  }, [tickets, today]);

  // 2. 回数券が残っているのに次回予約がないお客様
  const noNextReservation = useMemo(() => {
    const validReservations = reservations.filter((r) => !isCancelled(r.reservation_status));
    const futureCustomerIds = new Set(
      validReservations.filter((r) => trimmed(r.date) >= today).map((r) => trimmed(r.customer_id))
    );
    const lastVisit = new Map<string, string>();
    for (const r of validReservations) {
      const id = trimmed(r.customer_id);
      const date = trimmed(r.date);
      if (!id || date >= today) continue;
      if (!lastVisit.has(id) || date > (lastVisit.get(id) || "")) lastVisit.set(id, date);
    }

    const byCustomer = new Map<string, { customerId: string; customerName: string; remaining: number; tickets: string[] }>();
    for (const t of tickets) {
      const id = trimmed(t.customer_id);
      if (!id || futureCustomerIds.has(id)) continue;
      const current = byCustomer.get(id) || {
        customerId: id,
        customerName: trimmed(t.customer_name) || "名前未設定",
        remaining: 0,
        tickets: [],
      };
      current.remaining += Number(t.remaining_count || 0);
      current.tickets.push(`${trimmed(t.ticket_name) || "回数券"}（残${t.remaining_count}）`);
      byCustomer.set(id, current);
    }

    return Array.from(byCustomer.values())
      .map((c) => ({ ...c, lastVisit: lastVisit.get(c.customerId) || "" }))
      .sort((a, b) => a.lastVisit.localeCompare(b.lastVisit));
  }, [tickets, reservations, today]);

  // 3. 打刻の確認
  const missingClockOut = useMemo(
    () =>
      attendance
        .filter((a) => a.clock_in && !a.clock_out && trimmed(a.work_date) < today)
        .sort((a, b) => String(b.work_date).localeCompare(String(a.work_date))),
    [attendance, today]
  );

  const notClockedInToday = useMemo(() => {
    const clockedIn = new Set(
      attendance.filter((a) => trimmed(a.work_date) === today && a.clock_in).map((a) => trimmed(a.staff_name))
    );
    const staffNames = new Set(staffList.map((s) => trimmed(s.staff_name)));
    const firstReservation = new Map<string, string>();
    for (const r of reservations) {
      if (trimmed(r.date) !== today || isCancelled(r.reservation_status)) continue;
      const name = trimmed(r.staff_name);
      if (!staffNames.has(name) || clockedIn.has(name)) continue;
      const time = trimmed(r.start_time).slice(0, 5);
      if (!firstReservation.has(name) || time < (firstReservation.get(name) || "")) firstReservation.set(name, time);
    }
    return Array.from(firstReservation.entries()).map(([name, time]) => ({ name, time }));
  }, [attendance, reservations, staffList, today]);

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>FOLLOW UP</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>フォロー確認</h1>
          </div>
          <Link href="/dashboard" style={linkButtonStyle}>ダッシュボードへ</Link>
        </div>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {loading ? <div style={cardStyle}>読み込み中...</div> : (
          <>
            <section style={cardStyle}>
              <h2 style={titleStyle}>打刻の確認</h2>
              {notClockedInToday.length === 0 && missingClockOut.length === 0 ? (
                <div style={emptyStyle}>気になる打刻はありません。</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {notClockedInToday.map((s) => (
                    <div key={`in-${s.name}`} style={rowStyle}>
                      <strong>{s.name}</strong>
                      <span style={badgeStyle("#f59e0b")}>今日 {s.time} から予約あり・未出勤</span>
                    </div>
                  ))}
                  {missingClockOut.map((a) => (
                    <div key={`out-${a.id}`} style={rowStyle}>
                      <strong>{trimmed(a.staff_name)}</strong>
                      <span style={badgeStyle("#dc2626")}>{formatDate(a.work_date)} 退勤の打刻なし</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={noteStyle}>退勤の打刻がない日は、管理者がタイムカードで修正してください。</div>
            </section>

            <section style={cardStyle}>
              <h2 style={titleStyle}>回数券の期限が近いお客様（{EXPIRY_WARNING_DAYS}日以内）</h2>
              {expiringTickets.length === 0 ? (
                <div style={emptyStyle}>該当するお客様はいません。</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {expiringTickets.map((t) => {
                    const days = diffDays(today, String(t.expiry_date).slice(0, 10));
                    return (
                      <Link key={t.id} href={`/customer/${t.customer_id}`} style={{ ...rowStyle, textDecoration: "none", color: "inherit" }}>
                        <strong>{trimmed(t.customer_name) || "名前未設定"}</strong>
                        <span>{trimmed(t.ticket_name)}・残り{t.remaining_count}回</span>
                        <span style={badgeStyle(days < 0 ? "#dc2626" : days <= 7 ? "#f59e0b" : "#2563eb")}>
                          {days < 0 ? `期限切れ（${formatDate(t.expiry_date)}）` : `あと${days}日（${formatDate(t.expiry_date)}）`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={titleStyle}>回数券が残っているのに次回予約がないお客様</h2>
              {noNextReservation.length === 0 ? (
                <div style={emptyStyle}>該当するお客様はいません。</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {noNextReservation.map((c) => (
                    <Link key={c.customerId} href={`/customer/${c.customerId}`} style={{ ...rowStyle, textDecoration: "none", color: "inherit" }}>
                      <strong>{c.customerName}</strong>
                      <span>{c.tickets.join("、")}</span>
                      <span style={badgeStyle("#64748b")}>
                        最終来店 {c.lastVisit ? `${formatDate(c.lastVisit)}（${diffDays(c.lastVisit, today)}日前）` : "半年以上前"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              <div style={noteStyle}>最後の来店が古い順に並んでいます。</div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "24px 16px 80px", background: "#f1f5f9", color: "#0f172a" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: 20, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" };
const titleStyle: CSSProperties = { margin: "0 0 12px", fontSize: 17 };
const rowStyle: CSSProperties = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "10px 12px", borderRadius: 12, background: "#f8fafc", fontSize: 14 };
const emptyStyle: CSSProperties = { padding: 12, color: "#64748b", fontSize: 14 };
const noteStyle: CSSProperties = { marginTop: 10, fontSize: 12, color: "#64748b" };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkButtonStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
function badgeStyle(color: string): CSSProperties {
  return { marginLeft: "auto", padding: "4px 10px", borderRadius: 999, background: `${color}1a`, color, fontSize: 12, fontWeight: 700 };
}
