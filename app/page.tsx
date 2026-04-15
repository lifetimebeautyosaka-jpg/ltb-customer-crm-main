"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMemberLogin = async () => {
    if (!memberId || !password) {
      alert("会員IDとパスワードを入力してください");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      localStorage.setItem("gymup_member_logged_in", "true");
      localStorage.setItem("gymup_member_id", memberId);
      localStorage.removeItem("gymup_staff_logged_in");
      router.push("/mypage");
    }, 700);
  };

  const handleStaffEnter = () => {
    localStorage.setItem("gymup_staff_logged_in", "true");
    localStorage.removeItem("gymup_member_logged_in");
    localStorage.removeItem("gymup_member_id");
    router.push("/dashboard");
  };

  return (
    <>
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 18% 72%, rgba(255, 132, 92, 0.42) 0%, rgba(255, 132, 92, 0.12) 16%, transparent 38%),
            radial-gradient(circle at 78% 26%, rgba(96, 132, 255, 0.42) 0%, rgba(96, 132, 255, 0.12) 16%, transparent 34%),
            radial-gradient(circle at 82% 78%, rgba(255, 132, 92, 0.26) 0%, rgba(255, 132, 92, 0.08) 16%, transparent 30%),
            linear-gradient(180deg, #05070d 0%, #090d18 48%, #05070d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 16px;
        }

        .login-page::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03), transparent 42%);
          pointer-events: none;
        }

        .login-shell {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1180px;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 28px;
          align-items: center;
        }

        .brand-panel {
          min-height: 720px;
          border-radius: 36px;
          padding: 38px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%);
          box-shadow:
            0 30px 80px rgba(0,0,0,0.42),
            inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .brand-panel::before {
          content: "";
          position: absolute;
          top: -120px;
          left: -80px;
          width: 320px;
          height: 320px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(95,126,255,0.25) 0%, rgba(95,126,255,0.08) 34%, transparent 68%);
          filter: blur(6px);
        }

        .brand-panel::after {
          content: "";
          position: absolute;
          right: -100px;
          bottom: -120px;
          width: 340px;
          height: 340px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,128,88,0.28) 0%, rgba(255,128,88,0.08) 36%, transparent 70%);
          filter: blur(6px);
        }

        .brand-content {
          position: relative;
          z-index: 1;
        }

        .portal-badge {
          display: inline-flex;
          align-items: center;
          min-height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.74);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          margin-bottom: 22px;
        }

        .brand-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(42px, 6vw, 74px);
          line-height: 0.98;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .brand-subtitle {
          margin: 18px 0 0;
          max-width: 560px;
          color: rgba(255,255,255,0.70);
          font-size: 16px;
          line-height: 1.9;
          font-weight: 500;
        }

        .brand-card {
          position: relative;
          z-index: 1;
          margin-top: 30px;
          border-radius: 28px;
          padding: 26px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(7, 12, 24, 0.42);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .brand-card-title {
          color: #ffffff;
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .brand-list {
          display: grid;
          gap: 12px;
        }

        .brand-list-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: rgba(255,255,255,0.76);
          font-size: 14px;
          line-height: 1.8;
          font-weight: 500;
        }

        .brand-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(135deg, #7f9bff 0%, #ff845c 100%);
          margin-top: 9px;
          flex-shrink: 0;
          box-shadow: 0 0 18px rgba(127,155,255,0.45);
        }

        .brand-mini-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 18px;
        }

        .brand-mini-card {
          border-radius: 24px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .brand-mini-label {
          color: rgba(255,255,255,0.52);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        .brand-mini-value {
          color: #ffffff;
          font-size: 20px;
          line-height: 1.35;
          font-weight: 800;
        }

        .login-panel {
          min-height: 720px;
          border-radius: 36px;
          padding: 38px 34px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(10, 14, 25, 0.52);
          box-shadow:
            0 30px 80px rgba(0,0,0,0.42),
            inset 0 1px 0 rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-inner {
          width: 100%;
          max-width: 420px;
        }

        .welcome {
          text-align: center;
          margin-bottom: 26px;
        }

        .welcome-title {
          margin: 0;
          color: #ffffff;
          font-size: 38px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .welcome-sub {
          margin-top: 10px;
          color: rgba(255,255,255,0.56);
          font-size: 14px;
          line-height: 1.8;
          font-weight: 500;
        }

        .social-boxes {
          display: grid;
          gap: 12px;
          margin-bottom: 20px;
        }

        .social-box {
          height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.72);
          font-size: 18px;
          font-weight: 800;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          color: rgba(255,255,255,0.34);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          justify-content: center;
        }

        .divider::before,
        .divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: rgba(255,255,255,0.08);
        }

        .field-group {
          display: grid;
          gap: 14px;
        }

        .field-label {
          color: rgba(255,255,255,0.64);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .field-input {
          width: 100%;
          height: 56px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          padding: 0 16px;
          color: #ffffff;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .field-input::placeholder {
          color: rgba(255,255,255,0.28);
        }

        .field-input:focus {
          border-color: rgba(127,155,255,0.48);
          background: rgba(255,255,255,0.07);
          box-shadow:
            0 0 0 4px rgba(127,155,255,0.10),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .member-btn {
          width: 100%;
          height: 58px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(135deg, #1d2f7f 0%, #8a1320 100%);
          color: #ffffff;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 18px 34px rgba(28, 41, 110, 0.28);
          transition: transform 0.2s ease, opacity 0.2s ease;
          margin-top: 6px;
        }

        .member-btn:hover {
          transform: translateY(-1px);
        }

        .member-btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
          transform: none;
        }

        .staff-btn {
          width: 100%;
          height: 58px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: #ffffff;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .staff-btn:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,0.07);
        }

        .help-text {
          margin-top: 18px;
          color: rgba(255,255,255,0.42);
          font-size: 12px;
          line-height: 1.9;
          text-align: center;
          font-weight: 500;
        }

        @media (max-width: 980px) {
          .login-shell {
            grid-template-columns: 1fr;
            max-width: 720px;
          }

          .brand-panel,
          .login-panel {
            min-height: auto;
          }
        }

        @media (max-width: 640px) {
          .login-page {
            padding: 16px;
          }

          .brand-panel,
          .login-panel {
            border-radius: 28px;
            padding: 24px 20px;
          }

          .brand-title {
            font-size: 44px;
          }

          .welcome-title {
            font-size: 32px;
          }

          .brand-mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="login-page">
        <div className="login-shell">
          <section className="brand-panel">
            <div className="brand-content">
              <div className="portal-badge">GYMUP PORTAL</div>

              <h1 className="brand-title">
                Life Time Beauty
                <br />
                ログインポータル
              </h1>

              <p className="brand-subtitle">
                会員様はマイページへログイン。スタッフはそのまま管理画面へ。
                サブスク状況、予約確認、商品導線までひとつの入口にまとめています。
              </p>

              <div className="brand-card">
                <div className="brand-card-title">この画面からできること</div>

                <div className="brand-list">
                  <div className="brand-list-item">
                    <span className="brand-dot" />
                    <span>会員様マイページへログイン</span>
                  </div>
                  <div className="brand-list-item">
                    <span className="brand-dot" />
                    <span>サブスク状況・予約確認</span>
                  </div>
                  <div className="brand-list-item">
                    <span className="brand-dot" />
                    <span>商品購入ページへの移動</span>
                  </div>
                  <div className="brand-list-item">
                    <span className="brand-dot" />
                    <span>スタッフ管理画面への入場</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="brand-mini-grid">
              <div className="brand-mini-card">
                <div className="brand-mini-label">MEMBER</div>
                <div className="brand-mini-value">ID・パスワードでログイン</div>
              </div>

              <div className="brand-mini-card">
                <div className="brand-mini-label">STAFF</div>
                <div className="brand-mini-value">クリックで管理画面へ</div>
              </div>
            </div>
          </section>

          <section className="login-panel">
            <div className="login-inner">
              <div className="welcome">
                <h2 className="welcome-title">Welcome Back!</h2>
                <div className="welcome-sub">
                  Enter your info to Sign In
                </div>
              </div>

              <div className="social-boxes">
                <div className="social-box"></div>
                <div className="social-box">G</div>
              </div>

              <div className="divider">Or</div>

              <div className="field-group">
                <div>
                  <div className="field-label">会員ID</div>
                  <input
                    type="text"
                    placeholder="会員IDを入力"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div>
                  <div className="field-label">パスワード</div>
                  <input
                    type="password"
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input"
                  />
                </div>

                <button
                  type="button"
                  className="member-btn"
                  onClick={handleMemberLogin}
                  disabled={loading}
                >
                  {loading ? "ログイン中..." : "会員ログイン"}
                </button>

                <div className="divider">Or</div>

                <button
                  type="button"
                  className="staff-btn"
                  onClick={handleStaffEnter}
                >
                  スタッフ管理画面へ
                </button>
              </div>

              <div className="help-text">
                ※ 会員ログイン情報が不明な場合は店舗スタッフまでご連絡ください。
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}