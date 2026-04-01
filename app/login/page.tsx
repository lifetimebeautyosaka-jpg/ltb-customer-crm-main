"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    // 管理者
    if (loginId === "admin" && password === "1234") {
      localStorage.setItem("gymup_logged_in", "true");
      localStorage.setItem("gymup_user_role", "admin");
      localStorage.setItem("gymup_current_staff_name", "管理者");
      localStorage.setItem("gymup_login_id", "admin");
      localStorage.setItem("gymup_current_login_id", "admin");
      router.push("/");
      return;
    }

    // スタッフ
    if (loginId === "staff01" && password === "1234") {
      localStorage.setItem("gymup_logged_in", "true");
      localStorage.setItem("gymup_user_role", "staff");
      localStorage.setItem("gymup_current_staff_name", "スタッフ");
      localStorage.setItem("gymup_login_id", "staff01");
      localStorage.setItem("gymup_current_login_id", "staff01");
      router.push("/");
      return;
    }

    setError("IDまたはパスワードが違います");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        background: `
          radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9), transparent 40%),
          radial-gradient(circle at 80% 30%, rgba(255,255,255,0.7), transparent 40%),
          linear-gradient(135deg, #eef2f7 0%, #dfe7ef 50%, #cfd6df 100%)
        `,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* キラキラ光 */}
      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.9), transparent)",
          top: "-80px",
          left: "-80px",
          filter: "blur(40px)",
        }}
      />

      <div
        style={{
          width: "360px",
          padding: "28px",
          borderRadius: "26px",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.8)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {/* ロゴ */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src="/gymup-logo.png"
            style={{
              width: "80px",
              height: "80px",
              objectFit: "contain",
            }}
          />
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "22px",
            fontWeight: 800,
            marginBottom: "20px",
          }}
        >
          GYMUP CRM ログイン
        </h1>

        {/* ID */}
        <input
          type="text"
          placeholder="ログインID"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          style={inputStyle}
        />

        {/* PASS */}
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, marginTop: "12px" }}
        />

        {/* エラー */}
        {error && (
          <div
            style={{
              marginTop: "12px",
              color: "#dc2626",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* ボタン */}
        <button onClick={handleLogin} style={loginButtonStyle}>
          ログイン
        </button>

        {/* 補助 */}
        <div
          style={{
            marginTop: "16px",
            fontSize: "12px",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          staff01 / 1234<br />
          admin / 1234
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid #ddd",
  fontSize: "14px",
};

const loginButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "18px",
  padding: "14px",
  borderRadius: "14px",
  background: "#111827",
  color: "#fff",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
};