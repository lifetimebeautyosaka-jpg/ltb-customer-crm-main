"use client";

import Link from "next/link";
import AdminGuard from "../../../components/AdminGuard";

export default function AdminTopPage() {
  return (
    <AdminGuard>
      <div className="min-h-screen relative overflow-hidden bg-[linear-gradient(135deg,#e5e7eb_0%,#d1d5db_42%,#9ca3af_100%)]">
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 2px, transparent 2px, transparent 18px)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8 rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/40 border border-white/40 flex items-center justify-center shadow-inner overflow-hidden">
                  <img
                    src="/gymup-logo.png"
                    alt="GYMUP"
                    className="h-11 w-11 object-contain"
                  />
                </div>

                <div>
                  <p className="text-xs tracking-[0.25em] text-gray-700/80 font-semibold">
                    GYMUP CRM
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    管理者用トップ
                  </h1>
                  <p className="text-sm text-gray-700 mt-1">
                    管理者が勤怠・給与関連を確認する入口です。
                  </p>
                </div>
              </div>

              <Link
                href="/attendance"
                className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/25 px-5 py-3 text-sm font-semibold text-gray-900 backdrop-blur-md shadow hover:bg-white/35 transition"
              >
                ← 勤怠トップへ戻る
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/attendance/admin/timecard"
              className="group rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6 md:p-7 hover:bg-white/28 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.2em] text-gray-600 font-semibold mb-2">
                    ADMIN TIMECARD
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    管理者用タイムカード
                  </h2>
                  <p className="text-sm text-gray-700 leading-7">
                    全スタッフの勤怠、勤務時間、月別集計を確認できます。
                  </p>
                </div>

                <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition">
                  ⏰
                </div>
              </div>

              <div className="mt-6">
                <span className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg">
                  開く
                </span>
              </div>
            </Link>

            <Link
              href="/attendance/admin/wage-ledger"
              className="group rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6 md:p-7 hover:bg-white/28 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.2em] text-gray-600 font-semibold mb-2">
                    WAGE LEDGER
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    賃金台帳
                  </h2>
                  <p className="text-sm text-gray-700 leading-7">
                    給与集計やCSV出力を確認できます。
                  </p>
                </div>

                <div className="h-12 w-12 rounded-2xl bg-red-500 text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition">
                  ¥
                </div>
              </div>

              <div className="mt-6">
                <span className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg">
                  開く
                </span>
              </div>
            </Link>

            <Link
              href="/attendance/admin/payslip"
              className="group rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6 md:p-7 hover:bg-white/28 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.2em] text-gray-600 font-semibold mb-2">
                    PAYSLIP
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    給与明細管理
                  </h2>
                  <p className="text-sm text-gray-700 leading-7">
                    スタッフ別の給与明細を確認・管理します。
                  </p>
                </div>

                <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition">
                  📄
                </div>
              </div>

              <div className="mt-6">
                <span className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg">
                  開く
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}