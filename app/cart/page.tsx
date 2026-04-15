"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export default function CartPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([
    { id: 1, name: "ヨーグルト風味", price: 2911, quantity: 1 },
    { id: 2, name: "チョコ風味", price: 3200, quantity: 1 },
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

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>カート</h1>

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 20,
            padding: 15,
            background: "#fff",
            borderRadius: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <div>{item.price}円</div>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => updateQuantity(item.id, -1)}>−</button>
              <span style={{ margin: "0 10px" }}>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, 1)}>＋</button>
              <button
                onClick={() => removeItem(item.id)}
                style={{ marginLeft: 10, color: "red" }}
              >
                削除
              </button>
            </div>
          </div>

          <div style={{ fontWeight: 700 }}>
            {item.price * item.quantity}円
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20, fontWeight: 800 }}>
        合計: {total}円
      </div>

      <button
        onClick={() => router.push("/checkout")}
        style={{
          width: "100%",
          height: 50,
          marginTop: 20,
          background: "black",
          color: "#fff",
          borderRadius: 12,
        }}
      >
        注文に進む
      </button>
    </main>
  );
}