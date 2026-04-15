"use client";

import { useRouter } from "next/navigation";

export default function ShopPage() {
  const router = useRouter();

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>ショップ</h1>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => router.push("/cart")}
          style={{
            height: 50,
            padding: "0 20px",
            background: "black",
            color: "#fff",
            borderRadius: 10,
          }}
        >
          カートを見る
        </button>
      </div>
    </main>
  );
}