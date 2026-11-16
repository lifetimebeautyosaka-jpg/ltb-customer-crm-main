"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/fetchAllRows";
import BottomNav from "@/components/BottomNav";

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
  created_at?: string | null;
  store_name?: string | null;
  staff_name?: string | null;
  sale_type?: string | null;
  payment_method?: string | null;
  menu_type?: string | null;
};

type TicketUsageRow = {
  id: string | number;
  reservation_id?: string | number | null;
};

type CounselingRow = {
  id: string | number;
  reservation_id?: string | number | null;
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
  mainStaff: string;
};

type MonthlySummaryItem = {
  name: string;
  amount: number;
  count: number;
};

type SystemStatus = "ONLINE" | "OFFLINE";

type DashboardStats = {
  todayReservationCount: number;
  todaySalesAmount: number | null;
  todayUnsoldCount: number;
  todayTicketPendingCount: number;
  todayCounselingPendingCount: number;
  monthSalesAmount: number | null;
  monthAdvanceAmount: number | null;
  prevMonthSalesAmount: number | null;
  // 前月同日比用：今月1日〜今日 と 前月1日〜同じ日
  monthToDateAmount: number | null;
  prevMonthSameDayAmount: number | null;
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
  { title: "フォロー確認", href: "/followup", desc: "回数券の期限・次回予約なし・打刻忘れ" },
  { title: "前受金の残高", href: "/tickets/balance", desc: "未使用の回数券の金額・期限切れの回数券" },
  { title: "リピート率", href: "/repeat-rate", desc: "新規の2回目来店率（スタッフ・店舗・流入元別）" },
  { title: "LTVランキング", href: "/ltv", desc: "お客様ごとの累計売上・離脱注意" },
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
  return createClient(url, anonKey);
}

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

// 前受金は回数券の代金を先にもらったもので、来店時に「回数券消化」として売上に計上される。
// 前受金まで売上に足すと同じお金を二重に数えるため、売上は前受金を除いた「純売上」で出す。
function isAdvanceSale(row: SaleRow) {
  return trimmed(row.sale_type) === "前受金";
}

function calcNetSalesAmount(rows: SaleRow[] | null | undefined) {
  return calcSalesAmount((rows || []).filter((row) => !isAdvanceSale(row)));
}

