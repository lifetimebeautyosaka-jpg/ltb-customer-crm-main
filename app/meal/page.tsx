"use client";

import Link from "next/link";
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

export default function MealTopPage() {
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

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
        setCustomers(Array.isArray(parsed) ? parsed : []);
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    }
  }, []);

  const customerMealStats = useMemo(() => {
    return customers.map((customer) => {
      try {
        const savedMeals = localStorage.getItem(`gymup_meals_${customer.id}`);
        const meals: Meal[] = savedMeals ? JSON.parse(savedMeals) : [];
        const safeMeals = Array.isArray(meals) ? meals : [];

        const total = safeMeals.length;
        const feedbackDone = safeMeals.filter(
          (meal) => meal.feedback && meal.feedback.trim()
        ).length;

        const latest = [...safeMeals].sort((a, b) => {
          const aTime = new Date(a.createdAt || a.date).getTime();
          const bTime = new Date(b.createdAt || b.date).getTime();
          return bTime - aTime;
        })[0];

        return {
          customer,
          total,
          feedbackDone,
          latestDate: latest?.date || "",
        };
      } catch {
        return {
          customer,
          total: 0,
          feedbackDone: 0,
          latestDate: "",
        };
      }
    });
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const sorted = [...customerMealStats].sort((a, b) => {
      return a.customer.name.localeCompare(b.customer.name, "ja");
    });

    if (!keyword) return sorted;

    return sorted.filter((row) => {
      return (
        row.customer.name.toLowerCase().includes(keyword) ||
        String(row.customer.phone || "").toLowerCase().includes(keyword) ||
        String(row.customer.plan || "").toLowerCase().includes(keyword)
      );
    });
  }, [customerMealStats, search]);

  const totalMeals = useMemo(() => {
    return customerMealStats.reduce((sum, row) => sum + row.total, 0);
  }, [customerMealStats]);

  const totalFeedbackDone = useMemo(() => {
    return customerMealStats.reduce((sum, row) => sum + row.feedbackDone, 0);
  }, [customerMealStats]);

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
                食事管理トップ
              </h1>

              <p
                style={{
                  margin: "10px 0 0 0",
                  fontSize: "15px",
                  color: "#4b5563",
                  lineHeight: 1.8,
                }}
              >
                顧客を選んで、食事投稿一覧・新規投稿・フィードバック管理へ進めます
              </p>
            </div>

            <Link href="/" style={subButtonStyle}>
              ← ホームへ
            </Link>
          </div>
        </div>

        <div style={metricGridStyle}>
          <MetricCard title="顧客数" value={`${customers.length}人`} />
          <MetricCard title="総投稿数" value={`${totalMeals}件`} />
          <MetricCard title="フィードバック済み" value={`${totalFeedbackDone}件`} />
        </div>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <h2 style={sectionTitleStyle}>顧客一覧</h2>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="名前・電話番号・プランで検索"
              style={{ ...inputStyle, maxWidth: "320px" }}
            />
          </div>

          {filteredCustomers.length === 0 ? (
            <div style={emptyBoxStyle}>顧客がまだいません</div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {filteredCustomers.map((row) => (
                <div key={String(row.customer.id)} style={rowCardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "240px" }}>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: 800,
                          color: "#111827",
                          marginBottom: "10px",
                        }}
                      >
                        {row.customer.name}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "10px",
                        }}
                      >
                        <InfoMini label="電話番号" value={row.customer.phone || "未入力"} />
                        <InfoMini label="プラン" value={row.customer.plan || "未設定"} />
                        <InfoMini label="投稿数" value={`${row.total}件`} />
                        <InfoMini
                          label="FB済み"
                          value={`${row.feedbackDone}件`}
                        />
                        <InfoMini
                          label="最新投稿日"
                          value={row.latestDate || "-"}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        minWidth: "170px",
                      }}
                    >
                      <Link
                        href={`/customer/${row.customer.id}/meal`}
                        style={mainButtonLinkStyle}
                      >
                        食事一覧へ
                      </Link>

                      <Link
                        href={`/customer/${row.customer.id}/meal/new`}
                        style={subButtonStyle}
                      >
                        新規投稿
                      </Link>

                      <Link
                        href={`/customer/${row.customer.id}`}
                        style={subButtonStyle}
                      >
                        顧客詳細
                      </Link>
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

function InfoMini({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoMiniStyle}>
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", color: "#111827", fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

const metricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
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

const infoMiniStyle: React.CSSProperties = {
  background: "rgba(248,250,252,0.88)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "14px",
  padding: "12px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800,
  color: "#111827",
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
  textAlign: "center",
};

const mainButtonLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "14px",
  padding: "11px 16px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "center",
};