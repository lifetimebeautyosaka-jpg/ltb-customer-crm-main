"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  compare: number;
  images: string[];
  description: string;
  specs: Record<string, string>;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

const products: Record<string, Product> = {
  "1": {
    id: "1",
    name: "WPCプロテイン ピーチ風味",
    price: 2911,
    compare: 3980,
    images: ["/protein1.jpg", "/protein1.jpg", "/protein1.jpg"],
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const productId = String(params?.id ?? "");
  const product = products[productId];

  const initialImage = useMemo(
    () => product?.images?.[0] ?? "",
    [product?.images]
  );

  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState(initialImage);

  if (!product) {
    return (
      <main style={pageStyle}>
        <div style={notFoundWrap}>
          <div style={notFoundTitle}>商品が見つかりません</div>
          <Link href="/shop" style={backLinkStyle}>
            商品一覧へ戻る
          </Link>
        </div>
      </main>
    );
  }

  const addToCart = () => {
    try {
      const raw = localStorage.getItem("cart");
      const cart: CartItem[] = raw ? JSON.parse(raw) : [];

      const existing = cart.find((item) => item.id === product.id);

      if (existing) {
        existing.quantity += qty;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          quantity: qty,
        });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      alert("カートに追加しました");
    } catch (error) {
      console.error("cart save error:", error);
      alert("カート追加に失敗しました");
    }
  };

  const buyNow = () => {
    addToCart();
    router.push("/cart");
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={breadcrumbStyle}>
          <Link href="/shop" style={breadcrumbLinkStyle}>
            SHOP
          </Link>
          <span style={breadcrumbDividerStyle}>/</span>
          <span style={breadcrumbCurrentStyle}>{product.name}</span>
        </div>

        <div style={contentStyle}>
          <section style={leftStyle}>
            <div style={mainImageWrapStyle}>
              <img src={mainImg} alt={product.name} style={mainImageStyle} />
            </div>

            <div style={thumbRowStyle}>
              {product.images.map((img, index) => {
                const active = mainImg === img;
                return (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    onClick={() => setMainImg(img)}
                    style={{
                      ...thumbButtonStyle,
                      border: active
                        ? "2px solid #f08a27"
                        : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      style={thumbImageStyle}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <section style={rightStyle}>
            <div style={badgeStyle}>おすすめ</div>

            <h1 style={titleStyle}>{product.name}</h1>

            <div style={priceWrapStyle}>
              <span style={comparePriceStyle}>
                ¥{product.compare.toLocaleString()}
              </span>
              <span style={priceStyle}>¥{product.price.toLocaleString()}</span>
            </div>

            <p style={descStyle}>{product.description}</p>

            <div style={specBoxStyle}>
              <div style={sectionTitleStyle}>商品情報</div>
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} style={specRowStyle}>
                  <span style={specKeyStyle}>{key}</span>
                  <span style={specValueStyle}>{value}</span>
                </div>
              ))}
            </div>

            <div style={qtyAreaStyle}>
              <div style={sectionTitleStyle}>数量</div>

              <div style={qtyWrapStyle}>
                <button
                  type="button"
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  style={qtyBtnStyle}
                >
                  −
                </button>
                <div style={qtyNumStyle}>{qty}</div>
                <button
                  type="button"
                  onClick={() => setQty((prev) => prev + 1)}
                  style={qtyBtnStyle}
                >
                  ＋
                </button>
              </div>
            </div>

            <div style={buttonAreaStyle}>
              <button type="button" style={cartBtnStyle} onClick={addToCart}>
                カートに追加
              </button>

              <button type="button" style={buyBtnStyle} onClick={buyNow}>
                そのままカートへ進む
              </button>
            </div>
          </section>
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
  padding: "40px 16px 60px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const breadcrumbStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 24,
  fontSize: 13,
};

const breadcrumbLinkStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  textDecoration: "none",
  fontWeight: 700,
};

const breadcrumbDividerStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.28)",
};

const breadcrumbCurrentStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.48)",
};

const contentStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 460px)",
  gap: 32,
};

const leftStyle: React.CSSProperties = {
  minWidth: 0,
};

const rightStyle: React.CSSProperties = {
  minWidth: 0,
  borderRadius: 24,
  padding: 24,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  boxShadow: "0 18px 48px rgba(0,0,0,0.24)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

const mainImageWrapStyle: React.CSSProperties = {
  borderRadius: 24,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  boxShadow: "0 18px 48px rgba(0,0,0,0.24)",
  marginBottom: 14,
};

const mainImageStyle: React.CSSProperties = {
  width: "100%",
  display: "block",
  objectFit: "cover",
};

const thumbRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const thumbButtonStyle: React.CSSProperties = {
  width: 74,
  height: 74,
  padding: 0,
  borderRadius: 14,
  overflow: "hidden",
  background: "rgba(255,255,255,0.04)",
  cursor: "pointer",
};

const thumbImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 30,
  padding: "0 12px",
  borderRadius: 9999,
  background: "rgba(240,138,39,0.14)",
  border: "1px solid rgba(240,138,39,0.28)",
  color: "#f08a27",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 14,
};

const titleStyle: React.CSSProperties = {
  fontSize: 30,
  lineHeight: 1.2,
  fontWeight: 900,
  margin: "0 0 14px",
};

const priceWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 12,
  marginBottom: 16,
  flexWrap: "wrap",
};

const comparePriceStyle: React.CSSProperties = {
  textDecoration: "line-through",
  color: "rgba(255,255,255,0.36)",
  fontSize: 16,
};

const priceStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  color: "#f08a27",
  lineHeight: 1,
};

const descStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.70)",
  fontSize: 14,
  lineHeight: 1.9,
  margin: "0 0 22px",
};

const specBoxStyle: React.CSSProperties = {
  borderRadius: 18,
  padding: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "#ffffff",
  marginBottom: 12,
};

const specRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  fontSize: 14,
};

const specKeyStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.56)",
};

const specValueStyle: React.CSSProperties = {
  color: "#ffffff",
  fontWeight: 700,
};

const qtyAreaStyle: React.CSSProperties = {
  marginBottom: 20,
};

const qtyWrapStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
};

const qtyBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: 22,
  cursor: "pointer",
};

const qtyNumStyle: React.CSSProperties = {
  minWidth: 42,
  textAlign: "center",
  fontSize: 18,
  fontWeight: 800,
};

const buttonAreaStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const cartBtnStyle: React.CSSProperties = {
  width: "100%",
  height: 54,
  borderRadius: 14,
  border: "none",
  background: "#f08a27",
  color: "#111214",
  fontSize: 15,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(240,138,39,0.24)",
};

const buyBtnStyle: React.CSSProperties = {
  width: "100%",
  height: 54,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
};

const notFoundWrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 18,
};

const notFoundTitle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  color: "#ffffff",
};

const backLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "0 18px",
  borderRadius: 14,
  background: "#f08a27",
  color: "#111214",
  textDecoration: "none",
  fontWeight: 800,
};