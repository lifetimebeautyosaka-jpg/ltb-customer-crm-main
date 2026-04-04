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

export default function CustomerDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = Number(rawId ?? 0);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pageError, setPageError] = useState("");

  const [ticketName, setTicketName] = useState("4回券");
  const [serviceType, setServiceType] =
    useState<"ストレッチ" | "トレーニング">("ストレッチ");
  const [totalCount, setTotalCount] = useState("4");
  const [purchaseDate, setPurchaseDate] = useState(todayString());
  const [expiryDate, setExpiryDate] = useState(addMonths(todayString(), 3));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

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
        setPageError("顧客IDが不正です。");
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
        setPageError("顧客情報が見つかりません。");
        return;
      }

      setCustomer(customerData as Customer);

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
        setPageError("回数券データの取得に失敗しました。");
        return;
      }

      setTickets((ticketData as Ticket[] | null) || []);
    } catch (error) {
      console.error("fetchCustomerAndTickets error:", error);
      setCustomer(null);
      setTickets([]);
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
            <p style={subTitleStyle}>回数券管理・残数確認</p>
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