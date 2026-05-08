"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";

type Customer = {
  id: string | number;
  name: string;
  phone?: string | null;
};

type ServiceType = "ストレッチ" | "トレーニング";
type AccountingType = "通常売上" | "前受金" | "回数券消化";
type PaymentMethod = "現金" | "カード" | "銀行振込" | "その他";

type SaleCategory =
  | "ストレッチ現金"
  | "ストレッチカード"
  | "ストレッチ銀行振込"
  | "ストレッチその他"
  | "ストレッチ前受金"
  | "ストレッチ回数券消化"
  | "トレーニング現金"
  | "トレーニングカード"
  | "トレーニング銀行振込"
  | "トレーニングその他"
  | "トレーニング前受金"
  | "トレーニング回数券消化";

type PaymentRow = {
  id: string;
  saleType: AccountingType;
  paymentMethod: PaymentMethod;
  amount: string;
  presetId: string;
};

type Sale = {
  id: string;
  date: string;
  customerId?: string | null;
  customerName: string;
  menuName: string;
  staff: string;
  storeName: string;
  serviceType: ServiceType;
  accountingType: AccountingType;
  paymentMethod: PaymentMethod;
  amount: number;
  category: SaleCategory;
  note: string;
  createdAt: string;
  reservationId?: number | null;
};

type SupabaseSaleRow = {
  id: number | string;
  customer_id?: number | string | null;
  customer_name: string | null;
  sale_date: string | null;
  menu_type: string | null;
  sale_type: string | null;
  payment_method: string | null;
  amount: number | null;
  staff_name: string | null;
  store_name: string | null;
  reservation_id: number | null;
  memo: string | null;
  created_at: string | null;
};

type ReservationPrefillRow = {
  id: number | string;
  customer_id?: number | string | null;
  customer_name?: string | null;
  date?: string | null;
  menu?: string | null;
  staff_name?: string | null;
  store_name?: string | null;
  payment_method?: string | null;
  memo?: string | null;
  reservation_status?: string | null;
};

type TicketRow = {
  id: number | string;
  customer_id: number | string | null;
  customer_name: string | null;
  ticket_name: string | null;
  service_type: ServiceType;
  total_count: number | null;
  remaining_count: number | null;
  purchase_date: string | null;
  expiry_date: string | null;
  status: string | null;
  note: string | null;
  created_at: string | null;
};

type TicketUsageRow = {
  id: number | string;
  reservation_id: number | null;
  ticket_id: number | string | null;
  customer_id: number | null;
  customer_name: string | null;
  ticket_name: string | null;
  service_type: ServiceType | null;
  used_date: string | null;
  before_count: number | null;
  after_count: number | null;
};

type TicketConsumeResult = {
  ticketId: number | string;
  ticketName: string;
  beforeCount: number;
  afterCount: number;
};

type PricePreset = {
  id: string;
  serviceType: ServiceType;
  label: string;
  menuName: string;
  amount: number;
  accountingType?: AccountingType;
  note?: string;
};

type TicketIssuePresetInfo = {
  ticketCount: 4 | 8 | 12;
  minutes: 40 | 60 | 80 | 120;
  priceVersion: "新" | "旧";
};

type ParsedTicketInfo = {
  count: 4 | 8 | 12 | null;
  minutes: 40 | 60 | 80 | 120;
  version: "new" | "old" | null;
};

type DailySummaryRow = {
  date: string;
  netSalesTotal: number;
  advanceTotal: number;
  grandTotal: number;
};

