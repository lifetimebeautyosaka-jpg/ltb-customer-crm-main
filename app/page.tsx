"use client";

import Link from "next/link";
import React from "react";

const titleText = "GYMUP CRM";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <style>{`
        @keyframes floatLogo {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        @keyframes cardShine {
          0% {
            transform: translateX(-160%) skewX(-20deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateX(220%) skewX(-20deg);
            opacity: 0;
          }
        }

        @keyframes softGlow {
          0% {
            box-shadow:
              0 18px 40px rgba(15, 23, 42, 0.05),
              inset 0 1px 0 rgba(255,255,255,0.95);
          }
          50% {
            box-shadow:
              0 24px 56px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255,255,255,1);
          }
          100% {
            box-shadow:
              0 18px 40px rgba(15, 23, 42, 0.05),
              inset 0 1px 0 rgba(255,255,255,0.95);
          }
        }

        @keyframes titleCharIn {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .gymup-logo-float {
          animation: floatLogo 5s ease-in-out infinite;
        }

        .gymup-card {
          position: relative;
          overflow: hidden;
          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease,
            border-color 0.35s ease,
            background 0.35s ease;
          animation: softGlow 6s ease-in-out infinite;
        }

        .gymup-card:hover {
          transform: translateY(-6px);
          box-shadow:
            0 28px 64px rgba(15, 23, 42, 0.10),
            inset 0 1px 0 rgba(255,255,255,1);
          border-color: rgba(255,255,255,1);
        }

        .gymup-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.78);
          pointer-events: none;
        }

        .gymup-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 42%;
          height: 100%;
          background: linear-gradient(
            115deg,
            transparent 0%,
            rgba(255,255,255,0.0) 25%,
            rgba(255,255,255,0.72) 50%,
            rgba(255,255,255,0.0) 75%,
            transparent 100%
          );
          transform: translateX(-160%) skewX(-20deg);
          opacity: 0;
          pointer-events: none;
        }

        .gymup-card:hover::after {
          animation: cardShine 1.3s ease;
        }

        .gymup-card-title {
          transition: letter-spacing 0.28s ease, transform 0.28s ease;
        }

        .gymup-card:hover .gymup-card-title {
          letter-spacing: -0.01em;
          transform: translateY(-1px);
        }

        .gymup-title-char {
          display: inline-block;
          opacity: 0;
          transform: translateY(12px);
          animation: titleCharIn 0.55s ease forwards;
          will-change: transform, opacity;
        }

        .gymup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 720px) {
          .gymup-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>

      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.bgGlowC} />

      <div style={styles.container}>
        <div style={styles.logoWrap} className="gymup-logo-float">
          <img src="/gymup-logo.png" alt="GYMUP" style={styles.logo} />
        </div>

        <section style={styles.hero}>
          <div style={styles.eyebrow}>PREMIUM GYM & PILATES MANAGEMENT SYSTEM</div>

          <h1 style={styles.title} aria-label={titleText}>
            {titleText.split("").map((char, index) => (
              <span
                key={`${char}-${index}`}
                className="gymup-title-char"
                style={{
                  animationDelay: `${0.08 + index * 0.045}s`,
                  marginRight: char === " " ? "0.22em" : undefined,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h1>

          <p style={styles.desc}>
            パーソナルジム・ストレッチ・ピラティス運営を、
            <br />
            顧客管理・予約・売上・会計・トレーニング記録まで美しく一元管理。
          </p>
        </section>

        <section className="gymup-grid" style={styles.grid}>
          <Link href="/customer" className="gymup-card" style={styles.card}>
            <div style={styles.cardLabel}>CUSTOMER</div>
            <div className="gymup-card-title" style={styles.cardTitle}>
              顧客管理
            </div>
            <div style={styles.cardDesc}>
              顧客情報、来店履歴、契約状況、LTVをまとめて管理
            </div>
          </Link>

          <Link href="/training" className="gymup-card" style={styles.card}>
            <div style={styles.cardLabel}>TRAINING / PILATES</div>
            <div className="gymup-card-title" style={styles.cardTitle}>
              トレーニング・ピラティス記録
            </div>
            <div style={styles.cardDesc}>
              セッション記録、姿勢比較、メニュー履歴を美しく蓄積
            </div>
          </Link>

          <Link href="/sales" className="gymup-card" style={styles.card}>
            <div style={styles.cardLabel}>SALES</div>
            <div className="gymup-card-title" style={styles.cardTitle}>
              売上管理
            </div>
            <div style={styles.cardDesc}>
              売上登録、顧客別売上、日別集計、CSV出力に対応
            </div>
          </Link>

          <Link href="/reservation" className="gymup-card" style={styles.card}>
            <div style={styles.cardLabel}>RESERVATION</div>
            <div className="gymup-card-title" style={styles.cardTitle}>
              予約管理
            </div>
            <div style={styles.cardDesc}>
              予約確認、日別管理、導線連携で運営をスムーズに
            </div>
          </Link>

          <Link href="/accounting" className="gymup-card" style={styles.card}>
            <div style={styles.cardLabel}>ACCOUNTING</div>
            <div className="gymup-card-title" style={styles.cardTitle}>
              会計管理
            </div>
            <div style={styles.cardDesc}>
              数値集計、チェック、運営全体のお金の流れを整理
            </div>
          </Link>

          <Link href="/attendance" className="gymup-card" style={styles.card}>
            <div style={styles.cardLabel}>ATTENDANCE</div>
            <div className="gymup-card-title" style={styles.cardTitle}>
              出退勤管理
            </div>
            <div style={styles.cardDesc}>
              スタッフの出退勤、勤怠確認、日々の管理をスマートに
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    padding: "38px 20px 60px",
    background: `
      radial-gradient(circle at 15% 14%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.72) 18%, transparent 40%),
      radial-gradient(circle at 85% 12%, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.68) 18%, transparent 44%),
      linear-gradient(135deg, #ffffff 0%, #f8fafc 34%, #eef2f7 68%, #e2e8f0 100%)
    `,
  },

  bgGlowA: {
    position: "absolute",
    top: "-70px",
    left: "-60px",
    width: "240px",
    height: "240px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.85)",
    filter: "blur(55px)",
    pointerEvents: "none",
  },

  bgGlowB: {
    position: "absolute",
    top: "120px",
    right: "-70px",
    width: "300px",
    height: "300px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.82)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  bgGlowC: {
    position: "absolute",
    bottom: "-120px",
    left: "20%",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(226,232,240,0.38)",
    filter: "blur(75px)",
    pointerEvents: "none",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  logoWrap: {
    position: "absolute",
    top: "0px",
    left: "6px",
    padding: "12px 18px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(248,250,252,0.72))",
    border: "1px solid rgba(255,255,255,0.88)",
    boxShadow:
      "0 16px 38px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
  },

  logo: {
    width: "205px",
    display: "block",
    objectFit: "contain",
  },

  hero: {
    textAlign: "center",
    marginBottom: "54px",
    paddingTop: "72px",
  },

  eyebrow: {
    fontSize: "11px",
    letterSpacing: "0.22em",
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: "12px",
  },

  title: {
    fontSize: "46px",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.04em",
    margin: 0,
    minHeight: "58px",
  },

  desc: {
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.95,
    marginTop: "14px",
    marginBottom: 0,
    fontWeight: 500,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },

  card: {
    padding: "32px 30px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.76))",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    textDecoration: "none",
    color: "#111827",
    boxShadow:
      "0 18px 40px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.96)",
    border: "1px solid rgba(255,255,255,0.7)",
  },

  cardLabel: {
    fontSize: "11px",
    letterSpacing: "0.16em",
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: "10px",
  },

  cardTitle: {
    fontSize: "24px",
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: "10px",
    letterSpacing: "-0.02em",
  },

  cardDesc: {
    fontSize: "13px",
    lineHeight: 1.85,
    color: "#64748b",
    fontWeight: 500,
  },
};