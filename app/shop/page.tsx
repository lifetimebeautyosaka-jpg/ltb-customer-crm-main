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
    badge: "人気No.1",
    desc: "飲みやすさNo.1の定番フレーバー",
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
    desc: "トレ後に最適な甘さ",
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
        
        {/* タイトル */}
        <h1 style={titleStyle}>プロテイン</h1>

        {/* カテゴリ */}
        <div style={categoryWrap}>
          <div style={categoryActive}>プロテイン</div>

          <Link href="/shop/apparel" style={categoryBtn}>
            アパレル
          </Link>
        </div>

        {/* 商品 */}
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

                <button
                  style={cartBtn}
                  onClick={() => addToCart(p)}
                >
                  カートに追加
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* カート */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/cart" style={goCart}>
            カートを見る
          </Link>
        </div>

      </div>
    </main>
  );
}

/* ===== スタイル ===== */

const pageStyle = {
  background: "#fff",
  minHeight: "100vh",
  padding: "40px 16px",
};

const containerStyle = {
  maxWidth: 1100,
  margin: "0 auto",
};

const titleStyle = {
  fontSize: 36,
  fontWeight: 900,
  marginBottom: 20,
};

const categoryWrap = {
  display: "flex",
  gap: 12,
  marginBottom: 24,
};

const categoryActive = {
  padding: "10px 16px",
  background: "#111",
  color: "#fff",
  borderRadius: 8,
  fontWeight: 700,
};

const categoryBtn = {
  padding: "10px 16px",
  border: "1px solid #ddd",
  borderRadius: 8,
  textDecoration: "none",
  color: "#111",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))",
  gap: 20,
};

const cardStyle = {
  border: "1px solid #eee",
  borderRadius: 16,
  overflow: "hidden",
};

const badgeStyle = {
  position: "absolute",
  background: "#111",
  color: "#fff",
  padding: "4px 10px",
  fontSize: 12,
};

const imageWrap = {
  height: 220,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const imageStyle = {
  width: "70%",
};

const infoStyle = {
  padding: 16,
};

const nameStyle = {
  fontWeight: 700,
};

const descStyle = {
  fontSize: 12,
  color: "#777",
  margin: "8px 0",
};

const priceStyle = {
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 10,
};

const cartBtn = {
  width: "100%",
  padding: "10px",
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 8,
};

const goCart = {
  background: "#111",
  color: "#fff",
  padding: "12px 20px",
  borderRadius: 8,
  textDecoration: "none",
};