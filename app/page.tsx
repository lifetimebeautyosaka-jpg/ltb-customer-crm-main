"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="page">

      {/* 背景 */}
      <div className="bg" />

      <div className="wrap">

        {/* ===== HEADER ===== */}
        <header className="header">
          <img src="/logo.png" className="logo" />

          <div className="nav">
            <Link href="/login">Login</Link>
            <Link href="/mypage" className="btn">My Page</Link>
          </div>
        </header>

        {/* ===== HERO ===== */}
        <section className="hero">

          <div className="left">

            <h1 className="title">
              GYMUP CRM
            </h1>

            <div className="line" />

            <p className="desc">
              Premium CRM for Gym / Pilates / Stretch
              <br />
              Clean. Fast. Beautiful.
            </p>

            <div className="cta">
              <Link href="/reservation" className="primary">
                Open Dashboard
              </Link>
              <Link href="/login" className="ghost">
                Member Login
              </Link>
            </div>

          </div>

          {/* ===== DASHBOARD MOCK ===== */}
          <div className="right">

            <div className="glass">

              <div className="card big">
                <div className="shineBar" />
                Dashboard Overview
              </div>

              <div className="row">
                <div className="card">Customers</div>
                <div className="card">Reservations</div>
                <div className="card">Sales</div>
              </div>

              <div className="card chart" />

            </div>

          </div>

        </section>

      </div>

      {/* ===== STYLE ===== */}
      <style jsx>{`

        .page {
          min-height: 100vh;
          background: #05070b;
          color: white;
        }

        .bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(255,140,0,0.15), transparent 40%),
            radial-gradient(circle at 80% 30%, rgba(0,120,255,0.1), transparent 40%);
          filter: blur(60px);
        }

        .wrap {
          position: relative;
          max-width: 1200px;
          margin: auto;
          padding: 24px;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          width: 120px;
        }

        .nav {
          display: flex;
          gap: 12px;
        }

        .btn {
          background: white;
          color: black;
          padding: 8px 14px;
          border-radius: 999px;
        }

        /* HERO */
        .hero {
          display: grid;
          gap: 40px;
          margin-top: 60px;
        }

        .title {
          font-size: clamp(40px, 6vw, 70px);
          font-weight: 800;
          letter-spacing: -2px;
        }

        .line {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #ff9a00, transparent);
          margin: 20px 0;
        }

        .desc {
          color: #aaa;
          line-height: 1.6;
        }

        .cta {
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

        .ghost {
          border: 1px solid rgba(255,255,255,0.2);
          padding: 12px 18px;
          border-radius: 999px;
        }

        /* RIGHT */
        .glass {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          padding: 20px;
          border-radius: 20px;
        }

        .card {
          background: rgba(255,255,255,0.04);
          padding: 16px;
          border-radius: 12px;
        }

        .big {
          height: 120px;
          position: relative;
        }

        .row {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .chart {
          height: 100px;
          margin-top: 10px;
        }

        /* キラッ（控えめ） */
        .shineBar {
          position: absolute;
          top: 0;
          left: -50%;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg);
          animation: shine 4s infinite;
        }

        @keyframes shine {
          0% { left:-50% }
          100% { left:150% }
        }

        /* PC */
        @media(min-width:900px){
          .hero {
            grid-template-columns: 1fr 1fr;
            align-items: center;
          }
        }

      `}</style>
    </main>
  );
}