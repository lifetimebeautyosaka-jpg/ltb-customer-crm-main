"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.glowC} />
      <div style={styles.spark1} />
      <div style={styles.spark2} />
      <div style={styles.spark3} />

      <div style={styles.container}>
        <section style={styles.heroCard}>
          <div style={styles.shineLine} />
          <div style={styles.logoWrap}>
            <img src="/gymup-logo.png" alt="GYMUP" style={styles.logo} />
          </div>
          <div style={styles.eyebrow}>PREMIUM GYM MANAGEMENT SYSTEM</div>
          <h1 style={styles.heroTitle}>GYMUP CRM</h1>
          <p style={styles.heroText}>
            顧客管理、予約、売上、会計、トレーニング履歴まで。
            <br />
            ジム運営を美しく、一元管理するためのCRM。
          </p>
        </section>

        <section style={styles.dashboard}>
          <Link href="/customer" style={{ ...styles.panel, ...styles.panelLarge }}>
            <div style={styles.panelShine} />
            <div style={styles.panelLabel}>CUSTOMER</div>
            <div style={styles.panelTitle}>顧客管理</div>
            <div style={styles.panelDesc}>
              顧客情報、詳細ページ、回数券、LTV、来店履歴を管理
            </div>
          </Link>

          <div style={styles.rightGrid}>
            <Link href="/reservation" style={styles.panel}>
              <div style={styles.panelShine} />
              <div style={styles.panelLabel}>RESERVATION</div>
              <div style={styles.panelTitle}>予約管理</div>
              <div style={styles.panelDesc}>月カレンダー・日別確認・予約詳細</div>
            </Link>

            <Link href="/sales" style={styles.panel}>
              <div style={styles.panelShine} />
              <div style={styles.panelLabel}>SALES</div>
              <div style={styles.panelTitle}>売上管理</div>
              <div style={styles.panelDesc}>売上登録・履歴確認・顧客別売上</div>
            </Link>

            <Link href="/accounting" style={styles.panel}>
              <div style={styles.panelShine} />
              <div style={styles.panelLabel}>ACCOUNTING</div>
              <div style={styles.panelTitle}>会計管理</div>
              <div style={styles.panelDesc}>集計・チェック・数値管理</div>
            </Link>

            <Link href="/customer" style={styles.panel}>
              <div style={styles.panelShine} />
              <div style={styles.panelLabel}>TRAINING</div>
              <div style={styles.panelTitle}>トレーニング履歴</div>
              <div style={styles.panelDesc}>顧客ごとのセッション記録・比較・管理</div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const glass =
  "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.72))";

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    padding: "36px 20px 60px",
    background: `
      radial-gradient(circle at 15% 15%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.72) 18%, transparent 38%),
      radial-gradient(circle at 85% 12%, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.65) 18%, transparent 42%),
      radial-gradient(circle at 80% 78%, rgba(226,232,240,0.55) 0%, transparent 30%),
      linear-gradient(135deg, #ffffff 0%, #f8fafc 32%, #eef2f7 62%, #e2e8f0 100%)
    `,
  },

  glowA: {
    position: "absolute",
    top: "-90px",
    left: "-70px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.95)",
    filter: "blur(55px)",
    pointerEvents: "none",
  },

  glowB: {
    position: "absolute",
    top: "120px",
    right: "-60px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.85)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  glowC: {
    position: "absolute",
    bottom: "-120px",
    left: "18%",
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    background: "rgba(203,213,225,0.35)",
    filter: "blur(75px)",
    pointerEvents: "none",
  },

  spark1: {
    position: "absolute",
    top: "90px",
    left: "14%",
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#ffffff",
    boxShadow: "0 0 24px rgba(255,255,255,0.95)",
    pointerEvents: "none",
  },

  spark2: {
    position: "absolute",
    top: "220px",
    right: "16%",
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    background: "#ffffff",
    boxShadow: "0 0 26px rgba(255,255,255,0.95)",
    pointerEvents: "none",
  },

  spark3: {
    position: "absolute",
    bottom: "120px",
    right: "28%",
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "#ffffff",
    boxShadow: "0 0 18px rgba(255,255,255,0.95)",
    pointerEvents: "none",
  },

  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1120px",
    margin: "0 auto",
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "34px",
    padding: "42px 28px 36px",
    marginBottom: "24px",
    textAlign: "center",
    background: glass,
    border: "1px solid rgba(255,255,255,0.95)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow:
      "0 24px 80px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.98)",
  },

  shineLine: {
    position: "absolute",
    top: 0,
    left: "-20%",
    width: "60%",
    height: "2px",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 35%, rgba(245,158,11,0.45) 52%, rgba(255,255,255,0.9) 70%, transparent 100%)",
    transform: "skewX(-28deg)",
  },

  logoWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px 24px",
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(241,245,249,0.76))",
    border: "1px solid rgba(255,255,255,0.95)",
    boxShadow:
      "0 16px 40px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,1)",
  },

  logo: {
    width: "340px",
    maxWidth: "92%",
    height: "auto",
    display: "block",
    objectFit: "contain",
  },

  eyebrow: {
    marginTop: "18px",
    fontSize: "11px",
    letterSpacing: "0.24em",
    color: "#94a3b8",
    fontWeight: 700,
  },

  heroTitle: {
    margin: "10px 0 0",
    fontSize: "42px",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.04em",
  },

  heroText: {
    margin: "14px 0 0",
    fontSize: "15px",
    lineHeight: 1.9,
    color: "#475569",
    fontWeight: 500,
  },

  dashboard: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: "18px",
  },

  rightGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },

  panel: {
    position: "relative",
    overflow: "hidden",
    display: "block",
    textDecoration: "none",
    padding: "24px 22px",
    borderRadius: "28px",
    background: glass,
    border: "1px solid rgba(255,255,255,0.95)",
    color: "#0f172a",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow:
      "0 18px 40px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.98)",
    minHeight: "185px",
  },

  panelLarge: {
    minHeight: "388px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },

  panelShine: {
    position: "absolute",
    top: "-25%",
    right: "-10%",
    width: "180px",
    height: "180px",
    borderRadius: "999px",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.18) 38%, transparent 72%)",
    pointerEvents: "none",
  },

  panelLabel: {
    position: "relative",
    zIndex: 1,
    fontSize: "11px",
    letterSpacing: "0.18em",
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: "10px",
  },

  panelTitle: {
    position: "relative",
    zIndex: 1,
    fontSize: "24px",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#0f172a",
  },

  panelDesc: {
    position: "relative",
    zIndex: 1,
    marginTop: "10px",
    fontSize: "13px",
    lineHeight: 1.8,
    color: "#64748b",
  },
};