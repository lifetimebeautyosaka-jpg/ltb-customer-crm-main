import Link from "next/link";

export default function HomePage() {
  return (
    <main style={pageStyle}>
      <div style={gridStyle} />
      <div style={topGlowStyle} />
      <div style={leftGlowStyle} />
      <div style={rightGlowStyle} />
      <div style={sparkleOneStyle} />
      <div style={sparkleTwoStyle} />
      <div style={sparkleThreeStyle} />

      <div style={containerStyle}>
        <header style={headerStyle}>
          <div style={logoWrapStyle}>
            <img src="/gymup-logo.png" alt="GYMUP" style={logoImageStyle} />
          </div>
        </header>

        <section style={heroCardStyle}>
          <div style={shineOverlayStyle} />
          <div style={heroInnerStyle}>
            <div style={eyebrowStyle}>PREMIUM GYM &amp; PILATES MANAGEMENT SYSTEM</div>

            <h1 style={titleStyle}>
              GYMUP CRM
            </h1>

            <p style={descStyle}>
              パーソナルジム・ストレッチ・ピラティス運営を
              <br />
              美しく一元管理するプレミアムCRM
            </p>

            <div style={buttonRowStyle}>
              <Link href="/reservation" style={primaryButtonStyle}>
                管理画面へ
              </Link>
              <Link href="/login" style={secondaryButtonStyle}>
                会員ログイン
              </Link>
            </div>

            <div style={menuGridStyle}>
              <Link href="/customer" style={menuCardStyle}>
                <div style={menuLabelStyle}>CUSTOMER</div>
                <div style={menuTitleStyle}>顧客管理</div>
                <div style={menuDescStyle}>顧客情報・契約状況・履歴管理</div>
              </Link>

              <Link href="/reservation" style={menuCardStyle}>
                <div style={menuLabelStyle}>RESERVATION</div>
                <div style={menuTitleStyle}>予約管理</div>
                <div style={menuDescStyle}>予約登録・確認・導線管理</div>
              </Link>

              <Link href="/sales" style={menuCardStyle}>
                <div style={menuLabelStyle}>SALES</div>
                <div style={menuTitleStyle}>売上管理</div>
                <div style={menuDescStyle}>売上入力・集計・分析管理</div>
              </Link>
            </div>
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
    "radial-gradient(circle at top, rgba(80,80,90,0.25) 0%, rgba(14,16,20,1) 38%), linear-gradient(135deg, #0b0d11 0%, #151922 42%, #0a0c10 100%)",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif',
  color: "#ffffff",
};

const gridStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
  opacity: 0.55,
  pointerEvents: "none",
};

const topGlowStyle: React.CSSProperties = {
  position: "absolute",
  top: "-120px",
  left: "50%",
  transform: "translateX(-50%)",
  width: "720px",
  height: "320px",
  background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 72%)",
  pointerEvents: "none",
};

const leftGlowStyle: React.CSSProperties = {
  position: "absolute",
  left: "-120px",
  bottom: "80px",
  width: "340px",
  height: "340px",
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(255,168,76,0.16) 0%, rgba(255,168,76,0) 72%)",
  filter: "blur(10px)",
  pointerEvents: "none",
};

const rightGlowStyle: React.CSSProperties = {
  position: "absolute",
  right: "-100px",
  top: "160px",
  width: "320px",
  height: "320px",
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(122,138,255,0.12) 0%, rgba(122,138,255,0) 70%)",
  filter: "blur(14px)",
  pointerEvents: "none",
};

const sparkleBase: React.CSSProperties = {
  position: "absolute",
  width: "10px",
  height: "10px",
  borderRadius: "999px",
  background: "#ffffff",
  boxShadow: "0 0 18px rgba(255,255,255,0.9), 0 0 36px rgba(255,255,255,0.55)",
  pointerEvents: "none",
};

const sparkleOneStyle: React.CSSProperties = {
  ...sparkleBase,
  top: "110px",
  right: "22%",
};

const sparkleTwoStyle: React.CSSProperties = {
  ...sparkleBase,
  top: "280px",
  left: "14%",
  width: "7px",
  height: "7px",
};

const sparkleThreeStyle: React.CSSProperties = {
  ...sparkleBase,
  bottom: "180px",
  right: "12%",
  width: "8px",
  height: "8px",
};

const containerStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "34px 18px 70px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: "28px",
};

const logoWrapStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
};

const logoImageStyle: React.CSSProperties = {
  width: "160px",
  height: "auto",
  display: "block",
  objectFit: "contain",
  filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.35))",
};

const heroCardStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: "34px",
  overflow: "hidden",
  background: "linear-gradient(180deg, rgba(25,28,38,0.82) 0%, rgba(19,21,29,0.9) 100%)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow:
    "0 24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
};

const shineOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: "-120px",
  left: "-120px",
  width: "420px",
  height: "420px",
  background:
    "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 28%, rgba(255,255,255,0) 72%)",
  pointerEvents: "none",
};

const heroInnerStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "34px 22px 26px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "11px",
  letterSpacing: "0.24em",
  fontWeight: 600,
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(44px, 12vw, 88px)",
  lineHeight: 0.95,
  letterSpacing: "-0.06em",
  fontWeight: 900,
  color: "#ffffff",
  textShadow: "0 0 18px rgba(255,255,255,0.18)",
};

const descStyle: React.CSSProperties = {
  marginTop: "26px",
  marginBottom: 0,
  color: "rgba(255,255,255,0.82)",
  fontSize: "clamp(16px, 2.9vw, 20px)",
  lineHeight: 1.85,
  fontWeight: 400,
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginTop: "30px",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "170px",
  padding: "14px 22px",
  borderRadius: "999px",
  background: "linear-gradient(180deg, #ffffff 0%, #d9d9de 100%)",
  color: "#111318",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 800,
  boxShadow: "0 10px 26px rgba(255,255,255,0.16)",
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "170px",
  padding: "14px 22px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

const menuGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
  marginTop: "34px",
};

const menuCardStyle: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "#ffffff",
  borderRadius: "24px",
  padding: "18px 16px 20px",
  minHeight: "174px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

const menuLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.16em",
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
};

const menuTitleStyle: React.CSSProperties = {
  marginTop: "14px",
  fontSize: "clamp(24px, 5.5vw, 38px)",
  lineHeight: 1.2,
  fontWeight: 900,
  letterSpacing: "-0.04em",
};

const menuDescStyle: React.CSSProperties = {
  marginTop: "12px",
  color: "rgba(255,255,255,0.6)",
  fontSize: "13px",
  lineHeight: 1.7,
};