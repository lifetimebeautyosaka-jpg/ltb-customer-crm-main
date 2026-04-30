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
  reservationId?: string;
}): Promise<TicketConsumeResult> {
  const target = await fetchFirstActiveTicket(params.customerId, params.serviceType);

  if (!target) {
    throw new Error(`${params.serviceType}の利用可能な回数券がありません`);
  }

  const beforeCount = Number(target.remaining_count || 0);
  if (beforeCount <= 0) {
    throw new Error("回数券の残数がありません");
  }

  const afterCount = beforeCount - 1;

  const { error: updateError } = await supabase
    .from("customer_tickets")
    .update({
      remaining_count: afterCount,
      status: afterCount <= 0 ? "消化済み" : "利用中",
    })
    .eq("id", target.id);

  if (updateError) {
    throw new Error(`回数券更新エラー: ${updateError.message}`);
  }

  const { error: usageError } = await supabase.from("ticket_usages").insert([
    {
      reservation_id: params.reservationId ? Number(params.reservationId) : null,
      ticket_id: target.id,
      customer_id: Number(params.customerId),
      customer_name: params.customerName,
      ticket_name: target.ticket_name || "回数券",
      service_type: params.serviceType,
      used_date: params.usedDate || null,
      before_count: beforeCount,
      after_count: afterCount,
    },
  ]);

  if (usageError) {
    await supabase
      .from("customer_tickets")
      .update({
        remaining_count: beforeCount,
        status: target.status || "利用中",
      })
      .eq("id", target.id);

    throw new Error(`消化履歴登録エラー: ${usageError.message}`);
  }

  return {
    ticketId: target.id,
    ticketName: target.ticket_name || "回数券",
    beforeCount,
    afterCount,
  };
}

async function rollbackConsumedTicket(params: {
  ticketId: number | string;
  beforeCount: number;
  reservationId?: string;
}) {
  await supabase
    .from("customer_tickets")
    .update({
      remaining_count: params.beforeCount,
      status: "利用中",
    })
    .eq("id", params.ticketId);

  if (params.reservationId) {
    await supabase
      .from("ticket_usages")
      .delete()
      .eq("ticket_id", params.ticketId)
      .eq("reservation_id", Number(params.reservationId))
      .eq("before_count", params.beforeCount);
  }
}
async function restoreTicketUsageFromDeletedSale(params: {
  sale: Sale;
}): Promise<void> {
  const { sale } = params;

  if (sale.accountingType !== "回数券消化") return;
  if (!sale.customerId) return;

  let query = supabase
    .from("ticket_usages")
    .select(
      "id, reservation_id, ticket_id, customer_id, customer_name, ticket_name, service_type, used_date, before_count, after_count"
    )
    .eq("customer_id", Number(sale.customerId))
    .eq("service_type", sale.serviceType)
    .order("id", { ascending: false })
    .limit(20);

  if (sale.reservationId) {
    query = query.eq("reservation_id", Number(sale.reservationId));
  } else {
    query = query.eq("used_date", sale.date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`回数券消化履歴取得エラー: ${error.message}`);
  }

  const usageList = (data as TicketUsageRow[] | null) || [];
  const usage = usageList[0] || null;

  if (!usage) {
    throw new Error("回数券消化履歴が見つからないため、残数を戻せませんでした");
  }

  if (!usage.ticket_id) {
    throw new Error("ticket_usages に ticket_id がないため、残数を戻せませんでした");
  }

  const beforeCount = Number(usage.before_count ?? 0);
  const afterCount = Number(usage.after_count ?? 0);

  const { error: ticketRestoreError } = await supabase
    .from("customer_tickets")
    .update({
      remaining_count: beforeCount,
      status: "利用中",
    })
    .eq("id", usage.ticket_id);

  if (ticketRestoreError) {
    throw new Error(`回数券戻しエラー: ${ticketRestoreError.message}`);
  }

  const { error: usageDeleteError } = await supabase
    .from("ticket_usages")
    .delete()
    .eq("id", usage.id);

  if (usageDeleteError) {
    await supabase
      .from("customer_tickets")
      .update({
        remaining_count: afterCount,
        status: afterCount <= 0 ? "消化済み" : "利用中",
      })
      .eq("id", usage.ticket_id);

    throw new Error(`回数券消化履歴削除エラー: ${usageDeleteError.message}`);
  }
}

