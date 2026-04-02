"use client";

import CRMLayout from "../../components/CRMLayout";

export default function ReservationPage() {
  return (
    <CRMLayout title="予約管理">
      <div style={styles.container}>
        <div style={styles.heroCard}>
          <div style={styles.badge}>RESERVATION</div>
          <h1 style={styles.title}>予約管理</h1>
          <p style={styles.subText}>
            ここに予約機能を入れていきます。まずはビルドを通すための安定版です。
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>現在の状態</h2>
          <p style={styles.text}>
            予約ページは表示できています。次にカレンダーや予約登録機能を戻していきます。
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>次に入れる機能</h2>
          <ul style={styles.list}>
            <li>月間カレンダー表示</li>
            <li>予約追加フォーム</li>
            <li>顧客との連動</li>
            <li>スタッフ別表示</li>
            <li>予約詳細の確認</li>
          </ul>
        </div>
      </div>
    </CRMLayout>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "grid",
    gap: "24px",
  },
  heroCard: {
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    backdropFilter: "blur(10px)",
  },
  badge: {
    display: "inline-block",
    marginBottom: "12px",
    padding: "6px 12px",
    fontSize: "12px",
    letterSpacing: "0.12em",
    borderRadius: "999px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
    color: "#0f172a",
  },
  subText: {
    marginTop: "10px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.8,
  },
  card: {
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    backdropFilter: "blur(10px)",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "14px",
    fontSize: "22px",
    fontWeight: 700,
    color: "#0f172a",
  },
  text: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.8,
  },
  list: {
    margin: 0,
    paddingLeft: "20px",
    color: "#475569",
    lineHeight: 2,
  },
};