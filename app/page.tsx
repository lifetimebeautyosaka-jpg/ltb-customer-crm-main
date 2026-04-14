import Link from "next/link";

const menuItems = [
  { href: "/customer", title: "顧客管理", sub: "Customer Management" },
  { href: "/reservation", title: "予約管理", sub: "Reservation Management" },
  { href: "/sales", title: "売上管理", sub: "Sales Management" },
  { href: "/attendance", title: "出退勤管理", sub: "Attendance Management" },
  { href: "/training", title: "トレーニング", sub: "Training" },
  { href: "/accounting", title: "会計管理", sub: "Accounting" },
  { href: "/subscription", title: "オンライン入会", sub: "Online Enrollment" },
  { href: "/account", title: "入会申請一覧", sub: "Applications" },
];

export default function HomePage() {
  return (
    <main className="page">
      <div className="bgMesh" />
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      <div className="container">
        <header className="topbar">
          <div className="brand">
            <div className="brandLogo">GYMUP</div>
            <div className="brandMeta">Premium Gym Management System</div>
          </div>

          <div className="topActions">
            <Link href="/login" className="ghostBtn">
              会員ログイン
            </Link>
            <Link href="/mypage" className="solidBtn">
              会員ページ
            </Link>
          </div>
        </header>

        <section className="hero">
          <div className="heroLeft">
            <div className="eyebrow">PREMIUM CRM FOR GYM / PILATES / STRETCH</div>

            <h1 className="title">
              GYMUP
              <br />
              CRM
            </h1>

            <p className="desc">
              パーソナルジム・ピラティス・ストレッチ運営を、
              <br className="pcOnly" />
              上質なUIで美しく一元管理するプレミアムCRM。
            </p>

            <div className="heroButtons">
              <Link href="/reservation" className="heroPrimary">
                管理画面へ
              </Link>
              <Link href="/login" className="heroSecondary">
                会員ログイン
              </Link>
            </div>

            <div className="stats">
              <div className="statCard">
                <div className="statLabel">Core</div>
                <div className="statValue">予約・顧客</div>
                <div className="statSub">日々の運営をひとつに集約</div>
              </div>

              <div className="statCard">
                <div className="statLabel">Subscription</div>
                <div className="statValue">サブスク管理</div>
                <div className="statSub">継続・残回数・入会導線</div>
              </div>
            </div>
          </div>

          <div className="heroRight">
            <div className="dashboardGlass">
              <div className="dashboardSidebar">
                <div className="sideDot active" />
                <div className="sideDot" />
                <div className="sideDot" />
                <div className="sideDot" />
                <div className="sideDot" />
              </div>

              <div className="dashboardMain">
                <div className="dashHeader">
                  <div>
                    <div className="dashTitle">GYMUP Dashboard</div>
                    <div className="dashSub">Elegant operation overview</div>
                  </div>
                  <div className="dashActions">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className="dashHero">
                  <div className="dashHeroText">
                    <div className="dashMini">Management Overview</div>
                    <h3>Optimize Your Gym Operations</h3>
                    <p>予約・売上・会員・継続状況を上質なUIで管理</p>
                    <Link href="/reservation" className="miniBtn">
                      Open Dashboard
                    </Link>
                  </div>

                  <div className="dashGlowCard">
                    <div className="glowFigure" />
                  </div>
                </div>

                <div className="metricGrid">
                  <div className="metricCard orange">
                    <div className="metricLabel">Customers</div>
                    <div className="metricValue">268</div>
                    <div className="metricSub">active members</div>
                  </div>
                  <div className="metricCard blue">
                    <div className="metricLabel">Reservations</div>
                    <div className="metricValue">124</div>
                    <div className="metricSub">this month</div>
                  </div>
                  <div className="metricCard dark">
                    <div className="metricLabel">Sales</div>
                    <div className="metricValue">¥586k</div>
                    <div className="metricSub">monthly total</div>
                  </div>
                </div>

                <div className="bottomPanels">
                  <div className="chartPanel">
                    <div className="panelTitle">Activity</div>
                    <div className="fakeChart">
                      <span className="line line1" />
                      <span className="line line2" />
                    </div>
                  </div>

                  <div className="infoPanel">
                    <div className="panelTitle">Status</div>
                    <div className="infoRows">
                      <div className="infoRow">
                        <span>Online Enrollment</span>
                        <strong>Ready</strong>
                      </div>
                      <div className="infoRow">
                        <span>Member Login</span>
                        <strong>Active</strong>
                      </div>
                      <div className="infoRow">
                        <span>Stripe</span>
                        <strong>Connected</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="menuSection">
          <div className="sectionHead">
            <div>
              <div className="sectionLabel">MAIN MENU</div>
              <h2>管理メニュー</h2>
            </div>
          </div>

          <div className="menuGrid">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className="menuCard">
                <div className="menuSub">{item.sub}</div>
                <div className="menuRow">
                  <div className="menuTitle">{item.title}</div>
                  <div className="menuArrow">→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 20% 15%, rgba(68, 100, 255, 0.08), transparent 24%),
            radial-gradient(circle at 78% 18%, rgba(255, 120, 40, 0.08), transparent 24%),
            linear-gradient(180deg, #04060a 0%, #0a0f18 52%, #05070b 100%);
          color: #f8fafc;
          font-family:
            -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP",
            sans-serif;
        }

        .bgMesh {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 42px 42px;
          opacity: 0.22;
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(50px);
          pointer-events: none;
          opacity: 0.7;
        }

        .orb1 {
          width: 280px;
          height: 280px;
          left: -80px;
          top: 120px;
          background: radial-gradient(circle, rgba(255,120,40,0.28), rgba(255,120,40,0));
        }

        .orb2 {
          width: 320px;
          height: 320px;
          right: -90px;
          top: 80px;
          background: radial-gradient(circle, rgba(78,118,255,0.25), rgba(78,118,255,0));
        }

        .orb3 {
          width: 260px;
          height: 260px;
          right: 10%;
          bottom: 10%;
          background: radial-gradient(circle, rgba(255,145,77,0.16), rgba(255,145,77,0));
        }

        .container {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 18px 70px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .brandLogo {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: #f8fafc;
          text-shadow: 0 0 22px rgba(255,255,255,0.08);
        }

        .brandMeta {
          margin-top: 4px;
          font-size: 12px;
          color: #94a3b8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .topActions {
          display: none;
          gap: 12px;
        }

        .ghostBtn,
        .solidBtn,
        .heroPrimary,
        .heroSecondary,
        .miniBtn {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease;
        }

        .ghostBtn:hover,
        .solidBtn:hover,
        .heroPrimary:hover,
        .heroSecondary:hover,
        .miniBtn:hover,
        .menuCard:hover {
          transform: translateY(-2px);
        }

        .ghostBtn {
          min-width: 132px;
          padding: 12px 16px;
          border-radius: 999px;
          color: #e5e7eb;
          font-size: 14px;
          font-weight: 700;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .solidBtn {
          min-width: 132px;
          padding: 12px 16px;
          border-radius: 999px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
          background: linear-gradient(180deg, #f8fafc 0%, #dbe4f3 100%);
          box-shadow: 0 10px 30px rgba(255,255,255,0.08);
        }

        .hero {
          display: block;
        }

        .heroLeft {
          margin-bottom: 28px;
        }

        .eyebrow {
          font-size: 11px;
          letter-spacing: 0.22em;
          color: #9ca3af;
          margin-bottom: 18px;
        }

        .title {
          margin: 0;
          font-size: clamp(58px, 18vw, 108px);
          line-height: 0.9;
          letter-spacing: -0.08em;
          font-weight: 900;
          color: #f8fafc;
          text-shadow: 0 0 26px rgba(255,255,255,0.08);
        }

        .desc {
          margin-top: 22px;
          margin-bottom: 0;
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.9;
          max-width: 620px;
        }

        .heroButtons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 24px;
        }

        .heroPrimary {
          min-width: 150px;
          padding: 14px 18px;
          border-radius: 999px;
          background: linear-gradient(180deg, #f8fafc 0%, #dbe4f3 100%);
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 14px 34px rgba(255,255,255,0.08);
        }

        .heroSecondary {
          min-width: 150px;
          padding: 14px 18px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #f8fafc;
          font-size: 14px;
          font-weight: 800;
        }

        .stats {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-top: 22px;
        }

        .statCard {
          border-radius: 24px;
          padding: 18px 18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.035) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.28);
        }

        .statLabel {
          font-size: 11px;
          color: #94a3b8;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .statValue {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #f8fafc;
        }

        .statSub {
          margin-top: 6px;
          font-size: 13px;
          color: #cbd5e1;
        }

        .heroRight {
          margin-top: 28px;
        }

        .dashboardGlass {
          position: relative;
          overflow: hidden;
          border-radius: 34px;
          background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            0 40px 80px rgba(0,0,0,0.38),
            inset 0 1px 0 rgba(255,255,255,0.04);
          padding: 14px;
        }

        .dashboardGlass::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 22% 30%, rgba(255,134,61,0.12), transparent 28%),
            radial-gradient(circle at 78% 24%, rgba(92,134,255,0.11), transparent 26%);
          pointer-events: none;
        }

        .dashboardSidebar {
          display: none;
        }

        .dashboardMain {
          position: relative;
          z-index: 1;
          border-radius: 26px;
          padding: 16px;
          background: rgba(9, 13, 21, 0.52);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .dashHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .dashTitle {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .dashSub {
          margin-top: 4px;
          font-size: 12px;
          color: #94a3b8;
        }

        .dashActions {
          display: flex;
          gap: 6px;
        }

        .dashActions span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.35);
        }

        .dashHero {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .dashHeroText {
          border-radius: 24px;
          padding: 18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .dashMini {
          font-size: 11px;
          color: #94a3b8;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .dashHeroText h3 {
          margin: 0;
          font-size: 28px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -0.05em;
        }

        .dashHeroText p {
          margin-top: 12px;
          margin-bottom: 0;
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.8;
        }

        .miniBtn {
          margin-top: 16px;
          width: 152px;
          padding: 12px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          color: #0f172a;
          font-size: 13px;
          font-weight: 800;
        }

        .dashGlowCard {
          min-height: 220px;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 25%, rgba(255,136,56,0.24), transparent 36%),
            linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .glowFigure {
          position: absolute;
          inset: 18px;
          border-radius: 22px;
          background:
            radial-gradient(circle at 50% 30%, rgba(255,140,64,0.9) 0%, rgba(255,140,64,0.34) 18%, rgba(255,140,64,0) 34%),
            radial-gradient(circle at 50% 70%, rgba(255,140,64,0.55) 0%, rgba(255,140,64,0.16) 24%, rgba(255,140,64,0) 40%),
            radial-gradient(circle at 50% 44%, rgba(255,255,255,0.2), rgba(255,255,255,0) 34%);
          filter: blur(2px);
          opacity: 0.95;
        }

        .metricGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 14px;
        }

        .metricCard {
          border-radius: 20px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .metricCard.orange {
          background: linear-gradient(135deg, rgba(255,133,51,0.24) 0%, rgba(255,133,51,0.08) 100%);
        }

        .metricCard.blue {
          background: linear-gradient(135deg, rgba(84,122,255,0.18) 0%, rgba(84,122,255,0.07) 100%);
        }

        .metricCard.dark {
          background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%);
        }

        .metricLabel {
          font-size: 11px;
          color: #cbd5e1;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .metricValue {
          margin-top: 8px;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.05em;
        }

        .metricSub {
          margin-top: 4px;
          font-size: 13px;
          color: #cbd5e1;
        }

        .bottomPanels {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 14px;
        }

        .chartPanel,
        .infoPanel {
          border-radius: 22px;
          padding: 16px;
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .panelTitle {
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 12px;
        }

        .fakeChart {
          position: relative;
          height: 110px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          overflow: hidden;
        }

        .line {
          position: absolute;
          left: 8%;
          right: 8%;
          height: 2px;
          border-radius: 999px;
          transform-origin: left center;
        }

        .line1 {
          top: 48px;
          background: linear-gradient(90deg, #ff9a54 0%, #ffd56b 100%);
          transform: skewY(-10deg);
          box-shadow: 0 0 12px rgba(255,154,84,0.45);
        }

        .line2 {
          top: 72px;
          background: linear-gradient(90deg, #6e8dff 0%, #b3c3ff 100%);
          transform: skewY(8deg);
          box-shadow: 0 0 12px rgba(110,141,255,0.35);
        }

        .infoRows {
          display: grid;
          gap: 10px;
        }

        .infoRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 14px;
          color: #cbd5e1;
        }

        .infoRow strong {
          color: #f8fafc;
          font-weight: 800;
        }

        .menuSection {
          margin-top: 28px;
        }

        .sectionLabel {
          font-size: 11px;
          letter-spacing: 0.18em;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .sectionHead h2 {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .menuGrid {
          display: grid;
          gap: 16px;
          margin-top: 16px;
        }

        .menuCard {
          display: block;
          text-decoration: none;
          color: #fff;
          border-radius: 28px;
          padding: 18px 20px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.035) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 20px 38px rgba(0,0,0,0.24);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .menuSub {
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .menuRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .menuTitle {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.2;
        }

        .menuArrow {
          font-size: 18px;
          color: #64748b;
          flex-shrink: 0;
        }

        .pcOnly {
          display: none;
        }

        @media (min-width: 900px) {
          .container {
            padding: 30px 28px 90px;
          }

          .topActions {
            display: flex;
          }

          .topbar {
            margin-bottom: 34px;
          }

          .brandLogo {
            font-size: 30px;
          }

          .hero {
            display: grid;
            grid-template-columns: minmax(0, 0.92fr) minmax(520px, 1.08fr);
            gap: 34px;
            align-items: center;
            min-height: 680px;
          }

          .heroLeft {
            margin-bottom: 0;
            padding: 30px 0;
          }

          .title {
            font-size: clamp(96px, 10vw, 148px);
          }

          .desc {
            font-size: 17px;
            max-width: 600px;
          }

          .heroButtons {
            margin-top: 28px;
          }

          .heroPrimary,
          .heroSecondary {
            min-width: 180px;
            padding: 16px 22px;
            font-size: 15px;
          }

          .stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            max-width: 620px;
            margin-top: 28px;
          }

          .statCard {
            padding: 22px;
            border-radius: 26px;
          }

          .statValue {
            font-size: 26px;
          }

          .heroRight {
            margin-top: 0;
          }

          .dashboardGlass {
            padding: 18px;
            border-radius: 38px;
            min-height: 640px;
            display: grid;
            grid-template-columns: 72px minmax(0, 1fr);
            gap: 16px;
          }

          .dashboardSidebar {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            padding: 14px 0;
            border-radius: 26px;
            background: rgba(8, 12, 20, 0.5);
            border: 1px solid rgba(255,255,255,0.05);
          }

          .sideDot {
            width: 12px;
            height: 12px;
            border-radius: 999px;
            background: rgba(255,255,255,0.2);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
          }

          .sideDot.active {
            background: linear-gradient(180deg, #ff9b54 0%, #ff7d2c 100%);
            box-shadow: 0 0 16px rgba(255,125,44,0.45);
          }

          .dashboardMain {
            border-radius: 30px;
            padding: 22px;
          }

          .dashTitle {
            font-size: 22px;
          }

          .dashHero {
            grid-template-columns: 1.1fr 0.9fr;
            gap: 16px;
          }

          .dashHeroText {
            padding: 24px;
            border-radius: 26px;
            min-height: 240px;
          }

          .dashHeroText h3 {
            font-size: 44px;
            line-height: 1.04;
          }

          .dashHeroText p {
            font-size: 15px;
          }

          .dashGlowCard {
            min-height: 240px;
            border-radius: 26px;
          }

          .metricGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-top: 16px;
          }

          .metricCard {
            padding: 18px;
            min-height: 124px;
          }

          .metricValue {
            font-size: 34px;
          }

          .bottomPanels {
            grid-template-columns: 1.25fr 0.75fr;
            gap: 14px;
          }

          .chartPanel,
          .infoPanel {
            padding: 18px;
            border-radius: 24px;
          }

          .menuSection {
            margin-top: 42px;
          }

          .sectionHead {
            margin-bottom: 18px;
          }

          .sectionHead h2 {
            font-size: 32px;
          }

          .menuGrid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 18px;
            margin-top: 18px;
          }

          .menuCard {
            min-height: 168px;
            padding: 22px;
            border-radius: 30px;
          }

          .menuRow {
            min-height: 92px;
            align-items: flex-end;
          }

          .menuTitle {
            font-size: 30px;
          }

          .menuArrow {
            font-size: 20px;
          }

          .pcOnly {
            display: inline;
          }
        }

        @media (min-width: 1200px) {
          .hero {
            grid-template-columns: minmax(0, 0.88fr) minmax(620px, 1.12fr);
            gap: 44px;
          }

          .menuGrid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}