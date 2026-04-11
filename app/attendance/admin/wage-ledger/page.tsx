"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

type AttendanceRow = {
  id: number;
  staff_id: string;
  staff_name: string;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number | null;
  regular_minutes: number | null;
  overtime_minutes: number | null;
  late_night_minutes: number | null;
  total_work_minutes: number | null;
  note: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type LedgerRow = {
  staffName: string;
  month: string;
  workDays: number;
  totalMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  lateNightMinutes: number;
  regularPay: number;
  overtimePay: number;
  lateNightPay: number;
  grossPay: number;
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

function minutesToText(minutes: number) {
  const safe = Math.max(0, Math.floor(minutes || 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}時間${m}分`;
}

function formatCurrency(value: number) {
  return `¥${Math.round(value || 0).toLocaleString()}`;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WageLedgerPage() {
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

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [hourlyWage, setHourlyWage] = useState("1200");
  const [overtimeRate, setOvertimeRate] = useState("1.25");
  const [lateNightRate, setLateNightRate] = useState("1.25");

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

    void fetchAttendance();
  }, [mounted]);

  const mobile = windowWidth < 768;
  const tablet = windowWidth < 1100;

  async function fetchAttendance() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が未設定です。");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("staff_attendance")
        .select("*")
        .order("work_date", { ascending: false })
        .order("staff_name", { ascending: true });

      if (error) throw error;

      setRows(((data as AttendanceRow[]) || []).map((row) => ({
        ...row,
        break_minutes: row.break_minutes ?? 0,
        regular_minutes: row.regular_minutes ?? 0,
        overtime_minutes: row.overtime_minutes ?? 0,
        late_night_minutes: row.late_night_minutes ?? 0,
        total_work_minutes: row.total_work_minutes ?? 0,
      })));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "勤怠データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const wage = Number(hourlyWage || 0);
  const overtimeMultiplier = Number(overtimeRate || 1.25);
  const lateNightMultiplier = Number(lateNightRate || 1.25);

  const ledgerRows = useMemo<LedgerRow[]>(() => {
    const filtered = rows.filter((row) =>
      monthFilter ? String(row.work_date || "").startsWith(monthFilter) : true
    );

    const grouped = new Map<string, LedgerRow>();

    filtered.forEach((row) => {
      const key = `${row.staff_name}__${monthFilter}`;
      const current = grouped.get(key) || {
        staffName: row.staff_name || "未設定",
        month: monthFilter,
        workDays: 0,
        totalMinutes: 0,
        regularMinutes: 0,
        overtimeMinutes: 0,
        lateNightMinutes: 0,
        regularPay: 0,
        overtimePay: 0,
        lateNightPay: 0,
        grossPay: 0,
      };

      current.workDays += row.clock_in ? 1 : 0;
      current.totalMinutes += Number(row.total_work_minutes || 0);
      current.regularMinutes += Number(row.regular_minutes || 0);
      current.overtimeMinutes += Number(row.overtime_minutes || 0);
      current.lateNightMinutes += Number(row.late_night_minutes || 0);

      grouped.set(key, current);
    });

    const list = Array.from(grouped.values()).map((item) => {
      const regularPay = (item.regularMinutes / 60) * wage;
      const overtimePay = (item.overtimeMinutes / 60) * wage * overtimeMultiplier;
      const lateNightPay = (item.lateNightMinutes / 60) * wage * lateNightMultiplier;
      const grossPay = regularPay + overtimePay + lateNightPay;

      return {
        ...item,
        regularPay,
        overtimePay,
        lateNightPay,
        grossPay,
      };
    });

    return list.sort((a, b) => a.staffName.localeCompare(b.staffName, "ja"));
  }, [rows, monthFilter, wage, overtimeMultiplier, lateNightMultiplier]);

  const totalGrossPay = useMemo(() => {
    return ledgerRows.reduce((sum, row) => sum + row.grossPay, 0);
  }, [ledgerRows]);

  const totalWorkDays = useMemo(() => {
    return ledgerRows.reduce((sum, row) => sum + row.workDays, 0);
  }, [ledgerRows]);

  function handleCsvExport() {
    const header = [
      "対象月",
      "スタッフ名",
      "出勤日数",
      "総勤務時間(分)",
      "通常勤務(分)",
      "残業(分)",
      "深夜(分)",
      "通常賃金",
      "残業賃金",
      "深夜賃金",
      "総支給概算",
    ];

    const body = ledgerRows.map((row) => [
      monthLabel(row.month),
      row.staffName,
      row.workDays,
      row.totalMinutes,
      row.regularMinutes,
      row.overtimeMinutes,
      row.lateNightMinutes,
      Math.round(row.regularPay),
      Math.round(row.overtimePay),
      Math.round(row.lateNightPay),
      Math.round(row.grossPay),
    ]);

    downloadCsv(`wage-ledger-${monthFilter}.csv`, [header, ...body]);
  }

  function handleExcelExport() {
    const sheetData = ledgerRows.map((row) => ({
      対象月: monthLabel(row.month),
      スタッフ名: row.staffName,
      出勤日数: row.workDays,
      総勤務時間_分: row.totalMinutes,
      通常勤務_分: row.regularMinutes,
      残業_分: row.overtimeMinutes,
      深夜_分: row.lateNightMinutes,
      通常賃金: Math.round(row.regularPay),
      残業賃金: Math.round(row.overtimePay),
      深夜賃金: Math.round(row.lateNightPay),
      総支給概算: Math.round(row.grossPay),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);

    XLSX.utils.book_append_sheet(wb, ws, "賃金台帳");
    XLSX.writeFile(wb, `wage-ledger-${monthFilter}.xlsx`);
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
          <div style={eyebrowStyle}>WAGE LEDGER</div>
        </div>

        <div style={heroCardStyle}>
          <div style={heroLeftStyle}>
            <div style={miniLabelStyle}>GYMUP PAYROLL</div>
            <h1 style={titleStyle}>賃金台帳</h1>
            <p style={descStyle}>
              月別のスタッフごとの賃金台帳を一覧で確認し、CSV / Excel で出力できます。
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              width: mobile ? "100%" : "auto",
              flexDirection: mobile ? "column" : "row",
            }}
          >
            <button
              type="button"
              onClick={() => void fetchAttendance()}
              style={{
                ...topActionButtonStyle,
                width: mobile ? "100%" : "auto",
              }}
            >
              再読み込み
            </button>
            <button
              type="button"
              onClick={handleCsvExport}
              style={{
                ...topActionButtonStyle,
                width: mobile ? "100%" : "auto",
              }}
            >
              CSV出力
            </button>
            <button
              type="button"
              onClick={handleExcelExport}
              style={{
                ...topActionButtonStyle,
                width: mobile ? "100%" : "auto",
              }}
            >
              Excel出力
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

          <FilterCard label="時給">
            <input
              type="number"
              value={hourlyWage}
              onChange={(e) => setHourlyWage(e.target.value)}
              style={inputStyle}
            />
          </FilterCard>

          <FilterCard label="残業倍率">
            <input
              type="number"
              step="0.01"
              value={overtimeRate}
              onChange={(e) => setOvertimeRate(e.target.value)}
              style={inputStyle}
            />
          </FilterCard>

          <FilterCard label="深夜倍率">
            <input
              type="number"
              step="0.01"
              value={lateNightRate}
              onChange={(e) => setLateNightRate(e.target.value)}
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
              : "repeat(4, minmax(0, 1fr))",
          }}
        >
          <MetricCard label="対象月" value={monthLabel(monthFilter)} />
          <MetricCard label="台帳人数" value={`${ledgerRows.length}名`} />
          <MetricCard label="合計出勤日数" value={`${totalWorkDays}日`} />
          <MetricCard label="総支給概算" value={formatCurrency(totalGrossPay)} />
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>LEDGER LIST</div>
              <h2 style={panelTitleStyle}>賃金台帳一覧</h2>
            </div>
          </div>

          {loading ? (
            <div style={loadingStyle}>読み込み中...</div>
          ) : ledgerRows.length === 0 ? (
            <div style={emptyBoxStyle}>該当するデータがありません。</div>
          ) : mobile ? (
            <div style={{ display: "grid", gap: 12 }}>
              {ledgerRows.map((row) => (
                <div key={`${row.staffName}-${row.month}`} style={recordCardStyle}>
                  <div style={recordDateStyle}>{row.staffName}</div>
                  <div style={recordSubStyle}>{monthLabel(row.month)}</div>

                  <div style={recordInfoGridStyle}>
                    <MiniInfo label="出勤日数" value={`${row.workDays}日`} />
                    <MiniInfo label="総勤務" value={minutesToText(row.totalMinutes)} />
                    <MiniInfo label="通常" value={minutesToText(row.regularMinutes)} />
                    <MiniInfo label="残業" value={minutesToText(row.overtimeMinutes)} />
                    <MiniInfo label="深夜" value={minutesToText(row.lateNightMinutes)} />
                    <MiniInfo label="支給概算" value={formatCurrency(row.grossPay)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>対象月</th>
                    <th style={thStyle}>スタッフ名</th>
                    <th style={thStyle}>出勤日数</th>
                    <th style={thStyle}>総勤務時間</th>
                    <th style={thStyle}>通常勤務</th>
                    <th style={thStyle}>残業</th>
                    <th style={thStyle}>深夜</th>
                    <th style={thStyle}>通常賃金</th>
                    <th style={thStyle}>残業賃金</th>
                    <th style={thStyle}>深夜賃金</th>
                    <th style={thStyle}>総支給概算</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map((row) => (
                    <tr key={`${row.staffName}-${row.month}`}>
                      <td style={tdStyle}>{monthLabel(row.month)}</td>
                      <td style={tdStyleStrong}>{row.staffName}</td>
                      <td style={tdStyle}>{row.workDays}日</td>
                      <td style={tdStyle}>{minutesToText(row.totalMinutes)}</td>
                      <td style={tdStyle}>{minutesToText(row.regularMinutes)}</td>
                      <td style={tdStyle}>{minutesToText(row.overtimeMinutes)}</td>
                      <td style={tdStyle}>{minutesToText(row.lateNightMinutes)}</td>
                      <td style={tdStyle}>{formatCurrency(row.regularPay)}</td>
                      <td style={tdStyle}>{formatCurrency(row.overtimePay)}</td>
                      <td style={tdStyle}>{formatCurrency(row.lateNightPay)}</td>
                      <td style={tdStyleStrongBlue}>{formatCurrency(row.grossPay)}</td>
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
  children: React.ReactNode;
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

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #eef4ff 0%, #f8fbff 30%, #f3f7ff 65%, #eef2ff 100%)",
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
    "radial-gradient(circle, rgba(147,197,253,0.22) 0%, rgba(147,197,253,0) 72%)",
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
    "radial-gradient(circle, rgba(196,181,253,0.18) 0%, rgba(196,181,253,0) 72%)",
  pointerEvents: "none",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 1280,
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
  color: "rgba(30,41,59,0.78)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(30,41,59,0.42)",
};

const heroCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.75)",
  borderRadius: 28,
  padding: "24px 22px",
  boxShadow: "0 18px 40px rgba(148,163,184,0.14)",
  backdropFilter: "blur(10px)",
};

const heroLeftStyle: CSSProperties = {
  flex: 1,
  minWidth: 260,
};

const miniLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(30,41,59,0.48)",
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 42px)",
  lineHeight: 1.1,
  color: "#0f172a",
  fontWeight: 800,
};

const descStyle: CSSProperties = {
  margin: "12px 0 0",
  fontSize: 14,
  lineHeight: 1.8,
  color: "rgba(15,23,42,0.68)",
};

const topActionButtonStyle: CSSProperties = {
  minHeight: 44,
  padding: "10px 16px",
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.84)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const errorBoxStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(254,226,226,0.9)",
  border: "1px solid rgba(248,113,113,0.28)",
  color: "#b91c1c",
  fontSize: 14,
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const filterCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.52)",
  border: "1px solid rgba(255,255,255,0.76)",
  borderRadius: 22,
  padding: 16,
  boxShadow: "0 14px 34px rgba(148,163,184,0.12)",
  backdropFilter: "blur(10px)",
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(15,23,42,0.78)",
  marginBottom: 8,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.82)",
  color: "#0f172a",
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
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 16,
};

const metricLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(15,23,42,0.46)",
  marginBottom: 8,
};

const metricValueStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.2,
};

const panelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.52)",
  border: "1px solid rgba(255,255,255,0.76)",
  borderRadius: 26,
  padding: 20,
  boxShadow: "0 14px 34px rgba(148,163,184,0.12)",
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
  color: "rgba(30,41,59,0.42)",
  marginBottom: 6,
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 700,
};

const emptyBoxStyle: CSSProperties = {
  minHeight: 120,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  borderRadius: 20,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "rgba(15,23,42,0.54)",
  fontSize: 14,
  padding: 20,
};

const miniInfoCardStyle: CSSProperties = {
  borderRadius: 16,
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 12,
};

const miniInfoLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "rgba(15,23,42,0.46)",
  marginBottom: 6,
};

const miniInfoValueStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
  lineHeight: 1.5,
};

const tableWrapStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.72)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1100,
  borderCollapse: "collapse",
};

const thStyle: CSSProperties = {
  padding: "12px 10px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(15,23,42,0.56)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.95)",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "12px 10px",
  fontSize: 13,
  color: "#0f172a",
  borderBottom: "1px solid rgba(226,232,240,0.7)",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const tdStyleStrong: CSSProperties = {
  ...tdStyle,
  fontWeight: 800,
};

const tdStyleStrongBlue: CSSProperties = {
  ...tdStyle,
  fontWeight: 900,
  color: "#2563eb",
};

const recordCardStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 16,
};

const recordDateStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 4,
};

const recordSubStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(15,23,42,0.56)",
  marginBottom: 12,
};

const recordInfoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  color: "rgba(15,23,42,0.56)",
  fontSize: 14,
  padding: "16px 0",
};