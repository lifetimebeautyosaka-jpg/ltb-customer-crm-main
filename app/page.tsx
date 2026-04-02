"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>GYMUP CRM</h1>
        <p style={styles.text}>管理メニュー</p>

        <div style={styles.grid}>
          <Link href="/customer" style={styles.linkCard}>
            顧客管理
          </Link>
          <Link href="/reservation" style={styles.linkCard}>
            予約管理
          </Link>
          <Link href="/sales" style={styles.linkCard}>
            売上管理
          </Link>
          <Link href="/accounting" style={styles.linkCard}>
            会計管理
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "linear-gradient(180deg,#eef2f7 0%,#e5ebf3 100%)",
  },
  card: {
    maxWidth: "960px",
    margin: "0 auto",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    backdropFilter: "blur(10px)",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
    color: "#0f172a",
  },
  text: {
    marginTop: "8px",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "24px",
  },
  linkCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80px",
    borderRadius: "16px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 700,
  },
};