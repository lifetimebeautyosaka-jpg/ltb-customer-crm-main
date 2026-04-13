"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);

    // 🔥 仮ログイン（あとでSupabaseに変更）
    setTimeout(() => {
      localStorage.setItem("gymup_user_logged_in", "true");
      localStorage.setItem("gymup_user_email", email);

      router.push("/mypage");
    }, 800);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef2f7 50%, #f8fafc 100%)",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          borderRadius: 20,
          padding: 30,
          boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 900,
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          ログイン
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "#64748b",
            marginBottom: 24,
          }}
        >
          会員ページにログイン
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              height: 50,
              borderRadius: 12,
              border: "none",
              background:
                "linear-gradient(135deg, #111827 0%, #dc2626 100%)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </div>

        <div
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 13,
            color: "#64748b",
          }}
        >
          ※ 初回はスタッフにお問い合わせください
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  padding: "0 14px",
  fontSize: 14,
};