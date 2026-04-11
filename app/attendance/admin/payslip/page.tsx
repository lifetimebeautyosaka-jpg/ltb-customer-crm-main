"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP").format(d);
}

function formatTimeJP(value?: string | null) {
  if (!value) return "--:--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
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

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [staffFilter, setStaffFilter] = useState("");
  const [hourlyWage, setHourlyWage] = useState("1200");
  const [overtimeRate, setOvertimeRate] = useState("1.25");
  const [lateNightRate, setLateNightRate] = useState("1.25");
  const [transportation, setTransportation] = useState("0");
  const [adjustment, setAdjustment] = useState("0");
  const [deduction, setDeduction] = useState("0");

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

  const staffNames = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.staff_name).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
  }, [rows]);

  useEffect(() => {
    if (!staffFilter && staffNames.length > 0) {
      setStaffFilter(staffNames[0]);
    }
  }, [staffNames, staffFilter]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        const matchMonth = monthFilter
          ? String(row.work_date || "").startsWith(monthFilter)
          : true;
        const matchStaff = staffFilter ? row.staff_name === staffFilter : true;
        return matchMonth && matchStaff;
      })
      .sort((a, b) => String(a.work_date).localeCompare(String(b.work_date)));
  }, [rows, monthFilter, staffFilter]);

  const wage = Number(hourlyWage || 0);
  const overtimeMultiplier = Number(overtimeRate || 1.25);
  const lateNightMultiplier = Number(lateNightRate || 1.25);
  const transportationNum = Number(transportation || 0);
  const adjustmentNum = Number(adjustment || 0);
  const deductionNum = Number(deduction || 0);

  const totals = useMemo(() => {
    const workDays = filteredRows.filter((r) => r.clock_in).length;
    const regularMinutes = filteredRows.reduce((sum, row) => sum + Number(row.regular_minutes || 0), 0);
    const overtimeMinutes = filteredRows.reduce((sum, row) => sum + Number(row.overtime_minutes || 0), 0);
    const lateNightMinutes = filteredRows.reduce((sum, row) => sum + Number(row.late_night_minutes || 0), 0);
    const totalWorkMinutes = filteredRows.reduce((sum, row) => sum + Number(row.total_work_minutes || 0), 0);

    const regularPay = (regularMinutes / 60) * wage;
    const overtimePay = (overtimeMinutes / 60) * wage * overtimeMultiplier;
    const lateNightPay = (lateNightMinutes / 60) * wage * lateNightMultiplier;

    const grossPay = regularPay + overtimePay + lateNightPay;
    const paymentTotal = grossPay + transportationNum + adjustmentNum - deductionNum;

    return {
      workDays,
      regularMinutes,
      overtimeMinutes,
      lateNightMinutes,
      totalWorkMinutes,
      regularPay,
      overtimePay,
      lateNightPay,
      grossPay,
      paymentTotal,
    };
  }, [
    filteredRows,
    wage,
    overtimeMultiplier,
    lateNightMultiplier,
    transportationNum,
    adjustmentNum,
    deductionNum,
  ]);

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
          <div style={eyebrowStyle}>PAYSLIP</div>
        </div>

        <div style={heroCardStyle}>
          <div style={heroLeftStyle}>
            <div style={miniLabelStyle}>GYMUP PAYROLL</div>
            <h1 style={titleStyle}>給与明細ページ</h1>
            <p style={descStyle}>
              スタッフ1名・1ヶ月分の勤務実績と給与概算を確認できます。
            </p>
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
              : "repeat(6, minmax(0, 1fr))",
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
              <option value="">選択してください</option>
              {staffNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
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

          <FilterCard label="交通費">
            <input
              type="number"
              value={transportation}
              onChange={(e) => setTransportation(e.target.value)}
              style={inputStyle}
            />
          </FilterCard>
        </div>

        <div
          style={{
            ...filterGridStyle,
            gridTemplateColumns: mobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
          }}
        >
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
          <MetricCard label="スタッフ" value={staffFilter || "未選択"} />
          <MetricCard label="出勤日数" value={`${totals.workDays}日`} />
          <MetricCard label="総勤務時間" value={minutesToText(totals.totalWorkMinutes)} />
          <MetricCard label="支給額合計" value={formatCurrency(totals.paymentTotal)} />
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
          <MetricCard label="通常賃金" value={formatCurrency(totals.regularPay)} />
          <MetricCard label="残業賃金" value={formatCurrency(totals.overtimePay)} />
          <MetricCard label="深夜賃金" value={formatCurrency(totals.lateNightPay)} />
          <MetricCard label="総支給前" value={formatCurrency(totals.grossPay)} />
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>PAYSLIP SUMMARY</div>
              <h2 style={panelTitleStyle}>給与明細サマリー</h2>
            </div>
          </div>

          <div style={detailBoxStyle}>
            <DetailRow label="氏名" value={staffFilter || "未選択"} />
            <DetailRow label="対象月" value={monthLabel(monthFilter)} />
            <DetailRow label="出勤日数" value={`${totals.workDays}日`} />
            <DetailRow label="通常勤務時間" value={minutesToText(totals.regularMinutes)} />
            <DetailRow label="残業時間" value={minutesToText(totals.overtimeMinutes)} />
            <DetailRow label="深夜時間" value={minutesToText(totals.lateNightMinutes)} />
            <DetailRow label="通常賃金" value={formatCurrency(totals.regularPay)} />
            <DetailRow label="残業賃金" value={formatCurrency(totals.overtimePay)} />
            <DetailRow label="深夜賃金" value={formatCurrency(totals.lateNightPay)} />
            <DetailRow label="小計" value={formatCurrency(totals.grossPay)} />
            <DetailRow label="交通費" value={formatCurrency(transportationNum)} />
            <DetailRow label="手当" value={formatCurrency(adjustmentNum)} />
            <DetailRow label="控除" value={`- ${formatCurrency(deductionNum)}`} />
            <DetailRowStrong label="支給額合計" value={formatCurrency(totals.paymentTotal)} />
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>ATTENDANCE DETAILS</div>
              <h2 style={panelTitleStyle}>月内勤怠詳細</h2>
            </div>
          </div>

          {loading ? (
            <div style={loadingStyle}>読み込み中...</div>
          ) : filteredRows.length === 0 ? (
            <div style={emptyBoxStyle}>該当する勤怠データがありません。</div>
          ) : mobile ? (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredRows.map((row) => (
                <div key={row.id} style={recordCardStyle}>
                  <div style={recordDateStyle}>{formatDateJP(row.work_date)}</div>
                  <div style={recordInfoGridStyle}>
                    <MiniInfo label="出勤" value={formatTimeJP(row.clock_in)} />
                    <MiniInfo label="退勤" value={formatTimeJP(row.clock_out)} />
                    <MiniInfo label="休憩" value={`${row.break_minutes ?? 0}分`} />
                    <MiniInfo label="通常" value={minutesToText(row.regular_minutes ?? 0)} />
                    <MiniInfo label="残業" value={minutesToText(row.overtime_minutes ?? 0)} />
                    <MiniInfo label="深夜" value={minutesToText(row.late_night_minutes ?? 0)} />
                    <MiniInfo label="総勤務" value={minutesToText(row.total_work_minutes ?? 0)} />
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
                    <th style={thStyle}>出勤</th>
                    <th style={thStyle}>退勤</th>
                    <th style={thStyle}>休憩</th>
                    <th style={thStyle}>通常</th>
                    <th style={thStyle}>残業</th>
                    <th style={thStyle}>深夜</th>
                    <th style={thStyle}>総勤務</th>
                    <th style={thStyle}>備考</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyle}>{formatDateJP(row.work_date)}</td>
                      <td style={tdStyle}>{formatTimeJP(row.clock_in)}</td>
                      <td style={tdStyle}>{formatTimeJP(row.clock_out)}</td>
                      <td style={tdStyle}>{row.break_minutes ?? 0}分</td>
                      <td style={tdStyle}>{minutesToText(row.regular_minutes ?? 0)}</td>
                      <td style={tdStyle}>{minutesToText(row.overtime_minutes ?? 0)}</td>
                      <td style={tdStyle}>{minutesToText(row.late_night_minutes ?? 0)}</td>
                      <td style={tdStyleStrong}>{minutesToText(row.total_work_minutes ?? 0)}</td>
                      <td style={tdNoteStyle}>{row.note || "—"}</td>
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
      <span style={{ ...detailLabelStyle, fontWeight: 800, color: "#0f172a" }}>{label}</span>
      <span style={{ ...detailValueStyle, fontWeight: 900, color: "#2563eb" }}>{value}</span>
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

const detailBoxStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 16,
};

const detailRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid rgba(226,232,240,0.9)",
};

const detailLabelStyle: CSSProperties = {
  fontSize: 14,
  color: "rgba(15,23,42,0.62)",
};

const detailValueStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
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
  minWidth: 900,
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

const tdNoteStyle: CSSProperties = {
  ...tdStyle,
  whiteSpace: "normal",
  minWidth: 180,
};

const recordCardStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 16,
};

const recordDateStyle: CSSProperties = {
  fontSize: 14,
  color: "rgba(15,23,42,0.56)",
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
  color: "rgba(15,23,42,0.56)",
  fontSize: 14,
  padding: "16px 0",
};