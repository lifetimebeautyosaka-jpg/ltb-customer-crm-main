"use client";

import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>
        チェックアウト
      </h1>

      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <p style={{ marginBottom: 20 }}>
          ご注文内容を確認して決済へ進んでください。
        </p>

        <button
          onClick={() => alert("ここでStripe決済に接続")}
          style={{
            width: "100%",
            height: 50,
            background: "black",
            color: "#fff",
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          決済に進む
        </button>
      </div>

      <button
        onClick={() => router.push("/cart")}
        style={{ marginTop: 20 }}
      >
        ← カートに戻る
      </button>
    </main>
  );
}