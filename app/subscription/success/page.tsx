"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"saving" | "done" | "error">("saving");
  const [message, setMessage] = useState("注文情報を保存しています...");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    async function saveOrder() {
      if (!sessionId) {
        setStatus("error");
        setMessage("session_id が見つかりませんでした。");
        return;
      }

      try {
        const res = await fetch("/api/orders/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data?.error || "注文保存に失敗しました。");
          return;
        }

        setStatus("done");
        setMessage("ご利用ありがとうございます。注文を保存しました。");
        localStorage.removeItem("cart");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage("通信エラーが発生しました。");
      }
    }

    void saveOrder();
  }, [searchParams]);

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
        決済完了
      </h1>

      <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
        {message}
      </p>

      {status === "done" && (
        <button
          onClick={() => router.push("/orders")}
          style={{
            width: "100%",
            height: 50,
            background: "black",
            color: "#fff",
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          注文履歴へ
        </button>
      )}

      {status === "error" && (
        <button
          onClick={() => router.push("/shop")}
          style={{
            width: "100%",
            height: 50,
            background: "#444",
            color: "#fff",
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          商品一覧へ戻る
        </button>
      )}
    </main>
  );
}