"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

const products: any = {
  "1": {
    name: "WPCプロテイン ピーチ風味",
    price: 2911,
    compare: 3980,
    images: [
      "/protein1.jpg",
      "/protein1.jpg",
      "/protein1.jpg",
    ],
    description:
      "フレッシュなピーチの爽やかさ。飲みやすく続けやすいプロテイン。",
    specs: {
      内容量: "1kg",
      甘味: "★★★★☆",
      酸味: "★★★★☆",
      すっきり: "★★★☆☆",
      クリーミー: "★☆☆☆☆",
    },
  },
};

export default function ProductDetail() {
  const params = useParams();
  const product = products[params.id as string];

  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState(product?.images[0]);

  if (!product) return <div style={{ color: "#fff" }}>商品がありません</div>;

  return (
    <main style={pageStyle}>
      <div style={container}>
        {/* 左：画像 */}
        <div style={left}>
          <img src={mainImg} style={mainImage} />

          <div style={thumbWrap}>
            {product.images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                style={thumb}
                onClick={() => setMainImg(img)}
              />
            ))}
          </div>
        </div>

        {/* 右：情報 */}
        <div style={right}>
          <h1 style={title}>{product.name}</h1>

          <div style={priceWrap}>
            <span style={compare}>¥{product.compare}</span>
            <span style={price}>¥{product.price}</span>
          </div>

          <p style={desc}>{product.description}</p>

          {/* スペック */}
          <div style={specBox}>
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} style={specRow}>
                <span>{k}</span>
                <span>{v as string}</span>
              </div>
            ))}
          </div>

          {/* 数量 */}
          <div style={qtyWrap}>
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={qtyBtn}
            >
              −
            </button>
            <span style={qtyNum}>{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              style={qtyBtn}
            >
              ＋
            </button>
          </div>

          {/* ボタン */}
          <button style={cartBtn}>カートに追加</button>
        </div>
      </div>
    </main>
  );
}

/* ===== スタイル ===== */

const pageStyle = {
  background: "#0f1012",
  color: "#fff",
  minHeight: "100vh",
  padding: "40px 20px",
};

const container = {
  maxWidth: 1100,
  margin: "0 auto",
  display: "flex",
  gap: 40,
  flexWrap: "wrap" as const,
};

const left = {
  flex: 1,
  minWidth: 300,
};

const right = {
  flex: 1,
  minWidth: 300,
};

const mainImage = {
  width: "100%",
  borderRadius: 20,
  marginBottom: 12,
};

const thumbWrap = {
  display: "flex",
  gap: 10,
};

const thumb = {
  width: 60,
  height: 60,
  objectFit: "cover" as const,
  borderRadius: 10,
  cursor: "pointer",
  border: "2px solid transparent",
};

const title = {
  fontSize: 26,
  fontWeight: 900,
  marginBottom: 10,
};

const priceWrap = {
  marginBottom: 10,
};

const compare = {
  textDecoration: "line-through",
  marginRight: 10,
  opacity: 0.5,
};

const price = {
  fontSize: 26,
  fontWeight: 900,
  color: "#f08a27",
};

const desc = {
  marginTop: 10,
  opacity: 0.7,
  lineHeight: 1.6,
};

const specBox = {
  marginTop: 20,
  background: "rgba(255,255,255,0.05)",
  padding: 12,
  borderRadius: 12,
};

const specRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  fontSize: 14,
};

const qtyWrap = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginTop: 20,
};

const qtyBtn = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: "none",
  background: "#222",
  color: "#fff",
  cursor: "pointer",
};

const qtyNum = {
  fontSize: 18,
  fontWeight: 700,
};

const cartBtn = {
  marginTop: 20,
  width: "100%",
  height: 48,
  borderRadius: 12,
  border: "none",
  background: "#f08a27",
  color: "#111",
  fontWeight: 900,
  cursor: "pointer",
};