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
  id: number | string;
  customer_id?: number | string | null;
  customer_name?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  store_name?: string | null;
  staff_name?: string | null;
  menu?: string | null;
  payment_method?: string | null;
  memo?: string | null;
  visit_type?: string | null;
  reservation_status?: string | null;
  is_first_visit?: boolean | null;
  created_at?: string | null;
};

type SaleRow = {
  id: number | string;
  reservation_id?: number | null;
  customer_id?: number | null;
  customer_name?: string | null;
  sale_date?: string | null;
  menu_type?: string | null;
  sale_type?: string | null;
  payment_method?: string | null;
  amount?: number | null;
  staff_name?: string | null;
  store_name?: string | null;
  memo?: string | null;
  created_at?: string | null;
};

type CounselingRow = {
  id: number | string;
  reservation_id?: number | null;
  created_at?: string | null;
};

type TicketUsageRow = {
  id: number | string;
  reservation_id?: number | null;
  ticket_id?: number | string | null;
  customer_id?: number | null;
  customer_name?: string | null;
  ticket_name?: string | null;
  service_type?: string | null;
  used_date?: string | null;
  unit_price?: number | null;
  before_count?: number | null;
  after_count?: number | null;
  created_at?: string | null;
};

type CustomerTicketRow = {
  id: number | string;
  customer_id?: number | string | null;
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

type TicketContractRow = {
  id: number | string;
  customer_id?: number | string | null;
  ticket_name?: string | null;
  remaining_count?: number | null;
  used_count?: number | null;
  prepaid_balance?: number | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TicketNumberingInfo = {
  label: string;
  isFinished: boolean;
  isWarning: boolean;
  total: number;
  remaining: number;
  usedDisplay: number;
  ticketName: string;
};

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatCurrency(value: number | null | undefined) {
  return `¥${Number(value || 0).toLocaleString()}`;
}

function formatDateJP(value?: string | null) {
  const v = trimmed(value);
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDateTimeJP(value?: string | null) {
  const v = trimmed(value);
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(
    d.getHours()
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getVisitTypeLabel(item?: ReservationRow | null) {
  if (!item) return "—";
  const visitType = trimmed(item.visit_type);
  if (visitType) return visitType;
  return item.is_first_visit ? "新規" : "再来";
}

function isNewVisit(item?: ReservationRow | null) {
  if (!item) return false;
  return getVisitTypeLabel(item) === "新規" || item.is_first_visit === true;
}

function isTicketMenu(menu?: string | null) {
  const text = trimmed(menu);
  if (!text) return false;

  if (text === "ストレッチ回数券" || text === "トレーニング回数券") return true;
  if (text.includes("回数券")) return true;

  const exactTicketNames = new Set([
    "40分4回_旧",
    "40分8回_旧",
    "40分12回_旧",
    "60分4回_旧",
    "60分8回_旧",
    "60分12回_旧",
    "80分4回_旧",
    "80分8回_旧",
    "80分12回_旧",
    "120分4回_旧",
    "120分8回_旧",
    "120分12回_旧",
    "40分4回_新",
    "40分8回_新",
    "40分12回_新",
    "60分4回_新",
    "60分8回_新",
    "60分12回_新",
    "80分4回_新",
    "80分8回_新",
    "80分12回_新",
    "120分4回_新",
    "120分8回_新",
    "120分12回_新",
    "ダイエット16回",
    "ゴールド24回",
    "プラチナ32回",
    "月2回",
    "月4回",
    "月8回",
  ]);

  return exactTicketNames.has(text);
}

function detectServiceTypeFromMenu(menu?: string | null) {
  const text = trimmed(menu);
  if (
    text.includes("40分") ||
    text.includes("60分") ||
    text.includes("80分") ||
    text.includes("120分") ||
    text.includes("ストレッチ")
  ) {
    return "ストレッチ";
  }
  return "トレーニング";
}

function getStaffColor(staffName?: string | null) {
  const name = trimmed(staffName);

  if (name.includes("山口")) return "#22c55e";
  if (name.includes("中西")) return "#ec4899";
  if (name.includes("池田")) return "#8b5e3c";
  if (name.includes("石川")) return "#2563eb";
  if (name.includes("羽田")) return "#ef4444";
  if (name.includes("菱谷")) return "#eab308";
  if (name.includes("井上")) return "#111827";
  if (name.includes("林")) return "#111827";

  return "#9ca3af";
}

function getStoreColor(storeName?: string | null) {
  const store = trimmed(storeName);

  if (store.includes("江戸堀")) return "#0ea5e9";
  if (store.includes("箕面")) return "#8b5cf6";
  if (store.includes("福島P")) return "#f97316";
  if (store.includes("福島")) return "#ef4444";
  if (store.includes("天満橋")) return "#14b8a6";
  if (store.includes("中崎町")) return "#eab308";
  if (store.includes("江坂")) return "#10b981";
  return "#6b7280";
}

function buildSalesHref(item: ReservationRow) {
  const reservationId = trimmed(item.id);
  const customerId = trimmed(item.customer_id);
  const customerName = trimmed(item.customer_name);
  const date = trimmed(item.date);
  const menu = trimmed(item.menu);
  const staffName = trimmed(item.staff_name);
  const paymentMethod = trimmed(item.payment_method);
  const storeName = trimmed(item.store_name);

  const isTicket = isTicketMenu(menu);
  const serviceType = detectServiceTypeFromMenu(menu);
  const saleType = isTicket ? "回数券消化" : "通常売上";

  const params = new URLSearchParams({
    reservationId,
    customerId,
    customerName,
    date,
    menu,
    staffName,
    paymentMethod,
    storeName,
    serviceType,
    saleType,
  });

  return `/sales?${params.toString()}`;
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
  const router = useRouter();
  const params = useParams();

  const reservationId = String(params?.id || "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reservation, setReservation] = useState<ReservationRow | null>(null);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [counselings, setCounselings] = useState<CounselingRow[]>([]);
  const [ticketUsages, setTicketUsages] = useState<TicketUsageRow[]>([]);
  const [customerTickets, setCustomerTickets] = useState<CustomerTicketRow[]>([]);
  const [ticketContracts, setTicketContracts] = useState<TicketContractRow[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loggedIn =
      localStorage.getItem("gymup_logged_in") ||
      localStorage.getItem("gymup_staff_logged_in") ||
      localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      router.push("/login/staff");
      return;
    }

    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, reservationId]);

  async function loadDetail() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      setLoading(false);
      return;
    }

    if (!reservationId) {
      setError("予約IDが取得できません。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const reservationIdNum = Number(reservationId);
      const reservationKey = Number.isFinite(reservationIdNum)
        ? reservationIdNum
        : reservationId;

      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .select(
          "id, customer_id, customer_name, date, start_time, end_time, store_name, staff_name, menu, payment_method, memo, visit_type, reservation_status, is_first_visit, created_at"
        )
        .eq("id", reservationKey)
        .maybeSingle();

      if (reservationError) throw reservationError;
      if (!reservationData) throw new Error("予約データが見つかりません。");

      const reservationRow = reservationData as ReservationRow;
      setReservation(reservationRow);

      const customerId = toNumberOrNull(reservationRow.customer_id);
      const serviceType = detectServiceTypeFromMenu(reservationRow.menu);
      const reservationIdValue = toNumberOrNull(reservationRow.id);

      const [
        { data: salesData, error: salesError },
        { data: counselingData, error: counselingError },
        { data: ticketUsageData, error: ticketUsageError },
        customerTicketsResult,
        ticketContractsResult,
      ] = await Promise.all([
        supabase
          .from("sales")
          .select(
            "id, reservation_id, customer_id, customer_name, sale_date, menu_type, sale_type, payment_method, amount, staff_name, store_name, memo, created_at"
          )
          .eq("reservation_id", reservationIdValue ?? -1)
          .order("created_at", { ascending: false }),

        supabase
          .from("counselings")
          .select("id, reservation_id, created_at")
          .eq("reservation_id", reservationIdValue ?? -1)
          .order("created_at", { ascending: false }),

        supabase
          .from("ticket_usages")
          .select(
            "id, reservation_id, ticket_id, customer_id, customer_name, ticket_name, service_type, used_date, unit_price, before_count, after_count, created_at"
          )
          .eq("reservation_id", reservationIdValue ?? -1)
          .order("created_at", { ascending: false }),

        customerId
          ? supabase
              .from("customer_tickets")
              .select(
                "id, customer_id, customer_name, ticket_name, service_type, total_count, remaining_count, purchase_date, expiry_date, status, note, created_at"
              )
              .eq("customer_id", customerId)
              .eq("service_type", serviceType)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),

        customerId
          ? supabase
              .from("ticket_contracts")
              .select(
                "id, customer_id, ticket_name, remaining_count, used_count, prepaid_balance, status, created_at, updated_at"
              )
              .eq("customer_id", customerId)
              .order("updated_at", { ascending: false })
              .order("id", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (salesError) throw salesError;
      if (counselingError) throw counselingError;
      if (ticketUsageError) throw ticketUsageError;
      if (customerTicketsResult.error) throw customerTicketsResult.error;
      if (ticketContractsResult.error) throw ticketContractsResult.error;

      setSales((salesData as SaleRow[]) || []);
      setCounselings((counselingData as CounselingRow[]) || []);
      setTicketUsages((ticketUsageData as TicketUsageRow[]) || []);
      setCustomerTickets((customerTicketsResult.data as CustomerTicketRow[]) || []);
      setTicketContracts((ticketContractsResult.data as TicketContractRow[]) || []);
    } catch (e) {
      console.error(e);
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function restoreTicketContractsFromUsages(usages: TicketUsageRow[]) {
    if (!supabase || usages.length === 0) return;

    for (const usage of usages) {
      const ticketId = toNumberOrNull(usage.ticket_id);
      if (!ticketId) continue;

      const { data: contractRow, error: contractFetchError } = await supabase
        .from("ticket_contracts")
        .select("id, used_count, remaining_count, prepaid_balance")
        .eq("id", ticketId)
        .maybeSingle();

      if (contractFetchError) throw contractFetchError;
      if (!contractRow) continue;

      const currentUsed = Number(
        (contractRow as { used_count?: number | null }).used_count || 0
      );
      const currentRemaining = Number(
        (contractRow as { remaining_count?: number | null }).remaining_count || 0
      );
      const currentBalance = Number(
        (contractRow as { prepaid_balance?: number | null }).prepaid_balance || 0
      );
      const restorePrice = Number(usage.unit_price || 0);
      const beforeCount = toNumberOrNull(usage.before_count);

      const nextRemaining = beforeCount !== null ? beforeCount : currentRemaining + 1;
      const nextUsed = Math.max(currentUsed - 1, 0);

      const { error: contractUpdateError } = await supabase
        .from("ticket_contracts")
        .update({
          used_count: nextUsed,
          remaining_count: nextRemaining,
          prepaid_balance: currentBalance + restorePrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (contractUpdateError) throw contractUpdateError;
    }
  }

  async function restoreCustomerTicketsFromUsages(usages: TicketUsageRow[]) {
    if (!supabase || usages.length === 0) return;

    for (const usage of usages) {
      const ticketId = toNumberOrNull(usage.ticket_id);
      if (!ticketId) continue;

      const { data: ticketData, error: ticketFetchError } = await supabase
        .from("customer_tickets")
        .select("id, remaining_count, status")
        .eq("id", ticketId)
        .maybeSingle();

      if (ticketFetchError) throw ticketFetchError;
      if (!ticketData) continue;

      const currentRemaining = Number(
        (ticketData as { remaining_count?: number | null }).remaining_count || 0
      );
      const beforeCount = toNumberOrNull(usage.before_count);
      const nextRemaining = beforeCount !== null ? beforeCount : currentRemaining + 1;
      const nextStatus = nextRemaining > 0 ? "利用中" : "消化済み";

      const { error: ticketUpdateError } = await supabase
        .from("customer_tickets")
        .update({
          remaining_count: nextRemaining,
          status: nextStatus,
        })
        .eq("id", ticketId);

      if (ticketUpdateError) throw ticketUpdateError;
    }
  }
    async function handleDeleteReservation() {
    if (!supabase || !reservation) return;

    const reservationIdNum = toNumberOrNull(reservation.id);
    if (reservationIdNum === null) {
      setError("予約IDが不正です。");
      return;
    }

    const warnings: string[] = [];
    if (sales.length > 0) warnings.push(`売上 ${sales.length}件`);
    if (counselings.length > 0) warnings.push(`カウンセリング ${counselings.length}件`);
    if (ticketUsages.length > 0) warnings.push(`回数券消化履歴 ${ticketUsages.length}件`);

    const warningText =
      warnings.length > 0
        ? `この予約には関連データがあります。\n${warnings.join(
            "\n"
          )}\n\n関連データも含めて削除し、回数券消化があれば残回数も戻します。\n本当に削除しますか？`
        : "この予約を削除しますか？";

    const ok = window.confirm(warningText);
    if (!ok) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      if (ticketUsages.length > 0) {
        try {
          await restoreTicketContractsFromUsages(ticketUsages);
        } catch (e) {
          throw new Error(`ticket_contracts の復元で失敗: ${extractErrorMessage(e)}`);
        }

        try {
          await restoreCustomerTicketsFromUsages(ticketUsages);
        } catch (e) {
          console.warn("customer_tickets restore skipped:", e);
        }
      }

      try {
        const { error } = await supabase
          .from("ticket_usages")
          .delete()
          .eq("reservation_id", reservationIdNum);
        if (error) throw error;
      } catch (e) {
        throw new Error(`ticket_usages の削除で失敗: ${extractErrorMessage(e)}`);
      }

      try {
        const { error } = await supabase
          .from("sales")
          .delete()
          .eq("reservation_id", reservationIdNum);
        if (error) throw error;
      } catch (e) {
        throw new Error(`sales の削除で失敗: ${extractErrorMessage(e)}`);
      }

      try {
        const { error } = await supabase
          .from("counselings")
          .delete()
          .eq("reservation_id", reservationIdNum);
        if (error) throw error;
      } catch (e) {
        throw new Error(`counselings の削除で失敗: ${extractErrorMessage(e)}`);
      }

      try {
        const { error } = await supabase
          .from("reservations")
          .delete()
          .eq("id", reservationIdNum);
        if (error) throw error;
      } catch (e) {
        throw new Error(`reservations の削除で失敗: ${extractErrorMessage(e)}`);
      }

      window.alert("予約を削除しました");
      router.push("/reservation");
    } catch (e) {
      console.error(e);
      setError(`予約削除エラー: ${extractErrorMessage(e)}`);
    } finally {
      setDeleting(false);
    }
  }

  const isSold = useMemo(() => {
    if (!reservation) return false;
    return trimmed(reservation.reservation_status) === "売上済" || sales.length > 0;
  }, [reservation, sales]);

  const isCounseled = useMemo(() => counselings.length > 0, [counselings]);
  const isTicketReservation = useMemo(() => isTicketMenu(reservation?.menu), [reservation]);
  const isTicketUsed = useMemo(() => ticketUsages.length > 0, [ticketUsages]);
  const serviceType = useMemo(() => detectServiceTypeFromMenu(reservation?.menu), [reservation]);

  const activeTicket = useMemo(() => {
    const contract = ticketContracts.find((ticket) => Number(ticket.remaining_count || 0) > 0);
    if (contract) {
      return {
        ticket_name: contract.ticket_name,
        remaining_count: contract.remaining_count,
      };
    }

    const legacy = customerTickets.find((ticket) => Number(ticket.remaining_count || 0) > 0);
    if (legacy) {
      return {
        ticket_name: legacy.ticket_name,
        remaining_count: legacy.remaining_count,
      };
    }

    return null;
  }, [ticketContracts, customerTickets]);

  const ticketNumbering = useMemo<TicketNumberingInfo | null>(() => {
    if (!reservation) return null;
    if (!isTicketReservation) return null;

    const contract = ticketContracts.find((item) => {
      const remaining = Number(item.remaining_count || 0);
      const used = Number(item.used_count || 0);
      return remaining + used > 0;
    });

    if (contract) {
      const usedCount = Math.max(Number(contract.used_count || 0), 0);
      const remaining = Math.max(Number(contract.remaining_count || 0), 0);
      const total = usedCount + remaining;
      if (total <= 0) return null;

      const isUsedThisReservation = ticketUsages.some(
        (u) => String(u.reservation_id) === String(reservation.id)
      );

      const usedDisplay = isUsedThisReservation
        ? Math.min(usedCount, total)
        : Math.min(usedCount + 1, total);

      return {
        label: `${total}-${Math.max(usedDisplay, 1)}`,
        isFinished: usedDisplay >= total,
        isWarning: usedDisplay === total - 1,
        total,
        remaining,
        usedDisplay,
        ticketName: trimmed(contract.ticket_name) || "回数券",
      };
    }

    const customerId = trimmed(reservation.customer_id);
    if (!customerId) return null;

    const serviceTypeKey = detectServiceTypeFromMenu(reservation.menu);

    const filtered = customerTickets
      .filter((ticket) => {
        const ticketCustomerId = trimmed(ticket.customer_id);
        const ticketServiceType = trimmed(ticket.service_type);
        return (
          ticketCustomerId === customerId &&
          (!ticketServiceType || ticketServiceType === serviceTypeKey)
        );
      })
      .sort((a, b) => {
        const aRemaining = Number(a.remaining_count || 0);
        const bRemaining = Number(b.remaining_count || 0);
        if (bRemaining !== aRemaining) return bRemaining - aRemaining;

        const aCreated = new Date(trimmed(a.created_at) || 0).getTime();
        const bCreated = new Date(trimmed(b.created_at) || 0).getTime();
        return bCreated - aCreated;
      });

    if (filtered.length === 0) return null;

    const ticket = filtered[0];
    const total = Number(ticket.total_count || 0);
    const remaining = Number(ticket.remaining_count || 0);

    if (total <= 0) return null;

    const isUsedThisReservation = ticketUsages.some(
      (u) => String(u.reservation_id) === String(reservation.id)
    );

    const usedDisplay = isUsedThisReservation
      ? total - remaining
      : total - remaining + 1;

    return {
      label: `${total}-${Math.min(Math.max(usedDisplay, 1), total)}`,
      isFinished: usedDisplay >= total,
      isWarning: usedDisplay === total - 1,
      total,
      remaining,
      usedDisplay,
      ticketName: trimmed(ticket.ticket_name) || "回数券",
    };
  }, [reservation, isTicketReservation, ticketContracts, customerTickets, ticketUsages]);

  const pendingFlags = useMemo(() => {
    return {
      salesPending: !isSold,
      counselingPending: isNewVisit(reservation) && !isCounseled,
      ticketPending: isTicketReservation && !isTicketUsed,
    };
  }, [isSold, isCounseled, isTicketReservation, isTicketUsed, reservation]);

  if (!mounted) return null;

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <section style={styles.heroCard}>
          <div style={styles.heroTop}>
            <div>
              <div style={styles.eyebrow}>GYMUP CRM</div>
              <h1 style={styles.title}>予約詳細</h1>
              <div style={styles.subTitle}>予約・売上・回数券・カウンセリングの司令塔</div>
            </div>

            <div style={styles.topActions}>
              <button
                type="button"
                onClick={() => router.push("/reservation")}
                style={styles.darkBtn}
              >
                予約一覧へ
              </button>

              <button type="button" onClick={() => router.back()} style={styles.subBtn}>
                戻る
              </button>

              {reservation ? (
                <Link href={`/reservation/edit/${reservation.id}`} style={styles.editLink}>
                  編集
                </Link>
              ) : null}

              {reservation?.customer_id ? (
                <Link href={`/customer/${reservation.customer_id}`} style={styles.customerLink}>
                  顧客
                </Link>
              ) : null}

              <button
                type="button"
                onClick={handleDeleteReservation}
                disabled={deleting || !reservation}
                style={{
                  ...styles.deleteBtn,
                  opacity: deleting ? 0.7 : 1,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>

          {error ? <div style={styles.errorBox}>{error}</div> : null}
          {success ? <div style={styles.successBox}>{success}</div> : null}
        </section>

        {loading ? (
          <section style={styles.card}>
            <div style={styles.emptyBox}>読み込み中...</div>
          </section>
        ) : !reservation ? (
          <section style={styles.card}>
            <div style={styles.emptyBox}>予約データがありません。</div>
          </section>
        ) : (
          <>
            <section style={styles.statusGrid}>
              <div style={styles.statusCard}>
                <div style={styles.statusLabel}>売上状態</div>
                <div style={isSold ? styles.statusDone : styles.statusPending}>
                  {isSold ? "売上済" : "売上未"}
                </div>
              </div>

              <div style={styles.statusCard}>
                <div style={styles.statusLabel}>カウンセリング</div>
                <div
                  style={
                    isNewVisit(reservation)
                      ? isCounseled
                        ? styles.statusDoneBlue
                        : styles.statusPendingYellow
                      : styles.statusNeutral
                  }
                >
                  {isNewVisit(reservation)
                    ? isCounseled
                      ? "カウンセリング済"
                      : "カウンセリング未"
                    : "対象外"}
                </div>
              </div>

              <div style={styles.statusCard}>
                <div style={styles.statusLabel}>回数券状態</div>
                <div
                  style={
                    isTicketReservation
                      ? isTicketUsed
                        ? styles.statusDonePurple
                        : styles.statusPendingPurple
                      : styles.statusNeutral
                  }
                >
                  {isTicketReservation
                    ? isTicketUsed
                      ? "回数券消化済"
                      : "回数券未消化"
                    : "通常予約"}
                </div>
              </div>

              <div style={styles.statusCard}>
                <div style={styles.statusLabel}>未処理</div>
                <div
                  style={
                    pendingFlags.salesPending ||
                    pendingFlags.counselingPending ||
                    pendingFlags.ticketPending
                      ? styles.statusPending
                      : styles.statusDone
                  }
                >
                  {pendingFlags.salesPending ||
                  pendingFlags.counselingPending ||
                  pendingFlags.ticketPending
                    ? "あり"
                    : "なし"}
                </div>
              </div>
            </section>

            <section
              style={{
                ...styles.actionPanel,
                border:
                  pendingFlags.salesPending ||
                  pendingFlags.counselingPending ||
                  pendingFlags.ticketPending
                    ? "2px solid #ef4444"
                    : "1px solid #e2e8f0",
              }}
            >
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>すぐやる操作</h2>
              </div>

              <div style={styles.actionGrid}>
                <button
                  type="button"
                  onClick={() => router.push(buildSalesHref(reservation))}
                  style={styles.actionBlue}
                >
                  {isTicketReservation ? "回数券消化へ" : "売上登録へ"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!reservation.customer_id) {
                      window.alert("customer_id がありません");
                      return;
                    }
                    router.push(`/customer/${reservation.customer_id}`);
                  }}
                  style={styles.actionCustomer}
                >
                  顧客マイページへ
                </button>

                {isNewVisit(reservation) ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!reservation.customer_id) {
                        window.alert("customer_id がありません");
                        return;
                      }
                      router.push(
                        `/customer/${reservation.customer_id}/counseling?reservationId=${reservation.id}`
                      );
                    }}
                    style={styles.actionOrange}
                  >
                    カウンセリングへ
                  </button>
                ) : (
                  <button type="button" disabled style={styles.actionDisabled}>
                    カウンセリング対象外
                  </button>
                )}

                <Link href={`/reservation/edit/${reservation.id}`} style={styles.actionEdit}>
                  予約編集
                </Link>

                <button
                  type="button"
                  onClick={handleDeleteReservation}
                  disabled={deleting}
                  style={{
                    ...styles.actionDelete,
                    opacity: deleting ? 0.7 : 1,
                    cursor: deleting ? "not-allowed" : "pointer",
                  }}
                >
                  {deleting ? "削除中..." : "予約削除"}
                </button>
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>予約情報</h2>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>予約ID</span>
                  <span style={styles.infoValue}>{String(reservation.id)}</span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>日付</span>
                  <span style={styles.infoValue}>{formatDateJP(reservation.date)}</span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>時間</span>
                  <span style={styles.infoValue}>
                    {trimmed(reservation.start_time) || "--:--"}
                    {trimmed(reservation.end_time) ? ` 〜 ${trimmed(reservation.end_time)}` : ""}
                  </span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>顧客</span>
                  <div style={styles.customerValueWrap}>
                    <span style={styles.infoValue}>
                      {trimmed(reservation.customer_name) || "未設定"}
                    </span>

                    {ticketNumbering ? (
                      <span
                        style={{
                          ...styles.ticketNumberBadge,
                          background: ticketNumbering.isFinished
                            ? "#fee2e2"
                            : ticketNumbering.isWarning
                            ? "#fef3c7"
                            : "#fff7ed",
                          color: ticketNumbering.isFinished
                            ? "#dc2626"
                            : ticketNumbering.isWarning
                            ? "#b45309"
                            : "#c2410c",
                          borderColor: ticketNumbering.isFinished
                            ? "#ef4444"
                            : ticketNumbering.isWarning
                            ? "#f59e0b"
                            : "#fb923c",
                        }}
                      >
                        {ticketNumbering.label}
                      </span>
                    ) : null}

                    {ticketNumbering?.isFinished ? (
                      <span style={styles.renewAlertBadge}>更新</span>
                    ) : null}
                  </div>

                  {ticketNumbering?.isFinished ? (
                    <div style={styles.renewMessageInline}>
                      回数券が満了です。支払い更新の案内が必要です。
                    </div>
                  ) : ticketNumbering?.isWarning ? (
                    <div style={styles.warningMessageInline}>
                      次回で満了予定です。更新案内の準備をおすすめします。
                    </div>
                  ) : null}
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>来店区分</span>
                  <span style={styles.infoValue}>{getVisitTypeLabel(reservation)}</span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>メニュー</span>
                  <span style={styles.infoValue}>{trimmed(reservation.menu) || "未設定"}</span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>店舗</span>
                  <span
                    style={{
                      ...styles.infoValueBadge,
                      background: getStoreColor(reservation.store_name),
                    }}
                  >
                    {trimmed(reservation.store_name) || "未設定"}
                  </span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>担当</span>
                  <span
                    style={{
                      ...styles.infoValueBadge,
                      background: getStaffColor(reservation.staff_name),
                    }}
                  >
                    {trimmed(reservation.staff_name) || "未設定"}
                  </span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>支払方法</span>
                  <span style={styles.infoValue}>
                    {trimmed(reservation.payment_method) || "未設定"}
                  </span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>予約ステータス</span>
                  <span style={styles.infoValue}>
                    {trimmed(reservation.reservation_status) || "未設定"}
                  </span>
                </div>
              </div>

              {trimmed(reservation.memo) ? (
                <div style={styles.memoBox}>
                  <div style={styles.memoTitle}>メモ</div>
                  <div style={styles.memoText}>{trimmed(reservation.memo)}</div>
                </div>
              ) : null}
            </section>

            <section
              style={{
                ...styles.card,
                border:
                  pendingFlags.salesPending ? "2px solid #ef4444" : "1px solid #e2e8f0",
              }}
            >
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>売上情報</h2>
                <button
                  type="button"
                  onClick={() => router.push(buildSalesHref(reservation))}
                  style={styles.inlineBlueBtn}
                >
                  {isTicketReservation ? "回数券消化へ" : "売上登録へ"}
                </button>
              </div>

              {sales.length === 0 ? (
                <div style={styles.emptyBox}>この予約に紐づく売上はまだありません。</div>
              ) : (
                <div style={styles.listGrid}>
                  {sales.map((sale) => (
                    <div key={String(sale.id)} style={styles.listCard}>
                      <div style={styles.listTop}>
                        <div>
                          <div style={styles.listMain}>
                            {trimmed(sale.customer_name) || "未設定"}
                          </div>
                          <div style={styles.listSub}>
                            {formatDateJP(sale.sale_date)} / {trimmed(sale.sale_type) || "未設定"}
                          </div>
                        </div>

                        <div style={styles.amountText}>{formatCurrency(sale.amount)}</div>
                      </div>

                      <div style={styles.metaWrap}>
                        <span style={styles.metaChip}>
                          区分: {trimmed(sale.menu_type) || "未設定"}
                        </span>
                        <span style={styles.metaChip}>
                          支払: {trimmed(sale.payment_method) || "未設定"}
                        </span>
                        <span style={styles.metaChip}>
                          担当: {trimmed(sale.staff_name) || "未設定"}
                        </span>
                      </div>

                      {trimmed(sale.memo) ? (
                        <div style={styles.noteBox}>{trimmed(sale.memo)}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section
              style={{
                ...styles.card,
                border:
                  pendingFlags.counselingPending ? "2px solid #f59e0b" : "1px solid #e2e8f0",
              }}
            >
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>カウンセリング</h2>

                {isNewVisit(reservation) ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!reservation.customer_id) {
                        window.alert("customer_id がありません");
                        return;
                      }
                      router.push(
                        `/customer/${reservation.customer_id}/counseling?reservationId=${reservation.id}`
                      );
                    }}
                    style={styles.inlineOrangeBtn}
                  >
                    カウンセリングへ
                  </button>
                ) : null}
              </div>

              {!isNewVisit(reservation) ? (
                <div style={styles.emptyBox}>この予約はカウンセリング対象外です。</div>
              ) : counselings.length === 0 ? (
                <div style={styles.emptyBox}>まだカウンセリング入力はありません。</div>
              ) : (
                <div style={styles.listGrid}>
                  {counselings.map((item) => (
                    <div key={String(item.id)} style={styles.listCard}>
                      <div style={styles.listMain}>カウンセリング済</div>
                      <div style={styles.listSub}>
                        入力日時: {formatDateTimeJP(item.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section
              style={{
                ...styles.card,
                border:
                  pendingFlags.ticketPending ? "2px solid #7c3aed" : "1px solid #e2e8f0",
              }}
            >
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>回数券情報</h2>

                {isTicketReservation ? (
                  <button
                    type="button"
                    onClick={() => router.push(buildSalesHref(reservation))}
                    style={styles.inlinePurpleBtn}
                  >
                    回数券消化へ
                  </button>
                ) : null}
              </div>

              {!isTicketReservation ? (
                <div style={styles.emptyBox}>この予約は回数券予約ではありません。</div>
              ) : (
                <>
                  <div style={styles.ticketSummary}>
                    <div style={styles.ticketSummaryItem}>
                      <span style={styles.ticketSummaryLabel}>対象サービス</span>
                      <span style={styles.ticketSummaryValue}>{serviceType}</span>
                    </div>
                    <div style={styles.ticketSummaryItem}>
                      <span style={styles.ticketSummaryLabel}>利用可能回数券</span>
                      <span style={styles.ticketSummaryValue}>
                        {activeTicket
                          ? `${trimmed(activeTicket.ticket_name) || "回数券"} / 残${Number(
                              activeTicket.remaining_count || 0
                            )}回`
                          : "なし"}
                      </span>
                    </div>
                  </div>

                  {ticketContracts.length > 0 ? (
                    <>
                      <div style={styles.subSectionTitle}>契約回数券一覧</div>
                      <div style={styles.listGrid}>
                        {ticketContracts.map((ticket) => {
                          const remaining = Number(ticket.remaining_count || 0);
                          const used = Number(ticket.used_count || 0);
                          const total = remaining + used;
                          return (
                            <div key={String(ticket.id)} style={styles.listCard}>
                              <div style={styles.listTop}>
                                <div>
                                  <div style={styles.listMain}>
                                    {trimmed(ticket.ticket_name) || "回数券"}
                                  </div>
                                  <div style={styles.listSub}>
                                    総数 {total}回 / 使用 {used}回
                                  </div>
                                </div>

                                <div
                                  style={
                                    remaining > 0
                                      ? styles.ticketRemain
                                      : styles.ticketEmpty
                                  }
                                >
                                  残{remaining}回
                                </div>
                              </div>

                              <div style={styles.metaWrap}>
                                <span style={styles.metaChip}>
                                  状態: {trimmed(ticket.status) || "未設定"}
                                </span>
                                <span style={styles.metaChip}>
                                  前受金残: {formatCurrency(ticket.prepaid_balance)}
                                </span>
                                <span style={styles.metaChip}>
                                  更新日: {formatDateTimeJP(ticket.updated_at || ticket.created_at)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : null}

                  <div style={styles.subSectionTitle}>顧客の回数券一覧</div>

                  {customerTickets.length === 0 ? (
                    <div style={styles.emptyBox}>対象の回数券がありません。</div>
                  ) : (
                    <div style={styles.listGrid}>
                      {customerTickets.map((ticket) => (
                        <div key={String(ticket.id)} style={styles.listCard}>
                          <div style={styles.listTop}>
                            <div>
                              <div style={styles.listMain}>
                                {trimmed(ticket.ticket_name) || "回数券"}
                              </div>
                              <div style={styles.listSub}>
                                {trimmed(ticket.service_type) || "未設定"}
                              </div>
                            </div>

                            <div
                              style={
                                Number(ticket.remaining_count || 0) > 0
                                  ? styles.ticketRemain
                                  : styles.ticketEmpty
                              }
                            >
                              残{Number(ticket.remaining_count || 0)}回
                            </div>
                          </div>

                          <div style={styles.metaWrap}>
                            <span style={styles.metaChip}>
                              合計: {Number(ticket.total_count || 0)}回
                            </span>
                            <span style={styles.metaChip}>
                              状態: {trimmed(ticket.status) || "未設定"}
                            </span>
                            <span style={styles.metaChip}>
                              購入日: {formatDateJP(ticket.purchase_date)}
                            </span>
                            <span style={styles.metaChip}>
                              期限: {formatDateJP(ticket.expiry_date)}
                            </span>
                          </div>

                          {trimmed(ticket.note) ? (
                            <div style={styles.noteBox}>{trimmed(ticket.note)}</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={styles.subSectionTitle}>この予約の消化履歴</div>

                  {ticketUsages.length === 0 ? (
                    <div style={styles.emptyBox}>まだ回数券消化履歴はありません。</div>
                  ) : (
                    <div style={styles.listGrid}>
                      {ticketUsages.map((usage) => (
                        <div key={String(usage.id)} style={styles.listCard}>
                          <div style={styles.listTop}>
                            <div>
                              <div style={styles.listMain}>
                                {trimmed(usage.ticket_name) || "回数券"}
                              </div>
                              <div style={styles.listSub}>
                                {trimmed(usage.service_type) || "未設定"} /{" "}
                                {formatDateJP(usage.used_date)}
                              </div>
                            </div>

                            <div style={styles.usageCountText}>
                              {Number(usage.before_count ?? 0)} → {Number(usage.after_count ?? 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    padding: "18px 12px 40px",
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gap: 14,
  },
  heroCard: {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.1,
    color: "#0f172a",
    fontWeight: 900,
  },
  subTitle: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    fontWeight: 700,
  },
  topActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  darkBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  subBtn: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  editLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
  },
  customerLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    border: "none",
    background: "linear-gradient(135deg, #111827, #374151)",
    color: "#fff",
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
  },
  deleteBtn: {
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
  },
  errorBox: {
    marginTop: 14,
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 13,
  },
  successBox: {
    marginTop: 14,
    background: "#dcfce7",
    color: "#166534",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 13,
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  statusCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
  },
  statusLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 800,
    marginBottom: 8,
  },
  statusDone: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
  },
  statusPending: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
  },
  statusDoneBlue: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
  },
  statusPendingYellow: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
  },
  statusDonePurple: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e9d5ff",
    color: "#6d28d9",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
  },
  statusPendingPurple: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3e8ff",
    color: "#7c3aed",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
  },
  statusNeutral: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
  },
  actionPanel: {
    background: "#fff",
    borderRadius: 22,
    padding: 16,
    boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: "#0f172a",
  },
  actionGrid: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  actionBlue: {
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    borderRadius: 14,
    padding: "11px 16px",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
  },
  actionCustomer: {
    border: "none",
    background: "linear-gradient(135deg, #111827, #374151)",
    color: "#fff",
    borderRadius: 14,
    padding: "11px 16px",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
  },
  actionOrange: {
    border: "none",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    borderRadius: 14,
    padding: "11px 16px",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
  },
  actionDisabled: {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#94a3b8",
    borderRadius: 14,
    padding: "11px 16px",
    fontWeight: 900,
    fontSize: 13,
    cursor: "not-allowed",
  },
  actionEdit: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    border: "none",
    background: "linear-gradient(135deg, #0f766e, #0d9488)",
    color: "#fff",
    borderRadius: 14,
    padding: "11px 16px",
    fontWeight: 900,
    fontSize: 13,
  },
  actionDelete: {
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    borderRadius: 14,
    padding: "11px 16px",
    fontWeight: 900,
    fontSize: 13,
  },
  card: {
    background: "#fff",
    borderRadius: 22,
    padding: 16,
    boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
  },
  emptyBox: {
    background: "#f8fafc",
    borderRadius: 16,
    padding: "18px 14px",
    color: "#64748b",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  infoItem: {
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    display: "grid",
    gap: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 800,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: 800,
    lineHeight: 1.6,
  },
  customerValueWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  ticketNumberBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 900,
    border: "2px solid",
    lineHeight: 1,
  },
  renewAlertBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dc2626",
    color: "#fff",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 900,
    lineHeight: 1,
  },
  renewMessageInline: {
    marginTop: 6,
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.6,
  },
  warningMessageInline: {
    marginTop: 6,
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.6,
  },
  infoValueBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 900,
    width: "fit-content",
  },
  memoBox: {
    marginTop: 14,
    background: "#f8fafc",
    borderRadius: 14,
    padding: 14,
  },
  memoTitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    marginBottom: 8,
  },
  memoText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
    fontWeight: 700,
  },
  listGrid: {
    display: "grid",
    gap: 10,
  },
  listCard: {
    background: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    border: "1px solid #e2e8f0",
  },
  listTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  listMain: {
    fontSize: 18,
    color: "#111827",
    fontWeight: 900,
    marginBottom: 4,
  },
  listSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
  amountText: {
    fontSize: 20,
    color: "#111827",
    fontWeight: 900,
  },
  usageCountText: {
    fontSize: 18,
    color: "#6d28d9",
    fontWeight: 900,
  },
  metaWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  metaChip: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    color: "#334155",
    padding: "7px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },
  noteBox: {
    marginTop: 12,
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    color: "#334155",
    fontSize: 12,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    fontWeight: 700,
  },
  inlineBlueBtn: {
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
  },
  inlineOrangeBtn: {
    border: "none",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
  },
  inlinePurpleBtn: {
    border: "none",
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
  },
  ticketSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 14,
  },
  ticketSummaryItem: {
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    display: "grid",
    gap: 6,
  },
  ticketSummaryLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 800,
  },
  ticketSummaryValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: 900,
  },
  subSectionTitle: {
    fontSize: 14,
    color: "#111827",
    fontWeight: 900,
    marginBottom: 10,
    marginTop: 6,
  },
  ticketRemain: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 900,
  },
  ticketEmpty: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 900,
  },
};