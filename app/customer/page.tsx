"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <main style={styles.page}>
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
        <div style={styles.heroCard}>
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

          <div style={styles.actionRow}>
            <button
              onClick={handleAddCustomer}
              disabled={saving}
              style={styles.addButton}
            >
              {saving ? "保存中..." : "顧客を追加"}
            </button>
          </div>

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
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#f6f3ef",
    color: "#111827",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    borderBottom: "1px solid rgba(224, 216, 205, 0.9)",
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  headerInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
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
    color: "#111827",
  },
  brandSub: {
    fontSize: "12px",
    color: "#8b5e3c",
    marginTop: "2px",
    fontWeight: 600,
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
    background: "rgba(255,255,255,0.78)",
    color: "#374151",
    border: "1px solid rgba(229,231,235,0.95)",
    borderRadius: "12px",
    padding: "10px 16px",
    fontWeight: 700,
    boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
    display: "grid",
    gap: "24px",
  },
  heroCard: {
    background: "rgba(255,255,255,0.62)",
    border: "1px solid rgba(236,231,223,0.95)",
    borderRadius: "24px",
    padding: "24px",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 12px 32px rgba(0,0,0,0.05)",
  },
  badge: {
    display: "inline-block",
    marginBottom: "14px",
    padding: "6px 12px",
    fontSize: "12px",
    letterSpacing: "0.12em",
    borderRadius: "999px",
    background: "#faf7f3",
    border: "1px solid #eee4d8",
    color: "#8b5e3c",
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
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  subText: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  reloadButton: {
    background: "rgba(255,255,255,0.9)",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
  },
  card: {
    background: "rgba(255,255,255,0.68)",
    border: "1px solid rgba(236,231,223,0.95)",
    borderRadius: "24px",
    padding: "20px",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
    marginTop: 0,
    marginBottom: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  label: {
    display: "block",
    color: "#6f4e37",
    fontSize: "14px",
    marginBottom: "8px",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.95)",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
  },
  actionRow: {
    marginTop: "16px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  addButton: {
    background: "linear-gradient(135deg, #8b5e3c 0%, #c49a6c 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(139,94,60,0.22)",
  },
  message: {
    marginTop: "12px",
    color: "#8b5e3c",
    fontSize: "14px",
    fontWeight: 700,
  },
  empty: {
    color: "#6b7280",
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
    borderRadius: "16px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid #e5e7eb",
    textDecoration: "none",
    boxShadow: "0 6px 18px rgba(0,0,0,0.035)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
  customerName: {
    color: "#111827",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "6px",
  },
  customerPhone: {
    color: "#6b7280",
    fontSize: "14px",
  },
  arrow: {
    color: "#c49a6c",
    fontSize: "28px",
    fontWeight: 700,
    lineHeight: 1,
  },
};