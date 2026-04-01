"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

export default function MealFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const customerId = String(params?.id ?? "");
  const mealId = String(searchParams.get("mealId") ?? "");

  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [feedback, setFeedback] = useState("");
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

    try {
      const savedMeals = localStorage.getItem(`gymup_meals_${customerId}`);
      if (savedMeals) {
        const parsed = JSON.parse(savedMeals);
        const nextMeals = Array.isArray(parsed) ? parsed : [];
        setMeals(nextMeals);

        const foundMeal = nextMeals.find((item: Meal) => item.id === mealId);
        setFeedback(foundMeal?.feedback || "");
      } else {
        setMeals([]);
      }
    } catch {
      setMeals([]);
    }
  }, [customerId, mealId]);

  const targetMeal = useMemo(() => {
    return meals.find((item) => item.id === mealId) || null;
  }, [meals, mealId]);

  const handleSave = () => {
    if (!mealId) {
      alert("対象の食事投稿が見つかりません");
      return;
    }

    setSaving(true);

    try {
      const nextMeals = meals.map((meal) =>
        meal.id === mealId
          ? {
              ...meal,
              feedback: feedback.trim(),
            }
          : meal
      );

      localStorage.setItem(
        `gymup_meals_${customerId}`,
        JSON.stringify(nextMeals)
      );
      setMeals(nextMeals);

      alert("フィードバックを保存しました");
      router.push(`/customer/${customerId}/meal`);
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  if (!mealId || !targetMeal) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #f7f7f8 0%, #ececef 45%, #dfe3e8 100%)",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={cardStyle}>
          <h1 style={{ marginTop: 0, fontSize: "28px", fontWeight: 800 }}>
            投稿が見つかりません
          </h1>
          <p style={{ color: "#4b5563", lineHeight: 1.8 }}>
            mealId が正しく渡っていない可能性があります。
          </p>

          <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href={`/customer/${customerId}/meal`} style={subButtonStyle}>
              ← 食事一覧へ
            </Link>
            <Link href={`/customer/${customerId}`} style={subButtonStyle}>
              顧客詳細へ
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                MEAL FEEDBACK
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
                フィードバック入力
              </h1>

              <p
                style={{
                  margin: "10px 0 0 0",
                  fontSize: "15px",
                  color: "#4b5563",
                  lineHeight: 1.8,
                }}
              >
                {customer?.name || "顧客"} の食事投稿に返信します
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
            gridTemplateColumns: "1fr 340px",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>フィードバック内容</h2>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>投稿日</div>
              <div style={infoValueStyle}>{targetMeal.date || "-"}</div>
            </div>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>食事コメント</div>
              <div style={contentTextStyle}>
                {targetMeal.comment?.trim() || "コメントなし"}
              </div>
            </div>

            <div style={{ marginTop: "14px" }}>
              <label style={labelStyle}>トレーナーフィードバック</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="例：たんぱく質はしっかり摂れていて良いです。夜は炭水化物を少し控えめにするとさらに良いです。"
                style={{ ...inputStyle, minHeight: "220px", resize: "vertical" }}
              />
            </div>

            <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={handleSave} style={mainButtonStyle} disabled={saving}>
                {saving ? "保存中..." : "フィードバックを保存する"}
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
            <h2 style={sectionTitleStyle}>投稿内容</h2>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>顧客名</div>
              <div style={infoValueStyle}>{customer?.name || "未設定"}</div>
            </div>

            {targetMeal.image ? (
              <div style={infoBoxStyle}>
                <div style={infoLabelStyle}>画像</div>
                <img
                  src={targetMeal.image}
                  alt="食事画像"
                  style={{
                    width: "100%",
                    borderRadius: "14px",
                    objectFit: "cover",
                    maxHeight: "260px",
                    display: "block",
                  }}
                />
              </div>
            ) : (
              <div style={infoBoxStyle}>
                <div style={infoLabelStyle}>画像</div>
                <div style={contentTextStyle}>画像なし</div>
              </div>
            )}

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>現在の保存済み返信</div>
              <div style={contentTextStyle}>
                {targetMeal.feedback?.trim() || "まだ返信はありません"}
              </div>
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