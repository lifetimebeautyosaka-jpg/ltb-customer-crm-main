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

type MonthlySalesSummary = {
  month: string;
  total: number;
  normal: number;
  advance: number;
  ticket: number;
};

type SalesSummaryRow = {
  name: string;
  total: number;
  normal: number;
  advance: number;
  ticket: number;
  count: number;
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

function getPrevMonthString(monthString: string) {
  const [yearText, monthText] = monthString.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!year || !month) return currentMonthString();

  const date = new Date(year, month - 2, 1);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${y}-${m}`;
}

function formatMonthLabel(monthString: string) {
  const [yearText, monthText] = monthString.split("-");
  if (!yearText || !monthText) return monthString;
  return `${Number(yearText)}年${Number(monthText)}月`;
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

function buildSalesSummaryRows(
  sales: Sale[],
  keyGetter: (sale: Sale) => string
): SalesSummaryRow[] {
  const grouped: Record<string, SalesSummaryRow> = {};

  sales.forEach((sale) => {
    const key = trimmed(keyGetter(sale)) || "未設定";

    if (!grouped[key]) {
      grouped[key] = {
        name: key,
        total: 0,
        normal: 0,
        advance: 0,
        ticket: 0,
        count: 0,
      };
    }

    const amount = Number(sale.amount || 0);
    grouped[key].total += amount;
    grouped[key].count += 1;

    if (sale.accountingType === "通常売上") grouped[key].normal += amount;
    if (sale.accountingType === "前受金") grouped[key].advance += amount;
    if (sale.accountingType === "回数券消化") grouped[key].ticket += amount;
  });

  return Object.values(grouped).sort((a, b) => b.total - a.total);
}

function calcMonthChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return "±0%";
    return "前月なし";
  }

  const diff = ((current - previous) / previous) * 100;
  const sign = diff > 0 ? "+" : "";

  return `${sign}${diff.toFixed(1)}%`;
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

  const [selectedSalesMonth, setSelectedSalesMonth] = useState(currentMonthString());

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
    const grouped: Record<string, MonthlySalesSummary> = {};

    sales.forEach((sale) => {
      const month = (sale.date || "").slice(0, 7);
      if (!month) return;

      if (!grouped[month]) {
        grouped[month] = {
          month,
          total: 0,
          normal: 0,
          advance: 0,
          ticket: 0,
        };
      }

      const amount = Number(sale.amount || 0);

      grouped[month].total += amount;

      if (sale.accountingType === "通常売上") {
        grouped[month].normal += amount;
      }

      if (sale.accountingType === "前受金") {
        grouped[month].advance += amount;
      }

      if (sale.accountingType === "回数券消化") {
        grouped[month].ticket += amount;
      }
    });

    return Object.values(grouped).sort((a, b) =>
      a.month < b.month ? 1 : -1
    );
  }, [sales]);

  const selectedMonthSales = useMemo(() => {
    return sales.filter((sale) =>
      (sale.date || "").startsWith(selectedSalesMonth)
    );
  }, [sales, selectedSalesMonth]);

  const prevMonthSales = useMemo(() => {
    const prevMonth = getPrevMonthString(selectedSalesMonth);

    return sales.filter((sale) =>
      (sale.date || "").startsWith(prevMonth)
    );
  }, [sales, selectedSalesMonth]);

  const selectedMonthTotal = useMemo(() => {
    return selectedMonthSales.reduce(
      (sum, sale) => sum + Number(sale.amount || 0),
      0
    );
  }, [selectedMonthSales]);

  const prevMonthTotal = useMemo(() => {
    return prevMonthSales.reduce(
      (sum, sale) => sum + Number(sale.amount || 0),
      0
    );
  }, [prevMonthSales]);

  const normalSalesTotal = useMemo(() => {
    return selectedMonthSales
      .filter((sale) => sale.accountingType === "通常売上")
      .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }, [selectedMonthSales]);

  const advanceSalesTotal = useMemo(() => {
    return selectedMonthSales
      .filter((sale) => sale.accountingType === "前受金")
      .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }, [selectedMonthSales]);

  const ticketSalesTotal = useMemo(() => {
    return selectedMonthSales
      .filter((sale) => sale.accountingType === "回数券消化")
      .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }, [selectedMonthSales]);

  const monthChangeText = useMemo(() => {
    return calcMonthChange(selectedMonthTotal, prevMonthTotal);
  }, [selectedMonthTotal, prevMonthTotal]);

  const selectedMonthStoreTotals = useMemo(() => {
    return buildSalesSummaryRows(
      selectedMonthSales,
      (sale) => sale.storeName
    );
  }, [selectedMonthSales]);

  const selectedMonthStaffTotals = useMemo(() => {
    return buildSalesSummaryRows(
      selectedMonthSales,
      (sale) => sale.staff
    );
  }, [selectedMonthSales]);

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

      if (
        nextStatus === "決済済" &&
        billing.billing_status !== "決済済"
      ) {
        let salesId = billing.sales_id;

        if (!salesId) {
          const customerName =
            customerMap.get(String(billing.customer_id))?.name || "未設定";

          const serviceType =
            deriveServiceTypeFromContract(currentContract);

          const paymentMethodForSales =
            normalizeBillingPaymentToSales(billing.payment_method);

          const salePayload = {
            customer_id: Number(billing.customer_id),
            customer_name: customerName,
            sale_date: billing.billing_date,
            menu_type: serviceType,
            sale_type: "通常売上",
            payment_method: paymentMethodForSales,
            amount: Number(billing.amount || 0),
            staff_name: "月額自動",
            store_name:
              trimmed(currentContract.store_name) || "未設定",
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

          const { data: insertedSale, error: saleError } =
            await supabase
              .from("sales")
              .insert([salePayload])
              .select("id")
              .single();

          if (saleError) {
            throw new Error(
              `sales 自動登録エラー: ${saleError.message}`
            );
          }

          salesId = insertedSale?.id ?? null;
        }
                const nextBillingDate = nextMonthDate(
          billing.billing_date,
          currentContract.billing_day || 1
        );

        const updatePayload: Partial<MonthlyBillingRow> = {
          billing_status: "決済済",
          paid_at: new Date().toISOString(),
          sales_id: salesId,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("monthly_billings")
          .update(updatePayload)
          .eq("id", billing.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        const { error: contractError } = await supabase
          .from("monthly_contracts")
          .update({
            next_billing_date: nextBillingDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentContract.id);

        if (contractError) {
          console.warn("contract update warning:", contractError.message);
        }

        await fetchBillings();
        await fetchContracts();
        await fetchSales();

        alert("決済済みに更新しました");
        return;
      }

      const { error } = await supabase
        .from("monthly_billings")
        .update({
          billing_status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", billing.id);

      if (error) {
        throw error;
      }

      await fetchBillings();
      alert("ステータスを更新しました");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "ステータス更新に失敗しました"
      );
    } finally {
      setSavingId("");
    }
  };

  if (!mounted) return null;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>会計・月額管理</h1>
            <p style={subtitleStyle}>
              月額契約・請求・自動売上・店舗別集計を一括管理
            </p>
          </div>

          <div style={headerButtonWrapStyle}>
            <Link href="/" style={headerButtonStyle}>
              ← ホーム
            </Link>
          </div>
        </div>

        <div
          style={{
            ...summaryGridStyle,
            gridTemplateColumns: compact
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(4, minmax(0, 1fr))",
          }}
        >
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>有効契約数</div>
            <div style={summaryValueStyle}>
              {totals.activeContracts}件
            </div>
            <div style={summarySubStyle}>
              全契約 {totals.contracts}件
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>今月請求額</div>
            <div style={summaryValueStyle}>
              {formatCurrency(totals.thisMonthTotal)}
            </div>
            <div style={summarySubStyle}>
              {totals.thisMonthBillings}件
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>決済済合計</div>
            <div style={summaryValueStyle}>
              {formatCurrency(totals.billingPaid)}
            </div>
            <div style={summarySubStyle}>
              未払い {formatCurrency(totals.billingUnpaid)}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>請求予定合計</div>
            <div style={summaryValueStyle}>
              {formatCurrency(totals.billingPlanned)}
            </div>
            <div style={summarySubStyle}>
              失敗 {statusCounts.failed}件
            </div>
          </div>
        </div>

        <div style={salesAnalyticsCardStyle}>
          <div style={salesAnalyticsHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>売上分析</h2>
              <p style={sectionSubStyle}>
                月別・店舗別・担当別の売上分析
              </p>
            </div>

            <input
              type="month"
              value={selectedSalesMonth}
              onChange={(e) => setSelectedSalesMonth(e.target.value)}
              style={{
                ...inputStyle,
                width: mobile ? "100%" : "180px",
              }}
            />
          </div>

          <div
            style={{
              ...summaryGridStyle,
              gridTemplateColumns: compact
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(4, minmax(0, 1fr))",
              marginBottom: "24px",
            }}
          >
            <div style={darkCardStyle}>
              <div style={summaryLabelWhiteStyle}>総売上</div>
              <div style={summaryValueWhiteStyle}>
                {formatCurrency(selectedMonthTotal)}
              </div>
              <div style={summarySubWhiteStyle}>
                前月比 {monthChangeText}
              </div>
            </div>

            <div style={darkCardStyle}>
              <div style={summaryLabelWhiteStyle}>通常売上</div>
              <div style={summaryValueWhiteStyle}>
                {formatCurrency(normalSalesTotal)}
              </div>
              <div style={summarySubWhiteStyle}>
                都度・通常売上
              </div>
            </div>

            <div style={darkCardStyle}>
              <div style={summaryLabelWhiteStyle}>前受金</div>
              <div style={summaryValueWhiteStyle}>
                {formatCurrency(advanceSalesTotal)}
              </div>
              <div style={summarySubWhiteStyle}>
                回数券販売
              </div>
            </div>

            <div style={darkCardStyle}>
              <div style={summaryLabelWhiteStyle}>回数券消化</div>
              <div style={summaryValueWhiteStyle}>
                {formatCurrency(ticketSalesTotal)}
              </div>
              <div style={summarySubWhiteStyle}>
                消化売上
              </div>
            </div>
          </div>

          <div
            style={{
              ...summaryGridStyle,
              gridTemplateColumns: compact
                ? "1fr"
                : "repeat(2, minmax(0, 1fr))",
            }}
          >
            <div style={tableCardStyle}>
              <div style={tableTitleStyle}>店舗別売上</div>

              {selectedMonthStoreTotals.length === 0 ? (
                <div style={emptyStyle}>
                  データがありません
                </div>
              ) : (
                <div style={rankListStyle}>
                  {selectedMonthStoreTotals.map((row) => (
                    <div key={row.name} style={rankItemStyle}>
                      <div>
                        <div style={rankNameStyle}>
                          {row.name}
                        </div>

                        <div style={rankSubStyle}>
                          通常 {formatCurrency(row.normal)} /
                          前受金 {formatCurrency(row.advance)} /
                          消化 {formatCurrency(row.ticket)}
                        </div>
                      </div>

                      <div style={rankAmountWrapStyle}>
                        <div style={rankAmountStyle}>
                          {formatCurrency(row.total)}
                        </div>

                        <div style={rankCountStyle}>
                          {row.count}件
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={tableCardStyle}>
              <div style={tableTitleStyle}>担当者別売上</div>

              {selectedMonthStaffTotals.length === 0 ? (
                <div style={emptyStyle}>
                  データがありません
                </div>
              ) : (
                <div style={rankListStyle}>
                  {selectedMonthStaffTotals.map((row) => (
                    <div key={row.name} style={rankItemStyle}>
                      <div>
                        <div style={rankNameStyle}>
                          {row.name}
                        </div>

                        <div style={rankSubStyle}>
                          通常 {formatCurrency(row.normal)} /
                          前受金 {formatCurrency(row.advance)} /
                          消化 {formatCurrency(row.ticket)}
                        </div>
                      </div>

                      <div style={rankAmountWrapStyle}>
                        <div style={rankAmountStyle}>
                          {formatCurrency(row.total)}
                        </div>

                        <div style={rankCountStyle}>
                          {row.count}件
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            ...summaryGridStyle,
            gridTemplateColumns: compact
              ? "1fr"
              : "repeat(2, minmax(0, 1fr))",
          }}
        >
          <div style={tableCardStyle}>
            <div style={tableTitleStyle}>店舗別 月額合計</div>

            <div style={miniListStyle}>
              {storeTotals.map(([store, amount]) => (
                <div key={store} style={miniRowStyle}>
                  <span>{store}</span>
                  <strong>{formatCurrency(amount)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={tableCardStyle}>
            <div style={tableTitleStyle}>支払方法別請求額</div>

            <div style={miniListStyle}>
              {paymentMethodTotals.map(([method, amount]) => (
                <div key={method} style={miniRowStyle}>
                  <span>{method}</span>
                  <strong>{formatCurrency(amount)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={tableCardStyle}>
          <div style={tableTitleStyle}>月別売上集計</div>

          <div style={{ overflowX: "auto" }}>
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
                {monthlySalesTotals.map((row) => (
                  <tr key={row.month}>
                    <td style={tdStyle}>
                      {formatMonthLabel(row.month)}
                    </td>

                    <td style={tdStyle}>
                      {formatCurrency(row.total)}
                    </td>

                    <td style={tdStyle}>
                      {formatCurrency(row.normal)}
                    </td>

                    <td style={tdStyle}>
                      {formatCurrency(row.advance)}
                    </td>

                    <td style={tdStyle}>
                      {formatCurrency(row.ticket)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg,#f8fafc 0%,#eef2ff 50%,#e2e8f0 100%)",
  padding: "24px",
};

const containerStyle: CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "34px",
  fontWeight: 800,
  color: "#0f172a",
};

const subtitleStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#64748b",
};

const headerButtonWrapStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
};

const headerButtonStyle: CSSProperties = {
  textDecoration: "none",
  padding: "12px 18px",
  borderRadius: "14px",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 700,
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  marginBottom: "24px",
};

const summaryCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.75)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "24px",
  padding: "22px",
};

const summaryLabelStyle: CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  marginBottom: "8px",
  fontWeight: 700,
};

const summaryValueStyle: CSSProperties = {
  fontSize: "32px",
  fontWeight: 800,
  color: "#0f172a",
};

const summarySubStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "13px",
  color: "#64748b",
};

const salesAnalyticsCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "28px",
  padding: "24px",
  marginBottom: "24px",
};

const salesAnalyticsHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800,
  color: "#0f172a",
};

const sectionSubStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#64748b",
};

const inputStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(203,213,225,0.9)",
  background: "#fff",
  fontSize: "14px",
};

const darkCardStyle: CSSProperties = {
  background: "#0f172a",
  color: "#fff",
  borderRadius: "24px",
  padding: "22px",
};

const summaryLabelWhiteStyle: CSSProperties = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.7)",
  marginBottom: "8px",
  fontWeight: 700,
};

const summaryValueWhiteStyle: CSSProperties = {
  fontSize: "30px",
  fontWeight: 800,
};

const summarySubWhiteStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "12px",
  color: "rgba(255,255,255,0.7)",
};

const tableCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.75)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "24px",
  padding: "20px",
  marginBottom: "24px",
};

const tableTitleStyle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: "16px",
};

const rankListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const rankItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  background: "#fff",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "18px",
  padding: "14px",
};

const rankNameStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 800,
  color: "#0f172a",
};

const rankSubStyle: CSSProperties = {
  marginTop: "5px",
  fontSize: "12px",
  color: "#64748b",
};

const rankAmountWrapStyle: CSSProperties = {
  textAlign: "right",
};

const rankAmountStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#0f172a",
};

const rankCountStyle: CSSProperties = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#64748b",
};

const miniListStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const miniRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px 0",
  borderBottom: "1px solid rgba(226,232,240,0.9)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: CSSProperties = {
  padding: "12px",
  background: "#f8fafc",
  borderBottom: "1px solid rgba(226,232,240,0.9)",
  textAlign: "left",
  fontSize: "13px",
  color: "#475569",
};

const tdStyle: CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid rgba(226,232,240,0.7)",
  fontSize: "14px",
  color: "#0f172a",
};

const emptyStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "18px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
};