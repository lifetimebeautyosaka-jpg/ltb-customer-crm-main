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
    badge: "人気",
    desc: "フレッシュなピーチの爽やかさ。飲みやすく続けやすい定番フレーバー。",
  },
  {
    id: "2",
    name: "WPCプロテイン チョコ風味",
    price: 3200,
    image: "/protein2.jpg",
    badge: "おすすめ",
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
          <div style={heroBadgeStyle}>PROTEIN SHOP</div>
          <h1 style={titleStyle}>Life Time Beauty Shop</h1>
          <p style={descStyle}>
            トレーニング習慣を支えるプロテインを、見やすく選びやすい形で。
            商品詳細からそのまま購入までつなげられるECページです。
          </p>
        </div>

        <div style={gridStyle}>
          {products.map((p) => (
            <div key={p.id} style={cardStyle}>
              {p.badge ? <div style={badgeStyle}>{p.badge}</div> : null}

              <div style={imageWrapStyle}>
                <img src={p.image} alt={p.name} style={imageStyle} />
              </div>

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
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.03) 0%, transparent 26%), linear-gradient(180deg, #0f1012 0%, #16181b 48%, #111214 100%)",
  color: "#ffffff",
  padding: "32px 16px 56px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const heroStyle: React.CSSProperties = {
  marginBottom: 28,
};

const heroBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 34,
  padding: "0 14px",
  borderRadius: 9999,
  background: "rgba(240,138,39,0.14)",
  border: "1px solid rgba(240,138,39,0.28)",
  color: "#f08a27",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  marginBottom: 14,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 5vw, 46px)",
  lineHeight: 1.1,
  fontWeight: 900,
  letterSpacing: "-0.03em",
};

const descStyle: React.CSSProperties = {
  marginTop: 14,
  maxWidth: 680,
  color: "rgba(255,255,255,0.66)",
  fontSize: 14,
  lineHeight: 1.9,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: 24,
  overflow: "hidden",
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 18px 48px rgba(0,0,0,0.24)",
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 14,
  left: 14,
  zIndex: 2,
  minHeight: 28,
  padding: "0 12px",
  borderRadius: 9999,
  background: "#f08a27",
  color: "#111214",
  display: "inline-flex",
  alignItems: "center",
  fontSize: 12,
  fontWeight: 800,
};

const imageWrapStyle: React.CSSProperties = {
  height: 280,
  background: "rgba(255,255,255,0.02)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const imageStyle: React.CSSProperties = {
  width: "78%",
  height: "78%",
  objectFit: "contain",
  display: "block",
};

const infoStyle: React.CSSProperties = {
  padding: 18,
};

const nameStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1.4,
  marginBottom: 8,
};

const subDescStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.58)",
  fontSize: 13,
  lineHeight: 1.8,
  minHeight: 46,
};

const bottomWrapStyle: React.CSSProperties = {
  marginTop: 16,
};

const priceStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  color: "#f08a27",
  marginBottom: 14,
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
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 800,
};

const cartButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  borderRadius: 12,
  border: "none",
  background: "#f08a27",
  color: "#111214",
  fontSize: 14,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(240,138,39,0.22)",
};

const cartAreaStyle: React.CSSProperties = {
  marginTop: 28,
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
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
};