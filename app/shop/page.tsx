"use client";

import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "WPCプロテイン ヨーグルト風味",
    price: 2911,
    image: "https://via.placeholder.com/300x200",
  },
  {
    id: 2,
    name: "WPCプロテイン チョコ風味",
    price: 3200,
    image: "https://via.placeholder.com/300x200",
  },
  {
    id: 3,
    name: "WPCプロテイン 抹茶風味",
    price: 3100,
    image: "https://via.placeholder.com/300x200",
  },
];

export default function ShopPage() {
  const router = useRouter();

  const addToCart = (product: Product) => {
    const existing = JSON.parse(localStorage.getItem("cart") || "[]");

    const found = existing.find((item: any) => item.id === product.id);

    if (found) {
      found.quantity += 1;
    } else {
      existing.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(existing));

    alert("カートに追加しました");
  };

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 20 }}>
        プロテイン一覧
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              background: "#fff",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src={product.image}
              style={{ width: "100%", height: 180, objectFit: "cover" }}
            />

            <div style={{ padding: 15 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                {product.name}
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                {product.price.toLocaleString()}円
              </div>

              <button
                onClick={() => addToCart(product)}
                style={{
                  width: "100%",
                  height: 45,
                  background: "black",
                  color: "#fff",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                カートに追加
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/cart")}
        style={{
          marginTop: 30,
          width: "100%",
          height: 50,
          background: "#111",
          color: "#fff",
          borderRadius: 12,
          fontWeight: 700,
        }}
      >
        カートを見る
      </button>
    </main>
  );
}