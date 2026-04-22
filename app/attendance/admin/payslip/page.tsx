"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";

type ServiceType = "ストレッチ" | "トレーニング";
type AccountingType = "通常売上" | "前受金" | "回数券消化";
type PaymentMethod = "現金" | "カード" | "銀行振込" | "その他";

type Sale = {
  id: string;
  date: string;
  customerId?: string | null;
  customerName: string;
  menuName: string;
  staff: string;
  storeName: string;
  serviceType: ServiceType;
  accountingType: AccountingType;
  paymentMethod: PaymentMethod;
  amount: number;
  note: string;
  createdAt: string;
  reservationId?: number | null;
};

type Reservation = {
  id: string;
  date: string;
  customerId?: string | null;
  customerName: string;
  staff: string;
  storeName: string;
  status: string;
  createdAt: string;
};

type SupabaseSaleRow = {
  id: number | string;
  customer_id?: number | string | null;
  customer_name: string | null;
  sale_date: string | null;
  menu_type: string | null;
  sale_type: string | null;
  payment_method: string | null;
  amount: number | null;
  staff_name: string | null;
  store_name: string | null;
  reservation_id: number | null;
  memo: string | null;
  created_at: string | null;
};

type SupabaseReservationRow = {
  id: number | string;
  customer_id?: number | string | null;
  customer_name?: string | null;
  date?: string | null;
  staff_name?: string | null;
  store_name?: string | null;
  reservation_status?: string | null;
  created_at?: string | null;
};

type StaffSummary = {
  staff: string;
  reservationCount: number;
  cancelCount: number;
  noShowCount: number;
  cancelBaseCount: number;
  cancelRate: number;
  newCount: number;
  repeatCount: number;
  repeatRate: number;
  salesTotal: number;
  normalTotal: number;
  advanceTotal: number;
  ticketTotal: number;
  nominationTotal: number;
  count: number;
};

type DetailRow = {
  kind: "sale" | "reservation";
  id: string;
  date: string;
  staff: string;
  customerName: string;
  storeName: string;
  reservationStatus: string;
  accountingType: string;
  paymentMethod: string;
  amount: number;
  nominationFee: number;
  isRepeat: boolean;
  isNew: boolean;
  memo: string;
  reservationId?: number | null;
};

type MonthTab = {
  key: string;
  label: string;
  start: string;
  end: string;
};

type RepeatFilter = "all" | "new" | "repeat";
type CancelBaseMode = "all_reservations" | "exclude_completed";
type SaleTypeFilter = "all" | "normal" | "advance" | "ticket";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstDayOfMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}-01`;
}

function formatCurrency(value: number) {
  return `¥${Number(value || 0).toLocaleString()}`;
}

function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
}

function formatDateJP(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}/${`${d.getMonth() + 1}`.padStart(2, "0")}/${`${d.getDate()}`.padStart(2, "0")}`;
}

function normalizeServiceType(value?: string | null): ServiceType {
  if (value === "ストレッチ") return "ストレッチ";
  return "トレーニング";
}

function normalizeAccountingType(value?: string | null): AccountingType {
  if (value === "前受金") return "前受金";
  if (value === "回数券消化") return "回数券消化";
  return "通常売上";
}

function normalizePaymentMethod(value?: string | null): PaymentMethod {
  if (value === "現金" || value === "カード" || value === "銀行振込" || value === "その他") {
    return value;
  }
  return "現金";
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[‐-‒–—―ー－]/g, "-")
    .toLowerCase();
}

function buildCustomerKey(params: { customerId?: string | null; customerName?: string | null }) {
  if (params.customerId && String(params.customerId).trim()) {
    return `id:${String(params.customerId).trim()}`;
  }
  return `name:${normalizeText(params.customerName)}`;
}

function parseNominationFee(note?: string | null) {
  const text = String(note || "");

  const chargedMatch = text.match(/指名料加算済み\s*[:：]?\s*([0-9,]+)\s*円/);
  if (chargedMatch?.[1]) {
    return Number(chargedMatch[1].replace(/,/g, "")) || 0;
  }

  const plainMatch = text.match(/指名料\s*[:：]?\s*([0-9,]+)\s*円/);
  if (plainMatch?.[1]) {
    return Number(plainMatch[1].replace(/,/g, "")) || 0;
  }

  return 0;
}

function isCancelledStatus(status?: string | null) {
  const text = String(status || "").toLowerCase();
  return text.includes("キャンセル") || text.includes("cancel");
}

function isNoShowStatus(status?: string | null) {
  const text = String(status || "");
  return text.includes("無断");
}

function isCompletedStatus(status?: string | null) {
  const text = String(status || "");
  return text.includes("売上済") || text.includes("来店") || text.includes("完了");
}

function rowToSale(row: SupabaseSaleRow): Sale {
  const serviceType = normalizeServiceType(row.menu_type);
  const accountingType = normalizeAccountingType(row.sale_type);
  const paymentMethod = normalizePaymentMethod(row.payment_method);

  return {
    id: String(row.id),
    date: row.sale_date || todayString(),
    customerId:
      row.customer_id === null || row.customer_id === undefined
        ? null
        : String(row.customer_id),
    customerName: row.customer_name || "未設定",
    menuName: serviceType === "ストレッチ" ? "ストレッチ" : "トレーニング",
    staff: row.staff_name?.trim() || "未設定",
    storeName: row.store_name?.trim() || "未設定",
    serviceType,
    accountingType,
    paymentMethod,
    amount: Number(row.amount || 0),
    note: row.memo || "",
    createdAt: row.created_at || new Date().toISOString(),
    reservationId: row.reservation_id ?? null,
  };
}

