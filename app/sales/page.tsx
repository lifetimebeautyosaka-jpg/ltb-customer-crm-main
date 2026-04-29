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

type DailySummaryRow = {
  date: string;
  stretchCash: number;
  stretchCard: number;
  stretchReceived: number;
  stretchTicket: number;
  trainingCash: number;
  trainingCard: number;
  trainingReceived: number;
  trainingTicket: number;
  netSalesTotal: number;
  advanceCash: number;
  advanceCard: number;
  advanceTotal: number;
  grandTotal: number;
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

type GroupedPresetOptions = {
  trial: PricePreset[];
  single: PricePreset[];
  unit: PricePreset[];
  ticketNew: PricePreset[];
  ticketOld: PricePreset[];
  consumeNew4: PricePreset[];
  consumeNew8: PricePreset[];
  consumeNew12: PricePreset[];
  consumeOld4: PricePreset[];
  consumeOld8: PricePreset[];
  consumeOld12: PricePreset[];
  optionFees: PricePreset[];
  trainingTrial: PricePreset[];
  trainingCourse: PricePreset[];
  trainingBodyOld: PricePreset[];
  trainingBodyNew: PricePreset[];
  trainingSenior: PricePreset[];
  trainingOptionFees: PricePreset[];
  manual: PricePreset[];
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

const STRETCH_UNIT_GUIDE: Array<{
  id: string;
  version: "新" | "旧";
  minutes: 40 | 60 | 80 | 120;
  amount: number;
}> = [
  { id: "stretch_new_unit_40", version: "新", minutes: 40, amount: 5500 },
  { id: "stretch_new_unit_60", version: "新", minutes: 60, amount: 8500 },
  { id: "stretch_new_unit_80", version: "新", minutes: 80, amount: 11250 },
  { id: "stretch_new_unit_120", version: "新", minutes: 120, amount: 17000 },
  { id: "stretch_old_unit_40", version: "旧", minutes: 40, amount: 5330 },
  { id: "stretch_old_unit_60", version: "旧", minutes: 60, amount: 7980 },
  { id: "stretch_old_unit_80", version: "旧", minutes: 80, amount: 10670 },
  { id: "stretch_old_unit_120", version: "旧", minutes: 120, amount: 16000 },
];

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
      note: "初回体験価格",
    },
    {
      id: "stretch_trial_80",
      serviceType: "ストレッチ",
      label: "新価格 初回体験 80分 6,800円",
      menuName: "ストレッチ初回体験 80分",
      amount: 6800,
      note: "初回体験価格",
    },
    {
      id: "stretch_trial_120",
      serviceType: "ストレッチ",
      label: "新価格 初回体験 120分 11,000円",
      menuName: "ストレッチ初回体験 120分",
      amount: 11000,
      note: "初回体験価格",
    },
    {
      id: "stretch_trial_holiday_plus",
      serviceType: "ストレッチ",
      label: "新価格 初回体験（土日祝加算）+1,000円",
      menuName: "ストレッチ初回体験 土日祝加算",
      amount: 1000,
      note: "土日祝は+1,000円",
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
      note: "自由入力用",
    },
  ];

  STRETCH_UNIT_GUIDE.forEach((item) => {
    presets.push({
      id: item.id,
      serviceType: "ストレッチ",
      label: `${item.version}価格 回数券単価 ${item.minutes}分 ${item.amount.toLocaleString()}円`,
      menuName: `ストレッチ${item.version}単価 ${item.minutes}分`,
      amount: item.amount,
      note: `${item.version}価格の回数券単価`,
    });
  });

  STRETCH_COUNTS.forEach((count) => {
    STRETCH_MINUTES.forEach((minutes) => {
      const newSaleAmount = STRETCH_NEW_TICKET_SALES[count][minutes];
      const oldSaleAmount = STRETCH_OLD_TICKET_SALES[count][minutes];
      const newConsumeAmount = STRETCH_NEW_CONSUME_UNIT[count][minutes];
      const oldConsumeAmount = STRETCH_OLD_CONSUME_UNIT[count][minutes];

      presets.push({
        id: `stretch_new_${count}_${minutes}`,
        serviceType: "ストレッチ",
        label: `新価格 ${count}回 ${minutes}分 ${newSaleAmount.toLocaleString()}円（1回 ${newConsumeAmount.toLocaleString()}円）`,
        menuName: `ストレッチ新 ${count}回 ${minutes}分`,
        amount: newSaleAmount,
        accountingType: "前受金",
      });

      presets.push({
        id: `stretch_old_${count}_${minutes}`,
        serviceType: "ストレッチ",
        label: `旧価格 ${count}回 ${minutes}分 ${oldSaleAmount.toLocaleString()}円（1回 ${oldConsumeAmount.toLocaleString()}円）`,
        menuName: `ストレッチ旧 ${count}回 ${minutes}分`,
        amount: oldSaleAmount,
        accountingType: "前受金",
      });

      presets.push({
        id: `stretch_consume_new_${count}_${minutes}`,
        serviceType: "ストレッチ",
        label: `消化用（新価格 ${count}回）${minutes}分 ${newConsumeAmount.toLocaleString()}円`,
        menuName: `ストレッチ消化 新 ${count}回 ${minutes}分`,
        amount: newConsumeAmount,
        accountingType: "回数券消化",
        note: `新価格 ${count}回券の消化単価`,
      });

      presets.push({
        id: `stretch_consume_old_${count}_${minutes}`,
        serviceType: "ストレッチ",
        label: `消化用（旧価格 ${count}回）${minutes}分 ${oldConsumeAmount.toLocaleString()}円`,
        menuName: `ストレッチ消化 旧 ${count}回 ${minutes}分`,
        amount: oldConsumeAmount,
        accountingType: "回数券消化",
        note: `旧価格 ${count}回券の消化単価`,
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
    note: "通常の初回体験",
  },
  {
    id: "trial_holiday",
    serviceType: "トレーニング",
    label: "初回体験（土日祝）6,500円",
    menuName: "初回体験（土日祝）",
    amount: 6500,
    note: "土日祝は+1,000円",
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
    note: "指名料",
  },
  ...buildStretchPresets(),
  {
    id: "manual_other_training",
    serviceType: "トレーニング",
    label: "その他（手入力）",
    menuName: "その他",
    amount: 0,
    note: "自由入力用",
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

function formatDateJP(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
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

function parseTicketInfo(ticketName?: string | null): ParsedTicketInfo | null {
  if (!ticketName) return null;
  const minutes = detectMinutesFromText(ticketName);
  const version = detectPriceVersionFromText(ticketName);
  const count = detectCountFromText(ticketName);

  if (!minutes) return null;

  return {
    count,
    minutes,
    version,
  };
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

  return {
    id: String(row.id),
    date: row.sale_date || todayString(),
    customerId:
      row.customer_id === null || row.customer_id === undefined
        ? null
        : String(row.customer_id),
    customerName: row.customer_name || "未設定",
    menuName:
      serviceType === "ストレッチ" ? "ストレッチ" : "トレーニング",
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

function toCsvValue(value: string | number) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildDailySummaryRows(sales: Sale[]): DailySummaryRow[] {
  const grouped: Record<string, DailySummaryRow> = {};

  sales.forEach((sale) => {
    const date = sale.date || todayString();

    if (!grouped[date]) {
      grouped[date] = {
        date,
        stretchCash: 0,
        stretchCard: 0,
        stretchReceived: 0,
        stretchTicket: 0,
        trainingCash: 0,
        trainingCard: 0,
        trainingReceived: 0,
        trainingTicket: 0,
        netSalesTotal: 0,
        advanceCash: 0,
        advanceCard: 0,
        advanceTotal: 0,
        grandTotal: 0,
      };
    }

    const amount = Number(sale.amount || 0);

    if (sale.accountingType === "前受金") {
      if (sale.paymentMethod === "現金") {
        grouped[date].advanceCash += amount;
      } else {
        grouped[date].advanceCard += amount;
      }
      return;
    }

    if (sale.accountingType === "回数券消化") {
      if (sale.serviceType === "ストレッチ") {
        grouped[date].stretchTicket += amount;
      } else {
        grouped[date].trainingTicket += amount;
      }
      return;
    }

    if (sale.serviceType === "ストレッチ") {
      if (sale.paymentMethod === "現金") grouped[date].stretchCash += amount;
      else grouped[date].stretchCard += amount;
    } else {
      if (sale.paymentMethod === "現金") grouped[date].trainingCash += amount;
      else grouped[date].trainingCard += amount;
    }
  });

  return Object.values(grouped).map((row) => {
    const netSalesTotal =
      row.stretchCash +
      row.stretchCard +
      row.stretchReceived +
      row.stretchTicket +
      row.trainingCash +
      row.trainingCard +
      row.trainingReceived +
      row.trainingTicket;

    const advanceTotal = row.advanceCash + row.advanceCard;

    return {
      ...row,
      netSalesTotal,
      advanceTotal,
      grandTotal: netSalesTotal + advanceTotal,
    };
  });
}

/* ===============================
   メインコンポーネント
=============================== */

export default function SalesPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [date, setDate] = useState(todayString());
  const [customerId, setCustomerId] = useState("");
  const [menuName, setMenuName] = useState("");
  const [staff, setStaff] = useState("山口");
  const [storeName, setStoreName] = useState("江戸堀");
  const [serviceType, setServiceType] = useState<ServiceType>("トレーニング");
  const [note, setNote] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: c } = await supabase.from("customers").select("*");
      const { data: s } = await supabase.from("sales").select("*");

      setCustomers(c || []);
      setSales((s || []).map(rowToSale));
      setLoading(false);
    };

    init();
  }, []);
    const selectedCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === String(customerId)) || null;
  }, [customers, customerId]);

  const totalAmount = useMemo(() => {
    return payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [payments]);

  const dailySummaryRows = useMemo(() => {
    return buildDailySummaryRows(sales);
  }, [sales]);

  const updatePayment = <K extends keyof PaymentRow>(
    id: string,
    key: K,
    value: PaymentRow[K]
  ) => {
    setPayments((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        const next = { ...row, [key]: value };

        if (key === "presetId") {
          const preset = findPricePresetById(String(value));
          if (preset) {
            next.amount = String(preset.amount);
            next.saleType = preset.accountingType || "通常売上";
            if (preset.accountingType === "回数券消化") {
              next.paymentMethod = "その他";
            }
          }
        }

        if (key === "saleType" && value === "回数券消化") {
          next.paymentMethod = "その他";
        }

        return next;
      })
    );
  };

  const addPaymentRow = () => {
    setPayments((prev) => [...prev, createPaymentRow()]);
  };

  const removePaymentRow = (id: string) => {
    setPayments((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  };

  const resetForm = () => {
    setDate(todayString());
    setCustomerId("");
    setMenuName("");
    setStaff("山口");
    setStoreName("江戸堀");
    setServiceType("トレーニング");
    setNote("");
    setPayments([createPaymentRow()]);
  };

  const handleAddSale = async () => {
    if (!date) {
      alert("日付を入力してください");
      return;
    }

    if (!selectedCustomer) {
      alert("顧客を選択してください");
      return;
    }

    if (!menuName.trim()) {
      alert("メニュー名を入力してください");
      return;
    }

    const validPayments = payments.filter((p) => Number(p.amount || 0) > 0);

    if (validPayments.length === 0) {
      alert("金額を入力してください");
      return;
    }

    try {
      setSaving(true);

      const insertRows = validPayments.map((payment) => {
        const accountingType = payment.saleType;
        const paymentMethod = payment.paymentMethod;
        const amount = Number(payment.amount || 0);

        const memoLines = [
          note,
          `メニュー名: ${menuName}`,
          payment.presetId ? `プリセットID: ${payment.presetId}` : "",
        ].filter(Boolean);

        return {
          customer_id: Number(selectedCustomer.id),
          customer_name: selectedCustomer.name,
          sale_date: date,
          menu_type: serviceType,
          sale_type: accountingType,
          payment_method: paymentMethod,
          amount,
          staff_name: staff,
          store_name: storeName,
          reservation_id: null,
          memo: memoLines.join("\n"),
        };
      });

      const { error } = await supabase.from("sales").insert(insertRows);

      if (error) {
        alert(`売上登録エラー: ${error.message}`);
        return;
      }

      await fetchSales();
      resetForm();
      alert("売上を登録しました");
    } catch (error) {
      console.error("handleAddSale error:", error);
      alert("売上登録中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    const ok = window.confirm(
      `${sale.customerName} / ${formatCurrency(sale.amount)} の売上を削除しますか？`
    );

    if (!ok) return;

    const { error } = await supabase.from("sales").delete().eq("id", sale.id);

    if (error) {
      alert(`削除エラー: ${error.message}`);
      return;
    }

    await fetchSales();
  };

  const exportCsv = () => {
    const header = [
      "日付",
      "顧客名",
      "メニュー",
      "サービス",
      "会計区分",
      "支払方法",
      "金額",
      "担当",
      "店舗",
      "メモ",
    ];

    const rows = sales.map((sale) => [
      sale.date,
      sale.customerName,
      sale.menuName,
      sale.serviceType,
      sale.accountingType,
      sale.paymentMethod,
      sale.amount,
      sale.staff,
      sale.storeName,
      sale.note,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => toCsvValue(value)).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${todayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>読み込み中...</div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>GYMUP CRM</p>
          <h1 style={styles.title}>売上管理</h1>
          <p style={styles.lead}>安定版：売上登録・一覧・CSV出力</p>
        </div>

        <div style={styles.headerActions}>
          <Link href="/" style={styles.secondaryButton}>
            管理TOP
          </Link>
          <button type="button" onClick={exportCsv} style={styles.secondaryButton}>
            CSV出力
          </button>
        </div>
      </div>

      <section style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>売上登録</h2>

          <label style={styles.label}>
            日付
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            顧客
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
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
            メニュー名
            <input
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="例：ストレッチ60分"
              style={styles.input}
            />
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

          <div style={styles.paymentBox}>
            <div style={styles.paymentHeader}>
              <strong>決済</strong>
              <button type="button" onClick={addPaymentRow} style={styles.smallButton}>
                ＋追加
              </button>
            </div>

            {payments.map((payment) => (
              <div key={payment.id} style={styles.paymentRow}>
                <select
                  value={payment.presetId}
                  onChange={(e) =>
                    updatePayment(payment.id, "presetId", e.target.value)
                  }
                  style={styles.input}
                >
                  <option value="">プリセットなし</option>
                  {PRICE_PRESETS.filter((p) => p.serviceType === serviceType).map(
                    (preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={payment.saleType}
                  onChange={(e) =>
                    updatePayment(
                      payment.id,
                      "saleType",
                      e.target.value as AccountingType
                    )
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
                    updatePayment(
                      payment.id,
                      "paymentMethod",
                      e.target.value as PaymentMethod
                    )
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
                    updatePayment(payment.id, "amount", e.target.value)
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
              style={styles.textarea}
            />
          </label>

          <div style={styles.totalBox}>
            <span>登録合計</span>
            <strong>{formatCurrency(totalAmount)}</strong>
          </div>

          <button
            type="button"
            onClick={handleAddSale}
            disabled={saving}
            style={styles.primaryButton}
          >
            {saving ? "保存中..." : "売上を登録する"}
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>集計</h2>

          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <span>総売上</span>
              <strong>
                {formatCurrency(
                  sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0)
                )}
              </strong>
            </div>

            <div style={styles.summaryCard}>
              <span>本日売上</span>
              <strong>
                {formatCurrency(
                  sales
                    .filter((sale) => sale.date === todayString())
                    .reduce((sum, sale) => sum + Number(sale.amount || 0), 0)
                )}
              </strong>
            </div>

            <div style={styles.summaryCard}>
              <span>件数</span>
              <strong>{sales.length}件</strong>
            </div>
          </div>

          <h3 style={styles.subTitle}>日別集計</h3>
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
                    <td style={styles.td}>{formatCurrency(row.netSalesTotal)}</td>
                    <td style={styles.td}>{formatCurrency(row.advanceTotal)}</td>
                    <td style={styles.td}>{formatCurrency(row.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>売上一覧</h2>

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
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td style={styles.td}>{formatDateJP(sale.date)}</td>
                  <td style={styles.td}>{sale.customerName}</td>
                  <td style={styles.td}>{sale.serviceType}</td>
                  <td style={styles.td}>{sale.accountingType}</td>
                  <td style={styles.td}>{sale.paymentMethod}</td>
                  <td style={styles.td}>{formatCurrency(sale.amount)}</td>
                  <td style={styles.td}>{sale.staff}</td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      onClick={() => handleDeleteSale(sale)}
                      style={styles.deleteButton}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}

              {sales.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={8}>
                    売上データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background:
      "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 42%, #9ca3af 100%)",
    color: "#111827",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    maxWidth: 1280,
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
  },
  kicker: {
    margin: 0,
    fontSize: 12,
    letterSpacing: "0.18em",
    color: "#6b7280",
    fontWeight: 800,
  },
  title: {
    margin: "4px 0",
    fontSize: 32,
    fontWeight: 900,
  },
  lead: {
    margin: 0,
    color: "#4b5563",
    fontSize: 14,
  },
  headerActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  grid: {
    maxWidth: 1280,
    margin: "0 auto 20px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
    gap: 20,
  },
  card: {
    maxWidth: 1280,
    margin: "0 auto 20px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(255,255,255,0.72)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
    backdropFilter: "blur(16px)",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 20,
    fontWeight: 900,
  },
  subTitle: {
    margin: "20px 0 10px",
    fontSize: 15,
    fontWeight: 900,
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 13,
    fontWeight: 800,
    color: "#374151",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    minHeight: 42,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.9)",
    fontSize: 14,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: 12,
    background: "rgba(255,255,255,0.9)",
    fontSize: 14,
    boxSizing: "border-box",
  },
  paymentBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    background: "rgba(249,250,251,0.8)",
  },
  paymentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  paymentRow: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#111827",
    color: "white",
    borderRadius: 16,
    padding: "14px 16px",
    margin: "14px 0",
  },
  primaryButton: {
    width: "100%",
    minHeight: 48,
    border: "none",
    borderRadius: 16,
    background: "#111827",
    color: "white",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
  },
  secondaryButton: {
    minHeight: 42,
    border: "1px solid rgba(255,255,255,0.8)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.7)",
    color: "#111827",
    padding: "10px 16px",
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
  },
  smallButton: {
    border: "none",
    borderRadius: 999,
    background: "#111827",
    color: "white",
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  deleteMiniButton: {
    border: "none",
    borderRadius: 12,
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "10px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  deleteButton: {
    border: "none",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  summaryCard: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 14,
    display: "grid",
    gap: 6,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
};