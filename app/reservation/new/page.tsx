"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORES = ["江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町"];
const STAFFS = ["山口", "中西", "池田", "羽田", "石川", "菱谷", "林", "井上", "その他"];
const MENUS = ["ストレッチ", "トレーニング", "業務", "休み"];
const PAYMENT_METHODS = ["トレーニングコース", "ストレッチ回数券", "現金", "カード", "その他"];

const STAFF_COLORS: Record<string, string> = {
  山口: "#16a34a",
  中西: "#ec4899",
  池田: "#92400e",
  羽田: "#ef4444",
  石川: "#2563eb",
  菱谷: "#eab308",
  林: "#111827",
  井上: "#374151",
  その他: "#6b7280",
};

function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ReservationNewPage() {
  const router = useRouter();

  const [date, setDate] = useState(todayString());
  const [startTime, setStartTime] = useState("10:00");
  const [storeName, setStoreName] = useState("江戸堀");
  const [staffName, setStaffName] = useState("山口");
  const [customerName, setCustomerName] = useState("");
  const [menu, setMenu] = useState("ストレッチ");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedStaffColor = STAFF_COLORS[staffName] || "#6b7280";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("reservations").insert([
      {
        date,
        start_time: startTime,
        store_name: storeName,
        staff_name: staffName,
        customer_name: customerName.trim() || null,
        menu,
        payment_method: paymentMethod || null,
        memo: memo.trim() || null,
      },
    ]);

    if (error) {
      alert("予約の保存に失敗しました。");
      setSaving(false);
      return;
    }

    router.push(`/reservation/day?date=${date}`);
  };

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#222]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">新規予約追加</h1>
            <p className="mt-1 text-sm text-gray-500">TimeTree風の予約を追加します</p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/reservation"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              月表示へ戻る
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 rounded-2xl border border-gray-200 bg-[#fafafa] p-4">
            <p className="mb-2 text-sm font-medium text-gray-500">担当者カラー</p>
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-4 w-4 rounded-full"
                style={{ backgroundColor: selectedStaffColor }}
              />
              <span className="text-sm font-semibold">{staffName}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">時間</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">店舗</label>
              <select
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              >
                {STORES.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">担当者</label>
              <select
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              >
                {STAFFS.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">顧客名</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="例：田中様"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">メニュー</label>
              <select
                value={menu}
                onChange={(e) => setMenu(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              >
                {MENUS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">支払い方法</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              >
                {PAYMENT_METHODS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="駐車場 / 指名料 / 領収済み など"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "保存中..." : "保存する"}
            </button>

            <Link
              href="/reservation"
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}