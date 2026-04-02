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
            <img
              src="/gymup-logo.png"
              alt="GYMUP"
              style={styles.logo}
            />
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
    background: "linear-gradient(135deg, #0f0f0f, #1a1a1a, #242424)",
    color: "#fff",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(18,18,18,0.78)",
    backdropFilter: "blur(10px)",
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
  },
  brandSub: {
    fontSize: "12px",
    color: "#bdbdbd",
    marginTop: "2px",
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
    background: "#2a2a2a",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: 700,
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
    display: "grid",
    gap: "24px",
  },
  heroCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "18px",
    padding: "24px",
    backdropFilter: "blur(8px)",
  },
  badge: {
    display: "inline-block",
    marginBottom: "14px",
    padding: "6px 12px",
    fontSize: "12px",
    letterSpacing: "0.12em",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#d6d6d6",
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
    color: "#ffffff",
    margin: 0,
  },
  subText: {
    marginTop: "8px",
    color: "#bdbdbd",
    fontSize: "14px",
  },
  reloadButton: {
    background: "#2a2a2a",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
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
  actionRow: {
    marginTop: "16px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  addButton: {
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
};