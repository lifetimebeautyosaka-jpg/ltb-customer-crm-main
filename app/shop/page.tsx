"use client";

import Link from "next/link";

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
    name: "WPCプロテイン ピーチ風味",
    price: 2911,
    image: "/protein1.jpg",
    badge: "Popular",
    desc: "フレッシュなピーチの爽やかさ。飲みやすく続けやすい定番フレーバー。",
  },
  {
    id: "2",
    name: "WPCプロテイン チョコ風味",
    price: 3200,
    image: "/protein2.jpg",
    badge: "Recommended",
    desc: "甘さとコクのバランスが良い、満足感のあるチョコフレーバー。",
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
          <h1 style={titleStyle}>Goods</h1>
          <p style={descStyle}>
            毎日のコンディションづくりやトレーニング習慣を支えるアイテムを、
            シンプルで見やすく、選びやすい形でまとめたショッピングページです。
          </p>
        </div>

        <div style={gridStyle}>
          {products.map((p) => (
            <div key={p.id} style={cardStyle}>
              {p.badge ? <div style={badgeStyle}>{p.badge}</div> : null}

              <Link href={`/shop/${p.id}`} style={imageWrapLinkStyle}>
                <div style={imageWrapStyle}>
                  <img src={p.image} alt={p.name} style={imageStyle} />
                </div>
              </Link>

              <div style={infoStyle}>
                <div style={nameStyle}>{p.name}</div>
                <div style={subDescStyle}>{p.desc}</div>

                <div style={bottomWrapStyle}>
                  <div style={priceStyle}>¥{p.price.toLocaleString()}</div>

                  <div style={buttonWrapStyle}>
                    <Link href={`/shop/${p.id}`} style={detailLinkStyle}>
                      詳細を見る
                    </Link>

                    <button
                      type="button"
                      style={cartButtonStyle}
                      onClick={() => addToCart(p)}
                    >
                      カートに追加
                    </button>
                  </div>
                </div>
              </div>
            </div>
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

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
  color: "#111827",
  padding: "40px 16px 64px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const heroStyle: React.CSSProperties = {
  marginBottom: 36,
};

const heroBadgeStyle: React.CSSProperties = {
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

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 5vw, 52px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
  color: "#111827",
};

const descStyle: React.CSSProperties = {
  marginTop: 14,
  maxWidth: 720,
  color: "#6b7280",
  fontSize: 14,
  lineHeight: 1.9,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 22,
};

const cardStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: 24,
  overflow: "hidden",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 14,
  left: 14,
  zIndex: 2,
  minHeight: 28,
  padding: "0 12px",
  borderRadius: 9999,
  background: "#111827",
  color: "#ffffff",
  display: "inline-flex",
  alignItems: "center",
  fontSize: 12,
  fontWeight: 800,
};

const imageWrapLinkStyle: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
};

const imageWrapStyle: React.CSSProperties = {
  height: 280,
  background: "#f9fafb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottom: "1px solid #f1f5f9",
};

const imageStyle: React.CSSProperties = {
  width: "78%",
  height: "78%",
  objectFit: "contain",
  display: "block",
};

const infoStyle: React.CSSProperties = {
  padding: 20,
};

const nameStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1.45,
  marginBottom: 8,
  color: "#111827",
};

const subDescStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: 13,
  lineHeight: 1.8,
  minHeight: 46,
};

const bottomWrapStyle: React.CSSProperties = {
  marginTop: 18,
};

const priceStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  color: "#111827",
  marginBottom: 14,
  letterSpacing: "-0.03em",
};

const buttonWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const detailLinkStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  background: "#ffffff",
  border: "1px solid #d1d5db",
  color: "#111827",
  fontSize: 14,
  fontWeight: 800,
};

const cartButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  borderRadius: 12,
  border: "none",
  background: "#111827",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(17,24,39,0.16)",
};

const cartAreaStyle: React.CSSProperties = {
  marginTop: 32,
  display: "flex",
  justifyContent: "center",
};

const goCartStyle: React.CSSProperties = {
  minHeight: 50,
  padding: "0 22px",
  borderRadius: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#111827",
  border: "1px solid #111827",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
  boxShadow: "0 10px 24px rgba(17,24,39,0.14)",
};