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

export default function CustomerMealPage() {
  const params = useParams();
  const customerId = String(params?.id ?? "");

  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);

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
        setMeals(Array.isArray(parsed) ? parsed : []);
      } else {
        setMeals([]);
      }
    } catch {
      setMeals([]);
    }
  }, [customerId]);

  const sortedMeals = useMemo(() => {
    return [...meals].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return bTime - aTime;
    });
  }, [meals]);

  const mealCount = useMemo(() => meals.length, [meals]);

  const feedbackCount = useMemo(() => {
    return meals.filter((meal) => meal.feedback && meal.feedback.trim()).length;
  }, [meals]);

  const handleDeleteMeal = (mealId: string) => {
    const ok = window.confirm("この食事投稿を削除しますか？");
    if (!ok) return;

    const nextMeals = meals.filter((meal) => meal.id !== mealId);
    setMeals(nextMeals);
    localStorage.setItem(`gymup_meals_${customerId}`, JSON.stringify(nextMeals));
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
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
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
                MEAL MANAGEMENT
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
                食事管理
              </h1>

              <p
                style={{
                  margin: "10px 0 0 0",
                  fontSize: "15px",
                  color: "#4b5563",
                  lineHeight: 1.8,
                }}
              >
                {customer?.name || "顧客"} の食事投稿一覧を確認できます
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href={`/customer/${customerId}`} style={subButtonStyle}>
                ← 顧客詳細へ
              </Link>
              <Link href={`/customer/${customerId}/meal/new`} style={mainButtonLinkStyle}>
                ＋ 新規投稿
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
          <div style={{ display: "grid", gap: "24px" }}>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>食事投稿一覧</h2>

              {sortedMeals.length === 0 ? (
                <div style={emptyBoxStyle}>
                  まだ食事投稿がありません
                </div>
              ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                  {sortedMeals.map((meal) => (
                    <div key={meal.id} style={mealCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "14px",
                          flexWrap: "wrap",
                          marginBottom: "14px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 800,
                              color: "#111827",
                              marginBottom: "6px",
                            }}
                          >
                            {meal.date || "日付未設定"}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                            }}
                          >
                            投稿日：{meal.createdAt ? new Date(meal.createdAt).toLocaleString() : "-"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <Link
                            href={`/customer/${customerId}/meal/feedback?mealId=${meal.id}`}
                            style={subButtonStyle}
                          >
                            フィードバック
                          </Link>

                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            style={deleteButtonStyle}
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      {meal.image ? (
                        <div
                          style={{
                            marginBottom: "14px",
                            borderRadius: "18px",
                            overflow: "hidden",
                            border: "1px solid rgba(226,232,240,0.95)",
                            background: "#fff",
                          }}
                        >
                          <img
                            src={meal.image}
                            alt="食事画像"
                            style={{
                              width: "100%",
                              maxHeight: "320px",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            marginBottom: "14px",
                            borderRadius: "16px",
                            padding: "16px",
                            background: "rgba(255,255,255,0.62)",
                            border: "1px solid rgba(226,232,240,0.95)",
                            color: "#6b7280",
                            fontSize: "14px",
                          }}
                        >
                          画像なし
                        </div>
                      )}

                      <div style={contentBoxStyle}>
                        <div style={contentLabelStyle}>コメント</div>
                        <div style={contentTextStyle}>
                          {meal.comment?.trim() || "コメントなし"}
                        </div>
                      </div>

                      <div style={{ ...contentBoxStyle, marginTop: "12px" }}>
                        <div style={contentLabelStyle}>トレーナーフィードバック</div>
                        <div style={contentTextStyle}>
                          {meal.feedback?.trim() || "まだフィードバックはありません"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div style={{ display: "grid", gap: "24px" }}>
            <section style={sideCardStyle}>
              <h2 style={sectionTitleStyle}>顧客情報</h2>

              <div style={infoBoxStyle}>
                <div style={infoLabelStyle}>顧客名</div>
                <div style={infoValueStyle}>{customer?.name || "未設定"}</div>
              </div>

              <div style={infoBoxStyle}>
                <div style={infoLabelStyle}>電話番号</div>
                <div style={infoValueStyle}>{customer?.phone || "未入力"}</div>
              </div>

              <div style={infoBoxStyle}>
                <div style={infoLabelStyle}>プラン</div>
                <div style={infoValueStyle}>{customer?.plan || "未設定"}</div>
              </div>
            </section>

            <section style={sideCardStyle}>
              <h2 style={sectionTitleStyle}>集計</h2>

              <div style={infoBoxStyle}>
                <div style={infoLabelStyle}>総投稿数</div>
                <div style={infoValueStyle}>{mealCount}件</div>
              </div>

              <div style={infoBoxStyle}>
                <div style={infoLabelStyle}>フィードバック済み</div>
                <div style={infoValueStyle}>{feedbackCount}件</div>
              </div>

              <Link
                href={`/customer/${customerId}/meal/new`}
                style={{
                  ...mainButtonLinkStyle,
                  display: "block",
                  textAlign: "center",
                  marginTop: "10px",
                }}
              >
                新規投稿へ
              </Link>
            </section>
          </div>
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

const mealCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "20px",
  padding: "18px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 18px 0",
  fontSize: "24px",
  fontWeight: 800,
  color: "#111827",
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

const contentBoxStyle: React.CSSProperties = {
  background: "rgba(248,250,252,0.88)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "16px",
  padding: "14px",
};

const contentLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  marginBottom: "8px",
  fontWeight: 700,
};

const contentTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: 1.8,
  whiteSpace: "pre-wrap",
};

const emptyBoxStyle: React.CSSProperties = {
  borderRadius: "18px",
  padding: "24px",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(203,213,225,0.7)",
  color: "#6b7280",
  textAlign: "center",
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

const mainButtonLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "14px",
  padding: "11px 16px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
};

const deleteButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 14px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};