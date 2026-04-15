"use client";

import { useEffect, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "決済失敗");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      alert("通信エラー");
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>
        チェックアウト
      </h1>

      {items.map((item) => (
        <div key={item.id} style={{ marginTop: 10 }}>
          {item.name} × {item.quantity}
        </div>
      ))}

      <div style={{ marginTop: 20, fontWeight: 800 }}>
        合計: {total.toLocaleString()}円
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          width: "100%",
          height: 50,
          marginTop: 20,
          background: "black",
          color: "#fff",
          borderRadius: 12,
        }}
      >
        {loading ? "処理中..." : "決済に進む"}
      </button>
    </main>
  );
}