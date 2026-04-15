import { Suspense } from "react";
import SubscriptionSuccessClient from "./SubscriptionSuccessClient";

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
      <SubscriptionSuccessClient />
    </Suspense>
  );
}