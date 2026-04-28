"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type ReservationRow = {
  id: string | number;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  customer_id?: string | number | null;
  customer_name?: string | null;
  menu?: string | null;
  staff_name?: string | null;
  store_name?: string | null;
  memo?: string | null;
  visit_type?: string | null;
  reservation_status?: string | null;
  is_first_visit?: boolean | null;
  created_at?: string | null;
};

type CustomerRow = {
  id: string | number;
  name?: string | null;
  customer_name?: string | null;
  plan_type?: string | null;
  created_at?: string | null;
};

type SaleRow = {
  id: string | number;
  reservation_id?: string | number | null;
  customer_id?: string | number | null;
  customer_name?: string | null;
  amount?: number | null;
  sale_date?: string | null;
  sale_type?: string | null;
  menu_type?: string | null;
  payment_method?: string | null;
  created_at?: string | null;
};

type TicketUsageRow = {
  id: string | number;
  reservation_id?: string | number | null;
  ticket_id?: string | number | null;
  customer_id?: string | number | null;
  before_count?: number | null;
  after_count?: number | null;
  created_at?: string | null;
};

type CounselingRow = {
  id: string | number;
  reservation_id?: string | number | null;
  customer_id?: string | number | null;
  created_at?: string | null;
};

type TicketContractRow = {
  id: string | number;
  customer_id?: string | number | null;
  ticket_name?: string | null;
  remaining_count?: number | null;
  used_count?: number | null;
  prepaid_balance?: number | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DashboardReservation = {
  id: string;
  date: string;
  time: string;
  endTime: string;
  customerId: string;
  customerName: string;
  menu: string;
  staffName: string;
  storeName: string;
  memo: string;
  visitType: string;
  reservationStatus: string;
  isTicket: boolean;
  isSold: boolean;
  isTicketUsed: boolean;
  isCounseled: boolean;
  ticketName: string;
  remainingCount: number | null;
};

type TodoItem = {
  id: string;
  type: "sales" | "ticket" | "counseling" | "ticket-warning";
  title: string;
  sub: string;
  href: string;
  customerHref?: string;
  level: "red" | "orange" | "purple" | "green";
};

type LtvCustomer = {
  customerId: string;
  customerName: string;
  amount: number;
  count: number;
};

type SystemStatus = "ONLINE" | "FALLBACK" | "OFFLINE";

type DashboardStats = {
  todayReservationCount: number;
  todaySalesAmount: number | null;
  todayTodoCount: number;
  todayUnsoldCount: number;
  todayTicketPendingCount: number;
  todayCounselingPendingCount: number;
  monthSalesAmount: number | null;
  prevMonthSalesAmount: number | null;
  monthNewCustomers: number | null;
  customerCount: number | null;
  lowTicketCount: number;
};

const AUTH_STORAGE_KEY = "gymup_logged_in";
const ROLE_STORAGE_KEY = "gymup_user_role";
const STAFF_NAME_STORAGE_KEY = "gymup_current_staff_name";

const quickLinks = [
  { title: "予約管理", href: "/reservation", desc: "月表示・日別シート・予約追加" },
  { title: "顧客管理", href: "/customer", desc: "LTV・来店履歴・回数券残" },
  { title: "売上管理", href: "/sales", desc: "通常売上・回数券消化・前受金" },
  { title: "会計管理", href: "/accounting", desc: "会計区分・月次集計・前受金" },
  { title: "回数券購入", href: "/ticket-contracts", desc: "契約回数券・前受金登録" },
  { title: "勤怠管理", href: "/attendance", desc: "出勤・給与・スタッフ管理" },
  { title: "食事管理", href: "/meal", desc: "食事投稿・フィードバック" },
  { title: "アカウント", href: "/account", desc: "店舗・スタッフ・設定" },
];

const TICKET_UNIT_PRICES: Record<string, number> = {
  "40分4回_旧": 5330,
  "40分8回_旧": 5090,
  "40分12回_旧": 5000,
  "60分4回_旧": 7980,
  "60分8回_旧": 7640,
  "60分12回_旧": 7500,
  "80分4回_旧": 10670,
  "80分8回_旧": 10180,
  "80分12回_旧": 10000,
  "120分4回_旧": 16000,
  "120分8回_旧": 15270,
  "120分12回_旧": 15000,
  "40分4回_新": 5330,
  "40分8回_新": 5090,
  "40分12回_新": 5000,
  "60分4回_新": 7980,
  "60分8回_新": 7640,
  "60分12回_新": 7500,
  "80分4回_新": 10670,
  "80分8回_新": 10180,
  "80分12回_新": 10000,
  "120分4回_新": 16000,
  "120分8回_新": 15270,
  "120分12回_新": 15000,
  "ダイエット16回": 11000,
  "ゴールド24回": 10450,
  "プラチナ32回": 10230,
  "月2回": 8800,
  "月4回": 8470,
  "月8回": 8250,
};

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    return createClient(url, anonKey);
  } catch (error) {
    console.error("Supabase client create error:", error);
    return null;
  }
}

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatYen(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `¥${value.toLocaleString()}`;
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDateString(dateString: string, diffDays: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + diffDays);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getMonthRange(dateString: string) {
  const base = new Date(`${dateString}T00:00:00`);
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);

  const toDate = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return { start: toDate(start), end: toDate(end) };
}

function getPrevMonthRange(dateString: string) {
  const base = new Date(`${dateString}T00:00:00`);
  const start = new Date(base.getFullYear(), base.getMonth() - 1, 1);
  const end = new Date(base.getFullYear(), base.getMonth(), 1);

  const toDate = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return { start: toDate(start), end: toDate(end) };
}

