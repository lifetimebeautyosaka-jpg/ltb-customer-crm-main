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

type StaffSummary = {
  staff: string;
  count: number;
  salesTotal: number;
  normalTotal: number;
  advanceTotal: number;
  ticketTotal: number;
  cashTotal: number;
  cardTotal: number;
  bankTotal: number;
  otherTotal: number;
  salary: number;
};

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

function toCsvValue(value: string | number) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function PayslipPage() {
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(todayString());
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("全スタッフ");
  const [selectedStore, setSelectedStore] = useState("全店舗");
  const [salaryRate, setSalaryRate] = useState("50");
  const [includeAdvance, setIncludeAdvance] = useState(true);
  const [includeTicket, setIncludeTicket] = useState(true);
  const [sortKey, setSortKey] = useState<"salesTotal" | "count" | "salary">("salesTotal");

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
    void fetchSales();
  }, [mounted]);

  const staffOptions = useMemo(() => {
    const names = Array.from(new Set(sales.map((sale) => sale.staff || "未設定"))).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
    return ["全スタッフ", ...names];
  }, [sales]);

  const storeOptions = useMemo(() => {
    const names = Array.from(new Set(sales.map((sale) => sale.storeName || "未設定"))).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
    return ["全店舗", ...names];
  }, [sales]);

  const filteredSales = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Infinity;

    return sales.filter((sale) => {
      const saleTime = new Date(`${sale.date}T12:00:00`).getTime();

      if (saleTime < fromTime || saleTime > toTime) return false;
      if (selectedStaff !== "全スタッフ" && sale.staff !== selectedStaff) return false;
      if (selectedStore !== "全店舗" && sale.storeName !== selectedStore) return false;

      if (!includeAdvance && sale.accountingType === "前受金") return false;
      if (!includeTicket && sale.accountingType === "回数券消化") return false;

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
    dateFrom,
    dateTo,
    selectedStaff,
    selectedStore,
    includeAdvance,
    includeTicket,
  ]);

  const salaryRateNumber = useMemo(() => {
    const n = Number(salaryRate);
    if (Number.isNaN(n) || n < 0) return 0;
    return n;
  }, [salaryRate]);

  const staffSummaries = useMemo(() => {
    const map = new Map<string, StaffSummary>();

    filteredSales.forEach((sale) => {
      const key = sale.staff || "未設定";

      if (!map.has(key)) {
        map.set(key, {
          staff: key,
          count: 0,
          salesTotal: 0,
          normalTotal: 0,
          advanceTotal: 0,
          ticketTotal: 0,
          cashTotal: 0,
          cardTotal: 0,
          bankTotal: 0,
          otherTotal: 0,
          salary: 0,
        });
      }

      const target = map.get(key)!;
      target.count += 1;
      target.salesTotal += Number(sale.amount || 0);

      if (sale.accountingType === "通常売上") target.normalTotal += Number(sale.amount || 0);
      if (sale.accountingType === "前受金") target.advanceTotal += Number(sale.amount || 0);
      if (sale.accountingType === "回数券消化") target.ticketTotal += Number(sale.amount || 0);

      if (sale.paymentMethod === "現金") target.cashTotal += Number(sale.amount || 0);
      if (sale.paymentMethod === "カード") target.cardTotal += Number(sale.amount || 0);
      if (sale.paymentMethod === "銀行振込") target.bankTotal += Number(sale.amount || 0);
      if (sale.paymentMethod === "その他") target.otherTotal += Number(sale.amount || 0);
    });

    const list = Array.from(map.values()).map((item) => ({
      ...item,
      salary: Math.round(item.salesTotal * (salaryRateNumber / 100)),
    }));

    return list.sort((a, b) => {
      if (sortKey === "count") return b.count - a.count;
      if (sortKey === "salary") return b.salary - a.salary;
      return b.salesTotal - a.salesTotal;
    });
  }, [filteredSales, salaryRateNumber, sortKey]);

  const grandTotal = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }, [filteredSales]);

  const grandCount = useMemo(() => {
    return filteredSales.length;
  }, [filteredSales]);

  const grandSalary = useMemo(() => {
    return Math.round(grandTotal * (salaryRateNumber / 100));
  }, [grandTotal, salaryRateNumber]);

  const selectedStaffRows = useMemo(() => {
    if (selectedStaff === "全スタッフ") return filteredSales;
    return filteredSales.filter((sale) => sale.staff === selectedStaff);
  }, [filteredSales, selectedStaff]);

  const exportSelectedCsv = () => {
    if (selectedStaffRows.length === 0) {
      alert("出力する明細がありません");
      return;
    }

    const rows = [
      [
        "スタッフ",
        "日付",
        "顧客名",
        "サービス",
        "会計区分",
        "支払方法",
        "金額",
        "店舗",
        "予約ID",
        "メモ",
      ]
        .map(toCsvValue)
        .join(","),
      ...selectedStaffRows.map((sale) =>
        [
          sale.staff,
          sale.date,
          sale.customerName,
          sale.serviceType,
          sale.accountingType,
          sale.paymentMethod,
          sale.amount,
          sale.storeName,
          sale.reservationId ?? "",
          sale.note.replace(/\n/g, " / "),
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
      selectedStaff === "全スタッフ"
        ? `payslip_all_${todayString()}.csv`
        : `payslip_${selectedStaff}_${todayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #050816 0%, #0b1120 45%, #111827 100%)",
    padding: mobile ? "16px 12px 48px" : "24px 18px 60px",
  };

  const innerStyle: CSSProperties = {
    maxWidth: "1480px",
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

  const checkboxWrapStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "4px",
  };

  const checkLabelStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#e5e7eb",
    fontWeight: 700,
    fontSize: "14px",
  };

  const statGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: mobile ? "1fr" : tablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
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
    fontSize: mobile ? "26px" : "30px",
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
    minWidth: mobile ? "980px" : "1180px",
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

  const badgeStyle = (type: AccountingType): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "76px",
    height: "28px",
    borderRadius: "999px",
    padding: "0 10px",
    fontSize: "12px",
    fontWeight: 900,
    color:
      type === "通常売上"
        ? "#022c22"
        : type === "前受金"
        ? "#78350f"
        : "#1e1b4b",
    background:
      type === "通常売上"
        ? "#86efac"
        : type === "前受金"
        ? "#fcd34d"
        : "#a5b4fc",
  });

  const pillStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    minHeight: "32px",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "rgba(148,163,184,0.12)",
    color: "#e5e7eb",
    fontWeight: 800,
    fontSize: "12px",
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
              <h1 style={titleStyle}>スタッフ給与ページ</h1>
              <div style={subStyle}>
                スタッフ別売上・件数・給与計算を画面でそのまま確認できるページです。
              </div>
            </div>

            <div style={topActionWrapStyle}>
              <Link href="/dashboard" style={ghostLinkStyle}>
                ← ダッシュボード
              </Link>
              <Link href="/sales" style={ghostLinkStyle}>
                売上管理へ
              </Link>
              <button onClick={() => void fetchSales()} style={primaryButtonStyle}>
                最新に更新
              </button>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={sectionTitleStyle}>絞り込み・給与設定</h2>
            <div style={sectionSubStyle}>
              期間・スタッフ・店舗で絞り込みできます。給与率はそのまま自動反映されます。
            </div>
          </div>

          <div style={inputGridStyle}>
            <div>
              <label style={labelStyle}>開始日</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>終了日</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>スタッフ</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
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
              <label style={labelStyle}>給与率（%）</label>
              <input
                type="number"
                min="0"
                step="1"
                value={salaryRate}
                onChange={(e) => setSalaryRate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>並び順</label>
              <select
                value={sortKey}
                onChange={(e) =>
                  setSortKey(e.target.value as "salesTotal" | "count" | "salary")
                }
                style={inputStyle}
              >
                <option value="salesTotal">売上順</option>
                <option value="count">件数順</option>
                <option value="salary">給与額順</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>書き出し</label>
              <button onClick={exportSelectedCsv} style={{ ...primaryButtonStyle, width: "100%" }}>
                CSV出力
              </button>
            </div>
          </div>

          <div style={checkboxWrapStyle}>
            <label style={checkLabelStyle}>
              <input
                type="checkbox"
                checked={includeAdvance}
                onChange={(e) => setIncludeAdvance(e.target.checked)}
              />
              前受金を含む
            </label>

            <label style={checkLabelStyle}>
              <input
                type="checkbox"
                checked={includeTicket}
                onChange={(e) => setIncludeTicket(e.target.checked)}
              />
              回数券消化を含む
            </label>

            <span style={pillStyle}>
              期間: {formatDateJP(dateFrom)} 〜 {formatDateJP(dateTo)}
            </span>

            <span style={pillStyle}>
              給与率: {salaryRateNumber}%
            </span>
          </div>
        </section>

        <section style={statGridStyle}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>対象売上合計</div>
            <div style={statValueStyle}>{formatCurrency(grandTotal)}</div>
            <div style={statSubStyle}>絞り込み後の全スタッフ合計</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>対象件数</div>
            <div style={statValueStyle}>{grandCount.toLocaleString()}件</div>
            <div style={statSubStyle}>売上明細の件数</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>給与合計</div>
            <div style={statValueStyle}>{formatCurrency(grandSalary)}</div>
            <div style={statSubStyle}>{salaryRateNumber}%計算</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>スタッフ数</div>
            <div style={statValueStyle}>{staffSummaries.length.toLocaleString()}人</div>
            <div style={statSubStyle}>絞り込み後に表示中</div>
          </div>
        </section>

        <section style={cardStyle}>
          <div>
            <h2 style={sectionTitleStyle}>スタッフ別集計</h2>
            <div style={sectionSubStyle}>
              ここが本命です。スタッフごとの売上・件数・給与を一覧で見れます。
            </div>
          </div>

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>スタッフ</th>
                  <th style={thStyle}>件数</th>
                  <th style={thStyle}>売上合計</th>
                  <th style={thStyle}>通常売上</th>
                  <th style={thStyle}>前受金</th>
                  <th style={thStyle}>回数券消化</th>
                  <th style={thStyle}>現金</th>
                  <th style={thStyle}>カード</th>
                  <th style={thStyle}>銀行振込</th>
                  <th style={thStyle}>その他</th>
                  <th style={thStyle}>給与</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={tdStyle} colSpan={11}>
                      読み込み中です...
                    </td>
                  </tr>
                ) : staffSummaries.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={11}>
                      データがありません
                    </td>
                  </tr>
                ) : (
                  staffSummaries.map((row) => (
                    <tr
                      key={row.staff}
                      style={{
                        background:
                          selectedStaff !== "全スタッフ" && selectedStaff === row.staff
                            ? "rgba(245,158,11,0.08)"
                            : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedStaff(row.staff)}
                    >
                      <td style={tdStyle}>{row.staff}</td>
                      <td style={tdStyle}>{row.count.toLocaleString()}件</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{formatCurrency(row.salesTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.normalTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.advanceTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.ticketTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.cashTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.cardTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.bankTotal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.otherTotal)}</td>
                      <td style={{ ...tdStyle, color: "#fbbf24", fontWeight: 900 }}>
                        {formatCurrency(row.salary)}
                      </td>
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
              スタッフを上の集計表で押すと、そのスタッフの明細だけに絞れます。
            </div>
          </div>

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>日付</th>
                  <th style={thStyle}>スタッフ</th>
                  <th style={thStyle}>顧客名</th>
                  <th style={thStyle}>サービス</th>
                  <th style={thStyle}>会計区分</th>
                  <th style={thStyle}>支払方法</th>
                  <th style={thStyle}>金額</th>
                  <th style={thStyle}>店舗</th>
                  <th style={thStyle}>予約ID</th>
                  <th style={thStyle}>メモ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={tdStyle} colSpan={10}>
                      読み込み中です...
                    </td>
                  </tr>
                ) : selectedStaffRows.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={10}>
                      該当する明細がありません
                    </td>
                  </tr>
                ) : (
                  selectedStaffRows.map((sale) => (
                    <tr key={sale.id}>
                      <td style={tdStyle}>{formatDateJP(sale.date)}</td>
                      <td style={tdStyle}>{sale.staff}</td>
                      <td style={tdStyle}>{sale.customerName}</td>
                      <td style={tdStyle}>{sale.serviceType}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(sale.accountingType)}>
                          {sale.accountingType}
                        </span>
                      </td>
                      <td style={tdStyle}>{sale.paymentMethod}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>
                        {formatCurrency(sale.amount)}
                      </td>
                      <td style={tdStyle}>{sale.storeName}</td>
                      <td style={tdStyle}>{sale.reservationId ?? "—"}</td>
                      <td style={{ ...tdStyle, whiteSpace: "pre-wrap", minWidth: "260px" }}>
                        {sale.note || "—"}
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