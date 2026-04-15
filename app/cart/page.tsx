"use client";

import { useEffect, useState } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const removeItem = (id: string) => {
    const newCart = cart.filter((item) => item.id !== id);
    updateCart(newCart);
  };

  const changeQty = (id: string, delta: number) => {
    const newCart = cart.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          quantity: Math.max(1, item.quantity + delta),
        };
      }
      return item;
    });
    updateCart(newCart);
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main style={pageStyle}>
      <h1 style={title}>カート</h1>

      {cart.length === 0 ? (
        <p>カートは空です</p>
      ) : (
        <>
          {cart.map((item) => (
            <div key={item.id} style={card}>
              <img src={item.image} style={img} />

              <div style={{ flex: 1 }}>
                <div style={name}>{item.name}</div>
                <div style={price}>¥{item.price}</div>

                <div style={qtyWrap}>
                  <button onClick={() => changeQty(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => changeQty(item.id, 1)}>+</button>
                </div>
              </div>

              <button
                style={removeBtn}
                onClick={() => removeItem(item.id)}
              >
                削除
              </button>
            </div>
          ))}

          <div style={totalBox}>
            <div>合計</div>
            <div style={totalPrice}>
              ¥{total.toLocaleString()}
            </div>
          </div>

          <button style={checkoutBtn}>
            購入へ進む
          </button>
        </>
      )}
    </main>
  );
}

/* ===== スタイル ===== */

const pageStyle = {
  background: "#0f1012",
  color: "#fff",
  minHeight: "100vh",
  padding: 20,
};

const title = {
  fontSize: 24,
  fontWeight: 900,
  marginBottom: 20,
};

const card = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  background: "rgba(255,255,255,0.05)",
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
};

const img = {
  width: 80,
  height: 80,
  objectFit: "cover" as const,
  borderRadius: 10,
};

const name = {
  fontWeight: 700,
};

const price = {
  color: "#f08a27",
  marginTop: 4,
};

const qtyWrap = {
  display: "flex",
  gap: 10,
  marginTop: 10,
};

const removeBtn = {
  background: "red",
  border: "none",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
};

const totalBox = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 20,
  fontSize: 18,
};

const totalPrice = {
  fontWeight: 900,
  color: "#f08a27",
};

const checkoutBtn = {
  marginTop: 20,
  width: "100%",
  height: 50,
  background: "#f08a27",
  border: "none",
  borderRadius: 10,
  fontWeight: 900,
  cursor: "pointer",
};