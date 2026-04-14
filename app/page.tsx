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
  { href: "/mypage", title: "会員マイページ", sub: "Member My Page" },
  { href: "/login", title: "会員ログイン", sub: "Member Login" },
];

export default function HomePage() {
  return (
    <main className="page">
      <div className="gridBg" />
      <div className="glow glow1" />
      <div className="glow glow2" />

      <div className="container">
        <section className="hero">
          <div className="heroLeft">
            <div className="logo">GYMUP</div>
            <div className="heroLabel">PREMIUM GYM MANAGEMENT SYSTEM</div>

            <h1 className="title">
              GYM UP
              <br />
              CRM
            </h1>

            <div className="goldLine" />

            <p className="desc">
              パーソナルジム・ピラティス・ストレッチ運営を
              <br className="pcOnly" />
              上質なUIで一元管理するCRM
            </p>

            <div className="buttonRow">
              <Link href="/reservation" className="primaryBtn">
                管理画面へ
              </Link>
              <Link href="/login" className="secondaryBtn">
                会員ログイン
              </Link>
            </div>
          </div>

          <div className="heroRight">
            <div className="featureCard large">
              <div className="featureLabel">Core</div>
              <div className="featureTitle">予約・顧客・売上を一元化</div>
              <div className="featureText">
                日々の運営に必要な管理を、見やすく、速く、上質に。
              </div>
            </div>

            <div className="featureGrid">
              <div className="featureCard small">
                <div className="featureLabel">Members</div>
                <div className="featureTitle">会員導線</div>
              </div>
              <div className="featureCard small">
                <div className="featureLabel">Subscription</div>
                <div className="featureTitle">サブスク管理</div>
              </div>
            </div>
          </div>
        </section>

        <section className="menuSection">
          <div className="sectionHead">
            <div className="sectionLabel">MAIN MENU</div>
            <h2 className="sectionTitle">管理メニュー</h2>
          </div>

          <div className="menuGrid">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className="menuCard">
                <div className="menuCardInner">
                  <div>
                    <div className="menuSub">{item.sub}</div>
                    <div className="menuTitle">{item.title}</div>
                  </div>
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
            radial-gradient(circle at top left, rgba(255,255,255,0.04) 0%, transparent 26%),
            linear-gradient(180deg, #05070b 0%, #0a0d14 44%, #05070b 100%);
          color: #fff;
          font-family:
            -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP",
            sans-serif;
        }

        .gridBg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 36px 36px;
          opacity: 0.28;
          pointer-events: none;
        }

        .glow {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(30px);
        }

        .glow1 {
          top: 120px;
          left: -80px;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(255,255,255,0.08), rgba(255,255,255,0));
        }

        .glow2 {
          right: -90px;
          bottom: 120px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(255,255,255,0.06), rgba(255,255,255,0));
        }

        .container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 40px 18px 64px;
        }

        .hero {
          display: block;
        }

        .heroLeft {
          margin-bottom: 28px;
        }

        .logo {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #f8fafc;
          text-shadow: 0 0 22px rgba(255,255,255,0.08);
          margin-bottom: 28px;
        }

        .heroLabel {
          font-size: 11px;
          letter-spacing: 0.22em;
          color: #9ca3af;
          margin-bottom: 22px;
        }

        .title {
          margin: 0;
          font-size: clamp(54px, 17vw, 92px);
          line-height: 0.92;
          font-weight: 900;
          letter-spacing: -0.07em;
          color: #f8fafc;
          text-shadow: 0 0 26px rgba(255,255,255,0.1);
        }

        .goldLine {
          width: 112px;
          height: 4px;
          border-radius: 999px;
          margin-top: 28px;
          background: linear-gradient(90deg, #d6b25e 0%, #f0d88e 100%);
          box-shadow: 0 0 14px rgba(214,178,94,0.28);
        }

        .desc {
          margin-top: 26px;
          margin-bottom: 0;
          color: #d1d5db;
          font-size: 15px;
          line-height: 1.95;
          font-weight: 500;
        }

        .buttonRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 24px;
        }

        .primaryBtn,
        .secondaryBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 148px;
          padding: 14px 18px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          transition: transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease;
        }

        .primaryBtn {
          background: #f3f4f6;
          color: #111827;
          box-shadow: 0 10px 24px rgba(255,255,255,0.08);
        }

        .secondaryBtn {
          background: rgba(255,255,255,0.05);
          color: #f9fafb;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .primaryBtn:hover,
        .secondaryBtn:hover,
        .menuCard:hover {
          transform: translateY(-2px);
        }

        .heroRight {
          display: none;
        }

        .featureCard {
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.035) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 16px 36px rgba(0,0,0,0.3);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .featureCard.large {
          padding: 28px;
          min-height: 220px;
        }

        .featureGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }

        .featureCard.small {
          padding: 22px;
          min-height: 136px;
        }

        .featureLabel {
          font-size: 11px;
          letter-spacing: 0.18em;
          color: #9ca3af;
          margin-bottom: 12px;
        }

        .featureTitle {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f8fafc;
          line-height: 1.35;
        }

        .featureText {
          margin-top: 12px;
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.8;
        }

        .menuSection {
          margin-top: 18px;
        }

        .sectionHead {
          margin-bottom: 14px;
        }

        .sectionLabel {
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #9ca3af;
          margin-bottom: 8px;
          padding-left: 4px;
        }

        .sectionTitle {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f8fafc;
        }

        .menuGrid {
          display: grid;
          gap: 16px;
        }

        .menuCard {
          display: block;
          text-decoration: none;
          color: #fff;
          border-radius: 28px;
          min-height: 112px;
          padding: 0 22px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.035) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 16px 36px rgba(0,0,0,0.3);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .menuCardInner {
          min-height: 112px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .menuSub {
          font-size: 11px;
          letter-spacing: 0.15em;
          color: #9ca3af;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .menuTitle {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f8fafc;
          line-height: 1.3;
        }

        .menuArrow {
          font-size: 18px;
          color: #6b7280;
          flex-shrink: 0;
        }

        .pcOnly {
          display: none;
        }

        @media (min-width: 900px) {
          .container {
            padding: 56px 28px 84px;
          }

          .hero {
            display: grid;
            grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.95fr);
            gap: 34px;
            align-items: end;
            min-height: 520px;
          }

          .heroLeft {
            margin-bottom: 0;
            padding: 22px 0 10px;
          }

          .logo {
            font-size: 28px;
            margin-bottom: 40px;
          }

          .heroLabel {
            margin-bottom: 26px;
          }

          .title {
            font-size: clamp(86px, 9vw, 138px);
            line-height: 0.9;
          }

          .desc {
            font-size: 17px;
            max-width: 620px;
          }

          .buttonRow {
            margin-top: 30px;
            gap: 14px;
          }

          .primaryBtn,
          .secondaryBtn {
            min-width: 180px;
            padding: 16px 22px;
            font-size: 15px;
          }

          .heroRight {
            display: block;
          }

          .menuSection {
            margin-top: 40px;
          }

          .sectionHead {
            display: flex;
            align-items: end;
            justify-content: space-between;
            margin-bottom: 18px;
          }

          .sectionTitle {
            font-size: 30px;
          }

          .menuGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
          }

          .menuCard {
            min-height: 180px;
            padding: 22px;
            border-radius: 30px;
          }

          .menuCardInner {
            min-height: 136px;
            height: 100%;
            align-items: flex-start;
            flex-direction: column;
            justify-content: space-between;
          }

          .menuSub {
            font-size: 12px;
            margin-bottom: 10px;
          }

          .menuTitle {
            font-size: 30px;
            line-height: 1.2;
          }

          .menuArrow {
            align-self: flex-end;
            font-size: 20px;
          }

          .pcOnly {
            display: inline;
          }
        }

        @media (min-width: 1200px) {
          .hero {
            grid-template-columns: minmax(0, 1.08fr) minmax(500px, 0.92fr);
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