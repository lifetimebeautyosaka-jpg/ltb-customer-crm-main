"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =============================
   ■ AdminGuard（ここに内蔵）
============================= */
function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    const role = localStorage.getItem("gymup_user_role");

    // 未ログイン
    if (isLoggedIn !== "true") {
      router.replace("/login");
      return;
    }

    // 管理者じゃない
    if (role !== "admin") {
      router.replace("/attendance/staff");
      return;
    }

    setOk(true);
  }, [router]);

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg font-bold">認証確認中...</div>
      </div>
    );
  }

  return <>{children}</>;
}

/* =============================
   ■ メイン
============================= */
type Record = {
  staffName: string;
  minutes: number;
};

export default function AdminTimecardPage() {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    // 仮データ（あとで連動）
    setRecords([
      { staffName: "山口", minutes: 10000 },
      { staffName: "田中", minutes: 8500 },
      { staffName: "佐藤", minutes: 12000 },
    ]);
  }, []);

  const total = useMemo(() => {
    return records.reduce((sum, r) => sum + r.minutes, 0);
  }, [records]);

  const format = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}時間${min}分`;
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[linear-gradient(135deg,#e5e7eb_0%,#d1d5db_42%,#9ca3af_100%)]">

        <div className="max-w-6xl mx-auto p-6">

          {/* ヘッダー */}
          <div className="mb-8 rounded-3xl bg-white/30 backdrop-blur-xl p-6 shadow-xl">
            <h1 className="text-3xl font-bold">
              管理者用タイムカード
            </h1>
            <p className="text-gray-700 mt-2">
              スタッフの勤怠を確認
            </p>

            <Link
              href="/attendance/admin"
              className="inline-block mt-4 px-4 py-2 bg-white rounded-xl"
            >
              ← 戻る
            </Link>
          </div>

          {/* 一覧 */}
          <div className="grid gap-4">
            {records.map((r, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white shadow"
              >
                <div className="flex justify-between">
                  <span>{r.staffName}</span>
                  <span>{format(r.minutes)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 合計 */}
          <div className="mt-6 p-4 bg-black text-white rounded-xl text-xl font-bold text-center">
            合計：{format(total)}
          </div>

        </div>
      </div>
    </AdminGuard>
  );
}