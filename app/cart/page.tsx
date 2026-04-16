"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart");
      const data = raw ? JSON.parse(raw) : [];
      console.log("cart loaded:", data);
      setCart(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("cart parse error:", error);
      setCart([]);
    } finally {
      setLoaded(true);
    }
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

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("カートが空です");
      return;
    }
    router.push("/checkout");
  };

  if (!loaded) {
    return (
      <main style={pageStyle}>
        <h1 style={title}>カート</h1>
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerRowStyle}>
          <h1 style={title}>カート</h1>
          <button
            type="button"
            style={shopBackBtnStyle}
            onClick={() => router.push("/shop")}
          >
            商品一覧へ戻る
          </button>
        </div>

        {cart.length === 0 ? (
          <div style={emptyBoxStyle}>
            <div style={emptyTitleStyle}>カートは空です</div>
            <div style={emptyTextStyle}>
              商品詳細ページから「カートに追加」を押すと、ここに表示されます。
            </div>
          </div>
        ) : (
          <>
            <div style={listStyle}>
              {cart.map((item) => (
                <div key={item.id} style={cardStyle}>
                  <img src={item.image} alt={item.name} style={imgStyle} />

                  <div style={infoStyle}>
                    <div style={nameStyle}>{item.name}</div>
                    <div style={priceStyle}>¥{item.price.toLocaleString()}</div>

                    <div style={qtyWrapStyle}>
                      <button
                        type="button"
                        style={qtyBtnStyle}
                        onClick={() => changeQty(item.id, -1)}
                      >
                        −
                      </button>
                      <span style={qtyNumStyle}>{item.quantity}</span>
                      <button
                        type="button"
                        style={qtyBtnStyle}
                        onClick={() => changeQty(item.id, 1)}
                      >
                        ＋
                      </button>
                    </div>
                  </div>

                  <div style={rightStyle}>
                    <div style={subtotalStyle}>
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </div>
                    <button
                      type="button"
                      style={removeBtnStyle}
                      onClick={() => removeItem(item.id)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={summaryBoxStyle}>
              <div style={summaryRowStyle}>
                <span>商品数</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>

              <div style={summaryRowStyle}>
                <span>合計</span>
                <span style={totalPriceStyle}>¥{total.toLocaleString()}</span>
              </div>

              <button
                type="button"
                style={checkoutBtnStyle}
                onClick={handleCheckout}
              >
                購入へ進む
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.03) 0%, transparent 26%), linear-gradient(180deg, #0f1012 0%, #16181b 48%, #111214 100%)",
  color: "#fff",
  padding: "24px 16px 48px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 20,
  flexWrap: "wrap",
};

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  margin: 0,
};

const shopBackBtnStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "0 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const emptyBoxStyle: React.CSSProperties = {
  borderRadius: 18,
  padding: 24,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 8,
};

const emptyTextStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.64)",
  lineHeight: 1.8,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const cardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "96px minmax(0,1fr) auto",
  gap: 16,
  alignItems: "center",
  background: "rgba(255,255,255,0.05)",
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
};

const imgStyle: React.CSSProperties = {
  width: 96,
  height: 96,
  objectFit: "cover",
  borderRadius: 12,
  background: "#111",
};

const infoStyle: React.CSSProperties = {
  minWidth: 0,
};

const nameStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 16,
  marginBottom: 6,
};

const priceStyle: React.CSSProperties = {
  color: "#f08a27",
  fontWeight: 800,
  marginBottom: 10,
};

const qtyWrapStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
};

const qtyBtnStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 18,
};

const qtyNumStyle: React.CSSProperties = {
  minWidth: 28,
  textAlign: "center",
  fontWeight: 800,
};

const rightStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "end",
};

const subtotalStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
};

const removeBtnStyle: React.CSSProperties = {
  background: "rgba(255, 77, 77, 0.16)",
  border: "1px solid rgba(255, 77, 77, 0.28)",
  color: "#ff7a7a",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const summaryBoxStyle: React.CSSProperties = {
  marginTop: 20,
  borderRadius: 18,
  padding: 20,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
  fontSize: 16,
};

const totalPriceStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  color: "#f08a27",
};

const checkoutBtnStyle: React.CSSProperties = {
  marginTop: 12,
  width: "100%",
  height: 52,
  background: "#f08a27",
  border: "none",
  borderRadius: 12,
  fontWeight: 900,
  color: "#111",
  cursor: "pointer",
  fontSize: 15,
};