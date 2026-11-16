// 顧客の流入元（DB: customers.acquisition_channel のチェック制約と一致させること）
export const ACQUISITION_CHANNELS = [
  "ホットペッパー",
  "Googleマップ",
  "HP",
  "Instagram",
  "紹介",
  "その他",
] as const;

export type AcquisitionChannel = (typeof ACQUISITION_CHANNELS)[number];

export const DEFAULT_ACQUISITION_CHANNEL: AcquisitionChannel = "ホットペッパー";

export function normalizeAcquisitionChannel(value: unknown): AcquisitionChannel {
  const v = String(value ?? "").trim();
  return (ACQUISITION_CHANNELS as readonly string[]).includes(v)
    ? (v as AcquisitionChannel)
    : DEFAULT_ACQUISITION_CHANNEL;
}