async function issueCustomerTicket(params: {
  customerId: string;
  customerName: string;
  preset: PricePreset;
  purchaseDate: string;
  note?: string;
}): Promise<number | string> {
  const info = parseTicketIssuePresetInfo(params.preset);

  if (!info) {
    throw new Error("回数券発行対象のプリセットではありません");
  }

  const expiryDate = addDaysString(params.purchaseDate, 90);
  const ticketName = `ストレッチ${info.priceVersion} ${info.ticketCount}回 ${info.minutes}分`;

  const { data, error } = await supabase
    .from("customer_tickets")
    .insert([
      {
        customer_id: Number(params.customerId),
        customer_name: params.customerName,
        ticket_name: ticketName,
        service_type: "ストレッチ",
        total_count: info.ticketCount,
        remaining_count: info.ticketCount,
        purchase_date: params.purchaseDate,
        expiry_date: expiryDate,
        status: "利用中",
        note: mergeNoteLines(params.note || "", [
          `自動発行: ${params.preset.label}`,
          `発行回数: ${info.ticketCount}回`,
          `時間: ${info.minutes}分`,
          expiryDate ? `有効期限: ${expiryDate}` : "",
        ]),
      },
    ])
    .select("id");

  if (error) {
    throw new Error(`回数券発行エラー: ${error.message}`);
  }

  const inserted = Array.isArray(data) ? data[0] : null;

  if (!inserted?.id) {
    throw new Error("回数券発行後のID取得に失敗しました");
  }

  return inserted.id;
}

