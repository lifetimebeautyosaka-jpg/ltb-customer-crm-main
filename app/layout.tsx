import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";

// ロゴ用
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "swap",
});

// 見出し用
const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// 本文用
const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "ジムアップCRM",
  description: "ジムアップの予約・顧客・売上管理",
  // 日本語のページを Chrome が「英語」と判断して自動翻訳すると、
  // 「件」が「枚/個」、「翌日」が「火曜日」などに化けるうえ、
  // 翻訳された文字は React が更新できず、月を切り替えても表示が古いまま残る。
  other: { google: "notranslate" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      translate="no"
      className={`${cormorant.variable} ${shippori.variable} ${notoSansJp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
