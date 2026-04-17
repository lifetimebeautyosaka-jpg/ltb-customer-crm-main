"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type ReservationItem = {
  id: string;
  date: string;
  start_time: string;
  customer_name: string;
  menu?: string;
  staff_name?: string;
  store_name?: string;
  customer_id?: string;
};

type DisplayReservation = {
  id: string;
  time: string;
  name: string;
  menu: string;
  staff: string;
  store: string;
  customerId?: string;
  date?: string;
};

type SystemStatus = "ONLINE" | "FALLBACK" | "OFFLINE";

type CustomerLite = {
  id: string;
  name: string;
  plan_type?: string | null;
};

const quickLinks = [
  { title: "顧客管理", href: "/customer", desc: "会員情報・履歴・進捗管理" },
  { title: "予約管理", href: "/reservation", desc: "当日確認・予約登録・日別管理" },
  { title: "売上管理", href: "/sales", desc: "売上登録・集計・区分確認" },
  { title: "勤怠管理", href: "/attendance", desc: "打刻・勤務時間・確認" },
  { title: "会計管理", href: "/accounting", desc: "前受金・会計区分・集計" },
  { title: "サブスク管理", href: "/subscription", desc: "契約状況・残回数・継続管理" },
  { title: "回数券購入登録", href: "/ticket-contracts", desc: "前受金として回数券契約を登録" },
];

const AUTH_STORAGE_KEY = "gymup_logged_in";
const ROLE_STORAGE_KEY = "gymup_user_role";
const STAFF_NAME_STORAGE_KEY = "gymup_current_staff_name";

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

function getHandoverStorageKey(dateString: string) {
  return `gymup_dashboard_handover_note_${dateString}`;
}

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

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function shiftDateString(dateString: string, diffDays: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + diffDays);

  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeName(value: string) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[　]/g, "");
}

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toIdNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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

function normalizeReservation(raw: any): ReservationItem | null {
  if (!raw) return null;

  const id = String(
    raw.id ??
      `${raw.date ?? ""}-${raw.start_time ?? raw.startTime ?? ""}-${raw.customer_name ?? raw.customerName ?? raw.name ?? ""}`
  );

  const date = String(raw.date ?? "").trim();
  const startTime = String(raw.start_time ?? raw.startTime ?? "").trim();
  const customerName = String(
    raw.customer_name ?? raw.customerName ?? raw.name ?? ""
  ).trim();
  const menu = String(raw.menu ?? raw.menu_name ?? raw.course ?? "予約メニュー").trim();
  const staffName = String(raw.staff_name ?? raw.staffName ?? "担当未設定").trim();
  const storeName = String(raw.store_name ?? raw.storeName ?? "").trim();
  const customerId = raw.customer_id ? String(raw.customer_id) : undefined;

  if (!date || !startTime || !customerName) return null;

  return {
    id,
    date,
    start_time: startTime,
    customer_name: customerName,
    menu,
    staff_name: staffName,
    store_name: storeName,
    customer_id: customerId,
  };
}

function isReservationItem(item: ReservationItem | null): item is ReservationItem {
  return item !== null;
}

function toDisplayReservation(item: ReservationItem): DisplayReservation {
  return {
    id: item.id,
    time: item.start_time?.slice(0, 5) || "--:--",
    name: item.customer_name || "名前未設定",
    menu: item.menu || "予約メニュー",
    staff: item.staff_name || "担当未設定",
    store: item.store_name || "",
    customerId: item.customer_id,
    date: item.date,
  };
}

function sortReservations(list: ReservationItem[]) {
  return [...list].sort((a, b) => {
    const aTime = a.start_time || "";
    const bTime = b.start_time || "";
    return aTime.localeCompare(bTime);
  });
}

function parseLocalReservations(): ReservationItem[] {
  if (typeof window === "undefined") return [];

  const possibleKeys = ["reservations", "gymup_reservations", "ltb_reservations"];
  const merged: ReservationItem[] = [];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      const normalized = parsed.map(normalizeReservation).filter(isReservationItem);
      merged.push(...normalized);
    } catch (error) {
      console.error(`localStorage parse error: ${key}`, error);
    }
  }

  const uniqueMap = new Map<string, ReservationItem>();

  for (const item of merged) {
    const uniqueKey = [
      item.date,
      item.start_time,
      item.customer_name,
      item.menu || "",
      item.staff_name || "",
      item.store_name || "",
    ].join("::");

    if (!uniqueMap.has(uniqueKey)) {
      uniqueMap.set(uniqueKey, item);
    }
  }

  return Array.from(uniqueMap.values());
}

