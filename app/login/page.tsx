"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

/**
 * ここをあなた用に設定してください
 * ---------------------------------------------------
 * loginId: 画面で入力するID
 * email: Supabase Authに登録してあるメールアドレス
 * password: ここには書かない（Supabase Auth側で管理）
 * role: "admin" or "staff"
 * staffName: ログイン後にlocalStorageへ保存する表示名
 *
 * 使い方:
 * - 画面では「ID」と「パスワード」を入力
 * - 内部では ID に対応する email を探して Supabase Authで signInWithPassword
 */
const LOGIN_ACCOUNTS = [
  {
    loginId: "admin",
    email: "admin@example.com",
    role: "admin" as const,
    staffName: "管理者",
  },
  {
    loginId: "staff1",
    email: "staff1@example.com",
    role: "staff" as const,
    staffName: "スタッフ1",
  },
  {
    loginId: "staff2",
    email: "staff2@example.com",
    role: "staff" as const,
    staffName: "スタッフ2",
  },
] as const;

type RoleType = "admin" | "staff";

type LoginAccount = {
  loginId: string;
  email: string;
  role: RoleType;
  staffName: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [roleTab, setRoleTab] = useState<RoleType>("staff");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [staffNameInput, setStaffNameInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const loginFlag =
          typeof window !== "undefined"
            ? localStorage.getItem(AUTH_STORAGE_KEY)
            : null;

        if (loginFlag === "true") {
          router.replace("/dashboard");
          return;
        }

        if (supabase) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            const email = session.user.email ?? "";
            const matched = LOGIN_ACCOUNTS.find((acc) => acc.email === email);

            if (matched) {
              localStorage.setItem(AUTH_STORAGE_KEY, "true");
              localStorage.setItem(ROLE_STORAGE_KEY, matched.role);
              localStorage.setItem(STAFF_NAME_STORAGE_KEY, matched.staffName);
              router.replace("/dashboard");
              return;
            }
          }
        }
      } catch (e) {
        console.error("session check error:", e);
      } finally {
        setCheckingSession(false);
      }
    };

    void checkSession();
  }, [router]);

  const filteredAccounts = useMemo(() => {
    return LOGIN_ACCOUNTS.filter((acc) => acc.role === roleTab);
  }, [roleTab]);

  const handleQuickFill = (account: LoginAccount) => {
    setLoginId(account.loginId);
    setStaffNameInput(account.staffName);
    setError("");
  };

  const resolveAccount = (): LoginAccount | undefined => {
    const normalized = loginId.trim().toLowerCase();

    const byId = LOGIN_ACCOUNTS.find(
      (acc) => acc.loginId.toLowerCase() === normalized && acc.role === roleTab
    );
    if (byId) return byId;

    const byEmail = LOGIN_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === normalized && acc.role === roleTab
    );
    if (byEmail) return byEmail;

    return undefined;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!supabase) {
      setError("Supabase環境変数が未設定です。.env.local を確認してください。");
      return;
    }

    if (!loginId.trim()) {
      setError("IDを入力してください。");
      return;
    }

    if (!password.trim()) {
      setError("パスワードを入力してください。");
      return;
    }

    const account = resolveAccount();

    if (!account) {
      setError(
        roleTab === "admin"
          ? "管理者IDが見つかりません。LOGIN_ACCOUNTS を確認してください。"
          : "スタッフIDが見つかりません。LOGIN_ACCOUNTS を確認してください。"
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(
        {
          email: account.email,
          password: password.trim(),
        }
      );

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error("ログインに失敗しました。");
      }

      const finalStaffName =
        roleTab === "admin"
          ? "管理者"
          : staffNameInput.trim() || account.staffName || account.loginId;

      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(ROLE_STORAGE_KEY, account.role);
      localStorage.setItem(STAFF_NAME_STORAGE_KEY, finalStaffName);

      router.replace("/dashboard");
    } catch (err: unknown) {
      console.error(err);

      const message =
        err instanceof Error ? err.message : "ログインに失敗しました。";

      if (
        message.toLowerCase().includes("invalid login credentials") ||
        message.toLowerCase().includes("email not confirmed")
      ) {
        setError("IDまたはパスワードが正しくありません。");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main style={styles.page}>
        <div style={styles.bgGlow1} />
        <div style={styles.bgGlow2} />
        <div style={styles.loadingWrap}>
          <div style={styles.loadingCard}>
            <p style={styles.loadingText}>ログイン状態を確認中...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.container}>
        <section style={styles.leftPanel}>
          <div style={styles.brandWrap}>
            <div style={styles.logoBox}>
              <Image
                src="/logo.png"
                alt="GYMUP"
                width={80}
                height={80}
                style={styles.logo}
                priority
              />
            </div>

            <p style={styles.catch}>ジム・ピラティス運営を、もっとスマートに。</p>
            <h1 style={styles.title}>GYMUP CRM</h1>
            <p style={styles.description}>
              予約管理・顧客管理・売上管理・勤怠管理を
              <br />
              ひとつにまとめる会員管理システム
            </p>
          </div>

          <div style={styles.featureList}>
            <div style={styles.featureCard}>
              <span style={styles.featureIcon}>✓</span>
              <div>
                <p style={styles.featureTitle}>予約と顧客情報を一元管理</p>
                <p style={styles.featureText}>現場で使いやすいシンプル設計</p>
              </div>
            </div>

            <div style={styles.featureCard}>
              <span style={styles.featureIcon}>✓</span>
              <div>
                <p style={styles.featureTitle}>スタッフ / 管理者で権限分岐</p>
                <p style={styles.featureText}>運用に合わせたログイン管理</p>
              </div>
            </div>

            <div style={styles.featureCard}>
              <span style={styles.featureIcon}>✓</span>
              <div>
                <p style={styles.featureTitle}>Supabase Auth対応</p>
                <p style={styles.featureText}>ID入力でも内部は安全に認証</p>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.rightPanel}>
          <div style={styles.formCard}>
            <div style={styles.tabWrap}>
              <button
                type="button"
                onClick={() => {
                  setRoleTab("staff");
                  setError("");
                  setLoginId("");
                  setPassword("");
                  setStaffNameInput("");
                }}
                style={{
                  ...styles.tabButton,
                  ...(roleTab === "staff" ? styles.tabButtonActive : {}),
                }}
              >
                スタッフログイン
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoleTab("admin");
                  setError("");
                  setLoginId("");
                  setPassword("");
                  setStaffNameInput("");
                }}
                style={{
                  ...styles.tabButton,
                  ...(roleTab === "admin" ? styles.tabButtonActive : {}),
                }}
              >
                管理者ログイン
              </button>
            </div>

            <div style={styles.headingArea}>
              <p style={styles.subHeading}>
                {roleTab === "admin" ? "管理者用認証" : "スタッフ用認証"}
              </p>
              <h2 style={styles.formTitle}>ID / パスワードでログイン</h2>
              <p style={styles.formDesc}>
                {roleTab === "admin"
                  ? "管理者IDとパスワードを入力してください。"
                  : "スタッフIDとパスワードを入力してください。"}
              </p>
            </div>

            {filteredAccounts.length > 0 && (
              <div style={styles.quickArea}>
                <p style={styles.quickLabel}>ワンタップ入力</p>
                <div style={styles.quickButtons}>
                  {filteredAccounts.map((account) => (
                    <button
                      key={`${account.role}-${account.loginId}`}
                      type="button"
                      onClick={() => handleQuickFill(account)}
                      style={styles.quickButton}
                    >
                      {account.staffName}（{account.loginId}）
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} style={styles.form}>
              <label style={styles.label}>
                <span style={styles.labelText}>ID</span>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder={
                    roleTab === "admin" ? "例：admin" : "例：staff1"
                  }
                  autoComplete="username"
                  style={styles.input}
                />
              </label>

              {roleTab === "staff" && (
                <label style={styles.label}>
                  <span style={styles.labelText}>スタッフ表示名（任意）</span>
                  <input
                    type="text"
                    value={staffNameInput}
                    onChange={(e) => setStaffNameInput(e.target.value)}
                    placeholder="例：山口 / 中西 / 池田"
                    style={styles.input}
                  />
                </label>
              )}

              <label style={styles.label}>
                <span style={styles.labelText}>パスワード</span>
                <div style={styles.passwordWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    autoComplete="current-password"
                    style={{ ...styles.input, paddingRight: 52 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? "非表示" : "表示"}
                  </button>
                </div>
              </label>

              {error ? <div style={styles.errorBox}>{error}</div> : null}

              <button type="submit" disabled={loading} style={styles.submitButton}>
                {loading ? "ログイン中..." : "ログイン"}
              </button>

              <div style={styles.noteBox}>
                <p style={styles.noteTitle}>設定メモ</p>
                <p style={styles.noteText}>
                  この画面のIDは <strong>LOGIN_ACCOUNTS</strong> で管理します。
                  <br />
                  実際の認証は、対応するSupabase Authのメールアドレス＋パスワードで行います。
                </p>
              </div>

              <div style={styles.linkRow}>
                <Link href="/" style={styles.backLink}>
                  ← TOPへ戻る
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #0f1115 0%, #171a20 35%, #1d2129 65%, #111318 100%)",
    color: "#ffffff",
  },
  bgGlow1: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(255, 153, 0, 0.12)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "absolute",
    right: -120,
    bottom: -120,
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "rgba(255, 140, 0, 0.10)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },
  container: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    alignItems: "center",
    gap: 24,
    maxWidth: 1240,
    margin: "0 auto",
    padding: "32px 20px",
    position: "relative",
    zIndex: 1,
  },
  leftPanel: {
    padding: "20px 12px 20px 4px",
  },
  rightPanel: {
    display: "flex",
    justifyContent: "center",
  },
  brandWrap: {
    marginBottom: 28,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
    backdropFilter: "blur(14px)",
    marginBottom: 20,
  },
  logo: {
    width: "auto",
    height: "auto",
    maxWidth: "72px",
    maxHeight: "72px",
    objectFit: "contain",
  },
  catch: {
    fontSize: 14,
    color: "rgba(255,255,255,0.74)",
    margin: "0 0 8px 0",
    letterSpacing: "0.08em",
  },
  title: {
    fontSize: "clamp(34px, 5vw, 56px)",
    lineHeight: 1.05,
    fontWeight: 800,
    margin: "0 0 14px 0",
    letterSpacing: "0.02em",
  },
  description: {
    fontSize: 16,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.78)",
    margin: 0,
  },
  featureList: {
    display: "grid",
    gap: 14,
    marginTop: 30,
  },
  featureCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "16px 18px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.09)",
    backdropFilter: "blur(10px)",
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #ffb347 0%, #ff7a00 100%)",
    color: "#111",
    fontWeight: 800,
    fontSize: 14,
    flexShrink: 0,
  },
  featureTitle: {
    margin: "0 0 4px 0",
    fontSize: 15,
    fontWeight: 700,
  },
  featureText: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.70)",
    lineHeight: 1.6,
  },
  formCard: {
    width: "100%",
    maxWidth: 520,
    padding: 24,
    borderRadius: 28,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.34)",
  },
  tabWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 20,
  },
  tabButton: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.82)",
    padding: "14px 12px",
    borderRadius: 16,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  tabButtonActive: {
    background: "linear-gradient(135deg, #ffb347 0%, #ff7a00 100%)",
    color: "#151515",
    border: "1px solid rgba(255,180,71,0.8)",
    boxShadow: "0 12px 28px rgba(255,122,0,0.25)",
  },
  headingArea: {
    marginBottom: 18,
  },
  subHeading: {
    margin: "0 0 6px 0",
    fontSize: 13,
    color: "#ffb347",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  formTitle: {
    margin: "0 0 8px 0",
    fontSize: 28,
    lineHeight: 1.2,
    fontWeight: 800,
  },
  formDesc: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.72)",
  },
  quickArea: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  quickLabel: {
    margin: "0 0 10px 0",
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.72)",
    letterSpacing: "0.04em",
  },
  quickButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  quickButton: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  form: {
    display: "grid",
    gap: 16,
  },
  label: {
    display: "grid",
    gap: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(255,255,255,0.84)",
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
    fontSize: 15,
  },
  passwordWrap: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    height: 36,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBox: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(255, 80, 80, 0.12)",
    border: "1px solid rgba(255, 80, 80, 0.24)",
    color: "#ffd2d2",
    fontSize: 14,
    lineHeight: 1.6,
  },
  submitButton: {
    height: 56,
    border: "none",
    borderRadius: 16,
    background: "linear-gradient(135deg, #ffb347 0%, #ff7a00 100%)",
    color: "#171717",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 16px 36px rgba(255,122,0,0.28)",
  },
  noteBox: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  noteTitle: {
    margin: "0 0 6px 0",
    fontSize: 13,
    fontWeight: 800,
    color: "#ffb347",
  },
  noteText: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.72)",
  },
  linkRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  backLink: {
    color: "rgba(255,255,255,0.78)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
  },
  loadingWrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    position: "relative",
    zIndex: 1,
  },
  loadingCard: {
    padding: "24px 28px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(14px)",
  },
  loadingText: {
    margin: 0,
    fontSize: 15,
    color: "rgba(255,255,255,0.84)",
    fontWeight: 700,
  },
};

if (typeof window !== "undefined") {
  const media = window.matchMedia("(max-width: 980px)");
  const applyResponsive = () => {
    if (media.matches) {
      styles.container = {
        ...styles.container,
        gridTemplateColumns: "1fr",
        gap: 18,
        padding: "20px 14px 28px",
      };
      styles.leftPanel = {
        ...styles.leftPanel,
        padding: "8px 2px 0",
      };
      styles.rightPanel = {
        ...styles.rightPanel,
        justifyContent: "stretch",
      };
      styles.formCard = {
        ...styles.formCard,
        maxWidth: "100%",
        padding: 18,
        borderRadius: 22,
      };
      styles.title = {
        ...styles.title,
        fontSize: "36px",
      };
      styles.formTitle = {
        ...styles.formTitle,
        fontSize: 24,
      };
    }
  };
  applyResponsive();
  media.addEventListener?.("change", applyResponsive);
}