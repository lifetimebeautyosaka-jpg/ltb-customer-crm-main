"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type AttendanceRecord = {
  id?: string | number;
  staffId?: string;
  staffName?: string;
  name?: string;
  employeeName?: string;
  userName?: string;
  date?: string;
  workDate?: string;
  clockIn?: string;
  clockOut?: string;
  startTime?: string;
  endTime?: string;
  normalMinutes?: number | string;
  overtimeMinutes?: number | string;
  lateNightMinutes?: number | string;
  overtimeLateNightMinutes?: number | string;
  regularMinutes?: number | string;
  nightMinutes?: number | string;
  normalWorkMinutes?: number | string;
  overtimeNightMinutes?: number | string;
  workingHours?: number | string;
  regularHours?: number | string;
  overtimeHours?: number | string;
  lateNightHours?: number | string;
  overtimeLateNightHours?: number | string;
  status?: string;
};

type WageInput = {
  hourlyRate: number;
  incentive: number;
  adjustment: number;
};

type WageSettings = {
  [month: string]: {
    [staffName: string]: WageInput;
  };
};

type StaffSummary = {
  staffName: string;
  workDays: number;
  normalMinutes: number;
  overtimeMinutes: number;
  lateNightMinutes: number;
  overtimeLateNightMinutes: number;
  totalMinutes: number;
};

type ExportRow = {
  スタッフ名: string;
  出勤日数: number;
  通常勤務時間: string;
  残業時間: string;
  深夜時間: string;
  残業深夜時間: string;
  総勤務時間: string;
  時給: number;
  通常支給額: number;
  残業支給額: number;
  深夜支給額: number;
  残業深夜支給額: number;
  インセンティブ: number;
  調整額: number;
  総支給額: number;
};

const ATTENDANCE_STORAGE_KEY = "attendanceRecords";
const WAGE_SETTINGS_STORAGE_KEY = "wageSettings";

const OVERTIME_RATE = 1.25;
const LATE_NIGHT_RATE = 1.25;
const OVERTIME_LATE_NIGHT_RATE = 1.5;

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function hoursToMinutes(value: unknown): number {
  return Math.round(toNumber(value) * 60);
}