function parseLocalCustomers(): CustomerLite[] {
  if (typeof window === "undefined") return [];

  const possibleKeys = ["customers", "gymup_customers", "ltb_customers"];
  const merged: CustomerLite[] = [];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      for (const item of parsed) {
        const id = String(item?.id ?? "").trim();
        const name = String(item?.name ?? item?.customer_name ?? "").trim();
        if (id && name) {
          merged.push({ id, name, plan_type: item?.plan_type ?? null });
        }
      }
    } catch (error) {
      console.error(`localStorage customer parse error: ${key}`, error);
    }
  }

  const unique = new Map<string, CustomerLite>();
  for (const item of merged) {
    const key = `${item.id}::${item.name}`;
    if (!unique.has(key)) unique.set(key, item);
  }
  return Array.from(unique.values());
}

function buildCustomerMap(customers: CustomerLite[]) {
  const map = new Map<string, string>();

  for (const customer of customers) {
    const normalized = normalizeName(customer.name);
    if (!normalized) continue;
    if (!map.has(normalized)) {
      map.set(normalized, customer.id);
    }
  }

  return map;
}

function readHandoverNote(dateString: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(getHandoverStorageKey(dateString)) || "";
}

function saveHandoverNote(dateString: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getHandoverStorageKey(dateString), value);
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

