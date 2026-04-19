"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

function formatDateJP(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDateTimeJP(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(
    d.getHours()
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CustomerMealFeedbackPage() {
  const params = useParams();
  const customerId = String(params?.id || "");

  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [savingId, setSavingId] = useState<string>("");

  useEffect(() => {
    setMounted(true);

    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const loadData = () => {
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

      const savedMeals = localStorage.getItem(`gymup_meals_${customerId}`);
      const parsedMeals: Meal[] = savedMeals ? JSON.parse(savedMeals) : [];

      const safeMeals = Array.isArray(parsedMeals) ? parsedMeals : [];

      const sortedMeals = [...safeMeals].sort((a, b) => {
        const aTime = new Date(a.createdAt || a.date).getTime();
        const bTime = new Date(b.createdAt || b.date).getTime();
        return bTime - aTime;
      });

      setMeals(sortedMeals);
    } catch (error) {
      console.error(error);
      setCustomer(null);
      setMeals([]);
    }
  };

  const feedbackDoneCount = useMemo(() => {
    return meals.filter((meal) => meal.feedback && meal.feedback.trim()).length;
  }, [meals]);

  const feedbackPendingCount = useMemo(() => {
    return meals.filter((meal) => !meal.feedback || !meal.feedback.trim()).length;
  }, [meals]);

  const updateFeedback = (mealId: string, value: string) => {
    setMeals((prev) =>
      prev.map((meal) =>
        meal.id === mealId
          ? {
              ...meal,
              feedback: value,
            }
          : meal
      )
    );
  };

  const saveFeedback = (mealId: string) => {
    try {
      setSavingId(mealId);

      const updatedMeals = meals.map((meal) =>
        meal.id === mealId
          ? {
              ...meal,
              feedback: meal.feedback || "",
            }
          : meal
      );

      localStorage.setItem(`gymup_meals_${customerId}`, JSON.stringify(updatedMeals));
      setMeals(updatedMeals);

      alert("フィードバックを保存しました");
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    } finally {
      setSavingId("");
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
      <div style={{ maxWidth: "1180px", margin: "0 auto", display: "grid", gap: "20px" }}>
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
                {customer ? `${customer.name} 様のフィードバック管理` : "フィードバック管理"}
              </h1>

              <p
                style={{
                  margin: "10px 0 0 0",
                  fontSize: "15px",
                  color: "#4b5563",
                  lineHeight: 1.8,
                }}
              >
                各食事投稿に対してフィードバックを入力・保存できます
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

        <section style={metricGridStyle}>
          <MetricCard title="顧客名" value={customer?.name || "未登録"} />
          <MetricCard title="投稿数" value={`${meals.length}件`} />
          <MetricCard title="返信済み" value={`${feedbackDoneCount}件`} />
          <MetricCard title="未返信" value={`${feedbackPendingCount}件`} />
        </section>

        <section style={cardStyle}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: "18px" }}>フィードバック一覧</h2>

          {meals.length === 0 ? (
            <div style={emptyBoxStyle}>まだ食事投稿がありません</div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {meals.map((meal) => (
                <div key={meal.id} style={rowCardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "18px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "280px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginBottom: "12px",
                        }}
                      >
                        <span style={pillStyle("#e0f2fe", "#075985")}>
                          投稿日: {formatDateJP(meal.date)}
                        </span>
                        <span
                          style={
                            meal.feedback && meal.feedback.trim()
                              ? pillStyle("#dcfce7", "#166534")
                              : pillStyle("#fee2e2", "#991b1b")
                          }
                        >
                          {meal.feedback && meal.feedback.trim() ? "返信済み" : "未返信"}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                          lineHeight: 1.9,
                          whiteSpace: "pre-wrap",
                          marginBottom: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {meal.comment || "コメントなし"}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "10px",
                        }}
                      >
                        登録日時: {formatDateTimeJP(meal.createdAt)}
                      </div>

                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#374151",
                        }}
                      >
                        フィードバック
                      </label>

                      <textarea
                        value={meal.feedback || ""}
                        onChange={(e) => updateFeedback(meal.id, e.target.value)}
                        placeholder="例：たんぱく質はしっかり摂れています。次は野菜をもう少し増やしていきましょう。"
                        style={textareaStyle}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: "12px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => saveFeedback(meal.id)}
                          disabled={savingId === meal.id}
                          style={{
                            ...mainButtonStyle,
                            opacity: savingId === meal.id ? 0.7 : 1,
                            cursor: savingId === meal.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {savingId === meal.id ? "保存中..." : "保存する"}
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        minWidth: "220px",
                        width: "220px",
                      }}
                    >
                      {meal.image ? (
                        <img
                          src={meal.image}
                          alt="meal"
                          style={{
                            width: "100%",
                            height: "180px",
                            objectFit: "cover",
                            borderRadius: "14px",
                            border: "1px solid rgba(226,232,240,1)",
                            background: "#fff",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "180px",
                            borderRadius: "14px",
                            border: "1px dashed rgba(203,213,225,1)",
                            background: "rgba(248,250,252,0.9)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          画像なし
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={metricCardStyle}>
      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function pillStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: bg,
    color,
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  };
}

const metricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const metricCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.65)",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
};

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

const rowCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "20px",
  padding: "18px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800,
  color: "#111827",
};

const emptyBoxStyle: React.CSSProperties = {
  borderRadius: "18px",
  padding: "24px",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(203,213,225,0.7)",
  color: "#6b7280",
  textAlign: "center",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "140px",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.88)",
  fontSize: "15px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
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

const mainButtonStyle: React.CSSProperties = {
  borderRadius: "14px",
  padding: "12px 16px",
  background: "#111827",
  border: "none",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "center",
};