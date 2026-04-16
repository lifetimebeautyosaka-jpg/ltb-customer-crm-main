"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SubscriptionSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const hasSavedRef = useRef(false);

  useEffect(() => {
    async function saveOrder() {
      if (!sessionId || hasSavedRef.current) return;

      hasSavedRef.current = true;
      setSaving(true);
      setError("");

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

        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "注文保存に失敗しました");
        }

        setSaved(true);

        // 購入後はカートを空にする
        localStorage.removeItem("cart");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "注文保存に失敗しました");
      } finally {
        setSaving(false);
      }
    }

    void saveOrder();
  }, [sessionId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(255,255,255,0.03) 0%, transparent 26%), linear-gradient(180deg, #0f1012 0%, #16181b 48%, #111214 100%)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 28,
          padding: "34px 24px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 48px rgba(0,0,0,0.24)",
          textAlign: "center",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "rgba(240,138,39,0.14)",
            border: "1px solid rgba(240,138,39,0.24)",
            color: "#f08a27",
            fontSize: 34,
            fontWeight: 900,
            marginBottom: 18,
          }}
        >
          ✓
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 32,
            lineHeight: 1.2,
            fontWeight: 900,
            marginBottom: 12,
          }}
        >
          購入ありがとうございます
        </h1>

        <p
          style={{
            margin: "0 auto 20px",
            maxWidth: 560,
            fontSize: 15,
            lineHeight: 1.9,
            color: "rgba(255,255,255,0.70)",
          }}
        >
          ご注文が正常に完了しました。
          注文情報を会員情報と紐づけて保存しています。
        </p>

        {sessionId && (
          <div
            style={{
              marginBottom: 16,
              fontSize: 12,
              color: "rgba(255,255,255,0.42)",
              wordBreak: "break-all",
            }}
          >
            session_id: {sessionId}
          </div>
        )}

        {saving && (
          <div
            style={{
              marginBottom: 14,
              fontSize: 14,
              color: "#f08a27",
              fontWeight: 800,
            }}
          >
            注文情報を保存中です...
          </div>
        )}

        {saved && (
          <div
            style={{
              marginBottom: 14,
              fontSize: 14,
              color: "#4ade80",
              fontWeight: 800,
            }}
          >
            注文履歴に反映されました
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 14,
              fontSize: 14,
              color: "#f87171",
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gap: 12,
            maxWidth: 320,
            margin: "22px auto 0",
          }}
        >
          <Link href="/orders" style={mainButtonStyle}>
            注文履歴を見る
          </Link>

          <Link href="/mypage" style={subButtonStyle}>
            マイページへ
          </Link>

          <Link href="/shop" style={subButtonStyle}>
            商品一覧へ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

const mainButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 50,
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  background: "#f08a27",
  color: "#111214",
  fontSize: 15,
  fontWeight: 900,
  boxShadow: "0 12px 28px rgba(240,138,39,0.22)",
};

const subButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 800,
};