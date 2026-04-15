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
};

type CustomerOption = {
  id: string;
  name: string;
  kana: string;
  phone: string;
};

type SimpleReservationIdRow = {
  reservation_id?: number | string | null;
};

type FilterMode =
  | "all"
  | "pending"
  | "sales_pending"
  | "counseling_pending"
  | "ticket_pending";

const STORE_OPTIONS = [
  "すべて",
  "江戸堀",
  "箕面",
  "福島",
  "福島P",
  "天満橋",
  "中崎町",
];

const STORE_OPTIONS_FOR_FORM = [
  "江戸堀",
  "箕面",
  "福島",
  "福島P",
  "天満橋",
  "中崎町",
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
  "ストレッチ回数券",
  "トレーニング回数券",
  "ペアトレ",
  "ヘッドスパ",
  "アロマ",
  "その他",
];

const PAYMENT_OPTIONS = ["現金", "カード", "銀行振込", "その他"];
const VISIT_TYPE_OPTIONS = ["新規", "再来"];
const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

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

function toIdNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function isTicketMenu(menu?: string | null) {
  const text = trimmed(menu);
  return text === "ストレッチ回数券" || text === "トレーニング回数券";
}

function detectServiceTypeFromReservationMenu(menu?: string | null) {
  const text = trimmed(menu);
  if (text.includes("ストレッチ")) return "ストレッチ";
  return "トレーニング";
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

    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted) return;
    void loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, mounted]);

  async function loadAll() {
    await Promise.all([loadCustomers(), loadReservations()]);
  }

  async function loadCustomers() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, kana, phone")
        .order("id", { ascending: false })
        .limit(400);

      if (error) throw error;

      const normalized = ((data as CustomerRow[]) || []).map((row) => ({
        id: String(row.id),
        name: row.name || "",
        kana: row.kana || "",
        phone: row.phone || "",
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

  const salesReservationIdSet = useMemo(
    () =>
      new Set(
        salesReservationIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id))
      ),
    [salesReservationIds]
  );

  const counseledReservationIdSet = useMemo(
    () =>
      new Set(
        counseledReservationIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id))
      ),
    [counseledReservationIds]
  );

  const ticketUsedReservationIdSet = useMemo(
    () =>
      new Set(
        ticketUsedReservationIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id))
      ),
    [ticketUsedReservationIds]
  );

  const baseVisibleReservations = useMemo(() => {
    const list =
      selectedStoreFilter === "すべて"
        ? reservations
        : reservations.filter((item) => item.store_name === selectedStoreFilter);

    return [...list];
  }, [reservations, selectedStoreFilter]);

  useEffect(() => {
    if (!mounted) return;
    void loadReservationFlagsForVisible();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, baseVisibleReservations]);

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
        .select("id, name, kana, phone")
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
      .select("id, name, kana, phone")
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
      await Promise.all([loadCustomers(), loadReservations()]);
    } catch (e) {
      console.error(e);
      setError(`予約保存エラー: ${extractErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
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

  if (!mounted) return null;

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

              <button type="button" onClick={() => router.push("/")} style={styles.topBtn}>
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

                  <div style={styles.eventListMini}>
                    {items.slice(0, 3).map((item) => {
                      const flags = getPendingFlags({
                        item,
                        salesReservationIdSet,
                        counseledReservationIdSet,
                        ticketUsedReservationIdSet,
                      });

                      return (
                        <div
                          key={String(item.id)}
                          style={{
                            ...styles.eventMini,
                            borderLeft: `4px solid ${getStaffColor(item.staff_name)}`,
                            ...(flags.isPending ? styles.eventMiniPending : {}),
                          }}
                        >
                          <div style={styles.eventMiniLine}>
                            <span
                              style={{
                                ...styles.eventMiniStoreDot,
                                background: getStoreColor(item.store_name),
                              }}
                            />
                            <span style={styles.eventMiniText}>
                              {trimmed(item.start_time) || "--:--"} {trimmed(item.customer_name) || "顧客名未設定"}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {items.length > 3 ? (
                      <div style={styles.moreText}>+{items.length - 3}件</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <button type="button" onClick={() => openCreateModal()} style={styles.fab}>
          ＋
        </button>

        {daySheetOpen ? (
          <div style={styles.sheetOverlay} onClick={() => setDaySheetOpen(false)}>
            <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div style={styles.sheetHandle} />

              <div style={styles.sheetHeader}>
                <div>
                  <div style={styles.sheetSubTitle}>予約一覧</div>
                  <h2 style={styles.sheetTitle}>{formatJapaneseDate(selectedDate)}</h2>
                </div>

                <div style={styles.sheetHeaderBtns}>
                  <button
                    type="button"
                    onClick={() => openCreateModal(selectedDate)}
                    style={styles.sheetActionBtnPrimary}
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

              {selectedDayReservations.length === 0 ? (
                <div style={styles.emptyBox}>この日の予約はありません。</div>
              ) : (
                <div style={styles.cardList}>
                  {selectedDayReservations.map((item) => {
                    const flags = getPendingFlags({
                      item,
                      salesReservationIdSet,
                      counseledReservationIdSet,
                      ticketUsedReservationIdSet,
                    });

                    const isTicket = isTicketMenu(item.menu);
                    const isSold =
                      trimmed(item.reservation_status) === "売上済" ||
                      salesReservationIdSet.has(Number(item.id));
                    const isCounseled = counseledReservationIdSet.has(Number(item.id));
                    const isTicketUsed = ticketUsedReservationIdSet.has(Number(item.id));

                    return (
                      <div
                        key={String(item.id)}
                        style={{
                          ...styles.reserveCard,
                          ...(flags.isPending ? styles.reserveCardPending : {}),
                        }}
                      >
                        <div style={styles.reserveCardHead}>
                          <div style={styles.reserveTime}>
                            {trimmed(item.start_time) || "--:--"}
                            {trimmed(item.end_time) ? ` 〜 ${trimmed(item.end_time)}` : ""}
                          </div>

                          <div style={styles.reserveRightBadges}>
                            <span
                              style={{
                                ...styles.badge,
                                background: getStoreColor(item.store_name),
                              }}
                            >
                              {trimmed(item.store_name) || "店舗未設定"}
                            </span>
                            <span
                              style={{
                                ...styles.badge,
                                background: getStaffColor(item.staff_name),
                              }}
                            >
                              {trimmed(item.staff_name) || "スタッフ未設定"}
                            </span>
                          </div>
                        </div>

                        <div style={styles.reserveNameRow}>
                          <div style={styles.reserveCustomerName}>
                            {trimmed(item.customer_name) || "顧客名未設定"}
                          </div>

                          {isNewVisit(item) ? (
                            <span style={styles.newBadge}>新規</span>
                          ) : (
                            <span style={styles.repeatBadge}>再来</span>
                          )}
                        </div>

                        <div style={styles.reserveMeta}>
                          <span>メニュー: {trimmed(item.menu) || "—"}</span>
                          <span>支払: {trimmed(item.payment_method) || "—"}</span>
                        </div>

                        <div style={styles.statusRow}>
                          <span style={isSold ? styles.doneBadge : styles.pendingBadge}>
                            {isSold ? "売上済" : "売上未"}
                          </span>

                          {isNewVisit(item) ? (
                            <span
                              style={
                                isCounseled ? styles.doneBadgeBlue : styles.pendingBadgeYellow
                              }
                            >
                              {isCounseled ? "カウンセリング済" : "カウンセリング未"}
                            </span>
                          ) : null}

                          {isTicket ? (
                            <>
                              <span style={styles.ticketBadge}>回数券予約</span>
                              <span
                                style={
                                  isTicketUsed
                                    ? styles.doneBadgePurple
                                    : styles.pendingBadgePurple
                                }
                              >
                                {isTicketUsed ? "回数券消化済" : "回数券未消化"}
                              </span>
                            </>
                          ) : null}
                        </div>

                        {trimmed(item.memo) ? (
                          <div style={styles.memoBox}>{trimmed(item.memo)}</div>
                        ) : null}

                        <div style={styles.actionRow}>
                          <button
                            type="button"
                            onClick={() => router.push(`/reservation/detail/${item.id}`)}
                            style={styles.actionBtnDark}
                          >
                            詳細
                          </button>

                          {!isSold ? (
                            <button
                              type="button"
                              onClick={() => router.push(buildSalesHref(item))}
                              style={styles.actionBtnBlue}
                            >
                              {isTicket ? "回数券消化" : "売上登録"}
                            </button>
                          ) : null}

                          {isNewVisit(item) && !isCounseled ? (
                            <button
                              type="button"
                              onClick={() => handleGoCounseling(item)}
                              style={styles.actionBtnOrange}
                            >
                              カウンセリング
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {formOpen ? (
          <div style={styles.modalOverlay} onClick={() => setFormOpen(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>新規予約</h3>
                <button type="button" onClick={() => setFormOpen(false)} style={styles.modalCloseBtn}>
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
                    <div style={styles.customerSearchList}>
                      {filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c.id)}
                          style={styles.customerSearchItem}
                        >
                          <div style={styles.customerSearchName}>{c.name || "名称なし"}</div>
                          <div style={styles.customerSearchSub}>
                            {c.kana || "かな未設定"} / {c.phone || "電話未設定"}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label style={styles.label}>顧客名</label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>かな</label>
                  <input
                    value={customerKana}
                    onChange={(e) => setCustomerKana(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>電話</label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
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
                      setEndTimeTouched(true);
                      setEndTime(e.target.value);
                    }}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>店舗</label>
                  <select
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    style={styles.input}
                  >
                    {STORE_OPTIONS_FOR_FORM.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>担当スタッフ</label>
                  <select
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    style={styles.input}
                  >
                    {STAFF_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>メニュー</label>
                  <select value={menu} onChange={(e) => setMenu(e.target.value)} style={styles.input}>
                    {MENU_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
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
                    {PAYMENT_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>来店区分</label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value)}
                    style={styles.input}
                  >
                    {VISIT_TYPE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formBlockFull}>
                  <label style={styles.label}>メモ</label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    style={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setFormOpen(false)} style={styles.cancelBtn}>
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveReservation()}
                  style={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? "保存中..." : "保存する"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {counselingPickerOpen ? (
          <div style={styles.modalOverlay} onClick={() => setCounselingPickerOpen(false)}>
            <div style={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>カウンセリング対象を選択</h3>
                <button
                  type="button"
                  onClick={() => setCounselingPickerOpen(false)}
                  style={styles.modalCloseBtn}
                >
                  ×
                </button>
              </div>

              {counselingCandidates.length === 0 ? (
                <div style={styles.emptyBox}>対象がありません。</div>
              ) : (
                <div style={styles.cardList}>
                  {counselingCandidates.map((item) => (
                    <button
                      key={String(item.id)}
                      type="button"
                      onClick={() => handleGoCounseling(item)}
                      style={styles.counselingSelectCard}
                    >
                      <div style={styles.counselingSelectTime}>
                        {trimmed(item.start_time) || "--:--"}
                        {trimmed(item.end_time) ? ` 〜 ${trimmed(item.end_time)}` : ""}
                      </div>
                      <div style={styles.counselingSelectName}>
                        {trimmed(item.customer_name) || "顧客名未設定"}
                      </div>
                      <div style={styles.counselingSelectSub}>
                        {trimmed(item.menu) || "メニュー未設定"} / {trimmed(item.staff_name) || "担当未設定"}
                      </div>
                    </button>
                  ))}
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
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    padding: "0 0 100px",
  },
  mobileWrap: {
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
    minHeight: "100vh",
    position: "relative",
  },
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    padding: "14px 12px 12px",
    background: "rgba(248,250,252,0.92)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(226,232,240,0.9)",
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
  },
  monthTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
    color: "#0f172a",
    textAlign: "center",
    flex: 1,
  },
  arrowBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#111827",
    fontSize: 24,
    cursor: "pointer",
    flexShrink: 0,
  },
  topRightBtns: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  topBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  counselingTopBtn: {
    border: "none",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  pendingFilterBtn: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#111827",
    padding: "10px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  pendingFilterBtnActive: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  summaryBar: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 8,
  },
  summaryPill: {
    border: "none",
    borderRadius: 16,
    padding: "10px 12px",
    minWidth: 96,
    display: "grid",
    gap: 4,
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    flexShrink: 0,
    cursor: "pointer",
    textAlign: "left",
  },
  summaryPillSelected: {
    outline: "2px solid #111827",
    transform: "translateY(-1px)",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
  },
  summaryCount: {
    fontSize: 18,
    color: "#0f172a",
    fontWeight: 900,
  },
  summaryCountDanger: {
    fontSize: 18,
    color: "#dc2626",
    fontWeight: 900,
  },
  activeFilterBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  activeFilterLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 800,
  },
  activeFilterValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: 900,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "6px 10px",
  },
  filterRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 10,
  },
  storeChip: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    borderRadius: 999,
    padding: "9px 12px",
    fontWeight: 800,
    fontSize: 12,
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
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 8,
  },
  legendBoxStore: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 2,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: "#475569",
    fontWeight: 700,
    flexShrink: 0,
    background: "#fff",
    borderRadius: 999,
    padding: "6px 10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    flexShrink: 0,
  },
  errorBox: {
    margin: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 13,
  },
  successBox: {
    margin: "12px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 13,
  },
  calendarCard: {
    padding: "6px 8px 18px",
  },
  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 5,
    marginBottom: 7,
    padding: "0 3px",
  },
  weekLabel: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: 11,
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 5,
  },
  dayCell: {
    border: "none",
    background: "#ffffff",
    borderRadius: 16,
    minHeight: 100,
    padding: "7px 5px",
    textAlign: "left",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 5,
    cursor: "pointer",
  },
  dayCellSelected: {
    outline: "2px solid #111827",
  },
  dayCellPending: {
    boxShadow: "0 10px 24px rgba(239,68,68,0.10)",
  },
  dayHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 900,
    minWidth: 24,
    textAlign: "center",
  },
  todayBadge: {
    background: "#111827",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 8px",
  },
  dayPendingBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    background: "#ef4444",
    color: "#fff",
    fontSize: 10,
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
  },
  eventListMini: {
    display: "grid",
    gap: 4,
  },
  eventMini: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "3px 4px 3px 6px",
    overflow: "hidden",
  },
  eventMiniPending: {
    background: "#fff1f2",
  },
  eventMiniLine: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  eventMiniStoreDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    flexShrink: 0,
  },
  eventMiniText: {
    display: "block",
    fontSize: 9,
    fontWeight: 700,
    color: "#334155",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
  },
  moreText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#64748b",
    paddingLeft: 2,
  },
  fab: {
    position: "fixed",
    right: "max(calc(50% - 200px), 18px)",
    bottom: 22,
    width: 60,
    height: 60,
    borderRadius: 999,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontSize: 32,
    boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
    zIndex: 40,
    cursor: "pointer",
  },
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.35)",
    zIndex: 50,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "86vh",
    background: "#f8fafc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "auto",
    padding: "8px 12px 24px",
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    background: "#cbd5e1",
    margin: "6px auto 14px",
  },
  sheetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  sheetSubTitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
    marginBottom: 4,
  },
  sheetTitle: {
    margin: 0,
    fontSize: 22,
    color: "#0f172a",
    fontWeight: 900,
  },
  sheetHeaderBtns: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  sheetActionBtnPrimary: {
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  },
  sheetCloseBtn: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  },
  emptyBox: {
    background: "#fff",
    borderRadius: 16,
    padding: "18px 14px",
    color: "#64748b",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center",
  },
  cardList: {
    display: "grid",
    gap: 10,
  },
  reserveCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  reserveCardPending: {
    border: "2px solid #ef4444",
    boxShadow: "0 10px 24px rgba(239,68,68,0.12)",
  },
  reserveCardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  reserveTime: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
  },
  reserveRightBadges: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  badge: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    padding: "5px 8px",
    borderRadius: 999,
  },
  reserveNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  reserveCustomerName: {
    fontSize: 18,
    fontWeight: 900,
    color: "#111827",
  },
  newBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  repeatBadge: {
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  reserveMeta: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    color: "#475569",
    fontWeight: 700,
    fontSize: 12,
    marginBottom: 10,
  },
  statusRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  pendingBadge: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  doneBadge: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  doneBadgeBlue: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  pendingBadgeYellow: {
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  ticketBadge: {
    background: "#ede9fe",
    color: "#6d28d9",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  doneBadgePurple: {
    background: "#e9d5ff",
    color: "#6d28d9",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  pendingBadgePurple: {
    background: "#f3e8ff",
    color: "#7c3aed",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 800,
  },
  memoBox: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: "10px 12px",
    color: "#475569",
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 10,
    whiteSpace: "pre-wrap",
  },
  actionRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  actionBtnDark: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  actionBtnBlue: {
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  actionBtnOrange: {
    border: "none",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.35)",
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "88vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 22,
    padding: 16,
    boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
  },
  modalSmall: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 22,
    padding: 16,
    boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#111827",
    fontSize: 20,
    cursor: "pointer",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  formBlockFull: {
    gridColumn: "1 / -1",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "11px 12px",
    fontSize: 14,
    background: "#fff",
    color: "#0f172a",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "11px 12px",
    fontSize: 14,
    background: "#fff",
    color: "#0f172a",
    resize: "vertical",
  },
  customerSearchList: {
    display: "grid",
    gap: 8,
    marginTop: 8,
    maxHeight: 220,
    overflowY: "auto",
    paddingRight: 2,
  },
  customerSearchItem: {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 12,
    padding: "10px 12px",
    textAlign: "left",
    cursor: "pointer",
  },
  customerSearchName: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 4,
  },
  customerSearchSub: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "11px 14px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  saveBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "11px 14px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  counselingSelectCard: {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    textAlign: "left",
    cursor: "pointer",
  },
  counselingSelectTime: {
    fontSize: 13,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 6,
  },
  counselingSelectName: {
    fontSize: 17,
    fontWeight: 900,
    color: "#111827",
    marginBottom: 6,
  },
  counselingSelectSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
};