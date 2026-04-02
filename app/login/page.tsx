"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [staffName, setStaffName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("admin");
  const [message, setMessage] = useState("");

  const handleLogin = () => {
    setMessage("");

    if (!loginId.trim()) {
      setMessage("ログインIDを入力してください");
      return;
    }

    if (!password.trim()) {
      setMessage("パスワードを入力してください");
      return;
    }

    if (!staffName.trim()) {
      setMessage("スタッフ名を入力してください");
      return;
    }

    localStorage.setItem("gymup_logged_in", "true");
    localStorage.setItem("gymup_user_role", role);
    localStorage.setItem("gymup_current_staff_name", staffName.trim());
    localStorage.setItem("gymup_login_id", loginId.trim());

    router.push("/");
  };

  return (
    <main style={styles.page}>
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img
            src="/gymup-logo.png"
            alt="GYMUP"
            style={styles.logo}
          />
        </div>

        <p style={styles.badge}>GYMUP CRM</p>
        <h1 style={styles.title}>ログイン</h1>
        <p style={styles.subText}>
          スタッフ情報を入力して管理画面へ入ります
        </p>

        <div style={styles.form}>
          <div>
            <label style={styles.label}>ログインID</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="admin"
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>スタッフ名</label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="山口"
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>権限</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "staff")}
              style={styles.input}
            >
              <option value="admin">管理者</option>
              <option value="staff">スタッフ</option>
            </select>
          </div>

          <button onClick={handleLogin} style={styles.button}>
            ログインする
          </button>

          {message ? <p style={styles.message}>{message}</p> : null}
        </div>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "linear-gradient(180deg,#eef2f7 0%,#e5ebf3 100%)",
    position: "relative",
    overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute",
    top: "-120px",
    left: "-120px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.55)",
    filter: "blur(30px)",
  },
  bgCircle2: {
    position: "absolute",
    right: "-120px",
    bottom: "-120px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.45)",
    filter: "blur(30px)",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "460px",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: "28px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    backdropFilter: "blur(12px)",
  },
  logoWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px",
  },
  logo: {
    height: "56px",
    width: "auto",
    objectFit: "contain",
  },
  badge: {
    margin: 0,
    textAlign: "center",
    fontSize: "12px",
    letterSpacing: "0.18em",
    color: "#64748b",
    fontWeight: 700,
  },
  title: {
    margin: "12px 0 8px",
    textAlign: "center",
    fontSize: "32px",
    color: "#0f172a",
    fontWeight: 800,
  },
  subText: {
    margin: 0,
    marginBottom: "24px",
    textAlign: "center",
    fontSize: "14px",
    color: "#64748b",
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#475569",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    outline: "none",
    fontSize: "14px",
  },
  button: {
    marginTop: "8px",
    width: "100%",
    border: "none",
    borderRadius: "14px",
    padding: "14px 18px",
    background: "linear-gradient(135deg, #c89b6d, #9f6b3f)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  },
  message: {
    margin: 0,
    fontSize: "14px",
    color: "#b91c1c",
    textAlign: "center",
  },
};