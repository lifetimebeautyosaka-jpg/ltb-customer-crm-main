"use client";

import Link from "next/link";
import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react";
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

  const startText = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(start.getDate()).padStart(2, "0")}`;

  const endText = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(end.getDate()).padStart(2, "0")}`;

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

function calcTotalMinutes(clockIn?: string | null, clockOut?: string | null, breakMinutes = 0) {
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

    total += overlapMinutes(start.getTime(), end.getTime(), lateNightStart, lateNightEnd);
    cursor.setDate(cursor.getDate() + 1);
  }

  return Math.max(0, total);
}

function monthLabel(month: string) {
  if (!month) return "—";
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

export default function AttendanceStaffPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [staffList, setStaffList] = useState<StaffMasterRow[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [staffName, setStaffName] = useState("");

  const [todayRow, setTodayRow] = useState<AttendanceRow | null>(null);
  const [monthRows, setMonthRows] = useState<AttendanceRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());

  const [breakMinutes, setBreakMinutes] = useState(30);
  const [note, setNote] = useState("");
  const [liveNow, setLiveNow] = useState(Date.now());

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
      localStorage.getItem("gymup_logged_in") || localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    const timer = window.setInterval(() => {
      setLiveNow(Date.now());
    }, 1000 * 30);

    return () => window.clearInterval(timer);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    void initBase();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (!selectedStaffId) {
      setTodayRow(null);
      setMonthRows([]);
      setLoading(false);
      return;
    }
    void loadStaffAttendance(selectedStaffId);
  }, [mounted, selectedStaffId, selectedMonth]);

  const mobile = windowWidth < 768;

  async function loadStaffMaster() {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("staff_master")
      .select("id, staff_id, staff_name, is_active")
      .eq("is_active", true)
      .order("staff_name", { ascending: true });

    if (error) {
      if (error.message.includes("schema cache")) {
        throw new Error("staff_master テーブルが未作成です。SupabaseのSQLを先に実行してください。");
      }
      throw new Error(error.message);
    }

    return ((data as StaffMasterRow[] | null) || []).filter((row) => row.staff_id && row.staff_name);
  }

  async function initBase() {
    if (!supabase) {
      setErrorMessage("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const list = await loadStaffMaster();
      setStaffList(list);

      const savedStaffId = localStorage.getItem("gymup_current_staff_id") || "";
      const matchedSaved = list.find((row) => row.staff_id === savedStaffId);

      if (matchedSaved) {
        setSelectedStaffId(matchedSaved.staff_id);
        setStaffName(matchedSaved.staff_name);
      } else if (list.length > 0) {
        setSelectedStaffId(list[0].staff_id);
        setStaffName(list[0].staff_name);
        localStorage.setItem("gymup_current_staff_id", list[0].staff_id);
        localStorage.setItem("gymup_current_staff_name", list[0].staff_name);
      } else {
        setSelectedStaffId("");
        setStaffName("");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "初期化に失敗しました。";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
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
    setBreakMinutes(row?.break_minutes ?? 30);
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

  async function loadStaffAttendance(clientStaffId: string) {
    const matched = staffList.find((row) => row.staff_id === clientStaffId);
    setStaffName(matched?.staff_name || "");

    if (!supabase) {
      setErrorMessage("Supabaseの環境変数が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      await loadTodayAttendance(clientStaffId);
      await loadMonthAttendance(clientStaffId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "勤怠読み込みに失敗しました。";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectStaff(nextStaffId: string) {
    const matched = staffList.find((row) => row.staff_id === nextStaffId);
    setSelectedStaffId(nextStaffId);
    setStaffName(matched?.staff_name || "");
    localStorage.setItem("gymup_current_staff_id", nextStaffId);
    localStorage.setItem("gymup_current_staff_name", matched?.staff_name || "");
  }

  async function handleClockIn() {
    if (!supabase) {
      alert("Supabaseの環境変数が未設定です。");
      return;
    }

    if (!selectedStaffId || !staffName) {
      alert("先にスタッフを選択してください。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const { data, error: existingError } = await supabase
        .from("staff_attendance")
        .select("*")
        .eq("staff_id", selectedStaffId)
        .eq("work_date", todayJst)
        .order("id", { ascending: false })
        .limit(1);

      if (existingError) throw new Error(existingError.message);

      const rows = (data as AttendanceRow[] | null) || [];
      const existing = rows.length > 0 ? rows[0] : null;
      const nowIso = new Date().toISOString();

      if (!existing) {
        const { error: insertError } = await supabase.from("staff_attendance").insert({
          staff_id: selectedStaffId,
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
          await loadTodayAttendance(selectedStaffId);
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

      await loadTodayAttendance(selectedStaffId);
      await loadMonthAttendance(selectedStaffId);
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

    if (!selectedStaffId || !staffName) {
      alert("先にスタッフを選択してください。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const { data, error: fetchError } = await supabase
        .from("staff_attendance")
        .select("*")
        .eq("staff_id", selectedStaffId)
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

      await loadTodayAttendance(selectedStaffId);
      await loadMonthAttendance(selectedStaffId);
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

    if (!selectedStaffId) {
      alert("先にスタッフを選択してください。");
      return;
    }

    if (!todayRow?.id) {
      alert("まだ本日の勤怠データがありません。先に出勤してください。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const updatePayload: Record<string, unknown> = {
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

      await loadTodayAttendance(selectedStaffId);
      await loadMonthAttendance(selectedStaffId);
      alert("休憩・メモを保存しました。");
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

  function getStatusLabel() {
    if (!todayRow?.clock_in) return "未出勤";
    if (todayRow.clock_in && !todayRow.clock_out) return "勤務中";
    return "退勤済";
  }

  function getStatusTone() {
    if (!todayRow?.clock_in) return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    if (todayRow.clock_in && !todayRow.clock_out) {
      return { color: "#10b981", bg: "rgba(16,185,129,0.12)" };
    }
    return { color: "#2563eb", bg: "rgba(37,99,235,0.12)" };
  }

  function getLiveWorkedMinutes() {
    if (!todayRow?.clock_in) return 0;

    const endSource = todayRow.clock_out ? new Date(todayRow.clock_out).getTime() : liveNow;
    const startSource = new Date(todayRow.clock_in).getTime();

    if (!Number.isFinite(startSource) || !Number.isFinite(endSource) || endSource <= startSource) {
      return 0;
    }

    const raw = Math.floor((endSource - startSource) / 1000 / 60);
    const total = raw - Math.max(0, breakMinutes);
    return total > 0 ? total : 0;
  }

  const workedMinutes = getLiveWorkedMinutes();
  const statusTone = getStatusTone();

  if (!mounted) return null;

  return (
    <main style={pageStyle}>
      <style>{responsiveStyle}</style>

      <div style={bgGlowTop} />
      <div style={bgGlowLeft} />
      <div style={bgGlowRight} />
      <div style={noiseStyle} />

      <div style={containerStyle}>
        <div style={topBarStyle}>
          <div style={topLinkGroupStyle}>
            <Link href="/dashboard" style={mainBackLinkStyle}>
              ← ダッシュボードへ
            </Link>
            <Link href="/attendance" style={subBackLinkStyle}>
              勤怠トップへ
            </Link>
          </div>

          <div style={eyebrowStyle}>STAFF TIMECARD</div>
        </div>

        <section style={heroCardStyle} className="attendance-hero-grid">
          <div style={heroLeftStyle} className="attendance-hero-left">
            <div style={miniLabelStyle}>GYMUP ATTENDANCE</div>
            <h1 style={titleStyle}>スタッフ打刻ページ</h1>
            <p style={descStyle}>
              自分の名前を選んで、
              <br className="attendance-pc-break" />
              出勤・退勤・休憩・メモを入力する専用ページです。
            </p>

            <div style={heroButtonRowStyle} className="attendance-button-row">
              <button
                onClick={handleClockIn}
                disabled={saving || !staffName || Boolean(todayRow?.clock_in)}
                style={{
                  ...primaryButtonStyle,
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

          <div style={heroRightStyle}>
            <div style={statusCardStyle}>
              <div style={statusCardLabelStyle}>TODAY STATUS</div>

              <div
                style={{
                  ...statusPillStyle,
                  color: statusTone.color,
                  background: statusTone.bg,
                  borderColor: statusTone.bg,
                }}
              >
                {getStatusLabel()}
              </div>

              <div style={statusMetaGridStyle}>
                <MiniInfo label="スタッフ名" value={staffName || "未選択"} />
                <MiniInfo label="勤務日" value={todayJst} />
                <MiniInfo label="出勤" value={formatTimeJP(todayRow?.clock_in)} />
                <MiniInfo label="退勤" value={formatTimeJP(todayRow?.clock_out)} />
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? <div style={errorBoxStyle}>{errorMessage}</div> : null}

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionMiniStyle}>STAFF SETTINGS</div>
              <h2 style={sectionTitleStyle}>スタッフ選択・今日の入力</h2>
            </div>
          </div>

          <div style={formGridStyle} className="attendance-settings-grid">
            <FieldCard label="スタッフ名">
              <select
                value={selectedStaffId}
                onChange={(e) => handleSelectStaff(e.target.value)}
                style={inputStyle}
              >
                <option value="">スタッフを選択</option>
                {staffList.map((staff) => (
                  <option key={staff.staff_id} value={staff.staff_id}>
                    {staff.staff_name}
                  </option>
                ))}
              </select>
            </FieldCard>

            <FieldCard label="対象月">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={inputStyle}
              />
            </FieldCard>

            <FieldCard label="休憩時間">
              <div style={breakButtonRowStyle}>
                <button
                  type="button"
                  onClick={() => setBreakMinutes(30)}
                  style={{
                    ...breakButtonStyle,
                    ...(breakMinutes === 30 ? breakButtonActiveStyle : {}),
                  }}
                >
                  30分
                </button>

                <button
                  type="button"
                  onClick={() => setBreakMinutes(60)}
                  style={{
                    ...breakButtonStyle,
                    ...(breakMinutes === 60 ? breakButtonActiveStyle : {}),
                  }}
                >
                  60分
                </button>
              </div>
            </FieldCard>
          </div>

          <div style={{ marginTop: 16 }}>
            <FieldCard label="今日のメモ">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                style={textareaStyle}
                placeholder="遅刻・早退・連絡事項など"
              />
            </FieldCard>
          </div>

          <div style={actionRowStyle} className="attendance-button-row">
            <button
              onClick={handleSaveMemo}
              style={secondaryButtonStyle}
              disabled={saving || !todayRow}
            >
              休憩・メモを保存
            </button>
          </div>
        </section>

        <section style={metricGridStyle} className="attendance-metrics-grid four">
          <MetricCard label="本日の状態" value={getStatusLabel()} accentColor={statusTone.color} />
          <MetricCard label="本日の勤務時間" value={minutesToText(workedMinutes)} />
          <MetricCard label="今月出勤日数" value={`${monthSummary.workDays}日`} />
          <MetricCard label="対象月" value={monthLabel(selectedMonth)} />
        </section>

        <section style={metricGridStyle} className="attendance-metrics-grid four">
          <MetricCard label="今月総勤務" value={minutesToText(monthSummary.totalMinutes)} />
          <MetricCard label="通常勤務" value={minutesToText(monthSummary.regularMinutes)} />
          <MetricCard label="残業時間" value={minutesToText(monthSummary.overtimeMinutes)} />
          <MetricCard label="深夜時間" value={minutesToText(monthSummary.lateNightMinutes)} />
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionMiniStyle}>TODAY TIMECARD</div>
              <h2 style={sectionTitleStyle}>本日の打刻状況</h2>
            </div>
          </div>

          <div style={miniInfoGridStyle} className="attendance-miniinfo-grid">
            <MiniInfo label="スタッフ名" value={staffName || "未選択"} />
            <MiniInfo label="勤務日" value={todayJst} />
            <MiniInfo label="出勤" value={formatTimeJP(todayRow?.clock_in)} />
            <MiniInfo label="退勤" value={formatTimeJP(todayRow?.clock_out)} />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionMiniStyle}>MONTHLY RECORDS</div>
              <h2 style={sectionTitleStyle}>今月の自分の勤怠一覧</h2>
            </div>
          </div>

          {loading ? (
            <div style={loadingStyle}>読み込み中...</div>
          ) : !selectedStaffId ? (
            <div style={emptyBoxStyle}>先にスタッフを選択してください。</div>
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
                    <MiniInfo
                      label="更新日時"
                      value={formatDateTimeJP(row.updated_at || row.created_at)}
                    />
                  </div>

                  <div style={noteBoxStyle}>
                    <div style={noteLabelStyle}>メモ</div>
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
                    <th style={thStyle}>メモ</th>
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
        </section>
      </div>
    </main>
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
    <div style={metricCardStyle} className="attendance-metric-card">
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

function FieldCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={fieldCardStyle}>
      <div style={fieldLabelStyle}>{label}</div>
      {children}
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, #eef4ff 0%, #f8fbff 30%, #f3f7ff 65%, #eef2ff 100%)",
  padding: "24px 16px 60px",
};

const bgGlowTop: CSSProperties = {
  position: "absolute",
  top: -120,
  left: "50%",
  transform: "translateX(-50%)",
  width: 520,
  height: 280,
  background:
    "radial-gradient(circle, rgba(147,197,253,0.22) 0%, rgba(147,197,253,0.02) 45%, rgba(147,197,253,0) 72%)",
  pointerEvents: "none",
  filter: "blur(14px)",
};

const bgGlowLeft: CSSProperties = {
  position: "absolute",
  top: 120,
  left: -120,
  width: 320,
  height: 320,
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(196,181,253,0.18) 0%, rgba(196,181,253,0) 70%)",
  pointerEvents: "none",
  filter: "blur(10px)",
};

const bgGlowRight: CSSProperties = {
  position: "absolute",
  right: -120,
  bottom: 80,
  width: 360,
  height: 360,
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(203,213,225,0.24) 0%, rgba(203,213,225,0) 72%)",
  pointerEvents: "none",
  filter: "blur(20px)",
};

const noiseStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: "radial-gradient(rgba(15,23,42,0.03) 1px, transparent 1px)",
  backgroundSize: "16px 16px",
  opacity: 0.2,
  pointerEvents: "none",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 1280,
  margin: "0 auto",
  display: "grid",
  gap: 18,
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const topLinkGroupStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const mainBackLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
  color: "#1d4ed8",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
};

const subBackLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
  color: "rgba(30,41,59,0.78)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(30,41,59,0.42)",
  fontWeight: 700,
};

const heroCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.08fr) minmax(0, 0.92fr)",
  gap: 18,
  padding: 18,
  borderRadius: 30,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.75)",
  boxShadow: "0 18px 40px rgba(148,163,184,0.14)",
};

const heroLeftStyle: CSSProperties = {
  borderRadius: 24,
  padding: "26px 24px",
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.85)",
  minHeight: 280,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const heroRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
};

const miniLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(30,41,59,0.48)",
  marginBottom: 10,
  fontWeight: 700,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 5vw, 54px)",
  lineHeight: 1.05,
  color: "#0f172a",
  fontWeight: 800,
  letterSpacing: "-0.03em",
};

const descStyle: CSSProperties = {
  margin: "16px 0 0",
  fontSize: 15,
  lineHeight: 1.9,
  color: "rgba(15,23,42,0.68)",
};

const heroButtonRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 24,
};

const statusCardStyle: CSSProperties = {
  width: "100%",
  borderRadius: 24,
  padding: "22px 20px",
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.85)",
  minHeight: 280,
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 14px 34px rgba(148,163,184,0.12)",
};

const statusCardLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "rgba(30,41,59,0.52)",
  marginBottom: 14,
};

const statusPillStyle: CSSProperties = {
  minHeight: 38,
  display: "inline-flex",
  alignItems: "center",
  alignSelf: "flex-start",
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid transparent",
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 18,
};

const statusMetaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginTop: "auto",
};

const errorBoxStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(254,226,226,0.9)",
  border: "1px solid rgba(248,113,113,0.28)",
  color: "#b91c1c",
  fontSize: 14,
};

const panelStyle: CSSProperties = {
  borderRadius: 26,
  padding: 20,
  background: "rgba(255,255,255,0.52)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.76)",
  boxShadow: "0 14px 34px rgba(148,163,184,0.12)",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 16,
};

const sectionMiniStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.22em",
  color: "rgba(30,41,59,0.42)",
  marginBottom: 6,
  fontWeight: 700,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 800,
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
};

const fieldCardStyle: CSSProperties = {
  borderRadius: 22,
  padding: 16,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.88)",
  boxShadow: "0 10px 25px rgba(148,163,184,0.12)",
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(15,23,42,0.78)",
  marginBottom: 8,
  fontWeight: 700,
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

const breakButtonRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const breakButtonStyle: CSSProperties = {
  minWidth: 96,
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.82)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "0 16px",
};

const breakButtonActiveStyle: CSSProperties = {
  background: "linear-gradient(135deg, #ffffff, #eaf1ff)",
  border: "1px solid rgba(96,165,250,0.35)",
  boxShadow: "0 10px 24px rgba(148,163,184,0.15)",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 16,
};

const primaryButtonStyle: CSSProperties = {
  minHeight: 50,
  border: "none",
  borderRadius: 16,
  background: "linear-gradient(135deg, #2563eb, #60a5fa)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  padding: "0 18px",
  boxShadow: "0 12px 28px rgba(37,99,235,0.22)",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 50,
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: 16,
  background: "rgba(255,255,255,0.84)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "0 18px",
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
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
  fontWeight: 700,
};

const metricValueStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.25,
  letterSpacing: "-0.02em",
};

const miniInfoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 0,
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
  lineHeight: 1.6,
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
  color: "#2563eb",
};

const tdNoteStyle: CSSProperties = {
  ...tdStyle,
  minWidth: 180,
  whiteSpace: "normal",
  lineHeight: 1.6,
  color: "#475569",
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
  fontWeight: 700,
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  color: "rgba(15,23,42,0.56)",
  fontSize: 14,
  padding: "16px 0",
};

const responsiveStyle = `
.attendance-hero-grid,
.attendance-button-row,
.attendance-settings-grid,
.attendance-miniinfo-grid,
.attendance-metrics-grid {
  width: 100%;
}

@media (max-width: 1100px) {
  .attendance-hero-grid {
    grid-template-columns: 1fr !important;
  }

  .attendance-settings-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .attendance-metrics-grid.four {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .attendance-miniinfo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 640px) {
  .attendance-pc-break {
    display: none;
  }

  .attendance-hero-grid {
    gap: 14px !important;
    padding: 14px !important;
    border-radius: 22px !important;
  }

  .attendance-hero-left {
    min-height: auto !important;
    padding: 22px 18px !important;
    border-radius: 20px !important;
  }

  .attendance-button-row {
    flex-direction: column !important;
    gap: 10px !important;
  }

  .attendance-settings-grid {
    grid-template-columns: 1fr !important;
  }

  .attendance-metrics-grid.four {
    grid-template-columns: 1fr !important;
  }

  .attendance-miniinfo-grid {
    grid-template-columns: 1fr !important;
  }

  .attendance-metric-card {
    border-radius: 18px !important;
  }
}
`;