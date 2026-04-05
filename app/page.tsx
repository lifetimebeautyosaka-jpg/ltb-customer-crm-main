"use client";

import Link from "next/link";
import React from "react";

const titleText = "GYMUP CRM";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <style>{`
        /* ===== タイトル出現 ===== */
        @keyframes titleCharIn {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ===== ダイヤキラ ===== */
        @keyframes shineText {
          0% {
            left: -120%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          40% {
            left: 220%;
            opacity: 0;
          }
          100% {
            left: 220%;
            opacity: 0;
          }
        }

        .diamond-text {
          position: relative;
          display: inline-block;
          opacity: 0;
          transform: translateY(14px);
          animation: titleCharIn 0.6s ease forwards;
          color: #0f172a;
          text-shadow:
            0 0 6px rgba(255,255,255,0.9),
            0 0 12px rgba(255,255,255,0.6);
        }

        .diamond-text::after {
          content: "";
          position: absolute;
          top: 0;
          left: -120%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,0.9) 45%,
            rgba(255,255,255,1) 50%,
            rgba(255,255,255,0.9) 55%,
            transparent 100%
          );
          transform: skewX(-20deg);
          opacity: 0;
          animation: shineText 4s ease-in-out infinite;
        }

        /* ===== ロゴ浮遊 ===== */
        @keyframes floatLogo {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        .logo {
          animation: floatLogo 5s ease-in-out infinite;
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

        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.7);
        }

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

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 720px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={styles.container}>
        {/* ロゴ */}
        <div style={styles.logoWrap}>
          <img src="/gymup-logo.png" style={styles.logo} className="logo" />
        </div>

        {/* HERO */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>
            PREMIUM GYM & PILATES MANAGEMENT SYSTEM
          </div>

          <h1 style={styles.title}>
            {titleText.split("").map((char, i) => (
              <span
                key={i}
                className="diamond-text"
                style={{
                  animationDelay: `${i * 0.06}s`,
                  marginRight: char === " " ? "0.25em" : undefined,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h1>

          <p style={styles.desc}>
            パーソナルジム・ストレッチ・ピラティス運営を
            <br />
            美しく一元管理するプレミアムCRM
          </p>
        </section>

        {/* MENU */}
        <section className="grid" style={styles.grid}>
          <Link href="/customer" className="card" style={styles.card}>
            <div style={styles.label}>CUSTOMER</div>
            <div style={styles.cardTitle}>顧客管理</div>
          </Link>

          <Link href="/training" className="card" style={styles.card}>
            <div style={styles.label}>TRAINING / PILATES</div>
            <div style={styles.cardTitle}>トレーニング・ピラティス</div>
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
    top: "0",
    left: "0",
  },
  logo: {
    width: "200px",
  },
  hero: {
    textAlign: "center",
    marginBottom: "60px",
    paddingTop: "80px",
  },
  eyebrow: {
    fontSize: "11px",
    letterSpacing: "0.2em",
    color: "#94a3b8",
  },
  title: {
    fontSize: "48px",
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
    backdropFilter: "blur(10px)",
    textDecoration: "none",
    color: "#111",
  },
  label: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: 800,
  },
};