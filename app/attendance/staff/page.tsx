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

type StaffMasterRow = {
  id?: number;
  staff_id: string;
  staff_name: string;
  is_active?: boolean | null;
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

function getJstNow() {
  return new Date();
}

function formatJstDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(month: string) {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);

  const startText = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
    start.getDate()
  ).padStart(2, "0")}`;

  const endText = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate()
  ).padStart(2, "0")}`;

  return { startText, endText };
}

function formatDateJP(value?: string | null) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(d);
}

function formatDateTimeJP(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function formatTimeJP(value?: string | null) {
  if (!value) return "--:--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
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

function calcTotalMinutes(
  clockIn?: string | null,
  clockOut?: string | null,
  breakMinutes = 0
) {
  if (!clockIn || !clockOut) return 0;

  const start = new Date(clockIn).getTime();
  const end = new Date(clockOut).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;

  const raw = Math.floor((end - start) / 1000 / 60);
  const total = raw - Math.max(0, breakMinutes);

  return total > 0 ? total : 0;
}

function calcOvertimeMinutes(totalMinutes: number) {
  return Math.max(0, totalMinutes - 8 * 60);
}

function overlapMinutes(
  startMs: number,
  endMs: number,
  rangeStartMs: number,
  rangeEndMs: number
) {
  const start = Math.max(startMs, rangeStartMs);
  const end = Math.min(endMs, rangeEndMs);
  if (end <= start) return 0;
  return Math.floor((end - start) / 1000 / 60);
}

function calcLateNightMinutes(clockIn?: string | null, clockOut?: string | null) {
  if (!clockIn || !clockOut) return 0;

  const start = new Date(clockIn);
  const end = new Date(clockOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  let total = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);

  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  last.setDate(last.getDate() + 1);

  while (cursor <= last) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const d = cursor.getDate();

    const lateNightStart = new Date(y, m, d, 22, 0, 0, 0).getTime();
    const lateNightEnd = new Date(y, m, d + 1, 5, 0, 0, 0).getTime();

    total += overlapMinutes(
      start.getTime(),
      end.getTime(),
      lateNightStart,
      lateNightEnd
    );

    cursor.setDate(cursor.getDate() + 1);
  }

  return Math.max(0, total);
}

function makeStaffIdFromName(name: string) {
  return `staff_${name.trim().replace(/\s+/g, "_")}`;
}

function monthLabel(month: string) {
  if (!month) return "—";
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

function formatCurrency(value: number) {
  return `¥${Math.round(value || 0).toLocaleString()}`;
}

export default function AttendanceStaffPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [inputStaffName, setInputStaffName] = useState("");

  const [todayRow, setTodayRow] = useState<AttendanceRow | null>(null);
  const [monthRows, setMonthRows] = useState<AttendanceRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());

  const [breakMinutes, setBreakMinutes] = useState(60);
  const [note, setNote] = useState("");
  const [liveNow, setLiveNow] = useState(Date.now());

  const [hourlyWage, setHourlyWage] = useState("1200");
  const [overtimeRate, setOvertimeRate] = useState("1.25");
  const [lateNightRate, setLateNightRate] = useState("1.25");

  const todayJst = formatJstDate(getJstNow());

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

    const savedStaffId = localStorage.getItem("gymup_current_staff_id") || "";
    const savedStaffName = localStorage.getItem("gymup_current_staff_name") || "";

    if (savedStaffId && savedStaffName) {
      setStaffId(savedStaffId);
      setStaffName(savedStaffName);
      setInputStaffName(savedStaffName);
    } else if (savedStaffName) {
      const generated = makeStaffIdFromName(savedStaffName);
      localStorage.setItem("gymup_current_staff_id", generated);
      setStaffId(generated);
      setStaffName(savedStaffName);
      setInputStaffName(savedStaffName);
    }

    const timer = window.setInterval(() => {
      setLiveNow(Date.now());
    }, 1000 * 30);

    return () => window.clearInterval(timer);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (!staffId) {
      setLoading(false);
      return;
    }
    void init();
  }, [mounted, staffId, selectedMonth]);

  const mobile = windowWidth < 768;
  const tablet = windowWidth < 1100;

  async function ensureStaffMaster(clientStaffId: string, clientStaffName: string) {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("staff_master")
      .select("staff_id, staff_name, is_active")
      .eq("staff_id", clientStaffId)
      .maybeSingle();

    if (error) {
      if (error.message.includes("schema cache")) {
        throw new Error("staff_master テーブルが未作成です。SupabaseのSQLを先に実行してください。");
      }
      throw new Error(error.message);
    }

    const existing = (data as StaffMasterRow | null) || null;

    if (!existing) {
      const { error: insertError } = await supabase.from("staff_master").insert({
        staff_id: clientStaffId,
        staff_name: clientStaffName,
        is_active: true,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  }

  async function loadTodayAttendance(clientStaffId: string) {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", clientStaffId)
      .eq("work_date", todayJst)
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      if (error.message.includes("schema cache")) {
        throw new Error("staff_attendance テーブルが未作成です。SupabaseのSQLを先に実行してください。");
      }
      throw new Error(error.message);
    }

    const rows = (data as AttendanceRow[] | null) || [];
    const row = rows.length > 0 ? rows[0] : null;

    setTodayRow(row);
    setBreakMinutes(row?.break_minutes ?? 60);
    setNote(row?.note ?? "");
  }

  async function loadMonthAttendance(clientStaffId: string) {
    if (!supabase) return;

    const { startText, endText } = getMonthRange(selectedMonth);

    const { data, error } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", clientStaffId)
      .gte("work_date", startText)
      .lte("work_date", endText)
      .order("work_date", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      if (error.message.includes("schema cache")) {
        throw new Error("staff_attendance テーブルが未作成です。SupabaseのSQLを先に実行してください。");
      }
      throw new Error(error.message);
    }

    setMonthRows((data as AttendanceRow[] | null) || []);
  }

  async function init() {
    if (!supabase) {
      setErrorMessage("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      await ensureStaffMaster(staffId, staffName || inputStaffName || "スタッフ");
      await loadTodayAttendance(staffId);
      await loadMonthAttendance(staffId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "読み込みに失敗しました。";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveStaff() {
    const name = inputStaffName.trim();
    if (!name) {
      alert("スタッフ名を入力してください。");
      return;
    }

    const generatedId = makeStaffIdFromName(name);
    localStorage.setItem("gymup_current_staff_name", name);
    localStorage.setItem("gymup_current_staff_id", generatedId);

    setStaffName(name);
    setStaffId(generatedId);

    if (!supabase) {
      alert("Supabaseの環境変数が未設定です。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      await ensureStaffMaster(generatedId, name);
      await loadTodayAttendance(generatedId);
      await loadMonthAttendance(generatedId);
      alert("スタッフを保存しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "スタッフ保存に失敗しました。";
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleClockIn() {
    if (!supabase) {
      alert("Supabaseの環境変数が未設定です。");
      return;
    }

    if (!staffId || !staffName) {
      alert("先にスタッフ名を保存してください。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      await ensureStaffMaster(staffId, staffName);

      const { data, error: existingError } = await supabase
        .from("staff_attendance")
        .select("*")
        .eq("staff_id", staffId)
        .eq("work_date", todayJst)
        .order("id", { ascending: false })
        .limit(1);

      if (existingError) throw new Error(existingError.message);

      const rows = (data as AttendanceRow[] | null) || [];
      const existing = rows.length > 0 ? rows[0] : null;
      const nowIso = new Date().toISOString();

      if (!existing) {
        const { error: insertError } = await supabase.from("staff_attendance").insert({
          staff_id: staffId,
          staff_name: staffName,
          work_date: todayJst,
          clock_in: nowIso,
          clock_out: null,
          break_minutes: breakMinutes,
          note,
          regular_minutes: 0,
          overtime_minutes: 0,
          late_night_minutes: 0,
          total_work_minutes: 0,
          updated_at: nowIso,
        });

        if (insertError) throw new Error(insertError.message);
      } else {
        if (existing.clock_in) {
          alert("本日はすでに出勤済みです。");
          await loadTodayAttendance(staffId);
          return;
        }

        const { error: updateError } = await supabase
          .from("staff_attendance")
          .update({
            staff_name: staffName,
            clock_in: nowIso,
            break_minutes: breakMinutes,
            note,
            updated_at: nowIso,
          })
          .eq("id", existing.id);

        if (updateError) throw new Error(updateError.message);
      }

      await loadTodayAttendance(staffId);
      await loadMonthAttendance(staffId);
      alert("出勤を記録しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "出勤登録に失敗しました。";
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleClockOut() {
    if (!supabase) {
      alert("Supabaseの環境変数が未設定です。");
      return;
    }

    if (!staffId || !staffName) {
      alert("先にスタッフ名を保存してください。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const { data, error: fetchError } = await supabase
        .from("staff_attendance")
        .select("*")
        .eq("staff_id", staffId)
        .eq("work_date", todayJst)
        .order("id", { ascending: false })
        .limit(1);

      if (fetchError) throw new Error(fetchError.message);

      const rows = (data as AttendanceRow[] | null) || [];
      const existing = rows.length > 0 ? rows[0] : null;

      if (!existing || !existing.clock_in) {
        alert("先に出勤してください。");
        return;
      }

      if (existing.clock_out) {
        alert("本日はすでに退勤済みです。");
        return;
      }

      const nowIso = new Date().toISOString();
      const totalMinutes = calcTotalMinutes(existing.clock_in, nowIso, breakMinutes);
      const overtimeMinutes = calcOvertimeMinutes(totalMinutes);
      const lateNightMinutes = calcLateNightMinutes(existing.clock_in, nowIso);
      const regularMinutes = Math.max(0, totalMinutes - overtimeMinutes);

      const { error: updateError } = await supabase
        .from("staff_attendance")
        .update({
          staff_name: staffName,
          clock_out: nowIso,
          break_minutes: breakMinutes,
          note,
          total_work_minutes: totalMinutes,
          overtime_minutes: overtimeMinutes,
          late_night_minutes: lateNightMinutes,
          regular_minutes: regularMinutes,
          updated_at: nowIso,
        })
        .eq("id", existing.id);

      if (updateError) throw new Error(updateError.message);

      await loadTodayAttendance(staffId);
      await loadMonthAttendance(staffId);
      alert("退勤を記録しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "退勤登録に失敗しました。";
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMemo() {
    if (!supabase) {
      alert("Supabaseの環境変数が未設定です。");
      return;
    }

    if (!todayRow?.id) {
      alert("まだ本日の勤怠データがありません。先に出勤してください。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const updatePayload: Record<string, any> = {
        break_minutes: breakMinutes,
        note,
        updated_at: new Date().toISOString(),
      };

      if (todayRow.clock_in && todayRow.clock_out) {
        const totalMinutes = calcTotalMinutes(todayRow.clock_in, todayRow.clock_out, breakMinutes);
        const overtimeMinutes = calcOvertimeMinutes(totalMinutes);
        const lateNightMinutes = calcLateNightMinutes(todayRow.clock_in, todayRow.clock_out);
        const regularMinutes = Math.max(0, totalMinutes - overtimeMinutes);

        updatePayload.total_work_minutes = totalMinutes;
        updatePayload.overtime_minutes = overtimeMinutes;
        updatePayload.late_night_minutes = lateNightMinutes;
        updatePayload.regular_minutes = regularMinutes;
      }

      const { error } = await supabase
        .from("staff_attendance")
        .update(updatePayload)
        .eq("id", todayRow.id);

      if (error) throw new Error(error.message);

      await loadTodayAttendance(staffId);
      await loadMonthAttendance(staffId);
      alert("休憩・備考を保存しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "保存に失敗しました。";
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  const monthSummary = useMemo(() => {
    return monthRows.reduce(
      (acc, row) => {
        acc.workDays += row.clock_in ? 1 : 0;
        acc.totalMinutes += Number(row.total_work_minutes || 0);
        acc.regularMinutes += Number(row.regular_minutes || 0);
        acc.overtimeMinutes += Number(row.overtime_minutes || 0);
        acc.lateNightMinutes += Number(row.late_night_minutes || 0);
        return acc;
      },
      {
        workDays: 0,
        totalMinutes: 0,
        regularMinutes: 0,
        overtimeMinutes: 0,
        lateNightMinutes: 0,
      }
    );
  }, [monthRows]);

  const salarySummary = useMemo(() => {
    const wage = Number(hourlyWage || 0);
    const overtimeMultiplier = Number(overtimeRate || 1.25);
    const lateNightMultiplier = Number(lateNightRate || 1.25);

    const regularPay = (monthSummary.regularMinutes / 60) * wage;
    const overtimePay = (monthSummary.overtimeMinutes / 60) * wage * overtimeMultiplier;
    const lateNightPay = (monthSummary.lateNightMinutes / 60) * wage * lateNightMultiplier;
    const totalPay = regularPay + overtimePay + lateNightPay;

    return {
      regularPay,
      overtimePay,
      lateNightPay,
      totalPay,
    };
  }, [monthSummary, hourlyWage, overtimeRate, lateNightRate]);

  function getStatusLabel() {
    if (!todayRow?.clock_in) return "未出勤";
    if (todayRow.clock_in && !todayRow.clock_out) return "勤務中";
    return "退勤済";
  }

  function getStatusColor() {
    if (!todayRow?.clock_in) return "#f59e0b";
    if (todayRow.clock_in && !todayRow.clock_out) return "#10b981";
    return "#3b82f6";
  }

  function getLiveWorkedMinutes() {
    if (!todayRow?.clock_in) return 0;

    const endSource = todayRow.clock_out
      ? new Date(todayRow.clock_out).getTime()
      : liveNow;
    const startSource = new Date(todayRow.clock_in).getTime();

    if (!Number.isFinite(startSource) || !Number.isFinite(endSource) || endSource <= startSource) {
      return 0;
    }

    const raw = Math.floor((endSource - startSource) / 1000 / 60);
    const total = raw - Math.max(0, breakMinutes);
    return total > 0 ? total : 0;
  }

  const workedMinutes = getLiveWorkedMinutes();

  if (!mounted) return null;

  return (
    <div style={pageStyle}>
      <div style={bgGlowA} />
      <div style={bgGlowB} />

      <div style={containerStyle}>
        <div style={topRowStyle}>
          <Link href="/" style={backLinkStyle}>
            ← ホームへ戻る
          </Link>
          <div style={eyebrowStyle}>STAFF TIMECARD</div>
        </div>

        <div style={heroCardStyle}>
          <div style={heroLeftStyle}>
            <div style={miniLabelStyle}>GYMUP ATTENDANCE</div>
            <h1 style={titleStyle}>スタッフ打刻ページ</h1>
            <p style={descStyle}>
              出勤・退勤・休憩時間を記録し、月ごとの出勤簿を累積表示します。
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
            <Link
              href="/attendance/staff/payslip"
              style={{
                ...topActionLinkStyle,
                width: mobile ? "100%" : "auto",
              }}
            >
              給与明細を見る
            </Link>
            <Link
              href="/attendance/admin"
              style={{
                ...topActionLinkStyle,
                width: mobile ? "100%" : "auto",
              }}
            >
              管理者ページ
            </Link>
          </div>
        </div>

        {errorMessage && <div style={errorBoxStyle}>{errorMessage}</div>}

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
          <div style={filterCardStyle}>
            <div style={labelStyle}>スタッフ名</div>
            <input
              value={inputStaffName}
              onChange={(e) => setInputStaffName(e.target.value)}
              placeholder="例：山口敏雄"
              style={inputStyle}
            />
          </div>

          <div style={filterCardStyle}>
            <div style={labelStyle}>対象月</div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={filterCardStyle}>
            <div style={labelStyle}>休憩時間（分）</div>
            <input
              type="number"
              min={0}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value || 0))}
              style={inputStyle}
            />
          </div>

          <div style={filterCardStyle}>
            <div style={labelStyle}>時給</div>
            <input
              type="number"
              value={hourlyWage}
              onChange={(e) => setHourlyWage(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={filterCardStyle}>
            <div style={labelStyle}>残業倍率</div>
            <input
              type="number"
              step="0.01"
              value={overtimeRate}
              onChange={(e) => setOvertimeRate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={filterCardStyle}>
            <div style={labelStyle}>深夜倍率</div>
            <input
              type="number"
              step="0.01"
              value={lateNightRate}
              onChange={(e) => setLateNightRate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={filterCardStyle}>
          <div style={labelStyle}>備考</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            style={textareaStyle}
            placeholder="遅刻・早退・連絡事項など"
          />
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={handleSaveStaff} style={topActionButtonStyle} disabled={saving}>
              スタッフ保存
            </button>
            <button onClick={handleSaveMemo} style={topActionButtonStyle} disabled={saving || !todayRow}>
              休憩・備考を保存
            </button>
          </div>
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
          <MetricCard label="本日の状態" value={getStatusLabel()} accentColor={getStatusColor()} />
          <MetricCard label="本日の勤務時間" value={minutesToText(workedMinutes)} />
          <MetricCard label="本月出勤日数" value={`${monthSummary.workDays}日`} />
          <MetricCard label="本月総勤務" value={minutesToText(monthSummary.totalMinutes)} />
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
          <MetricCard label="通常勤務" value={minutesToText(monthSummary.regularMinutes)} />
          <MetricCard label="残業時間" value={minutesToText(monthSummary.overtimeMinutes)} />
          <MetricCard label="深夜時間" value={minutesToText(monthSummary.lateNightMinutes)} />
          <MetricCard label="対象月" value={monthLabel(selectedMonth)} />
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
          <MetricCard label="通常賃金" value={formatCurrency(salarySummary.regularPay)} />
          <MetricCard label="残業賃金" value={formatCurrency(salarySummary.overtimePay)} />
          <MetricCard label="深夜賃金" value={formatCurrency(salarySummary.lateNightPay)} />
          <MetricCard label="今月の給与概算" value={formatCurrency(salarySummary.totalPay)} />
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>TODAY TIMECARD</div>
              <h2 style={panelTitleStyle}>本日の打刻</h2>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <MiniInfo label="スタッフ名" value={staffName || "未設定"} />
            <MiniInfo label="勤務日" value={todayJst} />
            <MiniInfo label="出勤" value={formatTimeJP(todayRow?.clock_in)} />
            <MiniInfo label="退勤" value={formatTimeJP(todayRow?.clock_out)} />
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              flexDirection: mobile ? "column" : "row",
            }}
          >
            <button
              onClick={handleClockIn}
              disabled={saving || !staffName || Boolean(todayRow?.clock_in)}
              style={{
                ...primaryButtonStyle,
                width: mobile ? "100%" : "auto",
                opacity: saving || !staffName || Boolean(todayRow?.clock_in) ? 0.55 : 1,
              }}
            >
              出勤する
            </button>

            <button
              onClick={handleClockOut}
              disabled={saving || !staffName || !Boolean(todayRow?.clock_in) || Boolean(todayRow?.clock_out)}
              style={{
                ...secondaryButtonStyle,
                width: mobile ? "100%" : "auto",
                opacity:
                  saving || !staffName || !Boolean(todayRow?.clock_in) || Boolean(todayRow?.clock_out)
                    ? 0.55
                    : 1,
              }}
            >
              退勤する
            </button>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>MONTHLY RECORDS</div>
              <h2 style={panelTitleStyle}>月別出勤簿</h2>
            </div>
          </div>

          {loading ? (
            <div style={loadingStyle}>読み込み中...</div>
          ) : monthRows.length === 0 ? (
            <div style={emptyBoxStyle}>この月の勤怠データはまだありません。</div>
          ) : mobile ? (
            <div style={{ display: "grid", gap: 12 }}>
              {monthRows.map((row) => (
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

                  <div style={noteBoxStyle}>
                    <div style={noteLabelStyle}>備考</div>
                    <div>{row.note || "—"}</div>
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
                    <th style={thStyle}>更新日時</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((row) => (
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
                      <td style={tdStyle}>{formatDateTimeJP(row.updated_at || row.created_at)}</td>
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

function MetricCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string;
  accentColor?: string;
}) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ ...metricValueStyle, color: accentColor || "#0f172a" }}>{value}</div>
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

const topActionLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "10px 16px",
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.82)",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
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

const textareaStyle: CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.82)",
  color: "#0f172a",
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
  resize: "vertical",
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

const primaryButtonStyle: CSSProperties = {
  minHeight: 48,
  border: "none",
  borderRadius: 16,
  background: "linear-gradient(135deg, #ffffff, #eaf1ff)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "0 18px",
  boxShadow: "0 10px 24px rgba(148,163,184,0.15)",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 48,
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: 16,
  background: "rgba(255,255,255,0.84)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "0 18px",
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
  minWidth: 980,
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
  minWidth: 180,
  whiteSpace: "normal",
  lineHeight: 1.6,
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

const recordCardStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 16,
};

const recordDateStyle: CSSProperties = {
  fontSize: 14,
  color: "rgba(15,23,42,0.56)",
  marginBottom: 6,
};

const recordInfoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const noteBoxStyle: CSSProperties = {
  marginTop: 12,
  borderRadius: 16,
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 12,
  fontSize: 13,
  color: "#334155",
  lineHeight: 1.6,
};

const noteLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "rgba(15,23,42,0.46)",
  marginBottom: 6,
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  color: "rgba(15,23,42,0.56)",
  fontSize: 14,
  padding: "16px 0",
};