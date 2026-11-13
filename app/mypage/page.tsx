"use client";

import Link from "next/link";

// 会員ログインはパスワードを照合しておらず、他人の顧客情報を表示できてしまう作りだったため、
// 安全な仕組みに作り直すまで停止している（2026/11/13）。元のコードは git の履歴に残っている。
export default function MyPageStoppedPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#0b1220",
        color: "#fff",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>会員ページは現在ご利用いただけません</h1>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>
          ご予約やご契約については、店舗スタッフまでお問い合わせください。
        </p>
        <Link href="/login" style={{ color: "#93c5fd" }}>
          スタッフの方はこちらからログイン
        </Link>
      </div>
    </main>
  );
}
