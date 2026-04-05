"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { BG, CARD, BUTTON_PRIMARY } from "../../styles/theme";

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
    <main style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.glowC} />

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brandWrap}>
            <img src="/gymup-logo.png" alt="GYMUP" style={styles.logo} />
            <div>
              <div style={styles.brandTitle}>GYMUP CRM</div>
              <div style={styles.brandSub}>顧客管理</div>
            </div>
          </div>

          <div style={styles.headerButtons}>
            <Link href="/" style={styles.headerLink}>
              ホームへ
            </Link>
          </div>
        </div>
      </header>

      <div style={styles.container}>
        <div
          style={{
            ...CARD,
            padding: "24px",
            position: "relative",
            overflow: "hidden",
            borderRadius: "28px",
          }}
        >
          <div style={styles.heroShine} />
          <div style={styles.badge}>CUSTOMER MANAGEMENT</div>

          <div style={styles.heroRow}>
            <div>
              <h1 style={styles.title}>顧客管理</h1>
              <p style={styles.subText}>
                Supabaseに保存された顧客情報を一覧表示・追加できます。
              </p>
            </div>

            <button style={styles.reloadButton} onClick={fetchCustomers}>
              再読み込み
            </button>
          </div>
        </div>

        <div
          style={{
            ...CARD,
            padding: "24px",
          }}
        >
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

          <div style={styles.actionRow}>
            <button
              onClick={handleAddCustomer}
              disabled={saving}
              style={{
                ...BUTTON_PRIMARY,
                padding: "12px 18px",
              }}
            >
              {saving ? "保存中..." : "顧客を追加"}
            </button>
          </div>

          {message ? <p style={styles.message}>{message}</p> : null}
        </div>

        <div
          style={{
            ...CARD,
            padding: "24px",
          }}
        >
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
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    padding: "24px 20px 60px",
    background: BG,
  },

  glowA: {
    position: "absolute",
    top: "-90px",
    left: "-70px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.95)",
    filter: "blur(55px)",
    pointerEvents: "none",
  },

  glowB: {
    position: "absolute",
    top: "120px",
    right: "-60px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.85)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  glowC: {
    position: "absolute",
    bottom: "-120px",
    left: "18%",
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    background: "rgba(203,213,225,0.35)",
    filter: "blur(75px)",
    pointerEvents: "none",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    marginBottom: "24px",
  },

  headerInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.58)",
    border: "1px solid rgba(255,255,255,0.92)",
    borderRadius: "22px",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow:
      "0 16px 40px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.98)",
  },

  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  logo: {
    height: "42px",
    width: "auto",
    objectFit: "contain",
  },

  brandTitle: {
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "#0f172a",
  },

  brandSub: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
    fontWeight: 700,
  },

  headerButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  headerLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    background: "rgba(255,255,255,0.82)",
    color: "#334155",
    border: "1px solid rgba(255,255,255,0.95)",
    borderRadius: "12px",
    padding: "10px 16px",
    fontWeight: 700,
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
  },

  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gap: "24px",
  },

  heroShine: {
    position: "absolute",
    top: 0,
    left: "-20%",
    width: "60%",
    height: "2px",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 35%, rgba(245,158,11,0.45) 52%, rgba(255,255,255,0.9) 70%, transparent 100%)",
    transform: "skewX(-28deg)",
  },

  badge: {
    display: "inline-block",
    marginBottom: "14px",
    padding: "6px 12px",
    fontSize: "12px",
    letterSpacing: "0.12em",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.95)",
    color: "#94a3b8",
    fontWeight: 700,
  },

  heroRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "16px",
    flexWrap: "wrap",
  },

  title: {
    fontSize: "32px",
    fontWeight: 900,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.03em",
  },

  subText: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.8,
  },

  reloadButton: {
    background: "rgba(255,255,255,0.82)",
    color: "#334155",
    border: "1px solid rgba(255,255,255,0.95)",
    borderRadius: "12px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
  },

  cardTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    marginTop: 0,
    marginBottom: "16px",
    letterSpacing: "-0.02em",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },

  label: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "8px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(226,232,240,0.9)",
    background: "rgba(255,255,255,0.88)",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(15,23,42,0.02)",
  },

  actionRow: {
    marginTop: "16px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  message: {
    marginTop: "12px",
    color: "#8b5e3c",
    fontSize: "14px",
    fontWeight: 700,
  },

  empty: {
    color: "#64748b",
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
    borderRadius: "18px",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.95)",
    textDecoration: "none",
    boxShadow:
      "0 14px 30px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },

  customerName: {
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 800,
    marginBottom: "6px",
  },

  customerPhone: {
    color: "#64748b",
    fontSize: "14px",
  },

  arrow: {
    color: "#c49a6c",
    fontSize: "28px",
    fontWeight: 700,
    lineHeight: 1,
  },
};