type MonthlySummaryRow = {
  name: string;
  netSalesTotal: number;
  advanceTotal: number;
  grandTotal: number;
  count: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STAFF_OPTIONS = [
  "山口",
  "中西",
  "池田",
  "羽田",
  "石川",
  "菱谷",
  "林",
  "井上",
  "その他",
  "未設定",
];

const STORE_OPTIONS = [
  "江戸堀",
  "箕面",
  "福島",
  "福島P",
  "天満橋",
  "中崎町",
  "江坂",
  "未設定",
];

const PAYMENT_OPTIONS: PaymentMethod[] = ["現金", "カード", "銀行振込", "その他"];
const ACCOUNTING_OPTIONS: AccountingType[] = ["通常売上", "前受金", "回数券消化"];
const SERVICE_OPTIONS: ServiceType[] = ["ストレッチ", "トレーニング"];

const STRETCH_NEW_TICKET_SALES: Record<
  4 | 8 | 12,
  Record<40 | 60 | 80 | 120, number>
> = {
  4: { 40: 22000, 60: 34000, 80: 45000, 120: 68000 },
  8: { 40: 42000, 60: 64000, 80: 86000, 120: 128000 },
  12: { 40: 62000, 60: 94000, 80: 126000, 120: 188000 },
};

const STRETCH_OLD_TICKET_SALES: Record<
  4 | 8 | 12,
  Record<40 | 60 | 80 | 120, number>
> = {
  4: { 40: 21320, 60: 31920, 80: 42680, 120: 64000 },
  8: { 40: 40720, 60: 61120, 80: 81440, 120: 122160 },
  12: { 40: 60000, 60: 90000, 80: 120000, 120: 180000 },
};

const STRETCH_NEW_CONSUME_UNIT: Record<
  4 | 8 | 12,
  Record<40 | 60 | 80 | 120, number>
> = {
  4: { 40: 5500, 60: 8500, 80: 11250, 120: 17000 },
  8: { 40: 5250, 60: 8000, 80: 10750, 120: 16000 },
  12: { 40: 5167, 60: 7833, 80: 10500, 120: 15667 },
};

const STRETCH_OLD_CONSUME_UNIT: Record<
  4 | 8 | 12,
  Record<40 | 60 | 80 | 120, number>
> = {
  4: { 40: 5330, 60: 7980, 80: 10670, 120: 16000 },
  8: { 40: 5090, 60: 7640, 80: 10180, 120: 15270 },
  12: { 40: 5000, 60: 7500, 80: 10000, 120: 15000 },
};

const STRETCH_MINUTES = [40, 60, 80, 120] as const;
const STRETCH_COUNTS = [4, 8, 12] as const;

function buildStretchPresets(): PricePreset[] {
  const presets: PricePreset[] = [
    {
      id: "stretch_trial_60",
      serviceType: "ストレッチ",
      label: "新価格 初回体験 60分 4,900円",
      menuName: "ストレッチ初回体験 60分",
      amount: 4900,
    },
    {
      id: "stretch_trial_80",
      serviceType: "ストレッチ",
      label: "新価格 初回体験 80分 6,800円",
      menuName: "ストレッチ初回体験 80分",
      amount: 6800,
    },
    {
      id: "stretch_trial_120",
      serviceType: "ストレッチ",
      label: "新価格 初回体験 120分 11,000円",
      menuName: "ストレッチ初回体験 120分",
      amount: 11000,
    },
    {
      id: "stretch_trial_holiday_plus",
      serviceType: "ストレッチ",
      label: "新価格 初回体験（土日祝加算）+1,000円",
      menuName: "ストレッチ初回体験 土日祝加算",
      amount: 1000,
    },
    {
      id: "stretch_single_40",
      serviceType: "ストレッチ",
      label: "新価格 単発 40分 5,900円",
      menuName: "ストレッチ単発 40分",
      amount: 5900,
    },
    {
      id: "stretch_single_60",
      serviceType: "ストレッチ",
      label: "新価格 単発 60分 8,900円",
      menuName: "ストレッチ単発 60分",
      amount: 8900,
    },
    {
      id: "stretch_single_80",
      serviceType: "ストレッチ",
      label: "新価格 単発 80分 11,900円",
      menuName: "ストレッチ単発 80分",
      amount: 11900,
    },
    {
      id: "stretch_single_120",
      serviceType: "ストレッチ",
      label: "新価格 単発 120分 17,900円",
      menuName: "ストレッチ単発 120分",
      amount: 17900,
    },
    {
      id: "stretch_extension_10",
      serviceType: "ストレッチ",
      label: "新価格 延長10分 1,500円",
      menuName: "ストレッチ延長 10分",
      amount: 1500,
    },
    {
      id: "stretch_nomination_fee",
      serviceType: "ストレッチ",
      label: "指名料 1,000円",
      menuName: "指名料",
      amount: 1000,
      note: "指名料",
    },
    {
      id: "manual_other_stretch",
      serviceType: "ストレッチ",
      label: "その他（手入力）",
      menuName: "その他",
      amount: 0,
    },
  ];

  STRETCH_COUNTS.forEach((count) => {
    STRETCH_MINUTES.forEach((minutes) => {
      presets.push({
        id: `stretch_new_${count}_${minutes}`,
        serviceType: "ストレッチ",
        label: `新価格 ${count}回 ${minutes}分 ${STRETCH_NEW_TICKET_SALES[
          count
        ][minutes].toLocaleString()}円`,
        menuName: `ストレッチ新 ${count}回 ${minutes}分`,
        amount: STRETCH_NEW_TICKET_SALES[count][minutes],
        accountingType: "前受金",
      });

      presets.push({
        id: `stretch_old_${count}_${minutes}`,
        serviceType: "ストレッチ",
        label: `旧価格 ${count}回 ${minutes}分 ${STRETCH_OLD_TICKET_SALES[
          count
        ][minutes].toLocaleString()}円`,
        menuName: `ストレッチ旧 ${count}回 ${minutes}分`,
        amount: STRETCH_OLD_TICKET_SALES[count][minutes],
        accountingType: "前受金",
      });

      presets.push({
        id: `stretch_consume_new_${count}_${minutes}`,
        serviceType: "ストレッチ",
        label: `消化用 新価格 ${count}回 ${minutes}分 ${STRETCH_NEW_CONSUME_UNIT[
          count
        ][minutes].toLocaleString()}円`,
        menuName: `ストレッチ消化 新 ${count}回 ${minutes}分`,
        amount: STRETCH_NEW_CONSUME_UNIT[count][minutes],
        accountingType: "回数券消化",
      });

      presets.push({
        id: `stretch_consume_old_${count}_${minutes}`,
        serviceType: "ストレッチ",
        label: `消化用 旧価格 ${count}回 ${minutes}分 ${STRETCH_OLD_CONSUME_UNIT[
          count
        ][minutes].toLocaleString()}円`,
        menuName: `ストレッチ消化 旧 ${count}回 ${minutes}分`,
        amount: STRETCH_OLD_CONSUME_UNIT[count][minutes],
        accountingType: "回数券消化",
      });
    });
  });

  return presets;
}

const PRICE_PRESETS: PricePreset[] = [
  {
    id: "trial_weekday",
    serviceType: "トレーニング",
    label: "初回体験 5,500円",
    menuName: "初回体験",
    amount: 5500,
  },
  {
    id: "trial_holiday",
    serviceType: "トレーニング",
    label: "初回体験（土日祝）6,500円",
    menuName: "初回体験（土日祝）",
    amount: 6500,
  },
  {
    id: "diet16_m50",
    serviceType: "トレーニング",
    label: "ダイエット16回 M50 11,000円",
    menuName: "ダイエット16回 マンツーマン50分",
    amount: 11000,
  },
  {
    id: "diet16_m80",
    serviceType: "トレーニング",
    label: "ダイエット16回 M80 17,600円",
    menuName: "ダイエット16回 マンツーマン80分",
    amount: 17600,
  },
  {
    id: "diet16_p50",
    serviceType: "トレーニング",
    label: "ダイエット16回 P50 7,700円",
    menuName: "ダイエット16回 ペア50分",
    amount: 7700,
  },
  {
    id: "diet16_p80",
    serviceType: "トレーニング",
    label: "ダイエット16回 P80 12,320円",
    menuName: "ダイエット16回 ペア80分",
    amount: 12320,
  },
  {
    id: "diet24_m50",
    serviceType: "トレーニング",
    label: "ダイエット24回 M50 10,450円",
    menuName: "ダイエット24回 マンツーマン50分",
    amount: 10450,
  },
  {
    id: "diet24_m80",
    serviceType: "トレーニング",
    label: "ダイエット24回 M80 16,720円",
    menuName: "ダイエット24回 マンツーマン80分",
    amount: 16720,
  },
  {
    id: "diet24_p50",
    serviceType: "トレーニング",
    label: "ダイエット24回 P50 7,315円",
    menuName: "ダイエット24回 ペア50分",
    amount: 7315,
  },
  {
    id: "diet24_p80",
    serviceType: "トレーニング",
    label: "ダイエット24回 P80 11,700円",
    menuName: "ダイエット24回 ペア80分",
    amount: 11700,
  },
  {
    id: "diet32_m50",
    serviceType: "トレーニング",
    label: "ダイエット32回 M50 10,230円",
    menuName: "ダイエット32回 マンツーマン50分",
    amount: 10230,
  },
  {
    id: "diet32_m80",
    serviceType: "トレーニング",
    label: "ダイエット32回 M80 16,370円",
    menuName: "ダイエット32回 マンツーマン80分",
    amount: 16370,
  },
  {
    id: "diet32_p50",
    serviceType: "トレーニング",
    label: "ダイエット32回 P50 7,160円",
    menuName: "ダイエット32回 ペア50分",
    amount: 7160,
  },
  {
    id: "diet32_p80",
    serviceType: "トレーニング",
    label: "ダイエット32回 P80 11,460円",
    menuName: "ダイエット32回 ペア80分",
    amount: 11460,
  },
  {
    id: "body2_m_old",
    serviceType: "トレーニング",
    label: "ボディメイク旧価格 月2 M 8,000円",
    menuName: "ボディメイク旧価格 月2 マンツーマン",
    amount: 8000,
  },
  {
    id: "body4_m_old",
    serviceType: "トレーニング",
    label: "ボディメイク旧価格 月4 M 7,700円",
    menuName: "ボディメイク旧価格 月4 マンツーマン",
    amount: 7700,
  },
  {
    id: "body_unlimited_m_old",
    serviceType: "トレーニング",
    label: "ボディメイク旧価格 無制限 M 7,500円",
    menuName: "ボディメイク旧価格 無制限 マンツーマン",
    amount: 7500,
  },
  {
    id: "body2_m",
    serviceType: "トレーニング",
    label: "ボディメイク月2 M 17,600円",
    menuName: "ボディメイク月2 マンツーマン",
    amount: 17600,
  },
  {
    id: "body2_p",
    serviceType: "トレーニング",
    label: "ボディメイク月2 P 12,320円",
    menuName: "ボディメイク月2 ペア",
    amount: 12320,
  },
  {
    id: "body4_m",
    serviceType: "トレーニング",
    label: "ボディメイク月4 M 33,880円",
    menuName: "ボディメイク月4 マンツーマン",
    amount: 33880,
  },
  {
    id: "body4_p",
    serviceType: "トレーニング",
    label: "ボディメイク月4 P 23,716円",
    menuName: "ボディメイク月4 ペア",
    amount: 23716,
  },
  {
    id: "senior30",
    serviceType: "トレーニング",
    label: "シニア30分 3,960円",
    menuName: "シニアトレーニング 30分",
    amount: 3960,
  },
  {
    id: "senior50",
    serviceType: "トレーニング",
    label: "シニア50分 6,600円",
    menuName: "シニアトレーニング 50分",
    amount: 6600,
  },
  {
    id: "training_nomination_fee",
    serviceType: "トレーニング",
    label: "指名料 1,000円",
    menuName: "指名料",
        amount: 1000,
  },
  ...buildStretchPresets(),
  {
    id: "manual_other_training",
    serviceType: "トレーニング",
    label: "その他（手入力）",
    menuName: "その他",
    amount: 0,
  },
];

function findPricePresetById(id: string) {
  return PRICE_PRESETS.find((preset) => preset.id === id) || null;
}

function formatCurrency(value: number) {
  return `¥${Number(value || 0).toLocaleString()}`;
}

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getCurrentMonthString() {
  return todayString().slice(0, 7);
}

function formatDateJP(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatMonthJP(value: string) {
  if (!value) return "—";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${Number(year)}年${Number(month)}月`;
}

function addDaysString(baseDate: string, days: number) {
  const d = new Date(baseDate);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function trimmed(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[‐-‒–—―ー－]/g, "-")
    .toLowerCase();
}

function getQueryParam(name: string) {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

function detectServiceTypeFromMenu(menu?: string | null): ServiceType {
  const text = String(menu || "");
  if (text.includes("ストレッチ")) return "ストレッチ";
  return "トレーニング";
}

function toCsvValue(value: string | number) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function createPaymentRow(): PaymentRow {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random()),
    saleType: "通常売上",
    paymentMethod: "現金",
    amount: "",
    presetId: "",
  };
}

function detectMinutesFromText(text?: string | null): 40 | 60 | 80 | 120 | null {
  const raw = String(text || "");
  const match = raw.match(/(40|60|80|120)\s*分/);
  if (!match) return null;

  const value = Number(match[1]);
  if (value === 40 || value === 60 || value === 80 || value === 120) return value;
  return null;
}

function detectCountFromText(text?: string | null): 4 | 8 | 12 | null {
  const raw = String(text || "");
  const match = raw.match(/(4|8|12)\s*回/);
  if (!match) return null;

  const value = Number(match[1]);
  if (value === 4 || value === 8 || value === 12) return value;
  return null;
}

function detectPriceVersionFromText(text?: string | null): "new" | "old" | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;

  if (
    normalized.includes("旧価格") ||
    normalized.includes("ストレッチ旧") ||
    normalized.includes("消化旧") ||
    normalized.includes("旧")
  ) {
    return "old";
  }

  if (
    normalized.includes("新価格") ||
    normalized.includes("ストレッチ新") ||
    normalized.includes("消化新") ||
    normalized.includes("新")
  ) {
    return "new";
  }

  return null;
}

function buildConsumePresetId(
  version: "new" | "old",
  count: 4 | 8 | 12,
  minutes: 40 | 60 | 80 | 120
) {
  return `stretch_consume_${version}_${count}_${minutes}`;
}

function detectRecommendedConsumePresetId(params: {
  serviceType: ServiceType;
  accountingType: AccountingType;
  menu?: string | null;
  note?: string | null;
}) {
  if (params.serviceType !== "ストレッチ") return "";
  if (params.accountingType !== "回数券消化") return "";

  const sourceText = `${params.menu || ""} ${params.note || ""}`;
  const minutes = detectMinutesFromText(sourceText);
  const version = detectPriceVersionFromText(sourceText);
  const count = detectCountFromText(sourceText);

  if (!minutes || !version || !count) return "";
  return buildConsumePresetId(version, count, minutes);
}

function resolveConsumePresetFromContext(params: {
  serviceType: ServiceType;
  saleType: AccountingType;
  presetId?: string;
  menuName?: string | null;
  note?: string | null;
}): PricePreset | null {
  if (params.serviceType !== "ストレッチ") return null;
  if (params.saleType !== "回数券消化") return null;

  if (params.presetId) {
    const preset = findPricePresetById(params.presetId);
    if (preset) return preset;
  }

  const inferredPresetId = detectRecommendedConsumePresetId({
    serviceType: params.serviceType,
    accountingType: params.saleType,
    menu: params.menuName,
    note: params.note,
  });

  if (!inferredPresetId) return null;
  return findPricePresetById(inferredPresetId);
}

function parseTicketIssuePresetInfo(
  preset?: PricePreset | null
): TicketIssuePresetInfo | null {
  function parseTrainingTicketIssuePresetInfo(
  preset?: PricePreset | null
): TicketIssuePresetInfo | null {
  if (!preset) return null;
  if (preset.serviceType !== "トレーニング") return null;
  if (preset.accountingType !== "前受金") return null;

  const count =
    detectCountFromText(preset.label) ||
    detectCountFromText(preset.menuName);

  if (!count) return null;

  return {
    priceVersion: "新",
    ticketCount: count,
    minutes: 60,
  };
}
  if (!preset) return null;
  if (preset.serviceType !== "ストレッチ") return null;
  if (preset.accountingType !== "前受金") return null;

  const match = preset.id.match(/^stretch_(new|old)_(4|8|12)_(40|60|80|120)$/);
  if (!match) return null;

  return {
    priceVersion: match[1] === "new" ? "新" : "旧",
    ticketCount: Number(match[2]) as 4 | 8 | 12,
    minutes: Number(match[3]) as 40 | 60 | 80 | 120,
  };
}

function mergeNoteLines(current: string, lines: Array<string | null | undefined>) {
  const baseLines = current
    .split("\n")
    .map((line) => trimmed(line))
    .filter(Boolean);

  const merged = [...baseLines];
  const exists = new Set(baseLines);

  for (const line of lines) {
    const v = trimmed(line);
    if (!v) continue;
    if (exists.has(v)) continue;
    merged.push(v);
    exists.add(v);
  }

  return merged.join("\n");
}

function buildCategory(
  serviceType: ServiceType,
  accountingType: AccountingType,
  paymentMethod: PaymentMethod
): SaleCategory {
  if (accountingType === "前受金") {
    return serviceType === "ストレッチ"
      ? "ストレッチ前受金"
      : "トレーニング前受金";
  }

  if (accountingType === "回数券消化") {
    return serviceType === "ストレッチ"
      ? "ストレッチ回数券消化"
      : "トレーニング回数券消化";
  }

  if (serviceType === "ストレッチ") {
    if (paymentMethod === "現金") return "ストレッチ現金";
    if (paymentMethod === "カード") return "ストレッチカード";
    if (paymentMethod === "銀行振込") return "ストレッチ銀行振込";
    return "ストレッチその他";
  }

  if (paymentMethod === "現金") return "トレーニング現金";
  if (paymentMethod === "カード") return "トレーニングカード";
  if (paymentMethod === "銀行振込") return "トレーニング銀行振込";
  return "トレーニングその他";
}

function normalizeServiceType(value?: string | null): ServiceType {
  if (value === "ストレッチ") return "ストレッチ";
  return "トレーニング";
}

function normalizeAccountingType(value?: string | null): AccountingType {
  if (value === "前受金") return "前受金";
  if (value === "回数券消化") return "回数券消化";
  return "通常売上";
}

function normalizePaymentMethod(value?: string | null): PaymentMethod {
  if (
    value === "現金" ||
    value === "カード" ||
    value === "銀行振込" ||
    value === "その他"
  ) {
    return value;
  }

  return "現金";
}

function rowToSale(row: SupabaseSaleRow): Sale {
  const serviceType = normalizeServiceType(row.menu_type);
  const accountingType = normalizeAccountingType(row.sale_type);
  const paymentMethod = normalizePaymentMethod(row.payment_method);
  const amount = Number(row.amount || 0);
  const matchedMenuName = row.memo?.match(/メニュー名:\s*(.+)/)?.[1];

  return {
    id: String(row.id),
    date: row.sale_date || todayString(),
    customerId:
      row.customer_id === null || row.customer_id === undefined
        ? null
        : String(row.customer_id),
    customerName: row.customer_name || "未設定",
    menuName:
      matchedMenuName ||
      (serviceType === "ストレッチ" ? "ストレッチ" : "トレーニング"),
    staff: row.staff_name || "未設定",
    storeName: row.store_name || "未設定",
    serviceType,
    accountingType,
    paymentMethod,
    amount,
    category: buildCategory(serviceType, accountingType, paymentMethod),
    note: row.memo || "",
    createdAt: row.created_at || new Date().toISOString(),
    reservationId: row.reservation_id ?? null,
  };
}

function buildDailySummaryRows(sales: Sale[]): DailySummaryRow[] {
  const grouped: Record<string, DailySummaryRow> = {};

  sales.forEach((sale) => {
    const date = sale.date || todayString();

    if (!grouped[date]) {
      grouped[date] = {
        date,
        netSalesTotal: 0,
        advanceTotal: 0,
        grandTotal: 0,
      };
    }

    const amount = Number(sale.amount || 0);

    if (sale.accountingType === "前受金") {
      grouped[date].advanceTotal += amount;
    } else {
      grouped[date].netSalesTotal += amount;
    }

    grouped[date].grandTotal =
      grouped[date].netSalesTotal + grouped[date].advanceTotal;
  });

  return Object.values(grouped).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function filterSalesByMonth(sales: Sale[], selectedMonth: string) {
  if (!selectedMonth) return sales;
  return sales.filter((sale) => sale.date?.startsWith(selectedMonth));
}

function buildMonthlySummaryRows(
  sales: Sale[],
  keyGetter: (sale: Sale) => string
): MonthlySummaryRow[] {
  const grouped: Record<string, MonthlySummaryRow> = {};

  sales.forEach((sale) => {
    const name = trimmed(keyGetter(sale)) || "未設定";

    if (!grouped[name]) {
      grouped[name] = {
        name,
        netSalesTotal: 0,
        advanceTotal: 0,
        grandTotal: 0,
        count: 0,
      };
    }

    const amount = Number(sale.amount || 0);

    if (sale.accountingType === "前受金") {
      grouped[name].advanceTotal += amount;
    } else {
      grouped[name].netSalesTotal += amount;
    }

    grouped[name].grandTotal =
      grouped[name].netSalesTotal + grouped[name].advanceTotal;
    grouped[name].count += 1;
  });

  return Object.values(grouped).sort((a, b) => b.grandTotal - a.grandTotal);
}

async function fetchFirstActiveTicket(
  targetCustomerId: string,
  targetServiceType: ServiceType
): Promise<TicketRow | null> {
  const { data, error } = await supabase
    .from("customer_tickets")
    .select(
      "id, customer_id, customer_name, ticket_name, service_type, total_count, remaining_count, purchase_date, expiry_date, status, note, created_at"
    )
    .eq("customer_id", Number(targetCustomerId))
    .eq("service_type", targetServiceType)
    .gt("remaining_count", 0)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    throw new Error(`回数券取得エラー: ${error.message}`);
  }

  const rows = ((data as TicketRow[] | null) || []).filter(
    (row) => Number(row.remaining_count || 0) > 0
  );

  return rows[0] || null;
}
async function consumeCustomerTicket(params: {
  customerId: string;
  customerName: string;
  serviceType: ServiceType;
  usedDate: string;
  reservationId?: number | null;
  ticketPreset?: PricePreset | null;
}): Promise<TicketConsumeResult | null> {
  const ticket = await fetchFirstActiveTicket(
    params.customerId,
    params.serviceType
  );

  if (!ticket) {
    return null;
  }

  const beforeCount = Number(ticket.remaining_count || 0);

  if (beforeCount <= 0) {
    return null;
  }

  const afterCount = beforeCount - 1;

  const updatePayload: {
    remaining_count: number;
    status?: string;
  } = {
    remaining_count: afterCount,
  };

  if (afterCount <= 0) {
    updatePayload.status = "終了";
  }

  const { error: updateError } = await supabase
    .from("customer_tickets")
    .update(updatePayload)
    .eq("id", ticket.id);

  if (updateError) {
    throw new Error(`回数券更新エラー: ${updateError.message}`);
  }

  const ticketPresetLabel = params.ticketPreset?.label || "";
  const ticketPresetId = params.ticketPreset?.id || "";

  const usageMemo = [
    ticketPresetLabel ? `消化単価:${ticketPresetLabel}` : "",
    ticketPresetId ? `preset:${ticketPresetId}` : "",
  ]
    .filter(Boolean)
    .join(" / ");

  const { error: usageError } = await supabase
    .from("ticket_usages")
    .insert({
      ticket_id: ticket.id,
      customer_id: Number(params.customerId),
      customer_name: params.customerName,
      ticket_name: ticket.ticket_name,
      service_type: params.serviceType,
      used_date: params.usedDate,
      before_count: beforeCount,
      after_count: afterCount,
      reservation_id: params.reservationId ?? null,
      note: usageMemo || null,
    });

  if (usageError) {
    throw new Error(`回数券消化履歴エラー: ${usageError.message}`);
  }

  return {
    ticketId: ticket.id,
    ticketName: ticket.ticket_name || "回数券",
    beforeCount,
    afterCount,
  };
}

export default function SalesPage() {
  const router = useRouter();
    const [windowWidth, setWindowWidth] = useState(1200);

  const isMobile = windowWidth < 760;
  const isTablet = windowWidth >= 760 && windowWidth < 1100;

  useEffect(() => {
    const update = () => {
      if (typeof window !== "undefined") {
        setWindowWidth(window.innerWidth);
      }
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  const [date, setDate] = useState(todayString());
  const [selectedMonth, setSelectedMonth] = useState(
    getCurrentMonthString()
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [ticketUsages, setTicketUsages] = useState<TicketUsageRow[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");

  const [serviceType, setServiceType] =
    useState<ServiceType>("トレーニング");

  const [staff, setStaff] = useState("山口");
  const [storeName, setStoreName] = useState("江戸堀");

  const [note, setNote] = useState("");
  const [reservationId, setReservationId] = useState<number | null>(null);

  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([
    createPaymentRow(),
  ]);

  const [loading, setLoading] = useState(false);
  const [fetchingSales, setFetchingSales] = useState(true);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");

  const monthlySales = useMemo(() => {
    return filterSalesByMonth(sales, selectedMonth);
  }, [sales, selectedMonth]);

  const dailySummaryRows = useMemo(() => {
    return buildDailySummaryRows(sales);
  }, [sales]);

  const selectedMonthSalesTotal = useMemo(() => {
    return monthlySales.reduce((sum, sale) => {
      if (sale.accountingType === "前受金") return sum;
      return sum + Number(sale.amount || 0);
    }, 0);
  }, [monthlySales]);

  const selectedMonthAdvanceTotal = useMemo(() => {
    return monthlySales.reduce((sum, sale) => {
      if (sale.accountingType !== "前受金") return sum;
      return sum + Number(sale.amount || 0);
    }, 0);
  }, [monthlySales]);

  const selectedMonthGrandTotal = useMemo(() => {
    return (
      selectedMonthSalesTotal +
      selectedMonthAdvanceTotal
    );
  }, [
    selectedMonthSalesTotal,
    selectedMonthAdvanceTotal,
  ]);

  const storeMonthlyRows = useMemo(() => {
    return buildMonthlySummaryRows(
      monthlySales,
      (sale) => sale.storeName
    );
  }, [monthlySales]);

  const staffMonthlyRows = useMemo(() => {
    return buildMonthlySummaryRows(
      monthlySales,
      (sale) => sale.staff
    );
  }, [monthlySales]);

  const filteredSales = useMemo(() => {
    const keyword = normalizeText(searchKeyword);

    if (!keyword) return monthlySales;

    return monthlySales.filter((sale) => {
      const target = normalizeText(`
        ${sale.customerName}
        ${sale.menuName}
        ${sale.staff}
        ${sale.storeName}
        ${sale.note}
      `);

      return target.includes(keyword);
    });
  }, [monthlySales, searchKeyword]);

  useEffect(() => {
    const loggedIn = localStorage.getItem("gymup_logged_in");
    const role = localStorage.getItem("gymup_user_role");

    if (loggedIn !== "true" || !role) {
      router.push("/login/staff");
      return;
    }

    const staffName = localStorage.getItem(
      "gymup_current_staff_name"
    );

    if (staffName) {
      setStaff(staffName);
    }
  }, [router]);

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setCustomers((data as Customer[]) || []);
    }

    void fetchCustomers();
  }, []);

  async function fetchSales() {
    setFetchingSales(true);

    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("sale_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const rows = ((data as SupabaseSaleRow[] | null) || []).map(
        rowToSale
      );

      setSales(rows);

      const { data: usageData, error: usageError } = await supabase
        .from("ticket_usages")
        .select(
          "id, reservation_id, ticket_id, customer_id, customer_name, ticket_name, service_type, used_date, before_count, after_count"
        )
        .order("used_date", { ascending: false });

      if (usageError) {
        throw usageError;
      }

      setTicketUsages(
        ((usageData as TicketUsageRow[] | null) || [])
      );
    } catch (e) {
      console.error(e);
      setErrorMessage("売上取得に失敗しました。");
    } finally {
      setFetchingSales(false);
    }
  }

  useEffect(() => {
    void fetchSales();
  }, []);

  useEffect(() => {
    const reservationIdParam = getQueryParam("reservationId");
    const customerIdParam = getQueryParam("customerId");
    const customerNameParam = getQueryParam("customerName");
    const menuParam = getQueryParam("menu");
    const staffParam = getQueryParam("staff");
    const storeParam = getQueryParam("store");
    const dateParam = getQueryParam("date");
    const memoParam = getQueryParam("memo");

    if (!reservationIdParam) {
      return;
    }

    async function applyReservationPrefill() {
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select("*")
          .eq("id", Number(reservationIdParam))
          .single();

        if (error) {
          throw error;
        }

        const reservation =
          (data as ReservationPrefillRow | null) || null;

        if (!reservation) return;

        const nextCustomerId =
          reservation.customer_id !== null &&
          reservation.customer_id !== undefined
            ? String(reservation.customer_id)
            : customerIdParam || "";

        const nextCustomerName =
          reservation.customer_name ||
          customerNameParam ||
          "";

        const nextMenu = reservation.menu || menuParam || "";

        const nextServiceType =
          detectServiceTypeFromMenu(nextMenu);

        const nextDate =
          reservation.date || dateParam || todayString();

        const mergedNote = mergeNoteLines(
          "",
          [
            memoParam || "",
            reservation.memo || "",
            nextMenu ? `メニュー名: ${nextMenu}` : "",
            reservationIdParam
              ? `予約ID: ${reservationIdParam}`
              : "",
          ]
        );

        setReservationId(Number(reservationIdParam));
        setCustomerId(nextCustomerId);
        setCustomerName(nextCustomerName);
        setServiceType(nextServiceType);
        setDate(nextDate);
        setSelectedMonth(nextDate.slice(0, 7));
        setNote(mergedNote);

        if (reservation.staff_name) {
          setStaff(reservation.staff_name);
        } else if (staffParam) {
          setStaff(staffParam);
        }

        if (reservation.store_name) {
          setStoreName(reservation.store_name);
        } else if (storeParam) {
          setStoreName(storeParam);
        }

        const recommendedPresetId =
          detectRecommendedConsumePresetId({
            serviceType: nextServiceType,
            accountingType: "回数券消化",
            menu: nextMenu,
            note: mergedNote,
          });

        setPaymentRows([
          {
            id:
              typeof crypto !== "undefined" &&
              crypto.randomUUID
                ? crypto.randomUUID()
                : String(Date.now()),
            saleType: "回数券消化",
            paymentMethod: "現金",
            amount: "",
            presetId: recommendedPresetId,
          },
        ]);
      } catch (e) {
        console.error(e);
      }
    }

    void applyReservationPrefill();
  }, []);
    function handlePaymentRowChange(
    rowId: string,
    patch: Partial<PaymentRow>
  ) {
    setPaymentRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const nextRow = {
          ...row,
          ...patch,
        };

        if (patch.presetId !== undefined) {
          const preset = findPricePresetById(patch.presetId);

          if (preset) {
            nextRow.amount = String(preset.amount || "");

            if (preset.accountingType) {
              nextRow.saleType = preset.accountingType;
            }
          }
        }

        return nextRow;
      })
    );
  }

  function addPaymentRow() {
    setPaymentRows((prev) => [
      ...prev,
      createPaymentRow(),
    ]);
  }

  function removePaymentRow(rowId: string) {
    setPaymentRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== rowId);
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!customerName.trim()) {
        throw new Error("顧客名を入力してください。");
      }

      const validRows = paymentRows.filter(
        (row) => Number(row.amount || 0) > 0
      );

      if (validRows.length === 0) {
        throw new Error("金額を入力してください。");
      }

      const createdSales: Sale[] = [];

      for (const row of validRows) {
        const preset = findPricePresetById(row.presetId);

        const amount = Number(row.amount || 0);

        const accountingType = row.saleType;

        const paymentMethod = row.paymentMethod;

        const menuName =
          preset?.menuName ||
          note.match(/メニュー名:\s*(.+)/)?.[1] ||
          (serviceType === "ストレッチ"
            ? "ストレッチ"
            : "トレーニング");

        const category = buildCategory(
          serviceType,
          accountingType,
          paymentMethod
        );

        const mergedNote = mergeNoteLines(note, [
          menuName ? `メニュー名: ${menuName}` : "",
          preset?.label ? `preset:${preset.label}` : "",
        ]);

        const insertPayload = {
          customer_id: customerId ? Number(customerId) : null,
          customer_name: customerName,
          sale_date: date,
          menu_type: serviceType,
          sale_type: accountingType,
          payment_method: paymentMethod,
          amount,
          staff_name: staff,
          store_name: storeName,
          reservation_id: reservationId,
          memo: mergedNote || null,
        };

        const { data, error } = await supabase
          .from("sales")
          .insert(insertPayload)
          .select("*")
          .single();

        if (error) {
          throw new Error(`売上登録エラー: ${error.message}`);
        }

        const insertedSale = rowToSale(
          data as SupabaseSaleRow
        );

        createdSales.push(insertedSale);

        const stretchTicketIssueInfo =
  parseTicketIssuePresetInfo(preset);
  function parseTrainingTicketIssuePresetInfo(
  preset?: PricePreset | null
): TicketIssuePresetInfo | null {
  if (!preset) return null;
  if (preset.serviceType !== "トレーニング") return null;
  if (preset.accountingType !== "前受金") return null;

  const count =
    detectCountFromText(preset.label) ||
    detectCountFromText(preset.menuName);

  if (!count) return null;

  return {
    priceVersion: "新",
    ticketCount: count,
    minutes: 60,
  };
}

const trainingTicketIssueInfo =
  parseTrainingTicketIssuePresetInfo(preset);

const ticketIssueInfo =
  stretchTicketIssueInfo || trainingTicketIssueInfo;

        if (
          ticketIssueInfo &&
          accountingType === "前受金"
        ) {
          const expiryDate = addDaysString(
            date,
            180
          );

          const { error: ticketInsertError } =
            await supabase
              .from("customer_tickets")
              .insert({
                customer_id: customerId
                  ? Number(customerId)
                  : null,
                customer_name: customerName,
                ticket_name: preset?.label || menuName,
                service_type: "ストレッチ",
                total_count:
                  ticketIssueInfo.ticketCount,
                remaining_count:
                  ticketIssueInfo.ticketCount,
                purchase_date: date,
                expiry_date: expiryDate,
                status: "有効",
                note: mergeNoteLines("", [
                  `価格区分:${ticketIssueInfo.priceVersion}`,
                  `分数:${ticketIssueInfo.minutes}`,
                  `回数:${ticketIssueInfo.ticketCount}`,
                ]),
              });

          if (ticketInsertError) {
            throw new Error(
              `回数券発行エラー: ${ticketInsertError.message}`
            );
          }
        }

        if (
          accountingType === "回数券消化" &&
          customerId
        ) {
          const consumePreset =
            resolveConsumePresetFromContext({
              serviceType,
              saleType: accountingType,
              presetId: row.presetId,
              menuName,
              note: mergedNote,
            });

          const consumeResult =
            await consumeCustomerTicket({
              customerId,
              customerName,
              serviceType,
              usedDate: date,
              reservationId,
              ticketPreset: consumePreset,
            });

          if (!consumeResult) {
            throw new Error(
              "使用可能な回数券が見つかりません。"
            );
          }
        }
      }

      if (reservationId) {
        await supabase
          .from("reservations")
          .update({
            reservation_status: "売上済",
          })
          .eq("id", reservationId);
      }

      setSales((prev) => [
        ...createdSales,
        ...prev,
      ]);

      setMessage("売上を登録しました。");

      setPaymentRows([createPaymentRow()]);

      setNote("");

      if (!reservationId) {
        setCustomerId("");
        setCustomerName("");
      }

      await fetchSales();
    } catch (e) {
      console.error(e);

      if (e instanceof Error) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage("売上登録に失敗しました。");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSale(
    saleId: string
  ) {
    const ok = window.confirm(
      "この売上を削除しますか？"
    );

    if (!ok) return;

    try {
      const targetSale = sales.find(
        (sale) => sale.id === saleId
      );

      if (!targetSale) {
        throw new Error("対象売上が見つかりません。");
      }

      if (
        targetSale.accountingType === "回数券消化" &&
        targetSale.reservationId
      ) {
        const targetUsage = ticketUsages.find(
          (usage) =>
            usage.reservation_id ===
            targetSale.reservationId
        );

        if (targetUsage?.ticket_id) {
          const beforeCount = Number(
            targetUsage.before_count || 0
          );

          const { error: rollbackError } =
            await supabase
              .from("customer_tickets")
              .update({
                remaining_count: beforeCount,
                status: "有効",
              })
              .eq("id", targetUsage.ticket_id);

          if (rollbackError) {
            throw new Error(
              `回数券戻しエラー: ${rollbackError.message}`
            );
          }

          const { error: usageDeleteError } =
            await supabase
              .from("ticket_usages")
              .delete()
              .eq("id", targetUsage.id);

          if (usageDeleteError) {
            throw new Error(
              `消化履歴削除エラー: ${usageDeleteError.message}`
            );
          }
        }
      }

      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", saleId);

      if (error) {
        throw new Error(
          `売上削除エラー: ${error.message}`
        );
      }

      setSales((prev) =>
        prev.filter((sale) => sale.id !== saleId)
      );

      await fetchSales();
    } catch (e) {
      console.error(e);

      if (e instanceof Error) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage("削除に失敗しました。");
      }
    }
  }

  function exportCsv() {
    const header = [
      "日付",
      "顧客名",
      "メニュー",
      "担当",
      "店舗",
      "サービス",
      "会計区分",
      "支払方法",
      "金額",
      "メモ",
    ];

    const rows = filteredSales.map((sale) => [
      sale.date,
      sale.customerName,
      sale.menuName,
      sale.staff,
      sale.storeName,
      sale.serviceType,
      sale.accountingType,
      sale.paymentMethod,
      sale.amount,
      sale.note,
    ]);

    const csv = [
      header.map(toCsvValue).join(","),
      ...rows.map((row) =>
        row.map(toCsvValue).join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `sales_${selectedMonth}.csv`;

    link.click();

    window.URL.revokeObjectURL(url);
  }

  const totalStyle: CSSProperties = {
    fontWeight: 900,
    fontSize: 28,
    color: "#fff",
  };
    const styles = createStyles(isMobile, isTablet);

  if (fetchingSales) {
    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          {!isMobile && (
            <aside style={styles.sidebar}>
              <div style={styles.sideLogo}>G</div>
            </aside>
          )}

          <section style={styles.mainPanel}>
            <div style={styles.card}>読み込み中...</div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        {!isMobile && (
          <aside style={styles.sidebar}>
            <div style={styles.sideLogo}>G</div>

            <nav style={styles.sideNav}>
              <Link href="/" style={styles.sideItem}>⌂</Link>
              <Link href="/reservation" style={styles.sideItem}>◎</Link>
              <Link href="/customer" style={styles.sideItem}>☻</Link>
              <Link href="/sales" style={styles.sideItemActive}>¥</Link>
              <Link href="/accounting" style={styles.sideItem}>≡</Link>
            </nav>

            <div style={styles.sideBottom}>↩</div>
          </aside>
        )}

        <section style={styles.mainPanel}>
          <div style={styles.header}>
            <div>
              <p style={styles.kicker}>GYMUP CRM / SALES</p>
              <h1 style={styles.title}>売上管理</h1>
              <p style={styles.lead}>
                予約連動・回数券消化・月別集計・店舗別集計・担当者別集計
              </p>
            </div>

            <div style={styles.headerActions}>
              <Link href="/" style={styles.secondaryButton}>
                管理TOP
              </Link>

              <button
                type="button"
                onClick={exportCsv}
                style={styles.primaryMiniButton}
              >
                CSV出力
              </button>
            </div>
          </div>

          {message ? (
            <div style={styles.successBox}>{message}</div>
          ) : null}

          {errorMessage ? (
            <div style={styles.errorBox}>{errorMessage}</div>
          ) : null}

          <section style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <span>Selected Month</span>
              <strong>{formatCurrency(selectedMonthGrandTotal)}</strong>
              <small>{formatMonthJP(selectedMonth)} 合計</small>
            </div>

            <div style={styles.kpiCard}>
              <span>Net Sales</span>
              <strong>{formatCurrency(selectedMonthSalesTotal)}</strong>
              <small>通常売上＋回数券消化</small>
            </div>

            <div style={styles.kpiCard}>
              <span>Advance</span>
              <strong>{formatCurrency(selectedMonthAdvanceTotal)}</strong>
              <small>前受金</small>
            </div>

            <div style={styles.kpiCard}>
              <span>Count</span>
              <strong>{monthlySales.length}件</strong>
              <small>選択月の売上件数</small>
            </div>
          </section>

          <section style={styles.monthlyCard}>
            <div style={styles.monthlyHeader}>
              <div>
                <h2 style={styles.sectionTitle}>月別・店舗別・担当者別 集計</h2>
                <p style={styles.sectionLead}>
                  月を選ぶと、店舗別・担当者別の売上が自動で切り替わります。
                </p>
              </div>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={styles.monthInput}
              />
            </div>

            <div style={styles.monthlySummaryGrid}>
              <div style={styles.summaryBox}>
                <h3 style={styles.summaryTitle}>店舗別売上</h3>

                {storeMonthlyRows.length === 0 ? (
                  <div style={styles.emptyBox}>店舗別データがありません</div>
                ) : (
                  <div style={styles.summaryList}>
                    {storeMonthlyRows.map((row) => (
                      <div key={row.name} style={styles.summaryItem}>
                        <div>
                          <strong>{row.name}</strong>
                          <p>
                            売上 {formatCurrency(row.netSalesTotal)} / 前受金{" "}
                            {formatCurrency(row.advanceTotal)}
                          </p>
                        </div>

                        <div style={styles.summaryAmount}>
                          <strong>{formatCurrency(row.grandTotal)}</strong>
                          <small>{row.count}件</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.summaryBox}>
                <h3 style={styles.summaryTitle}>担当者別売上</h3>

                {staffMonthlyRows.length === 0 ? (
                  <div style={styles.emptyBox}>担当者別データがありません</div>
                ) : (
                  <div style={styles.summaryList}>
                    {staffMonthlyRows.map((row) => (
                      <div key={row.name} style={styles.summaryItem}>
                        <div>
                          <strong>{row.name}</strong>
                          <p>
                            売上 {formatCurrency(row.netSalesTotal)} / 前受金{" "}
                            {formatCurrency(row.advanceTotal)}
                          </p>
                        </div>

                        <div style={styles.summaryAmount}>
                          <strong>{formatCurrency(row.grandTotal)}</strong>
                          <small>{row.count}件</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {reservationId ? (
            <section style={styles.noticeCard}>
              <strong>予約ID：{reservationId}</strong>
              <span>この予約に売上登録すると、予約ステータスを売上済に更新します。</span>
            </section>
          ) : null}

          <section style={styles.contentGrid}>
            <div style={styles.formCard}>
              <h2 style={styles.sectionTitle}>売上登録</h2>

              <div style={styles.formGrid}>
                <label style={styles.label}>
                  日付
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (e.target.value) {
                        setSelectedMonth(e.target.value.slice(0, 7));
                      }
                    }}
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  顧客
                  <select
                    value={customerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setCustomerId(id);

                      const customer = customers.find(
                        (item) => String(item.id) === String(id)
                      );

                      setCustomerName(customer?.name || "");
                    }}
                    style={styles.input}
                  >
                    <option value="">選択してください</option>

                    {customers.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.label}>
                  顧客名
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="顧客名"
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  サービス
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    style={styles.input}
                  >
                    {SERVICE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.label}>
                  担当
                  <select
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                    style={styles.input}
                  >
                    {STAFF_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.label}>
                  店舗
                  <select
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    style={styles.input}
                  >
                    {STORE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={styles.paymentBox}>
                <div style={styles.paymentHeader}>
                  <strong>決済</strong>

                  <button
                    type="button"
                    onClick={addPaymentRow}
                    style={styles.addButton}
                  >
                    ＋追加
                  </button>
                </div>

                {paymentRows.map((payment) => (
                  <div key={payment.id} style={styles.paymentRow}>
                    <select
                      value={payment.presetId}
                      onChange={(e) =>
                        handlePaymentRowChange(payment.id, {
                          presetId: e.target.value,
                        })
                      }
                      style={styles.input}
                    >
                      <option value="">プリセットなし</option>

                      {PRICE_PRESETS.filter(
                        (preset) => preset.serviceType === serviceType
                      ).map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={payment.saleType}
                      onChange={(e) =>
                        handlePaymentRowChange(payment.id, {
                          saleType: e.target.value as AccountingType,
                        })
                      }
                      style={styles.input}
                    >
                      {ACCOUNTING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <select
                      value={payment.paymentMethod}
                      onChange={(e) =>
                        handlePaymentRowChange(payment.id, {
                          paymentMethod: e.target.value as PaymentMethod,
                        })
                      }
                      style={styles.input}
                    >
                      {PAYMENT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) =>
                        handlePaymentRowChange(payment.id, {
                          amount: e.target.value,
                        })
                      }
                      placeholder="金額"
                      style={styles.input}
                    />

                    <button
                      type="button"
                      onClick={() => removePaymentRow(payment.id)}
                      style={styles.deleteMiniButton}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>

              <label style={styles.label}>
                メモ
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="メニュー名や補足を入力"
                  style={styles.textarea}
                />
              </label>

              <div style={styles.totalBox}>
                <span>登録合計</span>
                <strong style={totalStyle}>
                  {formatCurrency(
                    paymentRows.reduce(
                      (sum, row) => sum + Number(row.amount || 0),
                      0
                    )
                  )}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={styles.primaryButton}
              >
                {loading ? "保存中..." : "売上を登録する"}
              </button>
            </div>

            <div style={styles.sidePanelCard}>
              <h2 style={styles.sectionTitle}>日別集計</h2>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>日付</th>
                      <th style={styles.th}>売上</th>
                      <th style={styles.th}>前受金</th>
                      <th style={styles.th}>合計</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dailySummaryRows.map((row) => (
                      <tr key={row.date}>
                        <td style={styles.td}>{formatDateJP(row.date)}</td>
                        <td style={styles.td}>
                          {formatCurrency(row.netSalesTotal)}
                        </td>
                        <td style={styles.td}>
                          {formatCurrency(row.advanceTotal)}
                        </td>
                        <td style={styles.td}>
                          {formatCurrency(row.grandTotal)}
                        </td>
                      </tr>
                    ))}

                    {dailySummaryRows.length === 0 ? (
                      <tr>
                        <td style={styles.td} colSpan={4}>
                          集計データがありません
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section style={styles.listCard}>
            <div style={styles.listHeader}>
              <div>
                <h2 style={styles.sectionTitle}>売上一覧</h2>
                <p style={styles.sectionLead}>
                  {formatMonthJP(selectedMonth)} の売上を表示しています。
                </p>
              </div>

              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="顧客名・担当・店舗で検索"
                style={styles.searchInput}
              />
            </div>

            {isMobile ? (
              <div style={styles.mobileSaleList}>
                {filteredSales.map((sale) => (
                  <div key={sale.id} style={styles.mobileSaleCard}>
                    <div style={styles.mobileSaleTop}>
                      <div>
                        <strong>{sale.customerName}</strong>
                        <p style={styles.mobileSaleDate}>
                          {formatDateJP(sale.date)} / {sale.staff} / {sale.storeName}
                        </p>
                      </div>

                      <strong>{formatCurrency(sale.amount)}</strong>
                    </div>

                    <div style={styles.mobileSaleMeta}>
                      <span>{sale.serviceType}</span>
                      <span>{sale.accountingType}</span>
                      <span>{sale.paymentMethod}</span>
                      <span>予約ID：{sale.reservationId || "—"}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSale(sale.id)}
                      style={styles.deleteButton}
                    >
                      削除
                    </button>
                  </div>
                ))}

                {filteredSales.length === 0 ? (
                  <div style={styles.emptyBox}>売上データがありません</div>
                ) : null}
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>日付</th>
                      <th style={styles.th}>顧客</th>
                      <th style={styles.th}>サービス</th>
                      <th style={styles.th}>会計</th>
                      <th style={styles.th}>支払</th>
                      <th style={styles.th}>金額</th>
                      <th style={styles.th}>担当</th>
                      <th style={styles.th}>店舗</th>
                      <th style={styles.th}>予約ID</th>
                      <th style={styles.th}>操作</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td style={styles.td}>{formatDateJP(sale.date)}</td>
                        <td style={styles.td}>{sale.customerName}</td>
                        <td style={styles.td}>{sale.serviceType}</td>
                        <td style={styles.td}>{sale.accountingType}</td>
                        <td style={styles.td}>{sale.paymentMethod}</td>
                        <td style={styles.td}>{formatCurrency(sale.amount)}</td>
                        <td style={styles.td}>{sale.staff}</td>
                        <td style={styles.td}>{sale.storeName}</td>
                        <td style={styles.td}>{sale.reservationId || "—"}</td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            onClick={() => handleDeleteSale(sale.id)}
                            style={styles.deleteButton}
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredSales.length === 0 ? (
                      <tr>
                        <td style={styles.td} colSpan={10}>
                          売上データがありません
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function createStyles(
  isMobile: boolean,
  isTablet: boolean
): Record<string, CSSProperties> {
  const glass: CSSProperties = {
    background: "rgba(22, 26, 35, 0.68)",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
    backdropFilter: "blur(22px)",
  };

  const card: CSSProperties = {
    ...glass,
    borderRadius: isMobile ? 20 : 26,
    padding: isMobile ? 14 : 18,
  };

  return {
    page: {
      minHeight: "100vh",
      padding: isMobile ? 10 : 22,
      background:
        "radial-gradient(circle at 15% 15%, rgba(91,141,255,0.18), transparent 28%), radial-gradient(circle at 80% 65%, rgba(255,122,89,0.12), transparent 24%), linear-gradient(135deg,#070b12 0%,#101827 45%,#060a11 100%)",
      color: "#f8fafc",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflowX: "hidden",
    },

    shell: {
      minHeight: isMobile ? "auto" : "calc(100vh - 44px)",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "72px minmax(0,1fr)",
      gap: isMobile ? 0 : 16,
      maxWidth: 1500,
      margin: "0 auto",
    },

    sidebar: {
      ...glass,
      borderRadius: 28,
      padding: "14px 10px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 22,
      height: "calc(100vh - 44px)",
    },

    sideLogo: {
      width: 42,
      height: 42,
      borderRadius: 14,
      display: "grid",
      placeItems: "center",
      background: "linear-gradient(135deg,#ffffff,#94a3b8)",
      color: "#111827",
      fontWeight: 900,
    },

    sideNav: {
      display: "grid",
      gap: 14,
    },

    sideItem: {
      width: 42,
      height: 42,
      borderRadius: 14,
      display: "grid",
      placeItems: "center",
      color: "rgba(255,255,255,0.62)",
      textDecoration: "none",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.05)",
    },

    sideItemActive: {
      width: 42,
      height: 42,
      borderRadius: 14,
      display: "grid",
      placeItems: "center",
      color: "#fff",
      textDecoration: "none",
      background: "linear-gradient(135deg,#2563eb,#60a5fa)",
      boxShadow: "0 14px 30px rgba(37,99,235,0.35)",
    },

    sideBottom: {
      color: "rgba(255,255,255,0.5)",
      fontSize: 18,
    },

    mainPanel: {
      minWidth: 0,
      ...glass,
      borderRadius: isMobile ? 22 : 32,
      padding: isMobile ? 14 : isTablet ? 18 : 24,
    },

    header: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      gap: 16,
      alignItems: isMobile ? "stretch" : "center",
      marginBottom: 18,
    },

    kicker: {
      margin: 0,
      fontSize: 11,
      letterSpacing: "0.18em",
      color: "rgba(255,255,255,0.45)",
      fontWeight: 800,
    },

    title: {
      margin: "4px 0 0",
      fontSize: isMobile ? 32 : 42,
      lineHeight: 1.05,
      letterSpacing: "-0.06em",
      fontWeight: 900,
    },

    lead: {
      margin: "10px 0 0",
      color: "rgba(255,255,255,0.6)",
      fontSize: 13,
      lineHeight: 1.7,
      fontWeight: 700,
    },

    headerActions: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },

    secondaryButton: {
      minHeight: 42,
      padding: "0 16px",
      borderRadius: 14,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      textDecoration: "none",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      fontWeight: 800,
      fontSize: 13,
    },

    primaryMiniButton: {
      minHeight: 42,
      padding: "0 16px",
      borderRadius: 14,
      color: "#fff",
      background: "linear-gradient(135deg,#2563eb,#60a5fa)",
      border: "none",
      fontWeight: 900,
      cursor: "pointer",
    },

    successBox: {
      ...card,
      marginBottom: 14,
      color: "#bbf7d0",
      border: "1px solid rgba(34,197,94,0.3)",
    },

    errorBox: {
      ...card,
      marginBottom: 14,
      color: "#fecaca",
      border: "1px solid rgba(239,68,68,0.3)",
    },

    kpiGrid: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : isTablet
        ? "repeat(2, minmax(0,1fr))"
        : "repeat(4, minmax(0,1fr))",
      gap: 12,
      marginBottom: 16,
    },

    kpiCard: {
      ...card,
      display: "grid",
      gap: 8,
    },

    monthlyCard: {
      ...card,
      marginBottom: 16,
    },

    monthlyHeader: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      gap: 14,
      marginBottom: 16,
    },

    monthlySummaryGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0,1fr))",
      gap: 12,
    },

    summaryBox: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      padding: 14,
    },

    summaryTitle: {
      margin: "0 0 12px",
      fontSize: 15,
      fontWeight: 900,
    },

    summaryList: {
      display: "grid",
      gap: 10,
    },

    summaryItem: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      padding: 12,
      borderRadius: 16,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
    },

    summaryAmount: {
      textAlign: "right",
      display: "grid",
      gap: 4,
      whiteSpace: "nowrap",
    },

    monthInput: {
      minHeight: 42,
      padding: "0 14px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      fontWeight: 800,
    },

    noticeCard: {
      ...card,
      marginBottom: 16,
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      color: "#dbeafe",
    },

    contentGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.2fr) minmax(320px,0.8fr)",
      gap: 16,
      alignItems: "start",
      marginBottom: 16,
    },

    formCard: card,
    sidePanelCard: card,
    listCard: card,
    card,

    sectionTitle: {
      margin: 0,
      fontSize: 20,
      fontWeight: 900,
      letterSpacing: "-0.03em",
    },

    sectionLead: {
      margin: "6px 0 0",
      color: "rgba(255,255,255,0.56)",
      fontSize: 12,
      fontWeight: 700,
      lineHeight: 1.7,
    },

    formGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0,1fr))",
      gap: 12,
      marginTop: 16,
    },

    label: {
      display: "grid",
      gap: 7,
      fontSize: 12,
      color: "rgba(255,255,255,0.68)",
      fontWeight: 800,
      marginTop: 12,
    },

    input: {
      minHeight: 42,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      padding: "0 12px",
      outline: "none",
      boxSizing: "border-box",
      width: "100%",
    },

    textarea: {
      minHeight: 110,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      padding: 12,
      outline: "none",
      resize: "vertical",
      boxSizing: "border-box",
      width: "100%",
    },

    paymentBox: {
      marginTop: 16,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.035)",
      padding: 12,
    },

    paymentHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },

    addButton: {
      minHeight: 34,
      padding: "0 12px",
      borderRadius: 12,
      border: "none",
      background: "rgba(96,165,250,0.22)",
      color: "#dbeafe",
      fontWeight: 900,
      cursor: "pointer",
    },

    paymentRow: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "minmax(180px,1.4fr) minmax(120px,0.8fr) minmax(120px,0.8fr) minmax(110px,0.7fr) auto",
      gap: 8,
      marginTop: 8,
    },

    deleteMiniButton: {
      minHeight: 42,
      padding: "0 12px",
      borderRadius: 14,
      border: "1px solid rgba(239,68,68,0.28)",
      background: "rgba(239,68,68,0.12)",
      color: "#fecaca",
      fontWeight: 900,
      cursor: "pointer",
    },

    totalBox: {
      marginTop: 16,
      padding: 14,
      borderRadius: 18,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "rgba(37,99,235,0.16)",
      border: "1px solid rgba(96,165,250,0.20)",
    },

    primaryButton: {
      width: "100%",
      minHeight: 50,
      marginTop: 14,
      borderRadius: 16,
      border: "none",
      background: "linear-gradient(135deg,#2563eb,#60a5fa)",
      color: "#fff",
      fontSize: 15,
      fontWeight: 900,
      cursor: "pointer",
    },

    tableWrap: {
      overflowX: "auto",
      marginTop: 14,
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 680,
    },

    th: {
      textAlign: "left",
      padding: "10px 8px",
      color: "rgba(255,255,255,0.48)",
      fontSize: 12,
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      whiteSpace: "nowrap",
    },

    td: {
      padding: "12px 8px",
      color: "rgba(255,255,255,0.82)",
      fontSize: 13,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      whiteSpace: "nowrap",
    },

    listHeader: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      gap: 12,
      alignItems: isMobile ? "stretch" : "center",
    },

    searchInput: {
      minHeight: 42,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      padding: "0 12px",
      minWidth: isMobile ? "100%" : 260,
    },

    deleteButton: {
      minHeight: 34,
      padding: "0 12px",
      borderRadius: 12,
      border: "1px solid rgba(239,68,68,0.28)",
      background: "rgba(239,68,68,0.12)",
      color: "#fecaca",
      fontWeight: 900,
      cursor: "pointer",
    },

    mobileSaleList: {
      display: "grid",
      gap: 10,
      marginTop: 14,
    },

    mobileSaleCard: {
      padding: 14,
      borderRadius: 18,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    },

    mobileSaleTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
    },

    mobileSaleDate: {
      margin: "4px 0 0",
      color: "rgba(255,255,255,0.55)",
      fontSize: 12,
    },

    mobileSaleMeta: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
      color: "rgba(255,255,255,0.64)",
      fontSize: 12,
    },

    emptyBox: {
      padding: 18,
      borderRadius: 16,
      background: "rgba(255,255,255,0.035)",
      border: "1px dashed rgba(255,255,255,0.12)",
      color: "rgba(255,255,255,0.52)",
      textAlign: "center",
      fontSize: 13,
      fontWeight: 700,
    },
  };
}