"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page} className="gymup-page">
      <style>{`
        /* ===== アニメーション ===== */

        @keyframes heroShineMove {
          0% { transform: translateX(-140%) skewX(-28deg); opacity: 0; }
          12% { opacity: 1; }
          28% { transform: translateX(240%) skewX(-28deg); opacity: 0; }
          100% { opacity: 0; }
        }

        @keyframes verticalShine {
          0% { transform: translateY(-120%) skewY(-12deg); opacity: 0; }
          15% { opacity: 1; }
          35% { transform: translateY(140%) skewY(-12deg); opacity: 0; }
          100% { opacity: 0; }
        }

        @keyframes sparkle {
          0%,100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* ===== 共通 ===== */

        .gymup-panel {
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
        }

        .gymup-panel:hover {
          transform: translateY(-4px);
          box-shadow: 0 30px 60px rgba(0,0,0,0.08);
        }

        /* ===== 横キラ ===== */

        .gymup-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            transparent 40%,
            rgba(255,255,255,0.7) 50%,
            transparent 60%,
            transparent 100%
          );
          transform: translateX(-150%);
          opacity: 0;
        }

        .gymup-panel:hover::before {
          animation: heroShineMove 1.2s ease;
        }

        /* ===== 縦キラ ===== */

        .gymup-panel::after {
          content: "";
          position: absolute;
          top: -20%;
          left: 50%;
          width: 1px;
          height: 140%;
          transform: translateX(-50%);
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(255,255,255,0.9) 30%,
            rgba(245,158,11,0.4) 50%,
            rgba(255,255,255,0.9) 70%,
            transparent 100%
          );
          opacity: 0;
        }

        .gymup-panel:hover::after {
          animation: verticalShine 1.4s ease;
        }

        /* ===== キラ粒 ===== */

        .spark {
          animation: sparkle 3s ease-in-out infinite;
        }

        /* ===== ロゴ浮遊 ===== */

        .logo-float {
          animation: sparkle 5s ease-in-out infinite;
        }

      `}</style>

      <div style={styles.container}>
        {/* ヘッダー */}
        <section style={styles.heroCard}>
          <div style={styles.logoWrap} className="logo-float">
            <img src="/gymup-logo.png" style={styles.logo} />
          </div>

          <h1 style={styles.title}>GYMUP CRM</h1>

          <p style={styles.desc}>
            顧客管理・売上・予約・トレーニングを
            <br />
            一元管理する次世代CRM
          </p>
        </section>

        {/* メニュー */}
        <section style={styles.grid}>
          <Link href="/customer" className="gymup-panel" style={styles.panel}>
            <div style={styles.label}>CUSTOMER</div>
            <div style={styles.panelTitle}>顧客管理</div>
          </Link>

          <Link href="/sales" className="gymup-panel" style={styles.panel}>
            <div style={styles.label}>SALES</div>
            <div style={styles.panelTitle}>売上管理</div>
          </Link>

          <Link href="/reservation" className="gymup-panel" style={styles.panel}>
            <div style={styles.label}>RESERVATION</div>
            <div style={styles.panelTitle}>予約管理</div>
          </Link>

          <Link href="/accounting" className="gymup-panel" style={styles.panel}>
            <div style={styles.label}>ACCOUNTING</div>
            <div style={styles.panelTitle}>会計管理</div>
          </Link>
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#ffffff,#f1f5f9)",
    padding: "40px",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  heroCard: {
    textAlign: "center" as const,
    marginBottom: "40px",
  },

  logoWrap: {
    marginBottom: "20px",
  },

  logo: {
    width: "260px",
  },

  title: {
    fontSize: "40px",
    fontWeight: 900,
  },

  desc: {
    marginTop: "10px",
    color: "#64748b",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  panel: {
    padding: "30px",
    borderRadius: "20px",
    background: "white",
    textDecoration: "none",
    color: "#111",
  },

  label: {
    fontSize: "12px",
    color: "#94a3b8",
  },

  panelTitle: {
    fontSize: "22px",
    fontWeight: 800,
  },
};