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

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function formatMonthInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCalendarDays(targetMonth: string) {
  const [year, month] = targetMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function buildReservationLabel(item: Reservation) {
  const customer = item.customer_name?.trim() || item.menu;
  return `${item.start_time} ${customer}`;
}

export default function ReservationPage() {
  const [monthValue, setMonthValue] = useState(formatMonthInputValue(new Date()));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState("すべて");
  const [staffFilter, setStaffFilter] = useState("すべて");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchReservations = async () => {
    setLoading(true);
    setErrorMessage("");

    const [year, month] = monthValue.split("-").map(Number);
    const startDate = `${monthValue}-01`;
    const endDate = formatDateString(new Date(year, month, 0));

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
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
  }, [monthValue]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((item) => {
      const matchStore = storeFilter === "すべて" || item.store_name === storeFilter;
      const matchStaff = staffFilter === "すべて" || item.staff_name === staffFilter;
      return matchStore && matchStaff;
    });
  }, [reservations, storeFilter, staffFilter]);

  const reservationMap = useMemo(() => {
    const map: Record<string, Reservation[]> = {};

    for (const item of filteredReservations) {
      if (!map[item.date]) {
        map[item.date] = [];
      }
      map[item.date].push(item);
    }

    return map;
  }, [filteredReservations]);

  const calendarDays = useMemo(() => getCalendarDays(monthValue), [monthValue]);

  const currentMonth = Number(monthValue.split("-")[1]);

  const handlePrevMonth = () => {
    const [year, month] = monthValue.split("-").map(Number);
    const prev = new Date(year, month - 2, 1);
    setMonthValue(formatMonthInputValue(prev));
  };

  const handleNextMonth = () => {
    const [year, month] = monthValue.split("-").map(Number);
    const next = new Date(year, month, 1);
    setMonthValue(formatMonthInputValue(next));
  };

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-3 py-4 text-[#222] md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 rounded-3xl bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">予約カレンダー</h1>
              <p className="mt-1 text-sm text-gray-500">TimeTree風の月表示</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/reservation/new"
                className="inline-flex items-center justify-center rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                ＋ 新規予約
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium">月</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  ←
                </button>

                <input
                  type="month"
                  value={monthValue}
                  onChange={(e) => setMonthValue(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
                />

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  →
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">店舗で絞り込み</label>
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black md:min-w-[180px]"
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
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black md:min-w-[180px]"
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

        <div className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {monthValue.replace("-", "年")}月
            </h2>
            <p className="text-sm text-gray-500">件数：{filteredReservations.length}件</p>
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
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
            <div className="grid min-w-[980px] grid-cols-7 border-b border-gray-200 bg-[#fafafa]">
              {WEEK_LABELS.map((label, index) => (
                <div
                  key={label}
                  className={`px-3 py-3 text-center text-sm font-bold ${
                    index === 0
                      ? "text-red-500"
                      : index === 6
                      ? "text-blue-500"
                      : "text-gray-700"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid min-w-[980px] grid-cols-7">
              {calendarDays.map((date) => {
                const dateString = formatDateString(date);
                const items = reservationMap[dateString] || [];
                const isCurrentMonth = date.getMonth() + 1 === currentMonth;
                const day = date.getDay();

                return (
                  <div
                    key={dateString}
                    className={`min-h-[150px] border-b border-r border-gray-200 p-2 ${
                      !isCurrentMonth ? "bg-[#fafafa]" : "bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Link
                        href={`/reservation/day?date=${dateString}`}
                        className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-full px-2 text-sm font-bold transition hover:bg-gray-100 ${
                          day === 0
                            ? "text-red-500"
                            : day === 6
                            ? "text-blue-500"
                            : "text-gray-800"
                        } ${!isCurrentMonth ? "opacity-40" : ""}`}
                      >
                        {date.getDate()}
                      </Link>

                      {items.length > 0 ? (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                          {items.length}件
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      {items.slice(0, 4).map((item) => {
                        const color = STAFF_COLORS[item.staff_name] || "#6b7280";

                        return (
                          <Link
                            key={item.id}
                            href={`/reservation/day?date=${item.date}`}
                            className="block rounded-md px-2 py-1 text-[11px] font-medium text-white"
                            style={{ backgroundColor: color }}
                            title={`${item.start_time} / ${item.staff_name} / ${item.customer_name || item.menu}`}
                          >
                            <div className="truncate">{buildReservationLabel(item)}</div>
                          </Link>
                        );
                      })}

                      {items.length > 4 ? (
                        <Link
                          href={`/reservation/day?date=${dateString}`}
                          className="block px-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700"
                        >
                          +あと{items.length - 4}件
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}