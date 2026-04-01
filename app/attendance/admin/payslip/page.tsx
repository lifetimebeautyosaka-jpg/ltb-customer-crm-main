"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Payslip = {
  id: string;
  staffName: string;
  year: number;
  month: number;
  baseSalary: number;
  overtimePay: number;
  lateNightPay: number;
  holidayPay: number;
  transportation: number;
  bonus: number;
  otherAllowance: number;
  grossPay: number;
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  incomeTax: number;
  residentTax: number;
  otherDeduction: number;
  totalDeduction: number;
  netPay: number;
  workDays: number;
  workHours: number;
  overtimeHours: number;
  lateNightHours: number;
  note?: string;
};

type AttendanceRecord = {
  id?: string | number;
  staffName?: string;
  name?: string;
  employeeName?: string;
  userName?: string;
  date?: string;
  workDate?: string;
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
};

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function hoursToMinutes(value: unknown): number {
  return Math.round(toNumber(value) * 60);
}

function formatYen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function getCurrentYearMonth() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

function getMonthString(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
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

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function calcMinutes(record: AttendanceRecord) {
  const normalMinutes =
    toNumber(record.normalMinutes ?? record.regularMinutes ?? record.normalWorkMinutes) ||
    hoursToMinutes(record.regularHours);

  const overtimeMinutes =
    toNumber(record.overtimeMinutes) || hoursToMinutes(record.overtimeHours);

  const lateNightMinutes =
    toNumber(record.lateNightMinutes ?? record.nightMinutes) ||
    hoursToMinutes(record.lateNightHours);

  const overtimeLateNightMinutes =
    toNumber(record.overtimeLateNightMinutes ?? record.overtimeNightMinutes) ||
    hoursToMinutes(record.overtimeLateNightHours);

  return {
    normalMinutes,
    overtimeMinutes,
    lateNightMinutes,
    overtimeLateNightMinutes,
    totalMinutes:
      normalMinutes + overtimeMinutes + lateNightMinutes + overtimeLateNightMinutes,
  };
}

function buildPayslipsFromAttendance(records: AttendanceRecord[]): Payslip[] {
  const grouped = new Map<string, AttendanceRecord[]>();

  records.forEach((record) => {
    const month = extractMonth(record);
    const staffName = extractStaffName(record);
    if (!month || !staffName) return;

    const key = `${staffName}__${month}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(record);
  });

  const HOURLY = 1200;
  const OVERTIME_RATE = 1.25;
  const LATENIGHT_RATE = 0.25;
  const OVERTIME_LATENIGHT_RATE = 1.5;
  const TRANSPORT = 10000;

  const payslips: Payslip[] = [];

  grouped.forEach((items, key) => {
    const [staffName, ym] = key.split("__");
    const [yearStr, monthStr] = ym.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    let workDays = 0;
    let totalMinutes = 0;
    let overtimeMinutes = 0;
    let lateNightMinutes = 0;

    items.forEach((record) => {
      const mins = calcMinutes(record);
      workDays += 1;
      totalMinutes += mins.totalMinutes;
      overtimeMinutes += mins.overtimeMinutes;
      lateNightMinutes += mins.lateNightMinutes + mins.overtimeLateNightMinutes;
    });

    const normalHours = totalMinutes / 60;
    const overtimeHours = overtimeMinutes / 60;
    const lateNightHours = lateNightMinutes / 60;

    const baseSalary = Math.round(normalHours * HOURLY);
    const overtimePay = Math.round(overtimeHours * HOURLY * (OVERTIME_RATE - 1));
    const lateNightPay = Math.round(lateNightHours * HOURLY * LATENIGHT_RATE);
    const holidayPay = 0;
    const transportation = TRANSPORT;
    const bonus = 0;
    const otherAllowance = 0;

    const grossPay =
      baseSalary +
      overtimePay +
      lateNightPay +
      holidayPay +
      transportation +
      bonus +
      otherAllowance;

    const healthInsurance = Math.round(grossPay * 0.05);
    const pension = Math.round(grossPay * 0.09);
    const employmentInsurance = Math.round(grossPay * 0.006);
    const incomeTax = Math.round(grossPay * 0.02);
    const residentTax = 8000;
    const otherDeduction = 0;

    const totalDeduction =
      healthInsurance +
      pension +
      employmentInsurance +
      incomeTax +
      residentTax +
      otherDeduction;

    const netPay = grossPay - totalDeduction;

    payslips.push({
      id: `${staffName}-${year}-${month}`,
      staffName,
      year,
      month,
      baseSalary,
      overtimePay,
      lateNightPay,
      holidayPay,
      transportation,
      bonus,
      otherAllowance,
      grossPay,
      healthInsurance,
      pension,
      employmentInsurance,
      incomeTax,
      residentTax,
      otherDeduction,
      totalDeduction,
      netPay,
      workDays,
      workHours: Number(normalHours.toFixed(1)),
      overtimeHours: Number(overtimeHours.toFixed(1)),
      lateNightHours: Number(lateNightHours.toFixed(1)),
      note: "勤怠データから自動集計",
    });
  });

  return payslips.sort((a, b) => {
    if (a.staffName !== b.staffName) {
      return a.staffName.localeCompare(b.staffName, "ja");
    }
    return b.year * 100 + b.month - (a.year * 100 + a.month);
  });
}

export default function AdminPayslipPage() {
  const now = getCurrentYearMonth();
  const [allPayslips, setAllPayslips] = useState<Payslip[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    getMonthString(now.year, now.month)
  );
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    try {
      const rawPayslips = localStorage.getItem("gymup_payslips");
      if (rawPayslips) {
        const parsed = JSON.parse(rawPayslips);
        if (Array.isArray(parsed)) {
          setAllPayslips(parsed);
          return;
        }
      }

      const rawAttendance = localStorage.getItem("attendanceRecords");
      if (rawAttendance) {
        const parsed = JSON.parse(rawAttendance);
        if (Array.isArray(parsed)) {
          const built = buildPayslipsFromAttendance(parsed);
          setAllPayslips(built);
          localStorage.setItem("gymup_payslips", JSON.stringify(built));
          return;
        }
      }

      setAllPayslips([]);
    } catch (error) {
      console.error("給与明細データ読み込みエラー:", error);
      setAllPayslips([]);
    }
  }, []);

  const filteredPayslips = useMemo(() => {
    return allPayslips.filter((item) => {
      const monthMatch = getMonthString(item.year, item.month) === selectedMonth;
      const nameMatch = item.staffName
        .toLowerCase()
        .includes(searchText.trim().toLowerCase());
      return monthMatch && nameMatch;
    });
  }, [allPayslips, selectedMonth, searchText]);

  const totals = useMemo(() => {
    return filteredPayslips.reduce(
      (acc, item) => {
        acc.count += 1;
        acc.grossPay += item.grossPay;
        acc.totalDeduction += item.totalDeduction;
        acc.netPay += item.netPay;
        return acc;
      },
      {
        count: 0,
        grossPay: 0,
        totalDeduction: 0,
        netPay: 0,
      }
    );
  }, [filteredPayslips]);

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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
              <div className="text-xs text-gray-600">給与明細管理</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/attendance/admin"
              className="rounded-xl border border-white/45 bg-white/30 px-4 py-2.5 text-sm font-semibold text-gray-800 backdrop-blur-xl transition hover:bg-white/45"
            >
              管理者トップ
            </Link>
            <Link
              href="/attendance"
              className="rounded-xl border border-white/45 bg-white/30 px-4 py-2.5 text-sm font-semibold text-gray-800 backdrop-blur-xl transition hover:bg-white/45"
            >
              勤怠トップ
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl p-6 md:p-10">
        <section className={glassCardLgClass + " mb-8"}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-600 backdrop-blur-xl">
            <span className="inline-block h-2 w-2 rounded-full bg-black/70" />
            Payslip Management
          </div>

          <h1 className="text-3xl font-bold text-gray-900 md:text-5xl">
            給与明細管理
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-700 md:text-base">
            スタッフ別の給与明細を確認・管理します。対象月ごとの総支給額、控除額、差引支給額を一覧で見られます。
          </p>
        </section>

        <section className={glassCardClass + " mb-8"}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric title="対象人数" value={`${totals.count}人`} />
            <Metric title="総支給額" value={formatYen(totals.grossPay)} />
            <Metric title="控除合計" value={formatYen(totals.totalDeduction)} />
            <Metric title="差引支給額" value={formatYen(totals.netPay)} />
          </div>
        </section>

        <section className={glassCardClass + " mb-8"}>
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
            <table className="w-full min-w-[1200px]">
              <thead className="bg-white/35">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">スタッフ名</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">対象月</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">出勤日数</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">総支給額</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">控除額</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">差引支給額</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-800">詳細</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-600">
                      給与明細データがありません
                    </td>
                  </tr>
                ) : (
                  filteredPayslips.map((item) => (
                    <tr key={item.id} className="border-t border-white/30">
                      <td className="p-4 font-semibold text-gray-900">{item.staffName}</td>
                      <td className="p-4 text-gray-700">{item.year}年{item.month}月</td>
                      <td className="p-4 text-gray-700">{item.workDays}日</td>
                      <td className="p-4 text-gray-700">{formatYen(item.grossPay)}</td>
                      <td className="p-4 text-gray-700">{formatYen(item.totalDeduction)}</td>
                      <td className="p-4 font-bold text-gray-900">{formatYen(item.netPay)}</td>
                      <td className="p-4">
                        <Link
                          href="/attendance/staff/payslip"
                          className="inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                          開く
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
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