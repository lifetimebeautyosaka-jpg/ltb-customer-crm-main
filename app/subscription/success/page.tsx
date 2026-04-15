import { Suspense } from "react";
import SubscriptionSuccessClient from "./SubscriptionSuccessClient";

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <SubscriptionSuccessClient />
    </Suspense>
  );
}