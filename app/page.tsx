"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        
        {/* ロゴ */}
        <div style={styles.logoWrap}>
          <div style={styles.logo}>
            <span style={styles.logoGym}>GYM</span>
            <span style={styles.logoUp}>UP</span>
          </div>
          <div style={styles.logoSub}>CRM SYSTEM</div>
        </div>

        <div style={styles.grid}>
          <MenuCard href="/customer" label="顧客管理" />
          <MenuCard href="/reservation" label="予約管理" />
          <MenuCard href="/sales" label="売上管理" />
          <MenuCard href="/accounting" label="会計管理" />
          <MenuCard href="/customer" label="トレーニング履歴" sub="Training System" />
        </div>
      </div>
    </main>
  );
}

function MenuCard({
  href,
  label,
  sub,
}: {
  href: string;
  label: string;
  sub?: string;
}) {
  return (
    <Link href={href} style={styles.linkCard}>
      <div style={styles.label}>{label}</div>
      {sub && <div style={styles.sub}>{sub}</div>}
    </Link>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    padding: "40px 24px",
    background:
      "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 40%, #2a2a2a 100%)",
  },

  card: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "50px",
    borderRadius: "30px",

    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",

    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
  },

  /* ロゴ */
  logoWrap: {
    marginBottom: "40px",
  },

  logo: {
    fontSize: "42px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },

  logoGym: {
    color: "#e5e7eb", // シルバー
  },

  logoUp: {
    color: "#e0b48a", // ゴールド
    marginLeft: "6px",
  },

  logoSub: {
    marginTop: "6px",
    fontSize: "12px",
    letterSpacing: "0.2em",
    color: "#6b7280",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  linkCard: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "28px",

    borderRadius: "20px",

    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",

    textDecoration: "none",
    color: "#ffffff",

    transition: "0.3s ease",
  },

  label: {
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "0.02em",
  },

  sub: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#9ca3af",
  },
};