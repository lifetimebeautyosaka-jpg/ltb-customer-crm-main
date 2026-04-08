"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

type ReservationRow = {
  id: string | number;
  customer_id?: string | number | null;
  customer_name?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  store_name?: string | null;
  staff_name?: string | null;
  menu?: string | null;
  payment_method?: string | null;
  memo?: string | null;
  created_at?: string | null;
};

type CustomerTicketRow = {
  id: string | number;
  customer_id?: string | number | null;
  customer_name?: string | null;
  ticket_name?: string | null;
  service_type?: string | null;
  total_count?: number | null;
  remaining_count?: number | null;
  purchase_date?: string | null;
  expiry_date?: string | null;
  status?: string | null;
  note?: string | null;
  created_at?: string | null;
};

type TicketUsageRow = {
  id: string | number;
  reservation_id?: string | number | null;
  ticket_id?: string | number | null;
  customer_id?: string | number | null;
  customer_name?: string | null;
  ticket_name?: string | null;
  service_type?: string | null;
  used_date?: string | null;
  before_count?: number | null;
  after_count?: number | null;
};

type SaleRow = {
  id: string | number;
  reservation_id?: string | number | null;
  sale_type?: string | null;
  amount?: number | null;
  created_at?: string | null;
};

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ja-JP");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP");
}

