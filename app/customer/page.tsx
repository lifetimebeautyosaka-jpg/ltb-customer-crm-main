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
    if (!id) return;

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
        <div style={styles.headerRow}>
          <div>
            <p style={styles.badge}>CUSTOMER DETAIL</p>
            <h1 style={styles.title}>{customer.name}</h1>
            <p style={styles.subText}>
              作成日: {customer.created_at ? customer.created_at.slice(0, 10) : "-"}
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

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>基本情報</h2>

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
    background: "linear-gradient(135deg, #0f0f0f, #1a1a1a, #242424)",
    color: "#fff",
    padding: "24px",
  },
  wrapper: {
    maxWidth: "960px",
    margin: "0 auto",
    display: "grid",
    gap: "24px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    margin: 0,
    marginBottom: "12px",
    padding: "6px 12px",
    fontSize: "12px",
    letterSpacing: "0.12em",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#d6d6d6",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
    color: "#fff",
  },
  subText: {
    marginTop: "8px",
    color: "#bbb",
    fontSize: "14px",
  },
  headerButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  card: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "18px",
    padding: "24px",
    backdropFilter: "blur(8px)",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "22px",
    fontWeight: 700,
    color: "#fff",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#ddd",
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
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "20px",
  },
  infoBox: {
    padding: "16px",
    borderRadius: "12px",
    background: "#161616",
    border: "1px solid #2d2d2d",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#aaa",
    marginBottom: "8px",
  },
  infoValue: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#fff",
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
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#2a2a2a",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: 700,
    textDecoration: "none",
  },
  deleteButton: {
    background: "#b91c1c",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  message: {
    marginTop: "14px",
    color: "#f3d7b6",
    fontSize: "14px",
  },
  text: {
    margin: 0,
    color: "#ddd",
  },
};