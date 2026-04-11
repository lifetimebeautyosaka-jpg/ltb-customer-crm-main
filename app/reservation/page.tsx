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

function getPendingPriority(params: {
  item: ReservationRow;
  salesReservationIdSet: Set<number>;
  counseledReservationIdSet: Set<number>;
  ticketUsedReservationIdSet: Set<number>;
}) {
  const { item, salesReservationIdSet, counseledReservationIdSet, ticketUsedReservationIdSet } = params;

  const reservationId = toIdNumber(item.id);
  if (reservationId === null) return 99;

  const soldByReservation = trimmed(item.reservation_status) === "売上済";
  const isSold = soldByReservation || salesReservationIdSet.has(reservationId);
  const isCounseled = counseledReservationIdSet.has(reservationId);
  const ticketMenu = isTicketMenu(item.menu);
  const isTicketUsed = ticketUsedReservationIdSet.has(reservationId);

  const salesPending = !isSold;
  const counselingPending = isNewVisit(item) && !isCounseled;
  const ticketPending = ticketMenu && !isTicketUsed;

  if (salesPending || counselingPending || ticketPending) return 0;
  return 1;
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
  const [showOnlyPending, setShowOnlyPending] = useState(false);
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
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted) return;
    void loadReservations();
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
    () => new Set(salesReservationIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))),
    [salesReservationIds]
  );

  const counseledReservationIdSet = useMemo(
    () => new Set(counseledReservationIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))),
    [counseledReservationIds]
  );

  const ticketUsedReservationIdSet = useMemo(
    () => new Set(ticketUsedReservationIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))),
    [ticketUsedReservationIds]
  );

  const visibleReservations = useMemo(() => {
    let list =
      selectedStoreFilter === "すべて"
        ? reservations
        : reservations.filter((item) => item.store_name === selectedStoreFilter);

    if (showOnlyPending) {
      list = list.filter((item) => {
        const reservationId = toIdNumber(item.id);
        if (reservationId === null) return false;

        const soldByReservation = trimmed(item.reservation_status) === "売上済";
        const isSold = soldByReservation || salesReservationIdSet.has(reservationId);
        const isCounseled = counseledReservationIdSet.has(reservationId);
        const ticketMenu = isTicketMenu(item.menu);
        const isTicketUsed = ticketUsedReservationIdSet.has(reservationId);

        const salesPending = !isSold;
        const counselingPending = isNewVisit(item) && !isCounseled;
        const ticketPending = ticketMenu && !isTicketUsed;

        return salesPending || counselingPending || ticketPending;
      });
    }

    return [...list].sort((a, b) => {
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
    reservations,
    selectedStoreFilter,
    showOnlyPending,
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

  useEffect(() => {
    void loadReservationFlags();
  }, [selectedDayReservations]);

  const counselingCandidates = useMemo(() => {
    return selectedDayReservations.filter(
      (item) =>
        isNewVisit(item) &&
        item.customer_id !== null &&
        item.customer_id !== undefined &&
        String(item.customer_id) !== ""
    );
  }, [selectedDayReservations]);

  async function loadReservationFlags() {
    if (!supabase) return;

    const reservationIds = selectedDayReservations
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
        supabase.from("counselings").select("reservation_id").in("reservation_id", reservationIds),
        supabase.from("ticket_usages").select("reservation_id").in("reservation_id", reservationIds),
      ]);

      if (salesError) throw salesError;
      if (counselingError) throw counselingError;
      if (ticketUsageError) throw ticketUsageError;

      setSalesReservationIds(
        ((salesData as Array<{ reservation_id?: number | null }>) || [])
          .map((row) => toIdNumber(row.reservation_id))
          .filter((id): id is number => id !== null)
      );

      setCounseledReservationIds(
        ((counselingData as Array<{ reservation_id?: number | null }>) || [])
          .map((row) => toIdNumber(row.reservation_id))
          .filter((id): id is number => id !== null)
      );

      setTicketUsedReservationIds(
        ((ticketUsageData as Array<{ reservation_id?: number | null }>) || [])
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
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function goNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
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
                onClick={() => setShowOnlyPending((prev) => !prev)}
                style={{
                  ...styles.pendingFilterBtn,
                  ...(showOnlyPending ? styles.pendingFilterBtnActive : {}),
                }}
              >
                {showOnlyPending ? "未処理だけ表示中" : "未処理だけ"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                style={styles.topBtn}
              >
                TOPへ戻る
              </button>
            </div>
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
            {["山口", "中西", "池田", "石川", "羽田", "菱谷", "井上", "林", "その他"].map((name) => (
              <div key={name} style={styles.legendItem}>
                <span
                  style={{
                    ...styles.legendDot,
                    background: getStaffColor(name),
                  }}
                />
                {name}
              </div>
            ))}
          </div>

          <div style={styles.legendBoxStore}>
            {["江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町"].map((name) => (
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

              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => openDay(ymd)}
                  style={{
                    ...styles.dayCell,
                    ...(isSelected ? styles.dayCellSelected : {}),
                    opacity: isCurrentMonth ? 1 : 0.4,
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
                  </div>

                  <div style={styles.eventListMini}>
                    {items.slice(0, 3).map((item) => (
                      <div
                        key={String(item.id)}
                        style={{
                          ...styles.eventMini,
                          borderLeft: `4px solid ${getStaffColor(item.staff_name)}`,
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
                            {trimmed(item.customer_name) || trimmed(item.staff_name) || "予定"}
                          </span>
                        </div>
                      </div>
                    ))}

                    {items.length > 3 ? (
                      <div style={styles.moreText}>+{items.length - 3}件</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={() => openCreateModal(selectedDate)}
          style={styles.fab}
        >
          ＋
        </button>

        {daySheetOpen ? (
          <div style={styles.sheetOverlay} onClick={() => setDaySheetOpen(false)}>
            <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div style={styles.sheetHandle} />

              <div style={styles.sheetHeader}>
                <div>
                  <div style={styles.sheetDate}>{formatJapaneseDate(selectedDate)}</div>
                  <div style={styles.sheetCount}>{selectedDayReservations.length}件</div>
                </div>

                <div style={styles.sheetHeaderBtns}>
                  <button
                    type="button"
                    onClick={() => setDaySheetOpen(false)}
                    style={styles.calendarBackBtn}
                  >
                    カレンダーへ
                  </button>

                  <button
                    type="button"
                    onClick={() => openCreateModal(selectedDate)}
                    style={styles.roundIconBtn}
                  >
                    ＋
                  </button>
                </div>
              </div>

              <div style={styles.sheetBody}>
                {loading ? (
                  <div style={styles.emptyText}>読み込み中...</div>
                ) : selectedDayReservations.length === 0 ? (
                  <div style={styles.emptyText}>この日の予定はまだありません。</div>
                ) : (
                  selectedDayReservations.map((item) => {
                    const reservationId = toIdNumber(item.id) ?? 0;
                    const newVisit = isNewVisit(item);
                    const soldByReservation = trimmed(item.reservation_status) === "売上済";
                    const isSold = soldByReservation || salesReservationIdSet.has(reservationId);
                    const isCounseled = counseledReservationIdSet.has(reservationId);
                    const isTicketUsed = ticketUsedReservationIdSet.has(reservationId);
                    const ticketMenu = isTicketMenu(item.menu);
                    const salesHref = buildSalesHref(item, false);
                    const ticketSalesHref = buildSalesHref(item, true);

                    return (
                      <div key={String(item.id)} style={styles.dayEventCardWrap}>
                        <button
                          type="button"
                          onClick={() => router.push(`/reservation/detail/${item.id}`)}
                          style={styles.dayEventRowCompact}
                        >
                          <div style={styles.timeColCompact}>
                            <div style={styles.timeMainCompact}>{trimmed(item.start_time) || "—"}</div>
                            <div style={styles.timeSubCompact}>{trimmed(item.end_time) || "—"}</div>
                          </div>

                          <div
                            style={{
                              ...styles.colorBarCompact,
                              background: getStaffColor(item.staff_name),
                            }}
                          />

                          <div style={styles.dayEventMainCompact}>
                            <div style={styles.dayEventTopLineCompact}>
                              <div style={styles.dayEventTitleCompact}>
                                {trimmed(item.customer_name) || "予定"}
                              </div>

                              <div style={styles.rightMiniBadges}>
                                <span
                                  style={{
                                    ...styles.storeColorDot,
                                    background: getStoreColor(item.store_name),
                                  }}
                                />
                                <div
                                  style={{
                                    ...styles.staffMiniBadgeCompact,
                                    borderColor: getStaffColor(item.staff_name),
                                    color: getStaffColor(item.staff_name),
                                  }}
                                >
                                  {trimmed(item.staff_name) || "その他"}
                                </div>
                              </div>
                            </div>

                            <div style={styles.dayEventBadgeRowCompact}>
                              <span
                                style={{
                                  ...styles.statusChipCompact,
                                  ...(newVisit ? styles.statusChipNew : styles.statusChipRepeat),
                                }}
                              >
                                {getVisitTypeLabel(item)}
                              </span>

                              <span
                                style={{
                                  ...styles.statusChipCompact,
                                  background: `${getStoreColor(item.store_name)}20`,
                                  color: getStoreColor(item.store_name),
                                }}
                              >
                                {trimmed(item.store_name) || "店舗未設定"}
                              </span>

                              {ticketMenu ? (
                                <span
                                  style={{
                                    ...styles.statusChipCompact,
                                    ...styles.statusChipTicketMenu,
                                  }}
                                >
                                  回数券予約
                                </span>
                              ) : null}

                              <span
                                style={{
                                  ...styles.statusChipCompact,
                                  ...(isSold ? styles.statusChipDone : styles.statusChipNotDoneRed),
                                }}
                              >
                                {isSold ? "売上済" : "売上未"}
                              </span>

                              <span
                                style={{
                                  ...styles.statusChipCompact,
                                  ...(isCounseled ? styles.statusChipDone : styles.statusChipNotDoneBlue),
                                }}
                              >
                                {isCounseled ? "カウンセリング済" : "カウンセリング未"}
                              </span>

                              {isTicketUsed ? (
                                <span style={{ ...styles.statusChipCompact, ...styles.statusChipDoneGreen }}>
                                  回数券消化済
                                </span>
                              ) : null}
                            </div>

                            <div style={styles.dayEventSubCompact}>
                              {trimmed(item.menu) || "—"}
                              {trimmed(item.payment_method)
                                ? ` / ${trimmed(item.payment_method)}`
                                : ""}
                            </div>

                            {trimmed(item.memo) ? (
                              <div style={styles.dayEventMemoCompact}>{trimmed(item.memo)}</div>
                            ) : null}
                          </div>
                        </button>

                        <div
                          style={{
                            ...styles.dayEventActionRowCompact,
                            gridTemplateColumns: ticketMenu
                              ? newVisit
                                ? "1fr 1fr 1fr"
                                : "1fr 1fr"
                              : newVisit
                              ? "1fr 1fr"
                              : "1fr",
                          }}
                        >
                          {isSold ? (
                            <div style={{ ...styles.dayEventSalesBtnCompact, ...styles.dayEventSalesBtnDone }}>
                              売上済
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => router.push(salesHref)}
                              style={styles.dayEventSalesBtnCompact}
                            >
                              売上登録
                            </button>
                          )}

                          {ticketMenu ? (
                            isTicketUsed ? (
                              <div
                                style={{
                                  ...styles.dayEventTicketBtnCompact,
                                  ...styles.dayEventTicketBtnDone,
                                }}
                              >
                                回数券消化済
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => router.push(ticketSalesHref)}
                                style={styles.dayEventTicketBtnCompact}
                              >
                                回数券消化
                              </button>
                            )
                          ) : null}

                          {newVisit ? (
                            <button
                              type="button"
                              onClick={() => handleGoCounseling(item)}
                              style={
                                isCounseled
                                  ? {
                                      ...styles.dayEventCounselingBtnCompact,
                                      ...styles.dayEventCounselingBtnDone,
                                    }
                                  : styles.dayEventCounselingBtnCompact
                              }
                            >
                              {isCounseled ? "カウンセリング済" : "カウンセリング"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : null}

        {formOpen ? (
          <div style={styles.sheetOverlay} onClick={() => setFormOpen(false)}>
            <div style={styles.formModal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.sheetHandle} />

              <div style={styles.formHeader}>
                <div style={styles.formTitle}>新規予約</div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  style={styles.closeBtn}
                >
                  ×
                </button>
              </div>

              <div style={styles.formBody}>
                <label style={styles.field}>
                  <span style={styles.label}>顧客検索</span>
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="氏名・かな・電話で検索"
                    style={styles.input}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>既存顧客を選択</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">選択しない（新規/手入力）</option>
                    {filteredCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.phone ? ` / ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={styles.formGrid2}>
                  <label style={styles.field}>
                    <span style={styles.label}>顧客名</span>
                    <input
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setSelectedCustomerId("");
                      }}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>かな</span>
                    <input
                      value={customerKana}
                      onChange={(e) => {
                        setCustomerKana(e.target.value);
                        setSelectedCustomerId("");
                      }}
                      style={styles.input}
                    />
                  </label>
                </div>

                <label style={styles.field}>
                  <span style={styles.label}>電話番号</span>
                  <input
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setSelectedCustomerId("");
                    }}
                    style={styles.input}
                  />
                </label>

                <div style={styles.formGrid2}>
                  <label style={styles.field}>
                    <span style={styles.label}>日付</span>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>店舗</span>
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
                  </label>
                </div>

                <div style={styles.formGrid2}>
                  <label style={styles.field}>
                    <span style={styles.label}>開始時間</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleChangeStartTime(e.target.value)}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>終了時間</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        setEndTimeTouched(true);
                      }}
                      style={styles.input}
                    />
                  </label>
                </div>

                <div style={styles.autoHelp}>
                  開始時間を入れると、終了時間は1時間後が自動セットされます。あとで手動調整OK
                </div>

                <div style={styles.formGrid2}>
                  <label style={styles.field}>
                    <span style={styles.label}>担当スタッフ</span>
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
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>メニュー</span>
                    <select
                      value={menu}
                      onChange={(e) => setMenu(e.target.value)}
                      style={styles.input}
                    >
                      {MENU_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label style={styles.field}>
                  <span style={styles.label}>来店区分</span>
                  <div style={styles.visitTypeRow}>
                    {VISIT_TYPE_OPTIONS.map((item) => {
                      const active = visitType === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setVisitType(item)}
                          style={{
                            ...styles.visitTypeBtn,
                            ...(active ? styles.visitTypeBtnActive : {}),
                            background: active ? (item === "新規" ? "#2563eb" : "#4b5563") : "#fff",
                          }}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>支払方法</span>
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
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>メモ</span>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    style={styles.textarea}
                    placeholder="備考・領収・回数券メモなど"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSaveReservation}
                  disabled={saving}
                  style={{
                    ...styles.saveBtn,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "保存中..." : "予約を保存"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {counselingPickerOpen ? (
          <div
            style={styles.sheetOverlay}
            onClick={() => setCounselingPickerOpen(false)}
          >
            <div
              style={styles.counselingPickerModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.sheetHandle} />

              <div style={styles.formHeader}>
                <div style={styles.formTitle}>カウンセリング対象を選択</div>
                <button
                  type="button"
                  onClick={() => setCounselingPickerOpen(false)}
                  style={styles.closeBtn}
                >
                  ×
                </button>
              </div>

              <div style={styles.counselingPickerBody}>
                <div style={styles.counselingPickerHelp}>
                  {formatJapaneseDate(selectedDate)} の新規予約から選んでください
                </div>

                {counselingCandidates.length === 0 ? (
                  <div style={styles.emptyText}>対象の新規・顧客付き予約がありません。</div>
                ) : (
                  <div style={styles.counselingCandidateList}>
                    {counselingCandidates.map((item) => (
                      <button
                        key={String(item.id)}
                        type="button"
                        onClick={() => handleGoCounseling(item)}
                        style={styles.counselingCandidateButton}
                      >
                        <div style={styles.counselingCandidateTop}>
                          <div style={styles.counselingCandidateName}>
                            {trimmed(item.customer_name) || "顧客名未設定"}
                          </div>
                          <div
                            style={{
                              ...styles.staffMiniBadge,
                              borderColor: getStaffColor(item.staff_name),
                              color: getStaffColor(item.staff_name),
                            }}
                          >
                            {trimmed(item.staff_name) || "その他"}
                          </div>
                        </div>

                        <div style={styles.counselingCandidateSub}>
                          {trimmed(item.start_time) || "—"}〜{trimmed(item.end_time) || "—"} /{" "}
                          {trimmed(item.menu) || "—"}
                        </div>

                        <div style={styles.counselingCandidateSub}>
                          店舗 {trimmed(item.store_name) || "—"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
    background: "#f3f4f6",
    padding: "0",
  },
  mobileWrap: {
    maxWidth: 430,
    margin: "0 auto",
    minHeight: "100vh",
    background: "#f3f4f6",
    position: "relative",
    paddingBottom: 90,
  },
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(243,244,246,0.95)",
    backdropFilter: "blur(12px)",
    padding: "14px 10px 8px",
  },
  topHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  monthRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  monthTitle: {
    margin: 0,
    fontSize: 21,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  },
  arrowBtn: {
    border: "none",
    background: "#ffffff",
    width: 36,
    height: 36,
    borderRadius: 999,
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    cursor: "pointer",
    flexShrink: 0,
  },
  topRightBtns: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    flexShrink: 0,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  counselingTopBtn: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 10,
    padding: "9px 10px",
    fontSize: 11,
    fontWeight: 800,
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  pendingFilterBtn: {
    border: "none",
    background: "#fff",
    color: "#111827",
    borderRadius: 10,
    padding: "9px 10px",
    fontSize: 11,
    fontWeight: 800,
    boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  pendingFilterBtnActive: {
    background: "#ef4444",
    color: "#fff",
  },
  topBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 10,
    padding: "9px 10px",
    fontSize: 11,
    fontWeight: 800,
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  filterRow: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 6,
  },
  storeChip: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    borderRadius: 14,
    padding: "7px 10px",
    whiteSpace: "nowrap",
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
  },
  storeChipActive: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
  },
  legendBox: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 2,
    marginBottom: 4,
  },
  legendBoxStore: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 2,
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 7px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #e5e7eb",
    fontSize: 10,
    fontWeight: 700,
    color: "#374151",
    whiteSpace: "nowrap",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    display: "inline-block",
    flexShrink: 0,
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
    background: "rgba(15,23,42,0.28)",
    zIndex: 50,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: "8px 0 10px",
    maxHeight: "88vh",
    overflow: "hidden",
  },
  formModal: {
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: "10px 0 20px",
    maxHeight: "90vh",
    overflow: "hidden",
  },
  counselingPickerModal: {
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: "10px 0 20px",
    maxHeight: "88vh",
    overflow: "hidden",
  },
  sheetHandle: {
    width: 56,
    height: 6,
    borderRadius: 999,
    background: "#d1d5db",
    margin: "0 auto 8px",
  },
  sheetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10px 6px",
  },
  calendarBackBtn: {
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  sheetDate: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.2,
  },
  sheetCount: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: 700,
    color: "#6b7280",
  },
  sheetHeaderBtns: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  roundIconBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    width: 36,
    height: 36,
    borderRadius: 999,
    fontSize: 20,
    fontWeight: 700,
    cursor: "pointer",
  },
  sheetBody: {
    overflowY: "auto",
    maxHeight: "calc(88vh - 78px)",
    padding: "0 8px 2px",
    display: "grid",
    gap: 6,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 700,
    padding: "22px 10px",
  },
  dayEventCardWrap: {
    display: "grid",
    gap: 4,
  },
  dayEventRowCompact: {
    width: "100%",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 12,
    padding: "7px 8px",
    display: "grid",
    gridTemplateColumns: "42px 5px minmax(0,1fr)",
    gap: 7,
    alignItems: "start",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(0,0,0,0.04)",
  },
  timeColCompact: {
    textAlign: "center",
    paddingTop: 1,
  },
  timeMainCompact: {
    fontSize: 12,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.05,
  },
  timeSubCompact: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: 700,
    color: "#6b7280",
    lineHeight: 1.1,
  },
  colorBarCompact: {
    width: 5,
    borderRadius: 999,
    alignSelf: "stretch",
    minHeight: 42,
  },
  dayEventMainCompact: {
    minWidth: 0,
  },
  dayEventTopLineCompact: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 2,
  },
  dayEventTitleCompact: {
    fontSize: 12,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
    flex: 1,
  },
  rightMiniBadges: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  storeColorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
    flexShrink: 0,
  },
  dayEventBadgeRowCompact: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
  },
  statusChipCompact: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "2px 7px",
    fontSize: 9,
    fontWeight: 800,
    lineHeight: 1,
  },
  statusChipNew: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  statusChipRepeat: {
    background: "#f3f4f6",
    color: "#4b5563",
  },
  statusChipDone: {
    background: "#e5e7eb",
    color: "#374151",
  },
  statusChipDoneGreen: {
    background: "rgba(22,163,74,0.12)",
    color: "#15803d",
  },
  statusChipTicketMenu: {
    background: "rgba(22,163,74,0.10)",
    color: "#166534",
  },
  statusChipNotDoneRed: {
    background: "rgba(239,68,68,0.12)",
    color: "#b91c1c",
  },
  statusChipNotDoneBlue: {
    background: "rgba(37,99,235,0.12)",
    color: "#1d4ed8",
  },
  staffMiniBadgeCompact: {
    flexShrink: 0,
    fontSize: 9,
    fontWeight: 800,
    border: "1px solid",
    borderRadius: 999,
    padding: "2px 5px",
    background: "#fff",
    lineHeight: 1.05,
  },
  dayEventSubCompact: {
    fontSize: 10,
    fontWeight: 700,
    color: "#374151",
    lineHeight: 1.25,
  },
  dayEventMemoCompact: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 1.3,
    color: "#6b7280",
    background: "#f8fafc",
    borderRadius: 7,
    padding: "4px 5px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
  },
  dayEventActionRowCompact: {
    display: "grid",
    gap: 4,
  },
  dayEventSalesBtnCompact: {
    width: "100%",
    height: 32,
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
  },
  dayEventSalesBtnDone: {
    background: "#9ca3af",
  },
  dayEventTicketBtnCompact: {
    width: "100%",
    height: 32,
    borderRadius: 10,
    border: "none",
    background: "#15803d",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
  },
  dayEventTicketBtnDone: {
    background: "#9ca3af",
  },
  dayEventCounselingBtnCompact: {
    width: "100%",
    height: 32,
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
  },
  dayEventCounselingBtnDone: {
    background: "#9ca3af",
  },
  staffMiniBadge: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 800,
    border: "1px solid",
    borderRadius: 999,
    padding: "2px 6px",
    background: "#fff",
    lineHeight: 1.1,
  },
  formHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px 12px",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "#111827",
  },
  closeBtn: {
    border: "none",
    background: "#f3f4f6",
    color: "#111827",
    width: 36,
    height: 36,
    borderRadius: 999,
    fontSize: 20,
    fontWeight: 700,
    cursor: "pointer",
  },
  formBody: {
    overflowY: "auto",
    maxHeight: "calc(90vh - 68px)",
    padding: "0 18px 10px",
    display: "grid",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 800,
    color: "#374151",
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "12px 14px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
    resize: "vertical",
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  autoHelp: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#6b7280",
    background: "#f8fafc",
    borderRadius: 12,
    padding: "10px 12px",
  },
  visitTypeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  visitTypeBtn: {
    height: 44,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    color: "#111827",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  visitTypeBtnActive: {
    border: "1px solid transparent",
    color: "#fff",
  },
  saveBtn: {
    height: 48,
    border: "none",
    borderRadius: 14,
    background: "#111827",
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    marginTop: 4,
  },
  counselingPickerBody: {
    overflowY: "auto",
    maxHeight: "calc(88vh - 68px)",
    padding: "0 18px 10px",
    display: "grid",
    gap: 12,
  },
  counselingPickerHelp: {
    fontSize: 12,
    lineHeight: 1.6,
    color: "#64748b",
    fontWeight: 700,
    background: "#f8fafc",
    borderRadius: 12,
    padding: "10px 12px",
  },
  counselingCandidateList: {
    display: "grid",
    gap: 10,
  },
  counselingCandidateButton: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 16,
    padding: "12px 12px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  },
  counselingCandidateTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  counselingCandidateName: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.3,
  },
  counselingCandidateSub: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.6,
    fontWeight: 700,
  },
  errorBox: {
    margin: "8px 12px 0",
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.5,
  },
  successBox: {
    margin: "8px 12px 0",
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.5,
  },
};