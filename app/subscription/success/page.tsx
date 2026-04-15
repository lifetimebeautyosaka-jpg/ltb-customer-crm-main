"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SubscriptionSuccessContent() {
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
        const res = await fetch("/api/orders/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "注文保存に失敗しました");
        }

        setSaved(true);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "注文保存に失敗しました");
      } finally {
        setSaving(false);
      }
    }

    saveOrder();
  }, [sessionId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f1012",
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
          maxWidth: 680,
          borderRadius: 28,
          padding: "32px 24px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 48px rgba(0,0,0,0.24)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(240,138,39,0.14)",
            color: "#f08a27",
            fontSize: 32,
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
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          お申し込みありがとうございます
        </h1>

        <p
          style={{
            margin: "0 auto 22px",
            maxWidth: 520,
            fontSize: 15,
            lineHeight: 1.9,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          サブスクリプションのお申し込みが完了しました。
          内容確認後、会員ページからご利用状況をご確認いただけます。
        </p>

        {sessionId && (
          <div
            style={{
              marginBottom: 18,
              fontSize: 12,
              color: "rgba(255,255,255,0.48)",
              wordBreak: "break-all",
            }}
          >
            session_id: {sessionId}
          </div>
        )}

        {saving && (
          <div
            style={{
              marginBottom: 16,
              fontSize: 14,
              color: "#f08a27",
              fontWeight: 700,
            }}
          >
            注文情報を保存中です...
          </div>
        )}

        {saved && (
          <div
            style={{
              marginBottom: 16,
              fontSize: 14,
              color: "#22c55e",
              fontWeight: 700,
            }}
          >
            注文情報の保存が完了しました
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 16,
              fontSize: 14,
              color: "#f87171",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 18,
          }}
        >
          <Link href="/mypage" style={primaryButtonStyle}>
            会員マイページへ
          </Link>

          <Link href="/subscription" style={secondaryButtonStyle}>
            サブスク一覧へ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: "#0f1012",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontSize: 14,
          }}
        >
          読み込み中...
        </main>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "0 18px",
  borderRadius: 16,
  background: "#f08a27",
  color: "#141414",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 800,
  boxShadow: "0 12px 28px rgba(240,138,39,0.22)",
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "0 18px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#f5f7fa",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
};