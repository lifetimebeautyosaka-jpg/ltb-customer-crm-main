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
  return value === "ストレッチ" ? "ストレッチ" : "トレーニング";
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
    const queryDate = getQueryParam("date");
    const queryCustomerId = getQueryParam("customerId") || getQueryParam("customer_id");
    const queryCustomerName =
      getQueryParam("customerName") ||
      getQueryParam("customer_name") ||
      getQueryParam("customer");
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
      getQueryParam("service");
    const queryMenu = getQueryParam("menu");
    const queryPaymentMethod =
      getQueryParam("paymentMethod") || getQueryParam("payment_method");
    const queryReservationId =
      getQueryParam("reservationId") || getQueryParam("reservation_id");
    const querySaleType =
      getQueryParam("saleType") || getQueryParam("sale_type");

    if (queryDate) setDate(queryDate);
    if (queryStore) setStoreName(queryStore);
    if (queryStaff) setStaff(queryStaff);
    if (queryMenu) setMenuName(queryMenu);
    if (queryReservationId) setReservationId(queryReservationId);

    if (queryPaymentMethod) {
      const normalized = normalizePaymentMethod(queryPaymentMethod);
      setPayments((prev) =>
        prev.map((row, index) =>
          index === 0 ? { ...row, paymentMethod: normalized } : row
        )
      );
    }

    if (queryService === "ストレッチ" || queryService === "トレーニング") {
      setServiceType(queryService);
    } else if (queryMenu) {
      setServiceType(detectServiceTypeFromMenu(queryMenu));
    }

    if (
      querySaleType === "前受金" ||
      querySaleType === "回数券消化" ||
      querySaleType === "通常売上"
    ) {
      setPayments((prev) =>
        prev.map((row, index) =>
          index === 0
            ? {
                ...row,
                saleType: querySaleType,
                paymentMethod:
                  querySaleType === "回数券消化"
                    ? "その他"
                    : querySaleType === "前受金"
                    ? "その他"
                    : row.paymentMethod,
                amount: querySaleType === "回数券消化" ? "0" : row.amount,
              }
            : row
        )
      );
    }

    if (queryCustomerId) {
      setCustomerId(String(queryCustomerId));
    } else if (queryCustomerName) {
      const found = customerList.find((c) => c.name === queryCustomerName);
      if (found) {
        setCustomerId(String(found.id));
      }
    }
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
      ].filter(Boolean);

      if (noteLines.length > 0) {
        setNote((prev) => {
          const base = prev.trim();
          const add = noteLines.join("\n");
          if (!base) return add;
          if (base.includes(add)) return base;
          return `${add}\n${base}`;
        });
      }
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
        String(sale.reservationId || "").includes(keyword)
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

    try {
      setSaving(true);

      const insertedSaleIds: Array<number | string> = [];
      const consumedTickets: TicketConsumeResult[] = [];

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

        setReservationStatus("売上済");
      }

      await fetchSales();

      if (reservationId) {
        await loadExistingSalesForReservation(reservationId);
      }

      alert("売上を登録しました");
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

      const { error: deleteError } = await supabase
        .from("sales")
        .delete()
        .eq("id", Number(saleId));

      if (deleteError) {
        throw new Error(`売上削除エラー: ${deleteError.message}`);
      }

      const targetReservationId = target.reservationId ? String(target.reservationId) : "";

      if (targetReservationId) {
        const { data: remainSales, error: remainSalesError } = await supabase
          .from("sales")
          .select("id")
          .eq("reservation_id", Number(targetReservationId));

        if (remainSalesError) {
          throw new Error(`残売上確認エラー: ${remainSalesError.message}`);
        }

        const remainingCount = Array.isArray(remainSales) ? remainSales.length : 0;

        if (remainingCount === 0) {
          const { error: reservationUpdateError } = await supabase
            .from("reservations")
            .update({
              reservation_status: "予約済",
            })
            .eq("id", Number(targetReservationId));

          if (reservationUpdateError) {
            throw new Error(`予約ステータス更新エラー: ${reservationUpdateError.message}`);
          }

          if (reservationId === targetReservationId) {
            setReservationStatus("予約済");
          }
        } else if (reservationId === targetReservationId) {
          setReservationStatus("売上済");
        }
      }

      await fetchSales();

      if (targetReservationId) {
        if (reservationId === targetReservationId) {
          await loadExistingSalesForReservation(targetReservationId);
        } else if (reservationId) {
          await loadExistingSalesForReservation(reservationId);
        }
      } else if (reservationId) {
        await loadExistingSalesForReservation(reservationId);
      }

      alert("売上を削除しました");
    } catch (error) {
      console.error("handleDeleteSale error:", error);
      alert(error instanceof Error ? error.message : "売上削除中にエラーが発生しました");
    }
  };

  const handleDownloadCsv = () => {
    if (sales.length === 0) {
      alert("売上データがありません");
      return;
    }

    const header = [
      "日付",
      "ストレッチ(現金)",
      "ストレッチ(カード等)",
      "ストレッチ(受領済)",
      "ストレッチ(回数券)",
      "トレーニング(現金)",
      "トレーニング(カード等)",
      "トレーニング(受領済)",
      "トレーニング(回数券)",
      "純売上合計",
      "前受(現金)",
      "前受(カード等)",
      "前受合計",
      "総合計",
    ];

    const rows = dailySummaryRows.map((row) => [
      formatDateJP(row.date),
      row.stretchCash,
      row.stretchCard,
      row.stretchReceived,
      row.stretchTicket,
      row.trainingCash,
      row.trainingCard,
      row.trainingReceived,
      row.trainingTicket,
      row.netSalesTotal,
      row.advanceCash,
      row.advanceCard,
      row.advanceTotal,
      row.grandTotal,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => toCsvValue(cell)).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gymup-daily-sales-summary-${todayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) return null;

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        <section style={heroCardStyle}>
          <div
            style={{
              ...heroTopStyle,
              flexDirection: mobile ? "column" : "row",
              alignItems: mobile ? "stretch" : "center",
            }}
          >
            <div>
              <div style={heroEyebrowStyle}>GYMUP CRM</div>
              <h1 style={heroTitleStyle}>売上管理</h1>
              <div style={heroSubStyle}>予約連動 / 回数券消化 / 日別集計</div>
            </div>

            <div
              style={{
                ...heroActionWrapStyle,
                width: mobile ? "100%" : "auto",
              }}
            >
              <Link
                href="/"
                style={{ ...subButtonStyle, width: mobile ? "100%" : "auto" }}
              >
                TOPへ
              </Link>
              <Link
                href="/reservation"
                style={{ ...subButtonStyle, width: mobile ? "100%" : "auto" }}
              >
                予約へ
              </Link>
              {reservationId ? (
                <Link
                  href={`/reservation/detail/${reservationId}`}
                  style={{ ...mainButtonLinkStyle, width: mobile ? "100%" : "auto" }}
                >
                  予約詳細へ
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section
          style={{
            ...summaryGridStyle,
            gridTemplateColumns: mobile
              ? "1fr"
              : tablet
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(4, minmax(0, 1fr))",
          }}
        >
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>本日売上</div>
            <div style={summaryValueStyle}>{formatCurrency(todayTotal)}</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>累計売上</div>
            <div style={summaryValueStyle}>{formatCurrency(allTotal)}</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>顧客数</div>
            <div style={summaryValueStyle}>{customers.length}名</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>今回入力合計</div>
            <div style={summaryValueStyle}>{formatCurrency(totalAmount)}</div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: tablet ? "1fr" : "minmax(0, 1.2fr) minmax(0, 0.8fr)",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: mobile ? "stretch" : "center",
                gap: "12px",
                flexWrap: "wrap",
                flexDirection: mobile ? "column" : "row",
                marginBottom: "18px",
              }}
            >
              <h2 style={sectionTitleStyle}>売上登録</h2>

              <div style={statusRowStyle}>
                {prefillLoading ? <span style={statusChipStyle}>予約読込中</span> : null}
                {reservationId ? (
                  <span style={statusChipStyle}>
                    予約ID: {reservationId} / {reservationStatus || "確認中"}
                  </span>
                ) : null}
              </div>
            </div>

            <div style={formGridStyle}>
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
                  disabled={customerLoading}
                >
                  <option value="">顧客を選択</option>
                  {customers.map((customer) => (
                    <option key={String(customer.id)} value={String(customer.id)}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>メニュー名</label>
                <input
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder="例：ストレッチ90分"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>サービス区分</label>
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
                  style={{ ...subButtonAsButtonStyle, width: mobile ? "100%" : "auto" }}
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
                          style={inputStyle}
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
                          type="number"
                          value={row.amount}
                          onChange={(e) => updatePayment(row.id, "amount", e.target.value)}
                          placeholder={row.saleType === "回数券消化" ? "0" : "例：8000"}
                          style={inputStyle}
                          disabled={row.saleType === "回数券消化"}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>カテゴリ</label>
                        <div style={readonlyBoxStyle}>
                          {buildCategory(serviceType, row.saleType, row.paymentMethod)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={summaryBoxStyle}>
              <div style={summaryRowStyle}>
                <span>選択顧客</span>
                <strong>{selectedCustomer?.name || "未選択"}</strong>
              </div>
              <div style={summaryRowStyle}>
                <span>支払い件数</span>
                <strong>{payments.length}件</strong>
              </div>
              <div style={summaryRowStyle}>
                <span>合計金額</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
            </div>

            {reservationId && existingSalesForReservation.length > 0 ? (
              <div style={warnBoxStyle}>
                この予約にはすでに売上が {existingSalesForReservation.length} 件あります。追加登録前に確認してください。
              </div>
            ) : null}

            <div
              style={{
                marginTop: "18px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                flexDirection: mobile ? "column" : "row",
              }}
            >
              <button
                onClick={handleAddSale}
                style={{ ...mainButtonStyle, width: mobile ? "100%" : "auto" }}
                disabled={saving || customerLoading}
              >
                {saving ? "登録中..." : "売上を登録する"}
              </button>

              <button
                onClick={resetForm}
                style={{ ...subButtonPlainStyle, width: mobile ? "100%" : "auto" }}
              >
                入力をリセット
              </button>

              <button
                onClick={handleDownloadCsv}
                style={{ ...subButtonPlainStyle, width: mobile ? "100%" : "auto" }}
              >
                日別集計CSV出力
              </button>
            </div>
          </section>

          <div style={{ display: "grid", gap: "20px" }}>
            <section style={cardStyle}>
              <h3 style={miniTitleStyle}>月別売上</h3>
              <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                {monthlyTotals.length === 0 ? (
                  <div style={emptyInnerStyle}>データなし</div>
                ) : (
                  monthlyTotals.map(([month, total]) => (
                    <div key={month} style={listRowStyle}>
                      <span>{month}</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section style={cardStyle}>
              <h3 style={miniTitleStyle}>担当別売上</h3>
              <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                {staffTotals.length === 0 ? (
                  <div style={emptyInnerStyle}>データなし</div>
                ) : (
                  staffTotals.map(([name, total]) => (
                    <div key={name} style={listRowStyle}>
                      <span>{name}</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section style={cardStyle}>
              <h3 style={miniTitleStyle}>支払方法別売上</h3>
              <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                {paymentTotals.length === 0 ? (
                  <div style={emptyInnerStyle}>データなし</div>
                ) : (
                  paymentTotals.map(([name, total]) => (
                    <div key={name} style={listRowStyle}>
                      <span>{name}</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: "12px",
              flexWrap: "wrap",
              flexDirection: mobile ? "column" : "row",
              marginBottom: "14px",
            }}
          >
            <h2 style={sectionTitleStyle}>日別集計</h2>

            <button
              type="button"
              onClick={handleDownloadCsv}
              style={{ ...subButtonAsButtonStyle, width: mobile ? "100%" : "auto" }}
            >
              日別集計CSV
            </button>
          </div>

          {dailySummaryRows.length === 0 ? (
            <div style={emptyBoxStyle}>集計データがありません</div>
          ) : mobile ? (
            <div style={{ display: "grid", gap: "12px" }}>
              {dailySummaryRows.map((row) => (
                <div key={row.date} style={dailyCardStyle}>
                  <div style={dailyCardDateStyle}>{formatDateJP(row.date)}</div>

                  <div style={dailyCardGridStyle}>
                    <div style={dailyItemStyle}>
                      <span>スト現</span>
                      <strong>{formatCurrency(row.stretchCash)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>ストカ</span>
                      <strong>{formatCurrency(row.stretchCard)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>スト受</span>
                      <strong>{formatCurrency(row.stretchReceived)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>スト券</span>
                      <strong>{formatCurrency(row.stretchTicket)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>トレ現</span>
                      <strong>{formatCurrency(row.trainingCash)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>トレカ</span>
                      <strong>{formatCurrency(row.trainingCard)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>トレ受</span>
                      <strong>{formatCurrency(row.trainingReceived)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>トレ券</span>
                      <strong>{formatCurrency(row.trainingTicket)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>純売上</span>
                      <strong>{formatCurrency(row.netSalesTotal)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>前受現</span>
                      <strong>{formatCurrency(row.advanceCash)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>前受カ</span>
                      <strong>{formatCurrency(row.advanceCard)}</strong>
                    </div>
                    <div style={dailyItemStyle}>
                      <span>前受計</span>
                      <strong>{formatCurrency(row.advanceTotal)}</strong>
                    </div>
                    <div
                      style={{
                        ...dailyItemStyle,
                        gridColumn: "1 / -1",
                        background: "#eff6ff",
                      }}
                    >
                      <span>総合計</span>
                      <strong>{formatCurrency(row.grandTotal)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>日付</th>
                    <th style={thStyle}>スト現</th>
                    <th style={thStyle}>ストカ</th>
                    <th style={thStyle}>スト受</th>
                    <th style={thStyle}>スト券</th>
                    <th style={thStyle}>トレ現</th>
                    <th style={thStyle}>トレカ</th>
                    <th style={thStyle}>トレ受</th>
                    <th style={thStyle}>トレ券</th>
                    <th style={thStyle}>純売上</th>
                    <th style={thStyle}>前受現</th>
                    <th style={thStyle}>前受カ</th>
                    <th style={thStyle}>前受計</th>
                    <th style={thStyle}>総合計</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummaryRows.map((row) => (
                    <tr key={row.date}>
                      <td style={tdStyle}>{formatDateJP(row.date)}</td>
                      <td style={tdStyle}>{formatCurrency(row.stretchCash)}</td>
                      <td style={tdStyle}>{formatCurrency(row.stretchCard)}</td>
                      <td style={tdStyle}>{formatCurrency(row.stretchReceived)}</td>
                      <td style={tdStyle}>{formatCurrency(row.stretchTicket)}</td>
                      <td style={tdStyle}>{formatCurrency(row.trainingCash)}</td>
                      <td style={tdStyle}>{formatCurrency(row.trainingCard)}</td>
                      <td style={tdStyle}>{formatCurrency(row.trainingReceived)}</td>
                      <td style={tdStyle}>{formatCurrency(row.trainingTicket)}</td>
                      <td style={tdStyleStrong}>{formatCurrency(row.netSalesTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.advanceCash)}</td>
                      <td style={tdStyle}>{formatCurrency(row.advanceCard)}</td>
                      <td style={tdStyleStrong}>{formatCurrency(row.advanceTotal)}</td>
                      <td style={tdStyleStrongBlue}>{formatCurrency(row.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: "12px",
              flexWrap: "wrap",
              flexDirection: mobile ? "column" : "row",
            }}
          >
            <h2 style={sectionTitleStyle}>売上一覧</h2>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="顧客名・日付・担当・予約IDで検索"
              style={{
                ...inputStyle,
                width: mobile ? "100%" : "320px",
                maxWidth: "100%",
              }}
            />
          </div>

          {loading ? (
            <div style={emptyBoxStyle}>読み込み中...</div>
          ) : filteredSales.length === 0 ? (
            <div style={emptyBoxStyle}>売上データがありません</div>
          ) : (
            <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
              {filteredSales.map((sale) => (
                <div key={sale.id} style={saleCardStyle}>
                  <div
                    style={{
                      ...saleCardTopStyle,
                      flexDirection: mobile ? "column" : "row",
                      alignItems: mobile ? "flex-start" : "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={saleDateStyle}>{formatDateJP(sale.date)}</div>
                      <div style={saleCustomerStyle}>{sale.customerName}</div>
                    </div>

                    <div
                      style={{
                        ...saleAmountStyle,
                        alignSelf: mobile ? "flex-start" : "auto",
                      }}
                    >
                      {formatCurrency(sale.amount)}
                    </div>
                  </div>

                  <div
                    style={{
                      ...saleMetaGridStyle,
                      display: "grid",
                      gridTemplateColumns: mobile
                        ? "1fr"
                        : tablet
                        ? "repeat(2, minmax(0, 1fr))"
                        : "repeat(3, minmax(0, 1fr))",
                      gap: "8px",
                    }}
                  >
                    <div style={metaChipStyle}>区分: {sale.serviceType}</div>
                    <div style={metaChipStyle}>タイプ: {sale.accountingType}</div>
                    <div style={metaChipStyle}>支払: {sale.paymentMethod}</div>
                    <div style={metaChipStyle}>担当: {sale.staff}</div>
                    <div style={metaChipStyle}>店舗: {sale.storeName}</div>
                    <div style={metaChipStyle}>
                      予約ID: {sale.reservationId ? String(sale.reservationId) : "なし"}
                    </div>
                  </div>

                  {sale.note ? <div style={noteBoxStyle}>{sale.note}</div> : null}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginTop: "12px",
                      flexDirection: mobile ? "column" : "row",
                    }}
                  >
                    {sale.reservationId ? (
                      <Link
                        href={`/reservation/detail/${sale.reservationId}`}
                        style={{
                          ...subButtonStyle,
                          width: mobile ? "100%" : "auto",
                        }}
                      >
                        予約詳細へ
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleDeleteSale(sale.id)}
                      style={{
                        ...dangerButtonStyle,
                        width: mobile ? "100%" : "auto",
                      }}
                    >
                      売上削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "20px 12px 80px",
  background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 45%, #f8fafc 100%)",
};

const wrapStyle: CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
  display: "grid",
  gap: "20px",
};

const heroCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 18px 45px rgba(15,23,42,0.06)",
};

const heroTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
};

const heroEyebrowStyle: CSSProperties = {
  fontSize: "12px",
  letterSpacing: "0.14em",
  color: "#64748b",
  fontWeight: 900,
  marginBottom: "6px",
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "32px",
  lineHeight: 1.2,
  color: "#111827",
  fontWeight: 900,
};

const heroSubStyle: CSSProperties = {
  marginTop: "8px",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: 700,
};

const heroActionWrapStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const cardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.96)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 18px 45px rgba(15,23,42,0.05)",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "22px",
  fontWeight: 900,
};

const miniTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "18px",
  fontWeight: 900,
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
};

const summaryCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.96)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "20px",
  padding: "18px",
  boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
};

const summaryLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 800,
  marginBottom: "10px",
};

const summaryValueStyle: CSSProperties = {
  color: "#111827",
  fontSize: "28px",
  lineHeight: 1.1,
  fontWeight: 900,
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 800,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  borderRadius: "14px",
  border: "1px solid #dbe1ea",
  background: "#fff",
  color: "#111827",
  padding: "0 14px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "110px",
  padding: "12px 14px",
  resize: "vertical",
};

const readonlyBoxStyle: CSSProperties = {
  minHeight: "46px",
  display: "flex",
  alignItems: "center",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#334155",
  padding: "0 14px",
  fontSize: "13px",
  fontWeight: 700,
};

const paymentRowCardStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px",
  display: "grid",
  gap: "12px",
};

const paymentTitleStyle: CSSProperties = {
  color: "#111827",
  fontSize: "15px",
  fontWeight: 900,
};

const summaryBoxStyle: CSSProperties = {
  marginTop: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px",
  display: "grid",
  gap: "10px",
};

const summaryRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 700,
};

const warnBoxStyle: CSSProperties = {
  marginTop: "14px",
  borderRadius: "16px",
  padding: "14px 16px",
  background: "rgba(254,249,195,0.9)",
  border: "1px solid rgba(250,204,21,0.35)",
  color: "#854d0e",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 800,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const statusChipStyle: CSSProperties = {
  minHeight: "34px",
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "0 12px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 800,
};

const mainButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "14px",
  padding: "0 18px",
  border: "none",
  background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
};

const mainButtonLinkStyle: CSSProperties = {
  ...mainButtonStyle,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const subButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "14px",
  padding: "0 16px",
  border: "1px solid #dbe1ea",
  background: "#fff",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const subButtonPlainStyle: CSSProperties = {
  ...subButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
};

const subButtonAsButtonStyle: CSSProperties = {
  ...subButtonStyle,
  appearance: "none",
};

const dangerButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "12px",
  padding: "0 14px",
  border: "1px solid rgba(248,113,113,0.28)",
  background: "rgba(254,226,226,0.92)",
  color: "#b91c1c",
  fontSize: "13px",
  fontWeight: 900,
  cursor: "pointer",
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "14px",
  minHeight: "100px",
  borderRadius: "18px",
  border: "1px dashed #cbd5e1",
  background: "#f8fafc",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "20px",
};

const emptyInnerStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "12px",
  border: "1px dashed #dbe1ea",
  background: "#f8fafc",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const listRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 700,
};

const tableWrapStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  borderRadius: "18px",
  border: "1px solid #e2e8f0",
  background: "#fff",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: "1100px",
  borderCollapse: "separate",
  borderSpacing: 0,
};

const thStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 900,
  textAlign: "center",
  padding: "12px 10px",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  textAlign: "center",
  padding: "12px 10px",
  borderBottom: "1px solid #eef2f7",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyleStrong: CSSProperties = {
  ...tdStyle,
  color: "#111827",
  fontWeight: 900,
};

const tdStyleStrongBlue: CSSProperties = {
  ...tdStyle,
  color: "#1d4ed8",
  fontWeight: 900,
};

const dailyCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "14px",
};

const dailyCardDateStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 900,
  color: "#111827",
  marginBottom: "12px",
};

const dailyCardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
};

const dailyItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  fontSize: "12px",
  color: "#334155",
  fontWeight: 700,
};

const saleCardStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px solid #e2e8f0",
  background: "#fff",
  padding: "16px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
};

const saleCardTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "12px",
};

const saleDateStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 800,
  marginBottom: "4px",
};

const saleCustomerStyle: CSSProperties = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: 900,
  lineHeight: 1.25,
  wordBreak: "break-word",
};

const saleAmountStyle: CSSProperties = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const saleMetaGridStyle: CSSProperties = {
  marginTop: "4px",
};

const metaChipStyle: CSSProperties = {
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
  borderRadius: "12px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  padding: "0 12px",
  fontSize: "13px",
  fontWeight: 700,
};

const noteBoxStyle: CSSProperties = {
  marginTop: "12px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "12px 14px",
  color: "#334155",
  fontSize: "13px",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};