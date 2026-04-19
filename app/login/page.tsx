"use client";

import { useState } from "react";
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

  const title = role === "staff" ? "スタッフログイン" : "管理者ログイン";

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
      <div style={styles.bgGlowTop} />
      <div style={styles.bgGlowBottom} />

      <section style={styles.card}>
        <div style={styles.logoWrap}>
          <img src="/gymup-logo.png" alt="GYMUP" style={styles.logo} />
        </div>

        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>管理画面へログイン</p>

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

        <form onSubmit={handleLogin} style={styles.form}>
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

          <button type="submit" disabled={loading} style={styles.loginButton}>
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
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
    padding: "24px 16px",
    background:
      "linear-gradient(180deg, #041126 0%, #07182f 45%, #041126 100%)",
  },
  bgGlowTop: {
    position: "absolute",
    top: "-10%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "70vw",
    maxWidth: 700,
    height: 260,
    borderRadius: "50%",
    background: "rgba(95, 124, 255, 0.10)",
    filter: "blur(100px)",
    pointerEvents: "none",
  },
  bgGlowBottom: {
    position: "absolute",
    bottom: "-10%",
    right: "-5%",
    width: "40vw",
    maxWidth: 360,
    height: 240,
    borderRadius: "50%",
    background: "rgba(95, 124, 255, 0.08)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 460,
    padding: "38px 26px 26px",
    borderRadius: 28,
    background: "rgba(8, 18, 40, 0.90)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 24px 70px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)",
    backdropFilter: "blur(14px)",
    boxSizing: "border-box",
  },
  logoWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 24,
  },
  logo: {
    width: "min(240px, 72vw)",
    height: "auto",
    display: "block",
  },
  title: {
    margin: "0 0 10px",
    color: "#ffffff",
    fontSize: "clamp(28px, 5vw, 38px)",
    lineHeight: 1.2,
    fontWeight: 800,
    textAlign: "center",
    letterSpacing: "0.02em",
  },
  subtitle: {
    margin: "0 0 24px",
    color: "rgba(255,255,255,0.60)",
    fontSize: 15,
    textAlign: "center",
  },
  segmentWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 18,
  },
  segmentButton: {
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  segmentActive: {
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },
  form: {
    display: "grid",
    gap: 12,
  },
  input: {
    width: "100%",
    height: 54,
    padding: "0 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#ffffff",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
  },
  loginButton: {
    width: "100%",
    height: 56,
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    background: "linear-gradient(180deg, #24334f 0%, #1a263d 100%)",
    color: "#ffffff",
    fontSize: 17,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
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
    color: "#ff8b8b",
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 700,
  },
};