"use client";

import Link from "next/link";

const pageBg =
  "radial-gradient(circle at top right, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 26%), linear-gradient(135deg, #050816 0%, #0b1120 38%, #111827 100%)";

export default function LoginSelectPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 14px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 32,
          padding: "38px 24px",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(17,24,39,0.82) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.05)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(249,115,22,0.12)",
            color: "#fdba74",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            marginBottom: 18,
          }}
        >
          GYMUP PORTAL
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(30px, 5vw, 40px)",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          Life Time Beauty
          <br />
          ログインを選択
        </h1>

        <p
          style={{
            marginTop: 14,
            marginBottom: 30,
            fontSize: 14,
            lineHeight: 1.9,
            color: "rgba(226,232,240,0.72)",
            maxWidth: 420,
            marginInline: "auto",
          }}
        >
          会員様とスタッフで入口を分けています。
          ご利用の画面を選択してください。
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          <Link
            href="/login/member"
            style={{
              display: "block",
              width: "100%",
              padding: "18px 16px",
              borderRadius: 20,
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              color: "#fff",
              fontSize: 17,
              fontWeight: 900,
              textDecoration: "none",
              boxShadow: "0 18px 36px rgba(249,115,22,0.28)",
            }}
          >
            会員ログイン
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "rgba(255,255,255,0.82)",
              }}
            >
              予約・サブスク・購入履歴を確認
            </div>
          </Link>

          <Link
            href="/login/staff"
            style={{
              display: "block",
              width: "100%",
              padding: "18px 16px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#ffffff",
              fontSize: 17,
              fontWeight: 900,
              textDecoration: "none",
              boxShadow: "0 14px 28px rgba(0,0,0,0.20)",
            }}
          >
            スタッフログイン
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "rgba(226,232,240,0.66)",
              }}
            >
              管理画面へ進む
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}