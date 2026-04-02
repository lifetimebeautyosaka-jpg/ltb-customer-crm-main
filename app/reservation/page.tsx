"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Reservation = {
  id: number;
  date: string;
  start_time: string;
  store_name: string;
  staff_name: string;
  customer_name: string | null;
  menu: string;
  payment_method: string | null;
  memo: string | null;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORES = ["江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町"];
const STAFFS = ["山口", "中西", "池田", "羽田", "石川", "菱谷", "林", "井上", "その他"];

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

function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${week[date.getDay()]}）`;
}

function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ReservationPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [storeFilter, setStoreFilter] = useState("すべて");
  const [staffFilter, setStaffFilter] = useState("すべて");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchReservations = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("date", selectedDate)
      .order("start_time", { ascending: true });

    if (error) {
      setErrorMessage("予約データの取得に失敗しました。");
      setReservations([]);
      setLoading(false);
      return;
    }

    setReservations((data as Reservation[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedDate]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((item) => {
      const matchStore = storeFilter === "すべて" || item.store_name === storeFilter;
      const matchStaff = staffFilter === "すべて" || item.staff_name === staffFilter;
      return matchStore && matchStaff;
    });
  }, [reservations, storeFilter, staffFilter]);

  const groupedByStore = useMemo(() => {
    const groups: Record<string, Reservation[]> = {};

    for (const store of STORES) {
      groups[store] = [];
    }

    for (const item of filteredReservations) {
      if (!groups[item.store_name]) {
        groups[item.store_name] = [];
      }
      groups[item.store_name].push(item);
    }

    return groups;
  }, [filteredReservations]);

  const handleDelete = async (id: number) => {
    const ok = window.confirm("この予約を削除しますか？");
    if (!ok) return;

    const { error } = await supabase.from("reservations").delete().eq("id", id);

    if (error) {
      alert("削除に失敗しました。");
      return;
    }

    await fetchReservations();
  };

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#222]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">予約管理</h1>
              <p className="mt-1 text-sm text-gray-500">タイムツリー風の見やすい予約一覧</p>
            </div>

            <Link
              href="/reservation/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              ＋ 新規予約を追加
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">日付</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">店舗で絞り込み</label>
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              >
                <option value="すべて">すべて</option>
                {STORES.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">担当者で絞り込み</label>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              >
                <option value="すべて">すべて</option>
                {STAFFS.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">{formatDateLabel(selectedDate)}</h2>
          <p className="mt-1 text-sm text-gray-500">
            件数：{filteredReservations.length}件
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-red-500">{errorMessage}</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">この日の予約はまだありません。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByStore).map(([store, items]) => {
              if (items.length === 0) return null;

              return (
                <section key={store} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold">{store}</h3>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {items.length}件
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => {
                      const color = STAFF_COLORS[item.staff_name] || "#6b7280";

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                          style={{
                            borderLeft: `8px solid ${color}`,
                            backgroundColor: `${color}12`,
                          }}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="text-lg font-bold text-[#111827]">
                                  {item.start_time}
                                </span>
                                <span
                                  className="rounded-full px-3 py-1 text-xs font-bold text-white"
                                  style={{ backgroundColor: color }}
                                >
                                  {item.staff_name}
                                </span>
                                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                                  {item.menu}
                                </span>
                                {item.payment_method ? (
                                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                                    {item.payment_method}
                                  </span>
                                ) : null}
                              </div>

                              <div className="space-y-1 text-sm text-gray-700">
                                <p>
                                  <span className="font-semibold">顧客名：</span>
                                  {item.customer_name || "未入力"}
                                </p>
                                <p>
                                  <span className="font-semibold">店舗：</span>
                                  {item.store_name}
                                </p>
                                {item.memo ? (
                                  <p>
                                    <span className="font-semibold">メモ：</span>
                                    {item.memo}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                              >
                                削除
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}