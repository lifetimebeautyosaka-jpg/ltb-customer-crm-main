"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Customer = {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchCustomer = async () => {
    if (!id) {
      setLoading(false);
      setCustomer(null);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("顧客取得エラー:", error);
      setCustomer(null);
      setMessage("顧客情報の取得に失敗しました");
      setLoading(false);
      return;
    }

    setCustomer(data);
    setName(data?.name ?? "");
    setPhone(data?.phone ?? "");
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;

    if (!name.trim()) {
      setMessage("名前を入力してください");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("customers")
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
      })
      .eq("id", id);

    if (error) {
      console.error("顧客更新エラー:", error);
      setMessage("保存に失敗しました");
      setSaving(false);
      return;
    }

    setMessage("保存しました");
    await fetchCustomer();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!id) return;

    const ok = window.confirm("この顧客を削除しますか？");
    if (!ok) return;

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      console.error("顧客削除エラー:", error);
      setMessage("削除に失敗しました");
      return;
    }

    alert("顧客を削除しました");
    router.push("/customer");
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <p style={styles.text}>読み込み中...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <h1 style={styles.title}>顧客が見つかりません</h1>
            <p style={styles.subText}>ID: {id}</p>
            <Link href="/customer" style={styles.backButton}>
              顧客一覧へ戻る
            </Link>
            {message ? <p style={styles.message}>{message}</p> : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.heroCard}>
          <div style={styles.badge}>CUSTOMER DETAIL</div>
          <div style={styles.heroRow}>
            <div>
              <h1 style={styles.title}>{customer.name}</h1>
              <p style={styles.subText}>
                登録日: {customer.created_at ? customer.created_at.slice(0, 10) : "-"}
              </p>
            </div>

            <div style={styles.headerButtons}>
              <Link href="/customer" style={styles.backButton}>
                顧客一覧へ戻る
              </Link>
              <button onClick={handleDelete} style={styles.deleteButton}>
                顧客削除
              </button>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>基本情報</h2>

          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label style={styles.label}>電話番号</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
                placeholder="090-1234-5678"
              />
            </div>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoBox}>
              <div style={styles.infoLabel}>顧客ID</div>
              <div style={styles.infoValue}>{customer.id}</div>
            </div>

            <div style={styles.infoBox}>
              <div style={styles.infoLabel}>登録日</div>
              <div style={styles.infoValue}>
                {customer.created_at ? customer.created_at.slice(0, 10) : "-"}
              </div>
            </div>
          </div>

          <div style={styles.actionRow}>
            <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>

          {message ? <p style={styles.message}>{message}</p> : null}
        </div>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#eef2f7 0%,#e5ebf3 100%)",
    color: "#0f172a",
    padding: "24px",
  },
  wrapper: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gap: "24px",
  },
  heroCard: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    backdropFilter: "blur(10px)",
  },
  badge: {
    display: "inline-block",
    marginBottom: "14px",
    padding: "6px 12px",
    fontSize: "12px",
    letterSpacing: "0.12em",
    borderRadius: "999px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 700,
  },
  heroRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "16px",
    flexWrap: "wrap",
  },
  headerButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
    color: "#0f172a",
  },
  subText: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "14px",
  },
  card: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    backdropFilter: "blur(10px)",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#0f172a",
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
    color: "#475569",
    fontSize: "14px",
    marginBottom: "8px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "20px",
  },
  infoBox: {
    padding: "16px",
    borderRadius: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },
  infoValue: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
    wordBreak: "break-all",
  },
  actionRow: {
    marginTop: "20px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  saveButton: {
    background: "linear-gradient(135deg, #c89b6d, #9f6b3f)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 18px",
    fontWeight: 700,
    textDecoration: "none",
  },
  deleteButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  message: {
    marginTop: "14px",
    color: "#92400e",
    fontSize: "14px",
  },
  text: {
    margin: 0,
    color: "#475569",
  },
};