export default function SalesPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [windowWidth, setWindowWidth] = useState(1200);

  const [date, setDate] = useState(todayString());
  const [customerId, setCustomerId] = useState("");
  const [menuName, setMenuName] = useState("");
  const [staff, setStaff] = useState("山口");
  const [storeName, setStoreName] = useState("江戸堀");
  const [serviceType, setServiceType] = useState<ServiceType>("トレーニング");
  const [note, setNote] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow()]);

  const [reservationId, setReservationId] = useState("");
  const [reservationStatus, setReservationStatus] = useState("");
  const [existingSalesForReservation, setExistingSalesForReservation] = useState<Sale[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isMobile = windowWidth < 760;
  const isTablet = windowWidth >= 760 && windowWidth < 1100;

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === String(customerId)) || null;
  }, [customers, customerId]);

  const totalAmount = useMemo(() => {
    return payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [payments]);

  const dailySummaryRows = useMemo(() => {
    return buildDailySummaryRows(sales);
  }, [sales]);

  const todaySalesTotal = useMemo(() => {
    return sales
      .filter((sale) => sale.date === todayString())
      .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }, [sales]);

  const allSalesTotal = useMemo(() => {
    return sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }, [sales]);

  const advanceTotal = useMemo(() => {
    return sales
      .filter((sale) => sale.accountingType === "前受金")
      .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }, [sales]);

  const ticketSalesCount = useMemo(() => {
    return sales.filter((sale) => sale.accountingType === "回数券消化").length;
  }, [sales]);

  const fetchSales = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("sale_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        alert(`売上取得エラー: ${error.message}`);
        setSales([]);
        return;
      }

      setSales(((data || []) as SupabaseSaleRow[]).map(rowToSale));
    } catch (error) {
      console.error("fetchSales error:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone")
      .order("name", { ascending: true });

    if (error) {
      alert(`顧客取得エラー: ${error.message}`);
      setCustomers([]);
      return;
    }

    setCustomers((data || []) as Customer[]);
  };

  const loadExistingSalesForReservation = async (id: string) => {
    if (!id) {
      setExistingSalesForReservation([]);
      return;
    }

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("reservation_id", Number(id))
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("existing sales check error:", error.message);
      setExistingSalesForReservation([]);
      return;
    }

    setExistingSalesForReservation(((data || []) as SupabaseSaleRow[]).map(rowToSale));
  };

  const loadReservationForPrefill = async (id: string) => {
    if (!id) return;

    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id, customer_id, customer_name, date, menu, staff_name, store_name, payment_method, memo, reservation_status"
      )
      .eq("id", Number(id))
      .limit(1);

    if (error) {
      console.warn("reservation prefill error:", error.message);
      return;
    }

    const row = ((data as ReservationPrefillRow[] | null) || [])[0];
    if (!row) return;

    if (row.date) setDate(row.date);

    if (row.customer_id !== null && row.customer_id !== undefined) {
      setCustomerId(String(row.customer_id));
    }

    if (row.menu) {
      setMenuName(row.menu);
      setServiceType(detectServiceTypeFromMenu(row.menu));
    }

    if (row.staff_name) setStaff(row.staff_name);
    if (row.store_name) setStoreName(row.store_name);
    if (row.reservation_status) setReservationStatus(row.reservation_status);

    if (row.memo) {
      setNote((prev) => mergeNoteLines(prev, [`予約メモ: ${row.memo}`]));
    }
  };

  useEffect(() => {
    const update = () => {
      if (typeof window !== "undefined") setWindowWidth(window.innerWidth);
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchCustomers();
      await fetchSales();

      const initialReservationId =
        getQueryParam("reservationId") || getQueryParam("reservation_id");

      if (initialReservationId) {
        setReservationId(initialReservationId);
        await loadReservationForPrefill(initialReservationId);
        await loadExistingSalesForReservation(initialReservationId);
      }
    };

    void init();
  }, []);

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

            if (preset.serviceType) setServiceType(preset.serviceType);
            if (preset.menuName) setMenuName(preset.menuName);

            if (preset.accountingType === "回数券消化") {
              next.paymentMethod = "その他";
            }
          }
        }

        if (key === "saleType" && value === "回数券消化") {
          next.paymentMethod = "その他";

          const preset = resolveConsumePresetFromContext({
            serviceType,
            saleType: "回数券消化",
            presetId: next.presetId,
            menuName,
            note,
          });

          if (preset && (!next.amount || Number(next.amount) <= 0)) {
            next.presetId = preset.id;
            next.amount = String(preset.amount);
          }
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
    setReservationId("");
    setReservationStatus("");
    setExistingSalesForReservation([]);
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

    const resolvedPayments = payments.map((row) => {
      if (row.saleType !== "回数券消化") return row;

      const preset =
        findPricePresetById(row.presetId) ||
        resolveConsumePresetFromContext({
          serviceType,
          saleType: row.saleType,
          presetId: row.presetId,
          menuName,
          note,
        });

      return {
        ...row,
        presetId: row.presetId || preset?.id || "",
        amount:
          row.amount && Number(row.amount) > 0
            ? row.amount
            : preset
            ? String(preset.amount)
            : row.amount,
        paymentMethod: "その他" as PaymentMethod,
      };
    });

    const validPayments = resolvedPayments.filter((p) => Number(p.amount || 0) > 0);

    if (validPayments.length === 0) {
      alert("金額を入力してください");
      return;
    }

    try {
      setSaving(true);

      if (reservationId) {
        const { data: existingRows, error: existingError } = await supabase
          .from("sales")
          .select("*")
          .eq("reservation_id", Number(reservationId));

        if (existingError) {
          throw new Error(`既存売上チェックエラー: ${existingError.message}`);
        }

        const existingSales = ((existingRows || []) as SupabaseSaleRow[]).map(rowToSale);

        if (existingSales.length > 0) {
          const ok = window.confirm(
            "この予約にはすでに売上があります。\n上書きしますか？\n\n回数券消化がある場合は、残数を戻してから再登録します。"
          );

          if (!ok) return;

          for (const oldSale of existingSales) {
            if (oldSale.accountingType === "回数券消化") {
              await restoreTicketUsageFromDeletedSale({ sale: oldSale });
            }

            const { error: deleteOldError } = await supabase
              .from("sales")
              .delete()
              .eq("id", oldSale.id);

            if (deleteOldError) {
              throw new Error(`既存売上削除エラー: ${deleteOldError.message}`);
            }
          }
        }
      }

      const insertedSaleIds: Array<number | string> = [];
      const issuedTicketIds: Array<number | string> = [];
      const consumedTickets: TicketConsumeResult[] = [];

      for (const row of validPayments) {
        const isTicketConsume = row.saleType === "回数券消化";

        const preset =
          findPricePresetById(row.presetId) ||
          resolveConsumePresetFromContext({
            serviceType,
            saleType: row.saleType,
            presetId: row.presetId,
            menuName,
            note,
          });

        const ticketIssueInfo = parseTicketIssuePresetInfo(preset);
        let ticketResult: TicketConsumeResult | null = null;

        if (isTicketConsume) {
          ticketResult = await consumeCustomerTicket({
            customerId: String(selectedCustomer.id),
            customerName: selectedCustomer.name,
            serviceType,
            usedDate: date,
            reservationId,
          });

          consumedTickets.push(ticketResult);
        }

        const mergedNote = [
          menuName.trim() ? `メニュー名: ${menuName.trim()}` : "",
          preset ? `料金プリセット: ${preset.label}` : "",
          isTicketConsume && ticketResult
            ? `回数券消化: ${ticketResult.ticketName} / 残数 ${ticketResult.beforeCount} → ${ticketResult.afterCount}`
            : "",
          ticketIssueInfo
            ? `回数券自動発行対象: ${ticketIssueInfo.priceVersion}価格 ${ticketIssueInfo.ticketCount}回 ${ticketIssueInfo.minutes}分`
            : "",
          note.trim(),
        ]
          .filter(Boolean)
          .join("\n");

        const { data, error } = await supabase
          .from("sales")
          .insert([
            {
              customer_id: Number(selectedCustomer.id),
              customer_name: selectedCustomer.name,
              sale_date: date,
              menu_type: serviceType,
              sale_type: row.saleType,
              payment_method: isTicketConsume ? "その他" : row.paymentMethod,
              amount: Number(row.amount || 0),
              staff_name: staff.trim() || "未設定",
              store_name: storeName.trim() || "未設定",
              reservation_id: reservationId ? Number(reservationId) : null,
              memo: mergedNote || null,
            },
          ])
          .select("id");

        if (error) {
          for (const consumed of consumedTickets) {
            await rollbackConsumedTicket({
              ticketId: consumed.ticketId,
              beforeCount: consumed.beforeCount,
              reservationId,
            });
          }

          throw new Error(`売上登録エラー: ${error.message}`);
        }

        const inserted = Array.isArray(data) ? data[0] : null;
        if (inserted?.id) insertedSaleIds.push(inserted.id);

        if (ticketIssueInfo && preset) {
          const ticketId = await issueCustomerTicket({
            customerId: String(selectedCustomer.id),
            customerName: selectedCustomer.name,
            preset,
            purchaseDate: date,
            note,
          });

          issuedTicketIds.push(ticketId);
        }
      }

      if (reservationId) {
        const { error: reservationUpdateError } = await supabase
          .from("reservations")
          .update({
            reservation_status: "売上済",
          })
          .eq("id", Number(reservationId));

        if (reservationUpdateError) {
          for (const saleId of insertedSaleIds) {
            await supabase.from("sales").delete().eq("id", saleId);
          }

          for (const ticketId of issuedTicketIds) {
            await supabase.from("customer_tickets").delete().eq("id", ticketId);
          }

          for (const consumed of consumedTickets) {
            await rollbackConsumedTicket({
              ticketId: consumed.ticketId,
              beforeCount: consumed.beforeCount,
              reservationId,
            });
          }

          throw new Error(`予約ステータス更新エラー: ${reservationUpdateError.message}`);
        }

        setReservationStatus("売上済");
        await loadExistingSalesForReservation(reservationId);
      }

      await fetchSales();

      if (reservationId) {
        alert("売上を登録し、予約ステータスを売上済に更新しました");
        router.push(`/reservation/detail/${reservationId}`);
        return;
      }

      resetForm();

      alert(
        issuedTicketIds.length > 0
          ? `売上を登録し、回数券を ${issuedTicketIds.length} 件自動発行しました`
          : "売上を登録しました"
      );
    } catch (error) {
      console.error("handleAddSale error:", error);
      alert(error instanceof Error ? error.message : "売上登録中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    const ok = window.confirm(
      `${sale.customerName} / ${formatCurrency(
        sale.amount
      )} の売上を削除しますか？\n\n回数券消化の場合は残数も戻します。`
    );

    if (!ok) return;

    try {
      if (sale.accountingType === "回数券消化") {
        await restoreTicketUsageFromDeletedSale({ sale });
      }

      const { error } = await supabase.from("sales").delete().eq("id", sale.id);

      if (error) {
        throw new Error(`削除エラー: ${error.message}`);
      }

      if (sale.reservationId) {
        const { data: restSales } = await supabase
          .from("sales")
          .select("id")
          .eq("reservation_id", Number(sale.reservationId));

        if (!restSales || restSales.length === 0) {
          await supabase
            .from("reservations")
            .update({
              reservation_status: "予約済",
            })
            .eq("id", Number(sale.reservationId));
        }

        await loadExistingSalesForReservation(String(sale.reservationId));
      }

      await fetchSales();
      alert("売上を削除しました");
    } catch (error) {
      console.error("handleDeleteSale error:", error);
      alert(error instanceof Error ? error.message : "売上削除中にエラーが発生しました");
    }
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
      "予約ID",
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
      sale.reservationId || "",
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

  const styles = createStyles(isMobile, isTablet);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          <aside style={styles.sidebar}>
            <div style={styles.sideLogo}>G</div>
          </aside>
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
                予約連動・回数券消化・上書き登録・CSV出力
              </p>
            </div>

            <div style={styles.headerActions}>
              <Link href="/" style={styles.secondaryButton}>
                管理TOP
              </Link>
              <button type="button" onClick={exportCsv} style={styles.primaryMiniButton}>
                CSV出力
              </button>
            </div>
          </div>

          {reservationId && (
            <section style={styles.noticeCard}>
              <strong>予約ID：{reservationId}</strong>
              <span>予約ステータス：{reservationStatus || "未取得"}</span>
              <span>既存売上：{existingSalesForReservation.length}件</span>
            </section>
          )}

          <section style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <span>All Sales</span>
              <strong>{formatCurrency(allSalesTotal)}</strong>
              <small>総売上</small>
            </div>
            <div style={styles.kpiCard}>
              <span>Today</span>
              <strong>{formatCurrency(todaySalesTotal)}</strong>
              <small>本日売上</small>
            </div>
            <div style={styles.kpiCard}>
              <span>Advance</span>
              <strong>{formatCurrency(advanceTotal)}</strong>
              <small>前受金</small>
            </div>
            <div style={styles.kpiCard}>
              <span>Tickets</span>
              <strong>{ticketSalesCount}件</strong>
              <small>回数券消化</small>
            </div>
          </section>

          <section style={styles.contentGrid}>
            <div style={styles.formCard}>
              <h2 style={styles.sectionTitle}>売上登録</h2>

              <div style={styles.formGrid}>
                <label style={styles.label}>
                  日付
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
                </label>

                <label style={styles.label}>
                  顧客
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={styles.input}>
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
                  <select value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)} style={styles.input}>
                    {SERVICE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label style={styles.label}>
                  メニュー名
                  <input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="例：ストレッチ60分" style={styles.input} />
                </label>

                <label style={styles.label}>
                  担当
                  <select value={staff} onChange={(e) => setStaff(e.target.value)} style={styles.input}>
                    {STAFF_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label style={styles.label}>
                  店舗
                  <select value={storeName} onChange={(e) => setStoreName(e.target.value)} style={styles.input}>
                    {STORE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={styles.paymentBox}>
                <div style={styles.paymentHeader}>
                  <strong>決済</strong>
                  <button type="button" onClick={addPaymentRow} style={styles.addButton}>
                    ＋追加
                  </button>
                </div>

                {payments.map((payment) => (
                  <div key={payment.id} style={styles.paymentRow}>
                    <select value={payment.presetId} onChange={(e) => updatePayment(payment.id, "presetId", e.target.value)} style={styles.input}>
                      <option value="">プリセットなし</option>
                      {PRICE_PRESETS.filter((p) => p.serviceType === serviceType).map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>

                    <select value={payment.saleType} onChange={(e) => updatePayment(payment.id, "saleType", e.target.value as AccountingType)} style={styles.input}>
                      {ACCOUNTING_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>

                    <select value={payment.paymentMethod} onChange={(e) => updatePayment(payment.id, "paymentMethod", e.target.value as PaymentMethod)} style={styles.input} disabled={payment.saleType === "回数券消化"}>
                      {PAYMENT_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>

                    <input type="number" value={payment.amount} onChange={(e) => updatePayment(payment.id, "amount", e.target.value)} placeholder="金額" style={styles.input} />

                    <button type="button" onClick={() => removePaymentRow(payment.id)} style={styles.deleteMiniButton}>
                      削除
                    </button>
                  </div>
                ))}
              </div>

              <label style={styles.label}>
                メモ
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} style={styles.textarea} />
              </label>

              <div style={styles.totalBox}>
                <span>登録合計</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>

              <button type="button" onClick={handleAddSale} disabled={saving} style={styles.primaryButton}>
                {saving ? "保存中..." : "売上を登録する"}
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
                        <td style={styles.td}>{formatCurrency(row.netSalesTotal)}</td>
                        <td style={styles.td}>{formatCurrency(row.advanceTotal)}</td>
                        <td style={styles.td}>{formatCurrency(row.grandTotal)}</td>
                      </tr>
                    ))}
                    {dailySummaryRows.length === 0 && (
                      <tr>
                        <td style={styles.td} colSpan={4}>集計データがありません</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section style={styles.listCard}>
            <h2 style={styles.sectionTitle}>売上一覧</h2>

            {isMobile ? (
              <div style={styles.mobileSaleList}>
                {sales.map((sale) => (
                  <div key={sale.id} style={styles.mobileSaleCard}>
                    <div style={styles.mobileSaleTop}>
                      <div>
                        <strong>{sale.customerName}</strong>
                        <p style={styles.mobileSaleDate}>
                          {formatDateJP(sale.date)} / {sale.staff}
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

                    <button type="button" onClick={() => handleDeleteSale(sale)} style={styles.deleteButton}>
                      削除
                    </button>
                  </div>
                ))}
                {sales.length === 0 && <div style={styles.emptyBox}>売上データがありません</div>}
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
                      <th style={styles.th}>予約ID</th>
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
                        <td style={styles.td}>{sale.reservationId || "—"}</td>
                        <td style={styles.td}>
                          <button type="button" onClick={() => handleDeleteSale(sale)} style={styles.deleteButton}>
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sales.length === 0 && (
                      <tr>
                        <td style={styles.td} colSpan={9}>売上データがありません</td>
                      </tr>
                    )}
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

function createStyles(isMobile: boolean, isTablet: boolean): Record<string, CSSProperties> {
  const glass: CSSProperties = {
    background: "rgba(22, 26, 35, 0.68)",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
    backdropFilter: "blur(22px)",
  };

  return {
    page: {
      minHeight: "100vh",
      padding: isMobile ? 10 : 22,
      background:
        "radial-gradient(circle at 15% 15%, rgba(91,141,255,0.18), transparent 28%), radial-gradient(circle at 80% 65%, rgba(255,122,89,0.12), transparent 24%), linear-gradient(135deg,#070b12 0%,#101827 45%,#060a11 100%)",
      color: "#f8fafc",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
      margin: "4px 0",
      fontSize: isMobile ? 28 : 34,
      fontWeight: 900,
      letterSpacing: "-0.04em",
    },
    lead: {
      margin: 0,
      color: "rgba(255,255,255,0.58)",
      fontSize: 13,
    },
    headerActions: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },
    secondaryButton: {
      minHeight: 42,
      borderRadius: 999,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.09)",
      color: "#fff",
      padding: "10px 16px",
      fontWeight: 800,
      textDecoration: "none",
      cursor: "pointer",
      textAlign: "center",
    },
    primaryMiniButton: {
      minHeight: 42,
      borderRadius: 999,
      background: "linear-gradient(135deg,#2563eb,#60a5fa)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#fff",
      padding: "10px 16px",
      fontWeight: 900,
      cursor: "pointer",
    },
    noticeCard: {
      borderRadius: 18,
      padding: "12px 14px",
      marginBottom: 16,
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: 12,
      background: "rgba(37,99,235,0.18)",
      border: "1px solid rgba(96,165,250,0.24)",
      color: "#dbeafe",
    },
    kpiGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)",
      gap: 12,
      marginBottom: 16,
    },
    kpiCard: {
      borderRadius: 20,
      padding: isMobile ? 14 : 18,
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "grid",
      gap: 6,
    },
    contentGrid: {
      display: "grid",
      gridTemplateColumns: isMobile || isTablet ? "1fr" : "minmax(0,1.35fr) minmax(380px,0.65fr)",
      gap: 16,
      marginBottom: 16,
    },
    formCard: {
      borderRadius: 24,
      padding: isMobile ? 14 : 18,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      minWidth: 0,
    },
    sidePanelCard: {
      borderRadius: 24,
      padding: isMobile ? 14 : 18,
      background: "rgba(255,255,255,0.055)",
      border: "1px solid rgba(255,255,255,0.08)",
      minWidth: 0,
    },
    listCard: {
      borderRadius: 24,
      padding: isMobile ? 14 : 18,
      background: "rgba(255,255,255,0.055)",
      border: "1px solid rgba(255,255,255,0.08)",
      minWidth: 0,
    },
    sectionTitle: {
      margin: "0 0 14px",
      fontSize: 18,
      fontWeight: 900,
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",
      gap: 12,
    },
    label: {
      display: "grid",
      gap: 6,
      fontSize: 12,
      fontWeight: 800,
      color: "rgba(255,255,255,0.62)",
      marginBottom: 12,
      minWidth: 0,
    },
    input: {
      width: "100%",
      minHeight: 44,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.09)",
      padding: "10px 12px",
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      fontSize: 16,
      boxSizing: "border-box",
      minWidth: 0,
      outline: "none",
    },
    textarea: {
      width: "100%",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.09)",
      padding: 12,
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      fontSize: 16,
      boxSizing: "border-box",
      outline: "none",
    },
    paymentBox: {
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18,
      padding: 12,
      marginBottom: 12,
      background: "rgba(0,0,0,0.16)",
    },
    paymentHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    paymentRow: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr 1fr 1fr auto",
      gap: 8,
      alignItems: "center",
      marginBottom: 10,
    },
    addButton: {
      border: "none",
      borderRadius: 999,
      background: "rgba(255,255,255,0.12)",
      color: "#fff",
      padding: "8px 12px",
      fontWeight: 900,
      cursor: "pointer",
    },
    deleteMiniButton: {
      border: "none",
      borderRadius: 12,
      background: "rgba(239,68,68,0.18)",
      color: "#fecaca",
      padding: "11px 12px",
      fontWeight: 900,
      cursor: "pointer",
      width: isMobile ? "100%" : "auto",
    },
    totalBox: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "rgba(255,255,255,0.09)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: "14px 16px",
      margin: "14px 0",
    },
    primaryButton: {
      width: "100%",
      minHeight: 52,
      border: "none",
      borderRadius: 16,
      background: "linear-gradient(135deg,#2563eb,#60a5fa)",
      color: "#fff",
      fontWeight: 900,
      fontSize: 16,
      cursor: "pointer",
      boxShadow: "0 18px 36px rgba(37,99,235,0.34)",
    },
    tableWrap: {
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      width: "100%",
    },
    table: {
      width: "100%",
      minWidth: isMobile ? 560 : "auto",
      borderCollapse: "separate",
      borderSpacing: 0,
      fontSize: 13,
    },
    th: {
      textAlign: "left",
      padding: "10px 12px",
      background: "rgba(255,255,255,0.07)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      whiteSpace: "nowrap",
      color: "rgba(255,255,255,0.6)",
      fontWeight: 800,
    },
    td: {
      padding: "11px 12px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      whiteSpace: "nowrap",
      color: "rgba(255,255,255,0.82)",
    },
    deleteButton: {
      border: "none",
      borderRadius: 999,
      background: "rgba(239,68,68,0.18)",
      color: "#fecaca",
      padding: "9px 14px",
      fontWeight: 900,
      cursor: "pointer",
      width: isMobile ? "100%" : "auto",
    },
    mobileSaleList: {
      display: "grid",
      gap: 10,
    },
    mobileSaleCard: {
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: 12,
      display: "grid",
      gap: 10,
    },
    mobileSaleTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      alignItems: "flex-start",
    },
    mobileSaleDate: {
      margin: "4px 0 0",
      fontSize: 12,
      color: "rgba(255,255,255,0.5)",
    },
    mobileSaleMeta: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      fontSize: 12,
      color: "rgba(255,255,255,0.64)",
    },
    emptyBox: {
      padding: 16,
      textAlign: "center",
      color: "rgba(255,255,255,0.55)",
      background: "rgba(255,255,255,0.06)",
      borderRadius: 16,
    },
    card: {
      borderRadius: 24,
      padding: 18,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
    },
  };
}