export default function DashboardPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [scheduleReservations, setScheduleReservations] = useState<DisplayReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationError, setReservationError] = useState("");
  const [activeMembers, setActiveMembers] = useState<number | null>(null);
  const [scheduleCount, setScheduleCount] = useState<number>(0);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("OFFLINE");
  const [logoError, setLogoError] = useState(false);
  const [consumedMap, setConsumedMap] = useState<Record<string, boolean>>({});
  const [consumingId, setConsumingId] = useState<string>("");
  const [handoverNote, setHandoverNote] = useState("");

  const selectedDateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);

  useEffect(() => {
    const loggedIn = localStorage.getItem(AUTH_STORAGE_KEY);
    const role = localStorage.getItem(ROLE_STORAGE_KEY);
    const staffName = localStorage.getItem(STAFF_NAME_STORAGE_KEY);

    const legacyStaffLoggedIn = localStorage.getItem("gymup_staff_logged_in");

    if (loggedIn !== "true" && legacyStaffLoggedIn === "true") {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(ROLE_STORAGE_KEY, localStorage.getItem(ROLE_STORAGE_KEY) || "staff");
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

    async function loadTopData() {
      setLoadingReservations(true);
      setReservationError("");

      try {
        const supabase = getSupabaseClient();

        if (supabase) {
          const [reservationsResult, customersResult] = await Promise.all([
            supabase
              .from("reservations")
              .select("id, date, start_time, customer_name, customer_id, menu, staff_name, store_name")
              .eq("date", selectedDate)
              .order("start_time", { ascending: true }),
            supabase.from("customers").select("id, name, plan_type"),
          ]);

          if (reservationsResult.error) {
            throw reservationsResult.error;
          }

          const customerList: CustomerLite[] = Array.isArray(customersResult.data)
            ? (customersResult.data as any[]).map((item) => ({
                id: String(item.id),
                name: String(item.name ?? ""),
                plan_type: item.plan_type ?? null,
              }))
            : [];

          const customerMap = buildCustomerMap(customerList);

          const normalizedReservations: ReservationItem[] = (reservationsResult.data || [])
            .map(normalizeReservation)
            .filter(isReservationItem)
            .map((item) => {
              if (item.customer_id) return item;
              const matchedId = customerMap.get(normalizeName(item.customer_name));
              return matchedId ? { ...item, customer_id: matchedId } : item;
            });

          const sorted = sortReservations(normalizedReservations);
          const display = sorted.map(toDisplayReservation);

          const reservationIds = sorted
            .map((item) => toIdNumber(item.id))
            .filter((id): id is number => id !== null);

          let consumedSet = new Set<number>();

          if (reservationIds.length > 0) {
            const { data: usageRows, error: usageError } = await supabase
              .from("ticket_usages")
              .select("reservation_id")
              .in("reservation_id", reservationIds);

            if (!usageError) {
              consumedSet = new Set(
                ((usageRows as any[]) || [])
                  .map((row) => Number(row.reservation_id))
                  .filter((num) => Number.isFinite(num))
              );
            }
          }

          if (!mounted) return;

          const nextConsumedMap: Record<string, boolean> = {};
          for (const item of sorted) {
            const reservationId = toIdNumber(item.id);
            if (reservationId && consumedSet.has(reservationId)) {
              nextConsumedMap[String(item.id)] = true;
            }
          }

          setConsumedMap(nextConsumedMap);
          setScheduleReservations(display);
          setScheduleCount(sorted.length);
          setActiveMembers(customerList.length);
          setSystemStatus("ONLINE");
          setLoadingReservations(false);
          return;
        }

        const localCustomers = parseLocalCustomers();
        const localCustomerMap = buildCustomerMap(localCustomers);

        const localReservations = parseLocalReservations();
        const selectedLocal = sortReservations(
          localReservations
            .filter((item) => item.date === selectedDate)
            .map((item) => {
              if (item.customer_id) return item;
              const matchedId = localCustomerMap.get(normalizeName(item.customer_name));
              return matchedId ? { ...item, customer_id: matchedId } : item;
            })
        );

        const display = selectedLocal.map(toDisplayReservation);

        if (!mounted) return;

        setConsumedMap({});
        setScheduleReservations(display);
        setScheduleCount(selectedLocal.length);
        setActiveMembers(localCustomers.length || null);
        setSystemStatus(selectedLocal.length > 0 ? "FALLBACK" : "OFFLINE");
        setLoadingReservations(false);
      } catch (error) {
        console.error("TOP data load error:", error);

        try {
          const localCustomers = parseLocalCustomers();
          const localCustomerMap = buildCustomerMap(localCustomers);

          const localReservations = parseLocalReservations();
          const selectedLocal = sortReservations(
            localReservations
              .filter((item) => item.date === selectedDate)
              .map((item) => {
                if (item.customer_id) return item;
                const matchedId = localCustomerMap.get(normalizeName(item.customer_name));
                return matchedId ? { ...item, customer_id: matchedId } : item;
              })
          );

          const display = selectedLocal.map(toDisplayReservation);

          if (!mounted) return;

          setConsumedMap({});
          setScheduleReservations(display);
          setScheduleCount(selectedLocal.length);
          setActiveMembers(localCustomers.length || null);
          setSystemStatus(selectedLocal.length > 0 ? "FALLBACK" : "OFFLINE");
          setLoadingReservations(false);

          if (selectedLocal.length === 0) {
            setReservationError("予約データの取得に失敗しました");
          }
        } catch (fallbackError) {
          console.error("fallback load error:", fallbackError);

          if (!mounted) return;

          setConsumedMap({});
          setScheduleReservations([]);
          setScheduleCount(0);
          setActiveMembers(null);
          setSystemStatus("OFFLINE");
          setLoadingReservations(false);
          setReservationError("予約データの取得に失敗しました");
        }
      }
    }

    loadTopData();

    return () => {
      mounted = false;
    };
  }, [authChecked, selectedDate]);

  const handleStaffLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    localStorage.removeItem(STAFF_NAME_STORAGE_KEY);
    localStorage.removeItem("gymup_staff_logged_in");
    router.push("/login/staff");
  };

  const handleOpenTraining = (item: DisplayReservation) => {
    if (item.customerId) {
      router.push(
        `/customer/${item.customerId}?tab=training&from=dashboard&reservationId=${encodeURIComponent(
          item.id
        )}`
      );
      return;
    }

    router.push(`/customer?keyword=${encodeURIComponent(item.name)}`);
  };

  const handleConsume = async (
    item: DisplayReservation,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    if (consumedMap[item.id]) return;

    const reservationId = toIdNumber(item.id);
    const customerId = toIdNumber(item.customerId);

    if (!reservationId) {
      window.alert("予約IDが不正です");
      return;
    }

    if (!customerId) {
      window.alert("この予約に customer_id がありません");
      return;
    }

    const ok = window.confirm(
      `${item.name} の回数券を1回消化して、売上を自動作成します。よろしいですか？`
    );
    if (!ok) return;

    setConsumingId(item.id);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabaseの環境変数が設定されていません。");
      }

      const { data: usageExists, error: usageExistsError } = await supabase
        .from("ticket_usages")
        .select("id")
        .eq("reservation_id", reservationId)
        .limit(1)
        .maybeSingle();

      if (usageExistsError) throw usageExistsError;
      if (usageExists) {
        setConsumedMap((prev) => ({ ...prev, [item.id]: true }));
        window.alert("この予約はすでに消化済みです");
        return;
      }

      const { data: customerRow, error: customerError } = await supabase
        .from("customers")
        .select("id, name, plan_type")
        .eq("id", customerId)
        .maybeSingle();

      if (customerError) throw customerError;
      if (!customerRow) {
        throw new Error("顧客情報が見つかりません。");
      }

      const ticketName = resolveTicketName({
        reservationMenu: item.menu,
        customerPlanType: (customerRow as any).plan_type,
      });

      if (!ticketName) {
        throw new Error(
          "回数券名を特定できません。予約メニューか顧客プラン名を、単価表にある名前へ合わせてください。"
        );
      }

      const unitPrice = TICKET_UNIT_PRICES[ticketName];
      if (!unitPrice) {
        throw new Error(`単価設定がありません: ${ticketName}`);
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
        throw new Error(`有効な回数券契約がありません: ${ticketName}`);
      }

      const remainingCount = Number((contractRow as any).remaining_count ?? 0);
      const usedCount = Number((contractRow as any).used_count ?? 0);
      const prepaidBalance = Number((contractRow as any).prepaid_balance ?? 0);

      if (remainingCount <= 0) {
        throw new Error("残回数がありません。");
      }

      const nextRemaining = remainingCount - 1;
      const nextUsed = usedCount + 1;
      const nextBalance = Math.max(prepaidBalance - unitPrice, 0);
      const serviceType = detectServiceTypeFromTicketName(ticketName);

      const { error: usageInsertError } = await supabase.from("ticket_usages").insert({
        contract_id: (contractRow as any).id,
        customer_id: customerId,
        reservation_id: reservationId,
        used_date: item.date || selectedDate,
        ticket_name: ticketName,
        unit_price: unitPrice,
        staff_name: item.staff || null,
        store_name: item.store || null,
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
        customer_name: item.name || trimmed((customerRow as any).name) || null,
        sale_date: item.date || selectedDate,
        amount: unitPrice,
        menu_type: serviceType,
        sale_type: "回数券消化",
        payment_method: "前受金消化",
        staff_name: item.staff || null,
        store_name: item.store || null,
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

      setConsumedMap((prev) => ({ ...prev, [item.id]: true }));
      window.alert(
        `消化を記録しました。${unitPrice.toLocaleString()}円を売上計上し、残回数は ${nextRemaining} です。`
      );
    } catch (error) {
      console.error("consume error:", error);
      window.alert(`消化処理に失敗しました: ${extractErrorMessage(error)}`);
    } finally {
      setConsumingId("");
    }
  };

  const handleHandoverChange = (value: string) => {
    setHandoverNote(value);
    saveHandoverNote(selectedDate, value);
  };

  const handleClearHandover = () => {
    const ok = window.confirm(`${selectedDateLabel} の重要な引き継ぎメモを空にしますか？`);
    if (!ok) return;
    setHandoverNote("");
    saveHandoverNote(selectedDate, "");
  };

  const handlePrevDay = () => {
    setSelectedDate((prev) => shiftDateString(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => shiftDateString(prev, 1));
  };

  const handleGoToday = () => {
    setSelectedDate(getTodayDateString());
  };

  const handleDateInputChange = (value: string) => {
    if (!value) return;
    setSelectedDate(value);
  };

  const statusLabel =
    systemStatus === "ONLINE"
      ? "Online"
      : systemStatus === "FALLBACK"
      ? "Fallback"
      : "Offline";

  const statCards = [
    {
      label: "Selected Reservations",
      value: loadingReservations ? "..." : String(scheduleCount),
    },
    {
      label: "Active Members",
      value: activeMembers === null ? "--" : String(activeMembers),
    },
    {
      label: "System Status",
      value: statusLabel,
    },
  ];

  if (!authChecked) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1012",
          color: "#ffffff",
          fontSize: 14,
        }}
      >
        認証を確認中...
      </main>
    );
  }

  return (
    <>
      <style>{`
        .gymup-home {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.035) 0%, transparent 28%),
            radial-gradient(circle at bottom right, rgba(255,255,255,0.025) 0%, transparent 22%),
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
          max-width: 1440px;
          margin: 0 auto;
          padding: 34px 24px 28px;
        }

        .gymup-home__topbar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-bottom: 18px;
        }

        .gymup-home__topbar-link,
        .gymup-home__topbar-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 14px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .gymup-home__topbar-link {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #f5f7fa;
        }

        .gymup-home__topbar-button {
          border: 1px solid rgba(240,138,39,0.28);
          background: rgba(240,138,39,0.14);
          color: #f08a27;
          cursor: pointer;
        }

        .gymup-home__topbar-link:hover,
        .gymup-home__topbar-button:hover {
          transform: translateY(-1px);
        }

        .gymup-home__grid {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
          gap: 28px;
          align-items: stretch;
          min-height: calc(100vh - 124px);
        }

        .gymup-home__left {
          display: flex;
          flex-direction: column;
          gap: 22px;
          min-width: 0;
        }

        .gymup-home__right {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .gymup-home__hero-card,
        .gymup-home__menu-card,
        .gymup-home__dashboard {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.045);
          box-shadow: 0 18px 48px rgba(0,0,0,0.24);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 28px;
        }

        .gymup-home__hero-card {
          padding: 26px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          min-height: 420px;
        }

        .gymup-home__menu-card {
          padding: 22px;
        }

        .gymup-home__logo-wrap {
          display: flex;
          align-items: center;
          min-height: 108px;
          margin-bottom: 16px;
        }

        .gymup-home__logo-box {
          width: min(100%, 520px);
        }

        .gymup-home__logo {
          display: block;
          width: 100%;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 12px 34px rgba(0,0,0,0.28));
          user-select: none;
          pointer-events: none;
        }

        .gymup-home__text-logo {
          display: inline-flex;
          align-items: flex-end;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(240,138,39,0.35);
        }

        .gymup-home__text-logo-main {
          font-size: clamp(38px, 5vw, 72px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #ffffff;
        }

        .gymup-home__text-logo-sub {
          font-size: clamp(15px, 2vw, 24px);
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: #f08a27;
          padding-bottom: 8px;
        }

        .gymup-home__copy {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 640px;
        }

        .gymup-home__eyebrow {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.68);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .gymup-home__title {
          margin: 0;
          font-size: clamp(34px, 5vw, 60px);
          line-height: 1.06;
          letter-spacing: -0.04em;
          font-weight: 700;
          color: #ffffff;
        }

        .gymup-home__desc {
          margin: 0;
          max-width: 560px;
          color: rgba(255,255,255,0.66);
          font-size: 15px;
          line-height: 1.9;
        }

        .gymup-home__hero-date-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .gymup-home__hero-memo {
          margin-top: 10px;
          border-radius: 24px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }

        .gymup-home__hero-memo-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .gymup-home__hero-memo-title {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
        }

        .gymup-home__hero-memo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(240,138,39,0.12);
          border: 1px solid rgba(240,138,39,0.20);
          color: #f6b171;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .gymup-home__hero-memo-desc {
          font-size: 13px;
          line-height: 1.8;
          color: rgba(255,255,255,0.64);
          margin-bottom: 14px;
        }

        .gymup-home__hero-memo-textarea {
          width: 100%;
          min-height: 220px;
          resize: vertical;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #ffffff;
          padding: 16px 18px;
          font-size: 15px;
          line-height: 1.85;
          outline: none;
          box-sizing: border-box;
        }

        .gymup-home__hero-memo-textarea::placeholder {
          color: rgba(255,255,255,0.34);
        }

        .gymup-home__hero-memo-textarea:focus {
          border-color: rgba(240,138,39,0.30);
          box-shadow: 0 0 0 1px rgba(240,138,39,0.16);
        }

        .gymup-home__hero-memo-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .gymup-home__hero-memo-status {
          font-size: 12px;
          color: rgba(255,255,255,0.50);
        }

        .gymup-home__hero-memo-clear {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #f5f7fa;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .gymup-home__hero-memo-clear:hover,
        .gymup-home__menu-link:hover,
        .gymup-home__mini-link:hover,
        .gymup-home__date-nav-btn:hover,
        .gymup-home__date-today-btn:hover {
          transform: translateY(-1px);
        }

        .gymup-home__section-label {
          font-size: 12px;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 16px;
        }

        .gymup-home__menu-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .gymup-home__menu-link {
          display: block;
          text-decoration: none;
          color: inherit;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .gymup-home__menu-link:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
        }

        .gymup-home__menu-title {
          margin-bottom: 6px;
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }

        .gymup-home__menu-desc {
          font-size: 13px;
          line-height: 1.65;
          color: rgba(255,255,255,0.56);
        }

        .gymup-home__dashboard {
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .gymup-home__dashboard-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 16px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.025);
        }

        .gymup-home__dots {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gymup-home__dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(255,255,255,0.16);
        }

        .gymup-home__dashboard-label {
          font-size: 13px;
          color: rgba(255,255,255,0.54);
          letter-spacing: 0.04em;
        }

        .gymup-home__dashboard-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          flex: 1;
        }

        .gymup-home__stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .gymup-home__stat {
          border-radius: 20px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
        }

        .gymup-home__stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.48);
          margin-bottom: 10px;
          letter-spacing: 0.04em;
        }

        .gymup-home__stat-value {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .gymup-home__panels {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 16px;
          flex: 1;
        }

        .gymup-home__panel-large,
        .gymup-home__panel-small {
          border-radius: 24px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
        }

        .gymup-home__panel-stack {
          display: grid;
          gap: 16px;
        }

        .gymup-home__panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .gymup-home__panel-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
        }

        .gymup-home__panel-meta {
          font-size: 13px;
          color: #f08a27;
          font-weight: 600;
        }

        .gymup-home__date-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .gymup-home__date-nav-btn,
        .gymup-home__date-today-btn {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #f5f7fa;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .gymup-home__date-current {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid rgba(240,138,39,0.20);
          background: rgba(240,138,39,0.10);
          color: #f6b171;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .gymup-home__date-picker {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #f5f7fa;
          font-size: 13px;
          font-weight: 700;
          outline: none;
          box-sizing: border-box;
        }

        .gymup-home__date-picker::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.9;
          cursor: pointer;
        }

        .gymup-home__schedule {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .gymup-home__schedule-item {
          display: grid;
          grid-template-columns: 74px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.028);
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .gymup-home__schedule-item:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
        }

        .gymup-home__schedule-main {
          min-width: 0;
        }

        .gymup-home__schedule-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .gymup-home__consume-btn,
        .gymup-home__consumed-badge {
          min-width: 84px;
          min-height: 38px;
          padding: 0 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .gymup-home__consume-btn {
          border: 1px solid rgba(240,138,39,0.32);
          background: rgba(240,138,39,0.12);
          color: #f08a27;
          cursor: pointer;
        }

        .gymup-home__consume-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .gymup-home__consumed-badge {
          border: 1px solid rgba(92, 214, 146, 0.28);
          background: rgba(92, 214, 146, 0.12);
          color: #7ce7aa;
        }

        .gymup-home__schedule-time {
          font-size: 14px;
          font-weight: 700;
          color: #f08a27;
        }

        .gymup-home__schedule-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
          word-break: break-word;
        }

        .gymup-home__schedule-sub {
          font-size: 12px;
          line-height: 1.6;
          color: rgba(255,255,255,0.56);
          word-break: break-word;
        }

        .gymup-home__empty {
          padding: 20px 14px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          font-size: 13px;
          line-height: 1.7;
          color: rgba(255,255,255,0.58);
        }

        .gymup-home__mini-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .gymup-home__mini-link {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 10px;
          border-radius: 14px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          color: #f5f7fa;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.028);
          transition: transform 0.2s ease, background 0.2s ease;
          text-align: center;
        }

        .gymup-home__mini-link:hover {
          background: rgba(255,255,255,0.045);
        }

        .gymup-home__alerts {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
        }

        .gymup-home__alert {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255,255,255,0.7);
        }

        .gymup-home__alert-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #f08a27;
          flex-shrink: 0;
        }

        .gymup-home__ticket-link {
          border-color: rgba(240,138,39,0.22);
          background: rgba(240,138,39,0.08);
          color: #ffd7ae;
        }

        .gymup-home__ticket-link:hover {
          background: rgba(240,138,39,0.12);
        }

        @media (max-width: 1100px) {
          .gymup-home__grid {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .gymup-home__hero-card {
            min-height: auto;
          }

          .gymup-home__title {
            font-size: clamp(34px, 7vw, 52px);
          }
        }

        @media (max-width: 768px) {
          .gymup-home__container {
            padding: 18px 14px 22px;
          }

          .gymup-home__topbar {
            justify-content: stretch;
            flex-direction: column;
            align-items: stretch;
            margin-bottom: 14px;
          }

          .gymup-home__topbar-link,
          .gymup-home__topbar-button {
            width: 100%;
          }

          .gymup-home__grid {
            gap: 18px;
          }

          .gymup-home__left {
            gap: 18px;
          }

          .gymup-home__hero-card,
          .gymup-home__menu-card,
          .gymup-home__dashboard,
          .gymup-home__panel-large,
          .gymup-home__panel-small {
            border-radius: 22px;
          }

          .gymup-home__hero-card {
            padding: 20px;
          }

          .gymup-home__menu-card {
            padding: 18px;
          }

          .gymup-home__logo-wrap {
            justify-content: center;
            min-height: auto;
            margin-bottom: 10px;
          }

          .gymup-home__logo-box {
            width: min(88vw, 320px);
          }

          .gymup-home__copy {
            align-items: center;
            text-align: center;
            max-width: 100%;
          }

          .gymup-home__eyebrow {
            align-self: center;
          }

          .gymup-home__title {
            font-size: 34px;
            line-height: 1.12;
          }

          .gymup-home__desc {
            font-size: 14px;
            line-height: 1.8;
          }

          .gymup-home__hero-memo-head,
          .gymup-home__hero-memo-footer,
          .gymup-home__panel-head,
          .gymup-home__date-nav,
          .gymup-home__hero-date-nav {
            flex-direction: column;
            align-items: stretch;
          }

          .gymup-home__hero-memo-clear,
          .gymup-home__date-nav-btn,
          .gymup-home__date-today-btn,
          .gymup-home__date-picker {
            width: 100%;
          }

          .gymup-home__menu-grid,
          .gymup-home__stats,
          .gymup-home__panels,
          .gymup-home__mini-grid {
            grid-template-columns: 1fr;
          }

          .gymup-home__dashboard-body {
            padding: 16px;
          }

          .gymup-home__schedule-item {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 12px;
          }

          .gymup-home__schedule-actions {
            justify-content: flex-start;
          }

          .gymup-home__stat-value {
            font-size: 22px;
          }

          .gymup-home__text-logo {
            justify-content: center;
          }

          .gymup-home__date-current {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <main className="gymup-home">
        <div className="gymup-home__container">
          <div className="gymup-home__topbar">
            <Link href="/login/staff" className="gymup-home__topbar-link">
              スタッフログイン画面へ
            </Link>
            <button
              type="button"
              className="gymup-home__topbar-button"
              onClick={handleStaffLogout}
            >
              スタッフログアウト
            </button>
          </div>

          <div className="gymup-home__grid">
            <div className="gymup-home__left">
              <div className="gymup-home__hero-card">
                <div className="gymup-home__logo-wrap">
                  <div className="gymup-home__logo-box">
                    {!logoError ? (
                      <img
                        src="/logo.png"
                        alt="GYMUP"
                        className="gymup-home__logo"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="gymup-home__text-logo" aria-label="GYMUP CRM">
                        <div className="gymup-home__text-logo-main">GYMUP</div>
                        <div className="gymup-home__text-logo-sub">CRM</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="gymup-home__copy">
                  <div className="gymup-home__eyebrow">GYM / PILATES CRM</div>

                  <h1 className="gymup-home__title">
                    現場の管理を、
                    <br />
                    ひとつに整理する。
                  </h1>

                  <p className="gymup-home__desc">
                    予約、顧客、売上、勤怠、会計、サブスク管理まで。
                    GYMUP CRMは、ジム・ピラティス運営に必要な業務を見やすく整理し、
                    日々の現場で使いやすい形にまとめる管理システムです。
                  </p>

                  <div className="gymup-home__hero-date-nav">
                    <button
                      type="button"
                      className="gymup-home__date-nav-btn"
                      onClick={handlePrevDay}
                    >
                      ← 前日
                    </button>

                    <div className="gymup-home__date-current">{selectedDate}</div>

                    <button
                      type="button"
                      className="gymup-home__date-nav-btn"
                      onClick={handleNextDay}
                    >
                      翌日 →
                    </button>

                    <input
                      type="date"
                      className="gymup-home__date-picker"
                      value={selectedDate}
                      onChange={(e) => handleDateInputChange(e.target.value)}
                    />

                    <button
                      type="button"
                      className="gymup-home__date-today-btn"
                      onClick={handleGoToday}
                    >
                      今日に戻る
                    </button>
                  </div>

                  <div className="gymup-home__hero-memo">
                    <div className="gymup-home__hero-memo-head">
                      <div className="gymup-home__hero-memo-title">重要な引き継ぎメモ</div>
                      <div className="gymup-home__hero-memo-badge">{selectedDate}</div>
                    </div>

                    <div className="gymup-home__hero-memo-desc">
                      選択中の日付ごとにメモを分けて保存できます。左の重要事項も右のスケジュールも同じ日付で連動します。
                    </div>

                    <textarea
                      className="gymup-home__hero-memo-textarea"
                      placeholder={`例）
・山田様 14:00 来店前に前回の姿勢写真確認
・佐藤様 回数券の残り説明が必要
・本日は福島店の売上登録を閉店前に確認
・新規体験の方はカウンセリングシート入力を必ず案内
・未消化の前受金処理があれば会計管理で確認`}
                      value={handoverNote}
                      onChange={(e) => handleHandoverChange(e.target.value)}
                    />

                    <div className="gymup-home__hero-memo-footer">
                      <div className="gymup-home__hero-memo-status">
                        {selectedDateLabel} の内容をこの端末に自動保存
                      </div>
                      <button
                        type="button"
                        className="gymup-home__hero-memo-clear"
                        onClick={handleClearHandover}
                      >
                        この日のメモをクリア
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="gymup-home__menu-card">
                <div className="gymup-home__section-label">MAIN MENU</div>

                <div className="gymup-home__menu-grid">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`gymup-home__menu-link ${
                        item.href === "/ticket-contracts" ? "gymup-home__ticket-link" : ""
                      }`}
                    >
                      <div className="gymup-home__menu-title">{item.title}</div>
                      <div className="gymup-home__menu-desc">{item.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="gymup-home__right">
              <div className="gymup-home__dashboard">
                <div className="gymup-home__dashboard-top">
                  <div className="gymup-home__dots">
                    <span className="gymup-home__dot" />
                    <span className="gymup-home__dot" />
                    <span className="gymup-home__dot" />
                  </div>
                  <div className="gymup-home__dashboard-label">Dashboard Preview</div>
                </div>

                <div className="gymup-home__dashboard-body">
                  <div className="gymup-home__stats">
                    {statCards.map((stat) => (
                      <div key={stat.label} className="gymup-home__stat">
                        <div className="gymup-home__stat-label">{stat.label}</div>
                        <div className="gymup-home__stat-value">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="gymup-home__panels">
                    <div className="gymup-home__panel-large">
                      <div className="gymup-home__panel-head">
                        <div>
                          <div className="gymup-home__panel-title">Schedule</div>
                          <div className="gymup-home__panel-meta">{selectedDateLabel}</div>
                        </div>

                        <div className="gymup-home__date-nav">
                          <button
                            type="button"
                            className="gymup-home__date-nav-btn"
                            onClick={handlePrevDay}
                          >
                            ← 前日
                          </button>

                          <div className="gymup-home__date-current">{selectedDate}</div>

                          <button
                            type="button"
                            className="gymup-home__date-nav-btn"
                            onClick={handleNextDay}
                          >
                            翌日 →
                          </button>

                          <input
                            type="date"
                            className="gymup-home__date-picker"
                            value={selectedDate}
                            onChange={(e) => handleDateInputChange(e.target.value)}
                          />

                          <button
                            type="button"
                            className="gymup-home__date-today-btn"
                            onClick={handleGoToday}
                          >
                            今日に戻る
                          </button>
                        </div>
                      </div>

                      <div className="gymup-home__schedule">
                        {loadingReservations ? (
                          <div className="gymup-home__empty">予約を読み込み中です...</div>
                        ) : scheduleReservations.length > 0 ? (
                          scheduleReservations.map((item) => (
                            <div
                              key={item.id}
                              className="gymup-home__schedule-item"
                              onClick={() => handleOpenTraining(item)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleOpenTraining(item);
                                }
                              }}
                            >
                              <div className="gymup-home__schedule-time">{item.time}</div>

                              <div className="gymup-home__schedule-main">
                                <div className="gymup-home__schedule-name">{item.name}</div>
                                <div className="gymup-home__schedule-sub">
                                  {item.menu} / {item.staff}
                                  {item.store ? ` / ${item.store}` : ""}
                                </div>
                              </div>

                              <div className="gymup-home__schedule-actions">
                                {consumedMap[item.id] ? (
                                  <div className="gymup-home__consumed-badge">消化済み</div>
                                ) : (
                                  <button
                                    type="button"
                                    className="gymup-home__consume-btn"
                                    onClick={(e) => handleConsume(item, e)}
                                    disabled={consumingId === item.id}
                                  >
                                    {consumingId === item.id ? "処理中..." : "消化"}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="gymup-home__empty">
                            {selectedDateLabel} の予約はありません。
                            {reservationError ? `（${reservationError}）` : ""}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="gymup-home__panel-stack">
                      <div className="gymup-home__panel-small">
                        <div className="gymup-home__panel-title">Operations</div>
                        <div className="gymup-home__mini-grid">
                          <Link href="/reservation" className="gymup-home__mini-link">
                            予約管理
                          </Link>
                          <Link href="/sales" className="gymup-home__mini-link">
                            売上管理
                          </Link>
                          <Link href="/attendance" className="gymup-home__mini-link">
                            勤怠管理
                          </Link>
                          <Link href="/subscription" className="gymup-home__mini-link">
                            サブスク管理
                          </Link>
                          <Link href="/ticket-contracts" className="gymup-home__mini-link gymup-home__ticket-link">
                            回数券購入登録
                          </Link>
                          <Link href="/accounting" className="gymup-home__mini-link">
                            前受金確認
                          </Link>
                        </div>
                      </div>

                      <div className="gymup-home__panel-small">
                        <div className="gymup-home__panel-title">System Notes</div>
                        <div className="gymup-home__alerts">
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>左の重要事項にも日付ナビを追加</span>
                          </div>
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>重要事項とスケジュールは同じ日付で完全連動</span>
                          </div>
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>矢印とカレンダーの両方で日付切替が可能</span>
                          </div>
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>回数券購入登録から前受契約を先に入れる運用</span>
                          </div>
                        </div>
                      </div>

                      <div className="gymup-home__panel-small">
                        <div className="gymup-home__panel-title">メモ運用</div>
                        <div className="gymup-home__alerts">
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>{selectedDate} のメモを表示中</span>
                          </div>
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>日付ごとに別メモで保存</span>
                          </div>
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>入力内容はこの端末に自動保存</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}