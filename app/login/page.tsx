"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CRMLayout from "../../components/CRMLayout";
import { supabase } from "../../lib/supabase";

type Customer = {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
};

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("顧客取得エラー:", error);
      setMessage("顧客一覧の取得に失敗しました");
      setCustomers([]);
    } else {
      setCustomers(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async () => {
    if (!name.trim()) {
      setMessage("名前を入力してください");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("customers").insert([
      {
        name: name.trim(),
        phone: phone.trim() || null,
      },
    ]);

    if (error) {
      console.error("顧客追加エラー:", error);
      setMessage("顧客追加に失敗しました");
      setSaving(false);
      return;
    }

    setName("");
    setPhone("");
    setMessage("顧客を追加しました");
    await fetchCustomers();
    setSaving(false);
  };

  return (
    <CRMLayout title="顧客管理">
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>顧客管理</h1>
          <button style={styles.reloadButton} onClick={fetchCustomers}>
            再読み込み
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>新規顧客追加</h2>

          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>電話番号</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="090-1234-5678"
                style={styles.input}
              />
            </div>
          </div>

          <button
            onClick={handleAddCustomer}
            disabled={saving}
            style={styles.addButton}
          >
            {saving ? "保存中..." : "顧客を追加"}
          </button>

          {message ? <p style={styles.message}>{message}</p> : null}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>顧客一覧</h2>

          {loading ? (
            <p style={styles.empty}>読み込み中...</p>
          ) : customers.length === 0 ? (
            <p style={styles.empty}>まだ顧客が登録されていません</p>
          ) : (
            <div style={styles.list}>
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customer/${customer.id}`}
                  style={styles.customerItem}
                >
                  <div>
                    <div style={styles.customerName}>{customer.name}</div>
                    <div style={styles.customerPhone}>
                      電話番号: {customer.phone || "未登録"}
                    </div>
                  </div>
                  <div style={styles.arrow}>›</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "grid",
    gap: "24px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#ffffff",
    margin: 0,
  },
  reloadButton: {
    background: "#2a2a2a",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
  },
  card: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px",
    padding: "20px",
    backdropFilter: "blur(8px)",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#fff",
    marginTop: 0,
    marginBottom: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  label: {
    display: "block",
    color: "#ddd",
    fontSize: "14px",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #555",
    background: "#111",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },
  addButton: {
    marginTop: "16px",
    background: "linear-gradient(135deg, #c89b6d, #9f6b3f)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  message: {
    marginTop: "12px",
    color: "#f3d7b6",
    fontSize: "14px",
  },
  empty: {
    color: "#ccc",
    margin: 0,
  },
  list: {
    display: "grid",
    gap: "12px",
  },
  customerItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderRadius: "12px",
    background: "#161616",
    border: "1px solid #2d2d2d",
    textDecoration: "none",
  },
  customerName: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "6px",
  },
  customerPhone: {
    color: "#bbb",
    fontSize: "14px",
  },
  arrow: {
    color: "#c89b6d",
    fontSize: "28px",
    fontWeight: 700,
  },
};"use client";

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