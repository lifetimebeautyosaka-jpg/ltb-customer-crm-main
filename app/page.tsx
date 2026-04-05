"use client";

import Link from "next/link";
import React from "react";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <style>{`
        /* ===== ダイヤ（強めキラキラ） ===== */
        @keyframes diamondRise {
          0% {
            transform: translateY(0px) scale(0.7) rotate(45deg);
            opacity: 0;
          }
          15% { opacity: 1; }
          50% {
            transform: translateY(-200px) scale(1.2) rotate(45deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-450px) scale(0.6) rotate(45deg);
            opacity: 0;
          }
        }

        .diamond {
          position: absolute;
          bottom: -40px;
          width: 10px;
          height: 10px;
          transform: rotate(45deg);
          background: #ffffff;
          box-shadow:
            0 0 12px rgba(255,255,255,1),
            0 0 24px rgba(255,255,255,0.9),
            0 0 40px rgba(255,255,255,0.7);
          animation: diamondRise 8s linear infinite;
          pointer-events: none;
        }

        /* ===== ロゴ浮遊 ===== */
        @keyframes logoFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        .logo-float {
          animation: logoFloat 4s ease-in-out infinite;
        }

        /* ===== パネル ===== */
        .panel {
          position: relative;
          overflow: hidden;
          transition: all .3s ease;
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
            rgba(255,255,255,0.9) 50%,
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
            rgba(255,255,255,1),
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

      {/* ===== ダイヤ背景（増量＆強め） ===== */}
      <div className="diamond" style={{ left:"10%", animationDelay:"0s" }} />
      <div className="diamond" style={{ left:"20%", animationDelay:"1s" }} />
      <div className="diamond" style={{ left:"30%", animationDelay:"2s" }} />
      <div className="diamond" style={{ left:"40%", animationDelay:"1.5s" }} />
      <div className="diamond" style={{ left:"50%", animationDelay:"3s" }} />
      <div className="diamond" style={{ left:"60%", animationDelay:"2.2s" }} />
      <div className="diamond" style={{ left:"70%", animationDelay:"1.2s" }} />
      <div className="diamond" style={{ left:"80%", animationDelay:"2.8s" }} />
      <div className="diamond" style={{ left:"90%", animationDelay:"1.7s" }} />

      <div style={styles.container}>
        {/* ===== ロゴ（左上固定＋浮遊） ===== */}
        <div style={styles.logoFixed} className="logo-float">
          <img src="/gymup-logo.png" style={styles.logoSmall} />
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

const styles: { [key: string]: React.CSSProperties } = {
  page:{
    minHeight:"100vh",
    background:"linear-gradient(135deg,#ffffff,#eef2f7)",
    padding:"40px",
    position:"relative"
  },
  container:{
    maxWidth:"1000px",
    margin:"0 auto",
    position:"relative",
    zIndex:1
  },
  logoFixed:{
    position:"absolute",
    top:"10px",
    left:"10px"
  },
  logoSmall:{
    width:"140px"
  },
  hero:{
    textAlign:"center",
    marginBottom:"40px"
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
    background:"rgba(255,255,255,0.9)",
    backdropFilter:"blur(10px)",
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