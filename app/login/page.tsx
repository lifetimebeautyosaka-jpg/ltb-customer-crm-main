"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

const AUTH_STORAGE_KEY = "gymup_logged_in";
const ROLE_STORAGE_KEY = "gymup_user_role";
const STAFF_NAME_STORAGE_KEY = "gymup_current_staff_name";

const LOGIN_ACCOUNTS = [
  {
    loginId: "admin",
    email: "lifetimebeauty.osaka@gmail.com",
    role: "admin" as const,
    staffName: "管理者",
  },
  {
    loginId: "staff1",
    email: "staff@test.com",
    role: "staff" as const,
    staffName: "スタッフ1",
  },
];

type RoleType = "admin" | "staff";

export default function LoginPage() {
  const [role, setRole] = useState<RoleType>("staff");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginPanel, setShowLoginPanel] = useState(false);

  const activeTitle = useMemo(() => {
    return role === "staff" ? "スタッフログイン" : "管理者ログイン";
  }, [role]);

  const handleOpenPanel = () => {
    setError("");
    setStatus("");
    setShowLoginPanel(true);
  };

  const handleClosePanel = () => {
    if (loading) return;
    setShowLoginPanel(false);
    setError("");
    setStatus("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setStatus("");

    try {
      if (!supabase) {
        setError("Supabase未設定です。.env.local を確認してください。");
        return;
      }

      const trimmedId = loginId.trim();
      const trimmedPassword = password.trim();

      if (!trimmedId) {
        setError("IDを入力してください");
        return;
      }

      if (!trimmedPassword) {
        setError("パスワードを入力してください");
        return;
      }

      const account = LOGIN_ACCOUNTS.find(
        (a) => a.loginId === trimmedId && a.role === role
      );

      if (!account) {
        setError("IDが違います");
        return;
      }

      setStatus("認証中...");

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: account.email,
          password: trimmedPassword,
        });

      if (signInError) {
        setError(`ログイン失敗: ${signInError.message}`);
        return;
      }

      if (!data.user) {
        setError("ログインに失敗しました");
        return;
      }

      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(ROLE_STORAGE_KEY, account.role);
      localStorage.setItem(STAFF_NAME_STORAGE_KEY, account.staffName);

      setStatus("ダッシュボードへ移動中...");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("ログイン処理中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.bgLayer} />
      <div style={styles.bgGlowTop} />
      <div style={styles.bgGlowLeft} />
      <div style={styles.bgGlowBottom} />

      <section style={styles.card}>
        <div style={styles.innerGlow} />

        <div style={styles.logoWrap}>
          <Image
            src="/logo.png"
            alt="GYMUP"
            width={220}
            height={80}
            style={styles.logo}
            priority
          />
        </div>

        <h1 style={styles.title}>{activeTitle}</h1>
        <p style={styles.subtitle}>管理画面へログイン</p>

        <button
          type="button"
          onClick={handleOpenPanel}
          style={styles.primaryButton}
        >
          ダッシュボードへ
        </button>

        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          style={styles.backButton}
        >
          戻る
        </button>

        <div
          style={{
            ...styles.panelOverlay,
            opacity: showLoginPanel ? 1 : 0,
            pointerEvents: showLoginPanel ? "auto" : "none",
          }}
          onClick={handleClosePanel}
        />

        <div
          style={{
            ...styles.loginSheet,
            transform: showLoginPanel
              ? "translateY(0)"
              : "translateY(120%)",
            opacity: showLoginPanel ? 1 : 0,
            pointerEvents: showLoginPanel ? "auto" : "none",
          }}
        >
          <div style={styles.sheetHandle} />

          <div style={styles.sheetHeader}>
            <h2 style={styles.sheetTitle}>{activeTitle}</h2>
            <button
              type="button"
              onClick={handleClosePanel}
              style={styles.closeButton}
            >
              閉じる
            </button>
          </div>

          <div style={styles.segmentWrap}>
            <button
              type="button"
              onClick={() => {
                setRole("staff");
                setError("");
                setStatus("");
              }}
              style={role === "staff" ? styles.segmentActive : styles.segmentButton}
            >
              スタッフ
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("admin");
                setError("");
                setStatus("");
              }}
              style={role === "admin" ? styles.segmentActive : styles.segmentButton}
            >
              管理者
            </button>
          </div>

          <form
            onSubmit={handleLogin}
            style={styles.form}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder={role === "staff" ? "ID（例: staff1）" : "ID（例: admin）"}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              style={styles.input}
              autoComplete="username"
            />

            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
            />

            {status ? <p style={styles.status}>{status}</p> : null}
            {error ? <p style={styles.error}>{error}</p> : null}

            <button type="submit" disabled={loading} style={styles.sheetLoginButton}>
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px 18px",
    background:
      "linear-gradient(180deg, #03102b 0%, #061633 26%, #07183b 55%, #04112b 100%)",
  },
  bgLayer: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 12%, rgba(86,122,255,0.22), transparent 18%), radial-gradient(circle at 14% 34%, rgba(255,129,70,0.08), transparent 18%), radial-gradient(circle at 82% 74%, rgba(72,110,255,0.18), transparent 24%)",
    pointerEvents: "none",
  },
  bgGlowTop: {
    position: "absolute",
    top: "-6%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "72vw",
    maxWidth: 760,
    height: 260,
    borderRadius: "50%",
    background: "rgba(76,112,255,0.18)",
    filter: "blur(110px)",
    pointerEvents: "none",
  },
  bgGlowLeft: {
    position: "absolute",
    left: "-8%",
    top: "28%",
    width: "34vw",
    maxWidth: 280,
    height: 280,
    borderRadius: "50%",
    background: "rgba(255,132,72,0.08)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },
  bgGlowBottom: {
    position: "absolute",
    bottom: "-8%",
    right: "-6%",
    width: "48vw",
    maxWidth: 420,
    height: 260,
    borderRadius: "50%",
    background: "rgba(57,95,255,0.16)",
    filter: "blur(110px)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 760,
    minHeight: 650,
    borderRadius: 40,
    padding: "56px 30px 34px",
    background:
      "linear-gradient(180deg, rgba(6,14,40,0.86) 0%, rgba(5,12,35,0.92) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 30px 80px rgba(0,0,0,0.44), inset 0 1px 0 rgba(255,255,255,0.05)",
    backdropFilter: "blur(14px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  innerGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 40,
    background:
      "radial-gradient(circle at 18% 18%, rgba(255,130,80,0.06), transparent 22%), radial-gradient(circle at 84% 82%, rgba(75,116,255,0.12), transparent 24%)",
    pointerEvents: "none",
  },
  logoWrap: {
    position: "relative",
    zIndex: 1,
    marginBottom: 42,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "auto",
    height: "auto",
    maxWidth: "100%",
    objectFit: "contain",
  },
  title: {
    position: "relative",
    zIndex: 1,
    margin: "0 0 14px",
    color: "#ffffff",
    fontSize: "clamp(32px, 6vw, 60px)",
    lineHeight: 1.12,
    fontWeight: 800,
    letterSpacing: "0.02em",
    textAlign: "center",
  },
  subtitle: {
    position: "relative",
    zIndex: 1,
    margin: "0 0 42px",
    color: "rgba(255,255,255,0.56)",
    fontSize: "clamp(16px, 2.8vw, 22px)",
    fontWeight: 500,
    textAlign: "center",
  },
  primaryButton: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 560,
    height: 88,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    background:
      "linear-gradient(180deg, rgba(34,38,58,0.96) 0%, rgba(22,26,46,0.96) 100%)",
    color: "#ffffff",
    fontSize: "clamp(20px, 3.2vw, 34px)",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
  },
  backButton: {
    position: "relative",
    zIndex: 1,
    marginTop: 28,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.56)",
    fontSize: "clamp(18px, 2.8vw, 28px)",
    cursor: "pointer",
  },
  panelOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.32)",
    transition: "opacity 0.28s ease",
  },
  loginSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    background:
      "linear-gradient(180deg, rgba(11,20,49,0.98) 0%, rgba(8,15,40,0.98) 100%)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: "14px 22px 24px",
    boxShadow: "0 -20px 50px rgba(0,0,0,0.34)",
    transition: "transform 0.34s ease, opacity 0.34s ease",
    boxSizing: "border-box",
  },
  sheetHandle: {
    width: 56,
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.20)",
    margin: "0 auto 14px",
  },
  sheetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "clamp(22px, 3vw, 30px)",
    fontWeight: 800,
  },
  closeButton: {
    height: 38,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  segmentWrap: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    marginBottom: 14,
  },
  segmentButton: {
    height: 52,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.86)",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
  segmentActive: {
    height: 52,
    border: "none",
    background: "linear-gradient(180deg, #ff930f 0%, #ff7b00 100%)",
    color: "#111111",
    fontSize: 18,
    fontWeight: 800,
    cursor: "pointer",
  },
  form: {
    display: "grid",
    gap: 12,
  },
  input: {
    width: "100%",
    height: 58,
    padding: "0 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
  },
  sheetLoginButton: {
    width: "100%",
    height: 58,
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(180deg, #ff930f 0%, #ff7b00 100%)",
    color: "#111",
    fontSize: 18,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(255,123,0,0.24)",
  },
  status: {
    margin: "2px 0 0",
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 1.6,
  },
  error: {
    margin: "2px 0 0",
    textAlign: "center",
    color: "#ff7d7d",
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 700,
  },
};