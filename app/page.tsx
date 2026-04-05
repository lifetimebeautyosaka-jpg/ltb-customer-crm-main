"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <style>{`
        /* ===== 上昇ラメ（ダイヤ粒） ===== */
        @keyframes sparkleRise {
          0% {
            transform: translateY(20px) scale(0.6);
            opacity: 0;
          }
          20% { opacity: 0.9; }
          50% {
            transform: translateY(-40px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) scale(0.6);
            opacity: 0;
          }
        }

        .sparkle {
          position: absolute;
          bottom: 0;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: linear-gradient(135deg,#fff,#f1f5f9);
          box-shadow: 0 0 10px rgba(255,255,255,0.9),
                      0 0 20px rgba(255,255,255,0.6);
          animation: sparkleRise 4s ease-in-out infinite;
        }

        /* ===== 横キラ ===== */
        @keyframes shineX {
          0% { transform: translateX(-150%); opacity:0; }
          20% { opacity:1; }
          60% { transform: translateX(250%); opacity:0; }
          100% { opacity:0; }
        }

        /* ===== 縦キラ ===== */
        @keyframes shineY {
          0% { transform: translateY(-120%); opacity:0; }
          20% { opacity:1; }
          60% { transform: translateY(150%); opacity:0; }
          100% { opacity:0; }
        }

        .panel {
          position: relative;
          overflow: hidden;
          transition: all .3s ease;
        }

        .panel:hover {
          transform: translateY(-6px);
          box-shadow: 0 30px 60px rgba(0,0,0,0.08);
        }

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
        }

        .panel:hover::before {
          animation: shineX 1.2s ease;
        }

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
            rgba(245,158,11,0.4),
            transparent
          );
        }

        .panel:hover::after {
          animation: shineY 1.4s ease;
        }
      `}</style>

      {/* 粒 */}
      <div className="sparkle" style={{ left:"20%", animationDelay:"0s" }} />
      <div className="sparkle" style={{ left:"40%", animationDelay:"1s" }} />
      <div className="sparkle" style={{ left:"60%", animationDelay:"2s" }} />
      <div className="sparkle" style={{ left:"80%", animationDelay:"1.5s" }} />

      <div style={styles.container}>
        {/* HERO */}
        <section style={styles.hero}>
          <img src="/gymup-logo.png" style={styles.logo} />
          <h1 style={styles.title}>GYMUP CRM</h1>
          <p style={styles.desc}>
            顧客・売上・予約・トレーニングを一元管理する
            <br />高級CRMシステム
          </p>
        </section>

        {/* MENU */}
        <section style={styles.grid}>
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
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight:"100vh",
    background:"linear-gradient(135deg,#ffffff,#eef2f7)",
    padding:"40px"
  },
  container:{
    maxWidth:"1000px",
    margin:"0 auto"
  },
  hero:{
    textAlign:"center",
    marginBottom:"40px"
  },
  logo:{
    width:"260px"
  },
  title:{
    fontSize:"42px",
    fontWeight:900
  },
  desc:{
    color:"#64748b"
  },
  grid:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:"20px"
  },
  panel:{
    padding:"30px",
    borderRadius:"20px",
    background:"#fff",
    textDecoration:"none",
    color:"#111"
  },
  label:{
    fontSize:"12px",
    color:"#94a3b8"
  },
  panelTitle:{
    fontSize:"22px",
    fontWeight:800
  }
};