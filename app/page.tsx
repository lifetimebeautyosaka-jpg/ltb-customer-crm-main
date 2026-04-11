"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";

const titleText = "GYMUP CRM";

const menuItems = [
  { href: "/customer", label: "CUSTOMER", title: "顧客管理" },
  { href: "/training", label: "TRAINING", title: "トレーニング" },
  { href: "/sales", label: "SALES", title: "売上管理" },
  { href: "/reservation", label: "RESERVATION", title: "予約管理" },
  { href: "/accounting", label: "ACCOUNTING", title: "会計管理" },
  { href: "/attendance", label: "ATTENDANCE", title: "出退勤管理" },
];

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* ロゴ */}
        <img src="/gymup-logo.png" style={styles.logo} />

        {/* HERO */}
        <div
          style={{
            ...styles.heroGrid,
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          }}
        >
          <div style={styles.heroCard}>
            <div style={styles.eyebrow}>GYMUP CRM</div>

            <h1 style={styles.title}>
              {titleText}
            </h1>

            <p style={styles.desc}>
              ジム・ピラティス・ストレッチ運営を
              <br />
              一元管理するプレミアムCRM
            </p>

            {/* KPI */}
            <div
              style={{
                ...styles.kpiRow,
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
              }}
            >
              <div style={styles.kpiCard}>顧客管理</div>
              <div style={styles.kpiCard}>予約管理</div>
              <div style={styles.kpiCard}>売上管理</div>
            </div>
          </div>

          <div style={styles.heroCard}>
            <div style={styles.visualTitle}>Today Status</div>

            <div style={styles.statWrap}>
              <div style={styles.stat}>予約 12件</div>
              <div style={styles.stat}>売上 ¥86,000</div>
              <div style={styles.stat}>来店 8人</div>
            </div>
          </div>
        </div>

        {/* メニュー */}
        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          }}
        >
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} style={styles.card}>
              <div style={styles.label}>{item.label}</div>
              <div style={styles.cardTitle}>{item.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

/* ================= デザイン ================= */

const styles: any = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#0e1116 0%,#1c1f24 45%,#0b0d10 100%)",
    padding: "20px",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  logo: {
    width: "160px",
    marginBottom: "20px",
  },

  heroGrid: {
    display: "grid",
    gap: "20px",
    marginBottom: "20px",
  },

  heroCard: {
    padding: "20px",
    borderRadius: "20px",
    background: "rgba(20,22,26,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  eyebrow: {
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "10px",
  },

  title: {
    fontSize: "clamp(28px,5vw,46px)",
    color: "#fff",
    fontWeight: 900,
    margin: 0,
  },

  desc: {
    color: "#9ca3af",
    marginTop: "12px",
  },

  kpiRow: {
    display: "grid",
    gap: "10px",
    marginTop: "20px",
  },

  kpiCard: {
    background: "rgba(255,255,255,0.04)",
    padding: "12px",
    borderRadius: "12px",
    textAlign: "center",
  },

  visualTitle: {
    fontSize: "20px",
    fontWeight: 800,
    marginBottom: "12px",
  },

  statWrap: {
    display: "grid",
    gap: "10px",
  },

  stat: {
    background: "rgba(255,255,255,0.04)",
    padding: "12px",
    borderRadius: "12px",
  },

  grid: {
    display: "grid",
    gap: "16px",
  },

  card: {
    padding: "20px",
    borderRadius: "16px",
    background: "rgba(20,22,26,0.7)",
    border: "1px solid rgba(255,255,255,0.05)",
    textDecoration: "none",
    color: "#fff",
  },

  label: {
    fontSize: "11px",
    color: "#9ca3af",
  },

  cardTitle: {
    fontSize: "20px",
    fontWeight: 700,
    marginTop: "8px",
  },
};