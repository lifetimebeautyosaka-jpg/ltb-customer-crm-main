"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const pageBg = `
  radial-gradient(circle at 18% 28%, rgba(255,255,255,0.08) 0%, transparent 26%),
  radial-gradient(circle at 82% 68%, rgba(117,146,255,0.22) 0%, transparent 24%),
  radial-gradient(circle at 52% 12%, rgba(123,156,255,0.12) 0%, transparent 18%),
  linear-gradient(135deg, #0b1220 0%, #101a30 42%, #0a1326 72%, #08101d 100%)
`;

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
        background: pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
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
            "radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 34%, rgba(255,255,255,0) 72%)",
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
            "radial-gradient(circle, rgba(99,131,255,0.20) 0%, rgba(99,131,255,0.08) 38%, rgba(99,131,255,0) 74%)",
          filter: "blur(16px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.05), transparent 24%, transparent 72%, rgba(255,255,255,0.02) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 500,
          borderRadius: 30,
          padding: "34px 24px 28px",
          background: "rgba(10, 14, 24, 0.38)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 18px 48px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
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
              "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 72%)",
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
              "radial-gradient(circle, rgba(123,156,255,0.10) 0%, rgba(123,156,255,0) 72%)",
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
            Member Portal
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "flex-end",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.18)",
              }}
              aria-label="Life Time Beuty"
            >
              <div
                style={{
                  fontSize: "clamp(28px, 5vw, 42px)",
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                  color: "#ffffff",
                }}
              >
                Life Time
              </div>
              <div
                style={{
                  fontSize: "clamp(18px, 3vw, 26px)",
                  lineHeight: 1.1,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  color: "rgba(255,255,255,0.72)",
                  paddingBottom: 4,
                }}
              >
                Beuty
              </div>
            </div>
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
            会員様ログイン
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
            会員IDとパスワードを入力してマイページへお進みください。
          </p>

          <div style={{ display: "grid", gap: 14, textAlign: "left" }}>
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
                minHeight: 56,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: loading
                  ? "linear-gradient(180deg, rgba(56,60,70,0.96) 0%, rgba(28,30,38,0.98) 100%)"
                  : "linear-gradient(180deg, rgba(36,40,48,0.96) 0%, rgba(18,20,26,0.98) 100%)",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow:
                  "0 14px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "ログイン中..." : "会員ログイン"}
            </button>

            <Link href="/register" style={registerLinkStyle}>
              初めての方はこちら
              <br />
              <span style={registerSubStyle}>ID・パスワードを設定する</span>
            </Link>

            <Link href="/login" style={backLinkStyle}>
              ログイン選択へ戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(255,255,255,0.72)",
  marginBottom: 8,
  letterSpacing: "0.08em",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 52,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  padding: "0 14px",
  fontSize: 14,
  color: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
};

const registerLinkStyle: CSSProperties = {
  display: "block",
  width: "100%",
  borderRadius: 18,
  padding: "15px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 800,
  textAlign: "center",
  textDecoration: "none",
  lineHeight: 1.6,
  boxSizing: "border-box",
};

const registerSubStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(255,255,255,0.62)",
};

const backLinkStyle: CSSProperties = {
  display: "block",
  textAlign: "center",
  marginTop: 4,
  color: "rgba(255,255,255,0.66)",
  fontSize: 13,
  textDecoration: "none",
};