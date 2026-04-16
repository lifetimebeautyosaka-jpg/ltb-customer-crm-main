"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  badge?: string;
  desc?: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

const products: Product[] = [
  {
    id: "1",
    name: "WPCプロテイン ベリー風味",
    price: 2911,
    image: "/berry.jpg", // ←ここ変更
    badge: "人気No.1",
    desc: "程よい酸味とベリーの香りで飲みやすさ抜群",
  },
  {
    id: "2",
    name: "WPCプロテイン チョコ風味",
    price: 3200,
    image: "/protein2.jpg",
    badge: "おすすめ",
    desc: "満足感の高いチョコ味",
  },
  {
    id: "3",
    name: "WPCプロテイン 抹茶風味",
    price: 3200,
    image: "/protein3.jpg",
    desc: "和風でスッキリ飲める",
  },
  {
    id: "4",
    name: "WPCプロテイン バナナ風味",
    price: 3200,
    image: "/protein4.jpg",
    desc: "トレーニング後に最適",
  },
];

export default function ShopPage() {
  const addToCart = (product: Product) => {
    const raw = localStorage.getItem("cart");
    const cart: CartItem[] = raw ? JSON.parse(raw) : [];

    const index = cart.findIndex((i) => i.id === product.id);

    if (index >= 0) {
      cart[index].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("カートに追加しました");
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>プロテイン</h1>

        <div style={gridStyle}>
          {products.map((p) => (
            <div key={p.id} style={cardStyle}>
              {p.badge && <div style={badgeStyle}>{p.badge}</div>}

              <Link href={`/shop/${p.id}`}>
                <div style={imageWrap}>
                  <img src={p.image} style={imageStyle} />
                </div>
              </Link>

              <div style={infoStyle}>
                <div style={nameStyle}>{p.name}</div>
                <div style={descStyle}>{p.desc}</div>

                <div style={priceStyle}>¥{p.price.toLocaleString()}</div>

                <button style={btn} onClick={() => addToCart(p)}>
                  カートに追加
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/* ===== スタイル ===== */

const pageStyle: CSSProperties = {
  background: "#fff",
  minHeight: "100vh",
  padding: "40px 16px",
};

const containerStyle: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

const titleStyle: CSSProperties = {
  fontSize: 32,
  fontWeight: 900,
  marginBottom: 20,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)", // ←2カラム
  gap: 16,
};

const cardStyle: CSSProperties = {
  position: "relative",
  border: "1px solid #eee",
  borderRadius: 16,
  overflow: "hidden",
};

const badgeStyle: CSSProperties = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "#111",
  color: "#fff",
  padding: "4px 10px",
  fontSize: 12,
};

const imageWrap: CSSProperties = {
  height: 200,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const imageStyle: CSSProperties = {
  width: "90%",
  objectFit: "contain",
};

const infoStyle: CSSProperties = {
  padding: 12,
};

const nameStyle: CSSProperties = {
  fontWeight: 700,
};

const descStyle: CSSProperties = {
  fontSize: 12,
  color: "#777",
};

const priceStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  margin: "10px 0",
};

const btn: CSSProperties = {
  width: "100%",
  padding: "10px",
  background: "#fff",
  border: "1px solid #111",
  borderRadius: 8,
};