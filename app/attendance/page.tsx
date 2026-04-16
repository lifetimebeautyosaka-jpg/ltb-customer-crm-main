"use client";

import Link from "next/link";
import { CSSProperties } from "react";

const menuCards = [
  {
    title: "スタッフ用",
    sub: "出勤・退勤・休憩入力",
    href: "/attendance/staff",
    stat: "STAFF",
    description:
      "スタッフ本人がその日の出勤・退勤を記録するためのページです。",
  },
  {
    title: "管理者用",
    sub: "勤怠一覧・集計確認",
    href: "/attendance/admin",
    stat: "ADMIN",
    description:
      "全スタッフの勤怠、月別集計、残業・深夜時間を確認できます。",
  },
  {
    title: "給与明細",
    sub: "スタッフ別の給与概算",
    href: "/attendance/admin/payslip",
    stat: "PAYSLIP",
    description:
      "対象月・対象スタッフごとの給与明細を確認できます。",
  },
  {
    title: "賃金台帳",
    sub: "CSV / Excel 出力",
    href: "/attendance/admin/wage-ledger",
    stat: "LEDGER",
    description:
      "賃金台帳を一覧で確認し、CSVやExcelに出力できます。",
  },
];

export default function AttendancePage() {
  return (
    <main style={pageStyle}>
      <style>{responsiveStyle}</style>

      <div style={bgGlowTop} />
      <div style={bgGlowLeft} />
      <div style={bgGlowRight} />
      <div style={noiseStyle} />

      <div style={containerStyle}>
  <div style={topBarStyle}>

    <Link href="/dashboard" style={backLinkStyle}>
      ← ダッシュボードへ戻る
    </Link>

    <div style={topIconsStyle}>
      <div style={topDotStyle} />
      <div style={topDotStyle} />
      <div style={topDotStyle} />
    </div>

  </div>

          <div style={topIconsStyle}>
            <div style={topDotStyle} />
            <div style={topDotStyle} />
            <div style={topDotStyle} />
          </div>
        </div>

        <section style={heroCardStyle} className="attendance-hero-grid">
          <div style={heroLeftStyle} className="attendance-hero-left">
            <div style={miniLabelStyle}>GYMUP CRM</div>
            <h1 style={heroTitleStyle}>Attendance Dashboard</h1>
            <p style={heroSubStyle}>
              勤怠管理・給与確認・賃金台帳出力を、
              <br className="attendance-pc-break" />
              ひとつの画面からスムーズに操作できます。
            </p>

            <div style={heroButtonRowStyle} className="attendance-button-row">
              <Link
                href="/attendance/staff"
                style={primaryButtonStyle}
                className="attendance-main-button"
              >
                スタッフ打刻へ
              </Link>
              <Link
                href="/attendance/admin"
                style={secondaryButtonStyle}
                className="attendance-sub-button"
              >
                管理者集計へ
              </Link>
            </div>
          </div>

          <div style={heroRightStyle}>
            <div style={chartCardStyle}>
              <div style={chartTitleStyle}>Attendance Overview</div>

              <div style={chartWrapStyle}>
                <svg viewBox="0 0 320 140" style={{ width: "100%", height: "100%" }}>
                  <defs>
                    <linearGradient id="blueLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="grayLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(100,116,139,0.45)" />
                      <stop offset="100%" stopColor="rgba(100,116,139,0.16)" />
                    </linearGradient>
                  </defs>

                  {[20, 50, 80, 110].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="320"
                      y2={y}
                      stroke="rgba(148,163,184,0.18)"
                      strokeWidth="1"
                    />
                  ))}

                  <polyline
                    fill="none"
                    stroke="url(#grayLine)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,92 40,82 80,88 120,62 160,70 200,56 240,78 280,66 320,74"
                  />

                  <polyline
                    fill="none"
                    stroke="url(#blueLine)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,98 40,76 80,64 120,72 160,96 200,54 240,48 280,70 320,58"
                  />

                  <circle cx="320" cy="58" r="5" fill="#2563eb" />
                </svg>
              </div>

              <div style={chartBottomStyle}>
                <div>
                  <div style={chartValueLabelStyle}>今月稼働</div>
                  <div style={chartValueStyle}>ACTIVE</div>
                </div>
                <div style={chartBadgeStyle}>LIVE</div>
              </div>
            </div>
          </div>
        </section>

        <section style={statsGridStyle} className="attendance-stats-grid">
          <StatCard label="打刻管理" value="CLOCK" />
          <StatCard label="月次集計" value="SUMMARY" />
          <StatCard label="給与確認" value="PAYROLL" />
          <StatCard label="帳票出力" value="EXPORT" />
        </section>

        <section style={menuSectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionMiniStyle}>ATTENDANCE MENU</div>
              <h2 style={sectionTitleStyle}>機能メニュー</h2>
            </div>

            <div style={sectionBadgeStyle}>4 MODULES</div>
          </div>

          <div style={menuGridStyle} className="attendance-menu-grid">
            {menuCards.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={menuCardStyle}
                className="attendance-menu-card"
              >
                <div style={menuTopStyle}>
                  <span style={menuStatStyle}>{item.stat}</span>
                  <span style={arrowStyle}>↗</span>
                </div>

                <div style={menuTitleStyle}>{item.title}</div>
                <div style={menuSubStyle}>{item.sub}</div>
                <p style={menuDescStyle}>{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={statCardStyle} className="attendance-stat-card">
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, #eef4ff 0%, #f8fbff 30%, #f3f7ff 65%, #eef2ff 100%)",
  padding: "24px 16px 60px",
};

const bgGlowTop: CSSProperties = {
  position: "absolute",
  top: -120,
  left: "50%",
  transform: "translateX(-50%)",
  width: 500,
  height: 260,
  background:
    "radial-gradient(circle, rgba(147,197,253,0.25) 0%, rgba(147,197,253,0.05) 40%, transparent 70%)",
  pointerEvents: "none",
  filter: "blur(12px)",
};

const bgGlowLeft: CSSProperties = {
  position: "absolute",
  top: 120,
  left: -120,
  width: 320,
  height: 320,
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(196,181,253,0.20) 0%, rgba(196,181,253,0) 70%)",
  pointerEvents: "none",
  filter: "blur(10px)",
};

