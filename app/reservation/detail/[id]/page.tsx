"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type ReservationRow = {
  id: number;
  customer_name: string | null;
  date: string | null;
  start_time: string | null;
  store_name: string | null;
  staff_name: string | null;
  menu: string | null;
  payment_method: string | null;
  memo: string | null;
};

type Customer = {
  id: number;
  name: string;
};

type Ticket = {
  id: number;
  customer_id: number | null;
  customer_name: string | null;
  ticket_name: string | null;
  service_type: "ストレッチ" | "トレーニング";
  total_count: number | null;
  remaining_count: number | null;
  purchase_date: string | null;
  expiry_date: string | null;
  status: "利用中" | "消化済み" | string;
  note: string | null;
  created_at: string | null;
};

type TicketUsage = {
  id: number;
  reservation_id: number | null;
  ticket_id: number | null;
  customer_id: number | null;
  customer_name: string | null;
  ticket_name: string | null;
  service_type: string | null;
  used_date: string | null;
  before_count: number | null;
  after_count: number | null;
  created_at: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function formatDateJP(dateStr?: string | null) {
  if (!dateStr) return "未設定";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${week[d.getDay()]}）`;
}

function detectServiceType(menu?: string | null): "ストレッチ" | "トレーニング" {
  const text = String(menu || "");
  if (text.includes("ストレッチ")) return "ストレッチ";
  return "トレーニング";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: "12px",
        padding: "14px 0",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div style={{ color: "#6b7280", fontSize: "14px", fontWeight: 700 }}>{label}</div>
      <div
        style={{
          color: "#111827",
          fontSize: "15px",
          fontWeight: 600,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {value || "未設定"}
      </div>
    </div>
  );
}

export default function ReservationDetailPage() {
  const params = useParams();
  const id = Number(params?.id || 0);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [reservation, setReservation] = useState<ReservationRow | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usedTicket, setUsedTicket] = useState<TicketUsage | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [consuming, setConsuming] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    const { data: reservationData } = await supabase
      .from("reservations")
      .select("id, customer_name, date, start_time, store_name, staff_name, menu, payment_method, memo")
      .eq("id", id)
      .single<ReservationRow>();

    setReservation(reservationData || null);

    if (!reservationData?.customer_name) {
      setCustomer(null);
      setTickets([]);
      setUsedTicket(null);
      setLoading(false);
      return;
    }

    const { data: customerData } = await supabase
      .from("customers")
      .select("id, name")
      .eq("name", reservationData.customer_name)
      .maybeSingle<Customer>();

    setCustomer(customerData || null);

    const serviceType = detectServiceType(reservationData.menu);

    if (customerData?.id) {
      const { data: ticketData } = await supabase
        .from("customer_tickets")
        .select(
          "id, customer_id, customer_name, ticket_name, service_type, total_count, remaining_count, purchase_date, expiry_date, status, note, created_at"
        )
        .eq("customer_id", customerData.id)
        .eq("service_type", serviceType)
        .gt("remaining_count", 0)
        .order("purchase_date", { ascending: true });

      setTickets((ticketData as Ticket[] | null) || []);
    } else {
      setTickets([]);
    }

    const { data: usageData } = await supabase
      .from("ticket_usages")
      .select(
        "id, reservation_id, ticket_id, customer_id, customer_name, ticket_name, service_type, used_date, before_count, after_count, created_at"
      )
      .eq("reservation_id", id)
      .maybeSingle<TicketUsage>();

    setUsedTicket(usageData || null);
    setLoading(false);
  };

  useEffect(() => {
    if (!mounted || !id) return;
    fetchAll();
  }, [mounted, id]);

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(String(tickets[0].id));
    }
  }, [tickets, selectedTicketId]);

  const serviceType = useMemo(() => {
    return detectServiceType(reservation?.menu);
  }, [reservation]);

  const handleConsumeTicket = async () => {
    if (!reservation) {
      alert("予約情報がありません");
      return;
    }

    if (!customer) {
      alert("顧客情報が見つかりません");
      return;
    }

    if (usedTicket) {
      alert("この予約はすでに回数券消化済みです");
      return;
    }

    const target = tickets.find((t) => String(t.id) === selectedTicketId);
    if (!target) {
      alert("消化する回数券を選択してください");
      return;
    }

    const before = Number(target.remaining_count || 0);
    if (before <= 0) {
      alert("残数がありません");
      return;
    }

    const after = before - 1;
    setConsuming(true);

    const { error: updateError } = await supabase
      .from("customer_tickets")
      .update({
        remaining_count: after,
        status: after <= 0 ? "消化済み" : "利用中",
      })
      .eq("id", target.id);

    if (updateError) {
      setConsuming(false);
      alert(`回数券更新エラー: ${updateError.message}`);
      return;
    }

    const { error: usageError } = await supabase
      .from("ticket_usages")
      .insert([
        {
          reservation_id: reservation.id,
          ticket_id: target.id,
          customer_id: customer.id,
          customer_name: customer.name,
          ticket_name: target.ticket_name,
          service_type: serviceType,
          used_date: reservation.date || null,
          before_count: before,
          after_count: after,
        },
      ]);

    setConsuming(false);

    if (usageError) {
      alert(`消化履歴登録エラー: ${usageError.message}`);
      return;
    }

    alert("回数券を1回消化しました");
    await fetchAll();
  };

  if (!mounted || loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>読み込み中...</div>
        </div>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <h1 style={titleStyle}>予約詳細</h1>
            <p style={{ color: "#b91c1c", fontWeight: 700 }}>予約データが見つかりませんでした。</p>
            <Link href="/reservation" style={mainButtonStyle}>
              カレンダーへ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const dayHref = reservation.date ? `/reservation/day?date=${reservation.date}` : "/reservation";
  const calendarHref = reservation.date
    ? `/reservation?month=${String(reservation.date).slice(0, 7)}`
    : "/reservation";

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerRowStyle}>
          <h1 style={titleStyle}>予約詳細</h1>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href={calendarHref} style={subButtonStyle}>
              カレンダーへ
            </Link>
            <Link href={dayHref} style={subButtonStyle}>
              ← 日別へ戻る
            </Link>
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              marginBottom: "18px",
              padding: "18px",
              borderRadius: "18px",
              background: "#111827",
              color: "#fff",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "8px" }}>お客様</div>
            <div style={{ fontSize: "28px", fontWeight: 800 }}>
              {reservation.customer_name || "未設定"}
            </div>
          </div>

          <DetailRow label="日付" value={formatDateJP(reservation.date)} />
          <DetailRow label="開始時間" value={reservation.start_time || "未設定"} />
          <DetailRow label="店舗" value={reservation.store_name || "未設定"} />
          <DetailRow label="担当者" value={reservation.staff_name || "未設定"} />
          <DetailRow label="メニュー" value={reservation.menu || "未設定"} />
          <DetailRow label="支払い方法" value={reservation.payment_method || "未設定"} />
          <DetailRow label="メモ" value={reservation.memo || "なし"} />

          <div style={{ marginTop: "24px" }}>
            <h2 style={sectionTitleStyle}>回数券消化</h2>

            <div style={ticketBoxStyle}>
              <div style={ticketSummaryStyle}>
                <div>対象サービス：{serviceType}</div>
                <div>対象顧客：{customer?.name || "未連携"}</div>
              </div>

              {usedTicket ? (
                <div style={successBoxStyle}>
                  この予約はすでに回数券消化済みです。
                  <br />
                  {usedTicket.ticket_name} / 消化前 {usedTicket.before_count} → 消化後 {usedTicket.after_count}
                </div>
              ) : tickets.length === 0 ? (
                <div style={emptyStyle}>使える回数券がありません</div>
              ) : (
                <>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={labelStyle}>使う回数券</label>
                    <select
                      value={selectedTicketId}
                      onChange={(e) => setSelectedTicketId(e.target.value)}
                      style={inputStyle}
                    >
                      {tickets.map((ticket) => (
                        <option key={ticket.id} value={String(ticket.id)}>
                          {ticket.ticket_name} / 残{ticket.remaining_count} / 購入日 {ticket.purchase_date || "未設定"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleConsumeTicket}
                    style={mainButtonStyle}
                    disabled={consuming}
                  >
                    {consuming ? "消化中..." : "回数券を1回消化する"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f5f5",
  padding: "20px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "860px",
  margin: "0 auto",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "16px",
  flexWrap: "wrap",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 800,
  color: "#111827",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 14px 0",
  fontSize: "22px",
  fontWeight: 800,
  color: "#111827",
};

const mainButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "14px",
  padding: "13px 20px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  background: "#fff",
  color: "#111827",
  border: "1px solid #d1d5db",
  padding: "10px 16px",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "14px",
};

const ticketBoxStyle: React.CSSProperties = {
  marginTop: "8px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  padding: "18px",
  background: "#fafafa",
};

const ticketSummaryStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  marginBottom: "14px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.88)",
  fontSize: "15px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const emptyStyle: React.CSSProperties = {
  borderRadius: "16px",
  padding: "16px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  color: "#6b7280",
  textAlign: "center",
  fontWeight: 700,
};

const successBoxStyle: React.CSSProperties = {
  borderRadius: "16px",
  padding: "16px",
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  color: "#065f46",
  fontWeight: 700,
};