"use client";

import { useState } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([
    {
      id: 1,
      name: "WPCプロテイン ヨーグルト風味",
      price: 2911,
      quantity: 1,
      image: "https://via.placeholder.com/80",
    },
    {
      id: 2,
      name: "WPCプロテイン チョコ風味",
      price: 3200,
      quantity: 1,
      image: "https://via.placeholder.com/80",
    },
  ]);

  const updateQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const freeShipping = 20000;
  const remaining = freeShipping - subtotal;

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>
        カート
      </h1>

      {remaining > 0 && (
        <div
          style={{
            background: "#e6f4f1",
            padding: 12,
            marginBottom: 20,
            borderRadius: 12,
            fontWeight: 600,
          }}
        >
          あと {remaining.toLocaleString()} 円で送料無料
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            gap: 15,
            marginBottom: 20,
            background: "#fff",
            padding: 15,
            borderRadius: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <img
            src={item.image}
            width={80}
            height={80}
            style={{ borderRadius: 10 }}
          />

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 5 }}>
              {item.name}
            </div>

            <div style={{ color: "#666", marginBottom: 10 }}>
              {item.price.toLocaleString()}円
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => updateQuantity(item.id, -1)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
              >
                −
              </button>

              <div style={{ fontWeight: 600 }}>{item.quantity}</div>

              <button
                onClick={() => updateQuantity(item.id, 1)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
              >
                ＋
              </button>

              <button
                onClick={() => removeItem(item.id)}
                style={{
                  marginLeft: 10,
                  color: "red",
                  fontSize: 12,
                }}
              >
                削除
              </button>
            </div>
          </div>

          <div style={{ fontWeight: 700 }}>
            {(item.price * item.quantity).toLocaleString()}円
          </div>
        </div>
      ))}

      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          marginTop: 20,
        }}
      >
        合計: {subtotal.toLocaleString()}円
      </div>

      <button
        style={{
          width: "100%",
          marginTop: 20,
          height: 55,
          background: "linear-gradient(90deg,#000,#333)",
          color: "#fff",
          borderRadius: 14,
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        注文に進む
      </button>
    </main>
  );
}