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
      {/* キラキラ背景 */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.container}>
        {/* ロゴセクション */}
        <section style={styles.hero}>
          <img
            src="/gymup-logo.png"
            alt="GYMUP"
            style={styles.logo}
          />

          <div style={styles.subtitle}>
            Premium Gym Management System
          </div>
        </section>

        {/* メニュー */}
        <section style={styles.menu}>
          {menuItems.map((item) => (
            <Link key={item.title} href={item.href} style={styles.card}>
              <div>
                <div style={styles.title}>{item.title}</div>
                <div style={styles.desc}>{item.desc}</div>
              </div>
              <div style={styles.arrow}>→</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    background:
      "linear-gradient(135deg,#ffffff 0%,#f1f5f9 40%,#e2e8f0 100%)",
    position: "relative",
    overflow: "hidden",
  },

  /* ✨ キラキラ */
  bgGlow1: {
    position: "absolute",
    top: "-100px",
    right: "-80px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.9)",
    filter: "blur(60px)",
  },

  bgGlow2: {
    position: "absolute",
    bottom: "-120px",
    left: "-80px",
    width: "300px",
    height: "300px",
    borderRadius: "999px",
    background: "rgba(148,163,184,0.25)",
    filter: "blur(70px)",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  /* 💎 ロゴエリア */
  hero: {
    textAlign: "center",
    marginBottom: "40px",
  },

  logo: {
    width: "320px",
    maxWidth: "90%",
    marginBottom: "16px",
    filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.15))",
  },

  subtitle: {
    fontSize: "13px",
    letterSpacing: "0.2em",
    color: "#64748b",
    fontWeight: 600,
  },

  /* 💎 メニュー */
  menu: {
    display: "grid",
    gap: "16px",
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    padding: "22px",
    borderRadius: "20px",

    background:
      "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(241,245,249,0.85))",

    border: "1px solid rgba(203,213,225,0.5)",
    backdropFilter: "blur(12px)",

    textDecoration: "none",
    color: "#0f172a",

    boxShadow:
      "0 10px 30px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
  },

  title: {
    fontSize: "18px",
    fontWeight: 800,
  },

  desc: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#64748b",
  },

  arrow: {
    fontSize: "22px",
    color: "#fb923c",
    fontWeight: 700,
  },
};