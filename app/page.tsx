"use client";

import Link from "next/link";
import React from "react";

const titleText = "GYMUP CRM";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <style>{`
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
          color: #ffffff;
          text-shadow:
            0 0 8px rgba(255,255,255,0.18),
            0 0 20px rgba(255,255,255,0.08);
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
            rgba(255,255,255,0.35) 45%,
            rgba(255,255,255,0.95) 50%,
            rgba(255,255,255,0.35) 55%,
            transparent 100%
          );
          transform: skewX(-20deg);
          opacity: 0;
          animation: shineText 4s ease-in-out infinite;
        }

        @keyframes floatLogo {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        .logo {
          animation: floatLogo 5s ease-in-out infinite;
        }

        .card {
          position: relative;
          overflow: hidden;
          transition: all 0.35s ease;
          border-radius: 24px;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 28px 70px rgba(0,0,0,0.30);
        }

        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.10);
          pointer-events: none;
        }

        .card::after {
          content:"";
          position:absolute;
          inset:0;
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(255,255,255,0.12) 50%,
            transparent 70%
          );
          transform: translateX(-150%);
          pointer-events: none;
        }

        .card:hover::after {
          animation: shine 1.4s ease;
        }

        @keyframes shine {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.9fr;
          gap: 24px;
          align-items: stretch;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .menu-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={styles.bgOverlay} />

      <div style={styles.container}>
        {/* ロゴ */}
        <div style={styles.logoWrap}>
          <img src="/gymup-logo.png" alt="GYMUP" style={styles.logo} className="logo" />
        </div>

        {/* HERO */}
        <section className="hero-grid" style={styles.heroGrid}>
          <div style={styles.heroLeft} className="card">
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

            <div style={styles.kpiRow}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>CUSTOMER</div>
                <div style={styles.kpiValue}>顧客管理</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>RESERVATION</div>
                <div style={styles.kpiValue}>予約管理</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>SALES</div>
                <div style={styles.kpiValue}>売上管理</div>
              </div>
            </div>
          </div>

          {/* 人物ビジュアル */}
          <div style={styles.heroVisual} className="card">
            <div style={styles.visualGlowOrange} />
            <div style={styles.visualGlowBlue} />

            <div style={styles.visualInner}>
              <div style={styles.visualTextTop}>Optimize Your Metrics</div>

              <div style={styles.modelWrap}>
                <img
                  src="/top-model.png"
                  alt="Top visual"
                  style={styles.modelImage}
                />
              </div>

              <div style={styles.visualStats}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Members</div>
                  <div style={styles.statValue}>76k</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Revenue</div>
                  <div style={styles.statValue}>¥3.6m</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Visits</div>
                  <div style={styles.statValue}>47</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MENU */}
        <section className="menu-grid" style={styles.grid}>
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
    background:
      "radial-gradient(circle at 18% 28%, rgba(255,122,24,0.26), transparent 28%), radial-gradient(circle at 78% 24%, rgba(91,140,255,0.22), transparent 30%), linear-gradient(135deg, #05070d 0%, #0b1120 45%, #111827 100%)",
    padding: "40px 20px",
    position: "relative",
    overflow: "hidden",
  },
  bgOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
    backgroundSize: "34px 34px",
    pointerEvents: "none",
  },
  container: {
    maxWidth: "1180px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  logoWrap: {
    marginBottom: "20px",
  },
  logo: {
    width: "200px",
    maxWidth: "60vw",
  },
  heroGrid: {
    marginBottom: "28px",
  },
  heroLeft: {
    padding: "34px",
    background: "rgba(17,22,35,0.64)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    color: "#fff",
    minHeight: "360px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
  },
  heroVisual: {
    position: "relative",
    padding: "22px",
    background: "rgba(17,22,35,0.64)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    minHeight: "360px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
  },
  visualInner: {
    position: "relative",
    zIndex: 2,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  visualGlowOrange: {
    position: "absolute",
    width: "260px",
    height: "260px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,122,24,0.38) 0%, rgba(255,122,24,0.08) 45%, transparent 75%)",
    top: "-60px",
    left: "-40px",
    filter: "blur(12px)",
  },
  visualGlowBlue: {
    position: "absolute",
    width: "240px",
    height: "240px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(91,140,255,0.28) 0%, rgba(91,140,255,0.08) 45%, transparent 75%)",
    bottom: "-60px",
    right: "-30px",
    filter: "blur(12px)",
  },
  visualTextTop: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: 800,
    lineHeight: 1.15,
  },
  modelWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "8px 0",
  },
  modelImage: {
    width: "100%",
    maxWidth: "260px",
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.35))",
  },
  visualStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  statBox: {
    borderRadius: "16px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "12px 10px",
  },
  statLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: "11px",
    marginBottom: "6px",
  },
  statValue: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: 800,
  },
  eyebrow: {
    fontSize: "11px",
    letterSpacing: "0.2em",
    color: "rgba(255,255,255,0.58)",
    marginBottom: "14px",
  },
  title: {
    fontSize: "48px",
    fontWeight: 900,
    margin: 0,
    lineHeight: 1.05,
  },
  desc: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "15px",
    lineHeight: 1.8,
    marginTop: "18px",
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginTop: "26px",
  },
  kpiCard: {
    borderRadius: "18px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "14px",
  },
  kpiLabel: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.54)",
    marginBottom: "6px",
    letterSpacing: "0.08em",
  },
  kpiValue: {
    fontSize: "20px",
    color: "#fff",
    fontWeight: 800,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  card: {
    padding: "34px",
    background: "rgba(17,22,35,0.64)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    textDecoration: "none",
    color: "#fff",
    boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
  },
  label: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.54)",
    letterSpacing: "0.08em",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: 800,
    marginTop: "8px",
  },
};