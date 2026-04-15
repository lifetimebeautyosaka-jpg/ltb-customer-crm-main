"use client";

const products = [
  {
    id: 1,
    name: "WPCプロテイン ヨーグルト風味",
    price: 2911,
    image: "/protein1.jpg",
    badge: "人気",
  },
  {
    id: 2,
    name: "WPCプロテイン チョコ風味",
    price: 3200,
    image: "/protein2.jpg",
    badge: "おすすめ",
  },
];

export default function ShopPage() {
  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>PROTEIN SHOP</h1>

      <div style={gridStyle}>
        {products.map((p) => (
          <div key={p.id} style={cardStyle}>
            <div style={badgeStyle}>{p.badge}</div>

            <div style={imageWrap}>
              <img
                src={p.image}
                alt={p.name}
                style={imageStyle}
              />
            </div>

            <div style={infoStyle}>
              <div style={nameStyle}>{p.name}</div>

              <div style={priceStyle}>
                ¥{p.price.toLocaleString()}
              </div>

              <button style={buttonStyle}>
                カートに追加
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0f1012",
  color: "#fff",
  padding: "40px 20px",
};

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "32px",
  fontWeight: 900,
  marginBottom: 30,
  letterSpacing: "2px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 20,
  maxWidth: 1000,
  margin: "0 auto",
};

const cardStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: 20,
  overflow: "hidden",
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "#f08a27",
  padding: "4px 10px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
};

const imageWrap: React.CSSProperties = {
  height: 220,
  background: "#111",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const imageStyle: React.CSSProperties = {
  maxWidth: "80%",
  maxHeight: "80%",
  objectFit: "contain",
};

const infoStyle: React.CSSProperties = {
  padding: 16,
};

const nameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 8,
};

const priceStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 12,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 10,
  border: "none",
  background: "#f08a27",
  color: "#111",
  fontWeight: 800,
  cursor: "pointer",
};