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
};

type StaffMasterRow = {
  staff_id: string;
  staff_name: string;
};

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

function formatTime(dateString?: string | null) {
  if (!dateString) return "--:--";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function minutesToText(minutes: number) {
  const safe = Math.max(0, Math.floor(minutes));
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

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;

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

function makeStaffIdFromName(name: string) {
  return `staff_${name.trim().replace(/\s+/g, "_")}`;
}

export default function AttendanceStaffPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [inputStaffName, setInputStaffName] = useState("");

  const [todayRow, setTodayRow] = useState<AttendanceRow | null>(null);
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [note, setNote] = useState("");
  const [liveNow, setLiveNow] = useState(Date.now());

  const todayJst = formatJstDate(getJstNow());

  useEffect(() => {
    setMounted(true);

    const savedStaffId = localStorage.getItem("gymup_current_staff_id") || "";
    const savedStaffName = localStorage.getItem("gymup_current_staff_name") || "";

    if (savedStaffId && savedStaffName) {
      setStaffId(savedStaffId);
      setStaffName(savedStaffName);
      setInputStaffName(savedStaffName);
    } else if (savedStaffName) {
      const generated = makeStaffIdFromName(savedStaffName);
      setStaffId(generated);
      setStaffName(savedStaffName);
      setInputStaffName(savedStaffName);
      localStorage.setItem("gymup_current_staff_id", generated);
    }

    const timer = window.setInterval(() => {
      setLiveNow(Date.now());
    }, 1000 * 30);

    return () => window.clearInterval(timer);
  }, []);

  async function ensureStaffMaster(clientStaffId: string, clientStaffName: string) {
    if (!supabase) return;

    const { data: exists, error: checkError } = await supabase
      .from("staff_master")
      .select("staff_id, staff_name")
      .eq("staff_id", clientStaffId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`スタッフ確認エラー: ${checkError.message}`);
    }

    if (!exists) {
      const { error: insertError } = await supabase.from("staff_master").insert({
        staff_id: clientStaffId,
        staff_name: clientStaffName,
      });

      if (insertError) {
        throw new Error(`スタッフ登録エラー: ${insertError.message}`);
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
      .maybeSingle();

    if (error) {
      throw new Error(`勤怠取得エラー: ${error.message}`);
    }

    const row = (data as AttendanceRow | null) || null;
    setTodayRow(row);
    setBreakMinutes(row?.break_minutes ?? 60);
    setNote(row?.note ?? "");
  }

  useEffect(() => {
    async function init() {
      if (!mounted) return;

      if (!supabase) {
        setLoading(false);
        return;
      }

      if (!staffId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await ensureStaffMaster(staffId, staffName || inputStaffName || "スタッフ");
        await loadTodayAttendance(staffId);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "初期化に失敗しました。";
        alert(msg);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [mounted, supabase, staffId, staffName, inputStaffName, todayJst]);

  function getStatusLabel() {
    if (!todayRow?.clock_in) return "未出勤";
    if (todayRow.clock_in && !todayRow.clock_out) return "勤務中";
    return "退勤済";
  }

  function getStatusColor() {
    if (!todayRow?.clock_in) return "#f6c45d";
    if (todayRow.clock_in && !todayRow.clock_out) return "#6ee7b7";
    return "#93c5fd";
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
  const overtimeMinutes = calcOvertimeMinutes(workedMinutes);
  const lateNightMinutes = todayRow?.clock_out
    ? calcLateNightMinutes(todayRow.clock_in, todayRow.clock_out)
    : 0;

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
      await ensureStaffMaster(generatedId, name);
      await loadTodayAttendance(generatedId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "スタッフ保存に失敗しました。";
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
      alert("先にスタッフ名を登録してください。");
      return;
    }

    try {
      setSaving(true);

      await ensureStaffMaster(staffId, staffName);

      const { data: existing, error: existingError } = await supabase
        .from("staff_attendance")
        .select("*")
        .eq("staff_id", staffId)
        .eq("work_date", todayJst)
        .maybeSingle();

      if (existingError) {
        throw new Error(`出勤前チェックエラー: ${existingError.message}`);
      }

      const nowIso = new Date().toISOString();

      if (!existing) {
        const { error: insertError } = await supabase.from("staff_attendance").insert({
          staff_id: staffId,
          staff_name: staffName,
          work_date: todayJst,
          clock_in: nowIso,
          break_minutes: breakMinutes,
          note,
          regular_minutes: 0,
          overtime_minutes: 0,
          late_night_minutes: 0,
          total_work_minutes: 0,
        });

        if (insertError) {
          throw new Error(`出勤登録エラー: ${insertError.message}`);
        }
      } else {
        const { error: updateError } = await supabase
          .from("staff_attendance")
          .update({
            staff_name: staffName,
            clock_in: existing.clock_in || nowIso,
            break_minutes: breakMinutes,
            note,
          })
          .eq("id", existing.id);

        if (updateError) {
          throw new Error(`出勤更新エラー: ${updateError.message}`);
        }
      }

      await loadTodayAttendance(staffId);
      alert("出勤を記録しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "出勤登録に失敗しました。";
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
      alert("先にスタッフ名を登録してください。");
      return;
    }

    try {
      setSaving(true);

      const { data: existing, error: fetchError } = await supabase
        .from("staff_attendance")
        .select("*")
        .eq("staff_id", staffId)
        .eq("work_date", todayJst)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`退勤前取得エラー: ${fetchError.message}`);
      }

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
      const overtime = calcOvertimeMinutes(totalMinutes);
      const lateNight = calcLateNightMinutes(existing.clock_in, nowIso);
      const regular = Math.max(0, totalMinutes - overtime);

      const { error: updateError } = await supabase
        .from("staff_attendance")
        .update({
          staff_name: staffName,
          clock_out: nowIso,
          break_minutes: breakMinutes,
          note,
          total_work_minutes: totalMinutes,
          overtime_minutes: overtime,
          late_night_minutes: lateNight,
          regular_minutes: regular,
        })
        .eq("id", existing.id);

      if (updateError) {
        throw new Error(`退勤更新エラー: ${updateError.message}`);
      }

      await loadTodayAttendance(staffId);
      alert("退勤を記録しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "退勤登録に失敗しました。";
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

      const { error } = await supabase
        .from("staff_attendance")
        .update({
          break_minutes: breakMinutes,
          note,
        })
        .eq("id", todayRow.id);

      if (error) {
        throw new Error(`保存エラー: ${error.message}`);
      }

      await loadTodayAttendance(staffId);
      alert("休憩・備考を保存しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "保存に失敗しました。";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

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
            <h1 style={titleStyle}>スタッフ出勤簿</h1>
            <p style={descStyle}>
              出勤・退勤・勤務時間・残業時間を、Supabaseで日別に記録します。
            </p>
          </div>

          <div style={statusWrapStyle}>
            <div
              style={{
                ...statusBadgeStyle,
                borderColor: `${getStatusColor()}66`,
                color: getStatusColor(),
              }}
            >
              {getStatusLabel()}
            </div>
            <div style={todayStyle}>対象日：{todayJst}</div>
          </div>
        </div>

        {!supabase && (
          <div style={errorBoxStyle}>
            NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。
          </div>
        )}

        <div style={gridStyle}>
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={panelMiniStyle}>STAFF</div>
                <h2 style={panelTitleStyle}>スタッフ情報</h2>
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>スタッフ名</label>
              <input
                value={inputStaffName}
                onChange={(e) => setInputStaffName(e.target.value)}
                placeholder="例：山口敏雄"
                style={inputStyle}
              />
            </div>

            <div style={staffInfoBoxStyle}>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>現在のスタッフ</span>
                <span style={infoValueStyle}>{staffName || "未設定"}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>スタッフID</span>
                <span style={infoValueStyle}>{staffId || "-"}</span>
              </div>
            </div>

            <button onClick={handleSaveStaff} disabled={saving} style={primaryButtonStyle}>
              {saving ? "保存中..." : "スタッフを保存"}
            </button>
          </div>

          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={panelMiniStyle}>TODAY</div>
                <h2 style={panelTitleStyle}>本日の打刻</h2>
              </div>
            </div>

            <div style={summaryGridStyle}>
              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>出勤時刻</div>
                <div style={summaryValueStyle}>{formatTime(todayRow?.clock_in)}</div>
              </div>
              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>退勤時刻</div>
                <div style={summaryValueStyle}>{formatTime(todayRow?.clock_out)}</div>
              </div>
            </div>

            <div style={actionRowStyle}>
              <button
                onClick={handleClockIn}
                disabled={saving || !staffName || Boolean(todayRow?.clock_in)}
                style={{
                  ...actionButtonStyle,
                  ...(saving || !staffName || Boolean(todayRow?.clock_in)
                    ? disabledButtonStyle
                    : clockInButtonStyle),
                }}
              >
                出勤する
              </button>

              <button
                onClick={handleClockOut}
                disabled={
                  saving || !staffName || !Boolean(todayRow?.clock_in) || Boolean(todayRow?.clock_out)
                }
                style={{
                  ...actionButtonStyle,
                  ...(saving || !staffName || !Boolean(todayRow?.clock_in) || Boolean(todayRow?.clock_out)
                    ? disabledButtonStyle
                    : clockOutButtonStyle),
                }}
              >
                退勤する
              </button>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>休憩時間（分）</label>
              <input
                type="number"
                min={0}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value || 0))}
                style={inputStyle}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>備考</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="遅刻・早退・引き継ぎ事項など"
                style={textareaStyle}
              />
            </div>

            <button onClick={handleSaveMemo} disabled={saving || !todayRow?.id} style={secondaryButtonStyle}>
              休憩・備考を保存
            </button>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>WORK SUMMARY</div>
              <h2 style={panelTitleStyle}>本日の勤務状況</h2>
            </div>
          </div>

          <div style={summaryGridLargeStyle}>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>勤務時間</div>
              <div style={metricValueStyle}>{minutesToText(workedMinutes)}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>残業時間</div>
              <div style={metricValueStyle}>{minutesToText(overtimeMinutes)}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>深夜時間</div>
              <div style={metricValueStyle}>
                {minutesToText(todayRow?.clock_out ? (todayRow.late_night_minutes ?? 0) : lateNightMinutes)}
              </div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>最終更新</div>
              <div style={metricValueSmallStyle}>
                {todayRow ? formatDateTime(todayRow.updated_at as unknown as string) : "-"}
              </div>
            </div>
          </div>

          <div style={detailBoxStyle}>
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>通常勤務</span>
              <span style={detailValueStyle}>
                {minutesToText(todayRow?.clock_out ? (todayRow.regular_minutes ?? 0) : Math.max(0, workedMinutes - overtimeMinutes))}
              </span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>総勤務時間</span>
              <span style={detailValueStyle}>
                {minutesToText(todayRow?.clock_out ? (todayRow.total_work_minutes ?? 0) : workedMinutes)}
              </span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>状態</span>
              <span style={{ ...detailValueStyle, color: getStatusColor() }}>{getStatusLabel()}</span>
            </div>
          </div>
        </div>

        {loading && <div style={loadingStyle}>読み込み中...</div>}
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #0d1117 0%, #111827 35%, #161f2c 65%, #0f172a 100%)",
  position: "relative",
  overflow: "hidden",
};

const bgGlowA: CSSProperties = {
  position: "absolute",
  top: -140,
  left: -120,
  width: 380,
  height: 380,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 70%)",
  pointerEvents: "none",
};

const bgGlowB: CSSProperties = {
  position: "absolute",
  right: -100,
  top: 120,
  width: 300,
  height: 300,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(147,197,253,0.10) 0%, rgba(147,197,253,0) 70%)",
  pointerEvents: "none",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 1180,
  margin: "0 auto",
  padding: "28px 18px 60px",
};

const topRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  color: "rgba(255,255,255,0.84)",
  textDecoration: "none",
  fontSize: 14,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(255,255,255,0.52)",
};

const heroCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap",
  background: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06))",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 28,
  padding: "24px 22px",
  marginBottom: 20,
};