function formatMinutes(minutes: number) {
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}時間${m}分`;
}

function formatHours(minutes: number) {
  return (minutes / 60).toFixed(2);
}

function formatYen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

function getMonthString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function extractStaffName(record: AttendanceRecord) {
  return (
    record.staffName ||
    record.name ||
    record.employeeName ||
    record.userName ||
    "スタッフ未設定"
  );
}

function extractDate(record: AttendanceRecord) {
  return record.date || record.workDate || "";
}

function extractMonth(record: AttendanceRecord) {
  const rawDate = extractDate(record);
  if (!rawDate) return "";

  if (/^\d{4}-\d{2}/.test(rawDate)) {
    return rawDate.slice(0, 7);
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return "";

  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function calcTotalMinutes(record: AttendanceRecord) {
  const minutesBasedTotal =
    toNumber(record.normalMinutes ?? record.regularMinutes ?? record.normalWorkMinutes) +
    toNumber(record.overtimeMinutes) +
    toNumber(record.lateNightMinutes ?? record.nightMinutes) +
    toNumber(record.overtimeLateNightMinutes ?? record.overtimeNightMinutes);

  if (minutesBasedTotal > 0) return minutesBasedTotal;

  const hoursBasedTotal =
    hoursToMinutes(record.workingHours) ||
    hoursToMinutes(record.regularHours) +
      hoursToMinutes(record.overtimeHours) +
      hoursToMinutes(record.lateNightHours) +
      hoursToMinutes(record.overtimeLateNightHours);

  if (hoursBasedTotal > 0) return hoursBasedTotal;

  const clockIn = record.clockIn || record.startTime;
  const clockOut = record.clockOut || record.endTime;

  if (!clockIn || !clockOut) return 0;

  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);

  if ([inH, inM, outH, outM].some((v) => Number.isNaN(v))) {
    return 0;
  }

  let start = inH * 60 + inM;
  let end = outH * 60 + outM;

  if (end < start) {
    end += 24 * 60;
  }

  return Math.max(0, end - start);
}

function getNormalMinutes(record: AttendanceRecord) {
  return (
    toNumber(record.normalMinutes ?? record.regularMinutes ?? record.normalWorkMinutes) ||
    hoursToMinutes(record.regularHours)
  );
}

function getOvertimeMinutes(record: AttendanceRecord) {
  return toNumber(record.overtimeMinutes) || hoursToMinutes(record.overtimeHours);
}

function getLateNightMinutes(record: AttendanceRecord) {
  return (
    toNumber(record.lateNightMinutes ?? record.nightMinutes) ||
    hoursToMinutes(record.lateNightHours)
  );
}

function getOvertimeLateNightMinutes(record: AttendanceRecord) {
  return (
    toNumber(record.overtimeLateNightMinutes ?? record.overtimeNightMinutes) ||
    hoursToMinutes(record.overtimeLateNightHours)
  );
}

function getEmptyWageInput(): WageInput {
  return {
    hourlyRate: 0,
    incentive: 0,
    adjustment: 0,
  };
}

function escapeCSV(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export default function AdminWageLedgerPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getMonthString());
  const [searchText, setSearchText] = useState("");
  const [wageSettings, setWageSettings] = useState<WageSettings>({});

  useEffect(() => {
    try {
      const rawAttendance = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (rawAttendance) {
        const parsed = JSON.parse(rawAttendance);
        setRecords(Array.isArray(parsed) ? parsed : []);
      }

      const rawWageSettings = localStorage.getItem(WAGE_SETTINGS_STORAGE_KEY);
      if (rawWageSettings) {
        const parsed = JSON.parse(rawWageSettings);
        setWageSettings(parsed && typeof parsed === "object" ? parsed : {});
      }
    } catch (error) {
      console.error("データ読み込みエラー:", error);
      setRecords([]);
      setWageSettings({});
    }
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const month = extractMonth(record);
      const staffName = extractStaffName(record);
      const monthMatch = month === selectedMonth;
      const nameMatch = staffName
        .toLowerCase()
        .includes(searchText.trim().toLowerCase());

      return monthMatch && nameMatch;
    });
  }, [records, selectedMonth, searchText]);

  const summaryList = useMemo<StaffSummary[]>(() => {
    const map = new Map<string, StaffSummary>();

    filteredRecords.forEach((record) => {
      const staffName = extractStaffName(record);

      const normalMinutes = getNormalMinutes(record);
      const overtimeMinutes = getOvertimeMinutes(record);
      const lateNightMinutes = getLateNightMinutes(record);
      const overtimeLateNightMinutes = getOvertimeLateNightMinutes(record);

      const totalMinutes =
        normalMinutes + overtimeMinutes + lateNightMinutes + overtimeLateNightMinutes ||
        calcTotalMinutes(record);

      if (!map.has(staffName)) {
        map.set(staffName, {
          staffName,
          workDays: 0,
          normalMinutes: 0,
          overtimeMinutes: 0,
          lateNightMinutes: 0,
          overtimeLateNightMinutes: 0,
          totalMinutes: 0,
        });
      }

      const current = map.get(staffName)!;
      current.workDays += 1;
      current.normalMinutes += normalMinutes;
      current.overtimeMinutes += overtimeMinutes;
      current.lateNightMinutes += lateNightMinutes;
      current.overtimeLateNightMinutes += overtimeLateNightMinutes;
      current.totalMinutes += totalMinutes;
    });

    return Array.from(map.values()).sort((a, b) =>
      a.staffName.localeCompare(b.staffName, "ja")
    );
  }, [filteredRecords]);

  const updateWageSetting = (
    staffName: string,
    key: keyof WageInput,
    value: string
  ) => {
    const numericValue = Number(value) || 0;

    setWageSettings((prev) => {
      const next: WageSettings = {
        ...prev,
        [selectedMonth]: {
          ...(prev[selectedMonth] || {}),
          [staffName]: {
            ...(prev[selectedMonth]?.[staffName] || getEmptyWageInput()),
            [key]: numericValue,
          },
        },
      };

      localStorage.setItem(WAGE_SETTINGS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const rows = useMemo(() => {
    return summaryList.map((staff) => {
      const saved = wageSettings[selectedMonth]?.[staff.staffName] || getEmptyWageInput();

      const hourlyRate = toNumber(saved.hourlyRate);
      const incentive = toNumber(saved.incentive);
      const adjustment = toNumber(saved.adjustment);

      const normalPay = (staff.normalMinutes / 60) * hourlyRate;
      const overtimePay = (staff.overtimeMinutes / 60) * hourlyRate * OVERTIME_RATE;
      const lateNightPay = (staff.lateNightMinutes / 60) * hourlyRate * LATE_NIGHT_RATE;
      const overtimeLateNightPay =
        (staff.overtimeLateNightMinutes / 60) * hourlyRate * OVERTIME_LATE_NIGHT_RATE;

      const totalPay =
        normalPay +
        overtimePay +
        lateNightPay +
        overtimeLateNightPay +
        incentive +
        adjustment;

      return {
        ...staff,
        hourlyRate,
        incentive,
        adjustment,
        normalPay,
        overtimePay,
        lateNightPay,
        overtimeLateNightPay,
        totalPay,
      };
    });
  }, [summaryList, wageSettings, selectedMonth]);

  const grandTotal = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.staffCount += 1;
        acc.workDays += row.workDays;
        acc.normalMinutes += row.normalMinutes;
        acc.overtimeMinutes += row.overtimeMinutes;
        acc.lateNightMinutes += row.lateNightMinutes;
        acc.overtimeLateNightMinutes += row.overtimeLateNightMinutes;
        acc.totalMinutes += row.totalMinutes;
        acc.normalPay += row.normalPay;
        acc.overtimePay += row.overtimePay;
        acc.lateNightPay += row.lateNightPay;
        acc.overtimeLateNightPay += row.overtimeLateNightPay;
        acc.incentive += row.incentive;
        acc.adjustment += row.adjustment;
        acc.totalPay += row.totalPay;
        return acc;
      },
      {
        staffCount: 0,
        workDays: 0,
        normalMinutes: 0,
        overtimeMinutes: 0,
        lateNightMinutes: 0,
        overtimeLateNightMinutes: 0,
        totalMinutes: 0,
        normalPay: 0,
        overtimePay: 0,
        lateNightPay: 0,
        overtimeLateNightPay: 0,
        incentive: 0,
        adjustment: 0,
        totalPay: 0,
      }
    );
  }, [rows]);

  const exportRows = useMemo<ExportRow[]>(() => {
    return rows.map((row) => ({
      スタッフ名: row.staffName,
      出勤日数: row.workDays,
      通常勤務時間: formatHours(row.normalMinutes),
      残業時間: formatHours(row.overtimeMinutes),
      深夜時間: formatHours(row.lateNightMinutes),
      残業深夜時間: formatHours(row.overtimeLateNightMinutes),
      総勤務時間: formatHours(row.totalMinutes),
      時給: Math.round(row.hourlyRate),
      通常支給額: Math.round(row.normalPay),
      残業支給額: Math.round(row.overtimePay),
      深夜支給額: Math.round(row.lateNightPay),
      残業深夜支給額: Math.round(row.overtimeLateNightPay),
      インセンティブ: Math.round(row.incentive),
      調整額: Math.round(row.adjustment),
      総支給額: Math.round(row.totalPay),
    }));
  }, [rows]);

  const handleExportCSV = () => {
    if (exportRows.length === 0) {
      alert("出力するデータがありません");
      return;
    }

    const headers = Object.keys(exportRows[0]);
    const lines = [
      headers.join(","),
      ...exportRows.map((row) =>
        headers.map((header) => escapeCSV(row[header as keyof ExportRow])).join(",")
      ),
    ];

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wage-ledger-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) {
      alert("出力するデータがありません");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "賃金台帳");
    XLSX.writeFile(wb, `wage-ledger-${selectedMonth}.xlsx`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#e5e7eb_0%,#d1d5db_42%,#9ca3af_100%)] text-gray-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 -left-36 h-[560px] w-[560px] rounded-full bg-white/70 blur-[140px]" />
        <div className="absolute bottom-[-140px] right-[-80px] h-[460px] w-[460px] rounded-full bg-white/50 blur-[120px]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 1px, transparent 24px)",
        }}
      />

      <header className="relative border-b border-white/35 bg-white/35 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img
              src="/gymup-logo.png"
              alt="GYMUP"
              className="h-11 w-auto object-contain"
            />
            <div>
              <div className="text-lg font-bold tracking-[0.08em] text-gray-900">
                GYMUP CRM
              </div>
              <div className="text-xs text-gray-600">管理者用賃金台帳</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/45 bg-white/30 px-4 py-2.5 text-sm font-semibold text-gray-800 backdrop-blur-xl transition hover:bg-white/45"
            >
              管理メニュー
            </Link>
            <Link
              href="/attendance"
              className="rounded-xl border border-white/45 bg-white/30 px-4 py-2.5 text-sm font-semibold text-gray-800 backdrop-blur-xl transition hover:bg-white/45"
            >
              勤怠トップ
            </Link>
            <Link
              href="/attendance/admin/timecard"
              className="rounded-xl border border-white/45 bg-white/30 px-4 py-2.5 text-sm font-semibold text-gray-800 backdrop-blur-xl transition hover:bg-white/45"
            >
              管理者タイムカード
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-[1500px] p-6 md:p-10">
        <section className={`${glassCardLgClass} mb-8`}>
          <div className="pointer-events-none absolute inset-0 rounded-[34px] border border-white/45" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.70)_0%,rgba(255,255,255,0)_100%)]" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-600 backdrop-blur-xl">
                <span className="inline-block h-2 w-2 rounded-full bg-black/70" />
                Wage Ledger
              </div>

              <h1 className="text-3xl font-bold text-gray-900 md:text-5xl">
                管理者用賃金台帳
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
                勤怠データをもとに賃金を自動計算します。時給・インセンティブ・調整額だけ手入力で管理できます。
              </p>
              <p className="mt-2 text-xs text-gray-600">
                計算倍率：残業 {OVERTIME_RATE}倍 / 深夜 {LATE_NIGHT_RATE}倍 / 残業深夜 {OVERTIME_LATE_NIGHT_RATE}倍
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,0.20)] transition hover:bg-black"
              >
                CSV出力
              </button>
              <button
                onClick={handleExportExcel}
                className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,0.20)] transition hover:bg-black"
              >
                Excel出力
              </button>
            </div>
          </div>
        </section>

        <section className={`${glassCardClass} mb-8`}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric title="スタッフ人数" value={`${grandTotal.staffCount}人`} />
            <Metric title="総出勤日数" value={`${grandTotal.workDays}日`} />
            <Metric title="総勤務時間" value={formatMinutes(grandTotal.totalMinutes)} />
            <Metric title="総支給額" value={formatYen(grandTotal.totalPay)} />
          </div>
        </section>

        <section className={`${glassCardClass} mb-8`}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="対象月">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={glassInputClass}
              />
            </Field>

            <Field label="スタッフ検索">
              <input
                type="text"
                placeholder="スタッフ名で検索"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={glassInputClass}
              />
            </Field>
          </div>
        </section>

        <section className={glassCardClass}>
          <div className="overflow-x-auto rounded-[24px] border border-white/30 bg-white/25 backdrop-blur-xl">
            <table className="w-full min-w-[1800px]">
              <thead className="bg-white/35">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">スタッフ名</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">出勤日数</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">通常</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">残業</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">深夜</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">残業深夜</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">総勤務</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">時給</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">通常支給</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">残業支給</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">深夜支給</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">残業深夜支給</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">インセンティブ</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">調整額</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">総支給額</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-gray-600">
                      データがありません
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.staffName} className="border-t border-white/30">
                      <td className="p-4 font-semibold text-gray-900">{row.staffName}</td>
                      <td className="p-4 text-gray-700">{row.workDays}日</td>
                      <td className="p-4 text-gray-700">{formatHours(row.normalMinutes)}h</td>
                      <td className="p-4 text-gray-700">{formatHours(row.overtimeMinutes)}h</td>
                      <td className="p-4 text-gray-700">{formatHours(row.lateNightMinutes)}h</td>
                      <td className="p-4 text-gray-700">{formatHours(row.overtimeLateNightMinutes)}h</td>
                      <td className="p-4 text-gray-700">{formatHours(row.totalMinutes)}h</td>

                      <td className="p-4">
                        <input
                          type="number"
                          min="0"
                          value={row.hourlyRate}
                          onChange={(e) =>
                            updateWageSetting(row.staffName, "hourlyRate", e.target.value)
                          }
                          className={tableInputClass}
                        />
                      </td>

                      <td className="p-4 text-gray-700">{formatYen(row.normalPay)}</td>
                      <td className="p-4 text-gray-700">{formatYen(row.overtimePay)}</td>
                      <td className="p-4 text-gray-700">{formatYen(row.lateNightPay)}</td>
                      <td className="p-4 text-gray-700">{formatYen(row.overtimeLateNightPay)}</td>

                      <td className="p-4">
                        <input
                          type="number"
                          value={row.incentive}
                          onChange={(e) =>
                            updateWageSetting(row.staffName, "incentive", e.target.value)
                          }
                          className={tableInputClass}
                        />
                      </td>

                      <td className="p-4">
                        <input
                          type="number"
                          value={row.adjustment}
                          onChange={(e) =>
                            updateWageSetting(row.staffName, "adjustment", e.target.value)
                          }
                          className={tableInputClass}
                        />
                      </td>

                      <td className="p-4 font-bold text-gray-900">{formatYen(row.totalPay)}</td>
                    </tr>
                  ))
                )}
              </tbody>

              {rows.length > 0 && (
                <tfoot className="bg-white/35">
                  <tr>
                    <td className="p-4 font-bold text-gray-900">合計</td>
                    <td className="p-4 font-bold text-gray-900">{grandTotal.workDays}日</td>
                    <td className="p-4 font-bold text-gray-900">{formatHours(grandTotal.normalMinutes)}h</td>
                    <td className="p-4 font-bold text-gray-900">{formatHours(grandTotal.overtimeMinutes)}h</td>
                    <td className="p-4 font-bold text-gray-900">{formatHours(grandTotal.lateNightMinutes)}h</td>
                    <td className="p-4 font-bold text-gray-900">
                      {formatHours(grandTotal.overtimeLateNightMinutes)}h
                    </td>
                    <td className="p-4 font-bold text-gray-900">{formatHours(grandTotal.totalMinutes)}h</td>
                    <td className="p-4 font-bold text-gray-900">-</td>
                    <td className="p-4 font-bold text-gray-900">{formatYen(grandTotal.normalPay)}</td>
                    <td className="p-4 font-bold text-gray-900">{formatYen(grandTotal.overtimePay)}</td>
                    <td className="p-4 font-bold text-gray-900">{formatYen(grandTotal.lateNightPay)}</td>
                    <td className="p-4 font-bold text-gray-900">{formatYen(grandTotal.overtimeLateNightPay)}</td>
                    <td className="p-4 font-bold text-gray-900">{formatYen(grandTotal.incentive)}</td>
                    <td className="p-4 font-bold text-gray-900">{formatYen(grandTotal.adjustment)}</td>
                    <td className="p-4 font-bold text-gray-900">{formatYen(grandTotal.totalPay)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className={glassInnerClass}>
      <div className="mb-1 text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

const glassCardClass =
  "relative overflow-hidden rounded-[30px] border border-white/35 bg-white/40 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.10)] backdrop-blur-2xl";

const glassCardLgClass =
  "relative overflow-hidden rounded-[34px] border border-white/35 bg-white/40 p-8 shadow-[0_28px_80px_rgba(0,0,0,0.12)] backdrop-blur-2xl";

const glassInnerClass =
  "rounded-2xl border border-white/35 bg-white/35 px-4 py-4 backdrop-blur-xl";

const glassInputClass =
  "w-full rounded-2xl border border-white/45 bg-white/45 px-4 py-3 text-gray-900 outline-none backdrop-blur-xl placeholder:text-gray-400";

const tableInputClass =
  "w-[120px] rounded-xl border border-white/45 bg-white/45 px-3 py-2 text-gray-900 outline-none backdrop-blur-xl";