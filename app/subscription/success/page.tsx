"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const saveOrder = async () => {
      try {
        const res = await fetch("/api/orders/save", {
          method: "POST",
          body: JSON.stringify({ session_id: sessionId }),
        });

        const data = await res.json();

        if (data.ok) {
          setSaved(true);
        } else {
          console.error(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    saveOrder();
  }, [sessionId]);

  return (
    <main style={pageStyle}>
      <div style={card}>
        <h1 style={title}>購入ありがとうございます</h1>

        {loading ? (
          <p>注文を処理中です...</p>
        ) : (
          <>
            <p style={text}>
              ご注文が正常に完了しました。
            </p>

            {saved && (
              <p style={subText}>
                注文履歴に反映されています。
              </p>
            )}

            <div style={btnWrap}>
              <button
                style={mainBtn}
                onClick={() => router.push("/orders")}
              >
                注文履歴を見る
              </button>

              <button
                style={subBtn}
                onClick={() => router.push("/mypage")}
              >
                マイページへ
              </button>

              <button
                style={subBtn}
                onClick={() => router.push("/shop")}
              >
                商品一覧へ戻る
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/* ===== デザイン ===== */

const pageStyle = {
  background: "#0f1012",
  color: "#fff",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const card = {
  background: "rgba(255,255,255,0.05)",
  padding: 30,
  borderRadius: 20,
  textAlign: "center" as const,
  maxWidth: 400,
};

const title = {
  fontSize: 24,
  fontWeight: 900,
  marginBottom: 10,
};

const text = {
  marginTop: 10,
};

const subText = {
  marginTop: 10,
  color: "#f08a27",
};

const btnWrap = {
  marginTop: 20,
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
};

const mainBtn = {
  background: "#f08a27",
  border: "none",
  padding: 12,
  borderRadius: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const subBtn = {
  background: "#222",
  border: "none",
  padding: 10,
  borderRadius: 10,
  color: "#fff",
  cursor: "pointer",
};