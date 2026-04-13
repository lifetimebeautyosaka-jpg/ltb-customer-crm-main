"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";

type Customer = {
  id: string | number;
  name: string;
  phone?: string | null;
};

type ServiceType = "ストレッチ" | "トレーニング";
type AccountingType = "通常売上" | "前受金" | "回数券消化";
type PaymentMethod = "現金" | "カード" | "銀行振込" | "その他";

type SaleCategory =
  | "ストレッチ現金"
  | "ストレッチカード"
  | "ストレッチ銀行振込"
  | "ストレッチその他"
  | "ストレッチ前受金"
  | "ストレッチ回数券消化"
  | "トレーニング現金"
  | "トレーニングカード"
  | "トレーニング銀行振込"
  | "トレーニングその他"
  | "トレーニング前受金"
  | "トレーニング回数券消化";

type PaymentRow = {
  id: string;
  saleType: AccountingType;
  paymentMethod: PaymentMethod;
  amount: string;
};

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
  category: SaleCategory;
  note: string;
  createdAt: string;
  reservationId?: number | null;
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

type ReservationPrefillRow = {
  id: number | string;
  customer_id?: number | string | null;
  customer_name?: string | null;
  date?: string | null;
  menu?: string | null;
  staff_name?: string | null;
  store_name?: string | null;
  payment_method?: string | null;
  memo?: string | null;
  reservation_status?: string | null;
};

type TicketRow = {
  id: number | string;
  customer_id: number | string | null;
  customer_name: string | null;
  ticket_name: string | null;
  service_type: ServiceType;
  total_count: number | null;
  remaining_count: number | null;
  purchase_date: string | null;
  expiry_date: string | null;
  status: string | null;
  note: string | null;
  created_at: string | null;
};

type TicketUsageRow = {
  id: number | string;
  reservation_id: number | null;
  ticket_id: number | string | null;
  customer_id: number | null;
  customer_name: string | null;
  ticket_name: string | null;
  service_type: ServiceType | null;
  used_date: string | null;
  before_count: number | null;
  after_count: number | null;
};

type DailySummaryRow = {
  date: string;
  stretchCash: number;
  stretchCard: number;
  stretchReceived: number;
  stretchTicket: number;
  trainingCash: number;
  trainingCard: number;
  trainingReceived: number;
  trainingTicket: number;
  netSalesTotal: number;
  advanceCash: number;
  advanceCard: number;
  advanceTotal: number;
  grandTotal: number;
};

type TicketConsumeResult = {
  ticketId: number | string;
  ticketName: string;
  beforeCount: number;
  afterCount: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  "未設定",
];

const STORE_OPTIONS = [
  "江戸堀",
  "箕面",
  "福島",
  "福島P",
  "天満橋",
  "中崎町",
  "未設定",
];

const PAYMENT_OPTIONS: PaymentMethod[] = ["現金", "カード", "銀行振込", "その他"];
const ACCOUNTING_OPTIONS: AccountingType[] = ["通常売上", "前受金", "回数券消化"];
const SERVICE_OPTIONS: ServiceType[] = ["ストレッチ", "トレーニング"];

function formatCurrency(value: number) {
  return `¥${Number(value || 0).toLocaleString()}`;
}

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateJP(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function trimmed(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[‐-‒–—―ー－]/g, "-")
    .toLowerCase();
}

function buildCategory(
  serviceType: ServiceType,
  accountingType: AccountingType,
  paymentMethod: PaymentMethod
): SaleCategory {
  if (accountingType === "前受金") {
    return serviceType === "ストレッチ"
      ? "ストレッチ前受金"
      : "トレーニング前受金";
  }

  if (accountingType === "回数券消化") {
    return serviceType === "ストレッチ"
      ? "ストレッチ回数券消化"
      : "トレーニング回数券消化";
  }

  if (serviceType === "ストレッチ") {
    if (paymentMethod === "現金") return "ストレッチ現金";
    if (paymentMethod === "カード") return "ストレッチカード";
    if (paymentMethod === "銀行振込") return "ストレッチ銀行振込";
    return "ストレッチその他";
  }

  if (paymentMethod === "現金") return "トレーニング現金";
  if (paymentMethod === "カード") return "トレーニングカード";
  if (paymentMethod === "銀行振込") return "トレーニング銀行振込";
  return "トレーニングその他";
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

function rowToSale(row: SupabaseSaleRow): Sale {
  const serviceType = normalizeServiceType(row.menu_type);
  const accountingType = normalizeAccountingType(row.sale_type);
  const paymentMethod = normalizePaymentMethod(row.payment_method);
  const amount = Number(row.amount || 0);

  return {
    id: String(row.id),
    date: row.sale_date || todayString(),
    customerId:
      row.customer_id === null || row.customer_id === undefined
        ? null
        : String(row.customer_id),
    customerName: row.customer_name || "未設定",
    menuName: serviceType === "ストレッチ" ? "ストレッチ" : "トレーニング",
    staff: row.staff_name || "未設定",
    storeName: row.store_name || "未設定",
    serviceType,
    accountingType,
    paymentMethod,
    amount,
    category: buildCategory(serviceType, accountingType, paymentMethod),
    note: row.memo || "",
    createdAt: row.created_at || new Date().toISOString(),
    reservationId: row.reservation_id ?? null,
  };
}

function createPaymentRow(): PaymentRow {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random()),
    saleType: "通常売上",
    paymentMethod: "現金",
    amount: "",
  };
}

