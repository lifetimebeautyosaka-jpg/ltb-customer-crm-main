"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const pageBg = `
  radial-gradient(circle at 18% 30%, rgba(255,140,102,0.18) 0%, transparent 28%),
  radial-gradient(circle at 82% 66%, rgba(117,146,255,0.26) 0%, transparent 24%),
  radial-gradient(circle at 52% 12%, rgba(123,156,255,0.18) 0%, transparent 18%),
  linear-gradient(135deg, #0b1220 0%, #101a30 42%, #0a1326 72%, #08101d 100%)
`;

export default function StaffLoginPage() {
  const router = useRouter();

  const handleEnter = () => {
    localStorage.setItem("gymup_staff_logged_in", "true");
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
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 24,
          padding: "36px 28px",
          background: "rgba(15,18,28,0.55)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          textAlign: "center",
        }}
      >
        {/* ロゴ（完全安定版） */}
        <img
          src="/gymup-logo.png"
          alt="GYMUP"
          style={{
            width: "220px",
            height: "auto",
            margin: "0 auto 24px",
            display: "block",
          }}
        />

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          スタッフログイン
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.6)",
            marginBottom: 28,
          }}
        >
          管理画面へログイン
        </p>

        <button
          onClick={handleEnter}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(30,34,44,0.9)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
          }}
        >
          ダッシュボードへ
        </button>

        <Link
          href="/login"
          style={{
            display: "block",
            marginTop: 16,
            color: "#aaa",
            fontSize: 12,
          }}
        >
          戻る
        </Link>
      </div>
    </main>
  );
}