"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";

type ContractStatus = "有効" | "停止" | "休会" | "解約";
type BillingStatus = "請求予定" | "決済済" | "未払い" | "失敗" | "キャンセル";
type ServiceType = "ストレッチ" | "トレーニング";
type AccountingType = "通常売上" | "前受金" | "回数券消化";
type PaymentMethod =
  | "現金"
  | "カード"
  | "クレジットカード"
  | "銀行振込"
  | "口座振替"
  | "店頭決済"
  | "その他";

type MonthlyContractRow = {
  id: number | string;
  customer_id: number | string;
  signup_id: number | string | null;
  course_name: string;
  plan_id: string | null;
  plan_name: string;
  monthly_price: number;
  payment_method: PaymentMethod;
  store_name: string | null;
  visit_style: string | null;
  start_date: string;
  billing_day: number;
  next_billing_date: string;
  contract_status: ContractStatus;
  end_date: string | null;
  cancel_requested_at: string | null;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type MonthlyBillingRow = {
  id: number | string;
  contract_id: number | string;
  customer_id: number | string;
  billing_month: string;
  billing_date: string;
  due_date: string | null;
  amount: number;
  payment_method: PaymentMethod;
  billing_status: BillingStatus;
  paid_at: string | null;
  sales_id: number | string | null;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CustomerRow = {
  id: number | string;
  name: string | null;
  phone: string | null;
  email: string | null;
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
  paymentMethod: PaymentMethod | string;
  amount: number;
  note: string;
  createdAt: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function trimmed(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function formatCurrency(value: number) {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function currentMonthString() {
  return todayString().slice(0, 7);
}

function formatDateJP(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}/${`${d.getMonth() + 1}`.padStart(2, "0")}/${`${d.getDate()}`.padStart(2, "0")}`;
}

function daysUntil(dateString?: string | null) {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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

function rowToSale(row: SupabaseSaleRow): Sale {
  const serviceType = normalizeServiceType(row.menu_type);
  const accountingType = normalizeAccountingType(row.sale_type);
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
    paymentMethod: row.payment_method || "その他",
    amount,
    note: row.memo || "",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function deriveServiceTypeFromContract(contract: MonthlyContractRow): ServiceType {
  const joined = `${trimmed(contract.course_name)} ${trimmed(contract.plan_name)}`;
  if (joined.includes("ストレッチ")) return "ストレッチ";
  return "トレーニング";
}

function normalizeBillingPaymentToSales(paymentMethod: PaymentMethod): string {
  if (paymentMethod === "クレジットカード") return "カード";
  if (paymentMethod === "口座振替") return "その他";
  if (paymentMethod === "店頭決済") return "その他";
  return paymentMethod;
}

function nextMonthDate(dateString: string, billingDay: number) {
  const base = new Date(dateString);
  if (Number.isNaN(base.getTime())) return dateString;

  const year = base.getFullYear();
  const month = base.getMonth();
  const next = new Date(year, month + 1, Math.min(billingDay, 28));
  const y = next.getFullYear();
  const m = `${next.getMonth() + 1}`.padStart(2, "0");
  const d = `${next.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AccountingPage() {
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [contracts, setContracts] = useState<MonthlyContractRow[]>([]);
  const [billings, setBillings] = useState<MonthlyBillingRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [loadingContracts, setLoadingContracts] = useState(true);
  const [loadingBillings, setLoadingBillings] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);

  const [search, setSearch] = useState("");
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>("すべて");
  const [savingId, setSavingId] = useState<string>("");

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
  const compact = windowWidth < 1024;

  const fetchContracts = async () => {
    try {
      setLoadingContracts(true);
      const { data, error } = await supabase
        .from("monthly_contracts")
        .select(
          "id, customer_id, signup_id, course_name, plan_id, plan_name, monthly_price, payment_method, store_name, visit_style, start_date, billing_day, next_billing_date, contract_status, end_date, cancel_requested_at, note, created_at, updated_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        alert(`契約取得エラー: ${error.message}`);
        setContracts([]);
        return;
      }

      setContracts((data as MonthlyContractRow[] | null) || []);
    } catch (error) {
      console.error("fetchContracts error:", error);
      setContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  };

  const fetchBillings = async () => {
    try {
      setLoadingBillings(true);
      const { data, error } = await supabase
        .from("monthly_billings")
        .select(
          "id, contract_id, customer_id, billing_month, billing_date, due_date, amount, payment_method, billing_status, paid_at, sales_id, note, created_at, updated_at"
        )
        .order("billing_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        alert(`請求取得エラー: ${error.message}`);
        setBillings([]);
        return;
      }

      setBillings((data as MonthlyBillingRow[] | null) || []);
    } catch (error) {
      console.error("fetchBillings error:", error);
      setBillings([]);
    } finally {
      setLoadingBillings(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email")
        .order("name", { ascending: true });

      if (error) {
        console.warn("customers fetch error:", error.message);
        setCustomers([]);
        return;
      }

      setCustomers((data as CustomerRow[] | null) || []);
    } catch (error) {
      console.error("fetchCustomers error:", error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchSales = async () => {
    try {
      setLoadingSales(true);
      const { data, error } = await supabase
        .from("sales")
        .select(
          "id, customer_id, customer_name, sale_date, menu_type, sale_type, payment_method, amount, staff_name, store_name, reservation_id, memo, created_at"
        )
        .order("sale_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("sales fetch error:", error.message);
        setSales([]);
        return;
      }

      setSales(((data as SupabaseSaleRow[] | null) || []).map(rowToSale));
    } catch (error) {
      console.error("fetchSales error:", error);
      setSales([]);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    void fetchContracts();
    void fetchBillings();
    void fetchCustomers();
    void fetchSales();
  }, [mounted]);

  const customerMap = useMemo(() => {
    const map = new Map<string, CustomerRow>();
    customers.forEach((row) => map.set(String(row.id), row));
    return map;
  }, [customers]);

  const contractMap = useMemo(() => {
    const map = new Map<string, MonthlyContractRow>();
    contracts.forEach((row) => map.set(String(row.id), row));
    return map;
  }, [contracts]);

  const enrichedBillings = useMemo(() => {
    return billings.map((billing) => {
      const contract = contractMap.get(String(billing.contract_id)) || null;
      const customer = customerMap.get(String(billing.customer_id)) || null;

      return {
        ...billing,
        contract,
        customerName: customer?.name || "未設定",
        storeName: contract?.store_name || "未設定",
        courseName: contract?.course_name || contract?.plan_name || "未設定",
        contractStatus: contract?.contract_status || "未設定",
      };
    });
  }, [billings, contractMap, customerMap]);

  const filteredBillings = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return enrichedBillings.filter((row) => {
      const matchesStatus =
        billingStatusFilter === "すべて" || row.billing_status === billingStatusFilter;

      const matchesKeyword =
        !keyword ||
        row.customerName.toLowerCase().includes(keyword) ||
        trimmed(row.courseName).toLowerCase().includes(keyword) ||
        trimmed(row.storeName).toLowerCase().includes(keyword) ||
        trimmed(row.payment_method).toLowerCase().includes(keyword) ||
        trimmed(row.billing_month).toLowerCase().includes(keyword) ||
        trimmed(row.note).toLowerCase().includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [enrichedBillings, search, billingStatusFilter]);

  const activeContracts = useMemo(
    () => contracts.filter((c) => c.contract_status === "有効"),
    [contracts]
  );

  const currentMonthBillings = useMemo(() => {
    const month = currentMonthString();
    return billings.filter((b) => b.billing_month === month);
  }, [billings]);

  const totals = useMemo(() => {
    const billingPlanned = billings
      .filter((b) => b.billing_status === "請求予定")
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const billingPaid = billings
      .filter((b) => b.billing_status === "決済済")
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const billingUnpaid = billings
      .filter((b) => b.billing_status === "未払い")
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const thisMonthTotal = currentMonthBillings.reduce(
      (sum, b) => sum + Number(b.amount || 0),
      0
    );

    return {
      contracts: contracts.length,
      activeContracts: activeContracts.length,
      thisMonthBillings: currentMonthBillings.length,
      thisMonthTotal,
      billingPlanned,
      billingPaid,
      billingUnpaid,
    };
  }, [billings, contracts, activeContracts, currentMonthBillings]);

  const statusCounts = useMemo(() => {
    return {
      planned: billings.filter((b) => b.billing_status === "請求予定").length,
      paid: billings.filter((b) => b.billing_status === "決済済").length,
      unpaid: billings.filter((b) => b.billing_status === "未払い").length,
      failed: billings.filter((b) => b.billing_status === "失敗").length,
      canceled: billings.filter((b) => b.billing_status === "キャンセル").length,
    };
  }, [billings]);

  const upcomingContracts = useMemo(() => {
    return activeContracts
      .map((row) => ({
        ...row,
        days: daysUntil(row.next_billing_date),
      }))
      .filter((row) => row.days !== null && row.days! >= 0 && row.days! <= 7)
      .sort((a, b) => (a.days! > b.days! ? 1 : -1));
  }, [activeContracts]);

  const monthlySalesTotals = useMemo(() => {
    const grouped: Record<
      string,
      { total: number; normal: number; advance: number; ticket: number }
    > = {};

    sales.forEach((sale) => {
      const month = (sale.date || "").slice(0, 7);
      if (!month) return;

      if (!grouped[month]) {
        grouped[month] = {
          total: 0,
          normal: 0,
          advance: 0,
          ticket: 0,
        };
      }

      const amount = Number(sale.amount || 0);
      grouped[month].total += amount;

      if (sale.accountingType === "通常売上") grouped[month].normal += amount;
      if (sale.accountingType === "前受金") grouped[month].advance += amount;
      if (sale.accountingType === "回数券消化") grouped[month].ticket += amount;
    });

    return Object.entries(grouped)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([month, values]) => ({
        month,
        ...values,
      }));
  }, [sales]);

  const storeTotals = useMemo(() => {
    const grouped: Record<string, number> = {};

    activeContracts.forEach((row) => {
      const key = trimmed(row.store_name) || "未設定";
      grouped[key] = (grouped[key] || 0) + Number(row.monthly_price || 0);
    });

    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [activeContracts]);

  const paymentMethodTotals = useMemo(() => {
    const grouped: Record<string, number> = {};

    billings.forEach((row) => {
      const key = trimmed(row.payment_method) || "未設定";
      grouped[key] = (grouped[key] || 0) + Number(row.amount || 0);
    });

    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [billings]);

  const handleChangeBillingStatus = async (
    billing: MonthlyBillingRow,
    nextStatus: BillingStatus
  ) => {
    try {
      setSavingId(String(billing.id));

      const currentContract = contractMap.get(String(billing.contract_id));
      if (!currentContract) {
        throw new Error("紐づく契約が見つかりません");
      }

      if (nextStatus === "決済済" && billing.billing_status !== "決済済") {
        let salesId = billing.sales_id;

        if (!salesId) {
          const customerName =
            customerMap.get(String(billing.customer_id))?.name || "未設定";
          const serviceType = deriveServiceTypeFromContract(currentContract);
          const paymentMethodForSales = normalizeBillingPaymentToSales(
            billing.payment_method
          );

          const salePayload = {
            customer_id: Number(billing.customer_id),
            customer_name: customerName,
            sale_date: billing.billing_date,
            menu_type: serviceType,
            sale_type: "通常売上",
            payment_method: paymentMethodForSales,
            amount: Number(billing.amount || 0),
            staff_name: "月額自動",
            store_name: trimmed(currentContract.store_name) || "未設定",
            reservation_id: null,
            memo: [
              "monthly_billings から自動売上作成",
              `contract_id: ${currentContract.id}`,
              `billing_id: ${billing.id}`,
              `billing_month: ${billing.billing_month}`,
              `プラン: ${currentContract.plan_name}`,
            ]
              .filter(Boolean)
              .join("\n"),
          };

          const { data: insertedSale, error: saleError } = await supabase
            .from("sales")
            .insert([salePayload])
            .select("id")
            .single();

          if (saleError) {
            throw new Error(`sales 自動登録エラー: ${saleError.message}`);
          }

          salesId = insertedSale?.id ?? null;
        }

        const nextBillingDate = nextMonthDate(
          billing.billing_date || currentContract.next_billing_date,
          currentContract.billing_day
        );

        const { error: updateBillingError } = await supabase
          .from("monthly_billings")
          .update({
            billing_status: "決済済",
            paid_at: new Date().toISOString(),
            sales_id: salesId,
          })
          .eq("id", billing.id);

        if (updateBillingError) {
          throw new Error(`請求更新エラー: ${updateBillingError.message}`);
        }

        const { error: updateContractError } = await supabase
          .from("monthly_contracts")
          .update({
            next_billing_date: nextBillingDate,
          })
          .eq("id", currentContract.id);

        if (updateContractError) {
          throw new Error(`契約更新エラー: ${updateContractError.message}`);
        }

        const nextMonth = nextBillingDate.slice(0, 7);

        const { data: existingNextMonth, error: nextMonthCheckError } = await supabase
          .from("monthly_billings")
          .select("id")
          .eq("contract_id", currentContract.id)
          .eq("billing_month", nextMonth)
          .limit(1);

        if (nextMonthCheckError) {
          throw new Error(`次回請求確認エラー: ${nextMonthCheckError.message}`);
        }

        if (!existingNextMonth || existingNextMonth.length === 0) {
          const nextBillingPayload = {
            contract_id: Number(currentContract.id),
            customer_id: Number(currentContract.customer_id),
            billing_month: nextMonth,
            billing_date: nextBillingDate,
            due_date: nextBillingDate,
            amount: Number(currentContract.monthly_price || 0),
            payment_method: currentContract.payment_method,
            billing_status: "請求予定",
            note: `自動作成 / 前回 billing_id: ${billing.id}`,
          };

          const { error: createNextBillingError } = await supabase
            .from("monthly_billings")
            .insert([nextBillingPayload]);

          if (createNextBillingError) {
            throw new Error(`次回請求作成エラー: ${createNextBillingError.message}`);
          }
        }

        await fetchBillings();
        await fetchContracts();
        await fetchSales();

        alert("決済済に更新し、salesへ売上反映しました");
        return;
      }

      const payload: Record<string, unknown> = {
        billing_status: nextStatus,
      };

      if (nextStatus !== "決済済") {
        payload.paid_at = null;
      }

      const { error } = await supabase
        .from("monthly_billings")
        .update(payload)
        .eq("id", billing.id);

      if (error) {
        throw new Error(error.message);
      }

      await fetchBillings();
    } catch (error) {
      console.error("handleChangeBillingStatus error:", error);
      alert(error instanceof Error ? error.message : "請求ステータス更新に失敗しました");
    } finally {
      setSavingId("");
    }
  };

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f7f7f8 0%, #eceef1 45%, #e7eaef 100%)",
    padding: mobile ? "16px" : "24px",
    color: "#111827",
  };

  const innerStyle: CSSProperties = {
    maxWidth: "1520px",
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
    padding: "11px 16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
  };

  const successButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "linear-gradient(135deg, #166534 0%, #16a34a 100%)",
  };

  const warningButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
  };

  const dangerButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)",
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

  const miniTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
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
    fontSize: mobile ? "16px" : "22px",
    fontWeight: 800,
  };

  const tableWrapStyle: CSSProperties = {
    width: "100%",
    overflowX: "auto",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "#fff",
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    minWidth: "1480px",
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

  if (!mounted) return null;

  return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <section style={cardStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>会計管理</h1>
              <p style={subTextStyle}>
                月額契約・請求予定・未払い・決済済・売上反映まで管理
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  <Link href="/dashboard" style={linkButtonStyle}>
    ダッシュボードへ
  </Link>
  <Link href="/signup/list" style={linkButtonStyle}>
    入会申請一覧へ
  </Link>
  <Link href="/sales" style={linkButtonStyle}>
    売上管理へ
  </Link>
</div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={statGridStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>契約総数</div>
              <div style={statValueStyle}>{totals.contracts}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>有効契約</div>
              <div style={statValueStyle}>{totals.activeContracts}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>今月請求件数</div>
              <div style={statValueStyle}>{totals.thisMonthBillings}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>今月請求総額</div>
              <div style={statValueStyle}>{formatCurrency(totals.thisMonthTotal)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>決済済合計</div>
              <div style={statValueStyle}>{formatCurrency(totals.billingPaid)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>未払い合計</div>
              <div style={statValueStyle}>{formatCurrency(totals.billingUnpaid)}</div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <div style={statCardStyle}>
              <div style={statLabelStyle}>請求予定</div>
              <div style={statValueStyle}>{statusCounts.planned}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>決済済</div>
              <div style={statValueStyle}>{statusCounts.paid}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>未払い</div>
              <div style={statValueStyle}>{statusCounts.unpaid}件</div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={miniTitleStyle}>次回請求日が近い契約</h2>
          <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
            {loadingContracts ? (
              <div>読み込み中...</div>
            ) : upcomingContracts.length === 0 ? (
              <div style={{ color: "#6b7280" }}>7日以内の請求予定はありません</div>
            ) : (
              upcomingContracts.map((row) => {
                const customer = customerMap.get(String(row.customer_id));
                return (
                  <div
                    key={String(row.id)}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "14px",
                      background: "#fff",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {customer?.name || "未設定"} / {row.plan_name}
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "13px", color: "#6b7280" }}>
                        店舗: {trimmed(row.store_name) || "未設定"} / 次回請求日:{" "}
                        {row.next_billing_date}
                      </div>
                    </div>
                    <div>
                      <span style={pillStyle("#ede9fe", "#6d28d9")}>
                        あと {row.days} 日
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

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
            <h2 style={miniTitleStyle}>請求一覧</h2>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                width: mobile ? "100%" : "auto",
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="顧客名・コース・店舗で検索"
                style={{ ...inputStyle, minWidth: mobile ? "100%" : "260px" }}
              />
              <select
                value={billingStatusFilter}
                onChange={(e) => setBillingStatusFilter(e.target.value)}
                style={{ ...inputStyle, minWidth: mobile ? "100%" : "180px" }}
              >
                <option value="すべて">すべて</option>
                <option value="請求予定">請求予定</option>
                <option value="決済済">決済済</option>
                <option value="未払い">未払い</option>
                <option value="失敗">失敗</option>
                <option value="キャンセル">キャンセル</option>
              </select>
            </div>
          </div>

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>請求月</th>
                  <th style={thStyle}>顧客</th>
                  <th style={thStyle}>コース</th>
                  <th style={thStyle}>店舗</th>
                  <th style={thStyle}>請求日</th>
                  <th style={thStyle}>支払方法</th>
                  <th style={thStyle}>金額</th>
                  <th style={thStyle}>状態</th>
                  <th style={thStyle}>売上連携</th>
                  <th style={thStyle}>メモ</th>
                  <th style={thStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {loadingBillings ? (
                  <tr>
                    <td style={tdStyle} colSpan={11}>
                      読み込み中...
                    </td>
                  </tr>
                ) : filteredBillings.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={11}>
                      請求データがありません
                    </td>
                  </tr>
                ) : (
                  filteredBillings.map((row) => {
                    const isBusy = savingId === String(row.id);
                    return (
                      <tr key={String(row.id)}>
                        <td style={tdStyle}>{row.billing_month}</td>
                        <td style={tdStyle}>{row.customerName}</td>
                        <td style={tdStyle}>{trimmed(row.courseName) || "—"}</td>
                        <td style={tdStyle}>{trimmed(row.storeName) || "—"}</td>
                        <td style={tdStyle}>{formatDateJP(row.billing_date)}</td>
                        <td style={tdStyle}>{row.payment_method}</td>
                        <td style={{ ...tdStyle, fontWeight: 800 }}>
                          {formatCurrency(row.amount)}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={pillStyle(
                              row.billing_status === "決済済"
                                ? "#dcfce7"
                                : row.billing_status === "未払い"
                                ? "#fee2e2"
                                : row.billing_status === "請求予定"
                                ? "#dbeafe"
                                : "#f3f4f6",
                              row.billing_status === "決済済"
                                ? "#166534"
                                : row.billing_status === "未払い"
                                ? "#991b1b"
                                : row.billing_status === "請求予定"
                                ? "#1d4ed8"
                                : "#374151"
                            )}
                          >
                            {row.billing_status}
                          </span>
                        </td>
                        <td style={tdStyle}>{row.sales_id ? `sales:${row.sales_id}` : "未連携"}</td>
                        <td style={{ ...tdStyle, whiteSpace: "pre-wrap", minWidth: "220px" }}>
                          {row.note || "—"}
                        </td>
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              minWidth: "160px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleChangeBillingStatus(row, "決済済")
                              }
                              disabled={isBusy}
                              style={{
                                ...successButtonStyle,
                                opacity: isBusy ? 0.7 : 1,
                              }}
                            >
                              決済済
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleChangeBillingStatus(row, "未払い")
                              }
                              disabled={isBusy}
                              style={{
                                ...warningButtonStyle,
                                opacity: isBusy ? 0.7 : 1,
                              }}
                            >
                              未払い
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleChangeBillingStatus(row, "キャンセル")
                              }
                              disabled={isBusy}
                              style={{
                                ...dangerButtonStyle,
                                opacity: isBusy ? 0.7 : 1,
                              }}
                            >
                              キャンセル
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={miniTitleStyle}>契約一覧</h2>
          <div style={{ marginTop: "14px", ...tableWrapStyle }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>顧客</th>
                  <th style={thStyle}>コース</th>
                  <th style={thStyle}>プラン</th>
                  <th style={thStyle}>月額</th>
                  <th style={thStyle}>支払方法</th>
                  <th style={thStyle}>店舗</th>
                  <th style={thStyle}>開始日</th>
                  <th style={thStyle}>課金日</th>
                  <th style={thStyle}>次回請求日</th>
                  <th style={thStyle}>状態</th>
                </tr>
              </thead>
              <tbody>
                {loadingContracts ? (
                  <tr>
                    <td style={tdStyle} colSpan={10}>
                      読み込み中...
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={10}>
                      契約データがありません
                    </td>
                  </tr>
                ) : (
                  contracts.map((row) => {
                    const customer = customerMap.get(String(row.customer_id));
                    return (
                      <tr key={String(row.id)}>
                        <td style={tdStyle}>{customer?.name || "未設定"}</td>
                        <td style={tdStyle}>{row.course_name}</td>
                        <td style={tdStyle}>{row.plan_name}</td>
                        <td style={{ ...tdStyle, fontWeight: 800 }}>
                          {formatCurrency(row.monthly_price)}
                        </td>
                        <td style={tdStyle}>{row.payment_method}</td>
                        <td style={tdStyle}>{trimmed(row.store_name) || "—"}</td>
                        <td style={tdStyle}>{formatDateJP(row.start_date)}</td>
                        <td style={tdStyle}>{row.billing_day}日</td>
                        <td style={tdStyle}>{formatDateJP(row.next_billing_date)}</td>
                        <td style={tdStyle}>
                          <span
                            style={pillStyle(
                              row.contract_status === "有効" ? "#dcfce7" : "#f3f4f6",
                              row.contract_status === "有効" ? "#166534" : "#374151"
                            )}
                          >
                            {row.contract_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <div>
              <h2 style={miniTitleStyle}>店舗別月額</h2>
              <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
                {storeTotals.length === 0 ? (
                  <div style={{ color: "#6b7280" }}>データがありません</div>
                ) : (
                  storeTotals.map(([name, total]) => (
                    <div
                      key={name}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "14px",
                        background: "#fff",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <strong>{name}</strong>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 style={miniTitleStyle}>支払方法別請求額</h2>
              <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
                {paymentMethodTotals.length === 0 ? (
                  <div style={{ color: "#6b7280" }}>データがありません</div>
                ) : (
                  paymentMethodTotals.map(([name, total]) => (
                    <div
                      key={name}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "14px",
                        background: "#fff",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <strong>{name}</strong>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={miniTitleStyle}>月別売上集計</h2>
          <div style={{ marginTop: "14px", ...tableWrapStyle }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>月</th>
                  <th style={thStyle}>総売上</th>
                  <th style={thStyle}>通常売上</th>
                  <th style={thStyle}>前受金</th>
                  <th style={thStyle}>回数券消化</th>
                </tr>
              </thead>
              <tbody>
                {loadingSales ? (
                  <tr>
                    <td style={tdStyle} colSpan={5}>
                      読み込み中...
                    </td>
                  </tr>
                ) : monthlySalesTotals.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={5}>
                      売上データがありません
                    </td>
                  </tr>
                ) : (
                  monthlySalesTotals.map((row) => (
                    <tr key={row.month}>
                      <td style={tdStyle}>{row.month}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>
                        {formatCurrency(row.total)}
                      </td>
                      <td style={tdStyle}>{formatCurrency(row.normal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.advance)}</td>
                      <td style={tdStyle}>{formatCurrency(row.ticket)}</td>
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