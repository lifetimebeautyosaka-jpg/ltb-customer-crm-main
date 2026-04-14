"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="page">

      <div className="bg" />

      <div className="container">

        {/* HEADER */}
        <header className="header">
          <img src="/logo.png" className="logo" />

          <div className="nav">
            <Link href="/login">Login</Link>
            <Link href="/mypage" className="btn">
              My Page
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="hero">

          <div className="left">

            <h1 className="title">
              GYMUP CRM
            </h1>

            <p className="desc">
              Premium Gym Management Platform
            </p>

            <div className="cta">
              <Link href="/reservation" className="primary">
                Dashboard
              </Link>
              <Link href="/login" className="ghost">
                Member Login
              </Link>
            </div>

          </div>

          {/* DASHBOARD */}
          <div className="right">

            <div className="dashboard">

              <div className="topCard">
                <div className="shine" />
                <div className="topText">
                  Optimize Your Metrics
                </div>
              </div>

              <div className="grid3">
                <div className="mini">Customers</div>
                <div className="mini">Reservations</div>
                <div className="mini">Sales</div>
              </div>

              <div className="chart" />

            </div>

          </div>

        </section>

      </div>

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
            radial-gradient(circle at 20% 20%, rgba(255,140,0,0.2), transparent 40%),
            radial-gradient(circle at 80% 30%, rgba(0,120,255,0.15), transparent 40%);
          filter: blur(80px);
        }

        .container {
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
          margin-top: 80px;
        }

        .title {
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 700;
          letter-spacing: -1px;
        }

        .desc {
          color: #aaa;
          margin-top: 10px;
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

        /* DASHBOARD */
        .dashboard {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          padding: 20px;
          border-radius: 20px;
        }

        .topCard {
          position: relative;
          height: 120px;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 16px;
        }

        .topText {
          z-index: 2;
        }

        /* 控えめキラ */
        .shine {
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
          0% { left: -50% }
          100% { left: 150% }
        }

        .grid3 {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .mini {
          background: rgba(255,255,255,0.04);
          padding: 14px;
          border-radius: 12px;
        }

        .chart {
          height: 100px;
          margin-top: 10px;
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
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