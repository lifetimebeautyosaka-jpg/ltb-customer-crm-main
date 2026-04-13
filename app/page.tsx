"use client";

import Link from "next/link";

const menuItems = [
  {
    href: "/customer",
    title: "顧客管理",
    sub: "会員情報・回数・履歴を管理",
    icon: "👥",
  },
  {
    href: "/reservation",
    title: "予約管理",
    sub: "予約確認・新規登録・日別確認",
    icon: "📅",
  },
  {
    href: "/sales",
    title: "売上管理",
    sub: "売上登録・月別集計・分析",
    icon: "💴",
  },
  {
    href: "/attendance",
    title: "出退勤管理",
    sub: "スタッフ打刻・勤務状況確認",
    icon: "⏰",
  },
  {
    href: "/accounting",
    title: "会計管理",
    sub: "前受金・サブスク・会計集計",
    icon: "📊",
  },
  {
    href: "/subscription",
    title: "サブスク申込",
    sub: "Stripe申込ページの確認",
    icon: "💳",
  },
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f4f6f8 0%, #e9edf2 45%, #f8fafc 100%)",
        padding: "20px 14px 40px",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 28,
            padding: "28px 22px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.64) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(220,38,38,0.10) 0%, rgba(220,38,38,0) 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -70,
              left: -30,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(17,24,39,0.08) 0%, rgba(17,24,39,0) 72%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "grid",
              gap: 18,
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
                  background: "rgba(255,255,255,0.75)",
                  border: "1px solid rgba(226,232,240,0.9)",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#64748b",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                GYMUP MANAGEMENT
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(28px, 5vw, 42px)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "#111827",
                  lineHeight: 1.15,
                }}
              >
                Life Time Beauty
                <br />
                管理トップ
              </h1>

              <p
                style={{
                  margin: "14px 0 0",
                  maxWidth: 700,
                  fontSize: 14,
                  lineHeight: 1.9,
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                顧客管理・予約・売上・会計・勤怠をひとつにまとめた
                GYMUPの管理画面です。店側の業務をここから管理し、
                会員様はログインページからマイページへ案内します。
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <Link href="/reservation" style={primaryButtonStyle}>
                今日の予約を見る
              </Link>

              <Link href="/customer" style={secondaryButtonStyle}>
                顧客一覧へ
              </Link>

              <Link href="/login" style={memberButtonStyle}>
                会員様ログイン
              </Link>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  height: "100%",
                  minHeight: 158,
                  borderRadius: 24,
                  padding: 20,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.68) 100%)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.72)",
                  boxShadow: "0 16px 40px rgba(15,23,42,0.07)",
                  display: "grid",
                  alignContent: "space-between",
                  gap: 16,
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    display: "grid",
                    placeItems: "center",
                    background:
                      "linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(220,38,38,0.90) 100%)",
                    color: "#fff",
                    fontSize: 24,
                    boxShadow: "0 10px 24px rgba(17,24,39,0.18)",
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#111827",
                      marginBottom: 8,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {item.sub}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section
          style={{
            borderRadius: 24,
            padding: "20px 18px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.62) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#111827",
            }}
          >
            会員様導線
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.9,
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            会員様には <span style={{ color: "#111827", fontWeight: 800 }}>/login</span>{" "}
            を案内し、ログイン後に
            <span style={{ color: "#111827", fontWeight: 800 }}> /mypage</span>
            へ遷移させる運用にします。店側はこのTOPからそのまま管理画面に入れます。
          </div>

          <div style={{ marginTop: 4 }}>
            <Link href="/login" style={smallMemberButtonStyle}>
              会員様ログインページを開く
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  height: 48,
  padding: "0 18px",
  borderRadius: 14,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 800,
  color: "#fff",
  background: "linear-gradient(135deg, #111827 0%, #dc2626 100%)",
  boxShadow: "0 12px 28px rgba(17,24,39,0.18)",
};

const secondaryButtonStyle: React.CSSProperties = {
  height: 48,
  padding: "0 18px",
  borderRadius: 14,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const memberButtonStyle: React.CSSProperties = {
  height: 48,
  padding: "0 18px",
  borderRadius: 14,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(17,24,39,0.10)",
};

const smallMemberButtonStyle: React.CSSProperties = {
  height: 42,
  padding: "0 16px",
  borderRadius: 12,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 800,
  color: "#fff",
  background: "#111827",
};