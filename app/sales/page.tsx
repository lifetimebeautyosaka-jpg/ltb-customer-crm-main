"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Customer = {
  id: string | number;
  name: string;
  phone?: string;
  plan?: string;
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
};

type SupabaseSaleRow = {
  id: number | string;
  customer_name: string | null;
  sale_date: string | null;
  menu_type: string | null;
  sale_type: string | null;
  payment_method: string | null;
  amount: number | null;
  staff_name: string | null;
  store_name: string | null;
  memo: string | null;
  created_at: string | null;
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

  const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow()]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    try {
      const savedCustomers =
        localStorage.getItem("gymup_customers") ||
        localStorage.getItem("customers");

      if (savedCustomers) {
        const parsed = JSON.parse(savedCustomers);
        const list = Array.isArray(parsed) ? parsed : [];
        setCustomers(list);

        const queryCustomer = getQueryParam("customer");
        if (queryCustomer) {
          const found = list.find((c) => c.name === queryCustomer);
          if (found) {
            setCustomerId(String(found.id));
          }
        }
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    }

    const queryDate = getQueryParam("date");
    const queryStore = getQueryParam("store");
    const queryStaff = getQueryParam("staff");
    const queryService = getQueryParam("service");
    const queryMenu = getQueryParam("menu");

    if (queryDate) setDate(queryDate);
    if (queryStore) setStoreName(queryStore);
    if (queryStaff) setStaff(queryStaff);
    if (queryService === "ストレッチ" || queryService === "トレーニング") {
      setServiceType(queryService);
    }
    if (queryMenu) setMenuName(queryMenu);
  }, []);

  const fetchSales = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sales")
      .select(
        "id, customer_name, sale_date, menu_type, sale_type, payment_method, amount, staff_name, store_name, memo, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      alert(`売上取得エラー: ${error.message}`);
      setSales([]);
      setLoading(false);
      return;
    }

    const mapped = ((data as SupabaseSaleRow[] | null) || []).map(rowToSale);
    setSales(mapped);
    setLoading(false);
  };

  useEffect(() => {
    if (!mounted) return;
    fetchSales();
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
        sale.paymentMethod.toLowerCase().includes(keyword)
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

    setSaving(true);

    const payloads = payments.map((row) => ({
      customer_name: customer.name,
      sale_date: date,
      menu_type: serviceType,
      sale_type: row.saleType,
      payment_method: row.paymentMethod,
      amount: Number(row.amount),
      staff_name: staff.trim() || "未設定",
      store_name: storeName.trim() || "未設定",
      memo: note.trim() || null,
    }));

    const { error } = await supabase.from("sales").insert(payloads);

    setSaving(false);

    if (error) {
      alert(`売上登録エラー: ${error.message}`);
      return;
    }

    await fetchSales();
    resetForm();
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
      "顧客名",
      "店舗",
      "メニュー名",
      "担当者",
      "サービス区分",
      "会計区分",
      "支払方法",
      "カテゴリ",
      "金額",
      "メモ",
    ];

    const rows = sales.map((sale) => [
      sale.date,
      sale.customerName,
      sale.storeName,
      sale.menuName,
      sale.staff,
      sale.serviceType,
      sale.accountingType,
      sale.paymentMethod,
      sale.category,
      String(sale.amount),
      sale.note.replace(/\n/g, " "),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gymup-sales-${todayString()}.csv`;
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
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
              予約詳細からの連動・支払い追加・履歴確認・CSV出力ができます
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
                  >
                    <option value="">顧客を選択してください</option>
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
                              updatePayment(row.id, "paymentMethod", e.target.value as PaymentMethod)
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
                  disabled={saving}
                >
                  {saving ? "登録中..." : "売上を登録する"}
                </button>

                <button onClick={handleDownloadCsv} style={subButtonPlainStyle}>
                  CSV出力
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

                          <div style={detailTextStyle}>日付：{sale.date}</div>
                          <div style={detailTextStyle}>店舗：{sale.storeName}</div>
                          <div style={detailTextStyle}>メニュー：{sale.menuName}</div>
                          <div style={detailTextStyle}>担当者：{sale.staff}</div>
                          <div style={detailTextStyle}>カテゴリ：{sale.category}</div>
                          <div style={detailTextStyle}>会計区分：{sale.accountingType}</div>
                          <div style={detailTextStyle}>支払方法：{sale.paymentMethod}</div>
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
                            <div style={{ ...detailTextStyle, marginTop: "6px" }}>
                              メモ：{sale.note}
                            </div>
                          ) : null}
                        </div>

                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          style={deleteButtonStyle}
                        >
                          削除
                        </button>
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
                    <SoftRow
                      key={month}
                      label={month}
                      value={formatCurrency(amount)}
                    />
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
                    <SoftRow
                      key={name}
                      label={name}
                      value={formatCurrency(amount)}
                    />
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
                    <SoftRow
                      key={name}
                      label={name}
                      value={formatCurrency(amount)}
                    />
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
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: "24px",
  alignItems: "start",
};

const paymentGridStyle: React.CSSProperties = {
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
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "18px",
  padding: "16px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 18px 0",
  fontSize: "24px",
  fontWeight: 800,
  color: "#111827",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.88)",
  fontSize: "15px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const readonlyBoxStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(243,244,246,0.9)",
  fontSize: "15px",
  color: "#111827",
  boxSizing: "border-box",
  minHeight: "50px",
};

const summaryBoxStyle: React.CSSProperties = {
  marginTop: "18px",
  borderRadius: "18px",
  background: "rgba(17,24,39,0.92)",
  padding: "16px",
  color: "#ffffff",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "8px",
  fontSize: "14px",
};

const detailTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563",
  lineHeight: 1.7,
};

const emptyBoxStyle: React.CSSProperties = {
  borderRadius: "16px",
  padding: "20px",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(203,213,225,0.7)",
  color: "#6b7280",
  textAlign: "center",
};

const mainButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "14px",
  padding: "13px 20px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
};

const subButtonPlainStyle: React.CSSProperties = {
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: "14px",
  padding: "13px 20px",
  background: "rgba(255,255,255,0.85)",
  color: "#111827",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
};

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "14px",
  padding: "13px 18px",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(203,213,225,0.95)",
  color: "#111827",
  fontWeight: 700,
};

const mainLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "14px",
  padding: "13px 18px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
};

const deleteButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
  height: "fit-content",
};