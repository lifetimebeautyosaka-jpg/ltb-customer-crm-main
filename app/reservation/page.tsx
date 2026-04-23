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
      typeof maybe.code === "string" ? `code: ${maybe.code}` : "",
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(" / ");
  }

  return "不明なエラーです。";
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
  const ticketMenu = isTicketMenu(item.menu);
  const isTicketUsed = ticketUsedReservationIdSet.has(reservationId);

  const salesPending = !isSold;
  const counselingPending = isNewVisit(item) && !isCounseled;
  const ticketPending = ticketMenu && !isTicketUsed;

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
  const [counselingPickerOpen, setCounselingPickerOpen] = useState(false);

  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [attendanceItems, setAttendanceItems] = useState<StaffAttendanceItem[]>([]);
  const [ticketContracts, setTicketContracts] = useState<TicketContractRow[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerKana, setCustomerKana] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [formDate, setFormDate] = useState(toYmd(new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [endTimeTouched, setEndTimeTouched] = useState(false);

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
  const [openedMemoReservationIds, setOpenedMemoReservationIds] = useState<string[]>([]);
  const [openedActionReservationIds, setOpenedActionReservationIds] = useState<string[]>([]);

  const [globalSearch, setGlobalSearch] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("customer");
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] =
    useState<CustomerOption | null>(null);
  const [selectedHistoryStaff, setSelectedHistoryStaff] = useState("");
  const [customerHistory, setCustomerHistory] = useState<ReservationHistoryItem[]>([]);
  const [staffHistory, setStaffHistory] = useState<StaffHistoryItem[]>([]);
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

      const normalized = ((data as CustomerRow[]) || []).map((row) => ({
        id: String(row.id),
        name: row.name || "",
        kana: row.kana || "",
        phone: row.phone || "",
        planType: row.plan_type || "",
      }));

      setCustomers(normalized);
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
        .select("id, staff_name, work_date, clock_in, clock_out")
        .gte("work_date", monthStart)
        .lte("work_date", monthEnd)
        .order("work_date", { ascending: true })
        .order("clock_in", { ascending: true });

      if (error) {
        if ((error as { code?: string }).code === "PGRST205") {
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
          memo: null,
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
      .filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          c.kana.toLowerCase().includes(q) ||
          c.phone.includes(q)
        );
      })
      .slice(0, 25);
  }, [customerSearch, customers]);

  const filteredCustomerSearchResults = useMemo(() => {
    const q = trimmed(globalSearch).toLowerCase();
    if (!q || searchMode !== "customer") return [];

    return customers
      .filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          c.kana.toLowerCase().includes(q) ||
          c.phone.includes(q)
        );
      })
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

  useEffect(() => {
    if (!mounted || !authChecked) return;
    void loadReservationFlagsForVisible();
  }, [mounted, authChecked, baseVisibleReservations]);

  useEffect(() => {
    if (!mounted || !authChecked) return;
    void loadTicketContractsForVisibleCustomers();
  }, [mounted, authChecked, baseVisibleReservations, customers]);

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

        const aUpdated = trimmed(a.updated_at || a.created_at);
        const bUpdated = trimmed(b.updated_at || b.created_at);
        if (aUpdated !== bUpdated) return aUpdated < bUpdated ? 1 : -1;

        const aId = toIdNumber(a.id) || 0;
        const bId = toIdNumber(b.id) || 0;
        return bId - aId;
      });
    }

    return map;
  }, [ticketContracts]);

  async function loadReservationFlagsForVisible() {
    if (!supabase) return;

    const reservationIds = baseVisibleReservations
      .map((item) => toIdNumber(item.id))
      .filter((id): id is number => id !== null);

    if (reservationIds.length === 0) {
      setSalesReservationIds([]);
      setCounseledReservationIds([]);
      setTicketUsedReservationIds([]);
      return;
    }

    try {
      const [
        { data: salesData, error: salesError },
        { data: counselingData, error: counselingError },
        { data: ticketUsageData, error: ticketUsageError },
      ] = await Promise.all([
        supabase.from("sales").select("reservation_id").in("reservation_id", reservationIds),
        supabase
          .from("counselings")
          .select("reservation_id")
          .in("reservation_id", reservationIds),
        supabase
          .from("ticket_usages")
          .select("reservation_id")
          .in("reservation_id", reservationIds),
      ]);

      if (salesError) throw salesError;
      if (counselingError) throw counselingError;
      if (ticketUsageError) throw ticketUsageError;

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
          "id, customer_id, ticket_name, remaining_count, used_count, prepaid_balance, status, created_at, updated_at"
        )
        .in("customer_id", customerIds)
        .order("updated_at", { ascending: false })
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
    if (!isTicketMenu(item.menu)) return null;

    const contract = getTicketContractForReservation(item);
    if (!contract) return null;

    const usedCount = Math.max(Number(contract.used_count ?? 0), 0);
    const remainingCount = Math.max(Number(contract.remaining_count ?? 0), 0);
    const totalCount = usedCount + remainingCount;

    if (totalCount <= 0) return null;

    const reservationId = toIdNumber(item.id);
    const alreadyUsed =
      reservationId !== null && ticketUsedReservationIdSet.has(reservationId);

    const currentNumber = alreadyUsed
      ? Math.min(usedCount, totalCount)
      : Math.min(usedCount + 1, totalCount);

    const isDanger = currentNumber >= totalCount;
    const isWarning = !isDanger && currentNumber === totalCount - 1;

    return {
      label: `${totalCount}-${currentNumber}`,
      tone: isDanger ? "danger" : isWarning ? "warning" : "normal",
      showUpdate: isDanger,
      showPaymentAlert: isDanger,
    };
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

    if (selectedCustomerId) {
      return selectedCustomerId;
    }

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

      if (phoneMatchError) {
        console.warn(phoneMatchError);
      }

      if (phoneMatch) {
        return String((phoneMatch as CustomerRow).id);
      }
    }

    const { data: nameMatch, error: nameMatchError } = await supabase
      .from("customers")
      .select("id, name, kana, phone, plan_type")
      .eq("name", name)
      .limit(1)
      .maybeSingle();

      if (nameMatchError) {
        console.warn(nameMatchError);
      }

      if (nameMatch) {
        return String((nameMatch as CustomerRow).id);
      }

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
        ]);
      } catch (e) {
        console.error(e);
        setError(`予約保存エラー: ${extractErrorMessage(e)}`);
      } finally {
        setSaving(false);
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

        const { data, error } = await supabase
          .from("reservations")
          .select(
            "id, customer_id, customer_name, date, start_time, end_time, store_name, staff_name, menu, memo"
          )
          .eq("customer_id", Number(customer.id))
          .order("date", { ascending: false })
          .order("start_time", { ascending: false })
          .limit(50);

        if (error) throw error;

        setCustomerHistory((data as ReservationHistoryItem[]) || []);
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

        const alreadyUsed = ticketUsedReservationIdSet.has(reservationId);
        if (alreadyUsed) {
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

        if (!ticketName) {
          setError(
            "回数券名を特定できません。予約メニューか顧客プラン名を、単価表にある名前へ合わせてください。"
          );
          return;
        }

        const unitPrice = TICKET_UNIT_PRICES[ticketName];
        if (!unitPrice) {
          setError(`単価設定がありません: ${ticketName}`);
          return;
        }

        const { data: contractRow, error: contractError } = await supabase
          .from("ticket_contracts")
          .select("*")
          .eq("customer_id", customerId)
          .eq("ticket_name", ticketName)
          .eq("status", "active")
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (contractError) throw contractError;
        if (!contractRow) {
          setError(`有効な回数券契約がありません: ${ticketName}`);
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
          `${trimmed(item.customer_name) || "この顧客"} の ${ticketName} を1回消化して、${unitPrice.toLocaleString()}円の売上を立てます。よろしいですか？`
        );
        if (!ok) return;

        const nextRemaining = remainingCount - 1;
        const nextUsed = usedCount + 1;
        const nextBalance = Math.max(prepaidBalance - unitPrice, 0);

        const serviceType = detectServiceTypeFromTicketName(ticketName);

        const { error: usageInsertError } = await supabase.from("ticket_usages").insert({
          ticket_id: currentContract.id,
          customer_id: customerId,
          reservation_id: reservationId,
          used_date: trimmed(item.date),
          ticket_name: ticketName,
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
          trimmed(item.customer_name) ||
          trimmed((customerRow as { name?: string | null }).name) ||
          null;

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
          memo: `${ticketName} 消化`,
        });

        if (salesInsertError) throw salesInsertError;

        const { error: reservationUpdateError } = await supabase
          .from("reservations")
          .update({
            reservation_status: "売上済",
          })
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
        ]);

        router.push(
          `/sales?reservationId=${reservationId}&customerId=${customerId}&customerName=${encodeURIComponent(
            customerNameValue || ""
          )}&date=${encodeURIComponent(trimmed(item.date))}&menu=${encodeURIComponent(
            ticketName
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
            const currentUsed = Number(
              (contractRow as { used_count?: number | null }).used_count || 0
            );
            const currentRemaining = Number(
              (contractRow as { remaining_count?: number | null }).remaining_count || 0
            );
            const currentBalance = Number(
              (contractRow as { prepaid_balance?: number | null }).prepaid_balance || 0
            );
            const restorePrice = Number((usage as { unit_price?: number | null }).unit_price || 0);
            const beforeCount = Number(
              (usage as { before_count?: number | null }).before_count ?? NaN
            );

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

        if ((ticketUsageRows || []).length > 0) {
          const usageIds = (ticketUsageRows || [])
            .map((row) => toIdNumber((row as { id?: unknown }).id))
            .filter((id): id is number => id !== null);

          if (usageIds.length > 0) {
            const { error: deleteTicketUsageError } = await supabase
              .from("ticket_usages")
              .delete()
              .in("id", usageIds);

            if (deleteTicketUsageError) throw deleteTicketUsageError;
          }
        }

        if ((salesRows || []).length > 0) {
          const saleIds = (salesRows || [])
            .map((row) => toIdNumber((row as { id?: unknown }).id))
            .filter((id): id is number => id !== null);

          if (saleIds.length > 0) {
            const { error: deleteSalesError } = await supabase
              .from("sales")
              .delete()
              .in("id", saleIds);

            if (deleteSalesError) throw deleteSalesError;
          }
        }

        if ((counselingRows || []).length > 0) {
          const counselingIds = (counselingRows || [])
            .map((row) => toIdNumber((row as { id?: unknown }).id))
            .filter((id): id is number => id !== null);

          if (counselingIds.length > 0) {
            const { error: deleteCounselingError } = await supabase
              .from("counselings")
              .delete()
              .in("id", counselingIds);

            if (deleteCounselingError) throw deleteCounselingError;
          }
        }

        const { error: deleteReservationError } = await supabase
          .from("reservations")
          .delete()
          .eq("id", reservationId);

        if (deleteReservationError) throw deleteReservationError;

        setOpenedMemoReservationIds((prev) => prev.filter((id) => id !== String(item.id)));
        setOpenedActionReservationIds((prev) => prev.filter((id) => id !== String(item.id)));
        setSuccess("予約を削除しました。");

        await Promise.all([
          loadReservations(),
          loadReservationFlagsForVisible(),
          loadAttendance(),
          loadTicketContractsForVisibleCustomers(),
        ]);
      } catch (e) {
        console.error(e);
        setError(`予約削除エラー: ${extractErrorMessage(e)}`);
      } finally {
        setDeletingReservationId("");
      }
    }

    function toggleReservationMemo(reservationId: string | number) {
      const key = String(reservationId);
      setOpenedMemoReservationIds((prev) =>
        prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]
      );
    }

    function toggleReservationActions(reservationId: string | number) {
      const key = String(reservationId);
      setOpenedActionReservationIds((prev) =>
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
      const isTicket = isTicketMenu(item.menu);
      const reservationId = toIdNumber(item.id);
      const isSold =
        trimmed(item.reservation_status) === "売上済" ||
        (reservationId !== null && salesReservationIdSet.has(reservationId));

      if (isSold) {
        router.push(`/reservation/detail/${item.id}`);
        return;
      }

      if (isTicket) {
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
                <button type="button" onClick={goPrevMonth} style={styles.arrowBtn}>
                  ‹
                </button>
                <h1 style={styles.monthTitle}>{formatMonthTitle(currentMonth)}</h1>
                <button type="button" onClick={goNextMonth} style={styles.arrowBtn}>
                  ›
                </button>
              </div>

              <div style={styles.topRightBtns}>
                <button
                  type="button"
                  onClick={handleOpenCounselingPicker}
                  style={styles.counselingTopBtn}
                >
                  カウンセリング
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode("pending")}
                  style={{
                    ...styles.pendingFilterBtn,
                    ...(selectedFilterMode === "pending"
                      ? styles.pendingFilterBtnActive
                      : {}),
                  }}
                >
                  {selectedFilterMode === "pending" ? "未処理だけ表示中" : "未処理だけ"}
                </button>

                <button type="button" onClick={() => router.push("/dashboard")} style={styles.topBtn}>
                  TOPへ戻る
                </button>
              </div>
            </div>

            <div style={styles.summaryBar}>
              <button
                type="button"
                onClick={() => setFilterMode("pending")}
                style={getSummaryCardStyle("pending", {
                  background: "#fee2e2",
                })}
              >
                <span style={{ ...styles.summaryLabel, color: "#991b1b" }}>未処理</span>
                <span style={{ ...styles.summaryCountDanger }}>{pendingSummary.totalPending}件</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("sales_pending")}
                style={getSummaryCardStyle("sales_pending", {
                  background: "#fef3c7",
                })}
              >
                <span style={{ ...styles.summaryLabel, color: "#92400e" }}>売上未</span>
                <span style={{ ...styles.summaryCountDanger, color: "#b45309" }}>
                  {pendingSummary.salesPending}件
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("counseling_pending")}
                style={getSummaryCardStyle("counseling_pending", {
                  background: "#dbeafe",
                })}
              >
                <span style={{ ...styles.summaryLabel, color: "#1d4ed8" }}>
                  カウンセリング未
                </span>
                <span style={{ ...styles.summaryCountDanger, color: "#1d4ed8" }}>
                  {pendingSummary.counselingPending}件
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("ticket_pending")}
                style={getSummaryCardStyle("ticket_pending", {
                  background: "#ede9fe",
                })}
              >
                <span style={{ ...styles.summaryLabel, color: "#6d28d9" }}>
                  回数券未消化
                </span>
                <span style={{ ...styles.summaryCountDanger, color: "#6d28d9" }}>
                  {pendingSummary.ticketPending}件
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("all")}
                style={getSummaryCardStyle("all", {
                  background: "#dcfce7",
                })}
              >
                <span style={{ ...styles.summaryLabel, color: "#166534" }}>表示中</span>
                <span style={{ ...styles.summaryCount, color: "#166534" }}>
                  {pendingSummary.visibleCount}件
                </span>
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
                <button
                  type="button"
                  onClick={() => setSearchMode("customer")}
                  style={{
                    ...styles.searchModeBtn,
                    ...(searchMode === "customer" ? styles.searchModeBtnActive : {}),
                  }}
                >
                  お客さん検索
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode("staff")}
                  style={{
                    ...styles.searchModeBtn,
                    ...(searchMode === "staff" ? styles.searchModeBtnActive : {}),
                  }}
                >
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
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => void loadCustomerHistory(c)}
                      style={styles.searchResultItem}
                    >
                      <div style={styles.searchResultTitle}>{c.name || "名称なし"}</div>
                      <div style={styles.searchResultSub}>
                        {c.kana || "かな未設定"} / {c.phone || "電話未設定"}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {searchMode === "staff" && filteredStaffSearchResults.length > 0 ? (
                <div style={styles.searchResultList}>
                  {filteredStaffSearchResults.map((staff) => (
                    <button
                      key={staff}
                      type="button"
                      onClick={() => void loadStaffHistory(staff)}
                      style={styles.searchResultItem}
                    >
                      <div style={styles.searchResultTitle}>{staff}</div>
                      <div style={styles.searchResultSub}>担当履歴を見る</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div style={styles.filterRow}>
              {STORE_OPTIONS.map((store) => (
                <button
                  key={store}
                  type="button"
                  onClick={() => setSelectedStoreFilter(store)}
                  style={{
                    ...styles.storeChip,
                    ...(selectedStoreFilter === store ? styles.storeChipActive : {}),
                  }}
                >
                  {store}
                </button>
              ))}
            </div>

            <div style={styles.legendBox}>
              {["山口", "中西", "池田", "石川", "羽田", "菱谷", "井上", "林", "その他"].map(
                (name) => (
                  <div key={name} style={styles.legendItem}>
                    <span
                      style={{
                        ...styles.legendDot,
                        background: getStaffColor(name),
                      }}
                    />
                    {name}
                  </div>
                )
              )}
            </div>

            <div style={styles.legendBoxStore}>
              {["江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町", "江坂"].map((name) => (
                <div key={name} style={styles.legendItem}>
                  <span
                    style={{
                      ...styles.legendDot,
                      background: getStoreColor(name),
                    }}
                  />
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
                <div
                  key={label}
                  style={{
                    ...styles.weekLabel,
                    color:
                      index === 5 ? "#2563eb" : index === 6 ? "#ef4444" : "#94a3b8",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

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
                      <span
                        style={{
                          ...styles.dayNumber,
                          color:
                            dateObj.getDay() === 0
                              ? "#ef4444"
                              : dateObj.getDay() === 6
                              ? "#2563eb"
                              : "#0f172a",
                          ...(isToday ? styles.todayBadge : {}),
                        }}
                      >
                        {dateObj.getDate()}
                      </span>

                      {pendingCount > 0 ? (
                        <span style={styles.dayPendingBadge}>{pendingCount}</span>
                      ) : null}
                    </div>

                    <div style={styles.dayCount}>{items.length}件</div>

                    <div style={styles.dayMiniList}>
                      {items.slice(0, 3).map((item) => (
                        <div
                          key={String(item.id)}
                          style={{
                            ...styles.dayMiniCard,
                            borderLeft: `3px solid ${getStaffColor(item.staff_name)}`,
                          }}
                        >
                          <div style={styles.dayMiniTime}>{trimmed(item.start_time)}</div>
                          <div style={styles.dayMiniName}>{trimmed(item.customer_name)}</div>
                        </div>
                      ))}
                      {items.length > 3 ? (
                        <div style={styles.dayMore}>+{items.length - 3}</div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
                    {/* ===== Day Sheet ===== */}
          {daySheetOpen ? (
            <div style={styles.sheetOverlay} onClick={() => setDaySheetOpen(false)}>
              <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
                <div style={styles.sheetHandle} />

                <div style={styles.sheetHeader}>
                  <div>
                    <div style={styles.sheetSubTitle}>予約 / 出勤一覧</div>
                    <h2 style={styles.sheetTitle}>
                      {formatJapaneseDate(selectedDate)}
                    </h2>
                  </div>

                  <div style={styles.sheetHeaderBtns}>
                    <button
                      type="button"
                      onClick={() => openCreateModal(selectedDate)}
                      style={styles.sheetActionBtn}
                    >
                      ＋予約追加
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaySheetOpen(false)}
                      style={styles.sheetCloseBtn}
                    >
                      閉じる
                    </button>
                  </div>
                </div>

                {selectedDayTimeline.length === 0 ? (
                  <div style={styles.emptyDayBox}>この日の予定はありません。</div>
                ) : (
                  <div style={styles.timelineListCompact}>
                    {selectedDayTimeline.map((timelineItem) => {
                      // ===== 出勤 =====
                      if (timelineItem.type === "attendance") {
                        const item = timelineItem.attendance;

                        return (
                          <div
                            key={`attendance-${item.id}`}
                            style={{
                              ...styles.timelineCard,
                              borderLeft: `5px solid ${getStaffColor(item.staff_name)}`,
                            }}
                          >
                            <div style={styles.timelineRow}>
                              <div style={styles.timelineTimeBlock}>
                                <div style={styles.timelineTimeMain}>
                                  {trimmed(item.clock_in) || "--:--"}
                                </div>
                                <div style={styles.timelineTimeSub}>
                                  {trimmed(item.clock_out) || "--:--"}
                                </div>
                              </div>

                              <div style={styles.timelineContent}>
                                <div style={styles.timelineTitle}>
                                  {trimmed(item.staff_name) || "スタッフ未設定"}勤務
                                </div>
                                <div style={styles.timelineMetaText}>
                                  スタッフ出勤
                                </div>
                              </div>

                              <div
                                style={{
                                  ...styles.staffAvatar,
                                  background: getStaffColor(item.staff_name),
                                }}
                              >
                                {getStaffShortLabel(item.staff_name)}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // ===== 予約 =====
                      const item = timelineItem.reservation;

                      const ticketNumbering =
                        getTicketNumberingForReservation(item);

                      const ticketLabelStyle: CSSProperties = {
                        ...styles.ticketCountBadgeCompact,
                        ...(ticketNumbering?.tone === "warning"
                          ? styles.ticketCountBadgeWarningCompact
                          : {}),
                        ...(ticketNumbering?.tone === "danger"
                          ? styles.ticketCountBadgeDangerCompact
                          : {}),
                      };

                      const memoOpened = openedMemoReservationIds.includes(
                        String(item.id)
                      );
                      const actionOpened = openedActionReservationIds.includes(
                        String(item.id)
                      );

                      return (
                        <div
                          key={String(item.id)}
                          style={{
                            ...styles.timelineCardCompact,
                            borderLeft: `4px solid ${getStaffColor(
                              item.staff_name
                            )}`,
                          }}
                        >
                          <div style={styles.timelineRowCompact}>
                            <div style={styles.timelineContentCompact}>
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/reservation/detail/${item.id}`
                                  )
                                }
                                style={styles.timelineMainActionCompact}
                              >
                                <div style={styles.timelineTopLineCompact}>
                                  <div
                                    style={
                                      styles.timelineNameGroupCompact
                                    }
                                  >
                                    <span
                                      style={
                                        styles.timelineTitleCompact
                                      }
                                    >
                                      {item.customer_name ||
                                        "顧客名未設定"}
                                    </span>

                                    {ticketNumbering ? (
                                      <span style={ticketLabelStyle}>
                                        {ticketNumbering.label}
                                      </span>
                                    ) : null}
                                  </div>

                                  <span
                                    style={styles.timelineTimeInline}
                                  >
                                    {trimmed(item.start_time)} -{" "}
                                    {trimmed(item.end_time)}
                                  </span>
                                </div>

                                <div
                                  style={styles.timelineMetaTextCompact}
                                >
                                  {item.menu || "メニュー未設定"} /{" "}
                                  {item.store_name || "店舗未設定"} /{" "}
                                  {item.staff_name || "担当未設定"}
                                </div>
                              </button>

                              <div style={styles.cardActionBarSingle}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleReservationActions(item.id)
                                  }
                                  style={styles.actionToggleBtn}
                                >
                                  {actionOpened
                                    ? "操作を閉じる"
                                    : "操作を開く"}
                                </button>
                              </div>

                              {actionOpened ? (
                                <div style={styles.actionDrawer}>
                                  <div
                                    style={
                                      styles.cardActionRowCompact
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        router.push(
                                          `/reservation/detail/${item.id}`
                                        )
                                      }
                                      style={styles.actionBtnBlueCompact}
                                    >
                                      詳細
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteReservation(item)
                                      }
                                      style={
                                        styles.actionBtnDeleteCompact
                                      }
                                    >
                                      削除
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleReservationMemo(item.id)
                                      }
                                      style={styles.actionBtnMemoCompact}
                                    >
                                      {memoOpened
                                        ? "メモ閉じる"
                                        : "メモ"}
                                    </button>
                                  </div>

                                  {memoOpened && trimmed(item.memo) ? (
                                    <div
                                      style={styles.memoBoxCompact}
                                    >
                                      {trimmed(item.memo)}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>

                            <div
                              style={{
                                ...styles.staffAvatarCompact,
                                background: getStaffColor(
                                  item.staff_name
                                ),
                              }}
                            >
                              {getStaffShortLabel(item.staff_name)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* ===== Counseling Picker ===== */}
          {counselingPickerOpen ? (
            <div style={styles.modalOverlay}>
              <div style={styles.modal}>
                <h3>カウンセリング対象を選択</h3>

                {counselingCandidates.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleGoCounseling(item)}
                    style={styles.modalItem}
                  >
                    {item.customer_name}
                  </button>
                ))}

                <button
                  onClick={() => setCounselingPickerOpen(false)}
                  style={styles.modalClose}
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    );
  }
      fontSize: 13,
    color: "#0f172a",
    fontWeight: 800,
  },
  searchPanel: {
    background: "#fff",
    borderRadius: 18,
    padding: 12,
    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
    marginBottom: 10,
  },
  searchModeRow: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
  },
  searchModeBtn: {
    flex: 1,
    borderRadius: 12,
    padding: "10px 12px",
    border: "1px solid #dbe2ea",
    background: "#f8fafc",
    color: "#334155",
    fontSize: 13,
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
    height: 44,
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
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
  },
  dayCell: {
    minHeight: 92,
    border: "none",
    borderRight: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    background: "#fff",
    padding: 6,
    textAlign: "left",
    cursor: "pointer",
    verticalAlign: "top",
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
    marginBottom: 6,
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
  },
  dayCount: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 800,
    marginBottom: 4,
  },
  dayMiniList: {
    display: "grid",
    gap: 4,
  },
  dayMiniCard: {
    borderRadius: 8,
    padding: "4px 4px 4px 6px",
    background: "#f8fafc",
    overflow: "hidden",
  },
  dayMiniTime: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: 2,
  },
  dayMiniName: {
    fontSize: 10,
    color: "#0f172a",
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dayMore: {
    fontSize: 10,
    color: "#2563eb",
    fontWeight: 900,
    paddingLeft: 2,
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
    padding: "10px 12px 18px",
    boxSizing: "border-box",
    boxShadow: "0 -10px 30px rgba(15,23,42,0.18)",
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    background: "#cbd5e1",
    margin: "4px auto 12px",
  },
  sheetHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  sheetSubTitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 800,
    marginBottom: 4,
  },
  sheetTitle: {
    margin: 0,
    fontSize: 20,
    color: "#0f172a",
    fontWeight: 900,
    lineHeight: 1.3,
  },
  sheetHeaderBtns: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  sheetActionBtn: {
    border: "none",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    borderRadius: 999,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  sheetCloseBtn: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 999,
    padding: "10px 14px",
    fontSize: 12,
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
  timelineListCompact: {
    display: "grid",
    gap: 10,
  },
  timelineCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 12,
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
  },
  timelineCardCompact: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 12,
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
  },
  reserveCardPendingCompact: {
    background: "#fffaf5",
    border: "1px solid #fed7aa",
  },
  timelineRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  timelineRowCompact: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  timelineTimeBlock: {
    width: 64,
    flexShrink: 0,
  },
  timelineTimeMain: {
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.1,
  },
  timelineTimeSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
  },
  timelineContentCompact: {
    flex: 1,
    minWidth: 0,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 4,
  },
  timelineMetaText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
  timelineMainActionCompact: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    textAlign: "left",
    cursor: "pointer",
  },
  timelineTopLineCompact: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  timelineNameGroupCompact: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flexWrap: "wrap",
  },
  timelineTitleCompact: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.3,
  },
  timelineTimeInline: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  timelineMetaTextCompact: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.5,
  },
  timelineTimeCompact: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  timelineCardHeaderCompact: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  timelineMetaRowCompact: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
  ticketCountBadgeCompact: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    height: 22,
    padding: "0 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1,
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    whiteSpace: "nowrap",
  },
  ticketCountBadgeWarningCompact: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fdba74",
  },
  ticketCountBadgeDangerCompact: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #ef4444",
  },
  statusRowCompact: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 8,
  },
  pendingBadgeCompact: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22,
    padding: "0 8px",
    borderRadius: 999,
    background: "#fef3c7",
    color: "#92400e",
    fontSize: 11,
    fontWeight: 900,
  },
  doneBadgeCompact: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22,
    padding: "0 8px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 11,
    fontWeight: 900,
  },
  doneBadgeBlueCompact: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22,
    padding: "0 8px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: 900,
  },
  pendingBadgeYellowCompact: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22,
    padding: "0 8px",
    borderRadius: 999,
    background: "#fef3c7",
    color: "#b45309",
    fontSize: 11,
    fontWeight: 900,
  },
  pendingBadgePurpleCompact: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22,
    padding: "0 8px",
    borderRadius: 999,
    background: "#ede9fe",
    color: "#6d28d9",
    fontSize: 11,
    fontWeight: 900,
  },
  doneBadgePurpleCompact: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22,
    padding: "0 8px",
    borderRadius: 999,
    background: "#f3e8ff",
    color: "#7e22ce",
    fontSize: 11,
    fontWeight: 900,
  },
  cardActionBarSingle: {
    marginTop: 10,
  },
  actionToggleBtn: {
    width: "100%",
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  actionDrawer: {
    marginTop: 10,
    display: "grid",
    gap: 8,
  },
  cardActionRowCompact: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
  },
  timelineActionRowCompact: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  },
  timelinePrimaryBtnCompact: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  timelineGhostBtnCompact: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  timelineDoneBtnCompact: {
    background: "#ecfeff",
    color: "#155e75",
    border: "1px solid #a5f3fc",
  },
  timelineMoreBtnCompact: {
    border: "1px solid #dbe2ea",
    background: "#f8fafc",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  timelineActionMenuCompact: {
    marginTop: 10,
    display: "grid",
    gap: 8,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  timelineMenuBtnCompact: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  timelineDeleteBtnCompact: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  timelineMemoWrapCompact: {
    marginTop: 10,
    display: "grid",
    gap: 8,
  },
  memoToggleBtnCompact: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  timelineMemoCompact: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    lineHeight: 1.6,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  actionBtnDarkCompact: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  actionBtnBlueCompact: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  actionBtnOrangeCompact: {
    border: "none",
    background: "#f59e0b",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  actionBtnMemoCompact: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  actionBtnDeleteCompact: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  memoBoxCompact: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    lineHeight: 1.6,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  memoBox: {
    marginTop: 8,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    lineHeight: 1.6,
    color: "#334155",
    whiteSpace: "pre-wrap",
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
  staffAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 900,
    flexShrink: 0,
  },
  staffAvatarCompact: {
    width: 32,
    height: 32,
    borderRadius: 999,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 900,
    flexShrink: 0,
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
  counselingSelectCard: {
    width: "100%",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 14,
    padding: 12,
    textAlign: "left",
    cursor: "pointer",
  },
  counselingSelectTime: {
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    marginBottom: 4,
  },
  counselingSelectName: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 4,
  },
  counselingSelectSub: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    lineHeight: 1.5,
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
};