"use client";

import Link from "next/link";
import React from "react";

const menuItems = [
  { href: "/customer", title: "顧客管理" },
  { href: "/reservation", title: "予約管理" },
  { href: "/sales", title: "売上管理" },
  { href: "/attendance", title: "出退勤管理" },
  { href: "/training", title: "トレーニング" },
  { href: "/accounting", title: "会計管理" },
];

export default function HomePage() {
  return (
    <main style={styles.page}>
      <style>{`

        /* タイトルキラ */
        .shine-text {
          position: relative;
          display: inline-block;
          overflow: hidden;
        }

        .shine-text::after {
          content: "";
          position: absolute;
          top: 0;
          left: -120%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,0.3) 45%,
            rgba(255,255,255,0.9) 50%,
            rgba(255,255,255,0.3) 55%,
            transparent 100%
          );
          transform: skewX(-20deg);
          animation: shineText 4s infinite;
        }

        @keyframes shineText {
          0% { left: -120%; }
          40% { left: 200%; }
          100% { left: 200%; }
        }

        /* カードキラ */
        .card {
          position: relative;
          overflow: hidden;
        }

        .card::after {
          content: "";
          position: absolute;
          top: 0;
          left: -150%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(255,255,255,0.2),
            transparent
          );
          transform: skewX(-20deg);
        }

        .card:hover::after {
          animation: cardShine 1.2s;
        }

        @keyframes cardShine {
          0% { left: -150%; }
          100% { left: 200%; }
        }

        /* レスポンシブ */
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 720px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

      `}</style>

      <div style={styles.container}>
        <img src="/gymup-logo.png" style={styles.logo} />

        {/* HERO */}
        <div style={styles.hero}>
          <h1 className="shine-text" style={styles.title}>
            GYM UP
          </h1>

          <div style={styles.line} />

          <p style={styles.desc}>
            パーソナルジム・ピラティス・ストレッチ運営を
            <br />
            上質なUIで一元管理するCRM
          </p>
        </div>

        {/* MENU */}
        <div className="grid">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="card" style={styles.card}>
              <div style={styles.cardTitle}>{item.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

/* スタイル */

const styles: any = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#0a0c10 0%,#15181d 40%,#0c0e12 100%)",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  logo: {
    width: "160px",
    marginBottom: "30px",
  },

  hero: {
    marginBottom: "40px",
  },

  title: {
    fontSize: "64px",
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-0.05em",
  },

  line: {
    width: "80px",
    height: "2px",
    background: "#c6a95d",
    margin: "20px 0",
  },

  desc: {
    color: "#aaa",
    lineHeight: 1.8,
  },

  card: {
    padding: "28px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    textDecoration: "none",
    color: "#fff",
  },

  cardTitle: {
    fontSize: "22px",
    fontWeight: 700,
  },
};