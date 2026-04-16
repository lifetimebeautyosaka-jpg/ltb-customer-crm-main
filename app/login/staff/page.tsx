"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const pageBg =
  "radial-gradient(circle at top right, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 24%), linear-gradient(135deg, #030712 0%, #0b1120 42%, #111827 100%)";

export default function StaffLoginPage() {
  const router = useRouter();

  const handleEnter = () => {
    localStorage.setItem("gymup_staff_logged_in", "true");
    localStorage.removeItem("gymup_member_logged_in");
    localStorage.removeItem("gymup_member_id");
    router.push("/dashboard");
  };

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
          maxWidth: 480,
          borderRadius: 32,
          padding: "34px 24px 28px",
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.86) 0%, rgba(17,24,39,0.92) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.05)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 72%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 72%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "7px 12px",
              borderRadius: 999,
              background: "rgba(249,115,22,0.12)",
              color: "#fdba74",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              marginBottom: 18,
            }}
          >
            STAFF LOGIN
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <Image
              src="/logo.png"
              alt="GYMUP"
              width={260}
              height={104}
              priority
              style={{
                width: "min(260px, 72vw)",
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.35))",
              }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            スタッフ専用ログイン
          </h1>

          <p
            style={{
              marginTop: 12,
              marginBottom: 26,
              fontSize: 14,
              lineHeight: 1.9,
              color: "rgba(226,232,240,0.72)",
              fontWeight: 500,
            }}
          >
            管理画面ダッシュボードへ進みます
          </p>

          <div
            style={{
              borderRadius: 22,
              padding: "18px 16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "left",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#fdba74",
                letterSpacing: "0.08em",
                marginBottom: 10,
              }}
            >
              STAFF PORTAL
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                fontSize: 14,
                lineHeight: 1.8,
                color: "rgba(226,232,240,0.78)",
                fontWeight: 500,
              }}
            >
              <div>・予約管理</div>
              <div>・顧客管理</div>
              <div>・売上 / 会計確認</div>
              <div>・勤怠 / サブスク管理</div>
            </div>
          </div>

          <button
            onClick={handleEnter}
            style={{
              width: "100%",
              height: 56,
              border: "none",
              borderRadius: 18,
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 18px 36px rgba(249,115,22,0.30)",
            }}
          >
            ダッシュボードへ入る
          </button>

          <Link
            href="/login"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 16,
              color: "rgba(226,232,240,0.66)",
              fontSize: 13,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ログイン選択へ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}