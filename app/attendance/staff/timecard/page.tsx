"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TimecardRecord = {
  id: string;
  staffName: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakMinutes?: number;
  minutes?: number;
};

const STORAGE_KEY = "attendanceRecords";

function getToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getNowTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function calcMinutes(clockIn?: string, clockOut?: string, breakMinutes = 0) {
  if (!clockIn || !clockOut) return 0;

  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);

  if ([inH, inM, outH, outM].some((v) => Number.isNaN(v))) return 0;

  let start = inH * 60 + inM;
  let end = outH * 60 + outM;

  if (end < start) end += 24 * 60;

  return Math.max(0, end - start - breakMinutes);
}

function formatMinutes(minutes: number) {
  const safe = Math.max(0, Math.floor(minutes || 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}時間${m}分`;
}

function saveRecords(data: TimecardRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadRecords(): TimecardRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("attendanceRecords 読み込みエラー:", error);
    return [];
  }
}

function getTodayRecord(
  records: TimecardRecord[],
  staffName: string,
  today: string
) {
  return records.find((r) => r.staffName === staffName && r.date === today);
}

export default function StaffTimecardPage() {
  const [staffName, setStaffName] = useState("スタッフ");
  const [records, setRecords] = useState<TimecardRecord[]>([]);
  const [breakInput, setBreakInput] = useState("0");

  useEffect(() => {
    const name =
      localStorage.getItem("gymup_current_staff_name") ||
      localStorage.getItem("staffName") ||
      "スタッフ";

    setStaffName(name);
    setRecords(loadRecords());
  }, []);

  const today = getToday();

  const myTodayRecord = useMemo(() => {
    return getTodayRecord(records, staffName, today);
  }, [records, staffName, today]);

  const myRecords = useMemo(() => {
    return records
      .filter((r) => r.staffName === staffName)
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.id.localeCompare(a.id);
      });
  }, [records, staffName]);

  useEffect(() => {
    setBreakInput(String(myTodayRecord?.breakMinutes ?? 0));
  }, [myTodayRecord]);

  const handleClockIn = () => {
    const todayRecord = getTodayRecord(records, staffName, today);

    if (todayRecord) {
      if (todayRecord.clockIn) return;

      const updated = records.map((r) => {
        if (r.id === todayRecord.id) {
          return {
            ...r,
            clockIn: getNowTime(),
          };
        }
        return r;
      });

      setRecords(updated);
      saveRecords(updated);
      return;
    }

    const newRecord: TimecardRecord = {
      id: `${staffName}-${today}`,
      staffName,
      date: today,
      clockIn: getNowTime(),
      clockOut: "",
      breakMinutes: 0,
      minutes: 0,
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    saveRecords(updated);
  };

  const handleBreakSave = () => {
    const todayRecord = getTodayRecord(records, staffName, today);
    if (!todayRecord) return;

    const breakMinutes = Number(breakInput) || 0;

    const updated = records.map((r) => {
      if (r.id === todayRecord.id) {
        const minutes = calcMinutes(r.clockIn, r.clockOut, breakMinutes);
        return {
          ...r,
          breakMinutes,
          minutes,
        };
      }
      return r;
    });

    setRecords(updated);
    saveRecords(updated);
  };

  const handleClockOut = () => {
    const todayRecord = getTodayRecord(records, staffName, today);

    if (!todayRecord || !todayRecord.clockIn || todayRecord.clockOut) return;

    const now = getNowTime();
    const breakMinutes = Number(breakInput) || 0;

    const updated = records.map((r) => {
      if (r.id === todayRecord.id) {
        const minutes = calcMinutes(r.clockIn, now, breakMinutes);
        return {
          ...r,
          clockOut: now,
          breakMinutes,
          minutes,
        };
      }
      return r;
    });

    setRecords(updated);
    saveRecords(updated);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[linear-gradient(135deg,#e5e7eb_0%,#d1d5db_42%,#9ca3af_100%)]">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 2px, transparent 2px, transparent 18px)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-xs tracking-[0.25em] text-gray-700/80 font-semibold">
                GYMUP CRM
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                スタッフ用タイムカード
              </h1>
              <p className="text-sm text-gray-700 mt-1">
                {staffName} さんの打刻ページ
              </p>
            </div>

            <Link
              href="/attendance/staff"
              className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/25 px-5 py-3 text-sm font-semibold text-gray-900 backdrop-blur-md shadow hover:bg-white/35 transition"
            >
              ← スタッフメニューへ戻る
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">本日の打刻</h2>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>日付</span>
                <span>{today}</span>
              </div>
              <div className="flex justify-between">
                <span>出勤</span>
                <span>{myTodayRecord?.clockIn || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>退勤</span>
                <span>{myTodayRecord?.clockOut || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>休憩</span>
                <span>{myTodayRecord?.breakMinutes ?? 0}分</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900">
                <span>勤務時間</span>
                <span>{formatMinutes(myTodayRecord?.minutes || 0)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleClockIn}
                disabled={!!myTodayRecord?.clockIn}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-40"
              >
                出勤
              </button>

              <button
                onClick={handleClockOut}
                disabled={!myTodayRecord?.clockIn || !!myTodayRecord?.clockOut}
                className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-40"
              >
                退勤
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">休憩入力</h2>

            <label className="block text-sm text-gray-700 mb-2">
              休憩時間（分）
            </label>
            <input
              type="number"
              min="0"
              value={breakInput}
              onChange={(e) => setBreakInput(e.target.value)}
              className="w-full rounded-2xl border border-white/45 bg-white/45 px-4 py-3 text-gray-900 outline-none backdrop-blur-xl"
            />

            <button
              onClick={handleBreakSave}
              disabled={!myTodayRecord}
              className="mt-4 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-40"
            >
              休憩を保存
            </button>

            <p className="mt-4 text-sm leading-7 text-gray-700">
              先に出勤を押してから、休憩分を入力してください。
              退勤時に休憩時間を差し引いて勤務時間を計算します。
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">打刻履歴</h2>

          <div className="space-y-3">
            {myRecords.length === 0 ? (
              <div className="rounded-2xl bg-white/30 p-4 text-sm text-gray-700">
                まだ打刻履歴がありません
              </div>
            ) : (
              myRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl bg-white/30 border border-white/40 p-4"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm text-gray-700">
                    <div>
                      <div className="text-xs text-gray-500">日付</div>
                      <div className="font-semibold text-gray-900">{record.date}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">出勤</div>
                      <div>{record.clockIn || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">退勤</div>
                      <div>{record.clockOut || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">休憩</div>
                      <div>{record.breakMinutes ?? 0}分</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">勤務時間</div>
                      <div>{formatMinutes(record.minutes || 0)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}