function calcTicketStatus(ticket: CustomerTicketRow) {
  const remaining = Number(ticket.remaining_count || 0);
  const baseStatus = ticket.status || "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (baseStatus === "無効") return "無効";
  if (remaining <= 0) return "消化済み";

  if (ticket.expiry_date) {
    const expiry = new Date(ticket.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    if (!Number.isNaN(expiry.getTime()) && expiry < today) {
      return "期限切れ";
    }
  }

  return "有効";
}

function statusBadgeStyle(status: string): CSSProperties {
  switch (status) {
    case "売上登録済み":
      return {
        background: "rgba(37,99,235,0.10)",
        color: "#1d4ed8",
        border: "1px solid rgba(37,99,235,0.18)",
      };
    case "回数券消化済み":
      return {
        background: "rgba(22,163,74,0.10)",
        color: "#15803d",
        border: "1px solid rgba(22,163,74,0.18)",
      };
    case "未処理":
      return {
        background: "rgba(245,158,11,0.12)",
        color: "#b45309",
        border: "1px solid rgba(245,158,11,0.22)",
      };
    default:
      return {
        background: "rgba(100,116,139,0.10)",
        color: "#475569",
        border: "1px solid rgba(100,116,139,0.18)",
      };
  }
}

function ticketBadgeStyle(status: string): CSSProperties {
  switch (status) {
    case "有効":
      return {
        background: "rgba(22,163,74,0.10)",
        color: "#15803d",
        border: "1px solid rgba(22,163,74,0.18)",
      };
    case "期限切れ":
      return {
        background: "rgba(245,158,11,0.12)",
        color: "#b45309",
        border: "1px solid rgba(245,158,11,0.22)",
      };
    case "消化済み":
      return {
        background: "rgba(59,130,246,0.10)",
        color: "#1d4ed8",
        border: "1px solid rgba(59,130,246,0.18)",
      };
    default:
      return {
        background: "rgba(239,68,68,0.10)",
        color: "#b91c1c",
        border: "1px solid rgba(239,68,68,0.18)",
      };
  }
}

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const reservationId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consuming, setConsuming] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [reservation, setReservation] = useState<ReservationRow | null>(null);
  const [tickets, setTickets] = useState<CustomerTicketRow[]>([]);
  const [usages, setUsages] = useState<TicketUsageRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);

  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loggedIn =
      localStorage.getItem("gymup_logged_in") ||
      localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }

    if (!reservationId) {
      setLoading(false);
      setError("予約IDが取得できませんでした。");
      return;
    }

    void loadData();
  }, [mounted, reservationId, router]);

  async function loadData() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const reservationIdForQuery = Number.isNaN(Number(reservationId))
        ? reservationId
        : Number(reservationId);

      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .select(
          "id, customer_id, customer_name, date, start_time, end_time, store_name, staff_name, menu, payment_method, memo, created_at"
        )
        .eq("id", reservationIdForQuery)
        .maybeSingle();

      if (reservationError) throw reservationError;
      if (!reservationData) {
        setError("予約が見つかりませんでした。");
        setLoading(false);
        return;
      }

      const reservationRow = reservationData as ReservationRow;
      setReservation(reservationRow);

      const customerId = reservationRow.customer_id;
      const customerIdForQuery =
        customerId !== null &&
        customerId !== undefined &&
        !Number.isNaN(Number(customerId))
          ? String(customerId)
          : "";

      if (customerIdForQuery) {
        const { data: ticketData, error: ticketError } = await supabase
          .from("customer_tickets")
          .select(
            "id, customer_id, customer_name, ticket_name, service_type, total_count, remaining_count, purchase_date, expiry_date, status, note, created_at"
          )
          .eq("customer_id", customerIdForQuery)
          .order("created_at", { ascending: false });

        if (ticketError) {
          console.warn("customer_tickets取得エラー:", ticketError.message);
        } else {
          setTickets((ticketData as CustomerTicketRow[]) || []);
        }
      } else {
        setTickets([]);
      }

      const { data: usageData, error: usageError } = await supabase
        .from("ticket_usages")
        .select(
          "id, reservation_id, ticket_id, customer_id, customer_name, ticket_name, service_type, used_date, before_count, after_count"
        )
        .eq("reservation_id", reservationIdForQuery)
        .order("used_date", { ascending: false });

      if (usageError) {
        console.warn("ticket_usages取得エラー:", usageError.message);
      } else {
        setUsages((usageData as TicketUsageRow[]) || []);
      }

      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id, reservation_id, sale_type, amount, created_at")
        .eq("reservation_id", reservationIdForQuery);

      if (salesError) {
        console.warn("sales取得エラー:", salesError.message);
      } else {
        setSales((salesData as SaleRow[]) || []);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "予約詳細の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const reservationStatusList = useMemo(() => {
    const result: string[] = [];

    if (sales.length > 0) result.push("売上登録済み");
    if (usages.length > 0) result.push("回数券消化済み");
    if (result.length === 0) result.push("未処理");

    return result;
  }, [sales, usages]);

  const availableTickets = useMemo(() => {
    return tickets.filter((ticket) => calcTicketStatus(ticket) === "有効");
  }, [tickets]);

  const isAlreadyConsumed = usages.length > 0;

  async function handleConsumeTicket() {
    if (!supabase || !reservation) return;

    if (isAlreadyConsumed) {
      setError("この予約はすでに回数券消化済みです。");
      return;
    }

    if (!selectedTicketId) {
      setError("消化する回数券を選択してください。");
      return;
    }

    const targetTicket = availableTickets.find(
      (ticket) => String(ticket.id) === selectedTicketId
    );

    if (!targetTicket) {
      setError("有効な回数券が見つかりませんでした。");
      return;
    }

    const beforeCount = Number(targetTicket.remaining_count || 0);
    if (beforeCount <= 0) {
      setError("この回数券は残数がありません。");
      return;
    }

    const afterCount = beforeCount - 1;

    try {
      setConsuming(true);
      setError("");
      setSuccess("");

      const ticketIdForQuery = Number.isNaN(Number(targetTicket.id))
        ? targetTicket.id
        : Number(targetTicket.id);

      const reservationIdForQuery = Number.isNaN(Number(reservation.id))
        ? reservation.id
        : Number(reservation.id);

      const { error: updateError } = await supabase
        .from("customer_tickets")
        .update({
          remaining_count: afterCount,
          status: afterCount <= 0 ? "消化済み" : targetTicket.status || "有効",
        })
        .eq("id", ticketIdForQuery);

      if (updateError) throw updateError;

      const { error: usageInsertError } = await supabase
        .from("ticket_usages")
        .insert({
          reservation_id: reservationIdForQuery,
          ticket_id: ticketIdForQuery,
          customer_id: reservation.customer_id ? Number(reservation.customer_id) : null,
          customer_name: trimmed(reservation.customer_name) || null,
          ticket_name: targetTicket.ticket_name || null,
          service_type: targetTicket.service_type || null,
          used_date: reservation.date || new Date().toISOString().slice(0, 10),
          before_count: beforeCount,
          after_count: afterCount,
        });

      if (usageInsertError) {
        await supabase
          .from("customer_tickets")
          .update({
            remaining_count: beforeCount,
            status: targetTicket.status || "有効",
          })
          .eq("id", ticketIdForQuery);

        throw usageInsertError;
      }

      setSuccess("回数券を消化しました。");
      setShowConsumeModal(false);
      setSelectedTicketId("");
      await loadData();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "回数券消化に失敗しました。");
    } finally {
      setConsuming(false);
    }
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>読み込み中...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <section style={styles.heroCard}>
          <div>
            <div style={styles.eyebrow}>RESERVATION DETAIL</div>
            <h1 style={styles.title}>予約詳細</h1>
            <div style={styles.subText}>
              予約情報の確認・売上・回数券消化をここで処理できます
            </div>
          </div>

          <div style={styles.topActions}>
            <button
              type="button"
              onClick={() => router.back()}
              style={styles.secondaryButton}
            >
              戻る
            </button>

            {reservation?.customer_id ? (
              <Link
                href={`/customer/${reservation.customer_id}`}
                style={styles.secondaryLink}
              >
                顧客詳細へ
              </Link>
            ) : null}

            <Link
              href={`/sales?reservationId=${reservation?.id || ""}&customerId=${
                reservation?.customer_id || ""
              }&customerName=${encodeURIComponent(
                reservation?.customer_name || ""
              )}&date=${reservation?.date || ""}&menu=${encodeURIComponent(
                reservation?.menu || ""
              )}&staffName=${encodeURIComponent(
                reservation?.staff_name || ""
              )}&paymentMethod=${encodeURIComponent(
                reservation?.payment_method || ""
              )}`}
              style={styles.primaryLink}
            >
              売上登録へ
            </Link>

            {reservation?.customer_id ? (
              <Link
                href={`/customer/${reservation.customer_id}`}
                style={styles.secondaryLink}
              >
                回数券確認
              </Link>
            ) : null}

            {!isAlreadyConsumed ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setSelectedTicketId("");
                  setShowConsumeModal(true);
                }}
                style={styles.consumeButton}
                disabled={!reservation?.customer_id || availableTickets.length === 0}
              >
                回数券消化
              </button>
            ) : null}
          </div>
        </section>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {success ? <div style={styles.successBox}>{success}</div> : null}

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>処理ステータス</h2>
          </div>

          <div style={styles.badgeWrap}>
            {reservationStatusList.map((status) => (
              <span
                key={status}
                style={{
                  ...styles.statusBadge,
                  ...statusBadgeStyle(status),
                }}
              >
                {status}
              </span>
            ))}
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>予約情報</h2>

          <div style={styles.infoGrid}>
            <InfoItem label="日付" value={formatDate(reservation?.date)} />
            <InfoItem
              label="開始時間"
              value={trimmed(reservation?.start_time) || "—"}
            />
            <InfoItem
              label="終了時間"
              value={trimmed(reservation?.end_time) || "—"}
            />
            <InfoItem
              label="顧客名"
              value={trimmed(reservation?.customer_name) || "—"}
            />
            <InfoItem
              label="店舗"
              value={trimmed(reservation?.store_name) || "—"}
            />
            <InfoItem
              label="担当"
              value={trimmed(reservation?.staff_name) || "—"}
            />
            <InfoItem
              label="メニュー"
              value={trimmed(reservation?.menu) || "—"}
            />
            <InfoItem
              label="支払方法"
              value={trimmed(reservation?.payment_method) || "—"}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <TextBlock label="メモ" value={trimmed(reservation?.memo) || "—"} />
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>この予約の回数券消化履歴</h2>
          </div>

          {usages.length === 0 ? (
            <div style={styles.emptyBox}>まだこの予約では回数券消化されていません。</div>
          ) : (
            <div style={styles.usageList}>
              {usages.map((usage) => (
                <article key={String(usage.id)} style={styles.usageCard}>
                  <div style={styles.usageTitle}>
                    {trimmed(usage.ticket_name) || "回数券名未設定"}
                  </div>
                  <div style={styles.usageSub}>
                    サービス種別：{trimmed(usage.service_type) || "—"}
                  </div>
                  <div style={styles.usageSub}>
                    消化日：{formatDate(usage.used_date)}
                  </div>
                  <div style={styles.usageSub}>
                    残数：{Number(usage.before_count || 0)} →{" "}
                    {Number(usage.after_count || 0)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>現在の有効回数券</h2>
          </div>

          {availableTickets.length === 0 ? (
            <div style={styles.emptyBox}>有効な回数券はありません。</div>
          ) : (
            <div style={styles.ticketList}>
              {availableTickets.map((ticket) => {
                const computedStatus = calcTicketStatus(ticket);
                return (
                  <article key={String(ticket.id)} style={styles.ticketCard}>
                    <div style={styles.ticketTop}>
                      <div>
                        <div style={styles.ticketName}>
                          {ticket.ticket_name || "回数券名未設定"}
                        </div>
                        <div style={styles.ticketSub}>
                          {ticket.service_type || "—"}
                        </div>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          ...ticketBadgeStyle(computedStatus),
                        }}
                      >
                        {computedStatus}
                      </span>
                    </div>

                    <div style={styles.ticketMeta}>
                      残数 {Number(ticket.remaining_count || 0)} /{" "}
                      {Number(ticket.total_count || 0)}
                    </div>
                    <div style={styles.ticketMeta}>
                      有効期限 {formatDate(ticket.expiry_date)}
                    </div>
                    <div style={styles.ticketMeta}>
                      メモ {trimmed(ticket.note) || "—"}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {showConsumeModal ? (
          <div
            style={styles.modalOverlay}
            onClick={() => setShowConsumeModal(false)}
          >
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalTitle}>回数券消化</div>
              <div style={styles.modalText}>
                消化する回数券を選択してください。
              </div>

              {availableTickets.length === 0 ? (
                <div style={styles.emptyBox}>消化できる回数券がありません。</div>
              ) : (
                <div style={styles.modalList}>
                  {availableTickets.map((ticket) => {
                    const isSelected = selectedTicketId === String(ticket.id);
                    return (
                      <button
                        key={String(ticket.id)}
                        type="button"
                        onClick={() => setSelectedTicketId(String(ticket.id))}
                        style={{
                          ...styles.ticketSelectButton,
                          ...(isSelected ? styles.ticketSelectButtonActive : {}),
                        }}
                      >
                        <div style={styles.ticketSelectTitle}>
                          {ticket.ticket_name || "回数券名未設定"}
                        </div>
                        <div style={styles.ticketSelectSub}>
                          {ticket.service_type || "—"} / 残数{" "}
                          {Number(ticket.remaining_count || 0)} /{" "}
                          {Number(ticket.total_count || 0)}
                        </div>
                        <div style={styles.ticketSelectSub}>
                          有効期限 {formatDate(ticket.expiry_date)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowConsumeModal(false)}
                  style={styles.secondaryButton}
                >
                  キャンセル
                </button>

                <button
                  type="button"
                  onClick={handleConsumeTicket}
                  disabled={consuming || !selectedTicketId}
                  style={{
                    ...styles.consumeButton,
                    opacity: consuming || !selectedTicketId ? 0.7 : 1,
                    cursor: consuming || !selectedTicketId ? "not-allowed" : "pointer",
                  }}
                >
                  {consuming ? "消化中..." : "この回数券を消化"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value || "—"}</div>
    </div>
  );
}

function TextBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.textBlock}>{value}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f8fafc 0%, #eef2f7 45%, #e9eef5 100%)",
    padding: "20px 12px 48px",
  },
  container: {
    maxWidth: 1080,
    margin: "0 auto",
    display: "grid",
    gap: 16,
  },
  loadingCard: {
    background: "#fff",
    borderRadius: 24,
    padding: 28,
    textAlign: "center",
    fontWeight: 800,
    color: "#334155",
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  },
  heroCard: {
    background: "rgba(255,255,255,0.84)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.72)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#64748b",
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: "clamp(24px, 4vw, 34px)",
    color: "#111827",
    fontWeight: 900,
  },
  subText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: 700,
  },
  topActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  card: {
    background: "rgba(255,255,255,0.84)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.72)",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "#111827",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  infoCard: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    padding: "14px 14px",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    marginBottom: 6,
    letterSpacing: "0.04em",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  textBlock: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(248,250,252,0.92)",
    border: "1px solid rgba(226,232,240,0.95)",
    color: "#334155",
    fontSize: 14,
    lineHeight: 1.8,
  },
  badgeWrap: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },
  usageList: {
    display: "grid",
    gap: 12,
  },
  usageCard: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 14,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#111827",
    marginBottom: 6,
  },
  usageSub: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
    fontWeight: 700,
  },
  ticketList: {
    display: "grid",
    gap: 12,
  },
  ticketCard: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 14,
  },
  ticketTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: 900,
    color: "#111827",
  },
  ticketSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
  },
  ticketMeta: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
    fontWeight: 700,
  },
  emptyBox: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 16,
    padding: 16,
    color: "#475569",
    fontSize: 14,
    fontWeight: 700,
  },
  primaryLink: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 14,
    background: "#111827",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 800,
  },
  secondaryLink: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 14,
    background: "#fff",
    border: "1px solid #dbe2ea",
    color: "#111827",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 800,
  },
  secondaryButton: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 14,
    background: "#fff",
    border: "1px solid #dbe2ea",
    color: "#111827",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  consumeButton: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #166534 0%, #15803d 100%)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.6,
  },
  successBox: {
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.6,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.34)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  modalCard: {
    width: "100%",
    maxWidth: 560,
    background: "#fff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 20px 50px rgba(15,23,42,0.18)",
    display: "grid",
    gap: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "#111827",
  },
  modalText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
    fontWeight: 700,
  },
  modalList: {
    display: "grid",
    gap: 10,
    maxHeight: 320,
    overflowY: "auto",
  },
  ticketSelectButton: {
    width: "100%",
    textAlign: "left",
    borderRadius: 16,
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: 14,
    cursor: "pointer",
  },
  ticketSelectButtonActive: {
    border: "2px solid #15803d",
    background: "rgba(240,253,244,0.96)",
  },
  ticketSelectTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
    marginBottom: 6,
  },
  ticketSelectSub: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
    fontWeight: 700,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 4,
  },
};