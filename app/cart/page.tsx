"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);

  // 🔥 初期読み込み
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  // 🔥 更新処理
  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  // 🔥 数量変更
  const updateQuantity = (id: number, delta: number) => {
    const newItems = items.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: Math.max(1, item.quantity + delta),
          }
        : item
    );
    updateCart(newItems);
  };

  // 🔥 削除
  const removeItem = (id: number) => {
    const newItems = items.filter((item) => item.id !== id);
    updateCart(newItems);
  };

  // 🔥 合計
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>カート</h1>

      {items.length === 0 && (
        <p style={{ marginTop: 20 }}>カートは空です</p>
      )}

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
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <div>{item.price.toLocaleString()}円</div>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => updateQuantity(item.id, -1)}>
                −
              </button>

              <span style={{ margin: "0 10px" }}>
                {item.quantity}
              </span>

              <button onClick={() => updateQuantity(item.id, 1)}>
                ＋
              </button>

              <button
                onClick={() => removeItem(item.id)}
                style={{ marginLeft: 10, color: "red" }}
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

      {items.length > 0 && (
        <>
          <div
            style={{
              marginTop: 20,
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            合計: {total.toLocaleString()}円
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
              fontWeight: 700,
            }}
          >
            注文に進む
          </button>
        </>
      )}
    </main>
  );
}