"use client";

import { useSearchParams } from "next/navigation";

export default function SubscriptionSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div>
      success page
      <br />
      session: {sessionId}
    </div>
  );
}