function getQueryParam(name: string) {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

function detectServiceTypeFromMenu(menu?: string | null): ServiceType {
  const text = String(menu || "");
  if (text.includes("ストレッチ")) return "ストレッチ";
  return "トレーニング";
}

function toCsvValue(value: string | number) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildDailySummaryRows(sales: Sale[]): DailySummaryRow[] {
  const grouped: Record<string, DailySummaryRow> = {};

  sales.forEach((sale) => {
    const date = sale.date || todayString();

    if (!grouped[date]) {
      grouped[date] = {
        date,
        stretchCash: 0,
        stretchCard: 0,
        stretchReceived: 0,
        stretchTicket: 0,
        trainingCash: 0,
        trainingCard: 0,
        trainingReceived: 0,
        trainingTicket: 0,
        netSalesTotal: 0,
        advanceCash: 0,
        advanceCard: 0,
        advanceTotal: 0,
        grandTotal: 0,
      };
    }

    const amount = Number(sale.amount || 0);
    const isAdvance = sale.accountingType === "前受金";
    const isTicket = sale.accountingType === "回数券消化";

    if (isAdvance) {
      if (sale.paymentMethod === "現金") {
        grouped[date].advanceCash += amount;
      } else {
        grouped[date].advanceCard += amount;
      }
      return;
    }

    if (isTicket) {
      if (sale.serviceType === "ストレッチ") {
        grouped[date].stretchTicket += amount;
      } else {
        grouped[date].trainingTicket += amount;
      }
      return;
    }

    if (sale.serviceType === "ストレッチ") {
      if (sale.paymentMethod === "現金") {
        grouped[date].stretchCash += amount;
      } else if (sale.paymentMethod === "その他") {
        grouped[date].stretchReceived += amount;
      } else {
        grouped[date].stretchCard += amount;
      }
    } else {
      if (sale.paymentMethod === "現金") {
        grouped[date].trainingCash += amount;
      } else if (sale.paymentMethod === "その他") {
        grouped[date].trainingReceived += amount;
      } else {
        grouped[date].trainingCard += amount;
      }
    }
  });

  return Object.values(grouped)
    .map((row) => {
      const netSalesTotal =
        row.stretchCash +
        row.stretchCard +
        row.stretchReceived +
        row.stretchTicket +
        row.trainingCash +
        row.trainingCard +
        row.trainingReceived +
        row.trainingTicket;

      const advanceTotal = row.advanceCash + row.advanceCard;
      const grandTotal = netSalesTotal + advanceTotal;

      return {
        ...row,
        netSalesTotal,
        advanceTotal,
        grandTotal,
      };
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

function findCustomerByFlexibleMatch(
  customerList: Customer[],
  params: {
    customerId?: string;
    customerName?: string;
    phone?: string;
  }
): Customer | null {
  const id = trimmed(params.customerId);
  const name = trimmed(params.customerName);
  const phone = trimmed(params.phone).replace(/[^\d]/g, "");

  if (id) {
    const byId = customerList.find((c) => String(c.id) === id);
    if (byId) return byId;
  }

  if (name) {
    const normalizedName = normalizeText(name);

    const exact = customerList.find((c) => normalizeText(c.name) === normalizedName);
    if (exact) return exact;

    const partial = customerList.find((c) => {
      const target = normalizeText(c.name);
      return target.includes(normalizedName) || normalizedName.includes(target);
    });
    if (partial) return partial;
  }

  if (phone) {
    const byPhone = customerList.find((c) => {
      const p = trimmed(c.phone).replace(/[^\d]/g, "");
      return !!p && p === phone;
    });
    if (byPhone) return byPhone;
  }

  return null;
}

function mergeNoteLines(current: string, lines: Array<string | null | undefined>) {
  const baseLines = current
    .split("\n")
    .map((line) => trimmed(line))
    .filter(Boolean);

  const merged = [...baseLines];
  const exists = new Set(baseLines);

  for (const line of lines) {
    const v = trimmed(line);
    if (!v) continue;
    if (exists.has(v)) continue;
    merged.push(v);
    exists.add(v);
  }

  return merged.join("\n");
}

async function consumeCustomerTicket(params: {
  customerId: string;
  customerName: string;
  serviceType: ServiceType;
  usedDate: string;
  reservationId?: string;
}): Promise<TicketConsumeResult> {
  const { customerId, customerName, serviceType, usedDate, reservationId } = params;

  const { data: ticketData, error: ticketError } = await supabase
    .from("customer_tickets")
    .select(
      "id, customer_id, customer_name, ticket_name, service_type, total_count, remaining_count, purchase_date, expiry_date, status, note, created_at"
    )
    .eq("customer_id", Number(customerId))
    .eq("service_type", serviceType)
    .gt("remaining_count", 0)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (ticketError) {
    throw new Error(`回数券取得エラー: ${ticketError.message}`);
  }

  const target = ticketData as TicketRow | null;

  if (!target) {
    throw new Error(`${serviceType}の利用可能な回数券がありません`);
  }

  const beforeCount = Number(target.remaining_count || 0);

  if (beforeCount <= 0) {
    throw new Error("回数券の残数がありません");
  }

  const afterCount = beforeCount - 1;

  const { error: updateError } = await supabase
    .from("customer_tickets")
    .update({
      remaining_count: afterCount,
      status: afterCount <= 0 ? "消化済み" : "利用中",
    })
    .eq("id", target.id);

  if (updateError) {
    throw new Error(`回数券更新エラー: ${updateError.message}`);
  }

  const { error: usageError } = await supabase.from("ticket_usages").insert([
    {
      reservation_id: reservationId ? Number(reservationId) : null,
      ticket_id: target.id,
      customer_id: Number(customerId),
      customer_name: customerName,
      ticket_name: target.ticket_name || "回数券",
      service_type: serviceType,
      used_date: usedDate || null,
      before_count: beforeCount,
      after_count: afterCount,
    },
  ]);

  if (usageError) {
    await supabase
      .from("customer_tickets")
      .update({
        remaining_count: beforeCount,
        status: target.status || "利用中",
      })
      .eq("id", target.id);

    throw new Error(`消化履歴登録エラー: ${usageError.message}`);
  }

  return {
    ticketId: target.id,
    ticketName: target.ticket_name || "回数券",
    beforeCount,
    afterCount,
  };
}

async function rollbackConsumedTicket(params: {
  ticketId: number | string;
  beforeCount: number;
  reservationId?: string;
}) {
  const { ticketId, beforeCount, reservationId } = params;

  await supabase
    .from("customer_tickets")
    .update({
      remaining_count: beforeCount,
      status: "利用中",
    })
    .eq("id", ticketId);

  if (reservationId) {
    await supabase
      .from("ticket_usages")
      .delete()
      .eq("ticket_id", ticketId)
      .eq("reservation_id", Number(reservationId))
      .eq("before_count", beforeCount);
  }
}

async function restoreTicketUsageFromDeletedSale(params: {
  sale: Sale;
}): Promise<void> {
  const { sale } = params;

  if (sale.accountingType !== "回数券消化") return;
  if (!sale.customerId) return;

  let usageQuery = supabase
    .from("ticket_usages")
    .select(
      "id, reservation_id, ticket_id, customer_id, customer_name, ticket_name, service_type, used_date, before_count, after_count"
    )
    .eq("customer_id", Number(sale.customerId))
    .eq("service_type", sale.serviceType)
    .order("id", { ascending: false })
    .limit(1);

  if (sale.reservationId) {
    usageQuery = usageQuery.eq("reservation_id", Number(sale.reservationId));
  } else {
    usageQuery = usageQuery.eq("used_date", sale.date);
  }

  const { data: usageData, error: usageError } = await usageQuery.maybeSingle();

  if (usageError) {
    throw new Error(`回数券消化履歴取得エラー: ${usageError.message}`);
  }

  const usage = usageData as TicketUsageRow | null;

  if (!usage) {
    throw new Error("回数券消化履歴が見つからないため、残数を戻せませんでした");
  }

  if (!usage.ticket_id) {
    throw new Error("ticket_usages に ticket_id がないため、残数を戻せませんでした");
  }

  const beforeCount = Number(usage.before_count ?? 0);
  const afterCount = Number(usage.after_count ?? 0);
  const nextStatus = beforeCount <= 0 ? "消化済み" : "利用中";

  const { error: ticketRestoreError } = await supabase
    .from("customer_tickets")
    .update({
      remaining_count: beforeCount,
      status: nextStatus,
    })
    .eq("id", usage.ticket_id);

  if (ticketRestoreError) {
    throw new Error(`回数券戻しエラー: ${ticketRestoreError.message}`);
  }

  const { error: usageDeleteError } = await supabase
    .from("ticket_usages")
    .delete()
    .eq("id", usage.id);

  if (usageDeleteError) {
    await supabase
      .from("customer_tickets")
      .update({
        remaining_count: afterCount,
        status: afterCount <= 0 ? "消化済み" : "利用中",
      })
      .eq("id", usage.ticket_id);

    throw new Error(`回数券消化履歴削除エラー: ${usageDeleteError.message}`);
  }
}

export default function SalesPage() {
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [date, setDate] = useState(todayString());
  const [customerId, setCustomerId] = useState("");
  const [menuName, setMenuName] = useState("");
  const [staff, setStaff] = useState(STAFF_OPTIONS[0]);
  const [storeName, setStoreName] = useState(STORE_OPTIONS[0]);
  const [serviceType, setServiceType] = useState<ServiceType>("トレーニング");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [reservationStatus, setReservationStatus] = useState("");
  const [existingSalesForReservation, setExistingSalesForReservation] = useState<Sale[]>([]);

  const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow()]);

  const [loading, setLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);

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

  const compact = windowWidth < 900;
  const tablet = windowWidth < 1180;
  const mobile = windowWidth < 768;

  const applyQueryParams = (customerList: Customer[]) => {
    const queryFrom = getQueryParam("from");
    const querySignupId = getQueryParam("signup_id");

    const queryDate = getQueryParam("date");
    const queryCustomerId = getQueryParam("customerId") || getQueryParam("customer_id");
    const queryCustomerName =
      getQueryParam("customerName") ||
      getQueryParam("customer_name") ||
      getQueryParam("customer");

    const queryCustomerKana =
      getQueryParam("customer_kana") ||
      getQueryParam("full_name_kana") ||
      getQueryParam("kana");

    const queryPhone = getQueryParam("phone");
    const queryEmail = getQueryParam("email");

    const queryStore =
      getQueryParam("storeName") ||
      getQueryParam("store_name") ||
      getQueryParam("store");

    const queryStaff =
      getQueryParam("staffName") ||
      getQueryParam("staff_name") ||
      getQueryParam("staff");

    const queryService =
      getQueryParam("serviceType") ||
      getQueryParam("service_type") ||
      getQueryParam("service") ||
      getQueryParam("menu_type");

    const queryMenu =
      getQueryParam("menu") ||
      getQueryParam("menu_name") ||
      getQueryParam("plan_name");

    const queryPaymentMethod =
      getQueryParam("paymentMethod") || getQueryParam("payment_method");

    const queryReservationId =
      getQueryParam("reservationId") || getQueryParam("reservation_id");

    const querySaleType =
      getQueryParam("saleType") || getQueryParam("sale_type");

    const queryAmount = getQueryParam("amount");
    const queryMemo = getQueryParam("memo");

    if (queryDate) setDate(queryDate);
    if (queryStore) setStoreName(queryStore);
    if (queryStaff) setStaff(queryStaff);
    if (queryMenu) setMenuName(queryMenu);
    if (queryReservationId) setReservationId(queryReservationId);

    if (queryService === "ストレッチ" || queryService === "トレーニング") {
      setServiceType(queryService);
    } else if (queryMenu) {
      setServiceType(detectServiceTypeFromMenu(queryMenu));
    }

    const normalizedSaleType: AccountingType =
      querySaleType === "前受金" ||
      querySaleType === "回数券消化" ||
      querySaleType === "通常売上"
        ? querySaleType
        : "通常売上";

    const normalizedPayment = normalizePaymentMethod(queryPaymentMethod || "現金");

    setPayments((prev) =>
      prev.map((row, index) => {
        if (index !== 0) return row;

        return {
          ...row,
          saleType: normalizedSaleType,
          paymentMethod: normalizedSaleType === "回数券消化" ? "その他" : normalizedPayment,
          amount:
            normalizedSaleType === "回数券消化"
              ? "0"
              : queryAmount
              ? String(queryAmount)
              : row.amount,
        };
      })
    );

    const matched = findCustomerByFlexibleMatch(customerList, {
      customerId: queryCustomerId,
      customerName: queryCustomerName,
      phone: queryPhone,
    });

    if (matched) {
      setCustomerId(String(matched.id));
    } else if (queryCustomerId) {
      setCustomerId(String(queryCustomerId));
    }

    const lines = [
      queryFrom ? `流入元: ${queryFrom}` : "",
      querySignupId ? `signup_id: ${querySignupId}` : "",
      queryCustomerName ? `申込氏名: ${queryCustomerName}` : "",
      queryCustomerKana ? `申込氏名カナ: ${queryCustomerKana}` : "",
      queryPhone ? `申込電話番号: ${queryPhone}` : "",
      queryEmail ? `申込メール: ${queryEmail}` : "",
      queryMenu ? `申込メニュー: ${queryMenu}` : "",
      queryAmount ? `申込金額: ${queryAmount}` : "",
      queryMemo ? `申込メモ: ${queryMemo}` : "",
    ];

    setNote((prev) => mergeNoteLines(prev, lines));
  };

  const fetchCustomers = async () => {
    try {
      setCustomerLoading(true);

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .order("name", { ascending: true });

      if (error) {
        alert(`顧客取得エラー: ${error.message}`);
        setCustomers([]);
        return;
      }

      const list = ((data as Customer[] | null) || []).map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone || null,
      }));

      setCustomers(list);
      applyQueryParams(list);
    } catch (error) {
      console.error("fetchCustomers error:", error);
      setCustomers([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("sales")
        .select(
          "id, customer_id, customer_name, sale_date, menu_type, sale_type, payment_method, amount, staff_name, store_name, reservation_id, memo, created_at"
        )
        .order("sale_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        alert(`売上取得エラー: ${error.message}`);
        setSales([]);
        return;
      }

      const mapped = ((data as SupabaseSaleRow[] | null) || []).map(rowToSale);
      setSales(mapped);
    } catch (error) {
      console.error("fetchSales error:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReservationForPrefill = async (id: string) => {
    if (!id) return;

    try {
      setPrefillLoading(true);

      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, customer_id, customer_name, date, menu, staff_name, store_name, payment_method, memo, reservation_status"
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.warn("reservation prefill error:", error.message);
        return;
      }

      const row = data as ReservationPrefillRow | null;
      if (!row) return;

      if (row.date) setDate(row.date);

      if (row.customer_id !== null && row.customer_id !== undefined) {
        setCustomerId(String(row.customer_id));
      }

      if (row.menu) {
        setMenuName(row.menu);
        setServiceType(detectServiceTypeFromMenu(row.menu));
      }

      if (row.staff_name) setStaff(row.staff_name);
      if (row.store_name) setStoreName(row.store_name);
      if (row.reservation_status) setReservationStatus(row.reservation_status);

      if (row.payment_method) {
        const normalized = normalizePaymentMethod(row.payment_method);
        setPayments((prev) =>
          prev.map((payment, index) =>
            index === 0 ? { ...payment, paymentMethod: normalized } : payment
          )
        );
      }

      const noteLines = [
        row.customer_name ? `予約顧客: ${row.customer_name}` : "",
        row.memo ? `予約メモ: ${row.memo}` : "",
      ];

      setNote((prev) => mergeNoteLines(prev, noteLines));
    } catch (error) {
      console.error("loadReservationForPrefill error:", error);
    } finally {
      setPrefillLoading(false);
    }
  };

  const loadExistingSalesForReservation = async (id: string) => {
    if (!id) {
      setExistingSalesForReservation([]);
      return;
    }

    const { data, error } = await supabase
      .from("sales")
      .select(
        "id, customer_id, customer_name, sale_date, menu_type, sale_type, payment_method, amount, staff_name, store_name, reservation_id, memo, created_at"
      )
      .eq("reservation_id", Number(id))
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("existing sales check error:", error.message);
      setExistingSalesForReservation([]);
      return;
    }

    setExistingSalesForReservation(
      ((data as SupabaseSaleRow[] | null) || []).map(rowToSale)
    );
  };

  useEffect(() => {
    if (!mounted) return;
    void fetchCustomers();
    void fetchSales();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (!reservationId) return;
    void loadReservationForPrefill(reservationId);
    void loadExistingSalesForReservation(reservationId);
  }, [mounted, reservationId]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === customerId);
  }, [customers, customerId]);

  const totalAmount = useMemo(() => {
    return payments.reduce((sum, row) => {
      if (row.saleType === "回数券消化") return sum;
      return sum + Number(row.amount || 0);
    }, 0);
  }, [payments]);

  const filteredSales = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const sorted = [...sales].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return bTime - aTime;
    });

    if (!keyword) return sorted;

    return sorted.filter((sale) => {
      return (
        sale.customerName.toLowerCase().includes(keyword) ||
        sale.menuName.toLowerCase().includes(keyword) ||
        sale.staff.toLowerCase().includes(keyword) ||
        sale.category.toLowerCase().includes(keyword) ||
        sale.date.toLowerCase().includes(keyword) ||
        sale.storeName.toLowerCase().includes(keyword) ||
        sale.paymentMethod.toLowerCase().includes(keyword) ||
        String(sale.reservationId || "").includes(keyword) ||
        sale.note.toLowerCase().includes(keyword)
      );
    });
  }, [sales, search]);

  const monthlyTotals = useMemo(() => {
    const grouped: Record<string, number> = {};

    sales.forEach((sale) => {
      const month = (sale.date || "").slice(0, 7);
      if (!month) return;
      grouped[month] = (grouped[month] || 0) + Number(sale.amount || 0);
    });

    return Object.entries(grouped).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [sales]);

  const staffTotals = useMemo(() => {
    const grouped: Record<string, number> = {};

    sales.forEach((sale) => {
      const key = sale.staff || "未設定";
      grouped[key] = (grouped[key] || 0) + Number(sale.amount || 0);
    });

    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [sales]);

  const paymentTotals = useMemo(() => {
    const grouped: Record<string, number> = {};

    sales.forEach((sale) => {
      const key = sale.paymentMethod || "未設定";
      grouped[key] = (grouped[key] || 0) + Number(sale.amount || 0);
    });

    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [sales]);

  const todayTotal = useMemo(() => {
    return sales
      .filter((sale) => sale.date === todayString())
      .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }, [sales]);

  const allTotal = useMemo(() => {
    return sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }, [sales]);

  const dailySummaryRows = useMemo(() => {
    return buildDailySummaryRows(sales);
  }, [sales]);

  const updatePayment = <K extends keyof PaymentRow>(
    id: string,
    key: K,
    value: PaymentRow[K]
  ) => {
    setPayments((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        const next = { ...row, [key]: value };

        if (key === "saleType") {
          if (value === "前受金") {
            next.paymentMethod = "その他";
          }
          if (value === "回数券消化") {
            next.amount = "0";
            next.paymentMethod = "その他";
          }
          if (value === "通常売上" && next.amount === "0") {
            next.amount = "";
            next.paymentMethod = "現金";
          }
        }

        return next;
      })
    );
  };

  const addPaymentRow = () => {
    setPayments((prev) => [...prev, createPaymentRow()]);
  };

  const removePaymentRow = (id: string) => {
    if (payments.length === 1) {
      alert("支払いは1件以上必要です");
      return;
    }

    setPayments((prev) => prev.filter((row) => row.id !== id));
  };

  const resetForm = () => {
    setDate(todayString());
    setCustomerId("");
    setMenuName("");
    setStaff(STAFF_OPTIONS[0]);
    setStoreName(STORE_OPTIONS[0]);
    setServiceType("トレーニング");
    setNote("");
    setSearch("");
    setReservationId("");
    setReservationStatus("");
    setExistingSalesForReservation([]);
    setPayments([createPaymentRow()]);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/sales");
    }
  };

  const handleAddSale = async () => {
    if (!date) {
      alert("日付を入力してください");
      return;
    }

    if (!customerId) {
      alert("顧客を選択してください");
      return;
    }

    if (!menuName.trim()) {
      alert("メニュー名を入力してください");
      return;
    }

    const customer = customers.find((c) => String(c.id) === customerId);
    if (!customer) {
      alert("顧客情報が見つかりません");
      return;
    }

    if (reservationId && existingSalesForReservation.length > 0) {
      const ok = window.confirm("この予約にはすでに売上があります。追加登録しますか？");
      if (!ok) return;
    }

    for (const row of payments) {
      if (row.saleType !== "回数券消化" && (!row.amount || Number(row.amount) <= 0)) {
        alert("支払い金額を入力してください");
        return;
      }
    }

    const queryFrom = getQueryParam("from");
    const querySignupId = getQueryParam("signup_id");
    const isFromSignup = queryFrom === "signup" && !!querySignupId;
    const previousReservationStatus = reservationStatus;

    try {
      setSaving(true);

      const insertedSaleIds: Array<number | string> = [];
      const consumedTickets: TicketConsumeResult[] = [];
      let reservationUpdated = false;

      for (const row of payments) {
        const isTicket = row.saleType === "回数券消化";

        const baseNote = [menuName.trim() ? `メニュー名: ${menuName.trim()}` : "", note.trim()]
          .filter(Boolean)
          .join("\n");

        let ticketResult: TicketConsumeResult | null = null;

        if (isTicket) {
          ticketResult = await consumeCustomerTicket({
            customerId,
            customerName: customer.name,
            serviceType,
            usedDate: date,
            reservationId,
          });
          consumedTickets.push(ticketResult);
        }

        const mergedNote = [
          baseNote,
          isFromSignup ? `signup_id: ${querySignupId}` : "",
          isTicket && ticketResult
            ? `回数券消化: ${ticketResult.ticketName} / 残数 ${ticketResult.beforeCount} → ${ticketResult.afterCount}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");

        const salePayload = {
          customer_id: Number(customer.id),
          customer_name: customer.name,
          sale_date: date,
          menu_type: serviceType,
          sale_type: row.saleType,
          payment_method: isTicket ? "その他" : row.paymentMethod,
          amount: isTicket ? 0 : Number(row.amount),
          staff_name: staff.trim() || "未設定",
          store_name: storeName.trim() || "未設定",
          reservation_id: reservationId ? Number(reservationId) : null,
          memo: mergedNote || null,
        };

        const { data: inserted, error: insertError } = await supabase
          .from("sales")
          .insert([salePayload])
          .select("id")
          .single();

        if (insertError) {
          if (isTicket && ticketResult) {
            await rollbackConsumedTicket({
              ticketId: ticketResult.ticketId,
              beforeCount: ticketResult.beforeCount,
              reservationId,
            });
          }
          throw new Error(`売上登録エラー: ${insertError.message}`);
        }

        if (inserted?.id !== null && inserted?.id !== undefined) {
          insertedSaleIds.push(inserted.id);
        }
      }

      if (reservationId) {
        const { error: reservationUpdateError } = await supabase
          .from("reservations")
          .update({
            reservation_status: "売上済",
          })
          .eq("id", Number(reservationId));

        if (reservationUpdateError) {
          for (const saleId of insertedSaleIds) {
            await supabase.from("sales").delete().eq("id", saleId);
          }

          for (const consumed of consumedTickets) {
            await rollbackConsumedTicket({
              ticketId: consumed.ticketId,
              beforeCount: consumed.beforeCount,
              reservationId,
            });
          }

          throw new Error(`予約ステータス更新エラー: ${reservationUpdateError.message}`);
        }

        reservationUpdated = true;
        setReservationStatus("売上済");
      }

      if (isFromSignup) {
        const { error: signupUpdateError } = await supabase
          .from("online_signups")
          .update({
            status: "売上登録済",
          })
          .eq("id", Number(querySignupId));

        if (signupUpdateError) {
          for (const consumed of consumedTickets) {
            await rollbackConsumedTicket({
              ticketId: consumed.ticketId,
              beforeCount: consumed.beforeCount,
              reservationId,
            });
          }

          for (const saleId of insertedSaleIds) {
            await supabase.from("sales").delete().eq("id", saleId);
          }

          if (reservationId && reservationUpdated) {
            await supabase
              .from("reservations")
              .update({
                reservation_status: previousReservationStatus || null,
              })
              .eq("id", Number(reservationId));

            setReservationStatus(previousReservationStatus);
          }

          throw new Error(`online_signups 更新エラー: ${signupUpdateError.message}`);
        }
      }

      await fetchSales();

      if (reservationId) {
        await loadExistingSalesForReservation(reservationId);
      }

      alert(
        isFromSignup
          ? "売上を登録し、入会申請も売上登録済に更新しました"
          : "売上を登録しました"
      );

      resetForm();
      await fetchCustomers();
      await fetchSales();
    } catch (error) {
      console.error("handleAddSale error:", error);
      alert(error instanceof Error ? error.message : "売上登録中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    const target = sales.find((sale) => sale.id === saleId);
    if (!target) return;

    const ok = window.confirm("この売上を削除しますか？");
    if (!ok) return;

    try {
      if (target.accountingType === "回数券消化") {
        await restoreTicketUsageFromDeletedSale({ sale: target });
      }

      const { error } = await supabase.from("sales").delete().eq("id", saleId);

      if (error) {
        throw new Error(`売上削除エラー: ${error.message}`);
      }

      await fetchSales();

      if (target.reservationId) {
        await loadExistingSalesForReservation(String(target.reservationId));
      }

      alert("売上を削除しました");
    } catch (error) {
      console.error("handleDeleteSale error:", error);
      alert(error instanceof Error ? error.message : "売上削除中にエラーが発生しました");
    }
  };

  const exportSalesCsv = () => {
    if (filteredSales.length === 0) {
      alert("出力する売上データがありません");
      return;
    }

    const rows = [
      [
        "日付",
        "顧客名",
        "メニュー",
        "サービス",
        "会計区分",
        "支払方法",
        "金額",
        "担当",
        "店舗",
        "予約ID",
        "メモ",
      ]
        .map(toCsvValue)
        .join(","),
      ...filteredSales.map((sale) =>
        [
          sale.date,
          sale.customerName,
          sale.menuName,
          sale.serviceType,
          sale.accountingType,
          sale.paymentMethod,
          sale.amount,
          sale.staff,
          sale.storeName,
          sale.reservationId ?? "",
          sale.note.replace(/\n/g, " / "),
        ]
          .map(toCsvValue)
          .join(",")
      ),
    ];

    const bom = "\uFEFF";
    const blob = new Blob([bom + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_${todayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f7f7f8 0%, #eceef1 45%, #e7eaef 100%)",
    padding: mobile ? "16px" : "24px",
    color: "#111827",
  };

  const innerStyle: CSSProperties = {
    maxWidth: "1480px",
    margin: "0 auto",
    display: "grid",
    gap: "18px",
  };

  const cardStyle: CSSProperties = {
    background: "rgba(255,255,255,0.84)",
    border: "1px solid rgba(255,255,255,0.9)",
    borderRadius: "24px",
    padding: mobile ? "16px" : "20px",
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(12px)",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: mobile ? "stretch" : "center",
    gap: "12px",
    flexDirection: mobile ? "column" : "row",
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: mobile ? "26px" : "34px",
    fontWeight: 800,
    letterSpacing: "0.02em",
  };

  const subTextStyle: CSSProperties = {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#6b7280",
  };

  const topActionsStyle: CSSProperties = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  };

  const linkButtonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 16px",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
  };

  const primaryButtonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(17, 24, 39, 0.22)",
  };

  const secondaryButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    boxShadow: "none",
  };

  const dangerButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)",
    boxShadow: "0 10px 24px rgba(153, 27, 27, 0.18)",
  };

  const ghostButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "#f9fafb",
    color: "#111827",
    border: "1px solid #e5e7eb",
    boxShadow: "none",
  };

  const miniTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: mobile
      ? "1fr"
      : tablet
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#6b7280",
    marginBottom: "7px",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  };

  const textareaStyle: CSSProperties = {
    ...inputStyle,
    minHeight: "120px",
    resize: "vertical",
    lineHeight: 1.6,
  };

  const statGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: mobile
      ? "repeat(2, minmax(0, 1fr))"
      : compact
      ? "repeat(3, minmax(0, 1fr))"
      : "repeat(6, minmax(0, 1fr))",
    gap: "12px",
  };

  const statCardStyle: CSSProperties = {
    borderRadius: "20px",
    padding: "16px",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
  };

  const statLabelStyle: CSSProperties = {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: 700,
    marginBottom: "8px",
  };

  const statValueStyle: CSSProperties = {
    fontSize: mobile ? "18px" : "24px",
    fontWeight: 800,
    letterSpacing: "0.01em",
  };

  const paymentRowCardStyle: CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "14px",
    background: "#fafafa",
    display: "grid",
    gap: "12px",
  };

  const paymentTitleStyle: CSSProperties = {
    fontWeight: 800,
    fontSize: "14px",
  };

  const pillStyle = (bg: string, color = "#111827"): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: bg,
    color,
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  });

  const tableWrapStyle: CSSProperties = {
    width: "100%",
    overflowX: "auto",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "#fff",
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    minWidth: "980px",
    borderCollapse: "collapse",
    fontSize: "14px",
  };

  const thStyle: CSSProperties = {
    textAlign: "left",
    padding: "13px 14px",
    fontWeight: 800,
    color: "#374151",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };

  const tdStyle: CSSProperties = {
    padding: "13px 14px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  };

  if (!mounted) {
    return null;
  }

  return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <section style={cardStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>売上管理</h1>
              <p style={subTextStyle}>予約連動・回数券消化・signup自動入力対応</p>
            </div>

            <div style={topActionsStyle}>
              <Link href="/" style={linkButtonStyle}>
                TOPへ
              </Link>
              <Link href="/signup/list" style={linkButtonStyle}>
                入会申請一覧へ
              </Link>
              <button type="button" onClick={exportSalesCsv} style={secondaryButtonStyle}>
                CSV出力
              </button>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={statGridStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>本日の売上</div>
              <div style={statValueStyle}>{formatCurrency(todayTotal)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>累計売上</div>
              <div style={statValueStyle}>{formatCurrency(allTotal)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>登録件数</div>
              <div style={statValueStyle}>{sales.length.toLocaleString()}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>フォーム合計</div>
              <div style={statValueStyle}>{formatCurrency(totalAmount)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>顧客</div>
              <div style={statValueStyle}>
                {customerLoading ? "読込中" : `${customers.length.toLocaleString()}名`}
              </div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>予約ステータス</div>
              <div
                style={{
                  ...statValueStyle,
                  fontSize: mobile ? "16px" : "20px",
                }}
              >
                {reservationStatus || "—"}
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              flexDirection: mobile ? "column" : "row",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <h2 style={miniTitleStyle}>売上登録</h2>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {prefillLoading && <span style={pillStyle("#dbeafe", "#1d4ed8")}>予約読込中</span>}
              {getQueryParam("from") === "signup" && (
                <span style={pillStyle("#ede9fe", "#6d28d9")}>signup流入</span>
              )}
              {reservationId && <span style={pillStyle("#dcfce7", "#166534")}>予約ID: {reservationId}</span>}
            </div>
          </div>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>顧客</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={inputStyle}
              >
                <option value="">顧客を選択</option>
                {customers.map((customer) => (
                  <option key={String(customer.id)} value={String(customer.id)}>
                    {customer.name}
                    {customer.phone ? ` / ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>サービス種別</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                style={inputStyle}
              >
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>メニュー名</label>
              <input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="例：ストレッチ回数券 / 月4プラン"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>担当</label>
              <select
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                style={inputStyle}
              >
                {STAFF_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>店舗</label>
              <select
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                style={inputStyle}
              >
                {STORE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>予約ID</label>
              <input
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                placeholder="予約詳細からなら自動入力"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>選択中の顧客</label>
              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  minHeight: "46px",
                  color: selectedCustomer ? "#111827" : "#9ca3af",
                }}
              >
                {selectedCustomer
                  ? `${selectedCustomer.name}${selectedCustomer.phone ? ` / ${selectedCustomer.phone}` : ""}`
                  : "未選択"}
              </div>
            </div>

            <div style={{ gridColumn: tablet ? "auto" : "1 / -1" }}>
              <label style={labelStyle}>メモ</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="備考・補足"
                style={textareaStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: "18px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: mobile ? "stretch" : "center",
                gap: "12px",
                flexWrap: "wrap",
                flexDirection: mobile ? "column" : "row",
                marginBottom: "12px",
              }}
            >
              <h3 style={miniTitleStyle}>支払い設定</h3>

              <button
                type="button"
                onClick={addPaymentRow}
                style={{ ...secondaryButtonStyle, width: mobile ? "100%" : "auto" }}
              >
                ＋ 支払いを追加
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {payments.map((row, index) => (
                <div key={row.id} style={paymentRowCardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: mobile ? "stretch" : "center",
                      gap: "10px",
                      flexWrap: "wrap",
                      flexDirection: mobile ? "column" : "row",
                    }}
                  >
                    <div style={paymentTitleStyle}>支払い {index + 1}</div>

                    <button
                      type="button"
                      onClick={() => removePaymentRow(row.id)}
                      style={{
                        ...dangerButtonStyle,
                        width: mobile ? "100%" : "auto",
                      }}
                    >
                      削除
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: mobile
                        ? "1fr"
                        : tablet
                        ? "repeat(2, minmax(0, 1fr))"
                        : "repeat(4, minmax(0, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>会計区分</label>
                      <select
                        value={row.saleType}
                        onChange={(e) =>
                          updatePayment(row.id, "saleType", e.target.value as AccountingType)
                        }
                        style={inputStyle}
                      >
                        {ACCOUNTING_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>支払方法</label>
                      <select
                        value={row.paymentMethod}
                        onChange={(e) =>
                          updatePayment(row.id, "paymentMethod", e.target.value as PaymentMethod)
                        }
                        style={{
                          ...inputStyle,
                          opacity: row.saleType === "回数券消化" ? 0.6 : 1,
                        }}
                        disabled={row.saleType === "回数券消化"}
                      >
                        {PAYMENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>金額</label>
                      <input
                        inputMode="numeric"
                        value={row.amount}
                        onChange={(e) => updatePayment(row.id, "amount", e.target.value)}
                        placeholder="0"
                        style={{
                          ...inputStyle,
                          opacity: row.saleType === "回数券消化" ? 0.6 : 1,
                        }}
                        disabled={row.saleType === "回数券消化"}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>説明</label>
                      <div
                        style={{
                          ...inputStyle,
                          display: "flex",
                          alignItems: "center",
                          minHeight: "46px",
                          color: "#374151",
                        }}
                      >
                        {row.saleType === "回数券消化"
                          ? "回数券を1回消化します"
                          : row.saleType === "前受金"
                          ? "前受金として保存します"
                          : "通常売上として保存します"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: mobile ? "stretch" : "center",
                flexDirection: mobile ? "column" : "row",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 700 }}>
                合計: <span style={{ color: "#111827" }}>{formatCurrency(totalAmount)}</span>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: mobile ? "100%" : "auto" }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ ...ghostButtonStyle, width: mobile ? "100%" : "auto" }}
                >
                  リセット
                </button>
                <button
                  type="button"
                  onClick={handleAddSale}
                  disabled={saving}
                  style={{
                    ...primaryButtonStyle,
                    width: mobile ? "100%" : "auto",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "保存中..." : "売上を登録"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {reservationId && existingSalesForReservation.length > 0 && (
          <section style={cardStyle}>
            <h2 style={miniTitleStyle}>この予約に紐づく既存売上</h2>
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {existingSalesForReservation.map((sale) => (
                <div
                  key={sale.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "12px 14px",
                    minWidth: "220px",
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: "6px" }}>{sale.customerName}</div>
                  <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.7 }}>
                    <div>{sale.accountingType}</div>
                    <div>{sale.paymentMethod}</div>
                    <div>{formatCurrency(sale.amount)}</div>
                    <div>登録日: {formatDateJP(sale.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: "12px",
              flexDirection: mobile ? "column" : "row",
              marginBottom: "14px",
            }}
          >
            <h2 style={miniTitleStyle}>集計</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="顧客名・担当・支払方法・予約IDで検索"
              style={{ ...inputStyle, maxWidth: mobile ? "100%" : "360px" }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <div style={paymentRowCardStyle}>
              <div style={paymentTitleStyle}>月次売上</div>
              <div style={{ display: "grid", gap: "8px" }}>
                {monthlyTotals.length === 0 ? (
                  <div style={{ color: "#9ca3af", fontSize: "14px" }}>データなし</div>
                ) : (
                  monthlyTotals.map(([month, total]) => (
                    <div
                      key={month}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        fontSize: "14px",
                      }}
                    >
                      <span>{month}</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={paymentRowCardStyle}>
              <div style={paymentTitleStyle}>スタッフ別</div>
              <div style={{ display: "grid", gap: "8px" }}>
                {staffTotals.length === 0 ? (
                  <div style={{ color: "#9ca3af", fontSize: "14px" }}>データなし</div>
                ) : (
                  staffTotals.map(([name, total]) => (
                    <div
                      key={name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        fontSize: "14px",
                      }}
                    >
                      <span>{name}</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={paymentRowCardStyle}>
              <div style={paymentTitleStyle}>支払方法別</div>
              <div style={{ display: "grid", gap: "8px" }}>
                {paymentTotals.length === 0 ? (
                  <div style={{ color: "#9ca3af", fontSize: "14px" }}>データなし</div>
                ) : (
                  paymentTotals.map(([name, total]) => (
                    <div
                      key={name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        fontSize: "14px",
                      }}
                    >
                      <span>{name}</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={miniTitleStyle}>日別集計</h2>
          <div style={{ marginTop: "14px", ...tableWrapStyle }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>日付</th>
                  <th style={thStyle}>スト現金</th>
                  <th style={thStyle}>ストカード等</th>
                  <th style={thStyle}>ストその他</th>
                  <th style={thStyle}>スト回数券</th>
                  <th style={thStyle}>トレ現金</th>
                  <th style={thStyle}>トレカード等</th>
                  <th style={thStyle}>トレその他</th>
                  <th style={thStyle}>トレ回数券</th>
                  <th style={thStyle}>純売上合計</th>
                  <th style={thStyle}>前受現金</th>
                  <th style={thStyle}>前受その他</th>
                  <th style={thStyle}>前受合計</th>
                  <th style={thStyle}>総合計</th>
                </tr>
              </thead>
              <tbody>
                {dailySummaryRows.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={14}>
                      データがありません
                    </td>
                  </tr>
                ) : (
                  dailySummaryRows.map((row) => (
                    <tr key={row.date}>
                      <td style={tdStyle}>{row.date}</td>
                      <td style={tdStyle}>{formatCurrency(row.stretchCash)}</td>
                      <td style={tdStyle}>{formatCurrency(row.stretchCard)}</td>
                      <td style={tdStyle}>{formatCurrency(row.stretchReceived)}</td>
                      <td style={tdStyle}>{formatCurrency(row.stretchTicket)}</td>
                      <td style={tdStyle}>{formatCurrency(row.trainingCash)}</td>
                      <td style={tdStyle}>{formatCurrency(row.trainingCard)}</td>
                      <td style={tdStyle}>{formatCurrency(row.trainingReceived)}</td>
                      <td style={tdStyle}>{formatCurrency(row.trainingTicket)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{formatCurrency(row.netSalesTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.advanceCash)}</td>
                      <td style={tdStyle}>{formatCurrency(row.advanceCard)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{formatCurrency(row.advanceTotal)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{formatCurrency(row.grandTotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              flexDirection: mobile ? "column" : "row",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <h2 style={miniTitleStyle}>売上一覧</h2>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              表示件数: {filteredSales.length.toLocaleString()}件
            </div>
          </div>

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>日付</th>
                  <th style={thStyle}>顧客</th>
                  <th style={thStyle}>メニュー</th>
                  <th style={thStyle}>サービス</th>
                  <th style={thStyle}>会計区分</th>
                  <th style={thStyle}>支払方法</th>
                  <th style={thStyle}>金額</th>
                  <th style={thStyle}>担当</th>
                  <th style={thStyle}>店舗</th>
                  <th style={thStyle}>予約ID</th>
                  <th style={thStyle}>メモ</th>
                  <th style={thStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={tdStyle} colSpan={12}>
                      読み込み中...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={12}>
                      売上データがありません
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td style={tdStyle}>{sale.date}</td>
                      <td style={tdStyle}>{sale.customerName}</td>
                      <td style={tdStyle}>{sale.menuName}</td>
                      <td style={tdStyle}>
                        <span
                          style={pillStyle(
                            sale.serviceType === "ストレッチ" ? "#fce7f3" : "#dbeafe",
                            sale.serviceType === "ストレッチ" ? "#9d174d" : "#1d4ed8"
                          )}
                        >
                          {sale.serviceType}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={pillStyle(
                            sale.accountingType === "通常売上"
                              ? "#dcfce7"
                              : sale.accountingType === "前受金"
                              ? "#fef3c7"
                              : "#ede9fe",
                            sale.accountingType === "通常売上"
                              ? "#166534"
                              : sale.accountingType === "前受金"
                              ? "#92400e"
                              : "#6d28d9"
                          )}
                        >
                          {sale.accountingType}
                        </span>
                      </td>
                      <td style={tdStyle}>{sale.paymentMethod}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{formatCurrency(sale.amount)}</td>
                      <td style={tdStyle}>{sale.staff}</td>
                      <td style={tdStyle}>{sale.storeName}</td>
                      <td style={tdStyle}>{sale.reservationId ?? "—"}</td>
                      <td style={{ ...tdStyle, whiteSpace: "pre-wrap", minWidth: "260px" }}>
                        {sale.note || "—"}
                      </td>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          onClick={() => handleDeleteSale(sale.id)}
                          style={dangerButtonStyle}
                        >
                          削除
                        </button>
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