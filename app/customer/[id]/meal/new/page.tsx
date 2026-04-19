"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CustomerMealNewPage() {
  const params = useParams();
  const customerId = String(params?.id || "");

  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [date, setDate] = useState(todayString());
  const [image, setImage] = useState("");
  const [comment, setComment] = useState("");
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

      const parsedCustomers: Customer[] = savedCustomers
        ? JSON.parse(savedCustomers)
        : [];

      const foundCustomer =
        parsedCustomers.find((c) => String(c.id) === customerId) || null;

      setCustomer(foundCustomer);
    } catch (error) {
      console.error(error);
      setCustomer(null);
    }
  }, [customerId]);

  const handleSave = () => {
    if (!date) {
      alert("日付を入力してください");
      return;
    }

    if (!comment.trim()) {
      alert("食事内容を入力してください");
      return;
    }

    try {
      setSaving(true);

      const savedMeals = localStorage.getItem(`gymup_meals_${customerId}`);
      const parsedMeals: Meal[] = savedMeals ? JSON.parse(savedMeals) : [];
      const safeMeals = Array.isArray(parsedMeals) ? parsedMeals : [];

      const newMeal: Meal = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
        date,
        image: image.trim() || "",
        comment: comment.trim(),
        feedback: "",
        createdAt: new Date().toISOString(),
      };

      const updatedMeals = [newMeal, ...safeMeals];
      localStorage.setItem(`gymup_meals_${customerId}`, JSON.stringify(updatedMeals));

      alert("食事投稿を保存しました");
      window.location.href = `/customer/${customerId}/meal`;
    } catch (error) {
      console.error(error);
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
      <div style={{ maxWidth: "980px", margin: "0 auto", display: "grid", gap: "20px" }}>
        <section
          style={{
            background: "rgba(255,255,255,0.50)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.75)",
            borderRadius: "28px",
            padding: "28px",
            boxShadow:
              "0 20px 60px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255,255,255,0.92)",
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
                NEW MEAL POST
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
                {customer ? `${customer.name} 様の食事投稿` : "食事投稿"}
              </h1>

              <p
                style={{
                  margin: "10px 0 0 0",
                  fontSize: "15px",
                  color: "#4b5563",
                  lineHeight: 1.8,
                }}
              >
                食事内容・画像URLを登録できます
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href={`/customer/${customerId}/meal`} style={subButtonStyle}>
                ← 食事一覧へ
              </Link>

              <Link href="/meal" style={subButtonStyle}>
                食事管理トップ
              </Link>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: "16px" }}>
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
              <label style={labelStyle}>画像URL（任意）</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            {image.trim() ? (
              <div
                style={{
                  borderRadius: "18px",
                  overflow: "hidden",
                  border: "1px solid rgba(226,232,240,1)",
                  background: "#fff",
                }}
              >
                <img
                  src={image}
                  alt="preview"
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            ) : null}

            <div>
              <label style={labelStyle}>食事内容</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="例：朝食 / オートミール・卵・サラダ"
                style={textareaStyle}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setDate(todayString());
                  setImage("");
                  setComment("");
                }}
                style={subButtonStyleButton}
              >
                リセット
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...mainButtonStyle,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        </section>
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

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "13px",
  fontWeight: 700,
  color: "#374151",
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

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "160px",
  resize: "vertical",
  lineHeight: 1.8,
};

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "14px",
  padding: "11px 16px",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(203,213,225,0.95)",
  color: "#111827",
  fontWeight: 700,
  textAlign: "center",
};

const subButtonStyleButton: React.CSSProperties = {
  borderRadius: "14px",
  padding: "12px 16px",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(203,213,225,0.95)",
  color: "#111827",
  fontWeight: 700,
  textAlign: "center",
  cursor: "pointer",
};

const mainButtonStyle: React.CSSProperties = {
  borderRadius: "14px",
  padding: "12px 16px",
  background: "#111827",
  border: "none",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "center",
};