"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SubscriptionSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const hasSavedRef = useRef(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId || hasSavedRef.current) {
      setLoading(false);
      return;
    }

    const saveOrder = async () => {
      hasSavedRef.current = true;

      try {
        const customerId = localStorage.getItem("gymup_member_customer_id");

        const res = await fetch("/api/orders/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            customer_id: customerId ? Number(customerId) : null,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          setSaved(true);
          localStorage.removeItem("cart");
        } else {
          setError(data?.error || "注文保存に失敗しました");
          console.error(data);
        }
      } catch (err) {
        console.error(err);
        setError("注文保存中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    void saveOrder();
  }, [sessionId]);

  return (
    <main style={pageStyle}>
      <div style={card}>
        <h1 style={title}>購入ありがとうございます</h1>

        {loading ? (
          <p>注文を処理中です...</p>
        ) : (
          <>
            <p style={text}>ご注文が正常に完了しました。</p>

            {saved ? (
              <p style={subText}>注文履歴に反映されています。</p>
            ) : null}

            {error ? <p style={errorText}>{error}</p> : null}

            <div style={btnWrap}>
              <button
                type="button"
                style={mainBtn}
                onClick={() => router.push("/orders")}
              >
                注文履歴を見る
              </button>

              <button
                type="button"
                style={subBtn}
                onClick={() => router.push("/mypage")}
              >
                マイページへ
              </button>

              <button
                type="button"
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

const pageStyle: React.CSSProperties = {
  background: "#0f1012",
  color: "#fff",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  padding: 30,
  borderRadius: 20,
  textAlign: "center",
  maxWidth: 400,
  width: "100%",
};

const title: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  marginBottom: 10,
};

const text: React.CSSProperties = {
  marginTop: 10,
};

const subText: React.CSSProperties = {
  marginTop: 10,
  color: "#f08a27",
};

const errorText: React.CSSProperties = {
  marginTop: 10,
  color: "#f87171",
};

const btnWrap: React.CSSProperties = {
  marginTop: 20,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const mainBtn: React.CSSProperties = {
  background: "#f08a27",
  border: "none",
  padding: 12,
  borderRadius: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const subBtn: React.CSSProperties = {
  background: "#222",
  border: "none",
  padding: 10,
  borderRadius: 10,
  color: "#fff",
  cursor: "pointer",
};