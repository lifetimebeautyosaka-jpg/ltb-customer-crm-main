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
      {/* 背景ぼかし */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-12%",
          width: "52vw",
          height: "52vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,156,112,0.30) 0%, transparent 72%)",
          filter: "blur(20px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "-10%",
          top: "30%",
          width: "40vw",
          height: "40vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,131,255,0.28) 0%, transparent 74%)",
          filter: "blur(20px)",
        }}
      />

      {/* カード */}
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          borderRadius: 30,
          padding: "34px 24px 28px",
          background: "rgba(10, 14, 24, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center" }}>
          {/* ロゴ（修正版🔥） */}
          <div style={{ marginBottom: 20 }}>
            <Image
              src="/logo.png"
              alt="GYMUP"
              width={500}
              height={200}
              priority
              style={{
                width: "240px",
                height: "auto",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
                filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.4))",
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 10,
            }}
          >
            スタッフログイン
          </h1>

          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 24,
            }}
          >
            管理画面へログインします
          </p>

          {/* ボタン */}
          <button
            onClick={handleEnter}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #ff8a00, #ff5e00)",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(255,100,0,0.4)",
            }}
          >
            ダッシュボードへ入る
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
      </div>
    </main>
  );
}