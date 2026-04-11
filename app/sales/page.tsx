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

    if (querySaleType === "前受金" || querySaleType === "回数券消化" || querySaleType === "通常売上") {
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

  useEffect(() => {
    setMounted(true);

    const isLoggedIn = localStorage.getItem("gymup_logged_in");
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

    setExistingSalesForReservation(((data as SupabaseSaleRow[] | null) || []).map(rowToSale));
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
      const ok = window.confirm(
        "この予約にはすでに売上があります。追加登録しますか？"
      );
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
          if (insertedSaleIds.length > 0) {
            await supabase.from("sales").delete().in("id", insertedSaleIds as any[]);
          }

          for (const ticket of consumedTickets) {
            await rollbackConsumedTicket({
              ticketId: ticket.ticketId,
              beforeCount: ticket.beforeCount,
              reservationId,
            });
          }

          throw new Error(`予約更新エラー: ${reservationUpdateError.message}`);
        }

        setReservationStatus("売上済");
      }

      await fetchSales();
      if (reservationId) {
        await loadExistingSalesForReservation(reservationId);
      }
      alert("売上を登録しました");
      resetForm();
    } catch (error) {
      console.error("handleAddSale error:", error);
      alert(error instanceof Error ? error.message : "売上登録中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    const ok = window.confirm("この売上データを削除しますか？");
    if (!ok) return;

    const { error } = await supabase.from("sales").delete().eq("id", id);

    if (error) {
      alert(`削除エラー: ${error.message}`);
      return;
    }

    await fetchSales();
    if (reservationId) {
      await loadExistingSalesForReservation(reservationId);
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
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f7f7f8 0%, #ececef 45%, #dfe3e8 100%)",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              売上管理
            </h1>
            <p
              style={{
                marginTop: "8px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              予約自動入力・複数支払い・回数券消化・予約ステータス更新
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/" style={subButtonStyle}>
              ← ホームへ
            </Link>
            <Link href="/accounting" style={mainLinkStyle}>
              会計管理へ
            </Link>
            {reservationId ? (
              <Link href={`/reservation/detail/${reservationId}`} style={subButtonStyle}>
                予約詳細へ
              </Link>
            ) : null}
          </div>
        </div>

        <div style={topMetricGridStyle}>
          <MetricCard title="本日の売上合計" value={formatCurrency(todayTotal)} />
          <MetricCard title="総売上合計" value={formatCurrency(allTotal)} />
          <MetricCard title="売上ブロック" value={`${payments.length}個`} />
          <MetricCard
            title="予約ステータス"
            value={reservationStatus || "未連動"}
          />
        </div>

        {reservationId ? (
          <div style={statusInfoBoxStyle}>
            予約ID: {reservationId}
            {existingSalesForReservation.length > 0
              ? ` / 既存売上 ${existingSalesForReservation.length}件`
              : " / この予約は未売上登録"}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              windowWidth < 1280
                ? "minmax(0, 1fr)"
                : "minmax(0, 1.55fr) minmax(280px, 360px)",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "24px",
              minWidth: 0,
              width: "100%",
            }}
          >
            <section style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={sectionTitleStyle}>売上登録</h2>
                {prefillLoading ? (
                  <span style={miniInfoStyle}>予約情報を反映中...</span>
                ) : reservationId ? (
                  <span style={miniInfoStyle}>予約ID: {reservationId}</span>
                ) : null}
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
                    <option value="">
                      {customerLoading ? "顧客を読み込み中..." : "顧客を選択してください"}
                    </option>
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
                    style={inputStyle}
                    placeholder="例: ストレッチ回数券"
                  />
                </div>

                <div>
                  <label style={labelStyle}>サービス種別</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    style={inputStyle}
                  >
                    <option value="ストレッチ">ストレッチ</option>
                    <option value="トレーニング">トレーニング</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>担当スタッフ</label>
                  <select
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                    style={inputStyle}
                  >
                    {STAFF_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
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
                    {STORE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
                <div style={labelStyle}>支払いブロック</div>

                <div style={{ display: "grid", gap: "12px" }}>
                  {payments.map((payment, index) => (
                    <div key={payment.id} style={paymentCardStyle}>
                      <div style={paymentGridStyle}>
                        <div>
                          <label style={labelStyle}>売上区分</label>
                          <select
                            value={payment.saleType}
                            onChange={(e) =>
                              updatePayment(
                                payment.id,
                                "saleType",
                                e.target.value as AccountingType
                              )
                            }
                            style={inputStyle}
                          >
                            <option value="通常売上">通常売上</option>
                            <option value="前受金">前受金</option>
                            <option value="回数券消化">回数券消化</option>
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>支払方法</label>
                          <select
                            value={payment.paymentMethod}
                            onChange={(e) =>
                              updatePayment(
                                payment.id,
                                "paymentMethod",
                                e.target.value as PaymentMethod
                              )
                            }
                            style={inputStyle}
                            disabled={payment.saleType === "回数券消化"}
                          >
                            {PAYMENT_OPTIONS.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>金額</label>
                          <input
                            type="number"
                            min="0"
                            value={payment.amount}
                            onChange={(e) =>
                              updatePayment(payment.id, "amount", e.target.value)
                            }
                            style={inputStyle}
                            disabled={payment.saleType === "回数券消化"}
                            placeholder={payment.saleType === "回数券消化" ? "0" : "金額入力"}
                          />
                        </div>

                        <div style={{ display: "flex", alignItems: "end" }}>
                          <button
                            type="button"
                            onClick={() => removePaymentRow(payment.id)}
                            style={{
                              ...dangerButtonStyle,
                              width: "100%",
                              opacity: index === 0 && payments.length === 1 ? 0.5 : 1,
                            }}
                            disabled={index === 0 && payments.length === 1}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button type="button" onClick={addPaymentRow} style={subButtonAsButtonStyle}>
                    ＋ 支払い追加
                  </button>

                  <div style={totalBoxStyle}>
                    合計: {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
                <label style={labelStyle}>メモ</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={textareaStyle}
                  placeholder="メモ"
                />
              </div>

              <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleAddSale}
                  style={mainButtonStyle}
                  disabled={saving}
                >
                  {saving ? "保存中..." : "売上を登録"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  style={subButtonAsButtonStyle}
                >
                  リセット
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  style={subButtonAsButtonStyle}
                >
                  日別集計CSV
                </button>
              </div>
            </section>

            <section style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={sectionTitleStyle}>売上一覧</h2>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="顧客名・スタッフ・日付などで検索"
                  style={{ ...inputStyle, width: "280px", maxWidth: "100%" }}
                />
              </div>

              {loading ? (
                <div style={emptyBoxStyle}>読み込み中...</div>
              ) : filteredSales.length === 0 ? (
                <div style={emptyBoxStyle}>売上データがありません</div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {filteredSales.map((sale) => (
                    <div key={sale.id} style={saleRowStyle}>
                      <div style={saleRowTopStyle}>
                        <div>
                          <div style={saleNameStyle}>{sale.customerName}</div>
                          <div style={saleMetaStyle}>
                            {formatDateJP(sale.date)} / {sale.menuName} / {sale.staff} / {sale.storeName}
                          </div>
                          <div style={saleMetaStyle}>
                            {sale.accountingType} / {sale.paymentMethod}
                            {sale.reservationId ? ` / 予約ID:${sale.reservationId}` : ""}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={saleAmountStyle}>{formatCurrency(sale.amount)}</div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSale(sale.id)}
                            style={deleteInlineButtonStyle}
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      {sale.note ? <div style={saleNoteStyle}>{sale.note}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside style={{ display: "grid", gap: "24px" }}>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>月別売上</h2>
              {monthlyTotals.length === 0 ? (
                <div style={emptyBoxStyle}>データなし</div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {monthlyTotals.map(([month, amount]) => (
                    <div key={month} style={summaryRowStyle}>
                      <span>{month}</span>
                      <strong>{formatCurrency(amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>スタッフ別売上</h2>
              {staffTotals.length === 0 ? (
                <div style={emptyBoxStyle}>データなし</div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {staffTotals.map(([name, amount]) => (
                    <div key={name} style={summaryRowStyle}>
                      <span>{name}</span>
                      <strong>{formatCurrency(amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>支払方法別売上</h2>
              {paymentTotals.length === 0 ? (
                <div style={emptyBoxStyle}>データなし</div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {paymentTotals.map(([name, amount]) => (
                    <div key={name} style={summaryRowStyle}>
                      <span>{name}</span>
                      <strong>{formatCurrency(amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={metricCardStyle}>
      <div style={metricTitleStyle}>{title}</div>
      <div style={metricValueStyle}>{value}</div>
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "24px",
  padding: "22px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
  backdropFilter: "blur(10px)",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "22px",
  fontWeight: 800,
  margin: 0,
  color: "#111827",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "18px",
};

const paymentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
};

const paymentCardStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "8px",
  color: "#374151",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  padding: "0 14px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: "14px",
  outline: "none",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "110px",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: "14px",
  outline: "none",
  resize: "vertical",
};

const mainButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "44px",
  padding: "0 18px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const subButtonAsButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "44px",
  padding: "0 18px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "44px",
  padding: "0 18px",
  borderRadius: "14px",
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: 700,
  cursor: "pointer",
};

const mainLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "42px",
  padding: "0 14px",
  borderRadius: "12px",
  background: "#111827",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
};

const subButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "42px",
  padding: "0 14px",
  borderRadius: "12px",
  background: "#fff",
  color: "#111827",
  textDecoration: "none",
  fontWeight: 700,
  border: "1px solid #d1d5db",
};

const topMetricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const metricCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "22px",
  padding: "18px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
};

const metricTitleStyle: CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: 700,
  marginBottom: "8px",
};

const metricValueStyle: CSSProperties = {
  fontSize: "28px",
  color: "#111827",
  fontWeight: 800,
  lineHeight: 1.2,
};

const totalBoxStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "44px",
  padding: "0 18px",
  borderRadius: "14px",
  background: "#f3f4f6",
  color: "#111827",
  fontWeight: 800,
};

const miniInfoStyle: CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: 700,
};

const statusInfoBoxStyle: CSSProperties = {
  marginBottom: "20px",
  padding: "12px 14px",
  borderRadius: "14px",
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  fontWeight: 700,
  fontSize: "13px",
};

const saleRowStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const saleRowTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const saleNameStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#111827",
};

const saleMetaStyle: CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "4px",
};

const saleAmountStyle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#111827",
};

const saleNoteStyle: CSSProperties = {
  marginTop: "10px",
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#475569",
  fontSize: "12px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const deleteInlineButtonStyle: CSSProperties = {
  marginTop: "8px",
  background: "transparent",
  border: "none",
  color: "#dc2626",
  cursor: "pointer",
  fontWeight: 700,
};

const summaryRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#111827",
};

const emptyBoxStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "16px",
  background: "#f8fafc",
  color: "#6b7280",
  fontWeight: 700,
};