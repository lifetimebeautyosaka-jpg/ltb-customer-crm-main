"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MemberLoginPage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!memberId || !password) {
      alert("会員IDとパスワードを入力してください");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      localStorage.setItem("gymup_member_logged_in", "true");
      localStorage.setItem("gymup_member_id", memberId);
      localStorage.removeItem("gymup_staff_logged_in");
      router.push("/mypage");
    }, 500);
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
          maxWidth: 460,
          borderRadius: 32,
          padding: "32px 24px",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(17,24,39,0.82) 100%)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.05)",
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
          MEMBER LOGIN
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          会員様ログイン
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
          会員IDとパスワードを入力してください
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={labelStyle}>会員ID</div>
            <input
              type="text"
              placeholder="会員IDを入力"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>パスワード</div>
            <input
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              marginTop: 6,
              width: "100%",
              height: 54,
              border: "none",
              borderRadius: 18,
              background: loading
                ? "#475569"
                : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 18px 36px rgba(249,115,22,0.28)",
            }}
          >
            {loading ? "ログイン中..." : "会員ログイン"}
          </button>

          <Link
            href="/register"
            style={{
              display: "block",
              width: "100%",
              borderRadius: 18,
              padding: "15px 16px",
              background: "rgba(249,115,22,0.08)",
              border: "1px solid rgba(249,115,22,0.32)",
              color: "#fdba74",
              fontSize: 14,
              fontWeight: 800,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            初めての方はこちら
            <br />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "rgba(254,215,170,0.84)",
              }}
            >
              ID・パスワードを設定する
            </span>
          </Link>

          <Link
            href="/login"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 4,
              color: "rgba(226,232,240,0.66)",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            ログイン選択へ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(226,232,240,0.72)",
  marginBottom: 8,
  letterSpacing: "0.06em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 52,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  padding: "0 14px",
  fontSize: 14,
  color: "#ffffff",
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
};