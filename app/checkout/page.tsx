"use client";

import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }, []);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("カートが空です");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ items: cart }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("決済エラー");
    }

    setLoading(false);
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main style={pageStyle}>
      <h1 style={title}>購入確認</h1>

      {cart.map((item, i) => (
        <div key={i} style={card}>
          <p>{item.name}</p>
          <p>¥{item.price}</p>
          <p>数量: {item.quantity}</p>
        </div>
      ))}

      <div style={totalBox}>
        合計：¥{total.toLocaleString()}
      </div>

      <button style={btn} onClick={handleCheckout}>
        {loading ? "処理中..." : "決済する"}
      </button>
    </main>
  );
}

const pageStyle = {
  background: "#0f1012",
  color: "#fff",
  minHeight: "100vh",
  padding: 20,
};

const title = {
  fontSize: 24,
  fontWeight: 900,
};

const card = {
  background: "#222",
  padding: 10,
  marginTop: 10,
};

const totalBox = {
  marginTop: 20,
  fontSize: 20,
  fontWeight: 900,
};

const btn = {
  marginTop: 20,
  padding: 12,
  background: "#f08a27",
  border: "none",
  fontWeight: 900,
  cursor: "pointer",
};