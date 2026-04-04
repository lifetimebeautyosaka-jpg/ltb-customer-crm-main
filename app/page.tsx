"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>GYMUP CRM</h1>
        <p style={styles.text}>管理メニュー</p>

        <div style={styles.grid}>
          <MenuCard href="/customer" label="顧客管理" icon="👤" />
          <MenuCard href="/reservation" label="予約管理" icon="📅" />
          <MenuCard href="/sales" label="売上管理" icon="💰" />
          <MenuCard href="/accounting" label="会計管理" icon="📊" />

          {/* 🔥 追加 */}
          <MenuCard
            href="/customer"
            label="トレーニング履歴"
            icon="🏋️"
            sub="顧客から入力・確認"
          />
        </div>
      </div>
    </main>
  );
}

function MenuCard({
  href,
  label,
  icon,
  sub,
}: {
  href: string;
  label: string;
  icon: string;
  sub?: string;
}) {
  return (
    <Link href={href} style={styles.linkCard}>
      <div style={styles.icon}>{icon}</div>

      <div style={{ textAlign: "center" }}>
        <div style={styles.label}>{label}</div>
        {sub && <div style={styles.sub}>{sub}</div>}
      </div>
    </Link>
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "110px",
    borderRadius: "16px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 700,
    gap: "6px",
  },
  icon: {
    fontSize: "26px",
  },
  label: {
    fontSize: "16px",
    fontWeight: 800,
  },
  sub: {
    fontSize: "12px",
    color: "#64748b",
  },
};