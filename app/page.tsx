"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

const menuItems = [
  { href: "/customer", title: "顧客管理", sub: "顧客情報・詳細確認" },
  { href: "/reservation", title: "予約管理", sub: "予約一覧・新規登録" },
  { href: "/sales", title: "売上管理", sub: "売上入力・日別集計" },
  { href: "/attendance", title: "出退勤管理", sub: "勤怠・給与・台帳" },
  { href: "/training", title: "トレーニング", sub: "履歴・セッション管理" },
  { href: "/accounting", title: "会計管理", sub: "会計・前受・管理用" },
];

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.bgGlow} />
      <div style={styles.container}>
        <header style={styles.header}>
          <img src="/gymup-logo.png" alt="GYM UP" style={styles.logo} />
        </header>

        <section style={styles.hero}>
          <div style={styles.heroInner}>
            <div style={styles.eyebrow}>GYM UP</div>
            <h1 style={styles.title}>Management System</h1>
            <p style={styles.desc}>
              ジム・ピラティス・ストレッチ運営を、
              <br />
              静かで上質なUIで一元管理する。
            </p>
          </div>
        </section>

        <section style={styles.menuSection}>
          <div style={styles.sectionHead}>
            <div style={styles.sectionLine} />
            <div style={styles.sectionTitle}>MENU</div>
          </div>

          <div style={styles.grid}>
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} style={styles.card}>
                <div>
                  <div style={styles.cardTitle}>{item.title}</div>
                  <div style={styles.cardSub}>{item.sub}</div>
                </div>
                <div style={styles.cardArrow}>→</div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .top-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0b0c0e 0%, #15171a 42%, #0f1012 100%)",
    color: "#f3f4f6",
    position: "relative",
    overflow: "hidden",
    padding: "40px 20px 56px",
  },
  bgGlow: {
    position: "absolute",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: 520,
    height: 240,
    background:
      "radial-gradient(circle, rgba(191,161,90,0.14) 0%, rgba(191,161,90,0.04) 42%, rgba(191,161,90,0) 74%)",
    filter: "blur(18px)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: 1180,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  header: {
    marginBottom: 28,
  },
  logo: {
    width: 180,
    maxWidth: "52vw",
    display: "block",
    filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.35))",
  },
  hero: {
    borderRadius: 32,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 24px 70px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.04)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    padding: "56px 44px",
    marginBottom: 24,
  },
  heroInner: {
    maxWidth: 760,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.22em",
    color: "rgba(255,255,255,0.42)",
    marginBottom: 14,
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: "clamp(34px, 6vw, 68px)",
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
    fontWeight: 800,
    color: "#f8fafc",
    textShadow: "0 10px 30px rgba(0,0,0,0.28)",
  },
  desc: {
    marginTop: 20,
    marginBottom: 0,
    fontSize: 15,
    lineHeight: 1.95,
    color: "rgba(255,255,255,0.62)",
  },
  menuSection: {
    borderRadius: 32,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow:
      "0 24px 70px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.03)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    padding: "26px 22px 22px",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
    padding: "0 6px",
  },
  sectionLine: {
    width: 42,
    height: 1,
    background: "linear-gradient(90deg, rgba(191,161,90,0.9), rgba(191,161,90,0.1))",
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: "0.18em",
    color: "rgba(255,255,255,0.46)",
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  card: {
    minHeight: 128,
    borderRadius: 24,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.025) 100%)",
    border: "1px solid rgba(255,255,255,0.07)",
    textDecoration: "none",
    color: "#f8fafc",
    padding: "24px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    boxShadow:
      "0 18px 40px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.03)",
    transition: "transform 0.25s ease, border-color 0.25s ease, background 0.25s ease",
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    marginBottom: 8,
    color: "#f8fafc",
  },
  cardSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.52)",
    lineHeight: 1.8,
  },
  cardArrow: {
    fontSize: 22,
    color: "#bfa15a",
    flexShrink: 0,
    paddingBottom: 2,
  },
};