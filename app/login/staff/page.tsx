"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const pageBg = `
  radial-gradient(circle at 18% 30%, rgba(255,140,102,0.34) 0%, transparent 28%),
  radial-gradient(circle at 82% 66%, rgba(117,146,255,0.30) 0%, transparent 24%),
  radial-gradient(circle at 52% 12%, rgba(123,156,255,0.22) 0%, transparent 18%),
  linear-gradient(135deg, #0b1220 0%, #101a30 42%, #0a1326 72%, #08101d 100%)
`;

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
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 背景の大きなぼかし玉 */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-12%",
          width: "52vw",
          height: "52vw",
          minWidth: 280,
          minHeight: 280,
          maxWidth: 620,
          maxHeight: 620,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,156,112,0.30) 0%, rgba(255,156,112,0.12) 36%, rgba(255,156,112,0) 72%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "-10%",
          top: "26%",
          width: "34vw",
          height: "34vw",
          minWidth: 220,
          minHeight: 220,
          maxWidth: 420,
          maxHeight: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,131,255,0.28) 0%, rgba(99,131,255,0.10) 38%, rgba(99,131,255,0) 74%)",
          filter: "blur(16px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.06), transparent 24%, transparent 72%, rgba(255,255,255,0.03) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 500,
          borderRadius: 30,
          padding: "34px 24px 28px",
          background: "rgba(10, 14, 24, 0.34)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 18px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          position: "relative",
          zIndex: 1,
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
              "radial-gradient(circle, rgba(255,152,88,0.20) 0%, rgba(255,152,88,0) 72%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(123,156,255,0.14) 0%, rgba(123,156,255,0) 72%)",
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
              alignItems: "center",
              justifyContent: "center",
              minHeight: 34,
              padding: "0 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.72)",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 18,
              fontWeight: 700,
            }}
          >
            Staff Portal
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Image
              src="/logo.png"
              alt="GYMUP"
              width={280}
              height={112}
              priority
              style={{
                width: "min(280px, 72vw)",
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 12px 34px rgba(0,0,0,0.30))",
              }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.15,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
            }}
          >
            スタッフ専用ログイン
          </h1>

          <p
            style={{
              margin: "12px auto 24px",
              maxWidth: 360,
              color: "rgba(255,255,255,0.70)",
              fontSize: 14,
              lineHeight: 1.9,
            }}
          >
            予約・顧客・売上・勤怠などの管理画面へ進みます。
          </p>

          <div
            style={{
              borderRadius: 24,
              padding: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.035)",
              textAlign: "left",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.48)",
                marginBottom: 12,
                letterSpacing: "0.14em",
              }}
            >
              AVAILABLE FEATURES
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                fontSize: 14,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.76)",
              }}
            >
              <div>・予約管理</div>
              <div>・顧客管理</div>
              <div>・売上 / 会計管理</div>
              <div>・勤怠 / サブスク管理</div>
            </div>
          </div>

          <button
            onClick={handleEnter}
            style={{
              width: "100%",
              minHeight: 54,
              border: "none",
              borderRadius: 16,
              background: "linear-gradient(135deg, #f5a041 0%, #f08a27 55%, #d96a08 100%)",
              color: "#141414",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 12px 28px rgba(240, 138, 39, 0.24)",
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
              color: "rgba(255,255,255,0.68)",
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