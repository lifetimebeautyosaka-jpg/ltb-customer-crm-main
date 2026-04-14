"use client";

import Link from "next/link";
import Image from "next/image";

const quickLinks = [
  { title: "顧客管理", href: "/customer", desc: "会員情報・来店履歴・進捗管理" },
  { title: "予約管理", href: "/reservation", desc: "日別確認・予約登録・導線整理" },
  { title: "売上管理", href: "/sales", desc: "日次売上・区分管理・集計確認" },
  { title: "勤怠管理", href: "/attendance", desc: "スタッフ打刻・集計・確認" },
  { title: "会計管理", href: "/accounting", desc: "前受金・会計区分・管理用集計" },
  { title: "サブスク管理", href: "/subscription", desc: "回数・契約状況・継続管理" },
];

const dashboardStats = [
  { label: "Today Reservations", value: "12" },
  { label: "Active Members", value: "248" },
  { label: "Monthly Sales", value: "¥1,284,000" },
];

const todayItems = [
  { time: "10:00", name: "田中 真奈", menu: "パーソナル" },
  { time: "11:30", name: "山本 由美", menu: "ピラティス" },
  { time: "14:00", name: "佐藤 恒一", menu: "ストレッチ" },
  { time: "16:30", name: "中村 彩", menu: "月4回プラン" },
];

