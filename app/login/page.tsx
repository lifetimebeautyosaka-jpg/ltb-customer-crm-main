"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const pageBg =
  "linear-gradient(135deg, #f4f6f8 0%, #e9edf2 45%, #f8fafc 100%)";

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

      // スタッフ状態は消しておく
      localStorage.removeItem("gymup_staff_logged_in");

      router.push("/mypage");
    }, 700);
  };

  const handleStaffEnter = () => {
    localStorage.setItem("gymup_staff_logged_in", "true");

    // 会員状態は消しておく
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
        padding: "20px 14px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: 18,
        }}
      >
        <section
          className="login-left"
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 28,
            padding: "34px 28px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.66) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.74)",
            boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
            minHeight: 520,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -70,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(220,38,38,0.10) 0%, rgba(220,38,38,0) 72%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -90,
              left: -40,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(17,24,39,0.08) 0%, rgba(17,24,39,0) 72%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              height: "100%",
              display: "grid",
              alignContent: "space-between",
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(226,232,240,0.95)",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  marginBottom: 16,
                }}
              >
                GYMUP PORTAL
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(30px, 5vw, 44px)",
                  lineHeight: 1.15,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "#111827",
                }}
              >
                Life Time Beauty
                <br />
                ログインポータル
              </h1>

              <p
                style={{
                  marginTop: 16,
                  maxWidth: 540,
                  fontSize: 14,
                  lineHeight: 1.9,
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                会員様はマイページへログイン、スタッフは管理画面へそのまま入れます。
              </p>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <InfoCard
                title="この画面からできること"
                items={[
                  "会員様マイページへログイン",
                  "サブスク状況・予約確認",
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
                <MiniCard label="会員様" value="ID・パスワードでログイン" />
                <MiniCard label="スタッフ" value="クリックで管理画面へ" />
              </div>
            </div>
          </div>
        </section>

        <section
          className="login-right"
          style={{
            borderRadius: 28,
            padding: "28px 22px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.84) 0%, rgba(255,255,255,0.7) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.75)",
            boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
            display: "grid",
            alignContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#111827",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              会員様ログイン
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "#64748b",
                fontWeight: 600,
                textAlign: "center",
                marginBottom: 24,
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
                  marginTop: 4,
                  width: "100%",
                  height: 52,
                  border: "none",
                  borderRadius: 16,
                  background:
                    loading
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #111827 0%, #dc2626 100%)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 12px 28px rgba(17,24,39,0.18)",
                }}
              >
                {loading ? "ログイン中..." : "会員ログイン"}
              </button>

              <Link
                href="/register"
                style={{
                  display: "block",
                  width: "100%",
                  borderRadius: 16,
                  padding: "14px 16px",
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  color: "#c2410c",
                  fontSize: 14,
                  fontWeight: 800,
                  textAlign: "center",
                  textDecoration: "none",
                  boxShadow: "0 10px 24px rgba(249,115,22,0.12)",
                }}
              >
                初めての方はこちら
                <br />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#9a3412",
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
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                または
              </div>

              <button
                onClick={handleStaffEnter}
                style={{
                  width: "100%",
                  height: 52,
                  border: "1px solid #dbe2ea",
                  borderRadius: 16,
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
                }}
              >
                スタッフ管理画面へ
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                textAlign: "center",
                fontSize: 12,
                lineHeight: 1.8,
                color: "#64748b",
                fontWeight: 600,
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

          main > div {
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
        borderRadius: 22,
        padding: 18,
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(226,232,240,0.88)",
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: "#111827",
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
              color: "#475569",
              fontWeight: 600,
              lineHeight: 1.8,
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
        borderRadius: 20,
        padding: 16,
        background: "rgba(255,255,255,0.74)",
        border: "1px solid rgba(226,232,240,0.88)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#64748b",
          marginBottom: 8,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 900,
          color: "#111827",
          lineHeight: 1.5,
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
  color: "#64748b",
  marginBottom: 8,
  letterSpacing: "0.06em",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 50,
  borderRadius: 14,
  border: "1px solid #dbe2ea",
  background: "rgba(255,255,255,0.95)",
  padding: "0 14px",
  fontSize: 14,
  color: "#111827",
  outline: "none",
};