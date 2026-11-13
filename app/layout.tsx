import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