const alerts = [
  "未処理の前受金 2件",
  "本日期限の回数券更新 3件",
  "未確認の売上登録 1件",
];

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.bgNoise} />

      <section style={styles.heroSection}>
        <div style={styles.heroGrid}>
          {/* Left */}
          <div style={styles.leftColumn}>
            <div style={styles.logoWrap}>
              <Image
                src="/logo.png"
                alt="GYMUP"
                width={220}
                height={72}
                style={styles.logo}
                priority
              />
            </div>

            <div style={styles.copyWrap}>
              <div style={styles.badge}>GYM / PILATES CRM</div>

              <h1 style={styles.title}>
                予約・顧客・売上を、
                <br />
                ひとつに整理する。
              </h1>

              <p style={styles.description}>
                GYMUP CRMは、ジム・ピラティス運営に必要な管理業務を、
                シンプルに集約するための運営プラットフォームです。
                見やすく、扱いやすく、現場で使いやすい設計に整えています。
              </p>

              <div style={styles.ctaRow}>
                <Link href="/customer" style={styles.primaryButton}>
                  管理画面へ入る
                </Link>
                <Link href="/login" style={styles.secondaryButton}>
                  会員ログイン
                </Link>
              </div>
            </div>

            <div style={styles.quickLinksCard}>
              <div style={styles.sectionLabel}>MAIN MENU</div>
              <div style={styles.quickLinksGrid}>
                {quickLinks.map((item) => (
                  <Link key={item.href} href={item.href} style={styles.quickLinkItem}>
                    <div style={styles.quickLinkTitle}>{item.title}</div>
                    <div style={styles.quickLinkDesc}>{item.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={styles.rightColumn}>
            <div style={styles.dashboardShell}>
              <div style={styles.dashboardTopBar}>
                <div style={styles.windowDots}>
                  <span style={styles.dot} />
                  <span style={styles.dot} />
                  <span style={styles.dot} />
                </div>
                <div style={styles.dashboardTopText}>Dashboard Preview</div>
              </div>

              <div style={styles.dashboardBody}>
                <div style={styles.statGrid}>
                  {dashboardStats.map((stat) => (
                    <div key={stat.label} style={styles.statCard}>
                      <div style={styles.statLabel}>{stat.label}</div>
                      <div style={styles.statValue}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div style={styles.panelGrid}>
                  <div style={styles.panelLarge}>
                    <div style={styles.panelHeader}>
                      <div style={styles.panelTitle}>Today Schedule</div>
                      <Link href="/reservation" style={styles.panelLink}>
                        予約管理へ
                      </Link>
                    </div>

                    <div style={styles.scheduleList}>
                      {todayItems.map((item) => (
                        <div key={`${item.time}-${item.name}`} style={styles.scheduleItem}>
                          <div style={styles.scheduleTime}>{item.time}</div>
                          <div style={styles.scheduleMain}>
                            <div style={styles.scheduleName}>{item.name}</div>
                            <div style={styles.scheduleMenu}>{item.menu}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.sideStack}>
                    <div style={styles.panelSmall}>
                      <div style={styles.panelTitle}>Operations</div>
                      <div style={styles.miniActionGrid}>
                        <Link href="/sales" style={styles.miniAction}>
                          売上確認
                        </Link>
                        <Link href="/attendance" style={styles.miniAction}>
                          勤怠確認
                        </Link>
                        <Link href="/accounting" style={styles.miniAction}>
                          会計確認
                        </Link>
                        <Link href="/subscription" style={styles.miniAction}>
                          契約確認
                        </Link>
                      </div>
                    </div>

                    <div style={styles.panelSmall}>
                      <div style={styles.panelTitle}>Alerts</div>
                      <div style={styles.alertList}>
                        {alerts.map((alert) => (
                          <div key={alert} style={styles.alertItem}>
                            <span style={styles.alertDot} />
                            <span>{alert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, #111315 0%, #17191c 45%, #121416 100%)",
    color: "#f3f4f6",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  bgNoise: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.04) 0, transparent 32%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.03) 0, transparent 28%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.025) 0, transparent 30%)",
  },

  heroSection: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 1440,
    margin: "0 auto",
    padding: "56px 24px 40px",
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 32,
    alignItems: "center",
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 28,
    minWidth: 0,
  },

  rightColumn: {
    minWidth: 0,
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    minHeight: 68,
  },

  logo: {
    width: "auto",
    height: "56px",
    objectFit: "contain",
  },

  copyWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 620,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },

  title: {
    margin: 0,
    fontSize: "clamp(34px, 5vw, 62px)",
    lineHeight: 1.06,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    color: "#ffffff",
  },

  description: {
    margin: 0,
    maxWidth: 560,
    fontSize: 16,
    lineHeight: 1.9,
    color: "rgba(255,255,255,0.68)",
  },

  ctaRow: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 8,
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    padding: "0 22px",
    borderRadius: 16,
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 15,
    color: "#111315",
    background: "#f08a27",
    boxShadow: "0 10px 30px rgba(240,138,39,0.22)",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    padding: "0 22px",
    borderRadius: 16,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
    color: "#f3f4f6",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },

  quickLinksCard: {
    borderRadius: 24,
    padding: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 35px rgba(0,0,0,0.22)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },

  sectionLabel: {
    fontSize: 12,
    letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.48)",
    marginBottom: 16,
  },

  quickLinksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  quickLinkItem: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    transition: "all 0.2s ease",
  },

  quickLinkTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 6,
  },

  quickLinkDesc: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.56)",
  },

  dashboardShell: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.34)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  },

  dashboardTopBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },

  windowDots: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
  },

  dashboardTopText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.56)",
    letterSpacing: "0.04em",
  },

  dashboardBody: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },

  statCard: {
    borderRadius: 20,
    padding: 18,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
  },

  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
    letterSpacing: "0.04em",
  },

  statValue: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#ffffff",
  },

  panelGrid: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 16,
  },

  panelLarge: {
    borderRadius: 24,
    padding: 18,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
  },

  sideStack: {
    display: "grid",
    gap: 16,
  },

  panelSmall: {
    borderRadius: 24,
    padding: 18,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
  },

  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },

  panelTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
  },

  panelLink: {
    fontSize: 13,
    color: "#f08a27",
    textDecoration: "none",
    fontWeight: 600,
  },

  scheduleList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  scheduleItem: {
    display: "grid",
    gridTemplateColumns: "76px 1fr",
    gap: 12,
    alignItems: "center",
    borderRadius: 16,
    padding: "14px 14px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  scheduleTime: {
    fontSize: 14,
    fontWeight: 700,
    color: "#f08a27",
  },

  scheduleMain: {
    minWidth: 0,
  },

  scheduleName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#ffffff",
    marginBottom: 4,
  },

  scheduleMenu: {
    fontSize: 12,
    color: "rgba(255,255,255,0.56)",
  },

  miniActionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 14,
  },

  miniAction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 14,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
    color: "#f3f4f6",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  alertList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 14,
  },

  alertItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.72)",
  },

  alertDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#f08a27",
    flexShrink: 0,
  },
};

// responsive
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @media (max-width: 1100px) {
      .__dummy__ {}
    }

    @media (max-width: 1080px) {
      main [style] {}
    }

    @media (max-width: 980px) {
      body {}
    }

    @media (max-width: 960px) {
      div {}
    }

    @media (max-width: 920px) {
      section {}
    }

    @media (max-width: 900px) {
      a {}
    }

    @media (max-width: 880px) {
      img {}
    }

    @media (max-width: 860px) {
      html {}
    }
  `;
  if (!document.getElementById("gymup-home-responsive-style")) {
    style.id = "gymup-home-responsive-style";
    document.head.appendChild(style);
  }
}