"use client";

import Link from "next/link";

const menuItems = [
  { href: "/customer", title: "顧客管理", desc: "顧客情報・詳細確認" },
  { href: "/reservation", title: "予約管理", desc: "カレンダー・日別確認" },
  { href: "/sales", title: "売上管理", desc: "売上登録・履歴確認" },
  { href: "/accounting", title: "会計管理", desc: "集計・会計チェック" },
  { href: "/customer", title: "トレーニング履歴", desc: "顧客ごとの記録管理" },
];

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.sparkle1} />
      <div style={styles.sparkle2} />
      <div style={styles.sparkle3} />
      <div style={styles.sparkle4} />

      <div style={styles.container}>
        <section style={styles.heroCard}>
          <div style={styles.heroInner}>
            <div style={styles.logoFrame}>
              <img src="/gymup-logo.png" alt="GYMUP" style={styles.logo} />
            </div>

            <div style={styles.subtitle}>Premium Gym Management System</div>

            <div style={styles.heroLine} />

            <p style={styles.lead}>
              顧客管理・予約・売上・会計・トレーニング履歴を
              <br />
              ひとつにまとめたプレミアムCRM
            </p>
          </div>
        </section>

        <section style={styles.menuSection}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionLabel}>MAIN MENU</div>
              <h2 style={styles.sectionTitle}>管理メニュー</h2>
            </div>
          </div>

          <div style={styles.menuGrid}>
            {menuItems.map((item) => (
              <Link key={item.title} href={item.href} style={styles.card}>
                <div>
                  <div style={styles.title}>{item.title}</div>
                  <div style={styles.desc}>{item.desc}</div>
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
    padding: "40px 20px 60px",
    position: "relative",
    overflow: "hidden",
    background: `
      linear-gradient(135deg, #ffffff 0%, #f8fafc 28%, #eef2f7 58%, #e2e8f0 100%)
    `,
  },

  sparkle1: {
    position: "absolute",
    top: "-80px",
    right: "-40px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.95)",
    filter: "blur(55px)",
    pointerEvents: "none",
  },

  sparkle2: {
    position: "absolute",
    top: "18%",
    left: "-60px",
    width: "220px",
    height: "220px",
    borderRadius: "999px",
    background: "rgba(226,232,240,0.8)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },

  sparkle3: {
    position: "absolute",
    bottom: "-100px",
    left: "8%",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.9)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  sparkle4: {
    position: "absolute",
    bottom: "-60px",
    right: "5%",
    width: "240px",
    height: "240px",
    borderRadius: "999px",
    background: "rgba(148,163,184,0.22)",
    filter: "blur(65px)",
    pointerEvents: "none",
  },

  container: {
    maxWidth: "1040px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  heroCard: {
    position: "relative",
    marginBottom: "28px",
    borderRadius: "32px",
    padding: "34px 28px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.54))",
    border: "1px solid rgba(255,255,255,0.92)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow:
      "0 25px 80px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  },

  heroInner: {
    textAlign: "center",
  },

  logoFrame: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px 22px",
    borderRadius: "26px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(241,245,249,0.72))",
    border: "1px solid rgba(255,255,255,0.95)",
    boxShadow:
      "0 12px 40px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  },

  logo: {
    width: "320px",
    maxWidth: "90%",
    height: "auto",
    display: "block",
    objectFit: "contain",
  },

  subtitle: {
    marginTop: "18px",
    fontSize: "12px",
    letterSpacing: "0.22em",
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
  },

  heroLine: {
    width: "110px",
    height: "2px",
    margin: "18px auto 0",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #cbd5e1 0%, #f59e0b 50%, #cbd5e1 100%)",
  },

  lead: {
    margin: "18px 0 0",
    fontSize: "15px",
    lineHeight: 1.85,
    color: "#475569",
    fontWeight: 500,
  },

  menuSection: {
    borderRadius: "32px",
    padding: "26px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.74), rgba(248,250,252,0.56))",
    border: "1px solid rgba(255,255,255,0.88)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow:
      "0 25px 80px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  },

  sectionHeader: {
    marginBottom: "18px",
  },

  sectionLabel: {
    fontSize: "11px",
    letterSpacing: "0.22em",
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: "6px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 900,
    letterSpacing: "-0.02em",
    color: "#0f172a",
  },

  menuGrid: {
    display: "grid",
    gap: "14px",
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "22px 22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(241,245,249,0.78))",
    border: "1px solid rgba(203,213,225,0.48)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    textDecoration: "none",
    color: "#0f172a",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)",
  },

  title: {
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "-0.01em",
    color: "#0f172a",
  },

  desc: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  arrow: {
    fontSize: "22px",
    color: "#f59e0b",
    fontWeight: 800,
    flexShrink: 0,
  },
};