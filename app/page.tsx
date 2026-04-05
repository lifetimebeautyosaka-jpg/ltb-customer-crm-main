"use client";

import Link from "next/link";
import React from "react";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <style>{`
        /* ===== 背景ダイヤ（常時 上昇） ===== */
        @keyframes diamondRise {
          0% {
            transform: translateY(0px) scale(0.6) rotate(45deg);
            opacity: 0;
          }
          20% { opacity: 0.7; }
          60% {
            transform: translateY(-220px) scale(1) rotate(45deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-420px) scale(0.6) rotate(45deg);
            opacity: 0;
          }
        }

        .diamond {
          position: absolute;
          bottom: -40px;
          width: 8px;
          height: 8px;
          transform: rotate(45deg);
          background: linear-gradient(135deg, #ffffff, #fcd34d);
          box-shadow:
            0 0 10px rgba(255,255,255,0.9),
            0 0 20px rgba(255,255,255,0.6);
          opacity: 0;
          animation: diamondRise 10s linear infinite;
          pointer-events: none;
        }

        /* ===== パネル演出（軽量） ===== */
        .panel {
          position: relative;
          overflow: hidden;
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .panel:hover {
          transform: translateY(-6px);
          box-shadow: 0 30px 60px rgba(0,0,0,0.08);
        }

        /* 横キラ */
        .panel::before {
          content:"";
          position:absolute;
          inset:0;
          background: linear-gradient(
            120deg,
            transparent 40%,
            rgba(255,255,255,0.8) 50%,
            transparent 60%
          );
          transform: translateX(-150%);
          opacity: 0;
        }

        .panel:hover::before {
          animation: shineX 1.2s ease;
        }

        @keyframes shineX {
          0% { transform: translateX(-150%); opacity:0; }
          50% { opacity:1; }
          100% { transform: translateX(250%); opacity:0; }
        }

        /* 縦キラ */
        .panel::after {
          content:"";
          position:absolute;
          left:50%;
          top:-20%;
          width:1px;
          height:140%;
          transform: translateX(-50%);
          background: linear-gradient(
            180deg,
            transparent,
            rgba(255,255,255,0.9),
            transparent
          );
          opacity: 0;
        }

        .panel:hover::after {
          animation: shineY 1.4s ease;
        }

        @keyframes shineY {
          0% { transform: translateY(-120%); opacity:0; }
          50% { opacity:1; }
          100% { transform: translateY(150%); opacity:0; }
        }

        @media (max-width: 720px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ===== 背景ダイヤ ===== */}
      <div className="diamond" style={{ left: "10%", animationDelay: "0s" }} />
      <div className="diamond" style={{ left: "25%", animationDelay: "2s" }} />
      <div className="diamond" style={{ left: "40%", animationDelay: "1s" }} />
      <div className="diamond" style={{ left: "55%", animationDelay: "3s" }} />
      <div className="diamond" style={{ left: "70%", animationDelay: "1.5s" }} />
      <div className="diamond" style={{ left: "85%", animationDelay: "2.5s" }} />

      <div style={styles.container}>
        {/* ===== HERO ===== */}
        <section style={styles.hero}>
          <img src="/gymup-logo.png" alt="GYMUP" style={styles.logo} />
          <h1 style={styles.title}>GYMUP CRM</h1>
          <p style={styles.desc}>
            顧客・売上・予約・トレーニングを一元管理する
            <br />
            プレミアムCRM
          </p>
        </section>

        {/* ===== MENU ===== */}
        <section style={styles.grid} className="grid">
          <Link href="/customer" className="panel" style={styles.panel}>
            <div style={styles.label}>CUSTOMER</div>
            <div style={styles.panelTitle}>顧客管理</div>
          </Link>

          <Link href="/training" className="panel" style={styles.panel}>
            <div style={styles.label}>TRAINING</div>
            <div style={styles.panelTitle}>トレーニング履歴</div>
          </Link>

          <Link href="/sales" className="panel" style={styles.panel}>
            <div style={styles.label}>SALES</div>
            <div style={styles.panelTitle}>売上管理</div>
          </Link>

          <Link href="/reservation" className="panel" style={styles.panel}>
            <div style={styles.label}>RESERVATION</div>
            <div style={styles.panelTitle}>予約管理</div>
          </Link>

          <Link href="/accounting" className="panel" style={styles.panel}>
            <div style={styles.label}>ACCOUNTING</div>
            <div style={styles.panelTitle}>会計管理</div>
          </Link>

          <Link href="/attendance" className="panel" style={styles.panel}>
            <div style={styles.label}>ATTENDANCE</div>
            <div style={styles.panelTitle}>出退勤管理</div>
          </Link>
        </section>
      </div>
    </main>
  );
}

/* ===== 型付きスタイル（これでビルド通る） ===== */
const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#ffffff,#eef2f7)",
    padding: "40px",
    position: "relative",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  hero: {
    textAlign: "center",
    marginBottom: "40px",
  },
  logo: {
    width: "260px",
    display: "block",
    margin: "0 auto",
  },
  title: {
    fontSize: "42px",
    fontWeight: 900,
    marginTop: "12px",
  },
  desc: {
    color: "#64748b",
    marginTop: "8px",
    lineHeight: 1.8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  panel: {
    padding: "30px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    textDecoration: "none",
    color: "#111",
  },
  label: {
    fontSize: "12px",
    color: "#94a3b8",
    letterSpacing: "0.1em",
  },
  panelTitle: {
    fontSize: "22px",
    fontWeight: 800,
    marginTop: "6px",
  },
};