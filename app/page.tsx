"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

const titleText = "GYM UP";

const menuItems = [
  { href: "/customer", label: "CUSTOMER", title: "顧客管理" },
  { href: "/training", label: "TRAINING / PILATES", title: "トレーニング・ピラティス" },
  { href: "/sales", label: "SALES", title: "売上管理" },
  { href: "/reservation", label: "RESERVATION", title: "予約管理" },
  { href: "/accounting", label: "ACCOUNTING", title: "会計管理" },
  { href: "/attendance", label: "ATTENDANCE", title: "出退勤管理" },
];

export default function HomePage() {
  const [imageError, setImageError] = useState(false);
  const titleChars = useMemo(() => titleText.split(""), []);

  return (
    <main style={styles.page}>
      <style>{`
        @keyframes titleCharIn {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes textDiamondShine {
          0% {
            transform: translateX(-170%) skewX(-22deg);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          45% {
            transform: translateX(240%) skewX(-22deg);
            opacity: 0;
          }
          100% {
            transform: translateX(240%) skewX(-22deg);
            opacity: 0;
          }
        }

        @keyframes cardShine {
          0% {
            transform: translateX(-160%) skewX(-20deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          55% {
            transform: translateX(240%) skewX(-20deg);
            opacity: 0;
          }
          100% {
            transform: translateX(240%) skewX(-20deg);
            opacity: 0;
          }
        }

        @keyframes floatLogo {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
          100% { transform: translateY(0px); }
        }

        @keyframes pulseGlow {
          0% {
            opacity: 0.45;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.03);
          }
          100% {
            opacity: 0.45;
            transform: scale(0.96);
          }
        }

        @keyframes diamondTwinkle {
          0% { opacity: 0.25; transform: scale(0.9) rotate(45deg); }
          50% { opacity: 1; transform: scale(1.18) rotate(45deg); }
          100% { opacity: 0.25; transform: scale(0.9) rotate(45deg); }
        }

        .diamond-text {
          position: relative;
          display: inline-block;
          opacity: 0;
          transform: translateY(18px) scale(0.96);
          animation: titleCharIn 0.68s cubic-bezier(.2,.8,.2,1) forwards;
          color: #ffffff;
          text-shadow:
            0 0 10px rgba(255,255,255,0.22),
            0 0 26px rgba(255,255,255,0.10),
            0 0 44px rgba(212,175,55,0.14);
        }

        .diamond-text::before {
          content: "";
          position: absolute;
          top: -10%;
          left: 12%;
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(212,175,55,0.95));
          transform: rotate(45deg);
          border-radius: 1px;
          filter: blur(0.2px);
          box-shadow:
            0 0 12px rgba(255,255,255,0.55),
            0 0 22px rgba(212,175,55,0.35);
          animation: diamondTwinkle 2.8s ease-in-out infinite;
          animation-delay: calc(var(--i) * 0.12s + 0.6s);
        }

        .diamond-text::after {
          content: "";
          position: absolute;
          top: -5%;
          left: -170%;
          width: 62%;
          height: 120%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,0.0) 22%,
            rgba(255,255,255,0.55) 42%,
            rgba(255,255,255,1) 50%,
            rgba(255,255,255,0.55) 58%,
            rgba(255,255,255,0.0) 78%,
            transparent 100%
          );
          animation: textDiamondShine 4.6s ease-in-out infinite;
          animation-delay: calc(var(--i) * 0.08s + 1.1s);
          pointer-events: none;
        }

        .logo {
          animation: floatLogo 5.2s ease-in-out infinite;
        }

        .glass-card {
          position: relative;
          overflow: hidden;
          transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
          border-radius: 28px;
        }

        .glass-card:hover {
          transform: translateY(-6px);
          box-shadow:
            0 28px 72px rgba(0,0,0,0.40),
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 0 38px rgba(212,175,55,0.10);
          border-color: rgba(255,255,255,0.14);
        }

        .glass-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.08);
          pointer-events: none;
        }

        .glass-card::after {
          content: "";
          position: absolute;
          top: -20%;
          left: -160%;
          width: 58%;
          height: 150%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,0.0) 20%,
            rgba(255,255,255,0.08) 40%,
            rgba(255,255,255,0.38) 50%,
            rgba(255,255,255,0.08) 60%,
            rgba(255,255,255,0.0) 80%,
            transparent 100%
          );
          transform: skewX(-18deg);
          pointer-events: none;
        }

        .glass-card:hover::after {
          animation: cardShine 1.35s ease;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.14fr 0.96fr;
          gap: 24px;
          align-items: stretch;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
        }

        @media (max-width: 980px) {
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
      <div style={styles.sparkleA} />
      <div style={styles.sparkleB} />
      <div style={styles.sparkleC} />

      <div style={styles.container}>
        <div style={styles.logoWrap}>
          <img src="/gymup-logo.png" alt="GYM UP" style={styles.logo} className="logo" />
        </div>

        <section className="hero-grid" style={styles.heroGrid}>
          <div style={styles.heroLeft} className="glass-card">
            <div style={styles.eyebrow}>
              PREMIUM GYM / PILATES / STRETCH MANAGEMENT SYSTEM
            </div>

            <h1 style={styles.title}>
              {titleChars.map((char, i) => (
                <span
                  key={i}
                  className="diamond-text"
                  style={{
                    ["--i" as any]: i,
                    animationDelay: `${i * 0.07}s`,
                    marginRight: char === " " ? "0.22em" : undefined,
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

          <div style={styles.heroVisual} className="glass-card">
            <div style={styles.visualGlowGold} />
            <div style={styles.visualGlowWhite} />
            <div style={styles.visualPulseRing} />

            <div style={styles.visualInner}>
              <div>
                <div style={styles.visualTextTop}>Luxury Management</div>
                <div style={styles.visualTextSub}>
                  Elegant control panel for premium studios
                </div>
              </div>

              <div style={styles.modelWrap}>
                {!imageError ? (
                  <img
                    src={`/top-model.png?v=${Date.now()}`}
                    alt="Dashboard visual"
                    style={styles.modelImage}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div style={styles.fallbackCard}>
                    <div style={styles.fallbackTitle}>画像が見つかりません</div>
                    <div style={styles.fallbackText}>
                      public/top-model.png を入れてください
                    </div>
                    <div style={styles.fallbackPath}>
                      http://localhost:3000/top-model.png
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.visualBottomNote}>
                <div style={styles.bottomLine} />
                <div style={styles.visualBottomText}>
                  Refined workflow for gym, pilates and stretch operation
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="menu-grid" style={styles.grid}>
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="glass-card" style={styles.card}>
              <div style={styles.label}>{item.label}</div>
              <div style={styles.cardTitle}>{item.title}</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 22% 18%, rgba(212,175,55,0.18), transparent 28%), radial-gradient(circle at 78% 20%, rgba(255,255,255,0.08), transparent 24%), linear-gradient(135deg, #07090d 0%, #10141b 42%, #181d24 100%)",
    padding: "40px 20px",
    position: "relative",
    overflow: "hidden",
  },
  bgOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
    backgroundSize: "34px 34px",
    pointerEvents: "none",
  },
  sparkleA: {
    position: "absolute",
    top: "12%",
    left: "8%",
    width: 180,
    height: 180,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 38%, transparent 72%)",
    filter: "blur(10px)",
    pointerEvents: "none",
  },
  sparkleB: {
    position: "absolute",
    right: "7%",
    top: "16%",
    width: 240,
    height: 240,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.03) 40%, transparent 74%)",
    filter: "blur(18px)",
    pointerEvents: "none",
  },
  sparkleC: {
    position: "absolute",
    right: "10%",
    bottom: "10%",
    width: 220,
    height: 220,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.015) 36%, transparent 70%)",
    filter: "blur(14px)",
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
    filter:
      "drop-shadow(0 0 18px rgba(255,255,255,0.08)) drop-shadow(0 0 26px rgba(212,175,55,0.08))",
  },
  heroGrid: {
    marginBottom: "28px",
  },
  heroLeft: {
    padding: "36px",
    background: "rgba(18,22,29,0.74)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    color: "#fff",
    minHeight: "370px",
    boxShadow:
      "0 28px 70px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  heroVisual: {
    position: "relative",
    padding: "22px",
    background: "rgba(18,22,29,0.74)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    minHeight: "370px",
    boxShadow:
      "0 28px 70px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  visualInner: {
    position: "relative",
    zIndex: 2,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  visualGlowGold: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0.07) 45%, transparent 76%)",
    top: "-60px",
    left: "-40px",
    filter: "blur(18px)",
  },
  visualGlowWhite: {
    position: "absolute",
    width: "220px",
    height: "220px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 42%, transparent 72%)",
    bottom: "-40px",
    right: "-20px",
    filter: "blur(14px)",
  },
  visualPulseRing: {
    position: "absolute",
    right: "16%",
    top: "18%",
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    border: "1px solid rgba(212,175,55,0.18)",
    boxShadow: "0 0 22px rgba(212,175,55,0.10)",
    animation: "pulseGlow 4.5s ease-in-out infinite",
  },
  visualTextTop: {
    color: "#fff",
    fontSize: "30px",
    fontWeight: 800,
    lineHeight: 1.08,
    marginBottom: "8px",
    textShadow:
      "0 0 12px rgba(255,255,255,0.12), 0 0 28px rgba(212,175,55,0.08)",
  },
  visualTextSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.04em",
  },
  modelWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "8px 0",
    flex: 1,
  },
  modelImage: {
    width: "100%",
    maxWidth: "460px",
    height: "auto",
    objectFit: "contain",
    borderRadius: "24px",
    boxShadow:
      "0 22px 40px rgba(0,0,0,0.40), 0 0 30px rgba(212,175,55,0.08)",
    display: "block",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  fallbackCard: {
    width: "100%",
    maxWidth: "460px",
    minHeight: "260px",
    borderRadius: "24px",
    border: "1px dashed rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    textAlign: "center",
  },
  fallbackTitle: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "10px",
  },
  fallbackText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "14px",
    marginBottom: "10px",
  },
  fallbackPath: {
    color: "#f5d06f",
    fontSize: "13px",
    wordBreak: "break-all",
  },
  visualBottomNote: {
    marginTop: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  bottomLine: {
    width: "100%",
    height: "1px",
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(212,175,55,0.28) 50%, rgba(255,255,255,0.0) 100%)",
  },
  visualBottomText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: "13px",
    letterSpacing: "0.04em",
    textAlign: "center",
  },
  eyebrow: {
    fontSize: "11px",
    letterSpacing: "0.2em",
    color: "rgba(255,255,255,0.56)",
    marginBottom: "14px",
  },
  title: {
    fontSize: "54px",
    fontWeight: 900,
    margin: 0,
    lineHeight: 1.04,
    letterSpacing: "-0.03em",
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
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "14px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
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
    gap: "22px",
  },
  card: {
    padding: "34px",
    background: "rgba(18,22,29,0.74)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    textDecoration: "none",
    color: "#fff",
    boxShadow:
      "0 24px 60px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03)",
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
    textShadow: "0 0 16px rgba(255,255,255,0.05)",
  },
};