import Link from "next/link";

export default function HomePage() {
  return (
    <main style={pageStyle}>
      <div style={bgGrid} />

      <div style={container}>
        {/* ロゴ */}
        <div style={logoStyle}>GYMUP</div>

        {/* メインカード */}
        <div style={glassCard}>
          <div style={badge}>PREMIUM GYM MANAGEMENT</div>

          <h1 style={title}>
            GYMUP CRM
          </h1>

          <p style={desc}>
            パーソナルジム・ストレッチ・ピラティス運営を
            <br />
            美しく一元管理するプレミアムCRM
          </p>

          {/* ボタン */}
          <div style={btnWrap}>
            <Link href="/reservation" style={mainBtn}>
              管理画面へ
            </Link>

            <Link href="/login" style={subBtn}>
              会員ログイン
            </Link>
          </div>

          {/* メニュー */}
          <div style={cardWrap}>
            <Link href="/customer" style={menuCard}>
              <div style={menuEn}>CUSTOMER</div>
              <div style={menuJa}>顧客管理</div>
            </Link>

            <Link href="/reservation" style={menuCard}>
              <div style={menuEn}>RESERVATION</div>
              <div style={menuJa}>予約管理</div>
            </Link>

            <Link href="/sales" style={menuCard}>
              <div style={menuEn}>SALES</div>
              <div style={menuJa}>売上管理</div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ================= デザイン ================= */

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #0f1115 0%, #1a1d24 40%, #0c0e12 100%)",
  color: "#fff",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif',
  position: "relative",
  overflow: "hidden",
};

const bgGrid: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
};

const container: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "60px 20px",
};

const logoStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 800,
  letterSpacing: "2px",
  marginBottom: "40px",
  opacity: 0.9,
};

const glassCard: React.CSSProperties = {
  borderRadius: "28px",
  padding: "40px 24px",
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
};

const badge: React.CSSProperties = {
  fontSize: "12px",
  letterSpacing: "2px",
  color: "#aaa",
  marginBottom: "16px",
};

const title: React.CSSProperties = {
  fontSize: "clamp(36px, 8vw, 72px)",
  fontWeight: 900,
  letterSpacing: "-2px",
  margin: 0,
};

const desc: React.CSSProperties = {
  marginTop: "20px",
  color: "#bbb",
  lineHeight: 1.8,
  fontSize: "15px",
};

const btnWrap: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "28px",
  flexWrap: "wrap",
};

const mainBtn: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: "999px",
  background: "#fff",
  color: "#111",
  textDecoration: "none",
  fontWeight: 700,
};

const subBtn: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
  border: "1px solid rgba(255,255,255,0.2)",
};

const cardWrap: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: "14px",
  marginTop: "36px",
};

const menuCard: React.CSSProperties = {
  borderRadius: "20px",
  padding: "18px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  textDecoration: "none",
  color: "#fff",
};

const menuEn: React.CSSProperties = {
  fontSize: "11px",
  color: "#888",
  letterSpacing: "1px",
};

const menuJa: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  marginTop: "6px",
};