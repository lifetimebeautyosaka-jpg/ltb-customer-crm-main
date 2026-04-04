"use client";

import Link from "next/link";

const menuItems = [
  {
    href: "/customer",
    title: "顧客管理",
    desc: "顧客情報・詳細確認",
  },
  {
    href: "/reservation",
    title: "予約管理",
    desc: "カレンダー・日別確認",
  },
  {
    href: "/sales",
    title: "売上管理",
    desc: "売上登録・履歴確認",
  },
  {
    href: "/accounting",
    title: "会計管理",
    desc: "集計・会計チェック",
  },
  {
    href: "/customer",
    title: "トレーニング履歴",
    desc: "顧客ごとの記録管理",
  },
];

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.container}>
        <section style={styles.heroCard}>
          <div style={styles.heroTop}>
            <div>
              <div style={styles.badge}>GYM MANAGEMENT SYSTEM</div>
              <h1 style={styles.title}>GYMUP CRM</h1>
              <p style={styles.text}>
                パーソナルジム運営を、もっと速く、もっと見やすく。
              </p>
            </div>

            <div style={styles.logoWrap}>
              <img
                src="/gymup-logo.png"
                alt="GYMUP ロゴ"
                style={styles.logo}
              />
            </div>
          </div>
        </section>

        <section style={styles.menuSection}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>MENU</h2>
            <p style={styles.sectionText}>よく使う機能にすぐアクセス</p>
          </div>

          <div style={styles.menuStack}>
            {menuItems.map((item) => (
              <Link key={item.title} href={item.href} style={styles.menuCard}>
                <div>
                  <div style={styles.menuTitle}>{item.title}</div>
                  <div style={styles.menuDesc}>{item.desc}</div>
                </div>
                <div style={styles.arrow}>→</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top, #1f2937 0%, #0f172a 45%, #020617 100%)",
    padding: "32px 20px 60px",
  },

  bgGlow1: {
    position: "absolute",
    top: "-120px",
    right: "-80px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(251, 146, 60, 0.16)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  bgGlow2: {
    position: "absolute",
    bottom: "-120px",
    left: "-80px",
    width: "300px",
    height: "300px",
    borderRadius: "999px",
    background: "rgba(148, 163, 184, 0.14)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  heroCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "28px",
    padding: "32px",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
    marginBottom: "24px",
  },

  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap",
  },

  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    letterSpacing: "0.18em",
    fontWeight: 700,
    color: "#cbd5e1",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    marginBottom: "14px",
  },

  title: {
    margin: 0,
    fontSize: "40px",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#f8fafc",
  },

  text: {
    marginTop: "12px",
    marginBottom: 0,
    fontSize: "15px",
    color: "#cbd5e1",
    lineHeight: 1.8,
  },

  logoWrap: {
    flexShrink: 0,
    padding: "14px 18px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
  },

  logo: {
    display: "block",
    width: "280px",
    maxWidth: "100%",
    height: "auto",
    objectFit: "contain",
  },

  menuSection: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "28px",
    padding: "28px",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
  },

  sectionHead: {
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: "0.04em",
  },

  sectionText: {
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "13px",
    color: "#94a3b8",
  },

  menuStack: {
    display: "grid",
    gap: "14px",
  },

  menuCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    textDecoration: "none",
    padding: "20px 22px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#f8fafc",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },

  menuTitle: {
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "-0.01em",
    color: "#f8fafc",
  },

  menuDesc: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#94a3b8",
  },

  arrow: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#fb923c",
    flexShrink: 0,
  },
};