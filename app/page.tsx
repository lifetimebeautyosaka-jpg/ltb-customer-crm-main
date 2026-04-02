"use client";

import Link from "next/link";
import CRMLayout from "./components/CRMLayout";

export default function HomePage() {
  return (
    <CRMLayout title="ホーム">
      <div style={{ padding: 20 }}>
        <h1>GYMUP CRM</h1>

        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <Link href="/customer">顧客管理</Link>
          <Link href="/reservation">予約管理</Link>
          <Link href="/sales">売上管理</Link>
          <Link href="/accounting">会計管理</Link>
        </div>
      </div>
    </CRMLayout>
  );
}