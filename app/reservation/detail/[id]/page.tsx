"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

type CustomerRow = {
  id: string | number;
  name?: string | null;
  kana?: string | null;
  phone?: string | null;
};

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function formatJapaneseDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${week[date.getDay()]}曜日`;
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("ja-JP");
}

function getStoreColor(storeName?: string | null) {
  switch (storeName) {
    case "江戸堀":
      return "#22c55e";
    case "箕面":
      return "#38bdf8";
    case "福島":
      return "#f97316";
    case "福島P":
      return "#a855f7";
    case "天満橋":
      return "#ef4444";
    case "中崎町":
      return "#14b8a6";
    default:
      return "#94a3b8";
  }
}

function extractErrorMessage(error: unknown): string {
  if (!error) return "不明なエラーです。";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  if (typeof error === "object") {
    const maybe = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      typeof maybe.message === "string" ? maybe.message : "",
      typeof maybe.details === "string" ? maybe.details : "",
      typeof maybe.hint === "string" ? maybe.hint : "",
      typeof maybe.code === "string" ? `code: ${maybe.code}` : "",
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(" / ");
  }

  return "不明なエラーです。";
}

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const reservationId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [reservation, setReservation] = useState<ReservationRow | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);

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

    void loadDetail();
  }, [mounted, reservationId, router]);

  async function loadDetail() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .select(
          "id, customer_id, customer_name, date, start_time, end_time, store_name, staff_name, menu, payment_method, memo, created_at"
        )
        .eq("id", reservationId)
        .single();

      if (reservationError) throw reservationError;

      const reservationRow = reservationData as ReservationRow;
      setReservation(reservationRow);

      if (reservationRow.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id, name, kana, phone")
          .eq("id", reservationRow.customer_id)
          .maybeSingle();

        if (customerError) {
          console.warn(customerError);
        }

        if (customerData) {
          setCustomer(customerData as CustomerRow);
        }
      }
    } catch (e) {
      console.error(e);
      setError(`予約取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!supabase || !reservation) return;

    const ok = window.confirm("この予約を削除しますか？");
    if (!ok) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservation.id);

      if (error) throw error;

      setSuccess("予約を削除しました。");

      setTimeout(() => {
        router.push("/reservation");
      }, 400);
    } catch (e) {
      console.error(e);
      setError(`予約削除エラー: ${extractErrorMessage(e)}`);
    } finally {
      setDeleting(false);
    }
  }

  const storeColor = useMemo(() => {
    return getStoreColor(reservation?.store_name);
  }, [reservation?.store_name]);

  if (!mounted) return null;

  return (
    <main style={styles.page}>
      <div style={styles.mobileWrap}>
        <section style={styles.topCard}>
          <button
            type="button"
            onClick={() => router.push("/reservation")}
            style={styles.backBtn}
          >
            ←
          </button>

          <div>
            <div style={styles.pageLabel}>RESERVATION DETAIL</div>
            <h1 style={styles.pageTitle}>予約詳細</h1>
          </div>
        </section>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {success ? <div style={styles.successBox}>{success}</div> : null}

        {loading ? (
          <section style={styles.card}>
            <div style={styles.emptyText}>読み込み中...</div>
          </section>
        ) : !reservation ? (
          <section style={styles.card}>
            <div style={styles.emptyText}>予約が見つかりません。</div>
          </section>
        ) : (
          <>
            <section style={styles.heroCard}>
              <div style={styles.heroTop}>
                <div style={styles.timeWrap}>
                  <div style={styles.timeMain}>{trimmed(reservation.start_time) || "—"}</div>
                  <div style={styles.timeArrow}>〜</div>
                  <div style={styles.timeSub}>{trimmed(reservation.end_time) || "—"}</div>
                </div>

                <div
                  style={{
                    ...styles.storeBadge,
                    background: storeColor,
                  }}
                >
                  {trimmed(reservation.store_name) || "店舗未設定"}
                </div>
              </div>

              <div style={styles.heroDate}>
                {formatJapaneseDate(reservation.date)}
              </div>

              <div style={styles.mainTitle}>
                {trimmed(reservation.customer_name) || "顧客名未設定"}
              </div>

              <div style={styles.subLine}>
                {trimmed(reservation.menu) || "メニュー未設定"}
              </div>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>予約情報</h2>

              <div style={styles.infoList}>
                <InfoRow label="顧客名" value={trimmed(reservation.customer_name) || "—"} />
                <InfoRow label="担当スタッフ" value={trimmed(reservation.staff_name) || "—"} />
                <InfoRow label="メニュー" value={trimmed(reservation.menu) || "—"} />
                <InfoRow label="支払方法" value={trimmed(reservation.payment_method) || "—"} />
                <InfoRow label="店舗" value={trimmed(reservation.store_name) || "—"} />
                <InfoRow label="作成日時" value={formatDateTime(reservation.created_at)} />
              </div>

              <div style={styles.memoBlock}>
                <div style={styles.memoLabel}>メモ</div>
                <div style={styles.memoValue}>
                  {trimmed(reservation.memo) || "メモはありません。"}
                </div>
              </div>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>顧客情報</h2>

              <div style={styles.infoList}>
                <InfoRow
                  label="顧客ID"
                  value={
                    reservation.customer_id !== null &&
                    reservation.customer_id !== undefined
                      ? String(reservation.customer_id)
                      : "未連携"
                  }
                />
                <InfoRow label="氏名" value={customer?.name || trimmed(reservation.customer_name) || "—"} />
                <InfoRow label="かな" value={customer?.kana || "—"} />
                <InfoRow label="電話番号" value={customer?.phone || "—"} />
              </div>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>操作</h2>

              <div style={styles.actionGrid}>
                <button
                  type="button"
                  onClick={() => {
                    if (reservation.customer_id) {
                      router.push(`/customer/${reservation.customer_id}`);
                    } else {
                      setError("この予約は顧客詳細にまだ紐づいていません。");
                    }
                  }}
                  style={styles.primaryAction}
                >
                  顧客詳細へ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const query = new URLSearchParams({
                      reservationId: String(reservation.id),
                      customerId:
                        reservation.customer_id !== null &&
                        reservation.customer_id !== undefined
                          ? String(reservation.customer_id)
                          : "",
                      customerName: trimmed(reservation.customer_name),
                      date: trimmed(reservation.date),
                      menu: trimmed(reservation.menu),
                      staffName: trimmed(reservation.staff_name),
                      paymentMethod: trimmed(reservation.payment_method),
                    }).toString();

                    router.push(`/sales?${query}`);
                  }}
                  style={styles.darkAction}
                >
                  売上登録へ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (reservation.customer_id) {
                      router.push(
                        `/customer/${reservation.customer_id}?focus=tickets`
                      );
                    } else {
                      setError("この予約は回数券管理にまだ紐づいていません。");
                    }
                  }}
                  style={styles.lightAction}
                >
                  回数券確認
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    ...styles.deleteAction,
                    opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting ? "削除中..." : "予約を削除"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.infoRow}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 0,
  },
  mobileWrap: {
    maxWidth: 430,
    margin: "0 auto",
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "18px 14px 80px",
    display: "grid",
    gap: 14,
  },
  topCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    paddingTop: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "none",
    background: "#ffffff",
    color: "#111827",
    fontSize: 22,
    fontWeight: 700,
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
  },
  pageLabel: {
    fontSize: 11,
    letterSpacing: "0.12em",
    color: "#94a3b8",
    fontWeight: 800,
    marginBottom: 4,
  },
  pageTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
    color: "#111827",
  },
  heroCard: {
    background: "#ffffff",
    borderRadius: 28,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.07)",
    display: "grid",
    gap: 10,
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  timeWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  timeMain: {
    fontSize: 28,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1,
  },
  timeArrow: {
    fontSize: 18,
    fontWeight: 900,
    color: "#9ca3af",
  },
  timeSub: {
    fontSize: 20,
    fontWeight: 800,
    color: "#6b7280",
    lineHeight: 1,
  },
  storeBadge: {
    color: "#fff",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  heroDate: {
    fontSize: 15,
    fontWeight: 800,
    color: "#6b7280",
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.2,
  },
  subLine: {
    fontSize: 18,
    fontWeight: 700,
    color: "#374151",
  },
  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.07)",
    display: "grid",
    gap: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
    color: "#111827",
  },
  infoList: {
    display: "grid",
    gap: 10,
  },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: 10,
    alignItems: "start",
    paddingBottom: 10,
    borderBottom: "1px solid #f1f5f9",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#94a3b8",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.6,
    wordBreak: "break-word",
  },
  memoBlock: {
    background: "#f8fafc",
    borderRadius: 18,
    padding: 14,
    display: "grid",
    gap: 8,
  },
  memoLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#94a3b8",
    letterSpacing: "0.08em",
  },
  memoValue: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#374151",
    fontWeight: 700,
    whiteSpace: "pre-wrap",
  },
  actionGrid: {
    display: "grid",
    gap: 10,
  },
  primaryAction: {
    height: 52,
    borderRadius: 16,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontSize: 16,
    fontWeight: 900,
  },
  darkAction: {
    height: 52,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 900,
  },
  lightAction: {
    height: 52,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111827",
    fontSize: 16,
    fontWeight: 900,
  },
  deleteAction: {
    height: 52,
    borderRadius: 16,
    border: "1px solid rgba(239,68,68,0.18)",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: 16,
    fontWeight: 900,
  },
  emptyText: {
    padding: "20px 0",
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 800,
  },
  errorBox: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(254,242,242,0.98)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: 800,
  },
  successBox: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(240,253,244,0.98)",
    border: "1px solid rgba(34,197,94,0.18)",
    color: "#15803d",
    fontSize: 13,
    fontWeight: 800,
  },
};