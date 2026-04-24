"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

const AUTH_STORAGE_KEY = "gymup_logged_in";
const ROLE_STORAGE_KEY = "gymup_user_role";
const STAFF_NAME_STORAGE_KEY = "gymup_current_staff_name";

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
  visit_type?: string | null;
  reservation_status?: string | null;
  is_first_visit?: boolean | null;
  created_at?: string | null;
};

type CustomerRow = {
  id: string | number;
  name?: string | null;
  kana?: string | null;
  phone?: string | null;
  plan_type?: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
  kana: string;
  phone: string;
  planType?: string;
};

type SimpleReservationIdRow = {
  reservation_id?: number | string | null;
};

type StaffAttendanceItem = {
  id: string;
  staff_name: string;
  work_date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  memo?: string | null;
};

type ReservationHistoryItem = {
  id: string;
  customer_id?: string | number | null;
  customer_name?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  store_name?: string | null;
  staff_name?: string | null;
  menu?: string | null;
  memo?: string | null;
};

type StaffHistoryItem = {
  id: string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  customer_name?: string | null;
  store_name?: string | null;
  menu?: string | null;
};

type CustomerSaleHistoryItem = {
  id: string | number;
  sale_date?: string | null;
  customer_name?: string | null;
  menu_type?: string | null;
  sale_type?: string | null;
  payment_method?: string | null;
  amount?: number | null;
  staff_name?: string | null;
  store_name?: string | null;
  memo?: string | null;
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

type CustomerTicketRow = {
  id: string | number;
  customer_id?: string | number | null;
  ticket_name?: string | null;
  total_count?: number | null;
  remaining_count?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type ReservationSaleLite = {
  id: string | number;
  reservation_id?: string | number | null;
  amount?: number | null;
  payment_method?: string | null;
  sale_type?: string | null;
  menu_type?: string | null;
  memo?: string | null;
  created_at?: string | null;
};

type TicketNumberingInfo = {
  label: string;
  tone: "normal" | "warning" | "danger";
  showUpdate: boolean;
  showPaymentAlert: boolean;
};

type FilterMode =
  | "all"
  | "pending"
  | "sales_pending"
  | "counseling_pending"
  | "ticket_pending";

type SearchMode = "customer" | "staff";

type AttendanceFormMode = "create" | "edit";

type DayTimelineItem =
  | {
      type: "attendance";
      sortTime: string;
      attendance: StaffAttendanceItem;
    }
  | {
      type: "reservation";
      sortTime: string;
      reservation: ReservationRow;
    };

const STORE_OPTIONS = [
  "すべて",
  "江戸堀",
  "箕面",
  "福島",
  "福島P",
  "天満橋",
  "中崎町",
  "江坂",
];

const STORE_OPTIONS_FOR_FORM = [
  "江戸堀",
  "箕面",
  "福島",
  "福島P",
  "天満橋",
  "中崎町",
  "江坂",
];

const STAFF_OPTIONS = [
  "山口",
  "中西",
  "池田",
  "羽田",
  "石川",
  "菱谷",
  "林",
  "井上",
  "その他",
];

const MENU_OPTIONS = [
  "ストレッチ",
  "トレーニング",
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
  "ペアトレ",
  "ヘッドスパ",
  "アロマ",
  "その他",
];

const PAYMENT_OPTIONS = ["現金", "カード", "銀行振込", "その他"];
const VISIT_TYPE_OPTIONS = ["新規", "再来"];
const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

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

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatJapaneseDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${week[date.getDay()]}曜日`;
}

function formatMoney(value?: number | null) {
  return `${Number(value || 0).toLocaleString()}円`;
}

function getMondayStart(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildCalendarDays(currentMonth: Date) {
  const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const last = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const start = getMondayStart(first);
  const end = new Date(last);
  const lastDay = last.getDay();
  const addDays = lastDay === 0 ? 0 : 7 - lastDay;
  end.setDate(end.getDate() + addDays);
  end.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function addOneHour(time: string) {
  if (!time || !time.includes(":")) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + 60);
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
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

function getStaffShortLabel(staffName?: string | null) {
  const name = trimmed(staffName);
  if (!name) return "他";
  return name.slice(0, 1);
}

function sortReservations(a: ReservationRow, b: ReservationRow) {
  const aTime = trimmed(a.start_time);
  const bTime = trimmed(b.start_time);
  if (aTime < bTime) return -1;
  if (aTime > bTime) return 1;
  return 0;
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
      typeof maybe.code === "string" ? `コード: ${maybe.code}` : "",
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(" / ");
  }

  return "不明なエラーです。";
}

function formatTicketDisplayLabel(ticketName?: string | null) {
  const text = trimmed(ticketName);
  return text || "回数券";
}

function getVisitTypeLabel(item: ReservationRow) {
  const visitType = trimmed(item.visit_type);
  if (visitType) return visitType;
  return item.is_first_visit ? "新規" : "再来";
}

function isNewVisit(item: ReservationRow) {
  return getVisitTypeLabel(item) === "新規" || item.is_first_visit === true;
}

function toIdNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function isTicketMenu(menu?: string | null) {
  const text = trimmed(menu);
  return Boolean(TICKET_UNIT_PRICES[text]);
}

function detectServiceTypeFromReservationMenu(menu?: string | null) {
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

function resolveTicketName(params: {
  reservationMenu?: string | null;
  customerPlanType?: string | null;
}) {
  const reservationMenu = trimmed(params.reservationMenu);
  const customerPlanType = trimmed(params.customerPlanType);

  if (reservationMenu && TICKET_UNIT_PRICES[reservationMenu]) return reservationMenu;
  if (customerPlanType && TICKET_UNIT_PRICES[customerPlanType]) return customerPlanType;

  return "";
}

function buildSalesHref(item: ReservationRow, forceTicketMode = false) {
  const reservationId = String(item.id ?? "");
  const customerId = trimmed(item.customer_id);
  const customerName = encodeURIComponent(trimmed(item.customer_name));
  const date = trimmed(item.date);
  const menu = trimmed(item.menu);
  const staffName = encodeURIComponent(trimmed(item.staff_name));
  const paymentMethod = encodeURIComponent(trimmed(item.payment_method));
  const storeName = encodeURIComponent(trimmed(item.store_name));

  const isTicket = forceTicketMode || isTicketMenu(menu);
  const serviceType = encodeURIComponent(detectServiceTypeFromReservationMenu(menu));
  const saleType = encodeURIComponent(isTicket ? "回数券消化" : "通常売上");

  return `/sales?reservationId=${reservationId}&customerId=${customerId}&customerName=${customerName}&date=${date}&menu=${encodeURIComponent(
    menu
  )}&staffName=${staffName}&paymentMethod=${paymentMethod}&storeName=${storeName}&serviceType=${serviceType}&saleType=${saleType}`;
}

function getPendingFlags(params: {
  item: ReservationRow;
  salesReservationIdSet: Set<number>;
  counseledReservationIdSet: Set<number>;
  ticketUsedReservationIdSet: Set<number>;
}) {
  const { item, salesReservationIdSet, counseledReservationIdSet, ticketUsedReservationIdSet } =
    params;

  const reservationId = toIdNumber(item.id);
  if (reservationId === null) {
    return {
      salesPending: false,
      counselingPending: false,
      ticketPending: false,
      isPending: false,
    };
  }

  const soldByReservation = trimmed(item.reservation_status) === "売上済";
  const isSold = soldByReservation || salesReservationIdSet.has(reservationId);
  const isCounseled = counseledReservationIdSet.has(reservationId);

  const hasAnyTicket = !!trimmed(item.customer_id);
  const isTicketUsed = ticketUsedReservationIdSet.has(reservationId);

  const salesPending = !isSold;
  const counselingPending = isNewVisit(item) && !isCounseled;
  const ticketPending = hasAnyTicket && !isTicketUsed;

  return {
    salesPending,
    counselingPending,
    ticketPending,
    isPending: salesPending || counselingPending || ticketPending,
  };
}

function getPendingPriority(params: {
  item: ReservationRow;
  salesReservationIdSet: Set<number>;
  counseledReservationIdSet: Set<number>;
  ticketUsedReservationIdSet: Set<number>;
}) {
  const flags = getPendingFlags(params);
  return flags.isPending ? 0 : 1;
}

export default function ReservationPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceDeletingId, setAttendanceDeletingId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedStoreFilter, setSelectedStoreFilter] = useState("すべて");
  const [selectedFilterMode, setSelectedFilterMode] = useState<FilterMode>("all");
  const [selectedDate, setSelectedDate] = useState(toYmd(new Date()));
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [attendanceFormOpen, setAttendanceFormOpen] = useState(false);
  const [attendanceFormMode, setAttendanceFormMode] = useState<AttendanceFormMode>("create");
  const [editingAttendanceId, setEditingAttendanceId] = useState("");
  const [counselingPickerOpen, setCounselingPickerOpen] = useState(false);

  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [attendanceItems, setAttendanceItems] = useState<StaffAttendanceItem[]>([]);
  const [ticketContracts, setTicketContracts] = useState<TicketContractRow[]>([]);
  const [customerTickets, setCustomerTickets] = useState<CustomerTicketRow[]>([]);
  const [reservationSales, setReservationSales] = useState<ReservationSaleLite[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerKana, setCustomerKana] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [formDate, setFormDate] = useState(toYmd(new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [endTimeTouched, setEndTimeTouched] = useState(false);

  const [attendanceDate, setAttendanceDate] = useState(toYmd(new Date()));
  const [attendanceStaffName, setAttendanceStaffName] = useState("山口");
  const [attendanceClockIn, setAttendanceClockIn] = useState("10:00");
  const [attendanceClockOut, setAttendanceClockOut] = useState("17:00");
  const [attendanceMemo, setAttendanceMemo] = useState("");

  const [storeName, setStoreName] = useState("江戸堀");
  const [staffName, setStaffName] = useState("山口");
  const [menu, setMenu] = useState("ストレッチ");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [visitType, setVisitType] = useState("再来");
  const [memo, setMemo] = useState("");

  const [salesReservationIds, setSalesReservationIds] = useState<number[]>([]);
  const [counseledReservationIds, setCounseledReservationIds] = useState<number[]>([]);
  const [ticketUsedReservationIds, setTicketUsedReservationIds] = useState<number[]>([]);
  const [consumingReservationId, setConsumingReservationId] = useState("");
  const [deletingReservationId, setDeletingReservationId] = useState("");
  const [openedActionReservationIds, setOpenedActionReservationIds] = useState<string[]>([]);
  const [openedAttendanceActionIds, setOpenedAttendanceActionIds] = useState<string[]>([]);

  const [reservationSearch, setReservationSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("customer");
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] =
    useState<CustomerOption | null>(null);
  const [selectedHistoryStaff, setSelectedHistoryStaff] = useState("");
  const [customerHistory, setCustomerHistory] = useState<ReservationHistoryItem[]>([]);
  const [staffHistory, setStaffHistory] = useState<StaffHistoryItem[]>([]);
  const [customerSalesHistory, setCustomerSalesHistory] = useState<CustomerSaleHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
    useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loggedIn = localStorage.getItem(AUTH_STORAGE_KEY);
    const role = localStorage.getItem(ROLE_STORAGE_KEY);
    const staffNameMemory = localStorage.getItem(STAFF_NAME_STORAGE_KEY);

    const legacyStaffLoggedIn = localStorage.getItem("gymup_staff_logged_in");
    const legacyIsLoggedIn = localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      if (legacyStaffLoggedIn === "true" || legacyIsLoggedIn === "true") {
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
        localStorage.setItem(ROLE_STORAGE_KEY, role || "staff");
        if (!staffNameMemory) {
          localStorage.setItem(STAFF_NAME_STORAGE_KEY, "スタッフ");
        }
      }
    }

    localStorage.removeItem("gymup_staff_logged_in");
    localStorage.removeItem("isLoggedIn");

    const finalLoggedIn = localStorage.getItem(AUTH_STORAGE_KEY);
    const finalRole = localStorage.getItem(ROLE_STORAGE_KEY);

    if (finalLoggedIn !== "true" || !finalRole) {
      router.replace("/login/staff");
      return;
    }

    setAuthChecked(true);
    void loadAll();
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted || !authChecked) return;
    void loadReservations();
    void loadAttendance();
  }, [currentMonth, mounted, authChecked]);

  useEffect(() => {
    if (!mounted || !authChecked) return;
    void loadReservationFlagsForVisible();
  }, [mounted, authChecked, reservations, selectedStoreFilter]);

  useEffect(() => {
    if (!mounted || !authChecked) return;
    void loadTicketContractsForVisibleCustomers();
    void loadCustomerTicketsForVisibleCustomers();
  }, [mounted, authChecked, reservations, selectedStoreFilter, customers]);

  async function loadAll() {
    await Promise.all([loadCustomers(), loadReservations(), loadAttendance()]);
  }

  async function loadCustomers() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, kana, phone, plan_type")
        .order("id", { ascending: false })
        .limit(400);

      if (error) throw error;

      setCustomers(
        ((data as CustomerRow[]) || []).map((row) => ({
          id: String(row.id),
          name: row.name || "",
          kana: row.kana || "",
          phone: row.phone || "",
          planType: row.plan_type || "",
        }))
      );
    } catch (e) {
      console.error(e);
      setError(`顧客取得エラー: ${extractErrorMessage(e)}`);
    }
  }

  async function loadReservations() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const start = toYmd(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
      const end = toYmd(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));

      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, customer_id, customer_name, date, start_time, end_time, store_name, staff_name, menu, payment_method, memo, visit_type, reservation_status, is_first_visit, created_at"
        )
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;

      setReservations((data as ReservationRow[]) || []);
    } catch (e) {
      console.error(e);
      setError(`予約取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadAttendance() {
    if (!supabase) return;

    try {
      const monthStart = toYmd(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
      const monthEnd = toYmd(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));

      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, staff_name, work_date, clock_in, clock_out, memo")
        .gte("work_date", monthStart)
        .lte("work_date", monthEnd)
        .order("work_date", { ascending: true })
        .order("clock_in", { ascending: true });

      if (error) {
        if ((error as { code?: string }).code === "PGRST204") {
          const fallback = await supabase
            .from("attendance_records")
            .select("id, staff_name, work_date, clock_in, clock_out")
            .gte("work_date", monthStart)
            .lte("work_date", monthEnd)
            .order("work_date", { ascending: true })
            .order("clock_in", { ascending: true });

          if (fallback.error) throw fallback.error;

          setAttendanceItems(
            ((fallback.data as Record<string, unknown>[]) || []).map((row) => ({
              id: String(row.id),
              staff_name: trimmed(row.staff_name),
              work_date: trimmed(row.work_date),
              clock_in: row.clock_in ? String(row.clock_in) : null,
              clock_out: row.clock_out ? String(row.clock_out) : null,
              memo: null,
            }))
          );
          return;
        }

        if (
          (error as { code?: string }).code === "PGRST205" ||
          (error as { code?: string }).code === "42P01"
        ) {
          setAttendanceItems([]);
          return;
        }

        throw error;
      }

      setAttendanceItems(
        ((data as Record<string, unknown>[]) || []).map((row) => ({
          id: String(row.id),
          staff_name: trimmed(row.staff_name),
          work_date: trimmed(row.work_date),
          clock_in: row.clock_in ? String(row.clock_in) : null,
          clock_out: row.clock_out ? String(row.clock_out) : null,
          memo: row.memo ? String(row.memo) : null,
        }))
      );
    } catch (e) {
      console.error(e);
      setAttendanceItems([]);
    }
  }

  const filteredCustomers = useMemo(() => {
    const q = trimmed(customerSearch).toLowerCase();
    if (!q) return customers.slice(0, 25);

    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.kana.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
      .slice(0, 25);
  }, [customerSearch, customers]);

  const filteredCustomerSearchResults = useMemo(() => {
    const q = trimmed(globalSearch).toLowerCase();
    if (!q || searchMode !== "customer") return [];

    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.kana.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
      .slice(0, 20);
  }, [customers, globalSearch, searchMode]);

  const filteredStaffSearchResults = useMemo(() => {
    const q = trimmed(globalSearch).toLowerCase();
    if (!q || searchMode !== "staff") return [];
    return STAFF_OPTIONS.filter((staff) => staff.toLowerCase().includes(q)).slice(0, 20);
  }, [globalSearch, searchMode]);

  const salesReservationIdSet = useMemo(
    () =>
      new Set(
        salesReservationIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      ),
    [salesReservationIds]
  );

  const counseledReservationIdSet = useMemo(
    () =>
      new Set(
        counseledReservationIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      ),
    [counseledReservationIds]
  );

  const ticketUsedReservationIdSet = useMemo(
    () =>
      new Set(
        ticketUsedReservationIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      ),
    [ticketUsedReservationIds]
  );

  const customerPlanTypeById = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((customer) => {
      map.set(String(customer.id), trimmed(customer.planType));
    });
    return map;
  }, [customers]);

  const baseVisibleReservations = useMemo(() => {
    const list =
      selectedStoreFilter === "すべて"
        ? reservations
        : reservations.filter((item) => item.store_name === selectedStoreFilter);

    return [...list];
  }, [reservations, selectedStoreFilter]);

  const ticketContractsByCustomerId = useMemo(() => {
    const map = new Map<string, TicketContractRow[]>();

    for (const contract of ticketContracts) {
      const customerId = trimmed(contract.customer_id);
      if (!customerId) continue;
      if (!map.has(customerId)) map.set(customerId, []);
      map.get(customerId)!.push(contract);
    }

    for (const [, list] of map) {
      list.sort((a, b) => {
        const aActive = trimmed(a.status) === "active" ? 1 : 0;
        const bActive = trimmed(b.status) === "active" ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;

        const aCreated = trimmed(a.created_at);
        const bCreated = trimmed(b.created_at);
        if (aCreated !== bCreated) return aCreated < bCreated ? 1 : -1;

        const aId = toIdNumber(a.id) || 0;
        const bId = toIdNumber(b.id) || 0;
        return bId - aId;
      });
    }

    return map;
  }, [ticketContracts]);

  const customerTicketsByCustomerId = useMemo(() => {
    const map = new Map<string, CustomerTicketRow[]>();

    for (const ticket of customerTickets) {
      const customerId = trimmed(ticket.customer_id);
      if (!customerId) continue;
      if (!map.has(customerId)) map.set(customerId, []);
      map.get(customerId)!.push(ticket);
    }

    for (const [, list] of map) {
      list.sort((a, b) => {
        const aCreated = trimmed(a.created_at);
        const bCreated = trimmed(b.created_at);
        if (aCreated !== bCreated) return aCreated < bCreated ? 1 : -1;

        const aId = toIdNumber(a.id) || 0;
        const bId = toIdNumber(b.id) || 0;
        return bId - aId;
      });
    }

    return map;
  }, [customerTickets]);

  const reservationSalesByReservationId = useMemo(() => {
    const map = new Map<string, ReservationSaleLite[]>();

    for (const sale of reservationSales) {
      const reservationId = trimmed(sale.reservation_id);
      if (!reservationId) continue;
      if (!map.has(reservationId)) map.set(reservationId, []);
      map.get(reservationId)!.push(sale);
    }

    return map;
  }, [reservationSales]);

  function getTicketBadgesForReservation(item: ReservationRow): TicketNumberingInfo[] {
    const customerId = trimmed(item.customer_id);
    if (!customerId) return [];

    const badges: TicketNumberingInfo[] = [];
    const seen = new Set<string>();

    const pushBadge = (labelBase: string, totalCountRaw: unknown, remainingCountRaw: unknown) => {
      const totalCount = Math.max(Number(totalCountRaw ?? 0), 0);
      const remainingCount = Math.max(Number(remainingCountRaw ?? 0), 0);

      if (totalCount <= 0) return;

      const label = `${totalCount}-${remainingCount}`;
      const key = `${labelBase}__${label}`;
      if (seen.has(key)) return;
      seen.add(key);

      const tone: TicketNumberingInfo["tone"] =
        remainingCount <= 0 ? "danger" : remainingCount <= 1 ? "warning" : "normal";

      badges.push({
        label,
        tone,
        showUpdate: remainingCount <= 0,
        showPaymentAlert: remainingCount <= 0,
      });
    };

    const contractRows = ticketContractsByCustomerId.get(customerId) || [];
    contractRows.forEach((contract) => {
      const usedCount = Math.max(Number(contract.used_count ?? 0), 0);
      const remainingCount = Math.max(Number(contract.remaining_count ?? 0), 0);
      const totalCount = usedCount + remainingCount;
      pushBadge(formatTicketDisplayLabel(contract.ticket_name), totalCount, remainingCount);
    });

    const customerTicketRows = customerTicketsByCustomerId.get(customerId) || [];
    customerTicketRows.forEach((ticket) => {
      const totalCount =
        Number(ticket.total_count ?? 0) > 0
          ? Number(ticket.total_count ?? 0)
          : Math.max(Number(ticket.remaining_count ?? 0), 0);

      const labelBase = trimmed(ticket.ticket_name) || "回数券";
      pushBadge(labelBase, totalCount, ticket.remaining_count);
    });

    return badges;
  }

  function getReservationSalesForReservation(item: ReservationRow) {
    return reservationSalesByReservationId.get(String(item.id)) || [];
  }

  function getReservationSaleSummary(item: ReservationRow) {
    const sales = getReservationSalesForReservation(item);
    if (sales.length === 0) return "";

    const total = sales.reduce((sum, sale) => sum + Number(sale.amount ?? 0), 0);
    const mainSale = sales[0];

    return [
      `売上¥${total.toLocaleString()}`,
      trimmed(mainSale.sale_type),
      trimmed(mainSale.payment_method),
    ]
      .filter(Boolean)
      .join(" / ");
  }

  const visibleReservations = useMemo(() => {
    let list = [...baseVisibleReservations];

    if (selectedFilterMode !== "all") {
      list = list.filter((item) => {
        const flags = getPendingFlags({
          item,
          salesReservationIdSet,
          counseledReservationIdSet,
          ticketUsedReservationIdSet,
        });

        if (selectedFilterMode === "pending") return flags.isPending;
        if (selectedFilterMode === "sales_pending") return flags.salesPending;
        if (selectedFilterMode === "counseling_pending") return flags.counselingPending;
        if (selectedFilterMode === "ticket_pending") return flags.ticketPending;
        return true;
      });
    }

    const keyword = trimmed(reservationSearch).toLowerCase();
    if (keyword) {
      list = list.filter((item) => {
        const ticketText = getTicketBadgesForReservation(item)
          .map((badge) => badge.label)
          .join(" ");

        const saleText = [
          getReservationSaleSummary(item),
          ...getReservationSalesForReservation(item).map((sale) =>
            [
              trimmed(sale.sale_type),
              trimmed(sale.menu_type),
              trimmed(sale.payment_method),
              trimmed(sale.memo),
              Number(sale.amount ?? 0) > 0 ? String(Number(sale.amount ?? 0)) : "",
            ]
              .filter(Boolean)
              .join(" ")
          ),
        ]
          .filter(Boolean)
          .join(" ");

        const haystack = [
          trimmed(item.customer_name),
          trimmed(item.memo),
          trimmed(item.menu),
          trimmed(item.store_name),
          trimmed(item.staff_name),
          trimmed(item.payment_method),
          ticketText,
          saleText,
          trimmed(item.date),
          trimmed(item.start_time),
          trimmed(item.end_time),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(keyword);
      });
    }

    return list.sort((a, b) => {
      const aPriority = getPendingPriority({
        item: a,
        salesReservationIdSet,
        counseledReservationIdSet,
        ticketUsedReservationIdSet,
      });
      const bPriority = getPendingPriority({
        item: b,
        salesReservationIdSet,
        counseledReservationIdSet,
        ticketUsedReservationIdSet,
      });

      if (aPriority !== bPriority) return aPriority - bPriority;

      const aDate = trimmed(a.date);
      const bDate = trimmed(b.date);
      if (aDate !== bDate) return aDate < bDate ? -1 : 1;

      const aTime = trimmed(a.start_time);
      const bTime = trimmed(b.start_time);
      if (aTime !== bTime) return aTime < bTime ? -1 : 1;

      return 0;
    });
  }, [
    baseVisibleReservations,
    selectedFilterMode,
    salesReservationIdSet,
    counseledReservationIdSet,
    ticketUsedReservationIdSet,
    reservationSearch,
    reservationSales,
    ticketContracts,
    customerTickets,
  ]);

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, ReservationRow[]>();

    for (const item of visibleReservations) {
      const key = trimmed(item.date);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    for (const [, value] of map) {
      value.sort(sortReservations);
    }

    return map;
  }, [visibleReservations]);

  const selectedDayReservations = useMemo(() => {
    const list = [...(reservationsByDate.get(selectedDate) || [])];

    return list.sort((a, b) => {
      const aPriority = getPendingPriority({
        item: a,
        salesReservationIdSet,
        counseledReservationIdSet,
        ticketUsedReservationIdSet,
      });
      const bPriority = getPendingPriority({
        item: b,
        salesReservationIdSet,
        counseledReservationIdSet,
        ticketUsedReservationIdSet,
      });

      if (aPriority !== bPriority) return aPriority - bPriority;

      const aTime = trimmed(a.start_time);
      const bTime = trimmed(b.start_time);
      if (aTime !== bTime) return aTime < bTime ? -1 : 1;

      return 0;
    });
  }, [
    reservationsByDate,
    selectedDate,
    salesReservationIdSet,
    counseledReservationIdSet,
    ticketUsedReservationIdSet,
  ]);

  const selectedDayAttendance = useMemo(() => {
    return attendanceItems
      .filter((item) => item.work_date === selectedDate)
      .sort((a, b) => trimmed(a.clock_in).localeCompare(trimmed(b.clock_in)));
  }, [attendanceItems, selectedDate]);

  const selectedDayTimeline = useMemo(() => {
    const timeline: DayTimelineItem[] = [
      ...selectedDayAttendance.map((attendance) => ({
        type: "attendance" as const,
        sortTime: trimmed(attendance.clock_in) || "00:00",
        attendance,
      })),
      ...selectedDayReservations.map((reservation) => ({
        type: "reservation" as const,
        sortTime: trimmed(reservation.start_time) || "00:00",
        reservation,
      })),
    ];

    return timeline.sort((a, b) => {
      if (a.sortTime !== b.sortTime) return a.sortTime.localeCompare(b.sortTime);
      if (a.type !== b.type) return a.type === "attendance" ? -1 : 1;
      return 0;
    });
  }, [selectedDayAttendance, selectedDayReservations]);

  const counselingCandidates = useMemo(() => {
    return selectedDayReservations.filter(
      (item) =>
        isNewVisit(item) &&
        item.customer_id !== null &&
        item.customer_id !== undefined &&
        String(item.customer_id) !== ""
    );
  }, [selectedDayReservations]);

  const pendingSummary = useMemo(() => {
    const source = baseVisibleReservations;

    const summary = {
      totalPending: 0,
      salesPending: 0,
      counselingPending: 0,
      ticketPending: 0,
      visibleCount: visibleReservations.length,
    };

    source.forEach((item) => {
      const flags = getPendingFlags({
        item,
        salesReservationIdSet,
        counseledReservationIdSet,
        ticketUsedReservationIdSet,
      });

      if (flags.isPending) summary.totalPending += 1;
      if (flags.salesPending) summary.salesPending += 1;
      if (flags.counselingPending) summary.counselingPending += 1;
      if (flags.ticketPending) summary.ticketPending += 1;
    });

    return summary;
  }, [
    baseVisibleReservations,
    visibleReservations.length,
    salesReservationIdSet,
    counseledReservationIdSet,
    ticketUsedReservationIdSet,
  ]);

  async function loadReservationFlagsForVisible() {
    if (!supabase) return;

    const reservationIds = baseVisibleReservations
      .map((item) => toIdNumber(item.id))
      .filter((id): id is number => id !== null);

    if (reservationIds.length === 0) {
      setSalesReservationIds([]);
      setCounseledReservationIds([]);
      setTicketUsedReservationIds([]);
      setReservationSales([]);
      return;
    }

    try {
      const [
        { data: salesData, error: salesError },
        { data: counselingData, error: counselingError },
        { data: ticketUsageData, error: ticketUsageError },
      ] = await Promise.all([
        supabase
          .from("sales")
          .select("id, reservation_id, amount, payment_method, sale_type, menu_type, memo, created_at")
          .in("reservation_id", reservationIds),
        supabase.from("counselings").select("reservation_id").in("reservation_id", reservationIds),
        supabase.from("ticket_usages").select("reservation_id").in("reservation_id", reservationIds),
      ]);

      if (salesError) throw salesError;
      if (counselingError) throw counselingError;
      if (ticketUsageError) throw ticketUsageError;

      setReservationSales((salesData as ReservationSaleLite[]) || []);

      setSalesReservationIds(
        ((salesData as SimpleReservationIdRow[]) || [])
          .map((row) => toIdNumber(row.reservation_id))
          .filter((id): id is number => id !== null)
      );

      setCounseledReservationIds(
        ((counselingData as SimpleReservationIdRow[]) || [])
          .map((row) => toIdNumber(row.reservation_id))
          .filter((id): id is number => id !== null)
      );

      setTicketUsedReservationIds(
        ((ticketUsageData as SimpleReservationIdRow[]) || [])
          .map((row) => toIdNumber(row.reservation_id))
          .filter((id): id is number => id !== null)
      );
    } catch (e) {
      console.error(e);
      setError(`状態取得エラー: ${extractErrorMessage(e)}`);
    }
  }

  async function loadTicketContractsForVisibleCustomers() {
    if (!supabase) return;

    const customerIds = Array.from(
      new Set(
        baseVisibleReservations
          .map((item) => toIdNumber(item.customer_id))
          .filter((id): id is number => id !== null)
      )
    );

    if (customerIds.length === 0) {
      setTicketContracts([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ticket_contracts")
        .select(
          "id, customer_id, ticket_name, remaining_count, used_count, prepaid_balance, status, created_at"
        )
        .in("customer_id", customerIds)
        .order("id", { ascending: false });

      if (error) {
        if ((error as { code?: string }).code === "PGRST205") {
          setTicketContracts([]);
          return;
        }
        throw error;
      }

      setTicketContracts((data as TicketContractRow[]) || []);
    } catch (e) {
      console.error(e);
      setTicketContracts([]);
    }
  }

  async function loadCustomerTicketsForVisibleCustomers() {
    if (!supabase) return;

    const customerIds = Array.from(
      new Set(
        baseVisibleReservations
          .map((item) => toIdNumber(item.customer_id))
          .filter((id): id is number => id !== null)
      )
    );

    if (customerIds.length === 0) {
      setCustomerTickets([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customer_tickets")
        .select(
          "id, customer_id, ticket_name, total_count, remaining_count, status, created_at"
        )
        .in("customer_id", customerIds)
        .order("id", { ascending: false });

      if (error) {
        if (
          (error as { code?: string }).code === "PGRST205" ||
          (error as { code?: string }).code === "42P01"
        ) {
          setCustomerTickets([]);
          return;
        }
        throw error;
      }

      setCustomerTickets((data as CustomerTicketRow[]) || []);
    } catch (e) {
      console.error(e);
      setCustomerTickets([]);
    }
  }

  function getTicketContractForReservation(item: ReservationRow): TicketContractRow | null {
    const customerId = trimmed(item.customer_id);
    if (!customerId) return null;

    const list = ticketContractsByCustomerId.get(customerId) || [];
    if (list.length === 0) return null;

    const customerPlanType = customerPlanTypeById.get(customerId) || "";
    const resolvedTicketName = resolveTicketName({
      reservationMenu: item.menu,
      customerPlanType,
    });

    if (resolvedTicketName) {
      const exactActive = list.find(
        (contract) =>
          trimmed(contract.ticket_name) === resolvedTicketName &&
          (trimmed(contract.status) === "active" || !trimmed(contract.status))
      );
      if (exactActive) return exactActive;

      const exactAny = list.find(
        (contract) => trimmed(contract.ticket_name) === resolvedTicketName
      );
      if (exactAny) return exactAny;
    }

    const activeContract = list.find(
      (contract) => trimmed(contract.status) === "active" || !trimmed(contract.status)
    );
    if (activeContract) return activeContract;

    return list[0] || null;
  }

  function getTicketNumberingForReservation(item: ReservationRow): TicketNumberingInfo | null {
    const badges = getTicketBadgesForReservation(item);
    return badges[0] || null;
  }

  function openDay(dateStr: string) {
    setSelectedDate(dateStr);
    setDaySheetOpen(true);
  }

  function openCreateModal(dateStr?: string) {
    const useDate = dateStr || selectedDate || toYmd(new Date());
    setFormDate(useDate);
    setStartTime("10:00");
    setEndTime("11:00");
    setEndTimeTouched(false);
    setSelectedCustomerId("");
    setCustomerSearch("");
    setCustomerName("");
    setCustomerKana("");
    setCustomerPhone("");
    setStoreName("江戸堀");
    setStaffName("山口");
    setMenu("ストレッチ");
    setPaymentMethod("現金");
    setVisitType("再来");
    setMemo("");
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function openAttendanceCreateModal(dateStr?: string) {
    const useDate = dateStr || selectedDate || toYmd(new Date());
    const rememberedStaff =
      typeof window !== "undefined"
        ? trimmed(localStorage.getItem(STAFF_NAME_STORAGE_KEY))
        : "";

    setAttendanceFormMode("create");
    setEditingAttendanceId("");
    setAttendanceDate(useDate);
    setAttendanceStaffName(STAFF_OPTIONS.includes(rememberedStaff) ? rememberedStaff : "山口");
    setAttendanceClockIn("10:00");
    setAttendanceClockOut("17:00");
    setAttendanceMemo("");
    setError("");
    setSuccess("");
    setAttendanceFormOpen(true);
  }

  function openAttendanceEditModal(item: StaffAttendanceItem) {
    setAttendanceFormMode("edit");
    setEditingAttendanceId(String(item.id));
    setAttendanceDate(trimmed(item.work_date) || selectedDate);
    setAttendanceStaffName(trimmed(item.staff_name) || "山口");
    setAttendanceClockIn(trimmed(item.clock_in) || "10:00");
    setAttendanceClockOut(trimmed(item.clock_out) || "");
    setAttendanceMemo(trimmed(item.memo));
    setError("");
    setSuccess("");
    setAttendanceFormOpen(true);
  }

  function handleSelectCustomer(id: string) {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (!found) return;
    setCustomerName(found.name);
    setCustomerKana(found.kana);
    setCustomerPhone(found.phone);
    setCustomerSearch(found.name);
    setVisitType("再来");
  }

  async function findOrCreateCustomerId(): Promise<string | null> {
    if (!supabase) throw new Error("Supabase未設定です。");

    const name = trimmed(customerName);
    const kana = trimmed(customerKana);
    const rawPhone = trimmed(customerPhone);
    const phone = normalizePhone(rawPhone);

    if (!name) return null;
    if (selectedCustomerId) return selectedCustomerId;

    const localMatch = customers.find((c) => {
      const sameName = trimmed(c.name) === name;
      const samePhone = phone && normalizePhone(c.phone) === phone;
      return sameName && (samePhone || !phone);
    });

    if (localMatch) return localMatch.id;

    if (phone) {
      const { data: phoneMatch, error: phoneMatchError } = await supabase
        .from("customers")
        .select("id, name, kana, phone, plan_type")
        .eq("phone", rawPhone)
        .limit(1)
        .maybeSingle();

      if (phoneMatchError) console.warn(phoneMatchError);
      if (phoneMatch) return String((phoneMatch as CustomerRow).id);
    }

    const { data: nameMatch, error: nameMatchError } = await supabase
      .from("customers")
      .select("id, name, kana, phone, plan_type")
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (nameMatchError) console.warn(nameMatchError);
    if (nameMatch) return String((nameMatch as CustomerRow).id);

    const { data: inserted, error: insertError } = await supabase
      .from("customers")
      .insert({
        name,
        kana: kana || null,
        phone: rawPhone || null,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return String(inserted.id);
  }
    async function handleSaveReservation() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    if (!trimmed(customerName)) {
      setError("顧客名を入力してください。");
      return;
    }

    if (!trimmed(formDate)) {
      setError("日付を入力してください。");
      return;
    }

    if (!trimmed(startTime)) {
      setError("開始時間を入力してください。");
      return;
    }

    if (!trimmed(endTime)) {
      setError("終了時間を入力してください。");
      return;
    }

    if (!trimmed(visitType)) {
      setError("来店区分を選択してください。");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const customerId = await findOrCreateCustomerId();

      const payload = {
        customer_id: customerId ? Number(customerId) : null,
        customer_name: trimmed(customerName),
        date: formDate,
        start_time: startTime,
        end_time: endTime,
        store_name: storeName,
        staff_name: staffName,
        menu,
        payment_method: paymentMethod,
        visit_type: visitType,
        reservation_status: "予約済",
        is_first_visit: visitType === "新規",
        memo: trimmed(memo) || null,
      };

      const { error } = await supabase.from("reservations").insert(payload);
      if (error) throw error;

      setSuccess("予約を保存しました。");
      setFormOpen(false);
      setSelectedDate(formDate);
      setDaySheetOpen(true);

      await Promise.all([
        loadCustomers(),
        loadReservations(),
        loadReservationFlagsForVisible(),
        loadTicketContractsForVisibleCustomers(),
        loadCustomerTicketsForVisibleCustomers(),
      ]);
    } catch (e) {
      console.error(e);
      setError(`予約保存エラー: ${extractErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAttendance() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    if (!trimmed(attendanceDate)) {
      setError("出勤日を入力してください。");
      return;
    }

    if (!trimmed(attendanceStaffName)) {
      setError("スタッフを選択してください。");
      return;
    }

    if (!trimmed(attendanceClockIn)) {
      setError("出勤時間を入力してください。");
      return;
    }

    try {
      setAttendanceSaving(true);
      setError("");
      setSuccess("");

      const basePayload = {
        staff_name: attendanceStaffName,
        work_date: attendanceDate,
        clock_in: attendanceClockIn,
        clock_out: trimmed(attendanceClockOut) || null,
      };

      const payloadWithMemo = {
        ...basePayload,
        memo: trimmed(attendanceMemo) || null,
      };

      if (attendanceFormMode === "edit") {
        if (!editingAttendanceId) {
          setError("編集対象の出勤データがありません。");
          return;
        }

        const { error } = await supabase
          .from("attendance_records")
          .update(payloadWithMemo)
          .eq("id", editingAttendanceId);

        if (error) {
          if ((error as { code?: string }).code === "PGRST204") {
            const fallback = await supabase
              .from("attendance_records")
              .update(basePayload)
              .eq("id", editingAttendanceId);

            if (fallback.error) throw fallback.error;
          } else {
            throw error;
          }
        }

        setSuccess("スタッフ出勤を編集しました。");
      } else {
        const { error } = await supabase.from("attendance_records").insert(payloadWithMemo);

        if (error) {
          if ((error as { code?: string }).code === "PGRST204") {
            const fallback = await supabase.from("attendance_records").insert(basePayload);
            if (fallback.error) throw fallback.error;
          } else {
            throw error;
          }
        }

        setSuccess("スタッフ出勤を追加しました。");
      }

      setAttendanceFormOpen(false);
      setEditingAttendanceId("");
      setAttendanceFormMode("create");
      setSelectedDate(attendanceDate);
      setDaySheetOpen(true);

      await loadAttendance();
    } catch (e) {
      console.error(e);
      setError(`出勤保存エラー: ${extractErrorMessage(e)}`);
    } finally {
      setAttendanceSaving(false);
    }
  }

  async function handleDeleteAttendance(item: StaffAttendanceItem) {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    const ok = window.confirm(
      `${trimmed(item.staff_name) || "スタッフ"} の出勤データを削除しますか？`
    );
    if (!ok) return;

    try {
      setAttendanceDeletingId(String(item.id));
      setError("");
      setSuccess("");

      const { error } = await supabase
        .from("attendance_records")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      setOpenedAttendanceActionIds((prev) => prev.filter((id) => id !== String(item.id)));
      setSuccess("スタッフ出勤を削除しました。");

      await loadAttendance();
    } catch (e) {
      console.error(e);
      setError(`出勤削除エラー: ${extractErrorMessage(e)}`);
    } finally {
      setAttendanceDeletingId("");
    }
  }

  async function loadCustomerHistory(customer: CustomerOption) {
    if (!supabase) return;

    try {
      setHistoryLoading(true);
      setError("");
      setSelectedHistoryCustomer(customer);
      setSelectedHistoryStaff("");
      setHistoryOpen(true);

      const [{ data: reservationData, error: reservationError }, { data: salesData, error: salesError }] =
        await Promise.all([
          supabase
            .from("reservations")
            .select(
              "id, customer_id, customer_name, date, start_time, end_time, store_name, staff_name, menu, memo"
            )
            .eq("customer_id", Number(customer.id))
            .order("date", { ascending: false })
            .order("start_time", { ascending: false })
            .limit(50),

          supabase
            .from("sales")
            .select(
              "id, sale_date, customer_name, menu_type, sale_type, payment_method, amount, staff_name, store_name, memo, created_at"
            )
            .eq("customer_id", Number(customer.id))
            .order("sale_date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

      if (reservationError) throw reservationError;
      if (salesError) throw salesError;

      setCustomerHistory((reservationData as ReservationHistoryItem[]) || []);
      setCustomerSalesHistory((salesData as CustomerSaleHistoryItem[]) || []);
      setStaffHistory([]);
    } catch (e) {
      console.error(e);
      setError(`顧客履歴取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadStaffHistory(staff: string) {
    if (!supabase) return;

    try {
      setHistoryLoading(true);
      setError("");
      setSelectedHistoryCustomer(null);
      setSelectedHistoryStaff(staff);
      setHistoryOpen(true);

      const { data, error } = await supabase
        .from("reservations")
        .select("id, date, start_time, end_time, customer_name, store_name, menu")
        .eq("staff_name", staff)
        .order("date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(50);

      if (error) throw error;

      setStaffHistory((data as StaffHistoryItem[]) || []);
      setCustomerHistory([]);
      setCustomerSalesHistory([]);
    } catch (e) {
      console.error(e);
      setError(`スタッフ履歴取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleTicketConsumeAndCreateSale(item: ReservationRow) {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    const reservationId = toIdNumber(item.id);
    const customerId = toIdNumber(item.customer_id);

    if (!reservationId) {
      setError("予約IDが不正です。");
      return;
    }

    if (!customerId) {
      setError("この予約に customer_id がありません。");
      return;
    }

    try {
      setConsumingReservationId(String(item.id));
      setError("");
      setSuccess("");

      if (ticketUsedReservationIdSet.has(reservationId)) {
        setError("この予約はすでに回数券消化済みです。");
        return;
      }

      const alreadySold =
        trimmed(item.reservation_status) === "売上済" ||
        salesReservationIdSet.has(reservationId);

      if (alreadySold) {
        setError("この予約はすでに売上計上済みです。");
        return;
      }

      const { data: customerRow, error: customerError } = await supabase
        .from("customers")
        .select("id, name, plan_type")
        .eq("id", customerId)
        .maybeSingle();

      if (customerError) throw customerError;
      if (!customerRow) {
        setError("顧客情報が見つかりません。");
        return;
      }

      const ticketName = resolveTicketName({
        reservationMenu: item.menu,
        customerPlanType: (customerRow as { plan_type?: string | null }).plan_type,
      });

      const fallbackContract = getTicketContractForReservation(item);
      const resolvedName = ticketName || trimmed(fallbackContract?.ticket_name);
      const unitPrice = TICKET_UNIT_PRICES[resolvedName];

      if (!resolvedName || !unitPrice) {
        setError(`単価設定がありません: ${resolvedName || "未設定"}`);
        return;
      }

      const { data: contractRow, error: contractError } = await supabase
        .from("ticket_contracts")
        .select("*")
        .eq("customer_id", customerId)
        .eq("ticket_name", resolvedName)
        .eq("status", "active")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contractError) throw contractError;
      if (!contractRow) {
        setError(`有効な回数券契約がありません: ${resolvedName}`);
        return;
      }

      const currentContract = contractRow as {
        id: number | string;
        remaining_count?: number | null;
        used_count?: number | null;
        prepaid_balance?: number | null;
      };

      const remainingCount = Number(currentContract.remaining_count ?? 0);
      const usedCount = Number(currentContract.used_count ?? 0);
      const prepaidBalance = Number(currentContract.prepaid_balance ?? 0);

      if (remainingCount <= 0) {
        setError("残回数がありません。");
        return;
      }

      const ok = window.confirm(
        `${trimmed(item.customer_name) || "この顧客"} の ${resolvedName} を1回消化して、${unitPrice.toLocaleString()}円の売上を立てます。よろしいですか？`
      );
      if (!ok) return;

      const nextRemaining = remainingCount - 1;
      const nextUsed = usedCount + 1;
      const nextBalance = Math.max(prepaidBalance - unitPrice, 0);
      const serviceType = detectServiceTypeFromTicketName(resolvedName);

      const { error: usageInsertError } = await supabase.from("ticket_usages").insert({
        ticket_id: currentContract.id,
        customer_id: customerId,
        reservation_id: reservationId,
        used_date: trimmed(item.date),
        ticket_name: resolvedName,
        unit_price: unitPrice,
        before_count: remainingCount,
        staff_name: trimmed(item.staff_name) || null,
        store_name: trimmed(item.store_name) || null,
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
        .eq("id", currentContract.id);

      if (contractUpdateError) throw contractUpdateError;

      const customerNameValue =
        trimmed(item.customer_name) || trimmed((customerRow as { name?: string | null }).name) || null;

      const { error: salesInsertError } = await supabase.from("sales").insert({
        reservation_id: reservationId,
        customer_id: customerId,
        customer_name: customerNameValue,
        sale_date: trimmed(item.date),
        amount: unitPrice,
        menu_type: serviceType,
        sale_type: "回数券消化",
        payment_method: "前受金消化",
        staff_name: trimmed(item.staff_name) || null,
        store_name: trimmed(item.store_name) || null,
        memo: `${resolvedName} 消化`,
      });

      if (salesInsertError) throw salesInsertError;

      const { error: reservationUpdateError } = await supabase
        .from("reservations")
        .update({ reservation_status: "売上済" })
        .eq("id", reservationId);

      if (reservationUpdateError) throw reservationUpdateError;

      setSuccess(
        `回数券を消化し、${unitPrice.toLocaleString()}円を売上計上しました。残回数: ${nextRemaining}`
      );

      await Promise.all([
        loadReservations(),
        loadReservationFlagsForVisible(),
        loadAttendance(),
        loadTicketContractsForVisibleCustomers(),
        loadCustomerTicketsForVisibleCustomers(),
      ]);

      router.push(
        `/sales?reservationId=${reservationId}&customerId=${customerId}&customerName=${encodeURIComponent(
          customerNameValue || ""
        )}&date=${encodeURIComponent(trimmed(item.date))}&menu=${encodeURIComponent(
          resolvedName
        )}&staffName=${encodeURIComponent(trimmed(item.staff_name))}&storeName=${encodeURIComponent(
          trimmed(item.store_name)
        )}&serviceType=${encodeURIComponent(serviceType)}&saleType=${encodeURIComponent(
          "回数券消化"
        )}`
      );
    } catch (e) {
      console.error(e);
      setError(`回数券消化エラー: ${extractErrorMessage(e)}`);
    } finally {
      setConsumingReservationId("");
    }
  }

  async function handleDeleteReservation(item: ReservationRow) {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    const reservationId = toIdNumber(item.id);
    if (!reservationId) {
      setError("予約IDが不正です。");
      return;
    }

    try {
      setDeletingReservationId(String(item.id));
      setError("");
      setSuccess("");

      const [
        { data: salesRows, error: salesError },
        { data: counselingRows, error: counselingError },
        { data: ticketUsageRows, error: ticketUsageError },
      ] = await Promise.all([
        supabase.from("sales").select("id").eq("reservation_id", reservationId),
        supabase.from("counselings").select("id").eq("reservation_id", reservationId),
        supabase
          .from("ticket_usages")
          .select("id, ticket_id, unit_price, before_count")
          .eq("reservation_id", reservationId),
      ]);

      if (salesError) throw salesError;
      if (counselingError) throw counselingError;
      if (ticketUsageError) throw ticketUsageError;

      const warnings: string[] = [];
      if ((salesRows || []).length > 0) warnings.push(`売上 ${(salesRows || []).length}件`);
      if ((counselingRows || []).length > 0)
        warnings.push(`カウンセリング ${(counselingRows || []).length}件`);
      if ((ticketUsageRows || []).length > 0)
        warnings.push(`回数券消化 ${(ticketUsageRows || []).length}件`);

      const ok = window.confirm(
        warnings.length > 0
          ? `この予約には関連データがあります。\n${warnings.join(
              "\n"
            )}\n\n関連データも含めて削除し、回数券消化があれば残回数も戻します。\n本当に削除しますか？`
          : "この予約を削除しますか？"
      );
      if (!ok) return;

      for (const usage of ticketUsageRows || []) {
        const ticketId = toIdNumber((usage as { ticket_id?: unknown }).ticket_id);
        if (!ticketId) continue;

        const { data: contractRow, error: contractFetchError } = await supabase
          .from("ticket_contracts")
          .select("id, used_count, remaining_count, prepaid_balance")
          .eq("id", ticketId)
          .maybeSingle();

        if (contractFetchError) throw contractFetchError;

        if (contractRow) {
          const currentUsed = Number((contractRow as { used_count?: number | null }).used_count || 0);
          const currentRemaining = Number(
            (contractRow as { remaining_count?: number | null }).remaining_count || 0
          );
          const currentBalance = Number(
            (contractRow as { prepaid_balance?: number | null }).prepaid_balance || 0
          );
          const restorePrice = Number((usage as { unit_price?: number | null }).unit_price || 0);
          const beforeCount = Number((usage as { before_count?: number | null }).before_count ?? NaN);

          const nextRemaining = Number.isFinite(beforeCount)
            ? Math.max(beforeCount, 0)
            : currentRemaining + 1;
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

      const usageIds = (ticketUsageRows || [])
        .map((row) => toIdNumber((row as { id?: unknown }).id))
        .filter((id): id is number => id !== null);

      if (usageIds.length > 0) {
        const { error } = await supabase.from("ticket_usages").delete().in("id", usageIds);
        if (error) throw error;
      }

      const saleIds = (salesRows || [])
        .map((row) => toIdNumber((row as { id?: unknown }).id))
        .filter((id): id is number => id !== null);

      if (saleIds.length > 0) {
        const { error } = await supabase.from("sales").delete().in("id", saleIds);
        if (error) throw error;
      }

      const counselingIds = (counselingRows || [])
        .map((row) => toIdNumber((row as { id?: unknown }).id))
        .filter((id): id is number => id !== null);

      if (counselingIds.length > 0) {
        const { error } = await supabase.from("counselings").delete().in("id", counselingIds);
        if (error) throw error;
      }

      const { error: deleteReservationError } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservationId);

      if (deleteReservationError) throw deleteReservationError;

      setOpenedActionReservationIds((prev) => prev.filter((id) => id !== String(item.id)));
      setSuccess("予約を削除しました。");

      await Promise.all([
        loadReservations(),
        loadReservationFlagsForVisible(),
        loadAttendance(),
        loadTicketContractsForVisibleCustomers(),
        loadCustomerTicketsForVisibleCustomers(),
      ]);
    } catch (e) {
      console.error(e);
      setError(`予約削除エラー: ${extractErrorMessage(e)}`);
    } finally {
      setDeletingReservationId("");
    }
  }

  function toggleReservationActions(reservationId: string | number) {
    const key = String(reservationId);
    setOpenedActionReservationIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]
    );
  }

  function toggleAttendanceActions(attendanceId: string | number) {
    const key = String(attendanceId);
    setOpenedAttendanceActionIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]
    );
  }

  function handleChangeStartTime(value: string) {
    setStartTime(value);
    if (!endTimeTouched || !trimmed(endTime)) {
      setEndTime(addOneHour(value));
    }
  }

  function goPrevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  function handleOpenCounselingPicker() {
    setError("");
    setSuccess("");

    if (counselingCandidates.length === 0) {
      setError("この日に新規の顧客付き予約がありません。日付を選ぶか予約を確認してください。");
      return;
    }

    setCounselingPickerOpen(true);
  }

  function handleGoCounseling(item: ReservationRow) {
    if (!item.customer_id) {
      setError("この予約に customer_id がありません。");
      return;
    }

    setCounselingPickerOpen(false);
    router.push(`/customer/${item.customer_id}/counseling?reservationId=${item.id}`);
  }

  async function handleReservationTap(item: ReservationRow) {
    const reservationId = toIdNumber(item.id);
    const isSold =
      trimmed(item.reservation_status) === "売上済" ||
      (reservationId !== null && salesReservationIdSet.has(reservationId));

    if (isSold) {
      router.push(`/reservation/detail/${item.id}`);
      return;
    }

    const ticketNumbering = getTicketNumberingForReservation(item);
    if (ticketNumbering) {
      await handleTicketConsumeAndCreateSale(item);
      return;
    }

    router.push(buildSalesHref(item));
  }

  function setFilterMode(nextMode: FilterMode) {
    setSelectedFilterMode((prev) => (prev === nextMode ? "all" : nextMode));
  }

  function getSummaryCardStyle(mode: FilterMode, base: CSSProperties) {
    const active = selectedFilterMode === mode;
    return {
      ...styles.summaryPill,
      ...base,
      ...(active ? styles.summaryPillSelected : {}),
    };
  }

  if (!mounted || !authChecked) return null;

  return (
    <main style={styles.page}>
      <div style={styles.mobileWrap}>
        <section style={styles.topBar}>
          <div style={styles.topHeaderRow}>
            <div style={styles.monthRow}>
              <button type="button" onClick={goPrevMonth} style={styles.arrowBtn}>‹</button>
              <h1 style={styles.monthTitle}>{formatMonthTitle(currentMonth)}</h1>
              <button type="button" onClick={goNextMonth} style={styles.arrowBtn}>›</button>
            </div>

            <div style={styles.topRightBtns}>
              <button type="button" onClick={() => openAttendanceCreateModal(selectedDate)} style={styles.attendanceTopBtn}>
                出勤追加
              </button>
              <button type="button" onClick={handleOpenCounselingPicker} style={styles.counselingTopBtn}>
                カウンセリング
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("pending")}
                style={{
                  ...styles.pendingFilterBtn,
                  ...(selectedFilterMode === "pending" ? styles.pendingFilterBtnActive : {}),
                }}
              >
                未処理だけ
              </button>
              <button type="button" onClick={() => router.push("/dashboard")} style={styles.topBtn}>
                TOP
              </button>
            </div>
          </div>

          <div style={styles.summaryBar}>
            <button type="button" onClick={() => setFilterMode("pending")} style={getSummaryCardStyle("pending", { background: "#fee2e2" })}>
              <span style={{ ...styles.summaryLabel, color: "#991b1b" }}>未処理</span>
              <span style={styles.summaryCountDanger}>{pendingSummary.totalPending}件</span>
            </button>
            <button type="button" onClick={() => setFilterMode("sales_pending")} style={getSummaryCardStyle("sales_pending", { background: "#fef3c7" })}>
              <span style={{ ...styles.summaryLabel, color: "#92400e" }}>売上未</span>
              <span style={{ ...styles.summaryCountDanger, color: "#b45309" }}>{pendingSummary.salesPending}件</span>
            </button>
            <button type="button" onClick={() => setFilterMode("counseling_pending")} style={getSummaryCardStyle("counseling_pending", { background: "#dbeafe" })}>
              <span style={{ ...styles.summaryLabel, color: "#1d4ed8" }}>カウンセリング未</span>
              <span style={{ ...styles.summaryCountDanger, color: "#1d4ed8" }}>{pendingSummary.counselingPending}件</span>
            </button>
            <button type="button" onClick={() => setFilterMode("ticket_pending")} style={getSummaryCardStyle("ticket_pending", { background: "#ede9fe" })}>
              <span style={{ ...styles.summaryLabel, color: "#6d28d9" }}>回数券未消化</span>
              <span style={{ ...styles.summaryCountDanger, color: "#6d28d9" }}>{pendingSummary.ticketPending}件</span>
            </button>
            <button type="button" onClick={() => setFilterMode("all")} style={getSummaryCardStyle("all", { background: "#dcfce7" })}>
              <span style={{ ...styles.summaryLabel, color: "#166534" }}>表示中</span>
              <span style={{ ...styles.summaryCount, color: "#166534" }}>{pendingSummary.visibleCount}件</span>
            </button>
          </div>

          <div style={styles.activeFilterBar}>
            <span style={styles.activeFilterLabel}>現在の表示:</span>
            <span style={styles.activeFilterValue}>
              {selectedFilterMode === "all" && "すべて"}
              {selectedFilterMode === "pending" && "未処理のみ"}
              {selectedFilterMode === "sales_pending" && "売上未のみ"}
              {selectedFilterMode === "counseling_pending" && "カウンセリング未のみ"}
              {selectedFilterMode === "ticket_pending" && "回数券未消化のみ"}
            </span>
          </div>

          <div style={styles.searchPanel}>
            <div style={styles.searchModeRow}>
              <button type="button" onClick={() => setSearchMode("customer")} style={{ ...styles.searchModeBtn, ...(searchMode === "customer" ? styles.searchModeBtnActive : {}) }}>
                お客さん検索
              </button>
              <button type="button" onClick={() => setSearchMode("staff")} style={{ ...styles.searchModeBtn, ...(searchMode === "staff" ? styles.searchModeBtnActive : {}) }}>
                スタッフ検索
              </button>
            </div>

            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder={searchMode === "customer" ? "名前・かな・電話で検索" : "スタッフ名で検索"}
              style={styles.searchInput}
            />

            {searchMode === "customer" && filteredCustomerSearchResults.length > 0 ? (
              <div style={styles.searchResultList}>
                {filteredCustomerSearchResults.map((c) => (
                  <button key={c.id} type="button" onClick={() => void loadCustomerHistory(c)} style={styles.searchResultItem}>
                    <div style={styles.searchResultTitle}>{c.name || "名称なし"}</div>
                    <div style={styles.searchResultSub}>{c.kana || "かな未設定"} / {c.phone || "電話未設定"}</div>
                  </button>
                ))}
              </div>
            ) : null}

            {searchMode === "staff" && filteredStaffSearchResults.length > 0 ? (
              <div style={styles.searchResultList}>
                {filteredStaffSearchResults.map((staff) => (
                  <button key={staff} type="button" onClick={() => void loadStaffHistory(staff)} style={styles.searchResultItem}>
                    <div style={styles.searchResultTitle}>{staff}</div>
                    <div style={styles.searchResultSub}>担当履歴を見る</div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div style={styles.reservationSearchRow}>
            <input
              value={reservationSearch}
              onChange={(e) => setReservationSearch(e.target.value)}
              placeholder="予約検索（顧客名 / メモ / 回数券 / 売上 / 店舗 / 担当）"
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterRow}>
            {STORE_OPTIONS.map((store) => (
              <button key={store} type="button" onClick={() => setSelectedStoreFilter(store)} style={{ ...styles.storeChip, ...(selectedStoreFilter === store ? styles.storeChipActive : {}) }}>
                {store}
              </button>
            ))}
          </div>

          <div style={styles.legendBox}>
            {["山口", "中西", "池田", "石川", "羽田", "菱谷", "井上", "林", "その他"].map((name) => (
              <div key={name} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: getStaffColor(name) }} />
                {name}
              </div>
            ))}
          </div>

          <div style={styles.legendBoxStore}>
            {["江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町", "江坂"].map((name) => (
              <div key={name} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: getStoreColor(name) }} />
                {name}
              </div>
            ))}
          </div>
        </section>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {success ? <div style={styles.successBox}>{success}</div> : null}

        <section style={styles.calendarCard}>
          <div style={styles.weekHeader}>
            {WEEK_LABELS.map((label, index) => (
              <div key={label} style={{ ...styles.weekLabel, color: index === 5 ? "#2563eb" : index === 6 ? "#ef4444" : "#94a3b8" }}>
                {label}
              </div>
            ))}
          </div>

          {loading ? (
            <div style={styles.loadingBox}>読み込み中...</div>
          ) : (
            <div style={styles.calendarGrid}>
              {calendarDays.map((dateObj) => {
                const ymd = toYmd(dateObj);
                const items = reservationsByDate.get(ymd) || [];
                const isCurrentMonth = dateObj.getMonth() === currentMonth.getMonth();
                const isToday = ymd === toYmd(new Date());
                const isSelected = ymd === selectedDate;

                const pendingCount = items.filter((item) =>
                  getPendingFlags({
                    item,
                    salesReservationIdSet,
                    counseledReservationIdSet,
                    ticketUsedReservationIdSet,
                  }).isPending
                ).length;

                return (
                  <button
                    key={ymd}
                    type="button"
                    onClick={() => openDay(ymd)}
                    style={{
                      ...styles.dayCell,
                      ...(isSelected ? styles.dayCellSelected : {}),
                      opacity: isCurrentMonth ? 1 : 0.4,
                      ...(pendingCount > 0 ? styles.dayCellPending : {}),
                    }}
                  >
                    <div style={styles.dayHead}>
                      <span style={{ ...styles.dayNumber, ...(isToday ? styles.todayBadge : {}) }}>
                        {dateObj.getDate()}
                      </span>
                      {pendingCount > 0 ? <span style={styles.dayPendingBadge}>{pendingCount}</span> : null}
                    </div>

                    <div style={styles.dayCount}>{items.length}件</div>

                    <div style={styles.dayMiniList}>
                      {items.slice(0, 3).map((item) => {
                        const ticketBadges = getTicketBadgesForReservation(item);
                        const saleSummary = getReservationSaleSummary(item);

                        return (
                          <div key={String(item.id)} style={{ ...styles.dayMiniCard, borderLeft: `3px solid ${getStaffColor(item.staff_name)}` }}>
                            <div style={styles.dayMiniTime}>{trimmed(item.start_time)}</div>
                            <div style={styles.dayMiniNameRow}>
                              <div style={styles.dayMiniName}>{trimmed(item.customer_name)}</div>
                              <div style={styles.dayMiniTicketWrap}>
                                {ticketBadges.length > 0 ? (
                                  ticketBadges.map((badge, index) => (
                                    <span key={`${String(item.id)}-ticket-${index}`} style={{ ...styles.dayMiniTicketBadge, ...(badge.tone === "warning" ? styles.dayMiniTicketBadgeWarning : {}), ...(badge.tone === "danger" ? styles.dayMiniTicketBadgeDanger : {}) }}>
                                      {badge.label}
                                    </span>
                                  ))
                                ) : (
                                  <span style={styles.dayMiniTicketPlaceholder}>--</span>
                                )}
                              </div>
                            </div>
                            <div style={styles.dayMiniMemo}>{trimmed(item.memo) || "メモなし"}</div>
                            {saleSummary ? <div style={styles.dayMiniSale}>{saleSummary}</div> : <div style={styles.dayMiniSaleMuted}>売上未</div>}
                          </div>
                        );
                      })}
                      {items.length > 3 ? <div style={styles.dayMore}>+{items.length - 3}</div> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {daySheetOpen ? (
          <div style={styles.sheetOverlay} onClick={() => setDaySheetOpen(false)}>
            <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div style={styles.sheetHandle} />

              <div style={styles.sheetHeader}>
                <div>
                  <div style={styles.sheetSubTitle}>予約 / 出勤一覧</div>
                  <h2 style={styles.sheetTitle}>{formatJapaneseDate(selectedDate)}</h2>
                </div>

                <div style={styles.sheetHeaderBtns}>
                  <button type="button" onClick={() => openCreateModal(selectedDate)} style={styles.sheetActionBtn}>
                    ＋予約
                  </button>
                  <button type="button" onClick={() => openAttendanceCreateModal(selectedDate)} style={styles.sheetAttendanceBtn}>
                    ＋出勤
                  </button>
                  <button type="button" onClick={() => setDaySheetOpen(false)} style={styles.sheetCloseBtn}>
                    閉じる
                  </button>
                </div>
              </div>

              {selectedDayTimeline.length === 0 ? (
                <div style={styles.emptyDayBox}>この日の予定はありません。</div>
              ) : (
                <div style={styles.timeTreeList}>
                  {selectedDayTimeline.map((timelineItem) => {
                    if (timelineItem.type === "attendance") {
                      const item = timelineItem.attendance;
                      const actionOpened = openedAttendanceActionIds.includes(String(item.id));

                      return (
                        <div key={`attendance-${item.id}`} style={styles.timeTreeCard}>
                          <div style={styles.timeTreeItem}>
                            <div style={styles.timeTreeTimeCol}>
                              <div style={styles.timeTreeStart}>{trimmed(item.clock_in) || "--:--"}</div>
                              <div style={styles.timeTreeEnd}>{trimmed(item.clock_out) || "--:--"}</div>
                            </div>

                            <div style={{ ...styles.timeTreeLine, background: getStaffColor(item.staff_name) }} />

                            <button
                              type="button"
                              onClick={() => toggleAttendanceActions(item.id)}
                              style={styles.timeTreeBodyButton}
                            >
                              <div style={styles.timeTreeTitleRow}>
                                <span style={styles.timeTreeTitle}>{trimmed(item.staff_name) || "スタッフ未設定"}勤務</span>
                                <span style={styles.attendanceBadge}>出勤</span>
                              </div>
                              <div style={styles.timeTreeMemo}>{trimmed(item.memo) || "スタッフ出勤"}</div>
                              <div style={styles.timeTreeSub}>タップで編集・削除</div>
                            </button>

                            <div style={{ ...styles.timeTreeAvatar, background: getStaffColor(item.staff_name) }}>
                              {getStaffShortLabel(item.staff_name)}
                            </div>
                          </div>

                          {actionOpened ? (
                            <div style={styles.timeTreeDrawerTwo}>
                              <button type="button" onClick={() => openAttendanceEditModal(item)} style={styles.timeTreeBlueBtn}>
                                編集
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteAttendance(item)}
                                style={styles.timeTreeDeleteBtn}
                                disabled={attendanceDeletingId === String(item.id)}
                              >
                                {attendanceDeletingId === String(item.id) ? "削除中..." : "削除"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    }

                    const item = timelineItem.reservation;
                    const ticketBadges = getTicketBadgesForReservation(item);
                    const actionOpened = openedActionReservationIds.includes(String(item.id));
                    const reservationId = toIdNumber(item.id);
                    const isSold =
                      trimmed(item.reservation_status) === "売上済" ||
                      (reservationId !== null && salesReservationIdSet.has(reservationId));
                    const isTicket = ticketBadges.length > 0;
                    const saleSummary = getReservationSaleSummary(item);
                    const memoText = trimmed(item.memo);
                    const title = `${trimmed(item.customer_name) || "顧客名未設定"}${
                      trimmed(item.menu) ? `様${trimmed(item.menu)}` : ""
                    }`;

                    return (
                      <div key={`reservation-${item.id}`} style={styles.timeTreeCard}>
                        <div style={styles.timeTreeItem}>
                          <div style={styles.timeTreeTimeCol}>
                            <div style={styles.timeTreeStart}>{trimmed(item.start_time) || "--:--"}</div>
                            <div style={styles.timeTreeEnd}>{trimmed(item.end_time) || "--:--"}</div>
                          </div>

                          <div style={{ ...styles.timeTreeLine, background: getStaffColor(item.staff_name) }} />

                          <button type="button" onClick={() => router.push(`/reservation/detail/${item.id}`)} style={styles.timeTreeBodyButton}>
                            <div style={styles.timeTreeTitleRow}>
                              <span style={styles.timeTreeTitle}>{title}</span>
                              {ticketBadges.length > 0 ? (
                                <span style={styles.timeTreeTicketGroup}>
                                  {ticketBadges.map((badge, index) => (
                                    <span key={`${String(item.id)}-tt-ticket-${index}`} style={{ ...styles.timeTreeTicket, ...(badge.tone === "warning" ? styles.timeTreeTicketWarning : {}), ...(badge.tone === "danger" ? styles.timeTreeTicketDanger : {}) }}>
                                      {badge.label}
                                    </span>
                                  ))}
                                </span>
                              ) : null}
                            </div>

                            {memoText ? <div style={styles.timeTreeMemo}>{memoText}</div> : <div style={styles.timeTreeMemoMuted}>メモなし</div>}
                            {saleSummary ? <div style={styles.timeTreeSale}>{saleSummary}</div> : <div style={styles.timeTreeSaleMuted}>売上未</div>}
                            <div style={styles.timeTreeSub}>
                              {trimmed(item.store_name) || "店舗未設定"} / {trimmed(item.staff_name) || "担当未設定"}
                            </div>
                          </button>

                          <div style={{ ...styles.timeTreeAvatar, background: getStaffColor(item.staff_name) }}>
                            {getStaffShortLabel(item.staff_name)}
                          </div>
                        </div>

                        <div style={styles.timeTreeOperationLine}>
                          <button type="button" onClick={() => toggleReservationActions(item.id)} style={styles.timeTreeOperationBtn}>
                            {actionOpened ? "閉じる" : "操作"}
                          </button>
                        </div>

                        {actionOpened ? (
                          <div style={styles.timeTreeDrawer}>
                            <button type="button" onClick={() => router.push(`/reservation/detail/${item.id}`)} style={styles.timeTreeBlueBtn}>
                              詳細
                            </button>
                            {!isSold ? (
                              <button type="button" onClick={() => void handleReservationTap(item)} style={isTicket ? styles.timeTreeOrangeBtn : styles.timeTreeDarkBtn} disabled={consumingReservationId === String(item.id)}>
                                {consumingReservationId === String(item.id) ? "処理中..." : isTicket ? "消化/売上" : "売上登録"}
                              </button>
                            ) : null}
                            <button type="button" onClick={() => handleDeleteReservation(item)} style={styles.timeTreeDeleteBtn} disabled={deletingReservationId === String(item.id)}>
                              {deletingReservationId === String(item.id) ? "削除中..." : "削除"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {attendanceFormOpen ? (
          <div style={styles.modalOverlay} onClick={() => setAttendanceFormOpen(false)}>
            <div style={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  {attendanceFormMode === "edit" ? "スタッフ出勤編集" : "スタッフ出勤追加"}
                </h3>
                <button type="button" style={styles.modalCloseBtn} onClick={() => setAttendanceFormOpen(false)}>
                  ×
                </button>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formBlockFull}>
                  <label style={styles.label}>スタッフ</label>
                  <select value={attendanceStaffName} onChange={(e) => setAttendanceStaffName(e.target.value)} style={styles.input}>
                    {STAFF_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>日付</label>
                  <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={styles.input} />
                </div>

                <div>
                  <label style={styles.label}>出勤</label>
                  <input type="time" value={attendanceClockIn} onChange={(e) => setAttendanceClockIn(e.target.value)} style={styles.input} />
                </div>

                <div>
                  <label style={styles.label}>退勤</label>
                  <input type="time" value={attendanceClockOut} onChange={(e) => setAttendanceClockOut(e.target.value)} style={styles.input} />
                </div>

                <div style={styles.formBlockFull}>
                  <label style={styles.label}>メモ</label>
                  <textarea value={attendanceMemo} onChange={(e) => setAttendanceMemo(e.target.value)} rows={3} style={styles.textarea} placeholder="例：ヘルプ勤務 / 早上がり / 研修など" />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setAttendanceFormOpen(false)} style={styles.cancelBtn}>
                  キャンセル
                </button>
                <button type="button" onClick={() => void handleSaveAttendance()} style={styles.saveBtn} disabled={attendanceSaving}>
                  {attendanceSaving ? "保存中..." : attendanceFormMode === "edit" ? "編集保存" : "保存する"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
                {formOpen ? (
          <div style={styles.modalOverlay} onClick={() => setFormOpen(false)}>
            <div style={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>新規予約追加</h3>
                <button type="button" style={styles.modalCloseBtn} onClick={() => setFormOpen(false)}>
                  ×
                </button>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formBlockFull}>
                  <label style={styles.label}>顧客検索</label>
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="名前・かな・電話で検索"
                    style={styles.input}
                  />
                  {filteredCustomers.length > 0 ? (
                    <div style={styles.customerSuggestList}>
                      {filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c.id)}
                          style={styles.customerSuggestItem}
                        >
                          <div style={styles.customerSuggestTitle}>{c.name || "名称なし"}</div>
                          <div style={styles.customerSuggestSub}>
                            {c.kana || "かな未設定"} / {c.phone || "電話未設定"}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div style={styles.formBlockFull}>
                  <label style={styles.label}>顧客名</label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="山田 太郎"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>かな</label>
                  <input
                    value={customerKana}
                    onChange={(e) => setCustomerKana(e.target.value)}
                    placeholder="やまだ たろう"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>電話番号</label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="09012345678"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>日付</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>来店区分</label>
                  <select value={visitType} onChange={(e) => setVisitType(e.target.value)} style={styles.input}>
                    {VISIT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>開始時間</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleChangeStartTime(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>終了時間</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setEndTimeTouched(true);
                    }}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>店舗</label>
                  <select value={storeName} onChange={(e) => setStoreName(e.target.value)} style={styles.input}>
                    {STORE_OPTIONS_FOR_FORM.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>担当</label>
                  <select value={staffName} onChange={(e) => setStaffName(e.target.value)} style={styles.input}>
                    {STAFF_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>メニュー</label>
                  <select value={menu} onChange={(e) => setMenu(e.target.value)} style={styles.input}>
                    {MENU_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>支払方法</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={styles.input}
                  >
                    {PAYMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formBlockFull}>
                  <label style={styles.label}>メモ</label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={4}
                    style={styles.textarea}
                    placeholder="備考があれば入力"
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setFormOpen(false)} style={styles.cancelBtn}>
                  キャンセル
                </button>
                <button type="button" onClick={() => void handleSaveReservation()} style={styles.saveBtn} disabled={saving}>
                  {saving ? "保存中..." : "保存する"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {counselingPickerOpen ? (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.modalTitle}>カウンセリング対象を選択</h3>

              {counselingCandidates.map((item) => (
                <button key={item.id} onClick={() => handleGoCounseling(item)} style={styles.modalItem}>
                  {item.customer_name}
                </button>
              ))}

              <button onClick={() => setCounselingPickerOpen(false)} style={styles.modalClose}>
                閉じる
              </button>
            </div>
          </div>
        ) : null}

        {historyOpen ? (
          <div style={styles.modalOverlay} onClick={() => setHistoryOpen(false)}>
            <div style={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  {selectedHistoryCustomer
                    ? `${selectedHistoryCustomer.name} の履歴`
                    : selectedHistoryStaff
                    ? `${selectedHistoryStaff} の担当履歴`
                    : "履歴"}
                </h3>
                <button type="button" style={styles.modalCloseBtn} onClick={() => setHistoryOpen(false)}>
                  ×
                </button>
              </div>

              {historyLoading ? (
                <div style={styles.loadingBox}>読み込み中...</div>
              ) : (
                <div style={styles.cardList}>
                  {selectedHistoryCustomer ? (
                    <>
                      <div style={styles.historySectionTitle}>予約履歴</div>
                      {customerHistory.length > 0 ? (
                        customerHistory.map((item) => (
                          <div key={item.id} style={styles.historyCard}>
                            <div style={styles.historyTitle}>
                              {trimmed(item.date)} {trimmed(item.start_time)} - {trimmed(item.end_time)}
                            </div>
                            <div style={styles.historyMeta}>
                              {trimmed(item.menu) || "メニュー未設定"}
                              <br />
                              {trimmed(item.store_name) || "店舗未設定"} / {trimmed(item.staff_name) || "担当未設定"}
                              {trimmed(item.memo) ? (
                                <>
                                  <br />
                                  メモ: {trimmed(item.memo)}
                                </>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={styles.emptyBox}>予約履歴がありません。</div>
                      )}

                      <div style={styles.historySectionTitle}>売上履歴</div>
                      {customerSalesHistory.length > 0 ? (
                        customerSalesHistory.map((sale) => (
                          <div key={String(sale.id)} style={styles.historyCard}>
                            <div style={styles.historyTitle}>
                              {trimmed(sale.sale_date) || "日付未設定"} / {formatMoney(sale.amount)}
                            </div>
                            <div style={styles.historyMeta}>
                              {trimmed(sale.menu_type) || "区分未設定"} / {trimmed(sale.sale_type) || "売上種別未設定"}
                              <br />
                              {trimmed(sale.store_name) || "店舗未設定"} / {trimmed(sale.staff_name) || "担当未設定"} /{" "}
                              {trimmed(sale.payment_method) || "支払未設定"}
                              {trimmed(sale.memo) ? (
                                <>
                                  <br />
                                  メモ: {trimmed(sale.memo)}
                                </>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={styles.emptyBox}>売上履歴がありません。</div>
                      )}
                    </>
                  ) : selectedHistoryStaff ? (
                    staffHistory.length > 0 ? (
                      staffHistory.map((item) => (
                        <div key={item.id} style={styles.historyCard}>
                          <div style={styles.historyTitle}>
                            {trimmed(item.date)} {trimmed(item.start_time)} - {trimmed(item.end_time)}
                          </div>
                          <div style={styles.historyMeta}>
                            {trimmed(item.customer_name) || "顧客名未設定"}
                            <br />
                            {trimmed(item.menu) || "メニュー未設定"} / {trimmed(item.store_name) || "店舗未設定"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={styles.emptyBox}>履歴がありません。</div>
                    )
                  ) : (
                    <div style={styles.emptyBox}>履歴がありません。</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
  },
  mobileWrap: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    paddingBottom: 28,
    overflowX: "hidden",
  },
  topBar: {
    padding: "12px 12px 0",
  },
  topHeaderRow: {
    display: "grid",
    gap: 10,
    marginBottom: 10,
  },
  monthRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: "12px 14px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
  },
  monthTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: "#0f172a",
  },
  arrowBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    width: 36,
    height: 36,
    borderRadius: 999,
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
  },
  topRightBtns: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
  },
  attendanceTopBtn: {
    minWidth: 0,
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    borderRadius: 14,
    padding: "11px 8px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  counselingTopBtn: {
    minWidth: 0,
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    borderRadius: 14,
    padding: "11px 8px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  pendingFilterBtn: {
    minWidth: 0,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    borderRadius: 14,
    padding: "11px 8px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  pendingFilterBtnActive: {
    background: "#dc2626",
    color: "#fff",
    border: "1px solid #dc2626",
  },
  topBtn: {
    minWidth: 0,
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 14,
    padding: "11px 8px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  summaryBar: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    marginBottom: 10,
  },
  summaryPill: {
    border: "1px solid transparent",
    borderRadius: 16,
    padding: 10,
    display: "grid",
    gap: 2,
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  },
  summaryPillSelected: {
    outline: "2px solid #111827",
    outlineOffset: -2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 900,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: 900,
  },
  summaryCountDanger: {
    fontSize: 18,
    fontWeight: 900,
    color: "#dc2626",
  },
  activeFilterBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    borderRadius: 14,
    padding: "9px 12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  activeFilterLabel: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: 800,
  },
  activeFilterValue: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: 900,
  },
  searchPanel: {
    background: "#fff",
    borderRadius: 18,
    padding: 11,
    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
    marginBottom: 10,
  },
  searchModeRow: {
    display: "flex",
    gap: 8,
    marginBottom: 9,
  },
  searchModeBtn: {
    flex: 1,
    borderRadius: 12,
    padding: "9px 12px",
    border: "1px solid #dbe2ea",
    background: "#f8fafc",
    color: "#334155",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  searchModeBtnActive: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
  },
  searchInput: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  reservationSearchRow: {
    marginBottom: 10,
  },
  searchResultList: {
    display: "grid",
    gap: 8,
    marginTop: 10,
  },
  searchResultItem: {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#f8fafc",
    padding: 12,
    textAlign: "left",
    cursor: "pointer",
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 4,
  },
  searchResultSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
  filterRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 10,
  },
  storeChip: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
  },
  storeChipActive: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
  },
  legendBox: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  legendBoxStore: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    color: "#475569",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    padding: "6px 10px",
    border: "1px solid #e2e8f0",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
  },
  errorBox: {
    margin: "12px",
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "12px 14px",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid #fecaca",
  },
  successBox: {
    margin: "12px",
    background: "#dcfce7",
    color: "#166534",
    padding: "12px 14px",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid #bbf7d0",
  },
  loadingBox: {
    padding: "24px 16px",
    textAlign: "center",
    fontSize: 14,
    fontWeight: 800,
    color: "#64748b",
  },
  calendarCard: {
    margin: "12px",
    marginTop: 8,
    background: "#fff",
    borderRadius: 22,
    border: "1px solid #e2e8f0",
    boxShadow: "0 16px 30px rgba(15,23,42,0.08)",
    overflow: "hidden",
  },
  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  weekLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: 900,
    padding: "10px 0",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gridAutoRows: "168px",
  },
  dayCell: {
    height: "168px",
    minHeight: "168px",
    maxHeight: "168px",
    border: "none",
    borderRight: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    background: "#fff",
    padding: 5,
    textAlign: "left",
    cursor: "pointer",
    verticalAlign: "top",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  dayCellSelected: {
    background: "#eff6ff",
  },
  dayCellPending: {
    background: "#fff7ed",
  },
  dayHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    flexShrink: 0,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: 900,
    color: "#111827",
  },
  todayBadge: {
    background: "#111827",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 7px",
  },
  dayPendingBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    background: "#dc2626",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 900,
    padding: "0 5px",
    flexShrink: 0,
  },
  dayCount: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 800,
    marginBottom: 3,
    flexShrink: 0,
  },
  dayMiniList: {
    display: "grid",
    gap: 3,
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    alignContent: "start",
  },
  dayMiniCard: {
    borderRadius: 8,
    padding: "3px 4px 3px 6px",
    background: "#f8fafc",
    overflow: "hidden",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: 1,
    alignItems: "stretch",
  },
  dayMiniTime: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dayMiniNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  dayMiniName: {
    fontSize: 10,
    color: "#0f172a",
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
  },
  dayMiniTicketWrap: {
    display: "inline-flex",
    gap: 2,
    flexShrink: 0,
  },
  dayMiniTicketBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 24,
    height: 15,
    padding: "0 4px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    fontSize: 8,
    fontWeight: 900,
    lineHeight: 1,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  dayMiniTicketBadgeWarning: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fdba74",
  },
  dayMiniTicketBadgeDanger: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #ef4444",
  },
  dayMiniTicketPlaceholder: {
    fontSize: 8,
    color: "#cbd5e1",
    fontWeight: 900,
  },
  dayMiniMemo: {
    marginTop: 1,
    fontSize: 8,
    color: "#94a3b8",
    fontWeight: 700,
    lineHeight: 1.15,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dayMiniSale: {
    marginTop: 1,
    fontSize: 8,
    color: "#0f766e",
    fontWeight: 800,
    lineHeight: 1.15,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dayMiniSaleMuted: {
    marginTop: 1,
    fontSize: 8,
    color: "#ef4444",
    fontWeight: 900,
    lineHeight: 1.15,
  },
  dayMore: {
    fontSize: 10,
    color: "#2563eb",
    fontWeight: 900,
    paddingLeft: 2,
    marginTop: "auto",
  },
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.34)",
    zIndex: 50,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "88vh",
    overflowY: "auto",
    background: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: "8px 12px 18px",
    boxSizing: "border-box",
    boxShadow: "0 -10px 30px rgba(15,23,42,0.18)",
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    background: "#cbd5e1",
    margin: "4px auto 10px",
  },
  sheetHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  sheetSubTitle: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 800,
    marginBottom: 3,
  },
  sheetTitle: {
    margin: 0,
    fontSize: 19,
    color: "#0f172a",
    fontWeight: 900,
    lineHeight: 1.25,
  },
  sheetHeaderBtns: {
    display: "flex",
    gap: 5,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  sheetActionBtn: {
    border: "none",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  sheetAttendanceBtn: {
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  sheetCloseBtn: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  emptyDayBox: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    borderRadius: 18,
    padding: "18px 14px",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 700,
  },
  timeTreeList: {
    display: "grid",
    gap: 0,
    padding: "0 0 12px",
  },
  timeTreeCard: {
    borderBottom: "1px solid #f1f5f9",
    padding: "1px 0 4px",
    background: "#fff",
  },
  timeTreeItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    minHeight: 48,
  },
  timeTreeTimeCol: {
    width: 50,
    flexShrink: 0,
    textAlign: "right",
    paddingRight: 2,
  },
  timeTreeStart: {
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.05,
  },
  timeTreeEnd: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: 700,
    color: "#9ca3af",
    lineHeight: 1.05,
  },
  timeTreeLine: {
    width: 4,
    minHeight: 38,
    alignSelf: "stretch",
    borderRadius: 999,
    flexShrink: 0,
  },
  timeTreeBody: {
    flex: 1,
    minWidth: 0,
  },
  timeTreeBodyButton: {
    flex: 1,
    minWidth: 0,
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    textAlign: "left",
    cursor: "pointer",
  },
  timeTreeTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
    flexWrap: "wrap",
  },
  timeTreeTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#171717",
    letterSpacing: "-0.03em",
    lineHeight: 1.12,
  },
  attendanceBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 18,
    padding: "0 7px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    fontSize: 10,
    fontWeight: 900,
    lineHeight: 1,
  },
  timeTreeTicketGroup: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  timeTreeTicket: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 30,
    height: 18,
    padding: "0 6px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    fontSize: 10,
    fontWeight: 900,
    lineHeight: 1,
    whiteSpace: "nowrap",
  },
  timeTreeTicketWarning: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fdba74",
  },
  timeTreeTicketDanger: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #ef4444",
  },
  timeTreeMemo: {
    marginTop: 2,
    fontSize: 11,
    color: "#8b8b8b",
    fontWeight: 700,
    lineHeight: 1.18,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  timeTreeMemoMuted: {
    marginTop: 2,
    fontSize: 10,
    color: "#c4c4c4",
    fontWeight: 700,
    lineHeight: 1.18,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  timeTreeSale: {
    marginTop: 2,
    fontSize: 10,
    color: "#0f766e",
    fontWeight: 800,
    lineHeight: 1.18,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  timeTreeSaleMuted: {
    marginTop: 2,
    fontSize: 10,
    color: "#ef4444",
    fontWeight: 900,
    lineHeight: 1.18,
  },
  timeTreeSub: {
    marginTop: 1,
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  timeTreeAvatar: {
    width: 31,
    height: 31,
    borderRadius: 999,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 900,
    flexShrink: 0,
  },
  timeTreeOperationLine: {
    marginTop: -4,
    paddingLeft: 62,
  },
  timeTreeOperationBtn: {
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 0",
    cursor: "pointer",
  },
  timeTreeDrawer: {
    marginLeft: 62,
    marginTop: 3,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 6,
  },
  timeTreeDrawerTwo: {
    marginLeft: 62,
    marginTop: 3,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 6,
  },
  timeTreeBlueBtn: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 10,
    padding: "7px 6px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  timeTreeOrangeBtn: {
    border: "none",
    background: "#f59e0b",
    color: "#fff",
    borderRadius: 10,
    padding: "7px 6px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  timeTreeDarkBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 10,
    padding: "7px 6px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  timeTreeDeleteBtn: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    borderRadius: 10,
    padding: "7px 6px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.34)",
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    boxSizing: "border-box",
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    boxSizing: "border-box",
    boxShadow: "0 20px 40px rgba(15,23,42,0.18)",
  },
  modalSmall: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    boxSizing: "border-box",
    boxShadow: "0 20px 40px rgba(15,23,42,0.18)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
  },
  modalCloseBtn: {
    border: "none",
    background: "#f1f5f9",
    color: "#334155",
    width: 34,
    height: 34,
    borderRadius: 999,
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  formBlockFull: {
    gridColumn: "1 / -1",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: "0 12px",
    fontSize: 14,
    color: "#0f172a",
    boxSizing: "border-box",
    outline: "none",
  },
  textarea: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: 12,
    fontSize: 14,
    color: "#0f172a",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
  },
  customerSuggestList: {
    display: "grid",
    gap: 8,
    marginTop: 10,
    maxHeight: 180,
    overflowY: "auto",
  },
  customerSuggestItem: {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#f8fafc",
    padding: 12,
    textAlign: "left",
    cursor: "pointer",
  },
  customerSuggestTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 4,
  },
  customerSuggestSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
  },
  cancelBtn: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  saveBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  cardList: {
    display: "grid",
    gap: 10,
  },
  emptyBox: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    borderRadius: 14,
    padding: "16px 12px",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 700,
  },
  modalItem: {
    width: "100%",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 12,
    padding: "12px 14px",
    textAlign: "left",
    cursor: "pointer",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  modalClose: {
    width: "100%",
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 900,
    marginTop: 8,
  },
  historySectionTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
    marginTop: 6,
    marginBottom: 6,
  },
  historyCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 6,
  },
  historyMeta: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.6,
  },
};