const heroLeftStyle: CSSProperties = {
  flex: 1,
  minWidth: 260,
};

const miniLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(255,255,255,0.58)",
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 42px)",
  lineHeight: 1.1,
  color: "#ffffff",
  fontWeight: 800,
};

const descStyle: CSSProperties = {
  margin: "12px 0 0",
  fontSize: 14,
  lineHeight: 1.8,
  color: "rgba(255,255,255,0.72)",
};

const statusWrapStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 10,
  minWidth: 180,
};

const statusBadgeStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 9999,
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.05)",
  fontWeight: 700,
  fontSize: 14,
};

const todayStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontSize: 13,
};

const errorBoxStyle: CSSProperties = {
  marginBottom: 20,
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.28)",
  color: "#fecaca",
  fontSize: 14,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
  marginBottom: 18,
};

const panelStyle: CSSProperties = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 26,
  padding: 20,
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const panelMiniStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.22em",
  color: "rgba(255,255,255,0.52)",
  marginBottom: 6,
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#ffffff",
  fontWeight: 700,
};

const fieldGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginBottom: 14,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.78)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  padding: "0 14px",
  outline: "none",
  fontSize: 14,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
  resize: "vertical",
};

const staffInfoBoxStyle: CSSProperties = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 14,
  marginBottom: 14,
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "6px 0",
};

const infoLabelStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.58)",
};

const infoValueStyle: CSSProperties = {
  fontSize: 13,
  color: "#ffffff",
  fontWeight: 600,
  textAlign: "right",
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  height: 50,
  border: "none",
  borderRadius: 16,
  background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(226,232,240,0.86))",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  height: 48,
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 16,
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 14,
};

const summaryCardStyle: CSSProperties = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "14px 14px",
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.54)",
  marginBottom: 6,
};

const summaryValueStyle: CSSProperties = {
  fontSize: 24,
  color: "#ffffff",
  fontWeight: 700,
};

const actionRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 14,
};

const actionButtonStyle: CSSProperties = {
  height: 52,
  border: "none",
  borderRadius: 18,
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  transition: "transform 0.2s ease, opacity 0.2s ease",
};

const clockInButtonStyle: CSSProperties = {
  background: "linear-gradient(135deg, #34d399, #10b981)",
  color: "#052e25",
};

const clockOutButtonStyle: CSSProperties = {
  background: "linear-gradient(135deg, #93c5fd, #60a5fa)",
  color: "#0b1f3a",
};

const disabledButtonStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.36)",
  cursor: "not-allowed",
};

const summaryGridLargeStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginBottom: 16,
};

const metricCardStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "16px 16px",
};

const metricLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.54)",
  marginBottom: 8,
};

const metricValueStyle: CSSProperties = {
  fontSize: 28,
  color: "#ffffff",
  fontWeight: 800,
  letterSpacing: "-0.03em",
};

const metricValueSmallStyle: CSSProperties = {
  fontSize: 15,
  color: "#ffffff",
  fontWeight: 700,
  lineHeight: 1.5,
};

const detailBoxStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 14,
};

const detailRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const detailLabelStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.60)",
};

const detailValueStyle: CSSProperties = {
  fontSize: 14,
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "right",
};

const loadingStyle: CSSProperties = {
  marginTop: 18,
  fontSize: 14,
  color: "rgba(255,255,255,0.72)",
};