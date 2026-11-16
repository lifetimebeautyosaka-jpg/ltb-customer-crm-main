// ジムアップCRM 共通テーマ（案B ライト・高級感）
// 色・フォントはここと app/globals.css の CSS 変数（--gu-*）で管理する。

export const COLORS = {
  bg: "#F7F5F0", // 背景（アイボリー）
  ink: "#15171C", // メインの文字・黒いカード・下メニュー
  sub: "#5B5E66", // 補足の文字
  line: "#DCD6CA", // 区切り線・枠線
  gold: "#B08133", // アクセント
  goldText: "#8A6220", // 小さい文字のゴールド
  goldOnInk: "#E2C48C", // 黒の上のゴールド
  tagBorder: "#CDB68A", // タグの枠線
  card: "#FFFFFF", // カードの白
  track: "#E8E2D6", // 円グラフの下地
  danger: "#9C3B2E", // 削除・エラー
} as const;

export const FONTS = {
  logo: "var(--gu-font-logo)", // Cormorant Garamond
  heading: "var(--gu-font-heading)", // Shippori Mincho
  body: "var(--gu-font-body)", // Noto Sans JP
  num: "var(--gu-font-num)", // 数字（今までと同じ字体）
} as const;

// ---- 以前からある名前（他のページが使っている）。中身だけ新しいテーマに合わせる ----

export const BG = COLORS.bg;

export const GLASS = COLORS.card;

export const CARD = {
  background: COLORS.card,
  border: `1px solid ${COLORS.line}`,
  boxShadow: "0 1px 2px rgba(21,23,28,0.04)",
  borderRadius: "20px",
};

export const BUTTON_PRIMARY = {
  background: COLORS.ink,
  color: COLORS.bg,
  border: "none",
  borderRadius: "999px",
  fontWeight: 700,
  cursor: "pointer",
};
