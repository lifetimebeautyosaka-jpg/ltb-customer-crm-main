"use client";

import Link from "next/link";
import React from "react";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <style>{`
        /* ===== ロゴ浮遊 ===== */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        .logo {
          animation: float 5s ease-in-out infinite;
        }

        /* ===== 高級カード ===== */
        .card {
          position: relative;
          overflow: hidden;
          transition: all 0.35s ease;
          border-radius: 22px;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 25px 60px rgba(0,0,0,0.08);
        }

        /* ガラス＋境界ライン */
        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.7);
          pointer-events: none;
        }

        /* キラライン */
        .card::after {
          content:"";
          position:absolute;
          inset:0;
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(255,255,255,0.8) 50%,
            transparent 70%
          );
          transform: translateX(-150%);
        }

        .card:hover::after {
          animation: shine 1.4s ease;
        }

        @keyframes shine {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }

        @media (max-width: 720px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={styles.container}>
        {/* ===== ロゴ左上 ===== */}
        <div style={styles.logoWrap}>
          <img src="/gymup-logo.png" style={styles.logo} className="logo" />
        </div>

        {/* ===== HERO ===== */}
        <section style={styles.hero}>
          <h1 style={styles.title}>GYMUP CRM</h1>
          <p style={styles.desc}>
            顧客・売上・予約・トレーニングを一元管理する
            <br />
            プレミアムCRM
          </p>
        </section>

        {/* ===== MENU ===== */}
        <section style={styles.grid} className="grid">
          <Link href="/customer" className="card" style={styles.card}>
            <div style={styles.label}>CUSTOMER</div>
            <div style={styles.cardTitle}>顧客管理</div>
          </Link>

          <Link href="/training" className="card" style={styles.card}>
            <div style={styles.label}>TRAINING</div>
            <div style={styles.cardTitle}>トレーニング履歴</div>
          </Link>

          <Link href="/sales" className="card" style={styles.card}>
            <div style={styles.label}>SALES</div>
            <div style={styles.cardTitle}>売上管理</div>
          </Link>

          <Link href="/reservation" className="card" style={styles.card}>
            <div style={styles.label}>RESERVATION</div>
            <div style={styles.cardTitle}>予約管理</div>
          </Link>

          <Link href="/accounting" className="card" style={styles.card}>
            <div style={styles.label}>ACCOUNTING</div>
            <div style={styles.cardTitle}>会計管理</div>
          </Link>

          <Link href="/attendance" className="card" style={styles.card}>
            <div style={styles.label}>ATTENDANCE</div>
            <div style={styles.cardTitle}>出退勤管理</div>
          </Link>
        </section>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#ffffff,#eef2f7)",
    padding: "40px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    position: "relative",
  },
  logoWrap: {
    position: "absolute",
    top: "10px",
    left: "10px",
  },
  logo: {
    width: "180px", // ←大きくした
  },
  hero: {
    textAlign: "center",
    marginBottom: "50px",
  },
  title: {
    fontSize: "44px",
    fontWeight: 900,
  },
  desc: {
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  card: {
    padding: "34px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)",
    textDecoration: "none",
    color: "#111",
  },
  label: {
    fontSize: "11px",
    letterSpacing: "0.12em",
    color: "#94a3b8",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: 800,
    marginTop: "6px",
  },
};