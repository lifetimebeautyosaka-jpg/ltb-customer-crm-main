"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Customer = {
  id: string | number;
  name: string;
  phone?: string | null;
};

type ServiceType = "ストレッチ" | "トレーニング";
type AccountingType = "通常売上" | "前受金";
type PaymentMethod = "現金" | "カード" | "銀行振込" | "その他";

type SaleCategory =
  | "ストレッチ現金"
  | "ストレッチカード"
  | "ストレッチ銀行振込"
  | "ストレッチその他"
  | "ストレッチ前受金"
  | "トレーニング現金"
  | "トレーニングカード"
  | "トレーニング銀行振込"
  | "トレーニングその他"
  | "トレーニング前受金";

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

type DailySummaryRow = {
  date: string;
  stretchCash: number;
  stretchCard: number;
  stretchReceived: number;
  trainingCash: number;
  trainingCard: number;
  trainingReceived: number;
  netSalesTotal: number;
  advanceCash: number;
  advanceCard: number;
  advanceTotal: number;
  grandTotal: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STAFF_OPTIONS = ["山口", "スタッフ", "未設定"];
const STORE_OPTIONS = ["江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町", "未設定"];

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
    return serviceType === "ストレッチ" ? "ストレッチ前受金" : "トレーニング前受金";
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
  return value === "前受金" ? "前受金" : "通常売上";
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
        trainingCash: 0,
        trainingCard: 0,
        trainingReceived: 0,
        netSalesTotal: 0,
        advanceCash: 0,
        advanceCard: 0,
        advanceTotal: 0,
        grandTotal: 0,
      };
    }

    const amount = Number(sale.amount || 0);
    const isAdvance = sale.accountingType === "前受金";

    if (isAdvance) {
      if (sale.paymentMethod === "現金") {
        grouped[date].advanceCash += amount;
      } else {
        grouped[date].advanceCard += amount;
      }
    } else {
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
    }
  });

  return Object.values(grouped)
    .map((row) => {
      const netSalesTotal =
        row.stretchCash +
        row.stretchCard +
        row.stretchReceived +
        row.trainingCash +
        row.trainingCard +
        row.trainingReceived;

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

export default function SalesPage() {
  const [mounted, setMounted] = useState(false);

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

  const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow()]);

  const [loading, setLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const applyQueryParams = (customerList: Customer[]) => {
    const queryDate = getQueryParam("date");
    const queryCustomerName = getQueryParam("customer_name") || getQueryParam("customer");
    const queryStore = getQueryParam("store_name") || getQueryParam("store");
    const queryStaff = getQueryParam("staff_name") || getQueryParam("staff");
    const queryService = getQueryParam("service_type") || getQueryParam("service");
    const queryMenu = getQueryParam("menu");
    const queryReservationId = getQueryParam("reservation_id");

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

    if (queryCustomerName) {
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

  useEffect(() => {
    if (!mounted) return;
    void fetchCustomers();
    void fetchSales();
  }, [mounted]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === customerId);
  }, [customers, customerId]);

  const totalAmount = useMemo(() => {
    return payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
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

        if (key === "saleType" && value === "前受金") {
          next.paymentMethod = "その他";
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
    setReservationId("");
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

    for (const row of payments) {
      if (!row.amount || Number(row.amount) <= 0) {
        alert("支払い金額を入力してください");
        return;
      }
    }

    try {
      setSaving(true);

      const mergedNote = [menuName.trim() ? `メニュー名: ${menuName.trim()}` : "", note.trim()]
        .filter(Boolean)
        .join("\n");

      const payloads = payments.map((row) => ({
        customer_id: Number(customer.id),
        customer_name: customer.name,
        sale_date: date,
        menu_type: serviceType,
        sale_type: row.saleType,
        payment_method: row.paymentMethod,
        amount: Number(row.amount),
        staff_name: staff.trim() || "未設定",
        store_name: storeName.trim() || "未設定",
        reservation_id: reservationId ? Number(reservationId) : null,
        memo: mergedNote || null,
      }));

      const { error } = await supabase.from("sales").insert(payloads);

      if (error) {
        alert(`売上登録エラー: ${error.message}`);
        return;
      }

      await fetchSales();
      resetForm();
      alert("売上を登録しました");
    } catch (error) {
      console.error("handleAddSale error:", error);
      alert("売上登録中にエラーが発生しました");
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
      "トレーニング(現金)",
      "トレーニング(カード等)",
      "トレーニング(受領済)",
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
      row.trainingCash,
      row.trainingCard,
      row.trainingReceived,
      row.netSalesTotal,
      row.advanceCash,
      row.advanceCard,
      row.advanceTotal,
      row.grandTotal,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => toCsvValue(cell)).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
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
        background: "linear-gradient(135deg, #f7f7f8 0%, #ececef 45%, #dfe3e8 100%)",
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
              予約詳細からの連動・支払い追加・履歴確認・日別集計CSV出力ができます
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/" style={subButtonStyle}>
              ← ホームへ
            </Link>
            <Link href="/accounting" style={mainLinkStyle}>
              会計管理へ
            </Link>
          </div>
        </div>

        <div style={topMetricGridStyle}>
          <MetricCard title="本日の売上合計" value={formatCurrency(todayTotal)} />
          <MetricCard title="総売上合計" value={formatCurrency(allTotal)} />
          <MetricCard title="売上件数" value={`${sales.length}件`} />
        </div>

        <div style={mainGridStyle}>
          <div style={{ display: "grid", gap: "24px" }}>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>売上登録</h2>

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
                    type="text"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    placeholder="例：パーソナルトレーニング60分"
                    style={inputStyle}
                  />
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
                  <label style={labelStyle}>担当者</label>
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
                  <label style={labelStyle}>サービス区分</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    style={inputStyle}
                  >
                    <option value="トレーニング">トレーニング</option>
                    <option value="ストレッチ">ストレッチ</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>予約ID</label>
                  <input
                    type="text"
                    value={reservationId}
                    onChange={(e) => setReservationId(e.target.value)}
                    placeholder="予約詳細から来た場合に自動入力"
                    style={inputStyle}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>メモ</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="メモがあれば入力"
                    style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "22px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "14px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    支払い情報
                  </h3>

                  <button onClick={addPaymentRow} style={subButtonPlainStyle}>
                    ＋ 支払い追加
                  </button>
                </div>

                <div style={{ display: "grid", gap: "14px" }}>
                  {payments.map((row, index) => (
                    <div key={row.id} style={innerCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          支払い {index + 1}
                        </div>

                        <button
                          onClick={() => removePaymentRow(row.id)}
                          style={deleteButtonStyle}
                        >
                          削除
                        </button>
                      </div>

                      <div style={paymentGridStyle}>
                        <div>
                          <label style={labelStyle}>会計区分</label>
                          <select
                            value={row.saleType}
                            onChange={(e) =>
                              updatePayment(row.id, "saleType", e.target.value as AccountingType)
                            }
                            style={inputStyle}
                          >
                            <option value="通常売上">通常売上</option>
                            <option value="前受金">前受金</option>
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>支払方法</label>
                          <select
                            value={row.paymentMethod}
                            onChange={(e) =>
                              updatePayment(
                                row.id,
                                "paymentMethod",
                                e.target.value as PaymentMethod
                              )
                            }
                            style={inputStyle}
                          >
                            <option value="現金">現金</option>
                            <option value="カード">カード</option>
                            <option value="銀行振込">銀行振込</option>
                            <option value="その他">その他</option>
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>金額</label>
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => updatePayment(row.id, "amount", e.target.value)}
                            placeholder="例：8000"
                            style={inputStyle}
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

              <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={handleAddSale}
                  style={mainButtonStyle}
                  disabled={saving || customerLoading}
                >
                  {saving ? "登録中..." : "売上を登録する"}
                </button>

                <button onClick={handleDownloadCsv} style={subButtonPlainStyle}>
                  日別集計CSV出力
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
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>日別集計表</h2>
              </div>

              {dailySummaryRows.length === 0 ? (
                <div style={emptyBoxStyle}>集計データがありません</div>
              ) : (
                <div style={tableWrapStyle}>
                  <table style={summaryTableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>日付</th>
                        <th style={thStyle}>ストレッチ(現金)</th>
                        <th style={thStyle}>ストレッチ(カード等)</th>
                        <th style={thStyle}>ストレッチ(受領済)</th>
                        <th style={thStyle}>トレーニング(現金)</th>
                        <th style={thStyle}>トレーニング(カード等)</th>
                        <th style={thStyle}>トレーニング(受領済)</th>
                        <th style={thStyle}>純売上合計</th>
                        <th style={thStyle}>前受(現金)</th>
                        <th style={thStyle}>前受(カード等)</th>
                        <th style={thStyle}>前受合計</th>
                        <th style={thStyle}>総合計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySummaryRows.map((row) => (
                        <tr key={row.date}>
                          <td style={tdStyle}>{formatDateJP(row.date)}</td>
                          <td style={tdStyleNumber}>{formatCurrency(row.stretchCash)}</td>
                          <td style={tdStyleNumber}>{formatCurrency(row.stretchCard)}</td>
                          <td style={tdStyleNumber}>{formatCurrency(row.stretchReceived)}</td>
                          <td style={tdStyleNumber}>{formatCurrency(row.trainingCash)}</td>
                          <td style={tdStyleNumber}>{formatCurrency(row.trainingCard)}</td>
                          <td style={tdStyleNumber}>{formatCurrency(row.trainingReceived)}</td>
                          <td style={tdStyleTotal}>{formatCurrency(row.netSalesTotal)}</td>
                          <td style={tdStyleNumber}>{formatCurrency(row.advanceCash)}</td>
                          <td style={tdStyleNumber}>{formatCurrency(row.advanceCard)}</td>
                          <td style={tdStyleTotal}>{formatCurrency(row.advanceTotal)}</td>
                          <td style={tdStyleGrand}>{formatCurrency(row.grandTotal)}</td>
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
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>売上一覧</h2>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="顧客名・担当者・カテゴリで検索"
                  style={{ ...inputStyle, maxWidth: "320px" }}
                />
              </div>

              {loading ? (
                <div style={emptyBoxStyle}>読み込み中...</div>
              ) : filteredSales.length === 0 ? (
                <div style={emptyBoxStyle}>売上データがまだありません</div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {filteredSales.map((sale) => (
                    <div key={sale.id} style={innerCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "14px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "240px" }}>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 800,
                              color: "#111827",
                              marginBottom: "8px",
                            }}
                          >
                            {sale.customerName}
                          </div>

                          <div style={detailTextStyle}>顧客ID：{sale.customerId ?? "なし"}</div>
                          <div style={detailTextStyle}>日付：{sale.date}</div>
                          <div style={detailTextStyle}>店舗：{sale.storeName}</div>
                          <div style={detailTextStyle}>メニュー：{sale.menuName}</div>
                          <div style={detailTextStyle}>担当者：{sale.staff}</div>
                          <div style={detailTextStyle}>カテゴリ：{sale.category}</div>
                          <div style={detailTextStyle}>会計区分：{sale.accountingType}</div>
                          <div style={detailTextStyle}>支払方法：{sale.paymentMethod}</div>
                          <div style={detailTextStyle}>予約ID：{sale.reservationId ?? "なし"}</div>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 800,
                              color: "#111827",
                              marginTop: "8px",
                            }}
                          >
                            金額：{formatCurrency(sale.amount)}
                          </div>
                          {sale.note ? (
                            <div
                              style={{
                                ...detailTextStyle,
                                marginTop: "6px",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              メモ：{sale.note}
                            </div>
                          ) : null}
                        </div>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {sale.customerId ? (
                            <Link href={`/customer/${sale.customerId}`} style={subButtonStyle}>
                              顧客詳細
                            </Link>
                          ) : null}

                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            style={deleteButtonStyle}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div style={{ display: "grid", gap: "24px" }}>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>月別合計</h2>

              {monthlyTotals.length === 0 ? (
                <div style={emptyBoxStyle}>データがありません</div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {monthlyTotals.map(([month, amount]) => (
                    <SoftRow key={month} label={month} value={formatCurrency(amount)} />
                  ))}
                </div>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>担当者別合計</h2>

              {staffTotals.length === 0 ? (
                <div style={emptyBoxStyle}>データがありません</div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {staffTotals.map(([name, amount]) => (
                    <SoftRow key={name} label={name} value={formatCurrency(amount)} />
                  ))}
                </div>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>支払方法別合計</h2>

              {paymentTotals.length === 0 ? (
                <div style={emptyBoxStyle}>データがありません</div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {paymentTotals.map(([name, amount]) => (
                    <SoftRow key={name} label={name} value={formatCurrency(amount)} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={metricCardStyle}>
      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function SoftRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        ...innerCardStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <span style={{ fontWeight: 700 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const topMetricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const mainGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.35fr 0.65fr",
  gap: "24px",
  alignItems: "start",
};

const paymentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.65)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
};

const metricCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.65)",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
};

const innerCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  border: "1px solid rgba(229,231,235,0.95)",
  borderRadius: "18px",
  padding: "16px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 18px",
  fontSize: "22px",
  fontWeight: 800,
  color: "#111827",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "#4b5563",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "48px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "rgba(255,255,255,0.88)",
  padding: "0 14px",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const readonlyBoxStyle: React.CSSProperties = {
  minHeight: "48px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "rgba(248,250,252,0.9)",
  padding: "12px 14px",
  fontSize: "14px",
  color: "#111827",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
};

const summaryBoxStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(248,250,252,0.9)",
  border: "1px solid #e5e7eb",
  display: "grid",
  gap: "10px",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  color: "#111827",
  fontSize: "14px",
};

const mainButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: "14px",
  padding: "14px 18px",
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(17,24,39,0.16)",
};

const subButtonPlainStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.88)",
  color: "#111827",
  fontWeight: 700,
  fontSize: "14px",
  padding: "14px 18px",
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  padding: "10px 14px",
  cursor: "pointer",
};

const detailTextStyle: React.CSSProperties = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: 1.7,
};

const emptyBoxStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(248,250,252,0.92)",
  border: "1px solid #e5e7eb",
  color: "#6b7280",
};

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "rgba(255,255,255,0.88)",
  color: "#111827",
  fontWeight: 700,
  fontSize: "14px",
};

const mainLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: "14px",
  boxShadow: "0 10px 24px rgba(17,24,39,0.16)",
};

const tableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
  borderRadius: "18px",
  border: "1px solid #d1d5db",
  background: "#fff",
};

const summaryTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "1280px",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const thStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#f3f4f6",
  color: "#111827",
  padding: "10px 8px",
  textAlign: "center",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: "10px 8px",
  textAlign: "center",
  whiteSpace: "nowrap",
  color: "#111827",
};

const tdStyleNumber: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const tdStyleTotal: React.CSSProperties = {
  ...tdStyleNumber,
  background: "#f9fafb",
  fontWeight: 800,
};

const tdStyleGrand: React.CSSProperties = {
  ...tdStyleNumber,
  background: "#eef2ff",
  fontWeight: 800,
};