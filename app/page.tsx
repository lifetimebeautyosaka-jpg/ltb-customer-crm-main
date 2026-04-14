import Link from "next/link";

const quickLinks = [
  {
    href: "/reservation",
    title: "予約管理",
    description: "日々の予約確認・登録・導線管理",
  },
  {
    href: "/customer",
    title: "顧客管理",
    description: "顧客情報・契約状況・対応履歴を一覧化",
  },
  {
    href: "/sales",
    title: "売上管理",
    description: "売上登録・集計・サブスク連携の中心",
  },
  {
    href: "/subscription",
    title: "サブスク管理",
    description: "月額会員・残回数・継続状況を確認",
  },
];

const subLinks = [
  { href: "/attendance", label: "勤怠管理" },
  { href: "/accounting", label: "会計管理" },
  { href: "/login", label: "会員ログイン" },
];

export default function HomePage() {
  return (
    <main style={pageStyle}>
      <div style={backgroundGlowTop} />
      <div style={backgroundGlowBottom} />

      <section style={heroWrapStyle}>
        <div style={heroBadgeStyle}>GYMUP MANAGEMENT SYSTEM</div>

        <h1 style={heroTitleStyle}>
          美しく管理する。
          <br />
          <span style={heroTitleAccentStyle}>ジム運営を、ひとつに。</span>
        </h1>

        <p style={heroTextStyle}>
          予約・顧客・売上・サブスクを一元管理。
          <br />
          Life Time Beautyらしい、上質で見やすい管理画面へ。
        </p>

        <div style={heroButtonRowStyle}>
          <Link href="/reservation" style={primaryButtonStyle}>
            管理画面へ
          </Link>
          <Link href="/login" style={secondaryButtonStyle}>
            会員ログイン
          </Link>
        </div>
      </section>

      <section style={quickSectionStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>MAIN MENU</div>
          <h2 style={sectionTitleStyle}>よく使う機能</h2>
        </div>

        <div style={cardGridStyle}>
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} style={menuCardStyle}>
              <div style={menuCardInnerStyle}>
                <div style={menuCardTopStyle}>
                  <div style={menuDotStyle} />
                  <div style={menuArrowStyle}>→</div>
                </div>

                <div style={menuTitleStyle}>{item.title}</div>
                <div style={menuDescStyle}>{item.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section style={bottomSectionStyle}>
        <div style={miniPanelStyle}>
          <div style={miniPanelEyebrowStyle}>SUB MENU</div>
          <div style={pillWrapStyle}>
            {subLinks.map((item) => (
              <Link key={item.href} href={item.href} style={pillStyle}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, #f5f5f7 0%, #eceef1 35%, #e3e6ea 100%)",
  padding: "48px 20px 80px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif',
};

const backgroundGlowTop: React.CSSProperties = {
  position: "absolute",
  top: "-120px",
  right: "-120px",
  width: "360px",
  height: "360px",
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 72%)",
  pointerEvents: "none",
};

const backgroundGlowBottom: React.CSSProperties = {
  position: "absolute",
  bottom: "-160px",
  left: "-120px",
  width: "420px",
  height: "420px",
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0) 72%)",
  pointerEvents: "none",
};

const heroWrapStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "42px 28px",
  borderRadius: "32px",
  background: "rgba(255, 255, 255, 0.48)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.58)",
  boxShadow: "0 18px 60px rgba(15, 23, 42, 0.08)",
};

const heroBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(17, 17, 17, 0.82)",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  marginBottom: "22px",
};

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111111",
  fontSize: "clamp(34px, 7vw, 72px)",
  lineHeight: 1.08,
  letterSpacing: "-0.04em",
  fontWeight: 800,
};

const heroTitleAccentStyle: React.CSSProperties = {
  color: "#4b5563",
};

const heroTextStyle: React.CSSProperties = {
  marginTop: "20px",
  marginBottom: 0,
  color: "#4b5563",
  fontSize: "clamp(15px, 2.4vw, 18px)",
  lineHeight: 1.85,
  maxWidth: "700px",
  fontWeight: 500,
};

const heroButtonRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
  marginTop: "30px",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "190px",
  padding: "15px 22px",
  borderRadius: "999px",
  textDecoration: "none",
  background: "#111111",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 700,
  boxShadow: "0 10px 30px rgba(17,17,17,0.18)",
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "190px",
  padding: "15px 22px",
  borderRadius: "999px",
  textDecoration: "none",
  background: "rgba(255,255,255,0.62)",
  color: "#111111",
  fontSize: "15px",
  fontWeight: 700,
  border: "1px solid rgba(255,255,255,0.72)",
  boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
};

const quickSectionStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1180px",
  margin: "34px auto 0",
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: "18px",
  padding: "0 4px",
};

const sectionEyebrowStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  marginBottom: "8px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111111",
  fontSize: "clamp(24px, 4vw, 34px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
};

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "18px",
};

const menuCardStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "28px",
  background: "rgba(255,255,255,0.5)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.62)",
  boxShadow: "0 14px 40px rgba(15, 23, 42, 0.07)",
  minHeight: "210px",
  display: "block",
  color: "inherit",
};

const menuCardInnerStyle: React.CSSProperties = {
  height: "100%",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
};

const menuCardTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "26px",
};

const menuDotStyle: React.CSSProperties = {
  width: "12px",
  height: "12px",
  borderRadius: "999px",
  background: "#111111",
  boxShadow: "0 0 24px rgba(17,17,17,0.18)",
};

const menuArrowStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "22px",
  fontWeight: 600,
};

const menuTitleStyle: React.CSSProperties = {
  color: "#111111",
  fontSize: "24px",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  marginBottom: "12px",
};

const menuDescStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: 1.75,
  fontWeight: 500,
};

const bottomSectionStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1180px",
  margin: "22px auto 0",
};

const miniPanelStyle: React.CSSProperties = {
  borderRadius: "28px",
  padding: "22px",
  background: "rgba(255,255,255,0.4)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.58)",
  boxShadow: "0 14px 40px rgba(15, 23, 42, 0.05)",
};

const miniPanelEyebrowStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  marginBottom: "14px",
};

const pillWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
};

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.78)",
  color: "#111111",
  fontSize: "14px",
  fontWeight: 700,
  border: "1px solid rgba(255,255,255,0.72)",
};