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
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
        カート
      </h1>

      {remaining > 0 && (
        <div
          style={{
            background: "#e0f2f1",
            padding: 10,
            marginBottom: 20,
            borderRadius: 10,
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
            gap: 10,
            marginBottom: 20,
            borderBottom: "1px solid #ddd",
            paddingBottom: 10,
          }}
        >
          <img src={item.image} width={80} height={80} />

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{item.name}</div>
            <div>{item.price.toLocaleString()}円</div>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={() => updateQuantity(item.id, -1)}>
                −
              </button>
              <div>{item.quantity}</div>
              <button onClick={() => updateQuantity(item.id, 1)}>
                ＋
              </button>
              <button onClick={() => removeItem(item.id)}>削除</button>
            </div>
          </div>

          <div style={{ fontWeight: 600 }}>
            {(item.price * item.quantity).toLocaleString()}円
          </div>
        </div>
      ))}

      <div style={{ fontSize: 18, fontWeight: 700 }}>
        合計: {subtotal.toLocaleString()}円
      </div>

      <button
        style={{
          width: "100%",
          marginTop: 20,
          height: 50,
          background: "black",
          color: "#fff",
          borderRadius: 10,
        }}
      >
        注文に進む
      </button>
    </main>
  );
}