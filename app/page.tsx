import Link from "next/link";

const menuItems = [
  { href: "/customer", title: "顧客管理" },
  { href: "/reservation", title: "予約管理" },
  { href: "/sales", title: "売上管理" },
  { href: "/attendance", title: "出退勤管理" },
  { href: "/training", title: "トレーニング" },
  { href: "/accounting", title: "会計管理" },
  { href: "/subscription", title: "オンライン入会" },
  { href: "/account", title: "入会申請一覧" },
  { href: "/mypage", title: "会員マイページ" },
  { href: "/login", title: "会員ログイン" },
];

export default function HomePage() {
  return (
    <main style={pageStyle}>
      <div style={gridBgStyle} />
      <div style={glowTopStyle} />
      <div style={glowBottomStyle} />

      <div style={containerStyle}>
        <div style={logoWrapStyle}>
          <div style={logoStyle}>GYMUP</div>
        </div>

        <section style={heroStyle}>
          <div style={heroInnerStyle}>
            <div style={heroLabelStyle}>PREMIUM GYM MANAGEMENT SYSTEM</div>

            <h1 style={heroTitleStyle}>GYM UP</h1>

            <div style={goldLineStyle} />

            <p style={heroTextStyle}>
              パーソナルジム・ピラティス・ストレッチ運営を
              <br />
              上質なUIで一元管理するCRM
            </p>

            <div style={heroButtonWrapStyle}>
              <Link href="/reservation" style={primaryButtonStyle}>
                管理画面へ
              </Link>
              <Link href="/login" style={secondaryButtonStyle}>
                会員ログイン
              </Link>
            </div>
          </div>
        </section>

        <section style={menuSectionStyle}>
          <div style={menuGridStyle}>
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} style={menuCardStyle}>
                <span style={menuTitleStyle}>{item.title}</span>
                <span style={menuArrowStyle}>→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.04) 0%, transparent 30%), linear-gradient(180deg, #05070b 0%, #0a0d14 45%, #05070b 100%)",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif',
  color: "#ffffff",
};

const gridBgStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "36px 36px",
  opacity: 0.32,
  pointerEvents: "none",
};

const glowTopStyle: React.CSSProperties = {
  position: "absolute",
  top: 120,
  left: -80,
  width: 220,
  height: 220,
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(255,255,255,0.08), rgba(255,255,255,0))",
  filter: "blur(24px)",
  pointerEvents: "none",
};

const glowBottomStyle: React.CSSProperties = {
  position: "absolute",
  right: -100,
  bottom: 140,
  width: 240,
  height: 240,
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(255,255,255,0.06), rgba(255,255,255,0))",
  filter: "blur(28px)",
  pointerEvents: "none",
};

const containerStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 460,
  margin: "0 auto",
  padding: "42px 18px 56px",
};

const logoWrapStyle: React.CSSProperties = {
  marginBottom: 34,
};

const logoStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: "-0.03em",
  color: "#f8fafc",
  textShadow: "0 0 22px rgba(255,255,255,0.08)",
};

const heroStyle: React.CSSProperties = {
  marginBottom: 28,
};

const heroInnerStyle: React.CSSProperties = {
  padding: "10px 0 6px",
};

const heroLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.22em",
  color: "#9ca3af",
  marginBottom: 24,
};

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(54px, 17vw, 86px)",
  lineHeight: 0.95,
  fontWeight: 900,
  letterSpacing: "-0.07em",
  color: "#f8fafc",
  textShadow: "0 0 26px rgba(255,255,255,0.10)",
};

const goldLineStyle: React.CSSProperties = {
  width: 112,
  height: 4,
  borderRadius: 999,
  marginTop: 28,
  background: "linear-gradient(90deg, #d6b25e 0%, #f0d88e 100%)",
  boxShadow: "0 0 14px rgba(214,178,94,0.28)",
};

const heroTextStyle: React.CSSProperties = {
  marginTop: 28,
  marginBottom: 0,
  color: "#d1d5db",
  fontSize: 15,
  lineHeight: 1.95,
  fontWeight: 500,
};

const heroButtonWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 24,
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 150,
  padding: "14px 18px",
  borderRadius: 999,
  textDecoration: "none",
  background: "#f3f4f6",
  color: "#111827",
  fontWeight: 800,
  fontSize: 14,
  boxShadow: "0 10px 24px rgba(255,255,255,0.08)",
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 150,
  padding: "14px 18px",
  borderRadius: 999,
  textDecoration: "none",
  background: "rgba(255,255,255,0.05)",
  color: "#f9fafb",
  fontWeight: 800,
  fontSize: 14,
  border: "1px solid rgba(255,255,255,0.10)",
};

const menuSectionStyle: React.CSSProperties = {
  marginTop: 8,
};

const menuGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const menuCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  textDecoration: "none",
  color: "#ffffff",
  borderRadius: 28,
  minHeight: 112,
  padding: "0 22px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.035) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 16px 36px rgba(0,0,0,0.30)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

const menuTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#f8fafc",
};

const menuArrowStyle: React.CSSProperties = {
  fontSize: 18,
  color: "#6b7280",
  flexShrink: 0,
};