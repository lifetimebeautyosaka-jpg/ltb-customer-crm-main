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
    price: 4980,
    image: "/berry.jpg",
    badge: "人気No.1",
    desc: "程よい酸味とベリーの香りで、プロテインタイムを楽しめる人気フレーバー。",
  },
  {
    id: "2",
    name: "WPCプロテイン チョコ風味",
    price: 4980,
    image: "/wpc_02_choco_01.jpg",
    badge: "おすすめ",
    desc: "満足感のあるコクで、毎日続けやすい定番フレーバー。",
  },
  {
    id: "3",
    name: "WPCプロテイン よう振るとヨーグルト風味風味",
    price: 4980,
    image: "/ygr.png",
    desc: "甘すぎない、酸っぱすぎない毎日飲める味。",
  },
  {
    id: "4",
    name: "WPCプロテイン 初恋のいちご風味",
    price: 4980,
    image: "/wpc_13_strawberry_01.jpg",
    desc: "自然な甘さでトレーニング後にも飲みやすいイチゴフレーバー。",
  },
];

export default function ShopPage() {
  const addToCart = (product: Product) => {
    try {
      const raw = localStorage.getItem("cart");
      const cart: CartItem[] = raw ? JSON.parse(raw) : [];

      const existingIndex = cart.findIndex((item) => item.id === product.id);

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      alert("カートに追加しました");
    } catch (error) {
      console.error("cart add error:", error);
      alert("カート追加に失敗しました");
    }
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={heroStyle}>
          <div style={heroBadgeStyle}>ONLINE STORE</div>
          <h1 style={titleStyle}>プロテイン</h1>
          <p style={heroDescStyle}>
            毎日のコンディションづくりやトレーニング習慣を支えるアイテムを、
            シンプルで見やすく、選びやすい形でまとめたショッピングページです。
          </p>

          <div style={categoryWrapStyle}>
            <div style={categoryActiveStyle}>プロテイン</div>
            <Link href="/shop/apparel" style={categoryLinkStyle}>
              アパレル
            </Link>
          </div>
        </div>

        <div style={gridStyle}>
          {products.map((product) => (
            <article key={product.id} style={cardStyle}>
              {product.badge ? <div style={badgeStyle}>{product.badge}</div> : null}

              <Link href={`/shop/${product.id}`} style={imageLinkStyle}>
                <div style={imageWrapStyle}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={imageStyle}
                    loading="lazy"
                  />
                </div>
              </Link>

              <div style={infoStyle}>
                <h2 style={nameStyle}>{product.name}</h2>
                <p style={productDescStyle}>{product.desc}</p>

                <div style={bottomWrapStyle}>
                  <div style={priceStyle}>¥{product.price.toLocaleString()}</div>

                  <div style={buttonWrapStyle}>
                    <Link href={`/shop/${product.id}`} style={outlineButtonStyle}>
                      詳細を見る
                    </Link>

                    <button
                      type="button"
                      style={outlineButtonStyle}
                      onClick={() => addToCart(product)}
                    >
                      カートに追加
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div style={cartAreaStyle}>
          <Link href="/cart" style={goCartStyle}>
            カートを見る
          </Link>
        </div>
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
  color: "#111827",
  padding: "40px 16px 64px",
};

const containerStyle: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

const heroStyle: CSSProperties = {
  marginBottom: 36,
};

const heroBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 34,
  padding: "0 14px",
  borderRadius: 9999,
  background: "#f5f5f5",
  border: "1px solid #e5e7eb",
  color: "#374151",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  marginBottom: 14,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 5vw, 52px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
  color: "#111827",
};

const heroDescStyle: CSSProperties = {
  marginTop: 14,
  maxWidth: 720,
  color: "#6b7280",
  fontSize: 14,
  lineHeight: 1.9,
};

const categoryWrapStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 22,
};

const categoryActiveStyle: CSSProperties = {
  minHeight: 42,
  padding: "0 18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#111827",
  color: "#ffffff",
  borderRadius: 12,
  fontWeight: 800,
  fontSize: 14,
};

const categoryLinkStyle: CSSProperties = {
  minHeight: 42,
  padding: "0 18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #111827",
  borderRadius: 12,
  textDecoration: "none",
  color: "#111827",
  fontWeight: 700,
  fontSize: 14,
  background: "#ffffff",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 16,
};

const cardStyle: CSSProperties = {
  position: "relative",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  overflow: "hidden",
  background: "#ffffff",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
};

const badgeStyle: CSSProperties = {
  position: "absolute",
  top: 14,
  left: 14,
  zIndex: 2,
  background: "#111827",
  color: "#ffffff",
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
  borderRadius: 9999,
};

const imageLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
};

const imageWrapStyle: CSSProperties = {
  height: 320,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#ffffff",
  borderBottom: "1px solid #f1f5f9",
  padding: 12,
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
};

const infoStyle: CSSProperties = {
  padding: 16,
};

const nameStyle: CSSProperties = {
  margin: 0,
  fontWeight: 800,
  fontSize: 18,
  lineHeight: 1.5,
  color: "#111827",
};

const productDescStyle: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  margin: "8px 0 0",
  lineHeight: 1.8,
  minHeight: 44,
};

const bottomWrapStyle: CSSProperties = {
  marginTop: 16,
};

const priceStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  marginBottom: 12,
  color: "#111827",
  letterSpacing: "-0.03em",
};

const buttonWrapStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const outlineButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 46,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #111827",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};

const cartAreaStyle: CSSProperties = {
  textAlign: "center",
  marginTop: 40,
};

const goCartStyle: CSSProperties = {
  background: "#ffffff",
  color: "#111827",
  padding: "12px 20px",
  borderRadius: 12,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  border: "1px solid #111827",
};