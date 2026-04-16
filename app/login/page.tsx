"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const pageBg =
  "radial-gradient(circle at top right, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 26%), linear-gradient(135deg, #050816 0%, #0b1120 38%, #111827 100%)";

export default function LoginPage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMemberLogin = async () => {
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
    }, 700);
  };

  const handleStaffEnter = () => {
    localStorage.setItem("gymup_staff_logged_in", "true");
    localStorage.removeItem("gymup_member_logged_in");
    localStorage.removeItem("gymup_member_id");
    router.push("/");
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
        className="login-shell"
        style={{
          width: "100%",
          maxWidth: 1180,
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: 18,
        }}
      >
        <section
          className="login-left"
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 32,
            padding: "36px 30px",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.78) 0%, rgba(17,24,39,0.72) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.05)",
            minHeight: 560,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -60,
              width: 260,
              height: 260,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(249,115,22,0.22) 0%, rgba(249,115,22,0) 72%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -110,
              left: -50,
              width: 260,
              height: 260,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 72%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              height: "100%",
              display: "grid",
              alignContent: "space-between",
              gap: 28,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#f8fafc",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  marginBottom: 18,
                }}
              >
                GYMUP PORTAL
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(32px, 5vw, 50px)",
                  lineHeight: 1.08,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "#ffffff",
                }}
              >
                Life Time Beauty
                <br />
                Member & Staff Portal
              </h1>

              <p
                style={{
                  marginTop: 18,
                  maxWidth: 560,
                  fontSize: 15,
                  lineHeight: 1.95,
                  color: "rgba(226,232,240,0.78)",
                  fontWeight: 500,
                }}
              >
                会員様はマイページへログインして予約・サブスク・購入履歴を確認。
                スタッフは管理画面から予約・顧客・売上をスムーズに管理できます。
              </p>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <InfoCard
                title="この画面からできること"
                items={[
                  "会員様マイページへログイン",
                  "予約状況・サブスク状況を確認",
                  "商品購入ページへの移動",
                  "スタッフ管理画面への入場",
                ]}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <MiniCard label="MEMBER" value="ID・パスワードでログイン" />
                <MiniCard label="STAFF" value="ワンタップで管理画面へ" />
              </div>
            </div>
          </div>
        </section>

        <section
          className="login-right"
          style={{
            position: "relative",
            borderRadius: 32,
            padding: "30px 24px",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(17,24,39,0.82) 100%)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.05)",
            display: "grid",
            alignContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: 430,
              width: "100%",
              margin: "0 auto",
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

            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#ffffff",
                marginBottom: 8,
                letterSpacing: "-0.02em",
              }}
            >
              会員様ログイン
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.85,
                color: "rgba(226,232,240,0.72)",
                fontWeight: 500,
                marginBottom: 26,
              }}
            >
              会員IDとパスワードを入力してください
            </div>

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
                onClick={handleMemberLogin}
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

              <div
                style={{
                  position: "relative",
                  textAlign: "center",
                  margin: "6px 0",
                  color: "rgba(226,232,240,0.36)",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                }}
              >
                OR
              </div>

              <button
                onClick={handleStaffEnter}
                style={{
                  width: "100%",
                  height: 54,
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.04)",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 14px 28px rgba(0,0,0,0.20)",
                }}
              >
                スタッフ管理画面へ
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                fontSize: 12,
                lineHeight: 1.9,
                color: "rgba(226,232,240,0.62)",
                fontWeight: 500,
              }}
            >
              ※ 会員ログイン情報が不明な場合は店舗スタッフまでご連絡ください。
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .login-left,
          .login-right {
            min-height: auto !important;
          }

          .login-shell {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function InfoCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 20,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: "#ffffff",
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item) => (
          <div
            key={item}
            style={{
              fontSize: 14,
              color: "rgba(226,232,240,0.78)",
              fontWeight: 500,
              lineHeight: 1.85,
            }}
          >
            ・{item}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#fdba74",
          marginBottom: 8,
          letterSpacing: "0.10em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "#ffffff",
          lineHeight: 1.6,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(226,232,240,0.72)",
  marginBottom: 8,
  letterSpacing: "0.06em",
};

const inputStyle: CSSProperties = {
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