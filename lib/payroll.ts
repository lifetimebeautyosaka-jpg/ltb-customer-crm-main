// 給与計算の設定と計算（docs/給与計算ルール.md の内容をコードにしたもの）
// 時給やインセンティブが変わったら、この PAYROLL_STAFF を書き換える。

export const OVERTIME_RATE = 1.25; // 残業（1日8時間を超えた分）
export const LATE_NIGHT_RATE = 1.25; // 深夜（22時〜5時）
export const EMPLOYMENT_INSURANCE_RATE = 0.005; // 雇用保険の労働者負担（2026年度・一般の事業）

export type IncentiveRule = {
  // 対象にする店舗（空なら全店舗）。菱谷さんはアライブ＝西梅田のみ
  stores?: string[];
  // 施術時間ごとの金額
  byMinutes: Record<number, number>;
  nomination: number; // 指名1件あたり
  ticketSale: number; // 回数券（前受金）の販売1件あたり
};

export type PayrollStaff = {
  hourlyWage: number;
  incentive: IncentiveRule;
};

export const PAYROLL_STAFF: Record<string, PayrollStaff> = {
  菱谷: {
    hourlyWage: 1250,
    incentive: {
      stores: ["西梅田"],
      byMinutes: { 60: 500, 90: 1000, 120: 1500 },
      nomination: 1000,
      ticketSale: 1000,
    },
  },
  入江: {
    hourlyWage: 1250,
    incentive: {
      byMinutes: { 60: 500, 80: 500, 90: 1000, 120: 1500 },
      nomination: 1000,
      ticketSale: 1000,
    },
  },
};

export type AttendanceForPay = {
  work_date: string | null;
  clock_in: string | null;
  clock_out: string | null;
  total_work_minutes: number | null;
  overtime_minutes: number | null;
  late_night_minutes: number | null;
};

export type SaleForPay = {
  id: number | string;
  reservation_id?: number | string | null;
  staff_name?: string | null;
  store_name?: string | null;
  sale_type?: string | null;
  memo?: string | null;
};

function trimmed(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function summarizeAttendance(rows: AttendanceForPay[]) {
  const worked = rows.filter((r) => r.clock_in && r.clock_out);
  const totalMinutes = worked.reduce((s, r) => s + Number(r.total_work_minutes || 0), 0);
  const overtimeMinutes = worked.reduce((s, r) => s + Number(r.overtime_minutes || 0), 0);
  const lateNightMinutes = worked.reduce((s, r) => s + Number(r.late_night_minutes || 0), 0);
  // 基本給の時間＝（休憩を引いた勤務時間 − 残業 − 深夜）
  const baseMinutes = Math.max(0, totalMinutes - overtimeMinutes - lateNightMinutes);
  return {
    workDays: new Set(worked.map((r) => trimmed(r.work_date))).size,
    totalMinutes,
    overtimeMinutes,
    lateNightMinutes,
    baseMinutes,
    missingClockOut: rows.filter((r) => r.clock_in && !r.clock_out).length,
  };
}

function menuTextOf(sale: SaleForPay) {
  const memo = trimmed(sale.memo);
  return memo.match(/メニュー名:\s*(.+)/)?.[1] || memo;
}

export function summarizeIncentive(staffName: string, sales: SaleForPay[], rule: IncentiveRule) {
  const sessions = new Map<string, number | null>(); // 施術1件 → 分数
  const ticketSales = new Set<string>();
  let nominationCount = 0;

  for (const sale of sales) {
    if (trimmed(sale.staff_name) !== staffName) continue;
    if (rule.stores?.length && !rule.stores.includes(trimmed(sale.store_name))) continue;

    const key = trimmed(sale.reservation_id) || `sale-${sale.id}`;
    const text = menuTextOf(sale);

    if (trimmed(sale.sale_type) === "前受金") {
      ticketSales.add(key);
      continue;
    }
    if (text.includes("指名料")) {
      nominationCount += 1;
      continue;
    }
    if (text.includes("延長") || text.includes("土日祝加算")) continue;

    const minutes = Number(text.match(/(40|60|80|90|120)\s*分/)?.[1] || 0) || null;
    const current = sessions.get(key);
    sessions.set(key, Math.max(current || 0, minutes || 0) || null);
  }

  const byMinutes = new Map<number, number>();
  let unknownMinutes = 0;
  let sessionAmount = 0;
  for (const minutes of sessions.values()) {
    if (!minutes) {
      unknownMinutes += 1;
      continue;
    }
    byMinutes.set(minutes, (byMinutes.get(minutes) || 0) + 1);
    sessionAmount += rule.byMinutes[minutes] || 0;
  }

  const amount =
    sessionAmount + nominationCount * rule.nomination + ticketSales.size * rule.ticketSale;

  return {
    sessionCount: sessions.size,
    byMinutes: Array.from(byMinutes.entries()).sort((a, b) => a[0] - b[0]),
    unknownMinutes,
    nominationCount,
    ticketSaleCount: ticketSales.size,
    amount,
  };
}

// 雇用保険：50銭以下は切り捨て、50銭を超えたら切り上げ
export function calcEmploymentInsurance(gross: number) {
  const raw = gross * EMPLOYMENT_INSURANCE_RATE;
  const floor = Math.floor(raw);
  return raw - floor > 0.5 ? floor + 1 : floor;
}

export function minutesToHM(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}
