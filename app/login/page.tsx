"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [role, setRole] = useState<RoleType>("staff");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

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

      const { data, error: signInError } = await supabase.auth.signInWithPassword(
        {
          email: account.email,
          password: trimmedPassword,
        }
      );

      if (signInError) {
        console.error("signIn error:", signInError);
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

      router.replace("/dashboard");
    } catch (err) {
      console.error("login catch error:", err);
      setError("ログイン処理中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <Image src="/logo.png" alt="GYMUP" width={80} height={80} />
        </div>

        <h1 style={styles.title}>GYMUP CRM</h1>

        <div style={styles.tabs}>
          <button
            type="button"
            style={role === "staff" ? styles.activeTab : styles.tab}
            onClick={() => {
              setRole("staff");
              setError("");
            }}
          >
            スタッフ
          </button>
          <button
            type="button"
            style={role === "admin" ? styles.activeTab : styles.tab}
            onClick={() => {
              setRole("admin");
              setError("");
            }}
          >
            管理者
          </button>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="ID"
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

          {error ? <p style={styles.error}>{error}</p> : null}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#111",
    color: "#fff",
    padding: "16px",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    padding: 24,
    borderRadius: 12,
    background: "#1a1a1a",
    textAlign: "center",
    boxSizing: "border-box",
  },
  logoWrap: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
  },
  tabs: {
    display: "flex",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    padding: 10,
    background: "#333",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  activeTab: {
    flex: 1,
    padding: 10,
    background: "#ff7a00",
    border: "none",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  input: {
    padding: 10,
    borderRadius: 6,
    border: "none",
    fontSize: 16,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    border: "none",
    background: "#ff7a00",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 16,
  },
  error: {
    color: "#ff5a5a",
    fontSize: 12,
    margin: 0,
  },
};