"use client";

import Link from "next/link";

const menuItems = [
  { href: "/customer", title: "Customers", sub: "顧客管理" },
  { href: "/reservation", title: "Reservations", sub: "予約管理" },
  { href: "/sales", title: "Sales", sub: "売上管理" },
  { href: "/attendance", title: "Attendance", sub: "出退勤管理" },
  { href: "/training", title: "Training", sub: "トレーニング" },
  { href: "/accounting", title: "Accounting", sub: "会計管理" },
  { href: "/subscription", title: "Enrollment", sub: "オンライン入会" },
  { href: "/account", title: "Applications", sub: "申請一覧" },
];

export default function HomePage() {
  return (
    <main className="page">

      <div className="container">

        {/* ===== HEADER ===== */}
        <header className="header">
          <div className="logoWrap">
            <img src="/logo.png" className="logo" />
            <div>
              <div className="logoText shine">GYMUP</div>
              <div className="logoSub">CRM PLATFORM</div>
            </div>
          </div>

          <div className="actions">
            <Link href="/login" className="ghost">Login</Link>
            <Link href="/mypage" className="solid">My Page</Link>
          </div>
        </header>

        {/* ===== HERO ===== */}
        <section className="hero">

          <div className="heroLeft">
            <h1 className="title shineBig">
              GYMUP CRM
            </h1>

            <div className="goldLine" />

            <p className="desc">
              Premium CRM for Personal Gym, Pilates & Stretch.
              <br />
              Manage customers, reservations, sales and subscriptions
              in one elegant platform.
            </p>

            <div className="buttons">
              <Link href="/reservation" className="btnPrimary">
                Dashboard
              </Link>
              <Link href="/login" className="btnGhost">
                Member Login
              </Link>
            </div>

            {/* KPI風 */}
            <div className="stats">
              <div className="stat">
                <div className="statValue">268</div>
                <div className="statLabel">Customers</div>
              </div>
              <div className="stat">
                <div className="statValue">124</div>
                <div className="statLabel">Reservations</div>
              </div>
              <div className="stat">
                <div className="statValue">¥586k</div>
                <div className="statLabel">Sales</div>
              </div>
            </div>

          </div>

          {/* ===== 右側ダッシュボード ===== */}
          <div className="heroRight">
            <div className="dashboard">

              <div className="dashCard large">
                <div className="shineOverlay" />
                <h3>Optimize Your Gym</h3>
                <p>All-in-one management UI</p>
              </div>

              <div className="dashRow">
                <div className="dashCard small">Customers</div>
                <div className="dashCard small">Reservations</div>
                <div className="dashCard small">Sales</div>
              </div>

              <div className="dashCard chart">
                Activity Graph
              </div>

            </div>
          </div>

        </section>

        {/* ===== MENU GRID ===== */}
        <section className="menu">

          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="card">
              <div className="cardSub">{item.sub}</div>
              <div className="cardTitle shine">{item.title}</div>
            </Link>
          ))}

        </section>

      </div>

      {/* ===== STYLE ===== */}
      <style jsx>{`

        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #04060a, #0a0f18);
          color: white;
        }

        .container {
          max-width: 1300px;
          margin: auto;
          padding: 24px;
        }

        /* ===== HEADER ===== */
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }

        .logoWrap {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .logo {
          width: 36px;
        }

        .logoText {
          font-size: 14px;
          font-weight: 700;
        }

        .logoSub {
          font-size: 10px;
          opacity: 0.6;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .ghost {
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 999px;
          text-decoration: none;
        }

        .solid {
          padding: 10px 14px;
          border-radius: 999px;
          background: white;
          color: black;
          text-decoration: none;
        }

        /* ===== HERO ===== */
        .hero {
          display: grid;
          gap: 40px;
        }

        .title {
          font-size: clamp(36px, 6vw, 72px);
          font-weight: 800;
        }

        .desc {
          margin-top: 16px;
          color: #cbd5e1;
        }

        .goldLine {
          width: 60px;
          height: 2px;
          margin: 16px 0;
          background: linear-gradient(90deg, #c9a96e, transparent);
        }

        .buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btnPrimary {
          background: white;
          color: black;
          padding: 12px 18px;
          border-radius: 999px;
          text-decoration: none;
        }

        .btnGhost {
          border: 1px solid rgba(255,255,255,0.2);
          padding: 12px 18px;
          border-radius: 999px;
          text-decoration: none;
        }

        /* KPI */
        .stats {
          display: flex;
          gap: 20px;
          margin-top: 30px;
        }

        .statValue {
          font-size: 20px;
          font-weight: bold;
        }

        .statLabel {
          font-size: 12px;
          opacity: 0.6;
        }

        /* ===== DASHBOARD ===== */
        .dashboard {
          display: grid;
          gap: 12px;
        }

        .dashCard {
          padding: 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .large {
          height: 120px;
        }

        .dashRow {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .small {
          height: 80px;
        }

        .chart {
          height: 100px;
        }

        /* ===== MENU ===== */
        .menu {
          margin-top: 50px;
          display: grid;
          gap: 14px;
        }

        .card {
          padding: 18px;
          border-radius: 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          text-decoration: none;
        }

        .cardSub {
          font-size: 12px;
          opacity: 0.6;
        }

        .cardTitle {
          font-size: 22px;
          margin-top: 8px;
        }

        /* ===== SHINE ===== */
        .shine {
          background: linear-gradient(90deg, #fff, #aaa, #fff);
          -webkit-background-clip: text;
          color: transparent;
          animation: shine 3s linear infinite;
        }

        .shineBig {
          background: linear-gradient(90deg, #fff, #aaa, #fff);
          -webkit-background-clip: text;
          color: transparent;
          animation: shine 4s linear infinite;
        }

        @keyframes shine {
          0% { background-position: -100%; }
          100% { background-position: 200%; }
        }

        /* ===== PC ===== */
        @media (min-width: 900px) {

          .hero {
            grid-template-columns: 1fr 1fr;
            align-items: center;
          }

          .menu {
            grid-template-columns: repeat(4, 1fr);
          }

        }

      `}</style>

    </main>
  );
}