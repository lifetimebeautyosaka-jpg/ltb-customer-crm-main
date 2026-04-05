"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <style>{`
        @keyframes floatGlow {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.9; }
          50% { transform: translate3d(0, -10px, 0) scale(1.03); opacity: 1; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.9; }
        }

        @keyframes sparkleBlink {
          0%, 100% { opacity: 0.45; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes heroShineMove {
          0% { transform: translateX(-140%) skewX(-28deg); opacity: 0; }
          12% { opacity: 1; }
          28% { transform: translateX(240%) skewX(-28deg); opacity: 0; }
          100% { transform: translateX(240%) skewX(-28deg); opacity: 0; }
        }

        @keyframes logoFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }

        @keyframes panelShineSweep {
          0% { transform: translateX(-160%) skewX(-24deg); opacity: 0; }
          10% { opacity: 0.95; }
          32% { transform: translateX(240%) skewX(-24deg); opacity: 0; }
          100% { transform: translateX(240%) skewX(-24deg); opacity: 0; }
        }

        @keyframes metalLineGlow {
          0%, 100% { opacity: 0.55; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.15); }
        }

        .gymup-hero-card {
          animation: floatGlow 8s ease-in-out infinite;
        }

        .gymup-logo-wrap {
          animation: logoFloat 5s ease-in-out infinite;
        }

        .gymup-spark-1 {
          animation: sparkleBlink 3.2s ease-in-out infinite;
        }

        .gymup-spark-2 {
          animation: sparkleBlink 4.1s ease-in-out infinite 0.7s;
        }

        .gymup-spark-3 {
          animation: sparkleBlink 3.7s ease-in-out infinite 1.1s;
        }

        .gymup-shine-line {
          animation: heroShineMove 6.5s ease-in-out infinite;
        }

        .gymup-metal-line {
          animation: metalLineGlow 4.8s ease-in-out infinite;
        }

        .gymup-panel {
          transition:
            transform 0.28s ease,
            box-shadow 0.28s ease,
            border-color 0.28s ease,
            background 0.28s ease;
        }

        .gymup-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(
              115deg,
              transparent 0%,
              transparent 38%,
              rgba(255,255,255,0.0) 44%,
              rgba(255,255,255,0.58) 50%,
              rgba(255,255,255,0.0) 56%,
              transparent 62%,
              transparent 100%
            );
          transform: translateX(-160%) skewX(-24deg);
          opacity: 0;
        }

        .gymup-panel:hover {
          transform: translateY(-4px);
          box-shadow:
            0 26px 60px rgba(15,23,42,0.10),
            inset 0 1px 0 rgba(255,255,255,1);
          border-color: rgba(255,255,255,1);
        }

        .gymup-panel:hover::before {
          animation: panelShineSweep 1.35s ease;
        }

        .gymup-panel-large:hover::before {
          animation: panelShineSweep 1.55s ease;
        }

        @media (max-width: 980px) {
          .gymup-dashboard {
            grid-template-columns: 1fr !important;
          }

          .gymup-right-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .gymup-page {
            padding: 24px 14px 40px !important;
          }

          .gymup-hero-card {
            padding: 34px 18px 28px !important;
            border-radius: 26px !important;
          }

          .gymup-logo {
            width: 260px !important;
            max-width: 100% !important;
          }

          .gymup-hero-title {
            font-size: 34px !important;
          }

          .gymup-dashboard {
            gap: 14px !important;
          }

          .gymup-right-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .gymup-panel {
            min-height: 150px !important;
            border-radius: 22px !important;
            padding: 20px 18px !important;
          }

          .gymup-panel-large {
            min-height: 220px !important;
          }
        }
      `}</style>

      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.glowC} />

      <div className="gymup-spark-1" style={styles.spark1} />
      <div className="gymup-spark-2" style={styles.spark2} />
      <div className="gymup-spark-3" style={styles.spark3} />

      <div style={styles.container}>
        <section className="gymup-hero-card" style={styles.heroCard}>
          <div className="gymup-shine-line" style={styles.shineLine} />

          <div style={styles.heroInnerGlow} />

          <div className="gymup-logo-wrap" style={styles.logoWrap}>
            <div className="gymup-metal-line" style={styles.logoMetalLine} />
            <img src="/gymup-logo.png" alt="GYMUP" style={styles.logo} />
          </div>

          <div style={styles.eyebrow}>PREMIUM GYM MANAGEMENT SYSTEM</div>
          <h1 className="gymup-hero-title" style={styles.heroTitle}>
            GYMUP CRM
          </h1>
          <p style={styles.heroText}>
            顧客管理、予約、売上、会計、トレーニング履歴まで。
            <br />
            ジム運営を美しく、一元管理するためのCRM。
          </p>
        </section>

        <section className="gymup-dashboard" style={styles.dashboard}>
          <Link
            href="/customer"
            className="gymup-panel gymup-panel-large"
            style={{ ...styles.panel, ...styles.panelLarge }}
          >
            <div style={styles.panelShine} />
            <div style={styles.panelMetal} />
            <div style={styles.panelLabel}>CUSTOMER</div>
            <div style={styles.panelTitle}>顧客管理</div>
            <div style={styles.panelDesc}>
              顧客情報、詳細ページ、回数券、LTV、来店履歴を管理
            </div>
          </Link>

          <div className="gymup-right-grid" style={styles.rightGrid}>
            <Link href="/reservation" className="gymup-panel" style={styles.panel}>
              <div style={styles.panelShine} />
              <div style={styles.panelMetal} />
              <div style={styles.panelLabel}>RESERVATION</div>
              <div style={styles.panelTitle}>予約管理</div>
              <div style={styles.panelDesc}>月カレンダー・日別確認・予約詳細</div>
            </Link>

            <Link href="/sales" className="gymup-panel" style={styles.panel}>
              <div style={styles.panelShine} />
              <div style={styles.panelMetal} />
              <div style={styles.panelLabel}>SALES</div>
              <div style={styles.panelTitle}>売上管理</div>
              <div style={styles.panelDesc}>売上登録・履歴確認・顧客別売上</div>
            </Link>

            <Link href="/accounting" className="gymup-panel" style={styles.panel}>
              <div style={styles.panelShine} />
              <div style={styles.panelMetal} />
              <div style={styles.panelLabel}>ACCOUNTING</div>
              <div style={styles.panelTitle}>会計管理</div>
              <div style={styles.panelDesc}>集計・チェック・数値管理</div>
            </Link>

            <Link href="/customer" className="gymup-panel" style={styles.panel}>
              <div style={styles.panelShine} />
              <div style={styles.panelMetal} />
              <div style={styles.panelLabel}>TRAINING</div>
              <div style={styles.panelTitle}>トレーニング履歴</div>
              <div style={styles.panelDesc}>
                顧客ごとのセッション記録・比較・管理
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const glass =
  "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.72))";

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    padding: "36px 20px 60px",
    background: `
      radial-gradient(circle at 15% 15%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.72) 18%, transparent 38%),
      radial-gradient(circle at 85% 12%, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.65) 18%, transparent 42%),
      radial-gradient(circle at 80% 78%, rgba(226,232,240,0.55) 0%, transparent 30%),
      linear-gradient(135deg, #ffffff 0%, #f8fafc 32%, #eef2f7 62%, #e2e8f0 100%)
    `,
  },

  glowA: {
    position: "absolute",
    top: "-90px",
    left: "-70px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.95)",
    filter: "blur(55px)",
    pointerEvents: "none",
  },

  glowB: {
    position: "absolute",
    top: "120px",
    right: "-60px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.85)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  glowC: {
    position: "absolute",
    bottom: "-120px",
    left: "18%",
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    background: "rgba(203,213,225,0.35)",
    filter: "blur(75px)",
    pointerEvents: "none",
  },

  spark1: {
    position: "absolute",
    top: "90px",
    left: "14%",
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#ffffff",
    boxShadow: "0 0 24px rgba(255,255,255,0.95)",
    pointerEvents: "none",
  },

  spark2: {
    position: "absolute",
    top: "220px",
    right: "16%",
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    background: "#ffffff",
    boxShadow: "0 0 26px rgba(255,255,255,0.95)",
    pointerEvents: "none",
  },

  spark3: {
    position: "absolute",
    bottom: "120px",
    right: "28%",
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "#ffffff",
    boxShadow: "0 0 18px rgba(255,255,255,0.95)",
    pointerEvents: "none",
  },

  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1120px",
    margin: "0 auto",
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "34px",
    padding: "42px 28px 36px",
    marginBottom: "24px",
    textAlign: "center",
    background: glass,
    border: "1px solid rgba(255,255,255,0.95)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow:
      "0 24px 80px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.98)",
  },

  heroInnerGlow: {
    position: "absolute",
    inset: "auto auto -80px -40px",
    width: "280px",
    height: "180px",
    borderRadius: "999px",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.12) 50%, transparent 75%)",
    filter: "blur(20px)",
    pointerEvents: "none",
  },

  shineLine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "58%",
    height: "2px",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.98) 32%, rgba(245,158,11,0.52) 50%, rgba(255,255,255,0.94) 68%, transparent 100%)",
    pointerEvents: "none",
  },

  logoWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px 24px 20px",
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(241,245,249,0.76))",
    border: "1px solid rgba(255,255,255,0.95)",
    boxShadow:
      "0 16px 40px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,1)",
  },

  logoMetalLine: {
    position: "absolute",
    top: "10px",
    left: "12%",
    width: "76%",
    height: "1px",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.22) 14%, rgba(255,255,255,0.95) 48%, rgba(245,158,11,0.45) 56%, rgba(255,255,255,0.95) 68%, rgba(148,163,184,0.22) 86%, transparent 100%)",
    pointerEvents: "none",
  },

  logo: {
    width: "340px",
    maxWidth: "92%",
    height: "auto",
    display: "block",
    objectFit: "contain",
  },

  eyebrow: {
    marginTop: "18px",
    fontSize: "11px",
    letterSpacing: "0.24em",
    color: "#94a3b8",
    fontWeight: 700,
  },

  heroTitle: {
    margin: "10px 0 0",
    fontSize: "42px",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.04em",
  },

  heroText: {
    margin: "14px 0 0",
    fontSize: "15px",
    lineHeight: 1.9,
    color: "#475569",
    fontWeight: 500,
  },

  dashboard: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: "18px",
  },

  rightGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },

  panel: {
    position: "relative",
    overflow: "hidden",
    display: "block",
    textDecoration: "none",
    padding: "24px 22px",
    borderRadius: "28px",
    background: glass,
    border: "1px solid rgba(255,255,255,0.95)",
    color: "#0f172a",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow:
      "0 18px 40px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.98)",
    minHeight: "185px",
  },

  panelLarge: {
    minHeight: "388px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },

  panelShine: {
    position: "absolute",
    top: "-25%",
    right: "-10%",
    width: "180px",
    height: "180px",
    borderRadius: "999px",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.18) 38%, transparent 72%)",
    pointerEvents: "none",
  },

  panelMetal: {
    position: "absolute",
    top: 0,
    left: "12%",
    width: "76%",
    height: "1px",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.0) 10%, rgba(255,255,255,0.92) 50%, rgba(245,158,11,0.35) 58%, rgba(255,255,255,0.92) 74%, transparent 100%)",
    pointerEvents: "none",
  },

  panelLabel: {
    position: "relative",
    zIndex: 1,
    fontSize: "11px",
    letterSpacing: "0.18em",
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: "10px",
  },

  panelTitle: {
    position: "relative",
    zIndex: 1,
    fontSize: "24px",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#0f172a",
  },

  panelDesc: {
    position: "relative",
    zIndex: 1,
    marginTop: "10px",
    fontSize: "13px",
    lineHeight: 1.8,
    color: "#64748b",
  },
};