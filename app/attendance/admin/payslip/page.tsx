"use client";

import Link from "next/link";
import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type SaleRow = {
  id: number;
  date?: string | null;
  created_at?: string | null;
  staff_name?: string | null;
  customer_name?: string | null;
  customerName?: string | null;
  menu_name?: string | null;
  menuName?: string | null;
  service_type?: string | null;
  serviceType?: string | null;
  accounting_type?: string | null;
  accountingType?: string | null;
  payment_method?: string | null;
  paymentMethod?: string | null;
  amount?: number | string | null;
  store_name?: string | null;
  storeName?: string | null;
  reservation_id?: number | string | null;
  memo?: string | null;
};

type NormalizedSale = {
  id: number;
  saleDate: string;
  staffName: string;
  customerName: string;
  menuName: string;
  serviceType: string;
  accountingType: string;
  paymentMethod: string;
  amount: number;
  storeName: string;
  reservationId: string;
  memo: string;
};

type StaffSummary = {
  staffName: string;
  count: number;
  total: number;
  payroll: number;
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  if (!month) return "—";
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

function formatDateJP(value?: string | null) {
  if (!value) return "—";

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return new Intl.DateTimeFormat("ja-JP").format(direct);
  }

  const normalized = value.replace(/\./g, "-").replace(/\//g, "-");
  const retried = new Date(normalized);
  if (!Number.isNaN(retried.getTime())) {
    return new Intl.DateTimeFormat("ja-JP").format(retried);
  }

  return value;
}

function formatCurrency(value: number) {
  return `¥${Math.round(value || 0).toLocaleString()}`;
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

function getRowDate(row: SaleRow) {
  const raw = row.date || row.created_at || "";
  if (!raw) return "";

  if (typeof raw === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if (raw.length >= 10) return raw.slice(0, 10);
  }

  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return String(raw);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeSale(row: SaleRow): NormalizedSale {
  return {
    id: Number(row.id),
    saleDate: getRowDate(row),
    staffName: String(row.staff_name || "").trim() || "未設定",
    customerName:
      String(row.customer_name || row.customerName || "").trim() || "—",
    menuName: String(row.menu_name || row.menuName || "").trim() || "—",
    serviceType:
      String(row.service_type || row.serviceType || "").trim() || "—",
    accountingType:
      String(row.accounting_type || row.accountingType || "").trim() || "—",
    paymentMethod:
      String(row.payment_method || row.paymentMethod || "").trim() || "—",
    amount: parseNumber(row.amount),
    storeName: String(row.store_name || row.storeName || "").trim() || "—",
    reservationId:
      row.reservation_id === null || row.reservation_id === undefined
        ? "—"
        : String(row.reservation_id),
    memo: String(row.memo || "").trim() || "",
  };
}

function toCsvValue(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(rows: NormalizedSale[]) {
  const header = [
    "スタッフ",
    "日付",
    "顧客名",
    "メニュー",
    "サービス",
    "会計区分",
    "支払方法",
    "金額",
    "店舗",
    "予約ID",
    "メモ",
  ];

  const lines = [
    header.map(toCsvValue).join(","),
    ...rows.map((row) =>
      [
        row.staffName,
        row.saleDate,
        row.customerName,
        row.menuName,
        row.serviceType,
        row.accountingType,
        row.paymentMethod,
        row.amount,
        row.storeName,
        row.reservationId,
        row.memo,
      ]
        .map(toCsvValue)
        .join(",")
    ),
  ];

  return "\ufeff" + lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function AttendancePayslipPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [salesRows, setSalesRows] = useState<NormalizedSale[]>([]);
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [staffFilter, setStaffFilter] = useState("");
  const [ratePercent, setRatePercent] = useState("50");
  const [nominationFee, setNominationFee] = useState("0");
  const [transportation, setTransportation] = useState("0");
  const [adjustment, setAdjustment] = useState("0");
  const [deduction, setDeduction] = useState("0");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loggedIn =
      localStorage.getItem("gymup_logged_in") ||
      localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    void fetchSales();
  }, [mounted]);

  const mobile = windowWidth < 768;
  const tablet = windowWidth < 1100;

  async function fetchSales() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が未設定です。");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const normalized = ((data as SaleRow[]) || [])
        .map(normalizeSale)
        .sort((a, b) => String(b.saleDate).localeCompare(String(a.saleDate)));

      setSalesRows(normalized);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "売上データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const staffNames = useMemo(() => {
    return Array.from(
      new Set(salesRows.map((row) => row.staffName).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "ja"));
  }, [salesRows]);

  const storeNames = useMemo(() => {
    return Array.from(
      new Set(salesRows.map((row) => row.storeName).filter((v) => v && v !== "—"))
    ).sort((a, b) => a.localeCompare(b, "ja"));
  }, [salesRows]);

  const [storeFilter, setStoreFilter] = useState("");

  const filteredSales = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();

    return salesRows
      .filter((row) => {
        const matchMonth = monthFilter
          ? String(row.saleDate || "").startsWith(monthFilter)
          : true;

        const matchStaff = staffFilter ? row.staffName === staffFilter : true;
        const matchStore = storeFilter ? row.storeName === storeFilter : true;

        const matchKeyword = keywordLower
          ? [
              row.customerName,
              row.menuName,
              row.serviceType,
              row.accountingType,
              row.paymentMethod,
              row.storeName,
              row.memo,
              row.staffName,
            ]
              .join(" ")
              .toLowerCase()
              .includes(keywordLower)
          : true;

        return matchMonth && matchStaff && matchStore && matchKeyword;
      })
      .sort((a, b) => String(b.saleDate).localeCompare(String(a.saleDate)));
  }, [salesRows, monthFilter, staffFilter, storeFilter, keyword]);

  const commissionRate = Number(ratePercent || 0) / 100;
  const nominationFeeNum = Number(nominationFee || 0);
  const transportationNum = Number(transportation || 0);
  const adjustmentNum = Number(adjustment || 0);
  const deductionNum = Number(deduction || 0);

  const groupedSummaries = useMemo<StaffSummary[]>(() => {
    const map = new Map<string, { count: number; total: number }>();

    filteredSales.forEach((sale) => {
      const prev = map.get(sale.staffName) || { count: 0, total: 0 };
      prev.count += 1;
      prev.total += sale.amount;
      map.set(sale.staffName, prev);
    });

    return Array.from(map.entries())
      .map(([staffName, value]) => ({
        staffName,
        count: value.count,
        total: value.total,
        payroll: value.total * commissionRate + value.count * nominationFeeNum,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredSales, commissionRate, nominationFeeNum]);

  const selectedStaffSales = useMemo(() => {
    return staffFilter
      ? filteredSales.filter((row) => row.staffName === staffFilter)
      : filteredSales;
  }, [filteredSales, staffFilter]);

  const totals = useMemo(() => {
    const count = selectedStaffSales.length;
    const totalAmount = selectedStaffSales.reduce((sum, row) => sum + row.amount, 0);
    const payrollBase = totalAmount * commissionRate;
    const nominationTotal = count * nominationFeeNum;
    const totalPayment =
      payrollBase +
      nominationTotal +
      transportationNum +
      adjustmentNum -
      deductionNum;

    return {
      count,
      totalAmount,
      payrollBase,
      nominationTotal,
      totalPayment,
    };
  }, [
    selectedStaffSales,
    commissionRate,
    nominationFeeNum,
    transportationNum,
    adjustmentNum,
    deductionNum,
  ]);

  function handleExportCurrentCsv() {
    if (selectedStaffSales.length === 0) {
      alert("出力する売上データがありません");
      return;
    }

    const fileName = staffFilter
      ? `staff-sales-${staffFilter}-${monthFilter || "all"}.csv`
      : `staff-sales-all-${monthFilter || "all"}.csv`;

    downloadCsv(fileName, buildCsv(selectedStaffSales));
  }

  function handleExportStaffCsv(staffName: string) {
    const target = filteredSales.filter((row) => row.staffName === staffName);

    if (target.length === 0) {
      alert("出力する売上データがありません");
      return;
    }

    downloadCsv(
      `staff-sales-${staffName}-${monthFilter || "all"}.csv`,
      buildCsv(target)
    );
  }

  if (!mounted) return null;

  return (
    <div style={pageStyle}>
      <div style={bgGlowA} />
      <div style={bgGlowB} />

      <div style={containerStyle}>
        <div style={topRowStyle}>
          <Link href="/attendance/admin" style={backLinkStyle}>
            ← 管理者勤怠へ戻る
          </Link>
          <div style={eyebrowStyle}>PAYSLIP / STAFF SALES</div>
        </div>

        <div style={heroCardStyle}>
          <div style={heroLeftStyle}>
            <div style={miniLabelStyle}>GYMUP PAYROLL</div>
            <h1 style={titleStyle}>スタッフ別売上明細</h1>
            <p style={descStyle}>
              salesテーブルから月別・スタッフ別の売上を集計し、
              件数・売上合計・給与計算まで画面で確認できます。
            </p>
          </div>

          <div style={heroRightStyle}>
            <button style={primaryButtonStyle} onClick={handleExportCurrentCsv}>
              現在表示をCSV出力
            </button>
          </div>
        </div>

        {!supabase && (
          <div style={errorBoxStyle}>
            NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。
          </div>
        )}

        {error && <div style={errorBoxStyle}>{error}</div>}

        <div
          style={{
            ...filterGridStyle,
            gridTemplateColumns: mobile
              ? "1fr"
              : tablet
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(4, minmax(0, 1fr))",
          }}
        >
          <FilterCard label="対象月">
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={inputStyle}
            />
          </FilterCard>

          <FilterCard label="スタッフ">
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">全スタッフ</option>
              {staffNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FilterCard>

          <FilterCard label="店舗">
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">全店舗</option>
              {storeNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FilterCard>

          <FilterCard label="検索">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="顧客名・メニュー・メモなど"
              style={inputStyle}
            />
          </FilterCard>
        </div>

        <div
          style={{
            ...filterGridStyle,
            gridTemplateColumns: mobile
              ? "1fr"
              : tablet
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(5, minmax(0, 1fr))",
          }}
        >
          <FilterCard label="給与率（%）">
            <input
              type="number"
              value={ratePercent}
              onChange={(e) => setRatePercent(e.target.value)}
              style={inputStyle}
            />
          </FilterCard>

          <FilterCard label="指名料 / 1件">
            <input
              type="number"
              value={nominationFee}
              onChange={(e) => setNominationFee(e.target.value)}
              style={inputStyle}
            />
          </FilterCard>

          <FilterCard label="交通費">
            <input
              type="number"
              value={transportation}
              onChange={(e) => setTransportation(e.target.value)}
              style={inputStyle}
            />
          </FilterCard>

          <FilterCard label="手当">
            <input
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              style={inputStyle}
            />
          </FilterCard>

          <FilterCard label="控除">
            <input
              type="number"
              value={deduction}
              onChange={(e) => setDeduction(e.target.value)}
              style={inputStyle}
            />
          </FilterCard>
        </div>

        <div
          style={{
            ...summaryGridLargeStyle,
            gridTemplateColumns: mobile
              ? "1fr"
              : tablet
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(5, minmax(0, 1fr))",
          }}
        >
          <MetricCard label="対象月" value={monthLabel(monthFilter)} />
          <MetricCard label="対象スタッフ" value={staffFilter || "全スタッフ"} />
          <MetricCard label="件数" value={`${totals.count}件`} />
          <MetricCard label="売上合計" value={formatCurrency(totals.totalAmount)} />
          <MetricCard label="給与合計" value={formatCurrency(totals.totalPayment)} />
        </div>

        <div
          style={{
            ...summaryGridLargeStyle,
            gridTemplateColumns: mobile
              ? "1fr"
              : tablet
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(4, minmax(0, 1fr))",
          }}
        >
          <MetricCard label="歩合給与" value={formatCurrency(totals.payrollBase)} />
          <MetricCard label="指名料合計" value={formatCurrency(totals.nominationTotal)} />
          <MetricCard label="交通費+手当" value={formatCurrency(transportationNum + adjustmentNum)} />
          <MetricCard label="控除" value={`- ${formatCurrency(deductionNum)}`} />
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>STAFF SUMMARY</div>
              <h2 style={panelTitleStyle}>スタッフ別集計</h2>
            </div>
          </div>

          {loading ? (
            <div style={loadingStyle}>読み込み中...</div>
          ) : groupedSummaries.length === 0 ? (
            <div style={emptyBoxStyle}>該当する売上データがありません。</div>
          ) : mobile ? (
            <div style={{ display: "grid", gap: 12 }}>
              {groupedSummaries.map((item) => (
                <div key={item.staffName} style={recordCardStyle}>
                  <div style={recordDateStyle}>{item.staffName}</div>
                  <div style={recordInfoGridStyle}>
                    <MiniInfo label="件数" value={`${item.count}件`} />
                    <MiniInfo label="売上合計" value={formatCurrency(item.total)} />
                    <MiniInfo label="給与概算" value={formatCurrency(item.payroll)} />
                  </div>
                  <div style={cardActionRowStyle}>
                    <button
                      style={secondaryButtonStyle}
                      onClick={() => setStaffFilter(item.staffName)}
                    >
                      このスタッフを見る
                    </button>
                    <button
                      style={ghostButtonStyle}
                      onClick={() => handleExportStaffCsv(item.staffName)}
                    >
                      CSV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>スタッフ</th>
                    <th style={thStyle}>件数</th>
                    <th style={thStyle}>売上合計</th>
                    <th style={thStyle}>給与概算</th>
                    <th style={thStyle}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedSummaries.map((item) => (
                    <tr key={item.staffName}>
                      <td style={tdStyleStrong}>{item.staffName}</td>
                      <td style={tdStyle}>{item.count}件</td>
                      <td style={tdStyle}>{formatCurrency(item.total)}</td>
                      <td style={tdStyleStrongBlue}>{formatCurrency(item.payroll)}</td>
                      <td style={tdStyle}>
                        <div style={actionInlineStyle}>
                          <button
                            style={smallButtonStyle}
                            onClick={() => setStaffFilter(item.staffName)}
                          >
                            表示
                          </button>
                          <button
                            style={smallGhostButtonStyle}
                            onClick={() => handleExportStaffCsv(item.staffName)}
                          >
                            CSV
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>PAYROLL SUMMARY</div>
              <h2 style={panelTitleStyle}>給与計算サマリー</h2>
            </div>
          </div>

          <div style={detailBoxStyle}>
            <DetailRow label="対象スタッフ" value={staffFilter || "全スタッフ"} />
            <DetailRow label="対象月" value={monthLabel(monthFilter)} />
            <DetailRow label="売上件数" value={`${totals.count}件`} />
            <DetailRow label="売上合計" value={formatCurrency(totals.totalAmount)} />
            <DetailRow label="給与率" value={`${Number(ratePercent || 0)}%`} />
            <DetailRow label="歩合給与" value={formatCurrency(totals.payrollBase)} />
            <DetailRow
              label={`指名料（${formatCurrency(nominationFeeNum)} × ${totals.count}件）`}
              value={formatCurrency(totals.nominationTotal)}
            />
            <DetailRow label="交通費" value={formatCurrency(transportationNum)} />
            <DetailRow label="手当" value={formatCurrency(adjustmentNum)} />
            <DetailRow label="控除" value={`- ${formatCurrency(deductionNum)}`} />
            <DetailRowStrong label="支給額合計" value={formatCurrency(totals.totalPayment)} />
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>SALES DETAILS</div>
              <h2 style={panelTitleStyle}>売上明細一覧</h2>
            </div>
          </div>

          {loading ? (
            <div style={loadingStyle}>読み込み中...</div>
          ) : selectedStaffSales.length === 0 ? (
            <div style={emptyBoxStyle}>該当する売上データがありません。</div>
          ) : mobile ? (
            <div style={{ display: "grid", gap: 12 }}>
              {selectedStaffSales.map((row) => (
                <div key={row.id} style={recordCardStyle}>
                  <div style={recordDateStyle}>
                    {formatDateJP(row.saleDate)} / {row.staffName}
                  </div>

                  <div style={recordInfoGridStyle}>
                    <MiniInfo label="顧客名" value={row.customerName} />
                    <MiniInfo label="メニュー" value={row.menuName} />
                    <MiniInfo label="サービス" value={row.serviceType} />
                    <MiniInfo label="会計区分" value={row.accountingType} />
                    <MiniInfo label="支払方法" value={row.paymentMethod} />
                    <MiniInfo label="店舗" value={row.storeName} />
                    <MiniInfo label="金額" value={formatCurrency(row.amount)} />
                    <MiniInfo label="予約ID" value={row.reservationId} />
                  </div>

                  {row.memo ? <div style={memoBoxStyle}>メモ：{row.memo}</div> : null}
                </div>
              ))}
            </div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={salesTableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>スタッフ</th>
                    <th style={thStyle}>日付</th>
                    <th style={thStyle}>顧客名</th>
                    <th style={thStyle}>メニュー</th>
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
                  {selectedStaffSales.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyleStrong}>{row.staffName}</td>
                      <td style={tdStyle}>{formatDateJP(row.saleDate)}</td>
                      <td style={tdStyle}>{row.customerName}</td>
                      <td style={tdStyle}>{row.menuName}</td>
                      <td style={tdStyle}>{row.serviceType}</td>
                      <td style={tdStyle}>{row.accountingType}</td>
                      <td style={tdStyle}>{row.paymentMethod}</td>
                      <td style={tdStyleStrongBlue}>{formatCurrency(row.amount)}</td>
                      <td style={tdStyle}>{row.storeName}</td>
                      <td style={tdStyle}>{row.reservationId}</td>
                      <td style={tdNoteStyle}>{row.memo || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={filterCardStyle}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={miniInfoCardStyle}>
      <div style={miniInfoLabelStyle}>{label}</div>
      <div style={miniInfoValueStyle}>{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
}

function DetailRowStrong({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ ...detailRowStyle, borderBottom: "none" }}>
      <span style={{ ...detailLabelStyle, fontWeight: 800, color: "#f8fafc" }}>
        {label}
      </span>
      <span style={{ ...detailValueStyle, fontWeight: 900, color: "#f59e0b" }}>
        {value}
      </span>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0) 30%), linear-gradient(135deg, #050816 0%, #0b1120 34%, #111827 68%, #060b16 100%)",
  position: "relative",
  overflow: "hidden",
};

const bgGlowA: CSSProperties = {
  position: "absolute",
  top: -140,
  left: -120,
  width: 420,
  height: 420,
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0) 72%)",
  pointerEvents: "none",
};

const bgGlowB: CSSProperties = {
  position: "absolute",
  right: -120,
  top: 80,
  width: 360,
  height: 360,
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 72%)",
  pointerEvents: "none",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 1480,
  margin: "0 auto",
  padding: "28px 18px 60px",
  display: "grid",
  gap: 18,
};

const topRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  color: "rgba(226,232,240,0.82)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(148,163,184,0.7)",
};

const heroCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 28,
  padding: "24px 22px",
  boxShadow: "0 24px 60px rgba(0,0,0,0.32)",
  backdropFilter: "blur(14px)",
};

const heroLeftStyle: CSSProperties = {
  flex: 1,
  minWidth: 260,
};

const heroRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const miniLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(148,163,184,0.8)",
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 42px)",
  lineHeight: 1.1,
  color: "#f8fafc",
  fontWeight: 800,
};

const descStyle: CSSProperties = {
  margin: "12px 0 0",
  fontSize: 14,
  lineHeight: 1.8,
  color: "rgba(226,232,240,0.76)",
};

const errorBoxStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(127,29,29,0.35)",
  border: "1px solid rgba(248,113,113,0.34)",
  color: "#fecaca",
  fontSize: 14,
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const filterCardStyle: CSSProperties = {
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 22,
  padding: 16,
  boxShadow: "0 16px 36px rgba(0,0,0,0.22)",
  backdropFilter: "blur(10px)",
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(226,232,240,0.8)",
  marginBottom: 8,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.22)",
  background: "rgba(2,6,23,0.72)",
  color: "#f8fafc",
  padding: "0 14px",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};

const summaryGridLargeStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const metricCardStyle: CSSProperties = {
  borderRadius: 20,
  background: "linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.9) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 16,
  boxShadow: "0 18px 44px rgba(0,0,0,0.26)",
};

const metricLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(148,163,184,0.86)",
  marginBottom: 8,
};

const metricValueStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "#f8fafc",
  lineHeight: 1.2,
};

const panelStyle: CSSProperties = {
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 26,
  padding: 20,
  boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
  backdropFilter: "blur(10px)",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 16,
};

const panelMiniStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.22em",
  color: "rgba(148,163,184,0.72)",
  marginBottom: 6,
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#f8fafc",
  fontWeight: 700,
};

const detailBoxStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 16,
};

const detailRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid rgba(148,163,184,0.16)",
};

const detailLabelStyle: CSSProperties = {
  fontSize: 14,
  color: "rgba(226,232,240,0.72)",
};

const detailValueStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#f8fafc",
};

const emptyBoxStyle: CSSProperties = {
  minHeight: 120,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  borderRadius: 20,
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(226,232,240,0.6)",
  fontSize: 14,
  padding: 20,
};

const miniInfoCardStyle: CSSProperties = {
  borderRadius: 16,
  background: "rgba(2,6,23,0.5)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 12,
};

const miniInfoLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "rgba(148,163,184,0.82)",
  marginBottom: 6,
};

const miniInfoValueStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#f8fafc",
  lineHeight: 1.5,
};

const tableWrapStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,23,0.4)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 760,
  borderCollapse: "collapse",
};

const salesTableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1300,
  borderCollapse: "collapse",
};

const thStyle: CSSProperties = {
  padding: "12px 10px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(203,213,225,0.82)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(15,23,42,0.92)",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "12px 10px",
  fontSize: 13,
  color: "#e5e7eb",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const tdStyleStrong: CSSProperties = {
  ...tdStyle,
  fontWeight: 800,
  color: "#f8fafc",
};

const tdStyleStrongBlue: CSSProperties = {
  ...tdStyle,
  fontWeight: 800,
  color: "#f59e0b",
};

const tdNoteStyle: CSSProperties = {
  ...tdStyle,
  whiteSpace: "normal",
  minWidth: 220,
};

const recordCardStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(2,6,23,0.42)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 16,
};

const recordDateStyle: CSSProperties = {
  fontSize: 14,
  color: "rgba(226,232,240,0.78)",
  marginBottom: 10,
  fontWeight: 700,
};

const recordInfoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  color: "rgba(226,232,240,0.72)",
  fontSize: 14,
  padding: "16px 0",
};

const primaryButtonStyle: CSSProperties = {
  height: 46,
  padding: "0 18px",
  borderRadius: 14,
  border: "1px solid rgba(245,158,11,0.4)",
  background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  height: 40,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(245,158,11,0.32)",
  background: "rgba(245,158,11,0.14)",
  color: "#fbbf24",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const ghostButtonStyle: CSSProperties = {
  height: 40,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.22)",
  background: "rgba(255,255,255,0.04)",
  color: "#e5e7eb",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const smallButtonStyle: CSSProperties = {
  height: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid rgba(245,158,11,0.28)",
  background: "rgba(245,158,11,0.12)",
  color: "#fbbf24",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};

const smallGhostButtonStyle: CSSProperties = {
  height: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.2)",
  background: "rgba(255,255,255,0.04)",
  color: "#e5e7eb",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};

const actionInlineStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const cardActionRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 12,
};

const memoBoxStyle: CSSProperties = {
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  fontSize: 13,
  lineHeight: 1.6,
};