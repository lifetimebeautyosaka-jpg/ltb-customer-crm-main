"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "monthly_2", // 仮（あとでcart連携できる）
          customerName: "テストユーザー",
          customerEmail: "test@example.com",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "決済作成失敗");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("URL取得失敗");
      }
    } catch (error) {
      console.error(error);
      alert("通信エラー");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>
        チェックアウト
      </h1>

      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <p style={{ marginBottom: 20 }}>
          内容を確認して決済へ進んでください
        </p>

        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            width: "100%",
            height: 50,
            background: "black",
            color: "#fff",
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          {loading ? "処理中..." : "決済に進む"}
        </button>
      </div>
    </main>
  );
}