function calcSalesAmount(rows: SaleRow[] | null | undefined) {
  return (rows || []).reduce((sum, row) => {
    const amount = Number(row.amount || 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

function getMonthlyChangeText(current: number | null, prev: number | null) {
  if (typeof current !== "number" || typeof prev !== "number") return "--";
  if (prev === 0) return current === 0 ? "±0%" : "前月なし";
  const diff = ((current - prev) / prev) * 100;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}%`;
}

function normalizeName(value: string) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[　]/g, "");
}

function isTicketMenu(menu?: string | null) {
  const text = trimmed(menu);
  if (!text) return false;

  return (
    Boolean(TICKET_UNIT_PRICES[text]) ||
    text.includes("回数券") ||
    text.includes("40分") ||
    text.includes("60分") ||
    text.includes("80分") ||
    text.includes("120分") ||
    text.includes("ダイエット") ||
    text.includes("ゴールド") ||
    text.includes("プラチナ") ||
    text.includes("月2回") ||
    text.includes("月4回") ||
    text.includes("月8回")
  );
}

function detectServiceTypeFromTicketName(ticketName: string) {
  if (
    ticketName.includes("40分") ||
    ticketName.includes("60分") ||
    ticketName.includes("80分") ||
    ticketName.includes("120分") ||
    ticketName.includes("ストレッチ")
  ) {
    return "ストレッチ";
  }
  return "トレーニング";
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

function resolveTicketName(params: {
  reservationMenu?: string | null;
  customerPlanType?: string | null;
}) {
  const reservationMenu = trimmed(params.reservationMenu);
  const customerPlanType = trimmed(params.customerPlanType);

  if (reservationMenu && TICKET_UNIT_PRICES[reservationMenu]) return reservationMenu;
  if (customerPlanType && TICKET_UNIT_PRICES[customerPlanType]) return customerPlanType;
  if (reservationMenu.includes("回数券")) return reservationMenu;

  return "";
}

function getHandoverStorageKey(dateString: string) {
  return `gymup_dashboard_handover_note_${dateString}`;
}

function readHandoverNote(dateString: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(getHandoverStorageKey(dateString)) || "";
}

function saveHandoverNote(dateString: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getHandoverStorageKey(dateString), value);
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

function getVisitType(row: ReservationRow) {
  const visitType = trimmed(row.visit_type);
  if (visitType) return visitType;
  return row.is_first_visit ? "新規" : "再来";
}

function isNewVisit(row: DashboardReservation) {
  return row.visitType === "新規";
}

function ticketRemainingClass(value: number | null) {
  if (value === null) return "";
  if (value <= 0) return "zero";
  if (value === 1) return "danger";
  if (value <= 3) return "warn";
  return "ok";
}

function getCustomerName(row: CustomerRow) {
  return trimmed(row.name) || trimmed(row.customer_name) || "名前未設定";
}
export default function DashboardPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("OFFLINE");
  const [error, setError] = useState("");

  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [lowTickets, setLowTickets] = useState<TicketContractRow[]>([]);
  const [ltvCustomers, setLtvCustomers] = useState<LtvCustomer[]>([]);
  const [handoverNote, setHandoverNote] = useState("");

  const [stats, setStats] = useState<DashboardStats>({
    todayReservationCount: 0,
    todaySalesAmount: null,
    todayTodoCount: 0,
    todayUnsoldCount: 0,
    todayTicketPendingCount: 0,
    todayCounselingPendingCount: 0,
    monthSalesAmount: null,
    prevMonthSalesAmount: null,
    monthNewCustomers: null,
    customerCount: null,
    lowTicketCount: 0,
  });

  const selectedDateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);

  const monthlyChangeText = useMemo(
    () => getMonthlyChangeText(stats.monthSalesAmount, stats.prevMonthSalesAmount),
    [stats.monthSalesAmount, stats.prevMonthSalesAmount]
  );

  useEffect(() => {
    const loggedIn = localStorage.getItem(AUTH_STORAGE_KEY);
    const role = localStorage.getItem(ROLE_STORAGE_KEY);
    const staffName = localStorage.getItem(STAFF_NAME_STORAGE_KEY);
    const legacyStaffLoggedIn = localStorage.getItem("gymup_staff_logged_in");

    if (loggedIn !== "true" && legacyStaffLoggedIn === "true") {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(ROLE_STORAGE_KEY, role || "staff");
      if (!staffName) {
        localStorage.setItem(STAFF_NAME_STORAGE_KEY, "スタッフ");
      }
      localStorage.removeItem("gymup_staff_logged_in");
    }

    const finalLoggedIn = localStorage.getItem(AUTH_STORAGE_KEY);
    const finalRole = localStorage.getItem(ROLE_STORAGE_KEY);

    if (finalLoggedIn !== "true" || !finalRole) {
      router.replace("/login/staff");
      return;
    }

    setHandoverNote(readHandoverNote(getTodayDateString()));
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    setHandoverNote(readHandoverNote(selectedDate));
  }, [authChecked, selectedDate]);

  useEffect(() => {
    if (!authChecked) return;

    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const supabase = getSupabaseClient();

        if (!supabase) {
          setSystemStatus("OFFLINE");
          setReservations([]);
          setTodoItems([]);
          setLowTickets([]);
          setLtvCustomers([]);
          setStats({
            todayReservationCount: 0,
            todaySalesAmount: null,
            todayTodoCount: 0,
            todayUnsoldCount: 0,
            todayTicketPendingCount: 0,
            todayCounselingPendingCount: 0,
            monthSalesAmount: null,
            prevMonthSalesAmount: null,
            monthNewCustomers: null,
            customerCount: null,
            lowTicketCount: 0,
          });
          setLoading(false);
          return;
        }

        const monthRange = getMonthRange(selectedDate);
        const prevMonthRange = getPrevMonthRange(selectedDate);

        const [
          reservationsResult,
          customersResult,
          todaySalesResult,
          monthSalesResult,
          prevMonthSalesResult,
          monthNewCustomersResult,
          lowTicketsResult,
          allSalesResult,
        ] = await Promise.all([
          supabase
            .from("reservations")
            .select(
              "id, date, start_time, end_time, customer_id, customer_name, menu, staff_name, store_name, memo, visit_type, reservation_status, is_first_visit, created_at"
            )
            .eq("date", selectedDate)
            .order("start_time", { ascending: true }),

          supabase.from("customers").select("id, name, customer_name, plan_type, created_at"),

          supabase.from("sales").select("*").eq("sale_date", selectedDate),

          supabase
            .from("sales")
            .select("*")
            .gte("sale_date", monthRange.start)
            .lt("sale_date", monthRange.end),

          supabase
            .from("sales")
            .select("*")
            .gte("sale_date", prevMonthRange.start)
            .lt("sale_date", prevMonthRange.end),

          supabase
            .from("customers")
            .select("id")
            .gte("created_at", `${monthRange.start}T00:00:00`)
            .lt("created_at", `${monthRange.end}T00:00:00`),

          supabase
            .from("ticket_contracts")
            .select(
              "id, customer_id, ticket_name, remaining_count, used_count, prepaid_balance, status, created_at, updated_at"
            )
            .lte("remaining_count", 3)
            .gt("remaining_count", 0)
            .order("remaining_count", { ascending: true })
            .order("updated_at", { ascending: false })
            .limit(20),

          supabase
            .from("sales")
            .select("id, customer_id, customer_name, amount, sale_date, created_at")
            .order("sale_date", { ascending: false })
            .limit(1000),
        ]);

        if (reservationsResult.error) throw reservationsResult.error;

        const rawReservations = (reservationsResult.data || []) as ReservationRow[];
        const customers = ((customersResult.data || []) as CustomerRow[]) || [];
        const todaySales = ((todaySalesResult.data || []) as SaleRow[]) || [];
        const monthSales = ((monthSalesResult.data || []) as SaleRow[]) || [];
        const prevMonthSales = ((prevMonthSalesResult.data || []) as SaleRow[]) || [];
        const lowTicketRows = ((lowTicketsResult.data || []) as TicketContractRow[]) || [];
        const allSales = ((allSalesResult.data || []) as SaleRow[]) || [];

        const customerMapById = new Map<string, CustomerRow>();
        const customerMapByName = new Map<string, CustomerRow>();

        for (const customer of customers) {
          const id = trimmed(customer.id);
          const name = getCustomerName(customer);
          if (id) customerMapById.set(id, customer);
          const normalized = normalizeName(name);
          if (normalized && !customerMapByName.has(normalized)) {
            customerMapByName.set(normalized, customer);
          }
        }

        const reservationIds = rawReservations
          .map((row) => toNumberOrNull(row.id))
          .filter((id): id is number => id !== null);

        const customerIds = rawReservations
          .map((row) => toNumberOrNull(row.customer_id))
          .filter((id): id is number => id !== null);

        const [
          usageResult,
          counselingResult,
          contractResult,
        ] = await Promise.all([
          reservationIds.length > 0
            ? supabase
                .from("ticket_usages")
                .select("id, reservation_id, ticket_id, customer_id, before_count, after_count, created_at")
                .in("reservation_id", reservationIds)
            : Promise.resolve({ data: [], error: null }),

          reservationIds.length > 0
            ? supabase
                .from("counselings")
                .select("id, reservation_id, customer_id, created_at")
                .in("reservation_id", reservationIds)
            : Promise.resolve({ data: [], error: null }),

          customerIds.length > 0
            ? supabase
                .from("ticket_contracts")
                .select(
                  "id, customer_id, ticket_name, remaining_count, used_count, prepaid_balance, status, created_at, updated_at"
                )
                .in("customer_id", customerIds)
                .order("updated_at", { ascending: false })
                .order("id", { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (usageResult.error) throw usageResult.error;
        if (counselingResult.error) throw counselingResult.error;
        if (contractResult.error) throw contractResult.error;

        const usageRows = ((usageResult.data || []) as TicketUsageRow[]) || [];
        const counselingRows = ((counselingResult.data || []) as CounselingRow[]) || [];
        const contractRows = ((contractResult.data || []) as TicketContractRow[]) || [];

        const usageByReservation = new Set(
          usageRows
            .map((row) => trimmed(row.reservation_id))
            .filter(Boolean)
        );

        const counselingByReservation = new Set(
          counselingRows
            .map((row) => trimmed(row.reservation_id))
            .filter(Boolean)
        );

        const salesByReservation = new Set(
          todaySales
            .map((row) => trimmed(row.reservation_id))
            .filter(Boolean)
        );

        const contractByCustomer = new Map<string, TicketContractRow[]>();
        for (const contract of contractRows) {
          const customerId = trimmed(contract.customer_id);
          if (!customerId) continue;
          const current = contractByCustomer.get(customerId) || [];
          current.push(contract);
          contractByCustomer.set(customerId, current);
        }

        const displayReservations: DashboardReservation[] = rawReservations.map((row) => {
          let customerId = trimmed(row.customer_id);
          const customerName = trimmed(row.customer_name);
          let matchedCustomer: CustomerRow | undefined;

          if (customerId) {
            matchedCustomer = customerMapById.get(customerId);
          }

          if (!matchedCustomer && customerName) {
            matchedCustomer = customerMapByName.get(normalizeName(customerName));
            if (matchedCustomer) customerId = trimmed(matchedCustomer.id);
          }

          const menu = trimmed(row.menu) || "予約メニュー";
          const ticketName = resolveTicketName({
            reservationMenu: menu,
            customerPlanType: matchedCustomer?.plan_type || null,
          });

          const customerContracts = customerId ? contractByCustomer.get(customerId) || [] : [];
          const matchedContract =
            customerContracts.find((contract) => {
              const cName = trimmed(contract.ticket_name);
              if (ticketName && cName === ticketName) return true;
              return Number(contract.remaining_count || 0) > 0;
            }) || null;

          const reservationId = trimmed(row.id);
          const isSold =
            trimmed(row.reservation_status) === "売上済" ||
            salesByReservation.has(reservationId);
          const isTicket = isTicketMenu(menu);
          const isTicketUsed = usageByReservation.has(reservationId);
          const isCounseled = counselingByReservation.has(reservationId);

          return {
            id: reservationId,
            date: trimmed(row.date),
            time: trimmed(row.start_time)?.slice(0, 5) || "--:--",
            endTime: trimmed(row.end_time)?.slice(0, 5),
            customerId,
            customerName: customerName || matchedCustomer ? customerName || getCustomerName(matchedCustomer as CustomerRow) : "名前未設定",
            menu,
            staffName: trimmed(row.staff_name) || "担当未設定",
            storeName: trimmed(row.store_name),
            memo: trimmed(row.memo),
            visitType: getVisitType(row),
            reservationStatus: trimmed(row.reservation_status),
            isTicket,
            isSold,
            isTicketUsed,
            isCounseled,
            ticketName: trimmed(matchedContract?.ticket_name) || ticketName,
            remainingCount:
              matchedContract && matchedContract.remaining_count !== null && matchedContract.remaining_count !== undefined
                ? Number(matchedContract.remaining_count)
                : null,
          };
        });

        const nextTodoItems: TodoItem[] = [];

        for (const item of displayReservations) {
          if (!item.isSold) {
            nextTodoItems.push({
              id: `sales-${item.id}`,
              type: "sales",
              title: `${item.time} ${item.customerName}：売上未`,
              sub: `${item.menu} / ${item.staffName}${item.storeName ? ` / ${item.storeName}` : ""}`,
              href: `/reservation/detail/${item.id}`,
              customerHref: item.customerId ? `/customer/${item.customerId}` : undefined,
              level: "red",
            });
          }

          if (item.isTicket && !item.isTicketUsed) {
            nextTodoItems.push({
              id: `ticket-${item.id}`,
              type: "ticket",
              title: `${item.time} ${item.customerName}：回数券未消化`,
              sub: `${item.ticketName || item.menu} / 残${item.remainingCount ?? "不明"}回`,
              href: `/reservation/detail/${item.id}`,
              customerHref: item.customerId ? `/customer/${item.customerId}` : undefined,
              level: "purple",
            });
          }

          if (isNewVisit(item) && !item.isCounseled) {
            nextTodoItems.push({
              id: `counseling-${item.id}`,
              type: "counseling",
              title: `${item.time} ${item.customerName}：カウンセリング未`,
              sub: `${item.menu} / 新規`,
              href: `/reservation/detail/${item.id}`,
              customerHref: item.customerId ? `/customer/${item.customerId}` : undefined,
              level: "orange",
            });
          }

          if (item.isTicket && item.remainingCount !== null && item.remainingCount <= 2) {
            nextTodoItems.push({
              id: `ticket-warning-${item.id}`,
              type: "ticket-warning",
              title: `${item.customerName}：回数券残り${item.remainingCount}回`,
              sub: `${item.ticketName || item.menu} / 更新案内候補`,
              href: item.customerId ? `/customer/${item.customerId}` : `/reservation/detail/${item.id}`,
              customerHref: item.customerId ? `/customer/${item.customerId}` : undefined,
              level: item.remainingCount <= 1 ? "red" : "orange",
            });
          }
        }

        const ltvMap = new Map<string, LtvCustomer>();

        for (const sale of allSales) {
          const amount = Number(sale.amount || 0);
          if (!Number.isFinite(amount) || amount <= 0) continue;

          const customerId = trimmed(sale.customer_id) || `name-${trimmed(sale.customer_name)}`;
          const customerName =
            trimmed(sale.customer_name) ||
            getCustomerName(customerMapById.get(trimmed(sale.customer_id)) as CustomerRow) ||
            "顧客名未設定";

          const current = ltvMap.get(customerId) || {
            customerId,
            customerName,
            amount: 0,
            count: 0,
          };

          current.amount += amount;
          current.count += 1;
          ltvMap.set(customerId, current);
        }

        const ltvList = Array.from(ltvMap.values())
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        if (!mounted) return;

        setReservations(displayReservations);
        setTodoItems(nextTodoItems);
        setLowTickets(lowTicketRows);
        setLtvCustomers(ltvList);
        setStats({
          todayReservationCount: displayReservations.length,
          todaySalesAmount: calcSalesAmount(todaySales),
          todayTodoCount: nextTodoItems.length,
          todayUnsoldCount: displayReservations.filter((item) => !item.isSold).length,
          todayTicketPendingCount: displayReservations.filter(
            (item) => item.isTicket && !item.isTicketUsed
          ).length,
          todayCounselingPendingCount: displayReservations.filter(
            (item) => isNewVisit(item) && !item.isCounseled
          ).length,
          monthSalesAmount: calcSalesAmount(monthSales),
          prevMonthSalesAmount: calcSalesAmount(prevMonthSales),
          monthNewCustomers: Array.isArray(monthNewCustomersResult.data)
            ? monthNewCustomersResult.data.length
            : null,
          customerCount: customers.length,
          lowTicketCount: lowTicketRows.length,
        });
        setSystemStatus("ONLINE");
      } catch (e) {
        console.error("dashboard load error:", e);
        if (!mounted) return;
        setError(extractErrorMessage(e));
        setSystemStatus("OFFLINE");
        setReservations([]);
        setTodoItems([]);
        setLowTickets([]);
        setLtvCustomers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [authChecked, selectedDate]);

  async function handleConsumeTicket(
    item: DashboardReservation,
    e: MouseEvent<HTMLButtonElement>
  ) {
    e.stopPropagation();

    if (!item.isTicket) {
      window.alert("この予約は回数券消化の対象外です。");
      return;
    }

    if (item.isTicketUsed || item.isSold) {
      window.alert("この予約はすでに処理済みです。");
      return;
    }

    const reservationId = toNumberOrNull(item.id);
    const customerId = toNumberOrNull(item.customerId);

    if (!reservationId) {
      window.alert("予約IDが不正です。");
      return;
    }

    if (!customerId) {
      window.alert("customer_id がありません。顧客詳細から確認してください。");
      return;
    }

    const ok = window.confirm(
      `${item.customerName} 様の回数券を1回消化して、売上を自動作成します。よろしいですか？`
    );

    if (!ok) return;

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabaseの環境変数が設定されていません。");

      const { data: alreadyUsage, error: alreadyUsageError } = await supabase
        .from("ticket_usages")
        .select("id")
        .eq("reservation_id", reservationId)
        .limit(1);

      if (alreadyUsageError) throw alreadyUsageError;

      const { data: alreadySales, error: alreadySalesError } = await supabase
        .from("sales")
        .select("id")
        .eq("reservation_id", reservationId)
        .limit(1);

      if (alreadySalesError) throw alreadySalesError;

      if ((alreadyUsage && alreadyUsage.length > 0) || (alreadySales && alreadySales.length > 0)) {
        window.alert("この予約はすでに売上または回数券消化が登録されています。");
        setReservations((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? { ...row, isTicketUsed: true, isSold: true, reservationStatus: "売上済" }
              : row
          )
        );
        return;
      }

      const ticketName = item.ticketName || item.menu;
      const unitPrice = TICKET_UNIT_PRICES[ticketName] || 0;

      if (!unitPrice) {
        window.alert("単価が未設定です。売上管理画面から登録してください。");
        router.push(`/sales?reservationId=${reservationId}`);
        return;
      }

      const { data: contractRow, error: contractError } = await supabase
        .from("ticket_contracts")
        .select("*")
        .eq("customer_id", customerId)
        .eq("ticket_name", ticketName)
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contractError) throw contractError;
      if (!contractRow) {
        window.alert("有効な回数券契約が見つかりません。売上管理画面から登録してください。");
        router.push(`/sales?reservationId=${reservationId}`);
        return;
      }

      const remaining = Number((contractRow as any).remaining_count || 0);
      const used = Number((contractRow as any).used_count || 0);
      const prepaidBalance = Number((contractRow as any).prepaid_balance || 0);

      if (remaining <= 0) {
        window.alert("残回数がありません。");
        return;
      }

      const nextRemaining = remaining - 1;
      const nextUsed = used + 1;
      const nextBalance = Math.max(prepaidBalance - unitPrice, 0);
      const serviceType = detectServiceTypeFromTicketName(ticketName);

      const { error: usageInsertError } = await supabase.from("ticket_usages").insert({
        ticket_id: (contractRow as any).id,
        customer_id: customerId,
        customer_name: item.customerName,
        reservation_id: reservationId,
        used_date: item.date || selectedDate,
        ticket_name: ticketName,
        service_type: serviceType,
        unit_price: unitPrice,
        before_count: remaining,
        after_count: nextRemaining,
        staff_name: item.staffName || null,
        store_name: item.storeName || null,
      });

      if (usageInsertError) throw usageInsertError;

      const { error: contractUpdateError } = await supabase
        .from("ticket_contracts")
        .update({
          used_count: nextUsed,
          remaining_count: nextRemaining,
          prepaid_balance: nextBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (contractRow as any).id);

      if (contractUpdateError) throw contractUpdateError;

      const { error: salesInsertError } = await supabase.from("sales").insert({
        reservation_id: reservationId,
        customer_id: customerId,
        customer_name: item.customerName,
        sale_date: item.date || selectedDate,
        amount: unitPrice,
        menu_type: serviceType,
        sale_type: "回数券消化",
        payment_method: "前受金消化",
        staff_name: item.staffName || null,
        store_name: item.storeName || null,
        memo: `${ticketName} 消化`,
      });

      if (salesInsertError) throw salesInsertError;

      const { error: reservationUpdateError } = await supabase
        .from("reservations")
        .update({ reservation_status: "売上済" })
        .eq("id", reservationId);

      if (reservationUpdateError) throw reservationUpdateError;

      setReservations((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                isTicketUsed: true,
                isSold: true,
                reservationStatus: "売上済",
                remainingCount: nextRemaining,
              }
            : row
        )
      );

      setTodoItems((prev) =>
        prev.filter(
          (todo) =>
            todo.id !== `sales-${item.id}` &&
            todo.id !== `ticket-${item.id}` &&
            todo.id !== `ticket-warning-${item.id}`
        )
      );

      setStats((prev) => ({
        ...prev,
        todaySalesAmount:
          typeof prev.todaySalesAmount === "number"
            ? prev.todaySalesAmount + unitPrice
            : unitPrice,
        monthSalesAmount:
          typeof prev.monthSalesAmount === "number"
            ? prev.monthSalesAmount + unitPrice
            : unitPrice,
        todayTodoCount: Math.max(prev.todayTodoCount - 2, 0),
        todayUnsoldCount: Math.max(prev.todayUnsoldCount - 1, 0),
        todayTicketPendingCount: Math.max(prev.todayTicketPendingCount - 1, 0),
      }));

      window.alert(`回数券を1回消化しました。残回数は ${nextRemaining} 回です。`);
    } catch (e) {
      console.error("ticket consume error:", e);
      window.alert(`回数券消化エラー: ${extractErrorMessage(e)}`);
    }
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    localStorage.removeItem(STAFF_NAME_STORAGE_KEY);
    localStorage.removeItem("gymup_staff_logged_in");
    router.push("/login/staff");
  }

  function handleHandoverChange(value: string) {
    setHandoverNote(value);
    saveHandoverNote(selectedDate, value);
  }

  function handleClearHandover() {
    const ok = window.confirm(`${selectedDateLabel} の引き継ぎメモを空にしますか？`);
    if (!ok) return;
    setHandoverNote("");
    saveHandoverNote(selectedDate, "");
  }

  function goToday() {
    setSelectedDate(getTodayDateString());
  }

  if (!authChecked) {
    return (
      <main className="gymup-loading">
        認証を確認中...
      </main>
    );
  }

  const topStats = [
    {
      label: "今日の予約",
      value: loading ? "..." : String(stats.todayReservationCount),
      sub: selectedDate,
      accent: "",
    },
    {
      label: "今日の売上",
      value: loading ? "..." : formatYen(stats.todaySalesAmount),
      sub: "売上登録ベース",
      accent: "orange",
    },
    {
      label: "今日やること",
      value: loading ? "..." : String(todoItems.length),
      sub: "未処理・確認事項",
      accent: todoItems.length > 0 ? "red" : "green",
    },
    {
      label: "今月売上",
      value: loading ? "..." : formatYen(stats.monthSalesAmount),
      sub: `前月比 ${monthlyChangeText}`,
      accent: monthlyChangeText.startsWith("+") ? "green" : monthlyChangeText.startsWith("-") ? "red" : "",
    },
  ];

  const subStats = [
    {
      label: "売上未",
      value: String(stats.todayUnsoldCount),
      sub: "今日の予約",
      accent: stats.todayUnsoldCount > 0 ? "red" : "green",
    },
    {
      label: "回数券未消化",
      value: String(stats.todayTicketPendingCount),
      sub: "今日の回数券予約",
      accent: stats.todayTicketPendingCount > 0 ? "purple" : "green",
    },
    {
      label: "カウンセリング未",
      value: String(stats.todayCounselingPendingCount),
      sub: "新規予約",
      accent: stats.todayCounselingPendingCount > 0 ? "orange" : "green",
    },
    {
      label: "低残回数",
      value: String(stats.lowTicketCount),
      sub: "残3回以下",
      accent: stats.lowTicketCount > 0 ? "orange" : "green",
    },
  ];
    return (
    <>
      <style>{`
        .gymup-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f1012;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
        }

        .gymup-home {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(240,138,39,0.12) 0%, transparent 26%),
            radial-gradient(circle at bottom right, rgba(255,255,255,0.04) 0%, transparent 24%),
            linear-gradient(180deg, #0f1012 0%, #16181b 48%, #111214 100%);
          color: #f5f7fa;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .gymup-home::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, rgba(240,138,39,0.06), transparent 34%),
            linear-gradient(300deg, rgba(240,138,39,0.04), transparent 28%);
          pointer-events: none;
        }

        .gymup-home__container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding: 24px 18px 28px;
          box-sizing: border-box;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, #f08a27, #ffb86b);
          box-shadow: 0 16px 34px rgba(240,138,39,0.22);
        }

        .brand-title {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.04em;
          color: #fff;
        }

        .brand-sub {
          margin-top: 3px;
          font-size: 12px;
          color: rgba(255,255,255,0.52);
          font-weight: 700;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .topbar-link,
        .topbar-button {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #f5f7fa;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.045);
          cursor: pointer;
        }

        .topbar-button {
          color: #ffd7ae;
          border-color: rgba(240,138,39,0.24);
          background: rgba(240,138,39,0.10);
        }

        .hero {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.045);
          box-shadow: 0 18px 48px rgba(0,0,0,0.24);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 30px;
          padding: 24px;
          margin-bottom: 18px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
          gap: 20px;
          align-items: stretch;
        }

        .hero-title {
          margin: 0;
          color: #fff;
          font-size: clamp(34px, 4.4vw, 58px);
          line-height: 1.05;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .hero-desc {
          margin: 14px 0 0;
          max-width: 720px;
          color: rgba(255,255,255,0.64);
          font-size: 15px;
          line-height: 1.9;
          font-weight: 600;
        }

        .date-card {
          border-radius: 24px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.035);
        }

        .date-label {
          color: #f08a27;
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .date-title {
          color: #fff;
          font-size: 22px;
          font-weight: 900;
          margin-bottom: 14px;
        }

        .date-actions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .date-btn,
        .date-input {
          min-height: 40px;
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.045);
          color: #fff;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          padding: 0 10px;
          box-sizing: border-box;
        }

        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.9;
          cursor: pointer;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .stat {
          border-radius: 22px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.035);
          box-shadow: 0 14px 32px rgba(0,0,0,0.16);
        }

        .stat.orange {
          border-color: rgba(240,138,39,0.22);
          background: rgba(240,138,39,0.08);
        }

        .stat.red {
          border-color: rgba(255,80,80,0.26);
          background: rgba(255,80,80,0.09);
        }

        .stat.green {
          border-color: rgba(92,214,146,0.22);
          background: rgba(92,214,146,0.08);
        }

        .stat.purple {
          border-color: rgba(168,85,247,0.24);
          background: rgba(168,85,247,0.09);
        }

        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.52);
          font-weight: 800;
          margin-bottom: 8px;
        }

        .stat-value {
          color: #fff;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .stat-sub {
          margin-top: 8px;
          color: rgba(255,255,255,0.48);
          font-size: 12px;
          font-weight: 700;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
          gap: 18px;
          align-items: start;
        }

        .stack {
          display: grid;
          gap: 18px;
        }

        .panel {
          border-radius: 28px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.045);
          box-shadow: 0 18px 48px rgba(0,0,0,0.20);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .panel-title {
          color: #fff;
          font-size: 18px;
          font-weight: 900;
        }

        .panel-sub {
          margin-top: 5px;
          color: rgba(255,255,255,0.50);
          font-size: 13px;
          font-weight: 700;
        }

        .panel-badge {
          min-height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #ffd7ae;
          border: 1px solid rgba(240,138,39,0.22);
          background: rgba(240,138,39,0.10);
          font-size: 12px;
          font-weight: 900;
        }

        .todo-list,
        .reservation-list,
        .side-list {
          display: grid;
          gap: 10px;
        }

        .todo-item,
        .reservation-item,
        .side-item {
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.032);
          text-decoration: none;
          color: inherit;
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        }

        .todo-item:hover,
        .reservation-item:hover,
        .side-item:hover,
        .quick-link:hover,
        .topbar-link:hover,
        .topbar-button:hover,
        .date-btn:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,0.052);
          border-color: rgba(255,255,255,0.11);
        }

        .todo-item {
          display: grid;
          grid-template-columns: 10px minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .todo-line {
          width: 10px;
          height: 42px;
          border-radius: 999px;
          background: #ef4444;
        }

        .todo-line.orange {
          background: #f59e0b;
        }

        .todo-line.purple {
          background: #a855f7;
        }

        .todo-line.green {
          background: #22c55e;
        }

        .todo-title,
        .reservation-name,
        .side-main {
          color: #fff;
          font-size: 14px;
          font-weight: 900;
          line-height: 1.5;
          word-break: break-word;
        }

        .todo-sub,
        .reservation-sub,
        .side-sub {
          margin-top: 4px;
          color: rgba(255,255,255,0.55);
          font-size: 12px;
          line-height: 1.6;
          font-weight: 700;
          word-break: break-word;
        }

        .todo-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .mini-link,
        .mini-btn {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.045);
          color: #fff;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }

        .mini-link.orange,
        .mini-btn.orange {
          color: #ffd7ae;
          border-color: rgba(240,138,39,0.24);
          background: rgba(240,138,39,0.10);
        }

        .mini-link.red {
          color: #ffb4b4;
          border-color: rgba(255,80,80,0.24);
          background: rgba(255,80,80,0.10);
        }

        .mini-link.green,
        .mini-btn.green {
          color: #a7f3c6;
          border-color: rgba(92,214,146,0.22);
          background: rgba(92,214,146,0.09);
        }

        .mini-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .reservation-item {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          cursor: pointer;
        }

        .reservation-time {
          color: #f08a27;
          font-size: 15px;
          font-weight: 900;
        }

        .status-wrap {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .status {
          min-height: 28px;
          padding: 0 9px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.04);
          white-space: nowrap;
        }

        .status.done {
          color: #a7f3c6;
          border-color: rgba(92,214,146,0.22);
          background: rgba(92,214,146,0.09);
        }

        .status.red {
          color: #ffb4b4;
          border-color: rgba(255,80,80,0.24);
          background: rgba(255,80,80,0.10);
        }

        .status.orange {
          color: #ffd7ae;
          border-color: rgba(240,138,39,0.24);
          background: rgba(240,138,39,0.10);
        }

        .status.purple {
          color: #e9d5ff;
          border-color: rgba(168,85,247,0.24);
          background: rgba(168,85,247,0.10);
        }

        .status.zero {
          color: #d1d5db;
          border-color: rgba(156,163,175,0.20);
          background: rgba(156,163,175,0.08);
        }

        .empty {
          padding: 22px 16px;
          border-radius: 18px;
          border: 1px dashed rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.025);
          color: rgba(255,255,255,0.56);
          font-size: 13px;
          line-height: 1.8;
          font-weight: 700;
          text-align: center;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .quick-link {
          min-height: 74px;
          border-radius: 18px;
          padding: 14px;
          text-decoration: none;
          color: inherit;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.032);
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        }

        .quick-title {
          color: #fff;
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 6px;
        }

        .quick-desc {
          color: rgba(255,255,255,0.50);
          font-size: 12px;
          line-height: 1.55;
          font-weight: 700;
        }

        .memo-area {
          width: 100%;
          min-height: 180px;
          resize: vertical;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #fff;
          padding: 14px 16px;
          font-size: 14px;
          line-height: 1.8;
          outline: none;
          box-sizing: border-box;
        }

        .memo-area::placeholder {
          color: rgba(255,255,255,0.32);
        }

        .memo-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .memo-small {
          color: rgba(255,255,255,0.44);
          font-size: 12px;
          font-weight: 700;
        }

        .error-box {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(255,80,80,0.10);
          border: 1px solid rgba(255,80,80,0.24);
          color: #ffb4b4;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.7;
        }

        @media (max-width: 1180px) {
          .hero-grid,
          .main-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .gymup-home__container {
            padding: 14px 10px 22px;
          }

          .topbar,
          .topbar-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .topbar-link,
          .topbar-button {
            width: 100%;
            box-sizing: border-box;
          }

          .hero,
          .panel {
            border-radius: 22px;
            padding: 15px;
          }

          .hero-title {
            font-size: 34px;
          }

          .date-actions,
          .stats-grid,
          .quick-grid {
            grid-template-columns: 1fr;
          }

          .reservation-item,
          .todo-item {
            grid-template-columns: 1fr;
          }

          .todo-line {
            width: 100%;
            height: 6px;
          }

          .todo-actions,
          .status-wrap {
            justify-content: flex-start;
          }

          .mini-link,
          .mini-btn,
          .date-btn,
          .date-input {
            width: 100%;
            box-sizing: border-box;
          }

          .stat-value {
            font-size: 24px;
          }
        }
      `}</style>

      <main className="gymup-home">
        <div className="gymup-home__container">
          <div className="topbar">
            <div className="brand">
              <div className="brand-mark" />
              <div>
                <div className="brand-title">GYMUP CRM</div>
                <div className="brand-sub">
                  現場・売上・回数券・顧客状態を一画面で確認
                </div>
              </div>
            </div>

            <div className="topbar-actions">
              <Link href="/reservation" className="topbar-link">
                予約管理
              </Link>
              <Link href="/customer" className="topbar-link">
                顧客管理
              </Link>
              <Link href="/sales" className="topbar-link">
                売上管理
              </Link>
              <button type="button" onClick={handleLogout} className="topbar-button">
                ログアウト
              </button>
            </div>
          </div>

          <section className="hero">
            <div className="hero-grid">
              <div>
                <h1 className="hero-title">
                  今日の現場を、
                  <br />
                  迷わず動かす。
                </h1>
                <p className="hero-desc">
                  売上未・回数券未消化・カウンセリング未・残回数低下をまとめて確認。
                  予約詳細と顧客ページへすぐ移動できます。
                </p>
              </div>

              <div className="date-card">
                <div className="date-label">SELECTED DATE</div>
                <div className="date-title">{selectedDateLabel}</div>

                <div className="date-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedDate((prev) => shiftDateString(prev, -1))}
                    className="date-btn"
                  >
                    前日
                  </button>
                  <button type="button" onClick={goToday} className="date-btn">
                    今日
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate((prev) => shiftDateString(prev, 1))}
                    className="date-btn"
                  >
                    翌日
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    className="date-input"
                  />
                </div>
              </div>
            </div>
          </section>

          {error ? <div className="error-box">{error}</div> : null}

          <section className="stats-grid">
            {topStats.map((item) => (
              <div key={item.label} className={`stat ${item.accent || ""}`}>
                <div className="stat-label">{item.label}</div>
                <div className="stat-value">{item.value}</div>
                <div className="stat-sub">{item.sub}</div>
              </div>
            ))}
          </section>

          <section className="stats-grid">
            {subStats.map((item) => (
              <div key={item.label} className={`stat ${item.accent || ""}`}>
                <div className="stat-label">{item.label}</div>
                <div className="stat-value">{loading ? "..." : item.value}</div>
                <div className="stat-sub">{item.sub}</div>
              </div>
            ))}
          </section>

          <div className="main-grid">
            <div className="stack">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">今日やることリスト</div>
                    <div className="panel-sub">
                      売上未・回数券未消化・カウンセリング未・残回数注意
                    </div>
                  </div>
                  <div className="panel-badge">{loading ? "確認中" : `${todoItems.length}件`}</div>
                </div>

                {loading ? (
                  <div className="empty">読み込み中...</div>
                ) : todoItems.length === 0 ? (
                  <div className="empty">
                    今日の未処理はありません。現場運用はきれいな状態です。
                  </div>
                ) : (
                  <div className="todo-list">
                    {todoItems.map((item) => (
                      <div key={item.id} className="todo-item">
                        <div className={`todo-line ${item.level}`} />

                        <div>
                          <div className="todo-title">{item.title}</div>
                          <div className="todo-sub">{item.sub}</div>
                        </div>

                        <div className="todo-actions">
                          {item.customerHref ? (
                            <Link href={item.customerHref} className="mini-link">
                              顧客
                            </Link>
                          ) : null}
                          <Link href={item.href} className="mini-link orange">
                            詳細
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">本日の予約</div>
                    <div className="panel-sub">
                      予約カードから予約詳細へ移動できます。
                    </div>
                  </div>
                  <div className="panel-badge">
                    {loading ? "確認中" : `${reservations.length}件`}
                  </div>
                </div>

                {loading ? (
                  <div className="empty">読み込み中...</div>
                ) : reservations.length === 0 ? (
                  <div className="empty">
                    この日の予約はありません。
                  </div>
                ) : (
                  <div className="reservation-list">
                    {reservations.map((item) => {
                      const remainingClass = ticketRemainingClass(item.remainingCount);

                      return (
                        <div
                          key={item.id}
                          className="reservation-item"
                          onClick={() => router.push(`/reservation/detail/${item.id}`)}
                        >
                          <div className="reservation-time">{item.time}</div>

                          <div>
                            <div className="reservation-name">{item.customerName}</div>
                            <div className="reservation-sub">
                              {item.menu} / {item.staffName}
                              {item.storeName ? ` / ${item.storeName}` : ""}
                            </div>
                            {item.memo ? (
                              <div className="reservation-sub">メモ：{item.memo}</div>
                            ) : null}
                            {item.isTicket ? (
                              <div className="reservation-sub">
                                回数券：{item.ticketName || item.menu} / 残{" "}
                                {item.remainingCount ?? "不明"}回
                              </div>
                            ) : null}
                          </div>

                          <div className="status-wrap">
                            <span className={`status ${item.isSold ? "done" : "red"}`}>
                              {item.isSold ? "売上済" : "売上未"}
                            </span>

                            {item.isTicket ? (
                              <span className={`status ${item.isTicketUsed ? "done" : "purple"}`}>
                                {item.isTicketUsed ? "消化済" : "未消化"}
                              </span>
                            ) : null}

                            {isNewVisit(item) ? (
                              <span className={`status ${item.isCounseled ? "done" : "orange"}`}>
                                {item.isCounseled ? "カウンセ済" : "カウンセ未"}
                              </span>
                            ) : null}

                            {item.isTicket && item.remainingCount !== null ? (
                              <span className={`status ${remainingClass}`}>
                                残{item.remainingCount}
                              </span>
                            ) : null}

                            {item.isTicket && !item.isTicketUsed && !item.isSold ? (
                              <button
                                type="button"
                                className="mini-btn orange"
                                onClick={(e) => handleConsumeTicket(item, e)}
                              >
                                消化
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="stack">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">クイック導線</div>
                    <div className="panel-sub">
                      よく使う管理ページへすぐ移動
                    </div>
                  </div>
                </div>

                <div className="quick-grid">
                  {quickLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="quick-link">
                      <div className="quick-title">{item.title}</div>
                      <div className="quick-desc">{item.desc}</div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">回数券 残数注意</div>
                    <div className="panel-sub">
                      残3回以下の契約回数券
                    </div>
                  </div>
                  <div className="panel-badge">{loading ? "確認中" : `${lowTickets.length}件`}</div>
                </div>

                {loading ? (
                  <div className="empty">読み込み中...</div>
                ) : lowTickets.length === 0 ? (
                  <div className="empty">残数注意の回数券はありません。</div>
                ) : (
                  <div className="side-list">
                    {lowTickets.map((ticket) => (
                      <Link
                        key={String(ticket.id)}
                        href={
                          ticket.customer_id
                            ? `/customer/${ticket.customer_id}`
                            : "/customer"
                        }
                        className="side-item"
                      >
                        <div className="side-main">
                          {ticket.ticket_name || "回数券"}
                        </div>
                        <div className="side-sub">
                          顧客ID {ticket.customer_id || "—"} / 残
                          {Number(ticket.remaining_count || 0)}回 / 使用
                          {Number(ticket.used_count || 0)}回
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">LTV上位顧客</div>
                    <div className="panel-sub">
                      売上累計上位5名
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="empty">読み込み中...</div>
                ) : ltvCustomers.length === 0 ? (
                  <div className="empty">売上データがまだありません。</div>
                ) : (
                  <div className="side-list">
                    {ltvCustomers.map((item, index) => (
                      <Link
                        key={item.customerId}
                        href={
                          item.customerId.startsWith("name-")
                            ? `/customer?keyword=${encodeURIComponent(item.customerName)}`
                            : `/customer/${item.customerId}`
                        }
                        className="side-item"
                      >
                        <div className="side-main">
                          {index + 1}. {item.customerName}
                        </div>
                        <div className="side-sub">
                          LTV {formatYen(item.amount)} / 売上 {item.count}件
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">引き継ぎメモ</div>
                    <div className="panel-sub">
                      {selectedDateLabel} の共有事項
                    </div>
                  </div>
                </div>

                <textarea
                  className="memo-area"
                  value={handoverNote}
                  onChange={(e) => handleHandoverChange(e.target.value)}
                  placeholder="例：◯◯様、腰痛あり。ストレッチ弱め。次回更新案内。"
                />

                <div className="memo-footer">
                  <div className="memo-small">自動保存されます</div>
                  <button type="button" onClick={handleClearHandover} className="mini-btn">
                    クリア
                  </button>
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">システム状態</div>
                    <div className="panel-sub">
                      Supabase接続とデータ確認
                    </div>
                  </div>
                  <div className="panel-badge">{systemStatus}</div>
                </div>

                <div className="side-list">
                  <div className="side-item">
                    <div className="side-main">会員数</div>
                    <div className="side-sub">
                      {stats.customerCount === null ? "--" : `${stats.customerCount}名`}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-main">今月新規</div>
                    <div className="side-sub">
                      {stats.monthNewCustomers === null
                        ? "--"
                        : `${stats.monthNewCustomers}名`}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-main">前月売上</div>
                    <div className="side-sub">{formatYen(stats.prevMonthSalesAmount)}</div>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}