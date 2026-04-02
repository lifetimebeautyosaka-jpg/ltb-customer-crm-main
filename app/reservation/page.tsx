"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

const STORES = ["すべて", "江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町"];
const STAFFS = ["すべて", "山口", "中西", "池田", "羽田", "石川", "菱谷", "林", "井上", "その他"];

function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatJapaneseDate(dateStr: string) {
  const date = new Date(dateStr);
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${week[date.getDay()]}曜日`;
}

function formatMonthPageLink(dateStr: string) {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `/reservation?month=${y}-${m}`;
}

function getDisplayTitle(item: Reservation) {
  if (item.customer_name?.trim()) return item.customer_name.trim();
  return item.menu;
}

function getInitial(staffName: string) {
  return staffName.slice(0, 1);
}

export default function ReservationDayPage() {
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date") || todayString();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
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
      setReservations([]);
      setErrorMessage("予約データの取得に失敗しました。");
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
    <main className="min-h-screen bg-[#f7f7f7] text-[#222]">
      <div className="mx-auto max-w-4xl px-3 py-4 md:px-6 md:py-6">
        <div className="mb-4 rounded-3xl bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{formatJapaneseDate(selectedDate)}</h1>
              <p className="mt-1 text-sm text-gray-500">その日の予約を時間順に表示</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={formatMonthPageLink(selectedDate)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                月表示へ
              </Link>
              <Link
                href={`/reservation/new?date=${selectedDate}`}
                className="rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                ＋ 新規予約
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">店舗で絞り込み</label>
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
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
              <label className="mb-1 block text-sm font-medium">担当者で絞り込み</label>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              >
                {STAFFS.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-red-500">{errorMessage}</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">この日の予約はまだありません。</p>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-3 shadow-sm md:p-4">
            <div className="space-y-3">
              {filteredReservations.map((item) => {
                const color = STAFF_COLORS[item.staff_name] || "#6b7280";

                return (
                  <Link
                    key={item.id}
                    href={`/reservation/detail/${item.id}`}
                    className="block rounded-2xl bg-white px-3 py-3 transition hover:bg-gray-50 md:px-4 md:py-4"
                  >
                    <div className="flex gap-3 md:gap-4">
                      <div className="w-[64px] shrink-0 pt-1 text-right md:w-[72px]">
                        <div className="text-lg font-bold leading-none text-[#111827]">
                          {item.start_time}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-400">
                          {item.menu}
                        </div>
                      </div>

                      <div
                        className="mt-1 w-[4px] shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-2xl font-bold tracking-tight text-[#111827]">
                              {getDisplayTitle(item)}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                {item.store_name}
                              </span>
                              <span
                                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                                style={{ backgroundColor: color }}
                              >
                                {item.staff_name}
                              </span>
                              {item.payment_method ? (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                  {item.payment_method}
                                </span>
                              ) : null}
                            </div>

                            {item.memo ? (
                              <div className="mt-3 text-sm text-gray-500">
                                {item.memo}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {getInitial(item.staff_name)}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(item.id);
                              }}
                              className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}