function calcAdvanceAmount(rows: SaleRow[] | null | undefined) {
  return calcSalesAmount((rows || []).filter(isAdvanceSale));
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

function getCustomerName(row?: CustomerRow | null) {
  if (!row) return "名前未設定";
  return trimmed(row.name) || trimmed(row.customer_name) || "名前未設定";
}

export default function DashboardPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState(getTodayDateString().slice(0, 7));
  // 月の売上目標（純売上）。この端末に保存する
  const [monthTarget, setMonthTarget] = useState("");
  useEffect(() => {
    try {
      setMonthTarget(localStorage.getItem(`gymup_month_target_${selectedMonth}`) || "");
    } catch {
      setMonthTarget("");
    }
  }, [selectedMonth]);
  function saveMonthTarget(value: string) {
    setMonthTarget(value);
    try {
      localStorage.setItem(`gymup_month_target_${selectedMonth}`, value);
    } catch {
      // 保存できない環境では、その場の表示だけにする
    }
  }
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("OFFLINE");
  const [error, setError] = useState("");

  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [lowTickets, setLowTickets] = useState<TicketContractRow[]>([]);
  const [ltvCustomers, setLtvCustomers] = useState<LtvCustomer[]>([]);
  const [monthSalesRows, setMonthSalesRows] = useState<SaleRow[]>([]);
  const [handoverNote, setHandoverNote] = useState("");

  const [stats, setStats] = useState<DashboardStats>({
    todayReservationCount: 0,
    todaySalesAmount: null,
    todayUnsoldCount: 0,
    todayTicketPendingCount: 0,
    todayCounselingPendingCount: 0,
    monthSalesAmount: null,
    monthAdvanceAmount: null,
    prevMonthSalesAmount: null,
    monthToDateAmount: null,
    prevMonthSameDayAmount: null,
    monthNewCustomers: null,
    customerCount: null,
    lowTicketCount: 0,
  });

  const selectedDateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);

  // 前月同日比（今月1日〜今日 と 前月1日〜同じ日）
  const monthlyChangeText = useMemo(
    () => getMonthlyChangeText(stats.monthToDateAmount, stats.prevMonthSameDayAmount),
    [stats.monthToDateAmount, stats.prevMonthSameDayAmount]
  );

  const storeSalesSummary = useMemo<MonthlySummaryItem[]>(() => {
    const map = new Map<string, MonthlySummaryItem>();

    for (const sale of monthSalesRows) {
      if (isAdvanceSale(sale)) continue;
      const name = trimmed(sale.store_name) || "店舗未設定";
      const amount = Number(sale.amount || 0);
      if (!Number.isFinite(amount)) continue;

      const current = map.get(name) || { name, amount: 0, count: 0 };
      current.amount += amount;
      current.count += 1;
      map.set(name, current);
    }

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [monthSalesRows]);

  const staffSalesSummary = useMemo<MonthlySummaryItem[]>(() => {
    const map = new Map<string, MonthlySummaryItem>();

    for (const sale of monthSalesRows) {
      if (isAdvanceSale(sale)) continue;
      const name = trimmed(sale.staff_name) || "担当未設定";
      const amount = Number(sale.amount || 0);
      if (!Number.isFinite(amount)) continue;

      const current = map.get(name) || { name, amount: 0, count: 0 };
      current.amount += amount;
      current.count += 1;
      map.set(name, current);
    }

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [monthSalesRows]);

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
          if (!mounted) return;
          setSystemStatus("OFFLINE");
          setReservations([]);
          setTodoItems([]);
          setLowTickets([]);
          setLtvCustomers([]);
          setMonthSalesRows([]);
          setStats({
            todayReservationCount: 0,
            todaySalesAmount: null,
            todayUnsoldCount: 0,
            todayTicketPendingCount: 0,
            todayCounselingPendingCount: 0,
            monthSalesAmount: null,
            monthAdvanceAmount: null,
            prevMonthSalesAmount: null,
            monthToDateAmount: null,
            prevMonthSameDayAmount: null,
            monthNewCustomers: null,
            customerCount: null,
            lowTicketCount: 0,
          });
          setLoading(false);
          return;
        }

                const monthRange = getMonthRange(`${selectedMonth}-01`);
        const prevMonthRange = getPrevMonthRange(`${selectedMonth}-01`);

        const [
          reservationsResult,
          customersResult,
          todaySalesResult,
          monthSalesResult,
          prevMonthSalesResult,
          monthNewCustomersResult,
          lowTicketsResult,
        ] = await Promise.all([
          supabase
            .from("reservations")
            .select(
              "id, date, start_time, end_time, customer_id, customer_name, menu, staff_name, store_name, memo, visit_type, reservation_status, is_first_visit, created_at"
            )
            .eq("date", selectedDate)
            .order("start_time", { ascending: true }),

          fetchAllRows<CustomerRow>((from, to) =>
            supabase
              .from("customers")
              .select("id, name, plan_type, created_at")
              .order("id", { ascending: true })
              .range(from, to)
          ),

          supabase.from("sales").select("*").eq("sale_date", selectedDate),

          fetchAllRows<SaleRow>((from, to) =>
            supabase
              .from("sales")
              .select("*")
              .gte("sale_date", monthRange.start)
              .lt("sale_date", monthRange.end)
              .order("id", { ascending: true })
              .range(from, to)
          ),

          fetchAllRows<SaleRow>((from, to) =>
            supabase
              .from("sales")
              .select("*")
              .gte("sale_date", prevMonthRange.start)
              .lt("sale_date", prevMonthRange.end)
              .order("id", { ascending: true })
              .range(from, to)
          ),

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
        ]);

        if (reservationsResult.error) throw reservationsResult.error;

        const rawReservations = (reservationsResult.data || []) as ReservationRow[];
        const customers = ((customersResult.data || []) as CustomerRow[]) || [];
        const todaySales = ((todaySalesResult.data || []) as SaleRow[]) || [];
        const monthSales = ((monthSalesResult.data || []) as SaleRow[]) || [];
        const prevMonthSales = ((prevMonthSalesResult.data || []) as SaleRow[]) || [];
        const lowTicketRows = ((lowTicketsResult.data || []) as TicketContractRow[]) || [];

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
        if (customersResult.error) {
          console.error("customers load error:", customersResult.error);
        }

        setSystemStatus("ONLINE");

        // カウンセリング済み・回数券消化済みを予約IDで突き合わせる
        // （以前は常に「未」扱いで、カウンセリング未・回数券未消化の件数が正しくなかった）
        const reservationIds = rawReservations
          .map((row) => row.id)
          .filter((id) => id !== null && id !== undefined && trimmed(id) !== "");

        const [counselingResult, usageResult] =
          reservationIds.length > 0
            ? await Promise.all([
                supabase.from("counselings").select("reservation_id").in("reservation_id", reservationIds),
                supabase.from("ticket_usages").select("reservation_id").in("reservation_id", reservationIds),
              ])
            : [{ data: [], error: null }, { data: [], error: null }];

        const counseledIds = new Set(
          ((counselingResult.data || []) as { reservation_id: unknown }[]).map((row) =>
            trimmed(row.reservation_id)
          )
        );
        const ticketUsedIds = new Set(
          ((usageResult.data || []) as { reservation_id: unknown }[]).map((row) =>
            trimmed(row.reservation_id)
          )
        );
                const displayReservations: DashboardReservation[] = rawReservations.map((row) => {
          const reservationId = trimmed(row.id);
          const customerId = trimmed(row.customer_id);
          const customer = customerId ? customerMapById.get(customerId) : null;

          const menu = trimmed(row.menu) || "メニュー未設定";
          const isTicket = isTicketMenu(menu);

          return {
            id: reservationId,
            date: trimmed(row.date),
            time: trimmed(row.start_time).slice(0, 5),
            endTime: trimmed(row.end_time).slice(0, 5),
            customerId,
            customerName: trimmed(row.customer_name) || getCustomerName(customer),
            menu,
            staffName: trimmed(row.staff_name) || "担当未設定",
            storeName: trimmed(row.store_name) || "店舗未設定",
            memo: trimmed(row.memo),
            visitType: getVisitType(row),
            reservationStatus: trimmed(row.reservation_status),
            isTicket,
            isSold:
              trimmed(row.reservation_status) === "売上済" ||
              todaySales.some((sale) => trimmed(sale.reservation_id) === reservationId),
            isTicketUsed: ticketUsedIds.has(reservationId),
            isCounseled: counseledIds.has(reservationId),
            ticketName: resolveTicketName({
              reservationMenu: menu,
              customerPlanType: customer?.plan_type || null,
            }),
            remainingCount: null,
          };
        });

        const nextTodoItems: TodoItem[] = displayReservations
          .filter((item) => !item.isSold)
          .map((item) => ({
            id: `unsold-${item.id}`,
            title: `${item.time} ${item.customerName}`,
            sub: `${item.menu} / ${item.staffName} / 売上未入力`,
            href: `/reservation/detail/${item.id}`,
            customerHref: item.customerId ? `/customer/${item.customerId}` : undefined,
            level: "red",
          }));

        for (const item of displayReservations) {
          if (!isNewVisit(item) || item.isCounseled) continue;
          nextTodoItems.push({
            id: `counseling-${item.id}`,
            title: `${item.time} ${item.customerName}`,
            sub: `${item.menu} / ${item.staffName} / カウンセリング未入力`,
            href: `/reservation/detail/${item.id}`,
            customerHref: item.customerId ? `/customer/${item.customerId}` : undefined,
            level: "purple",
          });
        }

        // LTV（これまでの純売上の累計）上位5名。前受金は二重計上になるので除く
        const ltvSalesResult = await fetchAllRows<SaleRow>((from, to) =>
          supabase
            .from("sales")
            .select("id, customer_id, customer_name, amount, sale_type, staff_name")
            .order("id", { ascending: true })
            .range(from, to)
        );
        const ltvStaff = new Map<string, Map<string, number>>();
        const ltvMap = new Map<string, LtvCustomer>();
        for (const sale of ltvSalesResult.data) {
          if (isAdvanceSale(sale)) continue;
          const amount = Number(sale.amount || 0);
          if (!Number.isFinite(amount)) continue;
          const customerId = trimmed(sale.customer_id);
          const customerName =
            trimmed(sale.customer_name) ||
            (customerId ? getCustomerName(customerMapById.get(customerId)) : "") ||
            "名前未設定";
          const key = customerId || `name-${normalizeName(customerName)}`;
          const current = ltvMap.get(key) || { customerId: key, customerName, amount: 0, count: 0, mainStaff: "" };
          current.amount += amount;
          current.count += 1;
          ltvMap.set(key, current);
          const staff = trimmed(sale.staff_name);
          if (staff) {
            const counts = ltvStaff.get(key) || new Map<string, number>();
            counts.set(staff, (counts.get(staff) || 0) + 1);
            ltvStaff.set(key, counts);
          }
        }
        const ltvList: LtvCustomer[] = Array.from(ltvMap.values())
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10)
          .map((item) => {
            const counts = Array.from(ltvStaff.get(item.customerId)?.entries() || []);
            counts.sort((a, b) => b[1] - a[1]);
            return { ...item, mainStaff: counts[0]?.[0] || "" };
          });

        setReservations(displayReservations);
        setTodoItems(nextTodoItems);
        setLowTickets(lowTicketRows);
        setLtvCustomers(ltvList);
        setMonthSalesRows(monthSales);

        // 前月同日比：選んだ月が今月なら「1日〜今日」どうし、過去の月なら1か月どうしで比べる
        const todayString = getTodayDateString();
        const cutoffDay = todayString.slice(0, 7) === selectedMonth ? Number(todayString.slice(8, 10)) : 31;
        const upToCutoff = (rows: SaleRow[]) =>
          rows.filter((row) => Number(trimmed(row.sale_date).slice(8, 10) || 0) <= cutoffDay);

        setStats({
          todayReservationCount: displayReservations.length,
          todaySalesAmount: calcNetSalesAmount(todaySales),
          todayUnsoldCount: displayReservations.filter((item) => !item.isSold).length,
          todayTicketPendingCount: displayReservations.filter(
            (item) => item.isTicket && !item.isTicketUsed
          ).length,
          todayCounselingPendingCount: displayReservations.filter(
            (item) => isNewVisit(item) && !item.isCounseled
          ).length,
          monthSalesAmount: calcNetSalesAmount(monthSales),
          monthAdvanceAmount: calcAdvanceAmount(monthSales),
          prevMonthSalesAmount: calcNetSalesAmount(prevMonthSales),
          monthToDateAmount: calcNetSalesAmount(upToCutoff(monthSales)),
          prevMonthSameDayAmount: calcNetSalesAmount(upToCutoff(prevMonthSales)),
          monthNewCustomers: Array.isArray(monthNewCustomersResult.data)
            ? monthNewCustomersResult.data.length
            : null,
          customerCount: customers.length,
          lowTicketCount: lowTicketRows.length,
        });
      } catch (e) {
        console.error("dashboard load error:", e);

        if (!mounted) return;

        setError(extractErrorMessage(e));
        setSystemStatus("OFFLINE");
        setReservations([]);
        setTodoItems([]);
        setLowTickets([]);
        setLtvCustomers([]);
        setMonthSalesRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [authChecked, selectedDate, selectedMonth]);

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
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gu-bg)", color: "var(--gu-sub)", fontSize: 14 }}>
        認証を確認中...
      </main>
    );
  }

  // ---- 表示用の値 ----
  const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const selectedDateObj = new Date(`${selectedDate}T00:00:00`);
  const headerDate = Number.isNaN(selectedDateObj.getTime())
    ? selectedDate
    : `${selectedDate.replace(/-/g, ".")} ${WEEKDAYS[selectedDateObj.getDay()]}`;
  const isTodaySelected = selectedDate === getTodayDateString();
  const selectedMonthNumber = Number(selectedMonth.slice(5, 7));
  const isCurrentMonth = getTodayDateString().slice(0, 7) === selectedMonth;

  const monthActual = stats.monthSalesAmount || 0;
  const monthTargetNumber = Number(monthTarget || 0);
  const monthRate = monthTargetNumber > 0 ? monthActual / monthTargetNumber : null;
  const RING_LENGTH = 2 * Math.PI * 44;
  const ringOffset = RING_LENGTH * (1 - Math.min(1, Math.max(0, monthRate ?? 0)));

  const unsoldItems = todoItems.filter((item) => item.id.startsWith("unsold-"));
  const counselingItems = todoItems.filter((item) => item.id.startsWith("counseling-"));
  const todayTaskCount = unsoldItems.length + counselingItems.length + stats.todayTicketPendingCount;

  const taskRows: { key: string; label: string; count: number; items?: TodoItem[]; href?: string }[] = [
    { key: "unsold", label: "売上未入力", count: unsoldItems.length, items: unsoldItems },
    { key: "counseling", label: "カウンセリング未入力", count: counselingItems.length, items: counselingItems },
    { key: "ticket", label: "回数券の消化が未入力", count: stats.todayTicketPendingCount, href: "#reservations" },
    { key: "low", label: "回数券の残りわずか（残3回以下）", count: stats.lowTicketCount, href: "#low-tickets" },
  ].filter((row) => row.count > 0);

  const daysInSelectedMonth = (() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  })();
  const elapsedDays = isCurrentMonth
    ? Number(getTodayDateString().slice(8, 10))
    : getTodayDateString().slice(0, 7) > selectedMonth
    ? daysInSelectedMonth
    : 0;
  const forecast = elapsedDays > 0 ? Math.round((monthActual / elapsedDays) * daysInSelectedMonth) : null;

  return (
    <>
      <style>{`
        .gu-home {
          min-height: 100vh;
          background: var(--gu-bg);
          color: var(--gu-ink);
          font-family: var(--gu-font-body);
          padding-bottom: calc(120px + env(safe-area-inset-bottom));
        }
        .gu-home * { box-sizing: border-box; }
        .gu-home a { color: inherit; }
        .gu-container {
          max-width: 560px;
          margin: 0 auto;
        }
        .gu-num { font-family: var(--gu-font-num); font-variant-numeric: tabular-nums; }
        .gu-heading {
          margin: 0;
          font-family: var(--gu-font-heading);
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.02em;
        }
        .gu-label { font-size: 12px; color: var(--gu-sub); letter-spacing: 0.12em; }
        .gu-sub { font-size: 12px; color: var(--gu-sub); }

        .gu-header {
          padding: 28px 24px 8px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .gu-logo {
          font-family: var(--gu-font-logo);
          font-weight: 600;
          font-size: 22px;
          letter-spacing: 0.24em;
        }
        .gu-icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 22px;
          border: 1px solid var(--gu-line);
          background: var(--gu-card);
          color: var(--gu-ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
        }
        .gu-icon-btn .badge {
          position: absolute;
          top: 9px;
          right: 10px;
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background: var(--gu-gold);
        }

        .gu-daybar {
          margin: 12px 24px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .gu-daybar button, .gu-daybar input {
          height: 40px;
          border-radius: 999px;
          border: 1px solid var(--gu-line);
          background: var(--gu-card);
          color: var(--gu-ink);
          font-size: 13px;
          font-family: var(--gu-font-body);
          padding: 0 14px;
          cursor: pointer;
        }
        .gu-daybar button.on { background: var(--gu-ink); color: var(--gu-bg); border-color: var(--gu-ink); }
        .gu-daybar input { flex: 1; min-width: 0; padding: 0 12px; font-family: var(--gu-font-num); }

        .gu-today { padding: 28px 24px 24px; display: flex; flex-direction: column; gap: 8px; }
        .gu-today-amount { font-size: 60px; font-weight: 600; line-height: 1; letter-spacing: -0.02em; }

        .gu-rule { margin: 0 24px; height: 1px; background: var(--gu-line); }

        .gu-month { padding: 24px; display: flex; align-items: center; gap: 20px; }
        .gu-month-info { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .gu-month-amount { font-size: 30px; font-weight: 600; line-height: 1.05; }
        .gu-change { font-size: 12px; color: var(--gu-gold-text); font-weight: 500; }

        .gu-tasks {
          margin: 0 24px 28px;
          border-radius: 20px;
          background: var(--gu-ink);
          color: var(--gu-bg);
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
        .gu-tasks-head { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 12px; }
        .gu-tasks-count { font-size: 14px; color: var(--gu-gold-on-ink); }
        .gu-task-row {
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-top: 1px solid rgba(247, 245, 240, 0.16);
          color: var(--gu-bg);
          text-decoration: none;
          background: none;
          border-left: 0; border-right: 0; border-bottom: 0;
          width: 100%;
          padding: 0;
          font-family: var(--gu-font-body);
          font-size: 14px;
          cursor: pointer;
          text-align: left;
        }
        .gu-tasks summary::-webkit-details-marker { display: none; }
        .gu-task-row .right { font-size: 13px; color: #D3CEC3; white-space: nowrap; }
        .gu-task-items { display: flex; flex-direction: column; gap: 2px; padding: 4px 0 10px 12px; }
        .gu-task-item {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          min-height: 44px; color: var(--gu-bg); text-decoration: none; font-size: 13px;
          border-top: 1px dashed rgba(247, 245, 240, 0.12);
        }
        .gu-task-item .meta { font-size: 11px; color: #A9A49A; }
        .gu-task-item .go { color: var(--gu-gold-on-ink); font-size: 12px; white-space: nowrap; }
        .gu-tasks-empty { font-size: 13px; color: #D3CEC3; border-top: 1px solid rgba(247, 245, 240, 0.16); padding-top: 14px; }

        .gu-section { padding: 0 24px; margin-bottom: 32px; }
        .gu-section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 8px; }
        .gu-section-head a, .gu-link { font-size: 13px; color: var(--gu-gold-text); text-decoration: none; }

        .gu-resv {
          min-height: 64px;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid var(--gu-line);
          text-decoration: none;
          color: var(--gu-ink);
        }
        .gu-resv-time { width: 52px; flex-shrink: 0; font-size: 14px; font-weight: 500; color: var(--gu-sub); }
        .gu-resv-main { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
        .gu-resv-name { font-size: 15px; font-weight: 500; }
        .gu-resv-menu { font-size: 12px; color: var(--gu-sub); overflow: hidden; text-overflow: ellipsis; }
        .gu-tags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; max-width: 46%; }
        .gu-tag {
          font-size: 11px;
          color: var(--gu-gold-text);
          border: 1px solid var(--gu-tag-border);
          border-radius: 999px;
          padding: 3px 9px;
          white-space: nowrap;
        }
        .gu-tag.done { color: var(--gu-sub); border-color: var(--gu-line); }
        .gu-tag.alert { color: var(--gu-card); background: var(--gu-gold); border-color: var(--gu-gold); }

        .gu-card {
          background: var(--gu-card);
          border: 1px solid var(--gu-line);
          border-radius: 20px;
          padding: 18px;
        }
        .gu-list-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          min-height: 44px; padding: 8px 0; border-bottom: 1px solid var(--gu-line);
          text-decoration: none; color: var(--gu-ink); font-size: 14px;
        }
        .gu-list-row:last-child { border-bottom: 0; }
        .gu-list-row .val { font-size: 13px; color: var(--gu-sub); text-align: right; }
        .gu-empty { font-size: 13px; color: var(--gu-sub); padding: 12px 0; }
        .gu-field {
          height: 40px; border-radius: 12px; border: 1px solid var(--gu-line); background: var(--gu-card);
          color: var(--gu-ink); padding: 0 12px; font-size: 14px; font-family: var(--gu-font-num);
        }
        .gu-menu { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .gu-menu a {
          display: flex; flex-direction: column; gap: 4px; padding: 14px; min-height: 72px;
          border-radius: 16px; border: 1px solid var(--gu-line); background: var(--gu-card);
          text-decoration: none; color: var(--gu-ink);
        }
        .gu-menu .t { font-size: 14px; font-weight: 700; }
        .gu-menu .d { font-size: 11px; color: var(--gu-sub); line-height: 1.5; }
        .gu-btn {
          height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--gu-line);
          background: var(--gu-card); color: var(--gu-ink); font-size: 13px; font-family: var(--gu-font-body); cursor: pointer;
        }
        .gu-memo {
          width: 100%; min-height: 110px; border-radius: 14px; border: 1px solid var(--gu-line);
          background: var(--gu-card); color: var(--gu-ink); padding: 12px; font-size: 14px;
          font-family: var(--gu-font-body); resize: vertical;
        }
        .gu-error {
          margin: 12px 24px 0; padding: 12px 14px; border-radius: 14px;
          border: 1px solid #E3C2BB; background: #FBF1EE; color: #8A2E21; font-size: 13px;
        }
        .gu-two { display: grid; grid-template-columns: 1fr; gap: 16px; }

        /* パソコン：上は「売上」と「今日やること」を左右に並べ、予約は横いっぱい、
           その下の欄は2列に高さをそろえて流し込む（左だけ空く・右だけ長いのを防ぐ） */
        @media (min-width: 1024px) {
          .gu-container { max-width: 1120px; }
          .gu-col-main {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            align-items: start;
          }
          .gu-header, .gu-daybar, .gu-error, #reservations { grid-column: 1 / -1; }
          .gu-daybar { max-width: 520px; }
          .gu-kpi { grid-column: 1; }
          .gu-tasks { grid-column: 2; margin: 28px 24px 28px 0; }
          .gu-col-side { column-count: 2; column-gap: 0; }
          .gu-col-side .gu-section { break-inside: avoid; display: inline-block; width: 100%; }
          .gu-two { grid-template-columns: 1fr; }
        }
      `}</style>

      <main className="gu-home">
        <div className="gu-container">
          <div className="gu-col-main">
            <header className="gu-header">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="gu-logo">GYMUP</span>
                <span className="gu-sub" style={{ letterSpacing: "0.08em" }}>
                  <span className="gu-num">{headerDate}</span> ・ 全店舗
                </span>
              </div>
              <Link href="/followup" className="gu-icon-btn" aria-label="フォロー確認（お知らせ）">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10 21h4" />
                </svg>
                {stats.lowTicketCount > 0 ? <span className="badge" aria-hidden="true" /> : null}
              </Link>
            </header>

            <div className="gu-daybar">
              <button type="button" onClick={() => setSelectedDate((prev) => shiftDateString(prev, -1))}>
                ‹ 前日
              </button>
              <button type="button" onClick={goToday} className={isTodaySelected ? "on" : ""}>
                今日
              </button>
              <button type="button" onClick={() => setSelectedDate((prev) => shiftDateString(prev, 1))}>
                翌日 ›
              </button>
              <input
                type="date"
                aria-label="日付を選ぶ"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              />
            </div>

            {error ? <div className="gu-error">読み込みエラー：{error}</div> : null}

            <div className="gu-kpi">
            <section className="gu-today">
              <span className="gu-label">{isTodaySelected ? "TODAY'S SALES" : `${selectedDateLabel} の売上`}</span>
              <span className="gu-today-amount gu-num">{loading ? "…" : formatYen(stats.todaySalesAmount)}</span>
              <span className="gu-sub">
                純売上（前受金除く）・予約 <span className="gu-num">{loading ? "…" : stats.todayReservationCount}</span>件
              </span>
            </section>

            <div className="gu-rule" />

            <section className="gu-month">
              <svg width="104" height="104" viewBox="0 0 104 104" role="img" aria-label={monthRate !== null ? `月間目標の達成率 ${Math.round(monthRate * 100)}%` : "月間目標は未設定"}>
                <circle cx="52" cy="52" r="44" fill="none" stroke="var(--gu-track)" strokeWidth="6" />
                {monthRate !== null ? (
                  <circle
                    cx="52"
                    cy="52"
                    r="44"
                    fill="none"
                    stroke="var(--gu-gold)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={RING_LENGTH}
                    strokeDashoffset={ringOffset}
                    transform="rotate(-90 52 52)"
                  />
                ) : null}
                <text x="52" y="52" textAnchor="middle" fontFamily="var(--gu-font-num)" fontSize="18" fontWeight="600" fill="var(--gu-ink)">
                  {monthRate !== null ? `${Math.round(monthRate * 100)}%` : "—"}
                </text>
                <text x="52" y="69" textAnchor="middle" fontSize="10" fill="var(--gu-sub)">
                  {monthRate !== null ? "月間目標" : "目標未設定"}
                </text>
              </svg>
              <div className="gu-month-info">
                <span className="gu-sub">{selectedMonthNumber}月の純売上</span>
                <span className="gu-month-amount gu-num">{loading ? "…" : formatYen(stats.monthSalesAmount)}</span>
                <span className="gu-sub">
                  前受金 <span className="gu-num">{formatYen(stats.monthAdvanceAmount)}</span>
                </span>
                <span className="gu-change">
                  {isCurrentMonth ? "前月同日比" : "前月比"} <span className="gu-num">{loading ? "…" : monthlyChangeText}</span>
                </span>
              </div>
            </section>
            </div>

            <section className="gu-tasks" aria-labelledby="gu-tasks-title">
              <div className="gu-tasks-head">
                <h2 id="gu-tasks-title" className="gu-heading">今日やること</h2>
                <span className="gu-tasks-count">
                  <span className="gu-num">{loading ? "…" : todayTaskCount}</span> 件
                </span>
              </div>
              {loading ? (
                <div className="gu-tasks-empty">確認中…</div>
              ) : taskRows.length === 0 ? (
                <div className="gu-tasks-empty">未処理はありません。</div>
              ) : (
                taskRows.map((row) =>
                  row.items ? (
                    <details key={row.key}>
                      <summary className="gu-task-row" style={{ listStyle: "none" }}>
                        <span>{row.label}</span>
                        <span className="right">
                          <span className="gu-num">{row.count}</span>件 ▾
                        </span>
                      </summary>
                      <div className="gu-task-items">
                        {row.items.map((item) => (
                          <Link key={item.id} href={item.href} className="gu-task-item">
                            <span>
                              <span className="gu-num">{item.title}</span>
                              <br />
                              <span className="meta">{item.sub}</span>
                            </span>
                            <span className="go">開く →</span>
                          </Link>
                        ))}
                      </div>
                    </details>
                  ) : (
                    <a key={row.key} href={row.href} className="gu-task-row">
                      <span>{row.label}</span>
                      <span className="right">
                        <span className="gu-num">{row.count}</span>件 →
                      </span>
                    </a>
                  )
                )
              )}
            </section>

            <section className="gu-section" id="reservations">
              <div className="gu-section-head">
                <h2 className="gu-heading">{isTodaySelected ? "本日のご予約" : `${selectedDateLabel} のご予約`}</h2>
                <Link href="/reservation">一覧へ</Link>
              </div>
              {loading ? (
                <div className="gu-empty">読み込み中…</div>
              ) : reservations.length === 0 ? (
                <div className="gu-empty">この日の予約はありません。</div>
              ) : (
                reservations.map((item) => (
                  <Link
                    key={item.id}
                    href={item.customerId ? `/customer/${item.customerId}/training` : `/reservation/detail/${item.id}`}
                    className="gu-resv"
                  >
                    <span className="gu-resv-time gu-num">{item.time || "--:--"}</span>
                    <span className="gu-resv-main">
                      <span className="gu-resv-name">{item.customerName} 様</span>
                      <span className="gu-resv-menu">
                        {item.menu} ・ {item.staffName}
                        {item.storeName ? ` ・ ${item.storeName}` : ""}
                      </span>
                      {item.memo ? <span className="gu-resv-menu">メモ：{item.memo}</span> : null}
                    </span>
                    <span className="gu-tags">
                      <span className={`gu-tag ${item.isSold ? "done" : "alert"}`}>{item.isSold ? "売上済" : "売上未入力"}</span>
                      {item.isTicket ? (
                        <span className={`gu-tag ${item.isTicketUsed ? "done" : ""}`}>
                          {item.isTicketUsed ? "回数券 消化済" : "回数券 消化未入力"}
                        </span>
                      ) : null}
                      {item.isTicket && item.remainingCount !== null ? (
                        <span className="gu-tag">回数券 残{item.remainingCount}回</span>
                      ) : null}
                      {isNewVisit(item) ? (
                        <span className={`gu-tag ${item.isCounseled ? "done" : ""}`}>
                          {item.isCounseled ? "初回・カウンセリング済" : "初回"}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                ))
              )}
            </section>
          </div>

          <div className="gu-col-side">
            <section className="gu-section">
              <div className="gu-section-head">
                <h2 className="gu-heading">今月の売上</h2>
                <input
                  type="month"
                  aria-label="月を選ぶ"
                  className="gu-field"
                  value={selectedMonth}
                  onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                />
              </div>
              <div className="gu-card" style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="gu-sub">{selectedMonthNumber}月の目標（純売上）</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="gu-field"
                    value={monthTarget}
                    onChange={(e) => saveMonthTarget(e.target.value)}
                    placeholder="例：4500000"
                  />
                </label>
                <div className="gu-sub" style={{ display: "grid", gap: 4, lineHeight: 1.7 }}>
                  {monthRate !== null ? (
                    <span>
                      達成率 <span className="gu-num">{Math.round(monthRate * 1000) / 10}%</span>（あと{" "}
                      <span className="gu-num">{formatYen(Math.max(0, monthTargetNumber - monthActual))}</span>）
                    </span>
                  ) : (
                    <span>目標を入れると、上の円グラフに達成率が出ます。</span>
                  )}
                  {isCurrentMonth && forecast !== null ? (
                    <span>
                      このペースなら月末 <span className="gu-num">{formatYen(forecast)}</span>
                      {monthTargetNumber > 0
                        ? forecast >= monthTargetNumber
                          ? "（目標達成ペース）"
                          : `（目標まで1日あたり ${formatYen(
                              Math.ceil((monthTargetNumber - monthActual) / Math.max(1, daysInSelectedMonth - elapsedDays))
                            )} 必要）`
                        : ""}
                    </span>
                  ) : null}
                  <span>
                    売上 <span className="gu-num">{monthSalesRows.length}</span>件 ・ 前月の1か月分{" "}
                    <span className="gu-num">{formatYen(stats.prevMonthSalesAmount)}</span>
                  </span>
                </div>
              </div>
              <div className="gu-two" style={{ marginTop: 16 }}>
                <div className="gu-card">
                  <div className="gu-sub" style={{ marginBottom: 4 }}>店舗別</div>
                  {storeSalesSummary.length === 0 ? (
                    <div className="gu-empty">この月の売上はありません。</div>
                  ) : (
                    storeSalesSummary.map((item) => (
                      <div key={item.name} className="gu-list-row">
                        <span>{item.name}</span>
                        <span className="val gu-num">
                          {formatYen(item.amount)} / {item.count}件
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="gu-card">
                  <div className="gu-sub" style={{ marginBottom: 4 }}>担当者別</div>
                  {staffSalesSummary.length === 0 ? (
                    <div className="gu-empty">この月の売上はありません。</div>
                  ) : (
                    staffSalesSummary.map((item) => (
                      <div key={item.name} className="gu-list-row">
                        <span>{item.name}</span>
                        <span className="val gu-num">
                          {formatYen(item.amount)} / {item.count}件
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="gu-section" id="low-tickets">
              <div className="gu-section-head">
                <h2 className="gu-heading">回数券の残りわずか</h2>
                <span className="gu-sub">残3回以下 <span className="gu-num">{lowTickets.length}</span>件</span>
              </div>
              <div className="gu-card">
                {loading ? (
                  <div className="gu-empty">読み込み中…</div>
                ) : lowTickets.length === 0 ? (
                  <div className="gu-empty">残りわずかの回数券はありません。</div>
                ) : (
                  lowTickets.map((ticket) => (
                    <Link
                      key={String(ticket.id)}
                      href={ticket.customer_id ? `/customer/${ticket.customer_id}` : "/customer"}
                      className="gu-list-row"
                    >
                      <span>{ticket.ticket_name || "回数券"}</span>
                      <span className="val gu-num">
                        残{Number(ticket.remaining_count || 0)}回 / 使用{Number(ticket.used_count || 0)}回
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="gu-section">
              <div className="gu-section-head">
                <h2 className="gu-heading">LTV上位のお客様</h2>
                <Link href="/ltv">ランキングへ</Link>
              </div>
              <div className="gu-card">
                {loading ? (
                  <div className="gu-empty">読み込み中…</div>
                ) : ltvCustomers.length === 0 ? (
                  <div className="gu-empty">売上データがまだありません。</div>
                ) : (
                  ltvCustomers.map((item, index) => (
                    <Link
                      key={item.customerId}
                      href={
                        item.customerId.startsWith("name-")
                          ? `/customer?keyword=${encodeURIComponent(item.customerName)}`
                          : `/customer/${item.customerId}`
                      }
                      className="gu-list-row"
                    >
                      <span>
                        <span className="gu-num" style={{ color: "var(--gu-gold-text)", marginRight: 8 }}>{index + 1}</span>
                        {item.customerName}
                      </span>
                      <span className="val">
                        <span className="gu-num">{formatYen(item.amount)}</span>
                        <br />
                        メイン担当 {item.mainStaff || "—"}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="gu-section">
              <div className="gu-section-head">
                <h2 className="gu-heading">引き継ぎメモ</h2>
                <span className="gu-sub">{selectedDateLabel}</span>
              </div>
              <textarea
                className="gu-memo"
                aria-label="引き継ぎメモ"
                value={handoverNote}
                onChange={(e) => handleHandoverChange(e.target.value)}
                placeholder="例：◯◯様、腰痛あり。ストレッチ弱め。次回更新案内。"
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="gu-btn" onClick={handleClearHandover}>
                  メモを消す
                </button>
              </div>
            </section>

            <section className="gu-section" id="menu">
              <div className="gu-section-head">
                <h2 className="gu-heading">メニュー</h2>
              </div>
              <nav className="gu-menu" aria-label="すべてのメニュー">
                {quickLinks.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span className="t">{item.title}</span>
                    <span className="d">{item.desc}</span>
                  </Link>
                ))}
              </nav>
              <div className="gu-card" style={{ marginTop: 16 }}>
                <div className="gu-list-row">
                  <span>会員数</span>
                  <span className="val gu-num">{stats.customerCount === null ? "--" : `${stats.customerCount}名`}</span>
                </div>
                <div className="gu-list-row">
                  <span>{selectedMonthNumber}月の新規登録</span>
                  <span className="val gu-num">{stats.monthNewCustomers === null ? "--" : `${stats.monthNewCustomers}名`}</span>
                </div>
                <div className="gu-list-row">
                  <span>データ接続</span>
                  <span className="val">{systemStatus === "ONLINE" ? "正常" : "接続できていません"}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button type="button" className="gu-btn" onClick={handleLogout}>
                  ログアウト
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
