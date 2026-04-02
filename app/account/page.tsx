"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AccountProfile = {
  loginId: string;
  displayName: string;
  role: "admin" | "staff";
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export default function AccountPage() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<AccountProfile | null>(null);

  const [loginId, setLoginId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setMounted(true);

    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    const currentRole =
      (localStorage.getItem("gymup_user_role") as "admin" | "staff") || "staff";

    const currentDisplayName =
      localStorage.getItem("gymup_current_staff_name") ||
      (currentRole === "admin" ? "管理者" : "スタッフ");

    const currentLoginId =
      localStorage.getItem("gymup_login_id") ||
      localStorage.getItem("gymup_current_login_id") ||
      (currentRole === "admin" ? "admin" : "staff01");

    const storageKey = `gymup_account_${currentLoginId}`;

    try {
      const saved = localStorage.getItem(storageKey);

      const baseProfile: AccountProfile = {
        loginId: currentLoginId,
        displayName: currentDisplayName,
        role: currentRole,
        email: "",
        phone: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nextProfile: AccountProfile = saved
        ? {
            ...baseProfile,
            ...JSON.parse(saved),
            loginId: JSON.parse(saved)?.loginId || currentLoginId,
            displayName: JSON.parse(saved)?.displayName || currentDisplayName,
            role: JSON.parse(saved)?.role || currentRole,
            email: JSON.parse(saved)?.email || "",
            phone: JSON.parse(saved)?.phone || "",
          }
        : baseProfile;

      localStorage.setItem(storageKey, JSON.stringify(nextProfile));

      setProfile(nextProfile);
      setLoginId(nextProfile.loginId);
      setDisplayName(nextProfile.displayName);
      setRole(nextProfile.role);
      setEmail(nextProfile.email);
      setPhone(nextProfile.phone);
    } catch {
      const fallback: AccountProfile = {
        loginId: currentLoginId,
        displayName: currentDisplayName,
        role: currentRole,
        email: "",
        phone: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(fallback));
      setProfile(fallback);
      setLoginId(fallback.loginId);
      setDisplayName(fallback.displayName);
      setRole(fallback.role);
      setEmail(fallback.email);
      setPhone(fallback.phone);
    }
  }, []);

  const roleLabel = useMemo(() => {
    return role === "admin" ? "管理者" : "スタッフ";
  }, [role]);

  const handleSave = () => {
    if (!loginId.trim()) {
      alert("ログインIDを入力してください");
      return;
    }

    if (!displayName.trim()) {
      alert("表示名を入力してください");
      return;
    }

    const nextProfile: AccountProfile = {
      loginId: loginId.trim(),
      displayName: displayName.trim(),
      role,
      email: email.trim(),
      phone: phone.trim(),
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const oldLoginId =
        profile?.loginId ||
        localStorage.getItem("gymup_login_id") ||
        localStorage.getItem("gymup_current_login_id") ||
        "";

      if (oldLoginId && oldLoginId !== nextProfile.loginId) {
        localStorage.removeItem(`gymup_account_${oldLoginId}`);
      }

      localStorage.setItem(
        `gymup_account_${nextProfile.loginId}`,
        JSON.stringify(nextProfile)
      );

      localStorage.setItem("gymup_current_staff_name", nextProfile.displayName);
      localStorage.setItem("gymup_user_role", nextProfile.role);
      localStorage.setItem("gymup_login_id", nextProfile.loginId);
      localStorage.setItem("gymup_current_login_id", nextProfile.loginId);

      setProfile(nextProfile);
      alert("アカウント情報を保存しました");
    } catch {
      alert("保存に失敗しました");
    }
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f7f7f8 0%, #ececef 45%, #e5e7eb 100%)",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              アカウント
            </h1>
            <p
              style={{
                marginTop: "8px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              現在ログイン中のアカウント情報を確認・保存できます
            </p>
          </div>

          <Link href="/" style={homeButtonStyle}>
            ← ホームへ
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "24px",
          }}
        >
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>アカウント情報</h2>

            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>ログインID</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="例：admin / staff01"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>表示名</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例：山口 敏雄"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>権限</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "staff")}
                  style={inputStyle}
                >
                  <option value="admin">管理者</option>
                  <option value="staff">スタッフ</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>メールアドレス</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="例：sample@example.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>電話番号</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="例：090-1234-5678"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: "22px" }}>
              <button onClick={handleSave} style={saveButtonStyle}>
                保存する
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>現在の状態</h2>

            <div style={infoListStyle}>
              <div style={infoItemStyle}>
                <div style={infoLabelStyle}>ログイン状態</div>
                <div style={infoValueStyle}>
                  {localStorage.getItem("gymup_logged_in") === "true"
                    ? "ログイン中"
                    : "未ログイン"}
                </div>
              </div>

              <div style={infoItemStyle}>
                <div style={infoLabelStyle}>現在のログインID</div>
                <div style={infoValueStyle}>{loginId || "-"}</div>
              </div>

              <div style={infoItemStyle}>
                <div style={infoLabelStyle}>表示名</div>
                <div style={infoValueStyle}>{displayName || "-"}</div>
              </div>

              <div style={infoItemStyle}>
                <div style={infoLabelStyle}>権限</div>
                <div style={infoValueStyle}>{roleLabel}</div>
              </div>

              <div style={infoItemStyle}>
                <div style={infoLabelStyle}>保存キー</div>
                <div style={{ ...infoValueStyle, wordBreak: "break-all" }}>
                  {loginId ? `gymup_account_${loginId}` : "-"}
                </div>
              </div>
            </div>

            <div style={noteBoxStyle}>
              <div style={noteTitleStyle}>今後の拡張に対応</div>
              <div style={noteTextStyle}>
                将来ログインIDごとにアカウント管理できるように
                <strong> gymup_account_ログインID </strong>
                形式で保存するようにしてあります。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const homeButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  padding: "11px 16px",
  borderRadius: "12px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.65)",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: "22px",
  fontWeight: 700,
  color: "#111827",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.88)",
  fontSize: "15px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const saveButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "14px",
  padding: "13px 20px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
};

const infoListStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const infoItemStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "16px",
  padding: "14px",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  marginBottom: "6px",
};

const infoValueStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#111827",
  fontWeight: 700,
};

const noteBoxStyle: React.CSSProperties = {
  marginTop: "20px",
  borderRadius: "18px",
  padding: "16px",
  background: "rgba(17,24,39,0.92)",
  color: "#ffffff",
};

const noteTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px",
};

const noteTextStyle: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.8,
  color: "rgba(255,255,255,0.88)",
};　