const bgGlowRight: CSSProperties = {
  position: "absolute",
  right: -120,
  bottom: 80,
  width: 340,
  height: 340,
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(203,213,225,0.25) 0%, rgba(203,213,225,0) 70%)",
  pointerEvents: "none",
  filter: "blur(20px)",
};

const noiseStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "radial-gradient(rgba(15,23,42,0.03) 1px, transparent 1px)",
  backgroundSize: "16px 16px",
  opacity: 0.2,
  pointerEvents: "none",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 1280,
  margin: "0 auto",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  color: "rgba(30,41,59,0.78)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
  minHeight: 40,
};

const topIconsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const topDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "rgba(148,163,184,0.45)",
};

const heroCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
  gap: 18,
  padding: 18,
  borderRadius: 30,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.75)",
  boxShadow: "0 18px 40px rgba(148,163,184,0.14)",
};

const heroLeftStyle: CSSProperties = {
  borderRadius: 24,
  padding: "26px 24px",
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.85)",
  minHeight: 300,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const miniLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(30,41,59,0.48)",
  marginBottom: 10,
  fontWeight: 700,
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 5vw, 58px)",
  lineHeight: 1.04,
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.03em",
};

const heroSubStyle: CSSProperties = {
  marginTop: 18,
  marginBottom: 0,
  fontSize: 15,
  lineHeight: 1.9,
  color: "rgba(15,23,42,0.68)",
};

const heroButtonRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 24,
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 50,
  padding: "0 18px",
  borderRadius: 14,
  background: "linear-gradient(135deg, #2563eb, #60a5fa)",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14,
  boxShadow: "0 12px 28px rgba(37,99,235,0.22)",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 50,
  padding: "0 18px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(203,213,225,0.95)",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
};

const heroRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
};

const chartCardStyle: CSSProperties = {
  width: "100%",
  borderRadius: 24,
  padding: "22px 20px",
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.85)",
  minHeight: 300,
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 14px 34px rgba(148,163,184,0.12)",
};

const chartTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "rgba(30,41,59,0.52)",
  marginBottom: 16,
};

const chartWrapStyle: CSSProperties = {
  flex: 1,
  minHeight: 160,
  borderRadius: 18,
  padding: 12,
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const chartBottomStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 16,
  gap: 12,
  flexWrap: "wrap",
};

const chartValueLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(15,23,42,0.45)",
  marginBottom: 4,
};

const chartValueStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: "#0f172a",
};

const chartBadgeStyle: CSSProperties = {
  minHeight: 30,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 12px",
  borderRadius: 999,
  background: "rgba(37,99,235,0.10)",
  border: "1px solid rgba(37,99,235,0.18)",
  color: "#2563eb",
  fontSize: 12,
  fontWeight: 800,
};

const statsGridStyle: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
};

const statCardStyle: CSSProperties = {
  borderRadius: 20,
  padding: "16px 18px",
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.85)",
  boxShadow: "0 10px 25px rgba(148,163,184,0.12)",
};

const statLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(15,23,42,0.46)",
  marginBottom: 8,
  fontWeight: 700,
};

const statValueStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const menuSectionStyle: CSSProperties = {
  marginTop: 18,
  borderRadius: 30,
  padding: 18,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.75)",
  boxShadow: "0 18px 40px rgba(148,163,184,0.14)",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 16,
};

const sectionMiniStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.22em",
  color: "rgba(30,41,59,0.42)",
  marginBottom: 6,
  fontWeight: 700,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 800,
};

const sectionBadgeStyle: CSSProperties = {
  minHeight: 34,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 14px",
  borderRadius: 999,
  background: "rgba(37,99,235,0.08)",
  border: "1px solid rgba(37,99,235,0.14)",
  color: "#2563eb",
  fontSize: 12,
  fontWeight: 800,
};

const menuGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const menuCardStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  borderRadius: 24,
  padding: "18px 18px 16px",
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.85)",
  boxShadow: "0 10px 30px rgba(148,163,184,0.12)",
};

const menuTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const menuStatStyle: CSSProperties = {
  minHeight: 28,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 10px",
  borderRadius: 999,
  background: "rgba(37,99,235,0.10)",
  border: "1px solid rgba(37,99,235,0.16)",
  color: "#2563eb",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const arrowStyle: CSSProperties = {
  fontSize: 18,
  color: "rgba(15,23,42,0.55)",
  fontWeight: 700,
};

const menuTitleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 6,
};

const menuSubStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#2563eb",
  marginBottom: 10,
};

const menuDescStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.8,
  color: "#475569",
};

const responsiveStyle = `
.attendance-hero-grid,
.attendance-stats-grid,
.attendance-menu-grid,
.attendance-button-row {
  width: 100%;
}

@media (max-width: 1024px) {
  .attendance-hero-grid {
    grid-template-columns: 1fr !important;
  }

  .attendance-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .attendance-menu-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 640px) {
  .attendance-pc-break {
    display: none;
  }

  .attendance-hero-grid {
    gap: 14px !important;
    padding: 14px !important;
    border-radius: 22px !important;
  }

  .attendance-hero-left {
    min-height: auto !important;
    padding: 22px 18px !important;
    border-radius: 20px !important;
  }

  .attendance-button-row {
    flex-direction: column !important;
    gap: 10px !important;
  }

  .attendance-main-button,
  .attendance-sub-button {
    width: 100% !important;
    min-height: 52px !important;
    border-radius: 14px !important;
  }

  .attendance-stats-grid {
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  .attendance-stat-card {
    padding: 15px 16px !important;
    border-radius: 18px !important;
  }

  .attendance-menu-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  .attendance-menu-card {
    padding: 16px !important;
    border-radius: 20px !important;
  }
}
`;