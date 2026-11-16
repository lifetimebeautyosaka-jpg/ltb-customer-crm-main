// サービスの分類（大分類・中分類）
// 大分類：トレーニング ／ リラクゼーション
// 中分類：トレーニング、ストレッチ、ヘッドスパ（ウェット・ドライ）、オイルマッサージ、足ツボ
//
// 売上・予約の「サービス（menu_type）」に新しい種類が入っていればそれを使う。
// 以前の「ストレッチ」で登録されたデータは、店舗やメニュー名・メモから推定する：
//   天満橋Ts → ウェットヘッドスパ、西梅田（アライブ）→ オイルマッサージ、
//   「ヘッド」→ ヘッドスパ、「アロマ」「オイル」→ オイルマッサージ、「足ツボ」→ 足ツボ

export const SERVICE_TYPES = [
  "トレーニング",
  "ストレッチ",
  "ウェットヘッドスパ",
  "ドライヘッドスパ",
  "オイルマッサージ",
  "足ツボ",
] as const;

export type ServiceTypeName = (typeof SERVICE_TYPES)[number];

export type MajorCategory = "トレーニング" | "リラクゼーション";

// グラフで並べる中分類（ヘッドスパはウェット・ドライをまとめる）
export const CHART_CATEGORIES = ["トレーニング", "ストレッチ", "ヘッドスパ", "オイルマッサージ", "足ツボ"] as const;
export type ChartCategory = (typeof CHART_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<ChartCategory, string> = {
  トレーニング: "#f97316",
  ストレッチ: "#2563eb",
  ヘッドスパ: "#db2777",
  オイルマッサージ: "#16a34a",
  足ツボ: "#a16207",
};

export function isServiceType(value: string): value is ServiceTypeName {
  return (SERVICE_TYPES as readonly string[]).includes(value);
}

export function classifyService(params: {
  menuType?: string | null;
  storeName?: string | null;
  text?: string | null; // メニュー名・メモ・顧客名など
}): ServiceTypeName {
  const menuType = (params.menuType || "").trim();
  const store = (params.storeName || "").trim();
  const text = `${params.text || ""}`;

  if (menuType === "トレーニング") return "トレーニング";
  if (isServiceType(menuType) && menuType !== "ストレッチ") return menuType;

  if (text.includes("足ツボ")) return "足ツボ";
  if (text.includes("ドライヘッド")) return "ドライヘッドスパ";
  if (store === "天満橋Ts" || text.includes("ヘッド")) return "ウェットヘッドスパ";
  if (store === "西梅田" || text.includes("アロマ") || text.includes("オイル")) return "オイルマッサージ";
  return "ストレッチ";
}

export function toChartCategory(type: ServiceTypeName): ChartCategory {
  if (type === "ウェットヘッドスパ" || type === "ドライヘッドスパ") return "ヘッドスパ";
  return type;
}

export function toMajorCategory(type: ServiceTypeName): MajorCategory {
  return type === "トレーニング" ? "トレーニング" : "リラクゼーション";
}

// 予約のメニュー名からサービスを判断する（予約 → 売上登録のとき）
export function serviceTypeFromMenu(menu?: string | null, storeName?: string | null): ServiceTypeName {
  const text = String(menu || "");
  for (const type of SERVICE_TYPES) {
    if (type !== "トレーニング" && type !== "ストレッチ" && text.includes(type)) return type;
  }
  if (text.includes("ヘッドスパ")) return storeName === "天満橋Ts" ? "ウェットヘッドスパ" : "ドライヘッドスパ";
  if (text.includes("アロマ") || text.includes("オイル")) return "オイルマッサージ";
  if (text.includes("足ツボ")) return "足ツボ";
  if (text.includes("ストレッチ") || /\d+分\d+回/.test(text)) return "ストレッチ";
  return "トレーニング";
}

// 細分化した6種類の色（構成比のグラフ用）
export const SERVICE_COLORS: Record<ServiceTypeName, string> = {
  トレーニング: "#f97316",
  ストレッチ: "#2563eb",
  ウェットヘッドスパ: "#db2777",
  ドライヘッドスパ: "#f9a8d4",
  オイルマッサージ: "#16a34a",
  足ツボ: "#a16207",
};