function rowToReservation(row: SupabaseReservationRow): Reservation {
  return {
    id: String(row.id),
    date: row.date || todayString(),
    customerId:
      row.customer_id === null || row.customer_id === undefined
        ? null
        : String(row.customer_id),
    customerName: row.customer_name || "未設定",
    staff: row.staff_name?.trim() || "未設定",
    storeName: row.store_name?.trim() || "未設定",
    status: row.reservation_status?.trim() || "未設定",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function toCsvValue(value: string | number | boolean) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function monthRange(offset: number) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

  const startStr = `${start.getFullYear()}-${`${start.getMonth() + 1}`.padStart(2, "0")}-${`${start.getDate()}`.padStart(2, "0")}`;
  const endStr = `${end.getFullYear()}-${`${end.getMonth() + 1}`.padStart(2, "0")}-${`${end.getDate()}`.padStart(2, "0")}`;

  return {
    key: `${start.getFullYear()}-${`${start.getMonth() + 1}`.padStart(2, "0")}`,
    label: `${start.getMonth() + 1}月`,
    start: startStr,
    end: endStr,
  };
}

function buildMonthTabs(): MonthTab[] {
  return [monthRange(0), monthRange(-1), monthRange(-2), monthRange(-3)];
}

export default function PayslipPage() {
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [sales, setSales] = useState<Sale[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const monthTabs = useMemo(() => buildMonthTabs(), []);
  const [activeMonthKey, setActiveMonthKey] = useState(monthTabs[0]?.key || "");

  const [dateFrom, setDateFrom] = useState(monthTabs[0]?.start || firstDayOfMonth());
  const [dateTo, setDateTo] = useState(monthTabs[0]?.end || todayString());
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("全スタッフ");
  const [selectedStore, setSelectedStore] = useState("全店舗");
  const [staffLocked, setStaffLocked] = useState(false);

  const [repeatFilter, setRepeatFilter] = useState<RepeatFilter>("all");
  const [cancelBaseMode, setCancelBaseMode] = useState<CancelBaseMode>("all_reservations");
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleTypeFilter>("all");
  const [nominationOnly, setNominationOnly] = useState(false);

  const [sortKey, setSortKey] = useState<
    "salesTotal" | "reservationCount" | "cancelRate" | "repeatRate" | "nominationTotal"
  >("salesTotal");

  useEffect(() => {
    setMounted(true);

    const isLoggedIn =
      localStorage.getItem("gymup_logged_in") || localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const mobile = windowWidth < 768;
  const tablet = windowWidth < 1100;

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [salesRes, reservationRes] = await Promise.all([
        supabase
          .from("sales")
          .select(
            "id, customer_id, customer_name, sale_date, menu_type, sale_type, payment_method, amount, staff_name, store_name, reservation_id, memo, created_at"
          )
          .order("sale_date", { ascending: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("reservations")
          .select(
            "id, customer_id, customer_name, date, staff_name, store_name, reservation_status, created_at"
          )
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (salesRes.error) {
        alert(`売上取得エラー: ${salesRes.error.message}`);
      }

      if (reservationRes.error) {
        alert(`予約取得エラー: ${reservationRes.error.message}`);
      }

      const mappedSales = ((salesRes.data as SupabaseSaleRow[] | null) || []).map(rowToSale);
      const mappedReservations = ((reservationRes.data as SupabaseReservationRow[] | null) || []).map(
        rowToReservation
      );

      setSales(mappedSales);
      setReservations(mappedReservations);
    } catch (error) {
      console.error("fetchAll error:", error);
      setSales([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    void fetchAll();
  }, [mounted]);

  const staffOptions = useMemo(() => {
    const names = Array.from(
      new Set([
        ...sales.map((item) => item.staff || "未設定"),
        ...reservations.map((item) => item.staff || "未設定"),
      ])
    ).sort((a, b) => a.localeCompare(b, "ja"));
    return ["全スタッフ", ...names];
  }, [sales, reservations]);

  const storeOptions = useMemo(() => {
    const names = Array.from(
      new Set([
        ...sales.map((item) => item.storeName || "未設定"),
        ...reservations.map((item) => item.storeName || "未設定"),
      ])
    ).sort((a, b) => a.localeCompare(b, "ja"));
    return ["全店舗", ...names];
  }, [sales, reservations]);

  const fromTime = useMemo(
    () => (dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity),
    [dateFrom]
  );
  const toTime = useMemo(
    () => (dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Infinity),
    [dateTo]
  );

  const applyMonthTab = (tab: MonthTab) => {
    setActiveMonthKey(tab.key);
    setDateFrom(tab.start);
    setDateTo(tab.end);
  };

  const firstReservationMap = useMemo(() => {
    const map = new Map<string, Reservation>();

    const sorted = [...reservations].sort((a, b) => {
      const aTime = new Date(`${a.date}T12:00:00`).getTime();
      const bTime = new Date(`${b.date}T12:00:00`).getTime();
      return aTime - bTime;
    });

    for (const reservation of sorted) {
      const key = buildCustomerKey({
        customerId: reservation.customerId,
        customerName: reservation.customerName,
      });
      if (!map.has(key)) {
        map.set(key, reservation);
      }
    }

    return map;
  }, [reservations]);

  const advanceSaleCustomerKeySet = useMemo(() => {
    const set = new Set<string>();

    for (const sale of sales) {
      if (sale.accountingType !== "前受金") continue;
      const key = buildCustomerKey({
        customerId: sale.customerId,
        customerName: sale.customerName,
      });
      set.add(key);
    }

    return set;
  }, [sales]);

  const customerRepeatMap = useMemo(() => {
    const map = new Map<string, { isNew: boolean; isRepeat: boolean }>();

    for (const reservation of reservations) {
      const customerKey = buildCustomerKey({
        customerId: reservation.customerId,
        customerName: reservation.customerName,
      });
      const firstReservation = firstReservationMap.get(customerKey);
      const isNew = !!firstReservation && String(firstReservation.id) === String(reservation.id);
      const isRepeat = advanceSaleCustomerKeySet.has(customerKey);
      map.set(`${customerKey}|${reservation.id}`, { isNew, isRepeat });
    }

    for (const sale of sales) {
      const customerKey = buildCustomerKey({
        customerId: sale.customerId,
        customerName: sale.customerName,
      });
      const isRepeat = advanceSaleCustomerKeySet.has(customerKey);
      const firstReservation = firstReservationMap.get(customerKey);
      const isNew = false;
      map.set(`sale|${sale.id}`, { isNew, isRepeat });
      if (firstReservation) {
        map.set(`${customerKey}|first`, {
          isNew: true,
          isRepeat,
        });
      }
    }

    return map;
  }, [reservations, sales, firstReservationMap, advanceSaleCustomerKeySet]);

  const matchesRepeatFilterByCustomer = (params: {
    customerId?: string | null;
    customerName?: string | null;
    reservationId?: string | number | null;
  }) => {
    if (repeatFilter === "all") return true;

    const customerKey = buildCustomerKey({
      customerId: params.customerId,
      customerName: params.customerName,
    });

    const firstReservation = firstReservationMap.get(customerKey);
    const isNew =
      !!firstReservation &&
      params.reservationId !== null &&
      params.reservationId !== undefined &&
      String(firstReservation.id) === String(params.reservationId);

    const isRepeat = advanceSaleCustomerKeySet.has(customerKey);

    if (repeatFilter === "new") return isNew;
    if (repeatFilter === "repeat") return isRepeat;
    return true;
  };

  const filteredSales = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const saleTime = new Date(`${sale.date}T12:00:00`).getTime();
      if (saleTime < fromTime || saleTime > toTime) return false;
      if (selectedStaff !== "全スタッフ" && sale.staff !== selectedStaff) return false;
      if (selectedStore !== "全店舗" && sale.storeName !== selectedStore) return false;

      if (saleTypeFilter === "normal" && sale.accountingType !== "通常売上") return false;
      if (saleTypeFilter === "advance" && sale.accountingType !== "前受金") return false;
      if (saleTypeFilter === "ticket" && sale.accountingType !== "回数券消化") return false;

      const nominationFee = parseNominationFee(sale.note);
      if (nominationOnly && nominationFee <= 0) return false;

      if (
        repeatFilter !== "all" &&
        !matchesRepeatFilterByCustomer({
          customerId: sale.customerId,
          customerName: sale.customerName,
          reservationId: sale.reservationId ?? null,
        })
      ) {
        if (repeatFilter === "repeat") {
          const customerKey = buildCustomerKey({
            customerId: sale.customerId,
            customerName: sale.customerName,
          });
          if (!advanceSaleCustomerKeySet.has(customerKey)) return false;
        } else {
          return false;
        }
      }

      if (!keyword) return true;

      return (
        sale.customerName.toLowerCase().includes(keyword) ||
        sale.staff.toLowerCase().includes(keyword) ||
        sale.storeName.toLowerCase().includes(keyword) ||
        sale.serviceType.toLowerCase().includes(keyword) ||
        sale.accountingType.toLowerCase().includes(keyword) ||
        sale.paymentMethod.toLowerCase().includes(keyword) ||
        sale.note.toLowerCase().includes(keyword) ||
        String(sale.reservationId || "").includes(keyword) ||
        sale.date.toLowerCase().includes(keyword)
      );
    });
  }, [
    sales,
    search,
    fromTime,
    toTime,
    selectedStaff,
    selectedStore,
    repeatFilter,
    saleTypeFilter,
    nominationOnly,
    advanceSaleCustomerKeySet,
    firstReservationMap,
  ]);

  const filteredReservations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const reservationTime = new Date(`${reservation.date}T12:00:00`).getTime();
      if (reservationTime < fromTime || reservationTime > toTime) return false;
      if (selectedStaff !== "全スタッフ" && reservation.staff !== selectedStaff) return false;
      if (selectedStore !== "全店舗" && reservation.storeName !== selectedStore) return false;

      if (
        repeatFilter !== "all" &&
        !matchesRepeatFilterByCustomer({
          customerId: reservation.customerId,
          customerName: reservation.customerName,
          reservationId: reservation.id,
        })
      ) {
        return false;
      }

      if (!keyword) return true;

      return (
        reservation.customerName.toLowerCase().includes(keyword) ||
        reservation.staff.toLowerCase().includes(keyword) ||
        reservation.storeName.toLowerCase().includes(keyword) ||
        reservation.status.toLowerCase().includes(keyword) ||
        reservation.date.toLowerCase().includes(keyword)
      );
    });
  }, [
    reservations,
    search,
    fromTime,
    toTime,
    selectedStaff,
    selectedStore,
    repeatFilter,
    advanceSaleCustomerKeySet,
    firstReservationMap,
  ]);

  const staffSummaries = useMemo(() => {
    const summaryMap = new Map<string, StaffSummary>();

    const ensureStaff = (staffName: string) => {
      const key = staffName || "未設定";
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          staff: key,
          reservationCount: 0,
          cancelCount: 0,
          noShowCount: 0,
          cancelBaseCount: 0,
          cancelRate: 0,
          newCount: 0,
          repeatCount: 0,
          repeatRate: 0,
          salesTotal: 0,
          normalTotal: 0,
          advanceTotal: 0,
          ticketTotal: 0,
          nominationTotal: 0,
          count: 0,
        });
      }
      return summaryMap.get(key)!;
    };

    for (const reservation of filteredReservations) {
      const target = ensureStaff(reservation.staff);
      target.reservationCount += 1;

      const cancelled = isCancelledStatus(reservation.status);
      const noShow = isNoShowStatus(reservation.status);
      const completed = isCompletedStatus(reservation.status);

      if (cancelled) target.cancelCount += 1;
      if (noShow) target.noShowCount += 1;

      const countAsBase =
        cancelBaseMode === "all_reservations"
          ? true
          : !completed;

      if (countAsBase) {
        target.cancelBaseCount += 1;
      }

      const customerKey = buildCustomerKey({
        customerId: reservation.customerId,
        customerName: reservation.customerName,
      });

      const firstReservation = firstReservationMap.get(customerKey);
      const isFirst =
        !!firstReservation && String(firstReservation.id) === String(reservation.id);

      if (isFirst) {
        target.newCount += 1;
        if (advanceSaleCustomerKeySet.has(customerKey)) {
          target.repeatCount += 1;
        }
      }
    }

    for (const sale of filteredSales) {
      const target = ensureStaff(sale.staff);
      target.count += 1;
      target.salesTotal += Number(sale.amount || 0);

      if (sale.accountingType === "通常売上") target.normalTotal += Number(sale.amount || 0);
      if (sale.accountingType === "前受金") target.advanceTotal += Number(sale.amount || 0);
      if (sale.accountingType === "回数券消化") target.ticketTotal += Number(sale.amount || 0);

      target.nominationTotal += parseNominationFee(sale.note);
    }

    const list = Array.from(summaryMap.values()).map((item) => ({
      ...item,
      cancelRate:
        item.cancelBaseCount > 0 ? (item.cancelCount / item.cancelBaseCount) * 100 : 0,
      repeatRate:
        item.newCount > 0 ? (item.repeatCount / item.newCount) * 100 : 0,
    }));

    return list.sort((a, b) => {
      if (sortKey === "reservationCount") return b.reservationCount - a.reservationCount;
      if (sortKey === "cancelRate") return b.cancelRate - a.cancelRate;
      if (sortKey === "repeatRate") return b.repeatRate - a.repeatRate;
      if (sortKey === "nominationTotal") return b.nominationTotal - a.nominationTotal;
      return b.salesTotal - a.salesTotal;
    });
  }, [
    filteredReservations,
    filteredSales,
    firstReservationMap,
    advanceSaleCustomerKeySet,
    sortKey,
    cancelBaseMode,
  ]);

  const detailRows = useMemo(() => {
    const rows: DetailRow[] = [];

    for (const sale of filteredSales) {
      const customerKey = buildCustomerKey({
        customerId: sale.customerId,
        customerName: sale.customerName,
      });

      const firstReservation = firstReservationMap.get(customerKey);
      const isNew =
        !!firstReservation &&
        sale.reservationId !== null &&
        sale.reservationId !== undefined &&
        String(firstReservation.id) === String(sale.reservationId);

      rows.push({
        kind: "sale",
        id: sale.id,
        date: sale.date,
        staff: sale.staff,
        customerName: sale.customerName,
        storeName: sale.storeName,
        reservationStatus: "",
        accountingType: sale.accountingType,
        paymentMethod: sale.paymentMethod,
        amount: sale.amount,
        nominationFee: parseNominationFee(sale.note),
        isRepeat: advanceSaleCustomerKeySet.has(customerKey),
        isNew,
        memo: sale.note || "",
        reservationId: sale.reservationId ?? null,
      });
    }

    for (const reservation of filteredReservations) {
      const customerKey = buildCustomerKey({
        customerId: reservation.customerId,
        customerName: reservation.customerName,
      });

      const firstReservation = firstReservationMap.get(customerKey);
      const isNew =
        !!firstReservation && String(firstReservation.id) === String(reservation.id);

      rows.push({
        kind: "reservation",
        id: reservation.id,
        date: reservation.date,
        staff: reservation.staff,
        customerName: reservation.customerName,
        storeName: reservation.storeName,
        reservationStatus: reservation.status,
        accountingType: "",
        paymentMethod: "",
        amount: 0,
        nominationFee: 0,
        isRepeat: advanceSaleCustomerKeySet.has(customerKey),
        isNew,
        memo: "",
        reservationId: Number(reservation.id),
      });
    }

    return rows.sort((a, b) => {
      const aTime = new Date(`${a.date}T12:00:00`).getTime();
      const bTime = new Date(`${b.date}T12:00:00`).getTime();
      return bTime - aTime;
    });
  }, [filteredSales, filteredReservations, advanceSaleCustomerKeySet, firstReservationMap]);

  const totalSales = useMemo(
    () => filteredSales.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [filteredSales]
  );

  const totalNomination = useMemo(
    () => filteredSales.reduce((sum, item) => sum + parseNominationFee(item.note), 0),
    [filteredSales]
  );

  const totalReservations = useMemo(() => filteredReservations.length, [filteredReservations]);

  const totalCancellations = useMemo(
    () => filteredReservations.filter((item) => isCancelledStatus(item.status)).length,
    [filteredReservations]
  );

  const totalNoShows = useMemo(
    () => filteredReservations.filter((item) => isNoShowStatus(item.status)).length,
    [filteredReservations]
  );

  const totalCancelBase = useMemo(
    () =>
      filteredReservations.filter((item) =>
        cancelBaseMode === "all_reservations" ? true : !isCompletedStatus(item.status)
      ).length,
    [filteredReservations, cancelBaseMode]
  );

  const totalCancelRate = useMemo(
    () => (totalCancelBase > 0 ? (totalCancellations / totalCancelBase) * 100 : 0),
    [totalCancelBase, totalCancellations]
  );

  const totalNewCount = useMemo(() => {
    let count = 0;
    for (const reservation of filteredReservations) {
      const customerKey = buildCustomerKey({
        customerId: reservation.customerId,
        customerName: reservation.customerName,
      });
      const firstReservation = firstReservationMap.get(customerKey);
      if (firstReservation && String(firstReservation.id) === String(reservation.id)) {
        count += 1;
      }
    }
    return count;
  }, [filteredReservations, firstReservationMap]);

  const totalRepeatCount = useMemo(() => {
    let count = 0;
    for (const reservation of filteredReservations) {
      const customerKey = buildCustomerKey({
        customerId: reservation.customerId,
        customerName: reservation.customerName,
      });
      const firstReservation = firstReservationMap.get(customerKey);
      const isFirst =
        !!firstReservation && String(firstReservation.id) === String(reservation.id);

      if (isFirst && advanceSaleCustomerKeySet.has(customerKey)) {
        count += 1;
      }
    }
    return count;
  }, [filteredReservations, firstReservationMap, advanceSaleCustomerKeySet]);

  const totalRepeatRate = useMemo(
    () => (totalNewCount > 0 ? (totalRepeatCount / totalNewCount) * 100 : 0),
    [totalNewCount, totalRepeatCount]
  );

  const exportCsv = () => {
    if (detailRows.length === 0) {
      alert("出力する明細がありません");
      return;
    }

    const rows = [
      [
        "種別",
        "日付",
        "スタッフ",
        "顧客名",
        "店舗",
        "予約ステータス",
        "会計区分",
        "支払方法",
        "金額",
        "指名料",
        "新規判定",
        "前受金リピート判定",
        "予約ID",
        "メモ",
      ]
        .map(toCsvValue)
        .join(","),
      ...detailRows.map((row) =>
        [
          row.kind === "sale" ? "売上" : "予約",
          row.date,
          row.staff,
          row.customerName,
          row.storeName,
          row.reservationStatus,
          row.accountingType,
          row.paymentMethod,
          row.amount,
          row.nominationFee,
          row.isNew ? "新規" : "",
          row.isRepeat ? "あり" : "",
          row.reservationId ?? "",
          row.memo.replace(/\n/g, " / "),
        ]
          .map(toCsvValue)
          .join(",")
      ),
    ];

    const bom = "\uFEFF";
    const blob = new Blob([bom + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      selectedStaff !== "全スタッフ"
        ? `staff_report_${selectedStaff}_${todayString()}.csv`
        : `staff_report_${todayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fixStaff = (staffName: string) => {
    setSelectedStaff(staffName);
    setStaffLocked(true);
  };

  const releaseStaffLock = () => {
    setSelectedStaff("全スタッフ");
    setStaffLocked(false);
  };

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #050816 0%, #0b1120 45%, #111827 100%)",
    padding: mobile ? "16px 12px 48px" : "24px 18px 60px",
  };

  const innerStyle: CSSProperties = {
    maxWidth: "1580px",
    margin: "0 auto",
    display: "grid",
    gap: "18px",
  };

  const cardStyle: CSSProperties = {
    background: "rgba(15,23,42,0.86)",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: "22px",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
    padding: mobile ? "16px" : "20px",
    backdropFilter: "blur(10px)",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: tablet ? "flex-start" : "center",
    flexDirection: tablet ? "column" : "row",
    gap: "14px",
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    color: "#f8fafc",
    fontSize: mobile ? "28px" : "36px",
    fontWeight: 900,
    letterSpacing: "0.02em",
    lineHeight: 1.1,
  };

  const subStyle: CSSProperties = {
    marginTop: "8px",
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: 1.7,
  };

  const topActionWrapStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  };

  const ghostLinkStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    height: "42px",
    padding: "0 14px",
    borderRadius: "12px",
    fontWeight: 800,
    border: "1px solid rgba(148,163,184,0.25)",
    color: "#e5e7eb",
    background: "rgba(15,23,42,0.7)",
  };

  const primaryButtonStyle: CSSProperties = {
    border: "none",
    borderRadius: "12px",
    height: "42px",
    padding: "0 16px",
    fontWeight: 900,
    color: "#111827",
    background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    cursor: "pointer",
  };

  const softButtonStyle: CSSProperties = {
    border: "1px solid rgba(148,163,184,0.22)",
    borderRadius: "12px",
    height: "42px",
    padding: "0 16px",
    fontWeight: 800,
    color: "#e5e7eb",
    background: "rgba(15,23,42,0.7)",
    cursor: "pointer",
  };

  const inputGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: mobile ? "1fr" : tablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
    gap: "12px",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    color: "#cbd5e1",
    fontWeight: 800,
    fontSize: "13px",
    marginBottom: "8px",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    height: "46px",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,6,23,0.7)",
    color: "#f8fafc",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const tabWrapStyle: CSSProperties = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "14px",
  };

  const getTabStyle = (active: boolean): CSSProperties => ({
    border: active ? "none" : "1px solid rgba(148,163,184,0.22)",
    borderRadius: "999px",
    minHeight: "40px",
    padding: "0 16px",
    fontWeight: 900,
    color: active ? "#111827" : "#e5e7eb",
    background: active
      ? "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
      : "rgba(15,23,42,0.7)",
    cursor: "pointer",
  });

  const pillStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    minHeight: "34px",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "rgba(245,158,11,0.15)",
    color: "#fde68a",
    fontWeight: 900,
    fontSize: "12px",
    border: "1px solid rgba(245,158,11,0.22)",
  };

  const statGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: mobile ? "1fr" : tablet ? "repeat(2, 1fr)" : "repeat(6, 1fr)",
    gap: "12px",
  };

  const statCardStyle: CSSProperties = {
    borderRadius: "18px",
    padding: "18px",
    background: "linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.82) 100%)",
    border: "1px solid rgba(148,163,184,0.18)",
  };

  const statLabelStyle: CSSProperties = {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "10px",
  };

  const statValueStyle: CSSProperties = {
    color: "#f8fafc",
    fontSize: mobile ? "24px" : "28px",
    fontWeight: 900,
    lineHeight: 1.1,
  };

  const statSubStyle: CSSProperties = {
    marginTop: "8px",
    color: "#cbd5e1",
    fontSize: "13px",
  };

  const sectionTitleStyle: CSSProperties = {
    margin: 0,
    color: "#f8fafc",
    fontSize: mobile ? "20px" : "24px",
    fontWeight: 900,
  };

  const sectionSubStyle: CSSProperties = {
    marginTop: "6px",
    color: "#94a3b8",
    fontSize: "13px",
  };

  const tableWrapStyle: CSSProperties = {
    overflowX: "auto",
    borderRadius: "18px",
    border: "1px solid rgba(148,163,184,0.16)",
    marginTop: "14px",
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: mobile ? "1320px" : "1600px",
    background: "rgba(2,6,23,0.58)",
  };

  const thStyle: CSSProperties = {
    textAlign: "left",
    padding: "14px 14px",
    fontSize: "12px",
    color: "#cbd5e1",
    fontWeight: 900,
    background: "rgba(30,41,59,0.85)",
    borderBottom: "1px solid rgba(148,163,184,0.15)",
    whiteSpace: "nowrap",
  };

  const tdStyle: CSSProperties = {
    padding: "14px 14px",
    color: "#f8fafc",
    fontSize: "13px",
    borderBottom: "1px solid rgba(148,163,184,0.10)",
    verticalAlign: "top",
  };

  const badgeStyle = (bg: string, color = "#111827"): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "82px",
    height: "28px",
    borderRadius: "999px",
    padding: "0 10px",
    fontSize: "12px",
    fontWeight: 900,
    color,
    background: bg,
  });

  if (!mounted) return null;

  return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <section style={cardStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>スタッフ管理・明細ページ 最終版</h1>
              <div style={subStyle}>
                売上・指名料・キャンセル率・前受金リピート率・新規/再来タブ・月別タブまで入れた完成版です。
              </div>
            </div>

            <div style={topActionWrapStyle}>
              <Link href="/dashboard" style={ghostLinkStyle}>
                ← ダッシュボード
              </Link>
              <Link href="/sales" style={ghostLinkStyle}>
                売上管理へ
              </Link>
              <button onClick={() => void fetchAll()} style={primaryButtonStyle}>
                最新に更新
              </button>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={sectionTitleStyle}>月別タブ</h2>
            <div style={sectionSubStyle}>
              今月・前月などをワンタップで切り替えできます。
            </div>
          </div>

          <div style={tabWrapStyle}>
            {monthTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => applyMonthTab(tab)}
                style={getTabStyle(activeMonthKey === tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "14px" }}>
            <h2 style={sectionTitleStyle}>新規 / 再来 タブ</h2>
            <div style={sectionSubStyle}>
              前受金ありを再来判定として、新規だけ・再来だけに切り替えできます。
            </div>
          </div>

          <div style={tabWrapStyle}>
            <button
              onClick={() => setRepeatFilter("all")}
              style={getTabStyle(repeatFilter === "all")}
            >
              全員
            </button>
            <button
              onClick={() => setRepeatFilter("new")}
              style={getTabStyle(repeatFilter === "new")}
            >
              新規だけ
            </button>
            <button
              onClick={() => setRepeatFilter("repeat")}
              style={getTabStyle(repeatFilter === "repeat")}
            >
              再来だけ
            </button>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <h2 style={sectionTitleStyle}>売上区分タブ</h2>
            <div style={sectionSubStyle}>
              通常売上・前受金・回数券消化だけで絞れます。
            </div>
          </div>

          <div style={tabWrapStyle}>
            <button
              onClick={() => setSaleTypeFilter("all")}
              style={getTabStyle(saleTypeFilter === "all")}
            >
              全部
            </button>
            <button
              onClick={() => setSaleTypeFilter("normal")}
              style={getTabStyle(saleTypeFilter === "normal")}
            >
              通常売上
            </button>
            <button
              onClick={() => setSaleTypeFilter("advance")}
              style={getTabStyle(saleTypeFilter === "advance")}
            >
              前受金
            </button>
            <button
              onClick={() => setSaleTypeFilter("ticket")}
              style={getTabStyle(saleTypeFilter === "ticket")}
            >
              回数券消化
            </button>
          </div>

          <div style={inputGridStyle}>
            <div>
              <label style={labelStyle}>開始日</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setActiveMonthKey("");
                  setDateFrom(e.target.value);
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>終了日</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setActiveMonthKey("");
                  setDateTo(e.target.value);
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>スタッフ</label>
              <select
                value={selectedStaff}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedStaff(value);
                  setStaffLocked(value !== "全スタッフ");
                }}
                style={inputStyle}
              >
                {staffOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>店舗</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                style={inputStyle}
              >
                {storeOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>検索</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="顧客名・スタッフ・メモなど"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>キャンセル率の分母</label>
              <select
                value={cancelBaseMode}
                onChange={(e) => setCancelBaseMode(e.target.value as CancelBaseMode)}
                style={inputStyle}
              >
                <option value="all_reservations">全予約を分母</option>
                <option value="exclude_completed">売上済を分母から除外</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>並び順</label>
              <select
                value={sortKey}
                onChange={(e) =>
                  setSortKey(
                    e.target.value as
                      | "salesTotal"
                      | "reservationCount"
                      | "cancelRate"
                      | "repeatRate"
                      | "nominationTotal"
                  )
                }
                style={inputStyle}
              >
                <option value="salesTotal">売上順</option>
                <option value="reservationCount">予約数順</option>
                <option value="cancelRate">キャンセル率順</option>
                <option value="repeatRate">リピート率順</option>
                <option value="nominationTotal">指名料順</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>CSV出力</label>
              <button onClick={exportCsv} style={{ ...primaryButtonStyle, width: "100%" }}>
                明細CSV出力
              </button>
            </div>
          </div>

          <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <label style={{ ...pillStyle, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={nominationOnly}
                onChange={(e) => setNominationOnly(e.target.checked)}
              />
              指名ありだけ表示
            </label>

            {staffLocked && selectedStaff !== "全スタッフ" ? (
              <>
                <span style={pillStyle}>固定表示: {selectedStaff}</span>
                <button onClick={releaseStaffLock} style={softButtonStyle}>
                  固定を解除
                </button>
              </>
            ) : null}
          </div>
        </section>

        <section style={statGridStyle}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>売上合計</div>
            <div style={statValueStyle}>{formatCurrency(totalSales)}</div>
            <div style={statSubStyle}>絞り込み後の売上明細合計</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>指名料合計</div>
            <div style={statValueStyle}>{formatCurrency(totalNomination)}</div>
            <div style={statSubStyle}>指名あり売上の合計</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>総予約数</div>
            <div style={statValueStyle}>{totalReservations.toLocaleString()}件</div>
            <div style={statSubStyle}>期間内の予約件数</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>キャンセル率</div>
            <div style={statValueStyle}>{formatPercent(totalCancelRate)}</div>
            <div style={statSubStyle}>
              {totalCancellations.toLocaleString()} / {totalCancelBase.toLocaleString()}
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>無断キャンセル</div>
            <div style={statValueStyle}>{totalNoShows.toLocaleString()}件</div>
            <div style={statSubStyle}>無断を含む予約件数</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>前受金リピート率</div>
            <div style={statValueStyle}>{formatPercent(totalRepeatRate)}</div>
            <div style={statSubStyle}>
              {totalRepeatCount.toLocaleString()} / {totalNewCount.toLocaleString()}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div>
            <h2 style={sectionTitleStyle}>スタッフ別まとめ</h2>
            <div style={sectionSubStyle}>
              行を押すと、そのスタッフだけに固定表示されます。
            </div>
          </div>

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>スタッフ</th>
                  <th style={thStyle}>売上件数</th>
                  <th style={thStyle}>売上合計</th>
                  <th style={thStyle}>通常売上</th>
                  <th style={thStyle}>前受金</th>
                  <th style={thStyle}>回数券消化</th>
                  <th style={thStyle}>指名料合計</th>
                  <th style={thStyle}>総予約数</th>
                  <th style={thStyle}>キャンセル数</th>
                  <th style={thStyle}>無断キャンセル</th>
                  <th style={thStyle}>キャンセル率</th>
                  <th style={thStyle}>新規数</th>
                  <th style={thStyle}>前受金リピート数</th>
                  <th style={thStyle}>リピート率</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={tdStyle} colSpan={14}>
                      読み込み中です...
                    </td>
                  </tr>
                ) : staffSummaries.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={14}>
                      データがありません
                    </td>
                  </tr>
                ) : (
                  staffSummaries.map((row) => (
                    <tr
                      key={row.staff}
                      onClick={() => fixStaff(row.staff)}
                      style={{
                        cursor: "pointer",
                        background:
                          selectedStaff !== "全スタッフ" && selectedStaff === row.staff
                            ? "rgba(245,158,11,0.10)"
                            : "transparent",
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{row.staff}</td>
                      <td style={tdStyle}>{row.count.toLocaleString()}件</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{formatCurrency(row.salesTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.normalTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.advanceTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.ticketTotal)}</td>
                      <td style={{ ...tdStyle, color: "#fbbf24", fontWeight: 900 }}>
                        {formatCurrency(row.nominationTotal)}
                      </td>
                      <td style={tdStyle}>{row.reservationCount.toLocaleString()}件</td>
                      <td style={tdStyle}>{row.cancelCount.toLocaleString()}件</td>
                      <td style={tdStyle}>{row.noShowCount.toLocaleString()}件</td>
                      <td style={tdStyle}>{formatPercent(row.cancelRate)}</td>
                      <td style={tdStyle}>{row.newCount.toLocaleString()}人</td>
                      <td style={tdStyle}>{row.repeatCount.toLocaleString()}人</td>
                      <td style={tdStyle}>{formatPercent(row.repeatRate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={cardStyle}>
          <div>
            <h2 style={sectionTitleStyle}>
              明細一覧 {selectedStaff !== "全スタッフ" ? `- ${selectedStaff}` : ""}
            </h2>
            <div style={sectionSubStyle}>
              予約も売上も同じ一覧で見れます。Excelに貼る元データとしてそのまま使えます。
            </div>
          </div>

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>種別</th>
                  <th style={thStyle}>日付</th>
                  <th style={thStyle}>スタッフ</th>
                  <th style={thStyle}>顧客名</th>
                  <th style={thStyle}>店舗</th>
                  <th style={thStyle}>予約ステータス</th>
                  <th style={thStyle}>会計区分</th>
                  <th style={thStyle}>支払方法</th>
                  <th style={thStyle}>金額</th>
                  <th style={thStyle}>指名料</th>
                  <th style={thStyle}>新規判定</th>
                  <th style={thStyle}>前受金リピート判定</th>
                  <th style={thStyle}>予約ID</th>
                  <th style={thStyle}>メモ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={tdStyle} colSpan={14}>
                      読み込み中です...
                    </td>
                  </tr>
                ) : detailRows.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={14}>
                      該当データがありません
                    </td>
                  </tr>
                ) : (
                  detailRows.map((row) => (
                    <tr key={`${row.kind}-${row.id}`}>
                      <td style={tdStyle}>
                        {row.kind === "sale" ? (
                          <span style={badgeStyle("#86efac")}>売上</span>
                        ) : (
                          <span style={badgeStyle("#93c5fd")}>予約</span>
                        )}
                      </td>
                      <td style={tdStyle}>{formatDateJP(row.date)}</td>
                      <td style={tdStyle}>{row.staff}</td>
                      <td style={tdStyle}>{row.customerName}</td>
                      <td style={tdStyle}>{row.storeName}</td>
                      <td style={tdStyle}>
                        {row.reservationStatus ? (
                          isCancelledStatus(row.reservationStatus) || isNoShowStatus(row.reservationStatus) ? (
                            <span style={badgeStyle("#fecaca")}>{row.reservationStatus}</span>
                          ) : isCompletedStatus(row.reservationStatus) ? (
                            <span style={badgeStyle("#86efac")}>{row.reservationStatus}</span>
                          ) : (
                            <span style={badgeStyle("#cbd5e1")}>{row.reservationStatus}</span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={tdStyle}>
                        {row.accountingType ? (
                          row.accountingType === "前受金" ? (
                            <span style={badgeStyle("#fcd34d")}>前受金</span>
                          ) : row.accountingType === "回数券消化" ? (
                            <span style={badgeStyle("#a5b4fc")}>回数券消化</span>
                          ) : (
                            <span style={badgeStyle("#86efac")}>通常売上</span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={tdStyle}>{row.paymentMethod || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>
                        {row.kind === "sale" ? formatCurrency(row.amount) : "—"}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: row.nominationFee > 0 ? "#fbbf24" : "#f8fafc",
                          fontWeight: 900,
                        }}
                      >
                        {row.nominationFee > 0 ? formatCurrency(row.nominationFee) : "—"}
                      </td>
                      <td style={tdStyle}>
                        {row.isNew ? <span style={badgeStyle("#bfdbfe")}>新規</span> : "—"}
                      </td>
                      <td style={tdStyle}>
                        {row.isRepeat ? <span style={badgeStyle("#fde68a")}>あり</span> : "—"}
                      </td>
                      <td style={tdStyle}>{row.reservationId ?? "—"}</td>
                      <td style={{ ...tdStyle, whiteSpace: "pre-wrap", minWidth: "260px" }}>
                        {row.memo || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}