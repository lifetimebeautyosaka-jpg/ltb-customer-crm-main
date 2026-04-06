"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

const titleText = "GYMUP CRM";

type MenuItem = {
  href: string;
  label: string;
  title: string;
  icon: string;
  accent: "orange" | "blue" | "gold" | "purple" | "cyan" | "green";
  adminOnly?: boolean;
};

const MENUS: MenuItem[] = [
  {
    href: "/customer",
    label: "CUSTOMER",
    title: "顧客管理",
    icon: "👤",
    accent: "blue",
  },
  {
    href: "/training",
    label: "TRAINING / PILATES",
    title: "トレーニング・ピラティス",
    icon: "🏋️",
    accent: "purple",
  },
  {
    href: "/sales",
    label: "SALES",
    title: "売上管理",
    icon: "💴",
    accent: "gold",
  },
  {
    href: "/reservation",
    label: "RESERVATION",
    title: "予約管理",
    icon: "📅",
    accent: "orange",
  },
  {
    href: "/accounting",
    label: "ACCOUNTING",
    title: "会計管理",
    icon: "📊",
    accent: "cyan",
    adminOnly: true,
  },
  {
    href: "/attendance",
    label: "ATTENDANCE",
    title: "出退勤管理",
    icon: "⏰",
    accent: "green",
  },
];

function getAccent(accent: MenuItem["accent"]) {
  switch (accent) {
    case "orange":
      return {
        glow: "rgba(255, 131, 74, 0.38)",
        border: "rgba(255, 131, 74, 0.42)",
        soft: "rgba(255, 131, 74, 0.14)",
      };
    case "blue":
      return {
        glow: "rgba(91, 140, 255, 0.36)",
        border: "rgba(91, 140, 255, 0.42)",
        soft: "rgba(91, 140, 255, 0.14)",
      };
    case "gold":
      return {
        glow: "rgba(244, 184, 96, 0.34)",
        border: "rgba(244, 184, 96, 0.42)",
        soft: "rgba(244, 184, 96, 0.14)",
      };
    case "purple":
      return {
        glow: "rgba(166, 121, 255, 0.34)",
        border: "rgba(166, 121, 255, 0.42)",
        soft: "rgba(166, 121, 255, 0.14)",
      };
    case "cyan":
      return {
        glow: "rgba(77, 208, 225, 0.34)",
        border: "rgba(77, 208, 225, 0.42)",
        soft: "rgba(77, 208, 225, 0.14)",
      };
    case "green":
      return {
        glow: "rgba(92, 201, 136, 0.34)",
        border: "rgba(92, 201, 136, 0.42)",
        soft: "rgba(92, 201, 136, 0.14)",
      };
  }
}

