"use client";

import { useState } from "react";

type PlanKey = "monthly_2" | "monthly_4" | "monthly_8";

const plans: {
  key: PlanKey;
  title: string;
  price: string;
  description: string;
}[] = [
  {
    key: "monthly_2",
    title: "月2回コース",
    price: "17,600円 / 月",
    description: "無理なく続けたい方向けの基本プラン",
  },
  {
    key: "monthly_4",
    title: "月4回コース",
    price: "33,880円 / 月",
    description: "しっかり習慣化したい方向けの人気プラン",
  },
  {
    key: "monthly_8",
    title: "月8回コース",
    price: "66,000円 / 月",
    description: "短期間で結果を出したい方向けの上位プラン",
  },
];

export default function SubscriptionPage() {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const handleCheckout = async (plan: PlanKey) => {
    try {
      setLoadingPlan(plan);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          customerName,
          customerEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "決済ページの作成に失敗しました。");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      alert("決済ページURLの取得に失敗しました。");
    } catch (error) {
      console.error(error);
      alert("通信エラーが発生しました。");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef2f7 50%, #f8fafc 100%)",
        padding: "24px 16px 48px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            サブスク申込
          </div>

          <input
            type="text"
            placeholder="お名前"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              marginBottom: 10,
              padding: "0 12px",
            }}
          />

          <input
            type="email"
            placeholder="メールアドレス"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              padding: "0 12px",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.key}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: 20,
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                {plan.title}
              </h2>

              <p style={{ fontSize: 24, color: "red" }}>
                {plan.price}
              </p>

              <p style={{ fontSize: 14, marginBottom: 20 }}>
                {plan.description}
              </p>

              <button
                onClick={() => handleCheckout(plan.key)}
                disabled={loadingPlan === plan.key}
                style={{
                  width: "100%",
                  height: 45,
                  borderRadius: 10,
                  background: "black",
                  color: "#fff",
                }}
              >
                {loadingPlan === plan.key
                  ? "遷移中..."
                  : "このプランで申し込む"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}