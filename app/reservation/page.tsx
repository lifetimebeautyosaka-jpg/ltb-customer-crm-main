"use client";

export default function ReservationPage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>予約管理</h1>
        <p style={styles.text}>予約機能はここに追加していきます。</p>
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
};