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

type Summary = {
  workDays: number;
  totalMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  lateNightMinutes: number;
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

function getCurrentMonthValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
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

function minutesToText(minutes: number) {
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}時間${m}分`;
}

function minutesToHHMM(minutes: number) {
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDateLabel(dateStr?: string | null) {
  if (!dateStr) return "-";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(date);
}

function formatTime(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

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

function toInputDateTimeValue(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function fromInputDateTimeValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
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

function escapeCsvValue(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export default function AttendanceAdminTimecardPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [staffList, setStaffList] = useState<StaffMasterRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [selectedStaffId, setSelectedStaffId] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [editingRow, setEditingRow] = useState<AttendanceRow | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editBreakMinutes, setEditBreakMinutes] = useState(60);
  const [editNote, setEditNote] = useState("");

  async function loadStaffMaster() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("staff_master")
      .select("staff_id, staff_name, is_active")
      .order("staff_name", { ascending: true });

    if (error) {
      if (error.message.includes("schema cache")) {
        throw new Error("staff_master テーブルが未作成です。SupabaseのSQLを先に実行してください。");
      }
      throw new Error(`スタッフ一覧取得エラー: ${error.message}`);
    }

    setStaffList((data as StaffMasterRow[] | null) || []);
  }

  async function loadAttendance() {
    if (!supabase) return;

    const { startText, endText } = getMonthRange(selectedMonth);

    let query = supabase
      .from("staff_attendance")
      .select("*")
      .gte("work_date", startText)
      .lte("work_date", endText)
      .order("work_date", { ascending: false })
      .order("staff_name", { ascending: true });

    if (selectedStaffId !== "all") {
      query = query.eq("staff_id", selectedStaffId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.message.includes("schema cache")) {
        throw new Error("staff_attendance テーブルが未作成です。SupabaseのSQLを先に実行してください。");
      }
      throw new Error(`勤怠一覧取得エラー: ${error.message}`);
    }

    setRows((data as AttendanceRow[] | null) || []);
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
      await loadStaffMaster();
      await loadAttendance();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "読み込みに失敗しました。";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, [selectedMonth, selectedStaffId]);

  const summary = useMemo<Summary>(() => {
    return rows.reduce(
      (acc, row) => {
        acc.workDays += 1;
        acc.totalMinutes += row.total_work_minutes ?? 0;
        acc.regularMinutes += row.regular_minutes ?? 0;
        acc.overtimeMinutes += row.overtime_minutes ?? 0;
        acc.lateNightMinutes += row.late_night_minutes ?? 0;
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
  }, [rows]);

  function openEditModal(row: AttendanceRow) {
    setEditingRow(row);
    setEditClockIn(toInputDateTimeValue(row.clock_in));
    setEditClockOut(toInputDateTimeValue(row.clock_out));
    setEditBreakMinutes(row.break_minutes ?? 60);
    setEditNote(row.note ?? "");
  }

  function closeEditModal() {
    setEditingRow(null);
    setEditClockIn("");
    setEditClockOut("");
    setEditBreakMinutes(60);
    setEditNote("");
  }

  async function handleSaveEdit() {
    if (!supabase || !editingRow) return;

    const nextClockIn = fromInputDateTimeValue(editClockIn);
    const nextClockOut = fromInputDateTimeValue(editClockOut);
    const nextBreakMinutes = Math.max(0, Number(editBreakMinutes || 0));

    if (!nextClockIn) {
      alert("出勤時刻を入力してください。");
      return;
    }

    if (nextClockOut && new Date(nextClockOut).getTime() <= new Date(nextClockIn).getTime()) {
      alert("退勤時刻は出勤時刻より後にしてください。");
      return;
    }

    const totalMinutes = calcTotalMinutes(nextClockIn, nextClockOut, nextBreakMinutes);
    const overtimeMinutes = calcOvertimeMinutes(totalMinutes);
    const lateNightMinutes = calcLateNightMinutes(nextClockIn, nextClockOut);
    const regularMinutes = Math.max(0, totalMinutes - overtimeMinutes);

    try {
      setSaving(true);

      const { error } = await supabase
        .from("staff_attendance")
        .update({
          clock_in: nextClockIn,
          clock_out: nextClockOut,
          break_minutes: nextBreakMinutes,
          note: editNote,
          total_work_minutes: totalMinutes,
          overtime_minutes: overtimeMinutes,
          late_night_minutes: lateNightMinutes,
          regular_minutes: regularMinutes,
        })
        .eq("id", editingRow.id);

      if (error) {
        throw new Error(`更新エラー: ${error.message}`);
      }

      await loadAttendance();
      closeEditModal();
      alert("勤怠を更新しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "更新に失敗しました。";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadCsv() {
    const header = [
      "勤務日",
      "スタッフ名",
      "スタッフID",
      "出勤",
      "退勤",
      "休憩分",
      "通常勤務",
      "残業",
      "深夜",
      "総勤務",
      "備考",
      "最終更新",
    ];

    const lines = [
      header.join(","),
      ...rows.map((row) =>
        [
          escapeCsvValue(row.work_date),
          escapeCsvValue(row.staff_name),
          escapeCsvValue(row.staff_id),
          escapeCsvValue(formatTime(row.clock_in)),
          escapeCsvValue(formatTime(row.clock_out)),
          escapeCsvValue(row.break_minutes ?? 0),
          escapeCsvValue(minutesToHHMM(row.regular_minutes ?? 0)),
          escapeCsvValue(minutesToHHMM(row.overtime_minutes ?? 0)),
          escapeCsvValue(minutesToHHMM(row.late_night_minutes ?? 0)),
          escapeCsvValue(minutesToHHMM(row.total_work_minutes ?? 0)),
          escapeCsvValue(row.note ?? ""),
          escapeCsvValue(formatDateTime(row.updated_at)),
        ].join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `gymup_timecard_${selectedMonth}_${selectedStaffId === "all" ? "all" : selectedStaffId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={pageStyle}>
      <div style={bgGlowA} />
      <div style={bgGlowB} />

      <div style={containerStyle}>
        <div style={topRowStyle}>
          <Link href="/" style={backLinkStyle}>
            ← ホームへ戻る
          </Link>
          <div style={eyebrowStyle}>ADMIN TIMECARD</div>
        </div>

        <div style={heroCardStyle}>
          <div style={heroLeftStyle}>
            <div style={miniLabelStyle}>GYMUP ATTENDANCE</div>
            <h1 style={titleStyle}>勤怠管理</h1>
            <p style={descStyle}>
              月別・スタッフ別で出勤簿を確認し、修正とCSV出力まで行えます。
            </p>
          </div>

          <div style={heroRightStyle}>
            <button onClick={handleDownloadCsv} style={primaryButtonSmallStyle} disabled={rows.length === 0}>
              CSV出力
            </button>
          </div>
        </div>

        {errorMessage && <div style={errorBoxStyle}>{errorMessage}</div>}

        <div style={filterCardStyle}>
          <div style={filterGridStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>対象月</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>スタッフ</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                style={inputStyle}
              >
                <option value="all">全スタッフ</option>
                {staffList.map((staff) => (
                  <option key={staff.staff_id} value={staff.staff_id}>
                    {staff.staff_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>再読み込み</label>
              <button onClick={init} style={secondaryButtonStyle}>
                更新する
              </button>
            </div>
          </div>
        </div>

        <div style={summaryGridStyle}>
          <div style={metricCardStyle}>
            <div style={metricLabelStyle}>出勤日数</div>
            <div style={metricValueStyle}>{summary.workDays}日</div>
          </div>
          <div style={metricCardStyle}>
            <div style={metricLabelStyle}>総勤務時間</div>
            <div style={metricValueStyle}>{minutesToText(summary.totalMinutes)}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={metricLabelStyle}>残業時間</div>
            <div style={metricValueStyle}>{minutesToText(summary.overtimeMinutes)}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={metricLabelStyle}>深夜時間</div>
            <div style={metricValueStyle}>{minutesToText(summary.lateNightMinutes)}</div>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>DAILY LIST</div>
              <h2 style={panelTitleStyle}>日別勤怠一覧</h2>
            </div>
          </div>

          {loading ? (
            <div style={loadingStyle}>読み込み中...</div>
          ) : rows.length === 0 ? (
            <div style={emptyStyle}>該当データがありません。</div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>勤務日</th>
                    <th style={thStyle}>スタッフ名</th>
                    <th style={thStyle}>出勤</th>
                    <th style={thStyle}>退勤</th>
                    <th style={thStyle}>休憩</th>
                    <th style={thStyle}>通常</th>
                    <th style={thStyle}>残業</th>
                    <th style={thStyle}>深夜</th>
                    <th style={thStyle}>総勤務</th>
                    <th style={thStyle}>備考</th>
                    <th style={thStyle}>更新</th>
                    <th style={thStyle}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyle}>{formatDateLabel(row.work_date)}</td>
                      <td style={tdStyleStrong}>{row.staff_name}</td>
                      <td style={tdStyle}>{formatTime(row.clock_in)}</td>
                      <td style={tdStyle}>{formatTime(row.clock_out)}</td>
                      <td style={tdStyle}>{row.break_minutes ?? 0}分</td>
                      <td style={tdStyle}>{minutesToHHMM(row.regular_minutes ?? 0)}</td>
                      <td style={tdStyle}>{minutesToHHMM(row.overtime_minutes ?? 0)}</td>
                      <td style={tdStyle}>{minutesToHHMM(row.late_night_minutes ?? 0)}</td>
                      <td style={tdStyleStrong}>{minutesToHHMM(row.total_work_minutes ?? 0)}</td>
                      <td style={tdStyleNote}>{row.note || "-"}</td>
                      <td style={tdStyle}>{formatDateTime(row.updated_at)}</td>
                      <td style={tdStyle}>
                        <button style={editButtonStyle} onClick={() => openEditModal(row)}>
                          修正
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingRow && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={panelMiniStyle}>EDIT ATTENDANCE</div>
                <h3 style={modalTitleStyle}>
                  {editingRow.staff_name} / {formatDateLabel(editingRow.work_date)}
                </h3>
              </div>
              <button onClick={closeEditModal} style={closeButtonStyle}>
                ✕
              </button>
            </div>

            <div style={modalGridStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>出勤時刻</label>
                <input
                  type="datetime-local"
                  value={editClockIn}
                  onChange={(e) => setEditClockIn(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>退勤時刻</label>
                <input
                  type="datetime-local"
                  value={editClockOut}
                  onChange={(e) => setEditClockOut(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>休憩時間（分）</label>
                <input
                  type="number"
                  min={0}
                  value={editBreakMinutes}
                  onChange={(e) => setEditBreakMinutes(Number(e.target.value || 0))}
                  style={inputStyle}
                />
              </div>

              <div style={{ ...fieldGroupStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>備考</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={4}
                  style={textareaStyle}
                  placeholder="修正理由やメモ"
                />
              </div>
            </div>

            <div style={modalActionRowStyle}>
              <button onClick={closeEditModal} style={secondaryButtonStyle} disabled={saving}>
                キャンセル
              </button>
              <button onClick={handleSaveEdit} style={primaryButtonStyle} disabled={saving}>
                {saving ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  marginBottom: 20,
  boxShadow: "0 18px 40px rgba(148,163,184,0.14)",
  backdropFilter: "blur(10px)",
};

const heroLeftStyle: CSSProperties = {
  flex: 1,
  minWidth: 260,
};

const heroRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
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
  marginBottom: 20,
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(254,226,226,0.9)",
  border: "1px solid rgba(248,113,113,0.28)",
  color: "#b91c1c",
  fontSize: 14,
};

const filterCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.52)",
  border: "1px solid rgba(255,255,255,0.76)",
  borderRadius: 26,
  padding: 20,
  boxShadow: "0 14px 34px rgba(148,163,184,0.12)",
  backdropFilter: "blur(10px)",
  marginBottom: 18,
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  alignItems: "end",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const metricCardStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: "18px 16px",
  boxShadow: "0 10px 24px rgba(148,163,184,0.10)",
};

const metricLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(15,23,42,0.46)",
  marginBottom: 8,
};

const metricValueStyle: CSSProperties = {
  fontSize: 28,
  color: "#0f172a",
  fontWeight: 800,
  letterSpacing: "-0.03em",
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

const fieldGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(15,23,42,0.78)",
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
};

const primaryButtonStyle: CSSProperties = {
  minWidth: 140,
  height: 48,
  border: "none",
  borderRadius: 16,
  background: "linear-gradient(135deg, #ffffff, #eaf1ff)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(148,163,184,0.15)",
  padding: "0 16px",
};

const primaryButtonSmallStyle: CSSProperties = {
  minWidth: 120,
  height: 44,
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #ffffff, #eaf1ff)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(148,163,184,0.15)",
  padding: "0 16px",
};

const secondaryButtonStyle: CSSProperties = {
  minWidth: 120,
  height: 48,
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: 16,
  background: "rgba(255,255,255,0.84)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "0 16px",
};

const tableWrapStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1180,
  borderCollapse: "separate",
  borderSpacing: 0,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  fontSize: 12,
  color: "rgba(15,23,42,0.56)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.55)",
  position: "sticky",
  top: 0,
  zIndex: 1,
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  fontSize: 13,
  color: "#0f172a",
  borderBottom: "1px solid rgba(226,232,240,0.82)",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const tdStyleStrong: CSSProperties = {
  ...tdStyle,
  fontWeight: 700,
};

const tdStyleNote: CSSProperties = {
  ...tdStyle,
  minWidth: 180,
  whiteSpace: "normal",
  lineHeight: 1.6,
  color: "rgba(15,23,42,0.78)",
};

const editButtonStyle: CSSProperties = {
  height: 36,
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  padding: "0 14px",
};

const loadingStyle: CSSProperties = {
  padding: "18px 0",
  fontSize: 14,
  color: "rgba(15,23,42,0.62)",
};

const emptyStyle: CSSProperties = {
  padding: "18px 0",
  fontSize: 14,
  color: "rgba(15,23,42,0.62)",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.22)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 1000,
};

const modalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 720,
  background: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(255,255,255,0.85)",
  borderRadius: 24,
  padding: 22,
  boxShadow: "0 24px 60px rgba(15,23,42,0.16)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 16,
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 800,
};

const closeButtonStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 9999,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 16,
  cursor: "pointer",
};

const modalGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const modalActionRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 18,
  flexWrap: "wrap",
};