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
      <div className="bgMesh" />
      <div className="orb orb1" />
      <div className="orb orb2" />

      <div className="container">

        {/* ===== HEADER ===== */}
        <header className="header">
          <img src="/logo.png" className="logo" />

          <div className="actions">
            <Link href="/login" className="ghost">Login</Link>
            <Link href="/mypage" className="solid">My Page</Link>
          </div>
        </header>

        {/* ===== HERO ===== */}
        <section className="hero">

          <div className="left">
            <h1 className="title shine">
              GYMUP CRM
            </h1>

            <div className="goldLine" />

            <p className="desc">
              Premium CRM for Gym / Pilates / Stretch.
              <br />
              Customers, reservations, sales and subscriptions
              in one elegant system.
            </p>

            <div className="buttons">
              <Link href="/reservation" className="primary">
                Dashboard
              </Link>
              <Link href="/login" className="ghostBtn">
                Member Login
              </Link>
            </div>

            {/* KPI */}
            <div className="stats">
              <div>
                <div className="statValue">268</div>
                <div className="statLabel">Customers</div>
              </div>
              <div>
                <div className="statValue">124</div>
                <div className="statLabel">Reservations</div>
              </div>
              <div>
                <div className="statValue">¥586k</div>
                <div className="statLabel">Sales</div>
              </div>
            </div>
          </div>

          {/* ===== RIGHT DASHBOARD ===== */}
          <div className="right">

            <div className="panel large shineCard">
              <div className="panelTitle">Optimize Your Gym</div>
              <div className="panelSub">All-in-one management UI</div>
            </div>

            <div className="row">
              <div className="panel small shineCard">Customers</div>
              <div className="panel small shineCard">Reservations</div>
              <div className="panel small shineCard">Sales</div>
            </div>

            <div className="panel chart shineCard">
              Activity
            </div>

          </div>

        </section>

        {/* ===== MENU ===== */}
        <section className="menu">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="card shineCard">
              <div className="sub">{item.sub}</div>
              <div className="title2 shine">{item.title}</div>
            </Link>
          ))}
        </section>

      </div>

      <style jsx>{`

        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #03050a, #0a0f18);
          color: white;
          overflow: hidden;
        }

        .container {
          max-width: 1300px;
          margin: auto;
          padding: 24px;
        }

        /* 背景 */
        .bgMesh {
          position: absolute;
          inset: 0;
          background-size: 40px 40px;
          opacity: 0.1;
        }

        .orb {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          filter: blur(60px);
        }

        .orb1 {
          background: orange;
          top: 100px;
          left: -80px;
          opacity: 0.15;
        }

        .orb2 {
          background: blue;
          right: -80px;
          top: 60px;
          opacity: 0.15;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .logo {
          width: 120px;
          filter: drop-shadow(0 0 10px rgba(255,140,0,0.3));
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .solid {
          background: white;
          color: black;
          padding: 10px 16px;
          border-radius: 999px;
        }

        .ghost {
          border: 1px solid rgba(255,255,255,0.2);
          padding: 10px 16px;
          border-radius: 999px;
        }

        /* HERO */
        .hero {
          display: grid;
          gap: 40px;
        }

        .title {
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 800;
        }

        .goldLine {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, gold, transparent);
          margin: 16px 0;
        }

        .desc {
          color: #cbd5e1;
        }

        .buttons {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }

        .primary {
          background: white;
          color: black;
          padding: 12px 18px;
          border-radius: 999px;
        }

        .ghostBtn {
          border: 1px solid rgba(255,255,255,0.2);
          padding: 12px 18px;
          border-radius: 999px;
        }

        /* KPI */
        .stats {
          display: flex;
          gap: 20px;
          margin-top: 30px;
        }

        .statValue {
          font-weight: bold;
          font-size: 18px;
        }

        .statLabel {
          font-size: 12px;
          opacity: 0.6;
        }

        /* RIGHT */
        .right {
          display: grid;
          gap: 12px;
        }

        .panel {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 16px;
        }

        .large { height: 120px; }
        .small { height: 80px; }
        .chart { height: 100px; }

        .row {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
        }

        /* MENU */
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
        }

        .sub {
          font-size: 12px;
          opacity: 0.6;
        }

        .title2 {
          font-size: 22px;
          margin-top: 8px;
        }

        /* キラッ */
        .shine {
          background: linear-gradient(90deg, #fff, #aaa, #fff);
          -webkit-background-clip: text;
          color: transparent;
          animation: shine 4s infinite;
        }

        .shineCard::after {
          content: "";
          position: absolute;
          top: -100%;
          left: -50%;
          width: 40%;
          height: 300%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: rotate(25deg);
          animation: shineMove 5s infinite;
        }

        @keyframes shine {
          0% {background-position:-100%}
          100% {background-position:200%}
        }

        @keyframes shineMove {
          0% {left:-50%}
          100% {left:150%}
        }

        /* PC */
        @media(min-width:900px){
          .hero {
            grid-template-columns: 1fr 1fr;
            align-items: center;
          }

          .menu {
            grid-template-columns: repeat(4,1fr);
          }
        }

      `}</style>
    </main>
  );
}