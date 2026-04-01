"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

type Customer = {
  id: string | number;
  name: string;
  phone?: string;
  plan?: string;
};

type Meal = {
  id: string;
  date: string;
  image?: string;
  comment: string;
  feedback?: string;
  createdAt: string;
};

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function CustomerMealNewPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = String(params?.id ?? "");

  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [date, setDate] = useState(getTodayString());
  const [comment, setComment] = useState("");
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    try {
      const savedCustomers =
        localStorage.getItem("gymup_customers") ||
        localStorage.getItem("customers");

      if (savedCustomers) {
        const parsed = JSON.parse(savedCustomers);
        if (Array.isArray(parsed)) {
          const found = parsed.find(
            (item: Customer) => String(item.id) === customerId
          );
          setCustomer(found || null);
        }
      }
    } catch {
      setCustomer(null);
    }
  }, [customerId]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setImage(result);
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!date) {
      alert("日付を入力してください");
      return;
    }

    if (!comment.trim()) {
      alert("コメントを入力してください");
      return;
    }

    setSaving(true);

    try {
      const storageKey = `gymup_meals_${customerId}`;
      const savedMeals = localStorage.getItem(storageKey);
      const parsedMeals: Meal[] = savedMeals ? JSON.parse(savedMeals) : [];

      const newMeal: Meal = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
        date,
        image: image || "",
        comment: comment.trim(),
        feedback: "",
        createdAt: new Date().toISOString(),
      };

      const nextMeals = [newMeal, ...(Array.isArray(parsedMeals) ? parsedMeals : [])];
      localStorage.setItem(storageKey, JSON.stringify(nextMeals));

      alert("食事投稿を保存しました");
      router.push(`/customer/${customerId}/meal`);
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f7f7f8 0%, #ececef 45%, #dfe3e8 100%)",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.50)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.75)",
            borderRadius: "28px",
            padding: "28px",
            boxShadow:
              "0 20px 60px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255,255,255,0.92)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "#6b7280",
                  marginBottom: "10px",
                }}
              >
                MEAL POST
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "34px",
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.15,
                }}
              >
                食事投稿
              </h1>

              <p
                style={{
                  margin: "10px 0 0 0",
                  fontSize: "15px",
                  color: "#4b5563",
                  lineHeight: 1.8,
                }}
              >
                {customer?.name || "顧客"} の食事内容を投稿します
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href={`/customer/${customerId}/meal`} style={subButtonStyle}>
                ← 食事一覧へ
              </Link>
              <Link href={`/customer/${customerId}`} style={subButtonStyle}>
                顧客詳細へ
              </Link>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>投稿内容</h2>

            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>日付</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>画像</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={fileInputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>コメント</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="例：朝食はサラダ、ゆで卵、プロテイン。昼は鶏むね肉とご飯。夜は控えめにしました。"
                  style={{ ...inputStyle, minHeight: "180px", resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={handleSave} style={mainButtonStyle} disabled={saving}>
                {saving ? "保存中..." : "投稿を保存する"}
              </button>

              <button
                onClick={() => router.push(`/customer/${customerId}/meal`)}
                style={subButtonPlainStyle}
              >
                キャンセル
              </button>
            </div>
          </section>

          <section style={sideCardStyle}>
            <h2 style={sectionTitleStyle}>プレビュー</h2>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>顧客名</div>
              <div style={infoValueStyle}>{customer?.name || "未設定"}</div>
            </div>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>日付</div>
              <div style={infoValueStyle}>{date || "-"}</div>
            </div>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>コメント</div>
              <div style={contentTextStyle}>
                {comment.trim() || "コメントはまだありません"}
              </div>
            </div>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>画像プレビュー</div>
              {preview ? (
                <img
                  src={preview}
                  alt="画像プレビュー"
                  style={{
                    width: "100%",
                    borderRadius: "14px",
                    objectFit: "cover",
                    maxHeight: "260px",
                    display: "block",
                  }}
                />
              ) : (
                <div style={{ ...contentTextStyle, color: "#6b7280" }}>
                  画像はまだ選択されていません
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.50)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.75)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow:
    "0 16px 44px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.92)",
};

const sideCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.48)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.75)",
  borderRadius: "24px",
  padding: "22px",
  boxShadow:
    "0 16px 44px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.92)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 18px 0",
  fontSize: "24px",
  fontWeight: 800,
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

const fileInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "14px",
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.88)",
  fontSize: "14px",
  color: "#111827",
  boxSizing: "border-box",
};

const infoBoxStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "16px",
  padding: "14px",
  marginBottom: "12px",
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

const contentTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: 1.8,
  whiteSpace: "pre-wrap",
};

const mainButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "14px",
  padding: "13px 20px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
};

const subButtonPlainStyle: React.CSSProperties = {
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: "14px",
  padding: "13px 20px",
  background: "rgba(255,255,255,0.85)",
  color: "#111827",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
};

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "14px",
  padding: "11px 16px",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(203,213,225,0.95)",
  color: "#111827",
  fontWeight: 700,
};