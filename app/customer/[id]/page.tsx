"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  plan?: string | null;
  created_at?: string | null;
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

type SaleRow = {
  id: number | string;
  customer_name: string | null;
  sale_date: string | null;
  menu_type: string | null;
  sale_type: string | null;
  payment_method: string | null;
  amount: number | null;
  staff_name: string | null;
  store_name: string | null;
  reservation_id?: number | null;
  memo: string | null;
  created_at: string | null;
};

type ReservationRow = {
  id: number;
  date: string | null;
  start_time: string | null;
  menu: string | null;
  store_name: string | null;
  staff_name: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatCurrency(value: number) {
  return `¥${Number(value || 0).toLocaleString()}`;
}

function formatDateJP(dateStr?: string | null) {
  if (!dateStr) return "未設定";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatDateTimeJP(dateStr?: string | null, timeStr?: string | null) {
  const date = formatDateJP(dateStr);
  if (!timeStr) return date;
  return `${date} ${timeStr}`;
}

type TabType = "tickets" | "sales";

export default function CustomerDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = Number(rawId ?? 0);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [lastReservation, setLastReservation] = useState<ReservationRow | null>(null);
  const [pageError, setPageError] = useState("");

  const [ticketName, setTicketName] = useState("4回券");
  const [serviceType, setServiceType] =
    useState<"ストレッチ" | "トレーニング">("ストレッチ");
  const [totalCount, setTotalCount] = useState("4");
  const [purchaseDate, setPurchaseDate] = useState(todayString());
  const [expiryDate, setExpiryDate] = useState(addMonths(todayString(), 3));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("tickets");

  useEffect(() => {
    setMounted(true);

    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }
  }, []);

  const fetchCustomerAndTickets = async () => {
    try {
      setLoading(true);
      setPageError("");

      if (!id || Number.isNaN(id)) {
        setCustomer(null);
        setTickets([]);
        setSales([]);
        setLastReservation(null);
        setPageError("顧客IDが不正です。");
        setLoading(false);
        return;
      }

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, phone, plan, created_at")
        .eq("id", id)
        .single();

      if (customerError || !customerData) {
        setCustomer(null);
        setTickets([]);
        setSales([]);
        setLastReservation(null);
        setPageError("顧客情報が見つかりません。");
        setLoading(false);
        return;
      }

      const currentCustomer = customerData as Customer;
      setCustomer(currentCustomer);

      const { data: ticketData, error: ticketError } = await supabase
        .from("customer_tickets")
        .select(
          "id, customer_id, customer_name, ticket_name, service_type, total_count, remaining_count, purchase_date, expiry_date, status, note, created_at"
        )
        .eq("customer_id", id)
        .order("created_at", { ascending: false });

      if (ticketError) {
        console.error("ticket fetch error:", ticketError);
        setTickets([]);
      } else {
        setTickets((ticketData as Ticket[] | null) || []);
      }

      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(
          "id, customer_name, sale_date, menu_type, sale_type, payment_method, amount, staff_name, store_name, reservation_id, memo, created_at"
        )
        .eq("customer_name", currentCustomer.name)
        .order("sale_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (salesError) {
        console.error("sales fetch error:", salesError);
        setSales([]);
      } else {
        setSales((salesData as SaleRow[] | null) || []);
      }

      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .select("id, date, start_time, menu, store_name, staff_name")
        .eq("customer_name", currentCustomer.name)
        .order("date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(1);

      if (reservationError) {
        console.error("reservation fetch error:", reservationError);
        setLastReservation(null);
      } else {
        const latest = ((reservationData as ReservationRow[] | null) || [])[0] || null;
        setLastReservation(latest);
      }

      if (ticketError) {
        setPageError("回数券データの取得に失敗しました。");
      }
    } catch (error) {
      console.error("fetchCustomerAndTickets error:", error);
      setCustomer(null);
      setTickets([]);
      setSales([]);
      setLastReservation(null);
      setPageError("データ取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    if (!id || Number.isNaN(id)) {
      setLoading(false);
      setCustomer(null);
      setTickets([]);
      setSales([]);
      setLastReservation(null);
      setPageError("顧客IDが不正です。");
      return;
    }

    fetchCustomerAndTickets();
  }, [mounted, id]);

  const stretchSummary = useMemo(() => {
    const list = tickets.filter((t) => t.service_type === "ストレッチ");
    return {
      total: list.reduce((sum, t) => sum + Number(t.total_count || 0), 0),
      remain: list.reduce((sum, t) => sum + Number(t.remaining_count || 0), 0),
    };
  }, [tickets]);

  const trainingSummary = useMemo(() => {
    const list = tickets.filter((t) => t.service_type === "トレーニング");
    return {
      total: list.reduce((sum, t) => sum + Number(t.total_count || 0), 0),
      remain: list.reduce((sum, t) => sum + Number(t.remaining_count || 0), 0),
    };
  }, [tickets]);

  const ltv = useMemo(() => {
    return sales.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [sales]);

  const handleAddTicket = async () => {
    if (!customer) {
      alert("顧客情報が見つかりません");
      return;
    }

    const total = Number(totalCount || 0);
    if (total <= 0) {
      alert("総回数を入力してください");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("customer_tickets").insert([
        {
          customer_id: customer.id,
          customer_name: customer.name,
          ticket_name: ticketName.trim() || "回数券",
          service_type: serviceType,
          total_count: total,
          remaining_count: total,
          purchase_date: purchaseDate || null,
          expiry_date: expiryDate || null,
          status: "利用中",
          note: note.trim() || null,
        },
      ]);

      if (error) {
        alert(`回数券追加エラー: ${error.message}`);
        return;
      }

      setTicketName("4回券");
      setServiceType("ストレッチ");
      setTotalCount("4");
      setPurchaseDate(todayString());
      setExpiryDate(addMonths(todayString(), 3));
      setNote("");

      await fetchCustomerAndTickets();
      setActiveTab("tickets");
    } catch (error) {
      console.error("handleAddTicket error:", error);
      alert("回数券追加中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    const ok = window.confirm("この回数券を削除しますか？");
    if (!ok) return;

    try {
      const { error } = await supabase
        .from("customer_tickets")
        .delete()
        .eq("id", ticketId);

      if (error) {
        alert(`削除エラー: ${error.message}`);
        return;
      }

      await fetchCustomerAndTickets();
    } catch (error) {
      console.error("handleDeleteTicket error:", error);
      alert("削除中にエラーが発生しました");
    }
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

  if (!customer) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <h1 style={titleStyle}>顧客詳細</h1>
            <p style={{ color: "#b91c1c", fontWeight: 700 }}>
              {pageError || "顧客情報が見つかりません。"}
            </p>
            <Link href="/customer" style={mainButtonStyle}>
              顧客一覧へ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={titleStyle}>{customer.name}</h1>
            <p style={subTitleStyle}>回数券管理・売上履歴・顧客状況</p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/customer" style={subButtonStyle}>
              ← 顧客一覧へ
            </Link>
          </div>
        </div>

        <div style={metricGridStyle}>
          <MetricCard title="ストレッチ残数" value={`${stretchSummary.remain}回`} />
          <MetricCard title="トレーニング残数" value={`${trainingSummary.remain}回`} />
          <MetricCard title="保有回数券" value={`${tickets.length}件`} />
          <MetricCard title="LTV" value={formatCurrency(ltv)} />
          <MetricCard
            title="最終来店日"
            value={lastReservation ? formatDateJP(lastReservation.date) : "未登録"}
          />
        </div>

        <div style={infoGridStyle}>
          <InfoCard
            label="電話番号"
            value={customer.phone || "未設定"}
          />
          <InfoCard
            label="プラン"
            value={customer.plan || "未設定"}
          />
          <InfoCard
            label="最終来店時間"
            value={lastReservation?.start_time || "未設定"}
          />
          <InfoCard
            label="最終来店メニュー"
            value={lastReservation?.menu || "未設定"}
          />
        </div>

        <div style={mainGridStyle}>
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>回数券追加</h2>

            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>回数券名</label>
                <input
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value)}
                  style={inputStyle}
                  placeholder="例：4回券"
                />
              </div>

              <div>
                <label style={labelStyle}>サービス区分</label>
                <select
                  value={serviceType}
                  onChange={(e) =>
                    setServiceType(
                      e.target.value as "ストレッチ" | "トレーニング"
                    )
                  }
                  style={inputStyle}
                >
                  <option value="ストレッチ">ストレッチ</option>
                  <option value="トレーニング">トレーニング</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>総回数</label>
                <input
                  type="number"
                  value={totalCount}
                  onChange={(e) => setTotalCount(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>購入日</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>有効期限</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>メモ</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
                  placeholder="備考があれば入力"
                />
              </div>
            </div>

            <div style={{ marginTop: "18px" }}>
              <button
                onClick={handleAddTicket}
                style={mainButtonStyle}
                disabled={saving}
              >
                {saving ? "追加中..." : "回数券を追加する"}
              </button>
            </div>
          </section>

          <section style={cardStyle}>
            <div style={tabHeaderStyle}>
              <button
                onClick={() => setActiveTab("tickets")}
                style={activeTab === "tickets" ? activeTabStyle : tabStyle}
              >
                回数券一覧
              </button>
              <button
                onClick={() => setActiveTab("sales")}
                style={activeTab === "sales" ? activeTabStyle : tabStyle}
              >
                売上履歴
              </button>
            </div>

            {activeTab === "tickets" ? (
              <>
                <h2 style={sectionTitleStyle}>回数券一覧</h2>

                {tickets.length === 0 ? (
                  <div style={emptyStyle}>回数券はまだありません</div>
                ) : (
                  <div style={{ display: "grid", gap: "14px" }}>
                    {tickets.map((ticket) => (
                      <div key={ticket.id} style={ticketCardStyle}>
                        <div style={ticketTopRowStyle}>
                          <div>
                            <div style={ticketTitleStyle}>
                              {ticket.ticket_name || "回数券"}
                            </div>
                            <div style={ticketMetaStyle}>
                              {ticket.service_type} / {ticket.status}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            style={deleteButtonStyle}
                          >
                            削除
                          </button>
                        </div>

                        <div style={ticketInfoGridStyle}>
                          <TicketInfo
                            label="残数"
                            value={`${Number(ticket.remaining_count || 0)} / ${Number(
                              ticket.total_count || 0
                            )}`}
                          />
                          <TicketInfo
                            label="購入日"
                            value={ticket.purchase_date || "未設定"}
                          />
                          <TicketInfo
                            label="有効期限"
                            value={ticket.expiry_date || "未設定"}
                          />
                          <TicketInfo label="メモ" value={ticket.note || "なし"} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 style={sectionTitleStyle}>売上履歴</h2>

                {sales.length === 0 ? (
                  <div style={emptyStyle}>売上履歴はまだありません</div>
                ) : (
                  <div style={{ display: "grid", gap: "14px" }}>
                    {sales.map((sale) => (
                      <div key={String(sale.id)} style={ticketCardStyle}>
                        <div style={saleTopRowStyle}>
                          <div>
                            <div style={ticketTitleStyle}>
                              {formatCurrency(Number(sale.amount || 0))}
                            </div>
                            <div style={ticketMetaStyle}>
                              {formatDateJP(sale.sale_date)} / {sale.menu_type || "未設定"}
                            </div>
                          </div>

                          <div style={saleBadgeStyle}>
                            {sale.sale_type || "通常売上"}
                          </div>
                        </div>

                        <div style={ticketInfoGridStyle}>
                          <TicketInfo label="支払方法" value={sale.payment_method || "未設定"} />
                          <TicketInfo label="担当者" value={sale.staff_name || "未設定"} />
                          <TicketInfo label="店舗" value={sale.store_name || "未設定"} />
                          <TicketInfo label="メモ" value={sale.memo || "なし"} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={metricCardStyle}>
      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function TicketInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#111827",
          whiteSpace: "pre-wrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontSize: "15px", fontWeight: 800, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f7f7f8 0%, #ececef 45%, #dfe3e8 100%)",
  padding: "24px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "32px",
  fontWeight: 800,
  color: "#111827",
};

const subTitleStyle: React.CSSProperties = {
  marginTop: "8px",
  color: "#6b7280",
  fontSize: "14px",
};

const metricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const mainGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.65)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
};

const metricCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.65)",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
};

const infoCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "18px",
  padding: "16px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 18px 0",
  fontSize: "24px",
  fontWeight: 800,
  color: "#111827",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
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
};

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "14px",
  padding: "13px 18px",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(203,213,225,0.95)",
  color: "#111827",
  fontWeight: 700,
};

const emptyStyle: React.CSSProperties = {
  borderRadius: "16px",
  padding: "20px",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(203,213,225,0.7)",
  color: "#6b7280",
  textAlign: "center",
};

const ticketCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "18px",
  padding: "16px",
};

const ticketTopRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
};

const saleTopRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
};

const ticketTitleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#111827",
};

const ticketMetaStyle: React.CSSProperties = {
  marginTop: "6px",
  fontSize: "13px",
  color: "#6b7280",
};

const ticketInfoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const deleteButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const saleBadgeStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "8px 12px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1d4ed8",
  fontWeight: 700,
  fontSize: "12px",
};

const tabHeaderStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const tabStyle: React.CSSProperties = {
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: "999px",
  padding: "10px 16px",
  background: "rgba(255,255,255,0.85)",
  color: "#111827",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
};

const activeTabStyle: React.CSSProperties = {
  border: "1px solid #111827",
  borderRadius: "999px",
  padding: "10px 16px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
};