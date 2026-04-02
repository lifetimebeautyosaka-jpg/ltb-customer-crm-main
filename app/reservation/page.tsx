"use client";

import Link from "next/link";

export default function ReservationPage() {
  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>予約ページ（復旧）</h1>

      <a
        href="/reservation/new"
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "10px 20px",
          background: "black",
          color: "white",
          borderRadius: "10px",
        }}
      >
        新規予約
      </a>
    </main>
  );
}