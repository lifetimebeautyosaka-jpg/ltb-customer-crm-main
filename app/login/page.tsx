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
    loginId: "staff",
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
          <span style={styles.logo}>GYMUP</span>
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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px 16px",
    background: "var(--gu-bg)",
    color: "var(--gu-ink)",
  },
  bgGlowTop: { display: "none" },
  bgGlowBottom: { display: "none" },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: "40px 26px 28px",
    borderRadius: 24,
    background: "var(--gu-card)",
    border: "1px solid var(--gu-line)",
    boxShadow: "0 1px 2px rgba(21,23,28,0.04)",
    boxSizing: "border-box",
  },
  logoWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  logo: {
    fontFamily: "var(--gu-font-logo)",
    fontWeight: 600,
    fontSize: 34,
    letterSpacing: "0.24em",
    color: "var(--gu-ink)",
  },
  title: {
    margin: "0 0 8px",
    color: "var(--gu-ink)",
    fontFamily: "var(--gu-font-heading)",
    fontSize: 24,
    lineHeight: 1.3,
    fontWeight: 700,
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 24px",
    color: "var(--gu-sub)",
    fontSize: 14,
    textAlign: "center",
  },
  segmentWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 18,
  },
  segmentButton: {
    height: 46,
    borderRadius: 999,
    border: "1px solid var(--gu-line)",
    background: "var(--gu-card)",
    color: "var(--gu-sub)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  segmentActive: {
    height: 46,
    borderRadius: 999,
    border: "1px solid var(--gu-ink)",
    background: "var(--gu-ink)",
    color: "var(--gu-bg)",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  form: {
    display: "grid",
    gap: 12,
  },
  input: {
    width: "100%",
    height: 52,
    padding: "0 16px",
    borderRadius: 14,
    border: "1px solid var(--gu-line)",
    background: "var(--gu-card)",
    color: "var(--gu-ink)",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
  },
  loginButton: {
    width: "100%",
    height: 54,
    border: "none",
    borderRadius: 999,
    background: "var(--gu-ink)",
    color: "var(--gu-bg)",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.08em",
    cursor: "pointer",
  },
  status: {
    margin: "2px 0 0",
    textAlign: "center",
    color: "var(--gu-sub)",
    fontSize: 13,
    lineHeight: 1.6,
  },
  error: {
    margin: "2px 0 0",
    textAlign: "center",
    color: "#9C3B2E",
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 700,
  },
};
