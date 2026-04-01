"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StaffPayslipPage() {
  const [staffName, setStaffName] = useState("スタッフ");

  useEffect(() => {
    const name =
      localStorage.getItem("gymup_current_staff_name") ||
      localStorage.getItem("staffName") ||
      "スタッフ";
    setStaffName(name);
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#e5e7eb_0%,#d1d5db_42%,#9ca3af_100%)] relative overflow-hidden">
      
      {/* 背景ぼかし */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />

      {/* 斜め柄 */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 2px, transparent 2px, transparent 18px)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">

        {/* ヘッダー */}
        <div className="mb-6 rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900">
            スタッフ給与明細
          </h1>
          <p className="text-sm text-gray-700 mt-1">
            {staffName} さんの給与情報
          </p>

          <div className="flex gap-3 mt-4">
            <Link
              href="/attendance/staff"
              className="px-4 py-2 rounded-xl bg-white/30 border border-white/40 text-sm"
            >
              ← 戻る
            </Link>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-black text-white text-sm"
            >
              印刷
            </button>
          </div>
        </div>

        {/* 給与カード */}
        <div className="rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl p-6 shadow-xl">

          <h2 className="text-xl font-bold mb-4 text-gray-900">
            2026年3月給与
          </h2>

          {/* 勤怠 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">勤務情報</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>出勤日数</span>
                <span>22日</span>
              </div>
              <div className="flex justify-between">
                <span>勤務時間</span>
                <span>176時間</span>
              </div>
              <div className="flex justify-between">
                <span>残業</span>
                <span>12時間</span>
              </div>
            </div>
          </div>

          {/* 支給 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">支給</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>基本給</span>
                <span>¥210,000</span>
              </div>
              <div className="flex justify-between">
                <span>残業手当</span>
                <span>¥18,000</span>
              </div>
              <div className="flex justify-between">
                <span>交通費</span>
                <span>¥10,000</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>総支給</span>
                <span>¥238,000</span>
              </div>
            </div>
          </div>

          {/* 控除 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">控除</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>健康保険</span>
                <span>¥12,000</span>
              </div>
              <div className="flex justify-between">
                <span>年金</span>
                <span>¥21,000</span>
              </div>
              <div className="flex justify-between">
                <span>所得税</span>
                <span>¥3,500</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 text-red-600">
                <span>控除合計</span>
                <span>¥36,500</span>
              </div>
            </div>
          </div>

          {/* 手取り */}
          <div className="rounded-xl bg-white/40 p-4 text-center">
            <p className="text-sm">差引支給額</p>
            <p className="text-3xl font-bold">¥201,500</p>
          </div>

        </div>
      </div>
    </div>
  );
}