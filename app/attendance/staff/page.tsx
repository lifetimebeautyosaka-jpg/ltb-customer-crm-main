"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function StaffPage() {
  const [staffName, setStaffName] = useState("スタッフ");

  useEffect(() => {
    const savedName =
      localStorage.getItem("gymup_current_staff_name") ||
      localStorage.getItem("staffName") ||
      "スタッフ";
    setStaffName(savedName);
  }, []);

  return (
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
        {/* HEADER */}
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
                  STAFF DASHBOARD
                </h1>
                <p className="text-sm text-gray-700 mt-2">
                  {staffName} さん、お疲れさまです
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

        {/* MENU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/attendance/staff/timecard"
            className="group rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6 md:p-7 hover:bg-white/28 transition"
          >
            <div>
              <p className="text-[11px] tracking-[0.28em] text-gray-500 font-semibold mb-3">
                TIME CARD
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                タイムカード
              </h2>

              <div className="h-[1px] w-10 bg-gray-300 mb-4" />

              <p className="text-sm text-gray-700 leading-7">
                出勤・退勤の打刻、勤務時間の確認ができます。
              </p>

              <div className="mt-6">
                <span className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg">
                  開く →
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/attendance/staff/payslip"
            className="group rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6 md:p-7 hover:bg-white/28 transition"
          >
            <div>
              <p className="text-[11px] tracking-[0.28em] text-gray-500 font-semibold mb-3">
                PAYSLIP
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                給与明細確認
              </h2>

              <div className="h-[1px] w-10 bg-gray-300 mb-4" />

              <p className="text-sm text-gray-700 leading-7">
                月ごとの給与明細、総支給額、控除額、差引支給額を確認できます。
              </p>

              <div className="mt-6">
                <span className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg">
                  開く →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* FOOTER */}
        <div className="mt-8 rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            スタッフメニュー
          </h3>
          <p className="text-sm text-gray-700 leading-7">
            このページから、スタッフ用の打刻ページと給与明細確認ページへ移動できます。
          </p>
        </div>
      </div>
    </div>
  );
}