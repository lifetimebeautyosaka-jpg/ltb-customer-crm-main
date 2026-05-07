"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

function ticketRemainingClass(value: number | null) {
  if (value === null) return "";
  if (value <= 0) return "zero";
  if (value === 1) return "red";
  if (value <= 3) return "orange";
  return "done";
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

  const storeSalesSummary = useMemo<MonthlySummaryItem[]>(() => {
    const map = new Map<string, MonthlySummaryItem>();

    for (const sale of monthSalesRows) {
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
            prevMonthSalesAmount: null,
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
    return <main className="gymup-loading">認証を確認中...</main>;
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
      label: "選択月売上",
      value: loading ? "..." : formatYen(stats.monthSalesAmount),
      sub: `前月比 ${monthlyChangeText}`,
      accent: monthlyChangeText.startsWith("+")
        ? "green"
        : monthlyChangeText.startsWith("-")
        ? "red"
        : "",
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
        .date-input,
        .month-input {
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

        .date-input::-webkit-calendar-picker-indicator,
        .month-input::-webkit-calendar-picker-indicator {
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
          box-shadow: 0 10px 30px rgba(0,0,0,0.18);
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

        .panel {
          border-radius: 28px;
          padding: 22px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.035);
          box-shadow: 0 18px 48px rgba(0,0,0,0.22);
          margin-bottom: 18px;
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
          letter-spacing: -0.03em;
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

        .todo-list,
        .reservation-list,
        .side-list,
        .quick-links {
          display: grid;
          gap: 10px;
        }

        .todo-item,
        .reservation-item,
        .side-item,
        .quick-link {
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.032);
        }

        .todo-item.red {
          border-color: rgba(255,80,80,0.28);
          background: rgba(255,80,80,0.09);
        }

        .todo-item.orange {
          border-color: rgba(240,138,39,0.24);
          background: rgba(240,138,39,0.08);
        }

        .todo-item.purple {
          border-color: rgba(168,85,247,0.24);
          background: rgba(168,85,247,0.08);
        }

        .todo-item.green {
          border-color: rgba(92,214,146,0.24);
          background: rgba(92,214,146,0.08);
        }

        .todo-top,
        .reservation-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .todo-main,
        .reservation-main,
        .side-main {
          color: #fff;
          font-size: 14px;
          font-weight: 900;
        }

        .todo-sub,
        .reservation-sub,
        .side-sub,
        .quick-link-desc {
          margin-top: 4px;
          color: rgba(255,255,255,0.55);
          font-size: 12px;
          line-height: 1.6;
          font-weight: 700;
        }

        .todo-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .todo-link {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
        }

        .quick-link {
          text-decoration: none;
          transition: 0.2s ease;
        }

        .quick-link:hover {
          transform: translateY(-2px);
          border-color: rgba(240,138,39,0.26);
        }

        .quick-link-title {
          color: #fff;
          font-size: 14px;
          font-weight: 900;
        }

        .reservation-time {
          min-width: 72px;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(240,138,39,0.12);
          color: #ffd7ae;
          font-size: 12px;
          font-weight: 900;
          border: 1px solid rgba(240,138,39,0.20);
        }

        .reservation-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .tag {
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: #fff;
        }

        .tag.red {
          border-color: rgba(255,80,80,0.26);
          background: rgba(255,80,80,0.10);
        }

        .tag.orange {
          border-color: rgba(240,138,39,0.24);
          background: rgba(240,138,39,0.10);
        }

        .tag.green {
          border-color: rgba(92,214,146,0.24);
          background: rgba(92,214,146,0.10);
        }

        .tag.purple {
          border-color: rgba(168,85,247,0.24);
          background: rgba(168,85,247,0.10);
        }

        .ticket-count {
          font-size: 12px;
          font-weight: 900;
        }

        .ticket-count.red {
          color: #ff6f6f;
        }

        .ticket-count.orange {
          color: #ffbd66;
        }

        .ticket-count.done {
          color: #5cd692;
        }

        .memo-box {
          width: 100%;
          min-height: 160px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          padding: 16px;
          color: #fff;
          resize: vertical;
          box-sizing: border-box;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.8;
          outline: none;
        }

        .memo-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .danger-btn {
          min-height: 38px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid rgba(255,80,80,0.26);
          background: rgba(255,80,80,0.10);
          color: #ffd1d1;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .system-online {
          color: #5cd692;
        }

        .system-offline {
          color: #ff7a7a;
        }

        .monthly-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .monthly-summary-box {
          border-radius: 22px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.032);
        }

        .monthly-summary-title {
          color: #fff;
          font-size: 15px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .monthly-total-card {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 14px;
          flex-wrap: wrap;
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(240,138,39,0.22);
          background: rgba(240,138,39,0.08);
        }

        .monthly-total-label {
          color: rgba(255,255,255,0.58);
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .monthly-total-value {
          color: #fff;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .monthly-total-sub {
          color: #ffd7ae;
          font-size: 13px;
          font-weight: 900;
        }

        .empty {
          padding: 22px 16px;
          border-radius: 18px;
          border: 1px dashed rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.025);
          color: rgba(255,255,255,0.56);
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 1180px) {
          .hero-grid,
          .main-grid,
          .monthly-summary-grid {
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

          .stats-grid,
          .date-actions {
            grid-template-columns: 1fr;
          }

          .hero,
          .panel {
            border-radius: 22px;
            padding: 15px;
          }

          .hero-title {
            font-size: 34px;
          }
        }
      `}</style>

      <main className="gymup-home">
        <div className="gymup-home__container">
          <div className="topbar">
            <div className="brand">
              <div className="brand-mark" />

              <div>
                <div className="brand-title">
                  GYMUP CRM
                </div>

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

              <button
                type="button"
                onClick={handleLogout}
                className="topbar-button"
              >
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
                <div className="date-label">
                  DAILY CONTROL
                </div>

                <div className="date-title">
                  {selectedDateLabel}
                </div>

                <div className="date-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDate((prev) =>
                        shiftDateString(prev, -1)
                      )
                    }
                    className="date-btn"
                  >
                    前日
                  </button>

                  <button
                    type="button"
                    onClick={goToday}
                    className="date-btn"
                  >
                    今日
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDate((prev) =>
                        shiftDateString(prev, 1)
                      )
                    }
                    className="date-btn"
                  >
                    翌日
                  </button>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) =>
                      e.target.value &&
                      setSelectedDate(e.target.value)
                    }
                    className="date-input"
                  />
                </div>
              </div>
            </div>
          </section>
                    {error ? (
            <div className="panel">
              <div className="panel-title">エラー</div>
              <div className="panel-sub">{error}</div>
            </div>
          ) : null}

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

          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">月別・店舗別 売上管理</div>
                <div className="panel-sub">管理者用：月売上・店舗別・担当者別を確認</div>
              </div>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                className="month-input"
              />
            </div>

            <div className="monthly-total-card">
              <div>
                <div className="monthly-total-label">選択月の売上</div>
                <div className="monthly-total-value">{formatYen(stats.monthSalesAmount)}</div>
              </div>

              <div className="monthly-total-sub">
                前月比 {monthlyChangeText} / 売上 {monthSalesRows.length}件
              </div>
            </div>

            <div className="monthly-summary-grid">
              <div className="monthly-summary-box">
                <div className="monthly-summary-title">店舗別売上</div>

                {storeSalesSummary.length === 0 ? (
                  <div className="empty">この月の店舗別売上はありません。</div>
                ) : (
                  <div className="side-list">
                    {storeSalesSummary.map((item) => (
                      <div key={item.name} className="side-item">
                        <div className="side-main">{item.name}</div>
                        <div className="side-sub">
                          {formatYen(item.amount)} / {item.count}件
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="monthly-summary-box">
                <div className="monthly-summary-title">担当者別売上</div>

                {staffSalesSummary.length === 0 ? (
                  <div className="empty">この月の担当者別売上はありません。</div>
                ) : (
                  <div className="side-list">
                    {staffSalesSummary.map((item) => (
                      <div key={item.name} className="side-item">
                        <div className="side-main">{item.name}</div>
                        <div className="side-sub">
                          {formatYen(item.amount)} / {item.count}件
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                  <div className="panel-badge">
                    {loading ? "確認中" : `${todoItems.length}件`}
                  </div>
                </div>

                {loading ? (
                  <div className="empty">読み込み中...</div>
                ) : todoItems.length === 0 ? (
                  <div className="empty">今日の未処理はありません。</div>
                ) : (
                  <div className="todo-list">
                    {todoItems.map((item) => (
                      <div key={item.id} className={`todo-item ${item.level}`}>
                        <div>
                          <div className="todo-main">{item.title}</div>
                          <div className="todo-sub">{item.sub}</div>
                        </div>

                        <div className="todo-actions">
                          {item.customerHref ? (
                            <Link href={item.customerHref} className="todo-link">
                              顧客を見る
                            </Link>
                          ) : null}

                          <Link href={item.href} className="todo-link">
                            詳細へ
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
                    <div className="panel-sub">選択日の予約と処理状態を確認</div>
                  </div>
                  <div className="panel-badge">
                    {loading ? "確認中" : `${reservations.length}件`}
                  </div>
                </div>

                {loading ? (
                  <div className="empty">読み込み中...</div>
                ) : reservations.length === 0 ? (
                  <div className="empty">この日の予約はありません。</div>
                ) : (
                  <div className="reservation-list">
                    {reservations.map((item) => {
                      const remainingClass = ticketRemainingClass(item.remainingCount);

                      return (
                        <Link
                          key={item.id}
                          href={`/reservation/detail/${item.id}`}
                          className="reservation-item"
                          style={{ textDecoration: "none" }}
                        >
                          <div className="reservation-top">
                            <div className="reservation-time">{item.time}</div>
                            <div className="reservation-main">{item.customerName}</div>
                          </div>

                          <div className="reservation-sub">
                            {item.menu} / {item.staffName}
                            {item.storeName ? ` / ${item.storeName}` : ""}
                          </div>

                          {item.memo ? (
                            <div className="reservation-sub">メモ：{item.memo}</div>
                          ) : null}

                          <div className="reservation-tags">
                            <span className={`tag ${item.isSold ? "green" : "red"}`}>
                              {item.isSold ? "売上済" : "売上未"}
                            </span>

                            {item.isTicket ? (
                              <span className={`tag ${item.isTicketUsed ? "green" : "purple"}`}>
                                {item.isTicketUsed ? "消化済" : "未消化"}
                              </span>
                            ) : null}

                            {isNewVisit(item) ? (
                              <span className={`tag ${item.isCounseled ? "green" : "orange"}`}>
                                {item.isCounseled ? "カウンセ済" : "カウンセ未"}
                              </span>
                            ) : null}

                            {item.isTicket && item.remainingCount !== null ? (
                              <span className={`tag ${remainingClass}`}>
                                残{item.remainingCount}回
                              </span>
                            ) : null}
                          </div>
                        </Link>
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
                    <div className="panel-sub">よく使う管理ページへ移動</div>
                  </div>
                </div>

                <div className="quick-links">
                  {quickLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="quick-link">
                      <div className="quick-link-title">{item.title}</div>
                      <div className="quick-link-desc">{item.desc}</div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">回数券 残数注意</div>
                    <div className="panel-sub">残3回以下の契約回数券</div>
                  </div>
                  <div className="panel-badge">
                    {loading ? "確認中" : `${lowTickets.length}件`}
                  </div>
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
                        href={ticket.customer_id ? `/customer/${ticket.customer_id}` : "/customer"}
                        className="side-item"
                        style={{ textDecoration: "none" }}
                      >
                        <div className="side-main">{ticket.ticket_name || "回数券"}</div>
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
                    <div className="panel-sub">売上累計上位5名</div>
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
                        style={{ textDecoration: "none" }}
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
                    <div className="panel-sub">{selectedDateLabel} の共有事項</div>
                  </div>
                </div>

                <textarea
                  className="memo-box"
                  value={handoverNote}
                  onChange={(e) => handleHandoverChange(e.target.value)}
                  placeholder="例：◯◯様、腰痛あり。ストレッチ弱め。次回更新案内。"
                />

                <div className="memo-actions">
                  <button type="button" onClick={handleClearHandover} className="danger-btn">
                    クリア
                  </button>
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">システム状態</div>
                    <div className="panel-sub">Supabase接続とデータ確認</div>
                  </div>

                  <div
                    className={`panel-badge ${
                      systemStatus === "ONLINE" ? "system-online" : "system-offline"
                    }`}
                  >
                    {systemStatus}
                  </div>
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