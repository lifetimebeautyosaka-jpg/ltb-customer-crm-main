"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>GYMUP CRM</h1>
        <p style={styles.text}>Management Dashboard</p>

        <div style={styles.grid}>
          <MenuCard href="/customer" label="顧客管理" />
          <MenuCard href="/reservation" label="予約管理" />
          <MenuCard href="/sales" label="売上管理" />
          <MenuCard href="/accounting" label="会計管理" />
          <MenuCard href="/customer" label="トレーニング履歴" sub="顧客から管理" />
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
      "linear-gradient(135deg, #f8fafc 0%, #eef2f7 40%, #e2e8f0 100%)",
  },

  card: {
    maxWidth: "980px",
    margin: "0 auto",
    padding: "40px",
    borderRadius: "28px",

    background: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",

    border: "1px solid rgba(255,255,255,0.7)",
    boxShadow:
      "0 20px 60px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },

  text: {
    marginTop: "10px",
    color: "#64748b",
    fontSize: "14px",
    letterSpacing: "0.08em",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    marginTop: "32px",
  },

  linkCard: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "26px",

    borderRadius: "20px",

    background:
      "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.8))",
    border: "1px solid rgba(203,213,225,0.5)",

    textDecoration: "none",
    color: "#0f172a",

    transition: "0.25s ease",
  },

  label: {
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "-0.01em",
  },

  sub: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#64748b",
  },
};