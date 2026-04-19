"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();

  const handleEnter = () => {
    localStorage.setItem("gymup_logged_in", "true");
    localStorage.setItem("gymup_user_role", "staff");
    localStorage.setItem("gymup_staff_logged_in", "true");

    localStorage.removeItem("gymup_member_logged_in");
    localStorage.removeItem("gymup_member_id");

    router.push("/dashboard");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 26%), linear-gradient(135deg, #050816 0%, #0b1120 38%, #111827 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 14px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 32,
          padding: "32px 24px",
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
            padding: "7px 12px",
            borderRadius: 999,
            background: "rgba(249,115,22,0.12)",
            color: "#fdba74",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            marginBottom: 16,
          }}
        >
          STAFF LOGIN
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 900,
            color: "#ffffff",
          }}
        >
          スタッフログイン
        </h1>

        <p
          style={{
            marginTop: 10,
            marginBottom: 24,
            fontSize: 14,
            lineHeight: 1.8,
            color: "rgba(226,232,240,0.72)",
          }}
        >
          スタッフ権限でダッシュボードへ進みます
        </p>

        <button
          onClick={handleEnter}
          style={{
            width: "100%",
            height: 54,
            border: "none",
            borderRadius: 18,
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 18px 36px rgba(249,115,22,0.28)",
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
          }}
        >
          ログイン選択へ戻る
        </Link>
      </div>
    </main>
  );
}