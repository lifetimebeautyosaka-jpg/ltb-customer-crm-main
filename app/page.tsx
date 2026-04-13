"use client";

import Link from "next/link";

const menuItems = [
  {
    href: "/customer",
    title: "顧客管理",
    sub: "会員情報・回数・履歴を管理",
  },
  {
    href: "/reservation",
    title: "予約管理",
    sub: "予約確認・新規登録・日別確認",
  },
  {
    href: "/sales",
    title: "売上管理",
    sub: "売上登録・月別集計・分析",
  },
  {
    href: "/attendance",
    title: "出退勤管理",
    sub: "スタッフ打刻・勤務状況確認",
  },
  {
    href: "/accounting",
    title: "会計管理",
    sub: "前受金・サブスク・会計集計",
  },
  {
    href: "/subscription",
    title: "サブスク申込",
    sub: "Stripe申込ページの確認",
  },
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f3f5f7 0%, #eceff3 38%, #f8fafc 100%)",
        padding: "24px 14px 48px",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 22,
        }}
      >
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 32,
            padding: "34px 26px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.66) 100%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.78)",
            boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -90,
              right: -30,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(220,38,38,0.10) 0%, rgba(220,38,38,0) 72%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -100,
              left: -40,
              width: 260,
              height: 260,
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
              gap: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap",
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
                    background: "rgba(255,255,255,0.82)",
                    border: "1px solid rgba(226,232,240,0.95)",
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    marginBottom: 14,
                  }}
                >
                  LIFETIME BEAUTY / GYMUP
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(30px, 5vw, 48px)",
                    lineHeight: 1.08,
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "#111827",
                  }}
                >
                  Life Time Beauty
                  <br />
                  Management System
                </h1>

                <p
                  style={{
                    margin: "18px 0 0",
                    maxWidth: 720,
                    fontSize: 14,
                    lineHeight: 1.95,
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  顧客・予約・売上・会計・勤怠をまとめて管理する
                  Life Time Beauty専用の管理トップです。
                  会員様は専用ログインページからマイページへご案内します。
                </p>
              </div>

              <Link
                href="/login"
                style={{
                  textDecoration: "none",
                  height: 46,
                  padding: "0 18px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(17,24,39,0.10)",
                  color: "#111827",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                }}
              >
                会員様ログイン
              </Link>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link href="/reservation" style={primaryButtonStyle}>
                今日の予約を見る
              </Link>
              <Link href="/customer" style={secondaryButtonStyle}>
                顧客一覧へ
              </Link>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
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
                  minHeight: 172,
                  borderRadius: 26,
                  padding: 22,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.68) 100%)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.76)",
                  boxShadow: "0 16px 42px rgba(15,23,42,0.07)",
                  display: "grid",
                  alignContent: "space-between",
                  gap: 18,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    background:
                      "linear-gradient(135deg, rgba(17,24,39,0.98) 0%, rgba(220,38,38,0.92) 100%)",
                    boxShadow: "0 12px 28px rgba(17,24,39,0.18)",
                  }}
                />

                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: "#111827",
                      marginBottom: 8,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.85,
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
            padding: "18px 18px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.64) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.75)",
            boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                Member Access
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.9,
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                会員様はログインページから入り、マイページで契約プラン・残回数・予約・お支払い履歴を確認できます。
              </div>
            </div>

            <Link href="/login" style={memberLargeButtonStyle}>
              会員様ログインページへ
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

const memberLargeButtonStyle: React.CSSProperties = {
  height: 46,
  padding: "0 18px",
  borderRadius: 14,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(17,24,39,0.10)",
  whiteSpace: "nowrap",
};