function getRoleLabel(role: string) {
  if (role === "admin") return "管理者";
  if (role === "staff") return "スタッフ";
  return "ログイン中";
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setMounted(true);

    const loggedIn = localStorage.getItem("gymup_logged_in");
    const savedRole = localStorage.getItem("gymup_user_role") || "";
    const savedStaffName = localStorage.getItem("gymup_current_staff_name") || "";

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    setRole(savedRole);
    setStaffName(savedStaffName);
  }, []);

  const visibleMenus = useMemo(() => {
    if (role === "admin") return MENUS;
    return MENUS.filter((item) => !item.adminOnly);
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem("gymup_logged_in");
    localStorage.removeItem("gymup_user_role");
    localStorage.removeItem("gymup_current_staff_name");
    window.location.href = "/login";
  };

  if (!mounted) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingWrap}>
          <div style={styles.loadingCard}>読み込み中...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <style>{`
        @keyframes floatLogo {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
          100% { transform: translateY(0px); }
        }

        @keyframes titleCharIn {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes shineSweep {
          0% {
            left: -120%;
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          42% {
            left: 220%;
            opacity: 0;
          }
          100% {
            left: 220%;
            opacity: 0;
          }
        }

        @keyframes cardShine {
          0% { transform: translateX(-160%); }
          100% { transform: translateX(220%); }
        }

        @keyframes slowPulse {
          0% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.95; }
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.25));
          pointer-events: none;
        }

        .logo-float {
          animation: floatLogo 5s ease-in-out infinite;
        }

        .title-char {
          position: relative;
          display: inline-block;
          opacity: 0;
          transform: translateY(16px);
          animation: titleCharIn 0.65s ease forwards;
          color: #f8fbff;
          text-shadow:
            0 0 8px rgba(255,255,255,0.16),
            0 0 18px rgba(255,255,255,0.08);
        }

        .title-char::after {
          content: "";
          position: absolute;
          top: 0;
          left: -120%;
          width: 52%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,0.08) 35%,
            rgba(255,255,255,0.95) 50%,
            rgba(255,255,255,0.08) 65%,
            transparent 100%
          );
          transform: skewX(-18deg);
          opacity: 0;
          animation: shineSweep 4.4s ease-in-out infinite;
        }

        .menu-card {
          position: relative;
          overflow: hidden;
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }

        .menu-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 28px 60px rgba(0,0,0,0.34);
        }

        .menu-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            115deg,
            transparent 35%,
            rgba(255,255,255,0.18) 50%,
            transparent 65%
          );
          transform: translateX(-160%);
          pointer-events: none;
        }

        .menu-card:hover::after {
          animation: cardShine 1.2s ease;
        }

        .hero-orb-a,
        .hero-orb-b,
        .hero-orb-c {
          position: absolute;
          border-radius: 50%;
          filter: blur(18px);
          animation: slowPulse 7s ease-in-out infinite;
          pointer-events: none;
        }

        .hero-orb-a {
          width: 360px;
          height: 360px;
          top: -120px;
          left: -100px;
          background: radial-gradient(circle, rgba(255,122,24,0.30) 0%, rgba(255,122,24,0.05) 50%, transparent 72%);
        }

        .hero-orb-b {
          width: 320px;
          height: 320px;
          right: -90px;
          top: -70px;
          background: radial-gradient(circle, rgba(91,140,255,0.30) 0%, rgba(91,140,255,0.05) 50%, transparent 72%);
          animation-delay: 1.6s;
        }

        .hero-orb-c {
          width: 260px;
          height: 260px;
          right: 8%;
          bottom: -100px;
          background: radial-gradient(circle, rgba(244,184,96,0.18) 0%, rgba(244,184,96,0.04) 55%, transparent 72%);
          animation-delay: 2.5s;
        }

        @media (max-width: 920px) {
          .hero-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .menu-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .page-wrap {
            padding: 22px 14px 40px !important;
          }

          .hero-card {
            padding: 22px 18px !important;
          }

          .side-card {
            padding: 18px !important;
          }

          .menu-card-inner {
            padding: 18px !important;
            min-height: 128px !important;
          }
        }
      `}</style>

      <div className="bg-grid" />

      <div className="page-wrap" style={styles.container}>
        <div style={styles.logoWrap}>
          <img src="/gymup-logo.png" alt="GYMUP logo" style={styles.logo} className="logo-float" />
        </div>

        <section
          className="hero-layout"
          style={styles.heroLayout}
        >
          <div className="hero-card" style={styles.heroCard}>
            <div className="hero-orb-a" />
            <div className="hero-orb-b" />
            <div className="hero-orb-c" />

            <div style={styles.eyebrow}>
              PREMIUM GYM & PILATES MANAGEMENT SYSTEM
            </div>

            <h1 style={styles.title}>
              {titleText.split("").map((char, i) => (
                <span
                  key={`${char}-${i}`}
                  className="title-char"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    marginRight: char === " " ? "0.24em" : undefined,
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

            <div style={styles.heroMiniGrid}>
              <div style={styles.heroMiniCard}>
                <div style={styles.heroMiniLabel}>CUSTOMER</div>
                <div style={styles.heroMiniValue}>顧客管理</div>
                <div style={styles.heroMiniSub}>一覧・詳細・履歴</div>
              </div>

              <div style={styles.heroMiniCard}>
                <div style={styles.heroMiniLabel}>RESERVATION</div>
                <div style={styles.heroMiniValue}>予約管理</div>
                <div style={styles.heroMiniSub}>日別・詳細・導線</div>
              </div>

              <div style={styles.heroMiniCard}>
                <div style={styles.heroMiniLabel}>SALES</div>
                <div style={styles.heroMiniValue}>売上確認</div>
                <div style={styles.heroMiniSub}>日次・月次・会計</div>
              </div>
            </div>
          </div>

          <aside className="side-card" style={styles.sideCard}>
            <div style={styles.userTopLabel}>CURRENT USER</div>

            <div style={styles.userName}>{staffName || "ログイン中"}</div>

            <div style={styles.roleBadge}>{getRoleLabel(role)}</div>

            <div style={styles.sideDivider} />

            <div style={styles.sideInfoBlock}>
              <div style={styles.sideInfoLabel}>STATUS</div>
              <div style={styles.sideInfoValue}>GYMUP Ready</div>
            </div>

            <div style={styles.sideInfoBlock}>
              <div style={styles.sideInfoLabel}>MODE</div>
              <div style={styles.sideInfoValue}>
                {role === "admin" ? "Admin Control" : "Staff Access"}
              </div>
            </div>

            <button onClick={handleLogout} style={styles.logoutButton}>
              ログアウト
            </button>
          </aside>
        </section>

        <section
          className="menu-grid"
          style={styles.grid}
        >
          {visibleMenus.map((menu) => {
            const accent = getAccent(menu.accent);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className="menu-card"
                style={{
                  ...styles.card,
                  border: `1px solid ${accent.border}`,
                  boxShadow: `0 20px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
              >
                <div
                  className="menu-card-inner"
                  style={styles.cardInner}
                >
                  <div
                    style={{
                      ...styles.iconWrap,
                      background: accent.soft,
                      border: `1px solid ${accent.border}`,
                      boxShadow: `0 12px 28px ${accent.glow}`,
                    }}
                  >
                    {menu.icon}
                  </div>

                  <div style={styles.label}>{menu.label}</div>
                  <div style={styles.cardTitle}>{menu.title}</div>

                  <div style={styles.openBadge}>
                    Open
                    <span style={{ fontSize: 13 }}>→</span>
                  </div>

                  <div
                    style={{
                      ...styles.cardGlow,
                      background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`,
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

const glassBg = "rgba(17, 22, 35, 0.62)";
const glassBorder = "1px solid rgba(255,255,255,0.10)";

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 18% 28%, rgba(255,122,24,0.35), transparent 28%), radial-gradient(circle at 78% 24%, rgba(91,140,255,0.30), transparent 30%), radial-gradient(circle at 72% 78%, rgba(255,122,24,0.18), transparent 24%), linear-gradient(135deg, #05070d 0%, #0b1120 45%, #111827 100%)",
    position: "relative",
    overflow: "hidden",
  },
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingCard: {
    padding: "16px 22px",
    borderRadius: 18,
    color: "#fff",
    fontWeight: 700,
    background: glassBg,
    border: glassBorder,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
  },
  container: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "28px 18px 48px",
    position: "relative",
    zIndex: 1,
  },
  logoWrap: {
    marginBottom: 20,
  },
  logo: {
    width: "190px",
    maxWidth: "62vw",
    display: "block",
  },
  heroLayout: {
    display: "grid",
    gridTemplateColumns: "1.45fr 0.72fr",
    gap: 18,
    alignItems: "stretch",
    marginBottom: 18,
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    background: glassBg,
    border: glassBorder,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 28px 70px rgba(0,0,0,0.42)",
    padding: "28px 24px 24px",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    letterSpacing: "0.22em",
    color: "rgba(255,255,255,0.68)",
    fontWeight: 700,
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: "clamp(34px, 6vw, 56px)",
    lineHeight: 1.04,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  desc: {
    marginTop: 16,
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 1.85,
    maxWidth: 620,
  },
  heroMiniGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginTop: 22,
  },
  heroMiniCard: {
    borderRadius: 20,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "16px 14px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
  },
  heroMiniLabel: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    marginBottom: 8,
  },
  heroMiniValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 6,
  },
  heroMiniSub: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    lineHeight: 1.5,
  },
  sideCard: {
    borderRadius: 30,
    background: glassBg,
    border: glassBorder,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 28px 70px rgba(0,0,0,0.42)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  userTopLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    marginBottom: 10,
  },
  userName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1.15,
  },
  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: 700,
    width: "fit-content",
  },
  sideDivider: {
    height: 1,
    width: "100%",
    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.16) 80%, transparent 100%)",
    margin: "18px 0",
  },
  sideInfoBlock: {
    marginBottom: 12,
  },
  sideInfoLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    marginBottom: 4,
  },
  sideInfoValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
  },
  logoutButton: {
    marginTop: 12,
    border: "none",
    borderRadius: 16,
    padding: "13px 16px",
    background: "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 12px 26px rgba(0,0,0,0.22)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18,
  },
  card: {
    textDecoration: "none",
    color: "#fff",
    borderRadius: 26,
    background: "rgba(16, 21, 34, 0.58)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    position: "relative",
  },
  cardInner: {
    position: "relative",
    minHeight: 162,
    padding: 22,
    overflow: "hidden",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    color: "rgba(255,255,255,0.56)",
    letterSpacing: "0.12em",
    fontWeight: 700,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1.22,
    position: "relative",
    zIndex: 1,
  },
  openBadge: {
    marginTop: 18,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: 700,
    position: "relative",
    zIndex: 1,
  },
  cardGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    right: -40,
    top: -40,
    borderRadius: "50%",
    filter: "blur(18px)",
    zIndex: 0,
    pointerEvents: "none",
  },
};