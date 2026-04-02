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

const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

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

function getCalendarDaysMondayStart(targetMonth: string) {
  const [year, month] = targetMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const firstDayIndex = (firstDay.getDay() + 6) % 7;
  const lastDayIndex = (lastDay.getDay() + 6) % 7;

  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDayIndex);

  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDayIndex));

  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function buildCompactLabel(item: Reservation) {
  const raw = item.customer_name?.trim() || item.menu;
  return raw.length > 7 ? `${raw.slice(0, 7)}…` : raw;
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
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    }

    return map;
  }, [filteredReservations]);

  const calendarDays = useMemo(() => getCalendarDaysMondayStart(monthValue), [monthValue]);
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
    <main className="min-h-screen bg-[#f3f4f6] text-[#222]">
      <div className="mx-auto w-full max-w-md px-2 py-3 sm:max-w-none sm:px-4 md:max-w-6xl md:px-6 md:py-6">
        <div className="mb-3 rounded-3xl bg-white p-3 shadow-sm md:p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-[18px] font-bold md:text-2xl">予約カレンダー</h1>
              <p className="mt-0.5 text-[10px] text-gray-500 md:text-sm">
                スマホ1画面で見やすい月表示
              </p>
            </div>

            <Link
              href="/reservation/new"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] text-xl font-bold text-white shadow-sm"
            >
              ＋
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700"
            >
              ←
            </button>

            <input
              type="month"
              value={monthValue}
              onChange={(e) => setMonthValue(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:border-black md:text-sm"
            />

            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700"
            >
              →
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-2 py-2 text-[11px] outline-none focus:border-black md:text-sm"
            >
              <option value="すべて">全店舗</option>
              {STORES.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>

            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-2 py-2 text-[11px] outline-none focus:border-black md:text-sm"
            >
              <option value="すべて">全担当者</option>
              {STAFFS.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>

            <div className="col-span-2 flex items-center justify-center rounded-xl bg-[#fafafa] px-2 py-2 text-[11px] text-gray-600 md:col-span-2 md:text-sm">
              件数：<span className="ml-1 font-bold text-[#111827]">{filteredReservations.length}</span>
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
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-[#fafafa]">
              {WEEK_LABELS.map((label, index) => (
                <div
                  key={label}
                  className={`py-1.5 text-center text-[10px] font-bold md:py-3 md:text-sm ${
                    index === 5
                      ? "text-blue-500"
                      : index === 6
                      ? "text-red-500"
                      : "text-gray-700"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((date) => {
                const dateString = formatDateString(date);
                const items = reservationMap[dateString] || [];
                const isCurrentMonth = date.getMonth() + 1 === currentMonth;

                const dayIndex = (date.getDay() + 6) % 7;

                return (
                  <div
                    key={dateString}
                    className={`min-h-[88px] border-b border-r border-gray-200 px-1 py-1 md:min-h-[150px] md:p-2 ${
                      !isCurrentMonth ? "bg-[#f8f8f8]" : "bg-white"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <Link
                        href={`/reservation/day?date=${dateString}`}
                        className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold md:h-8 md:min-w-[32px] md:px-2 md:text-sm ${
                          dayIndex === 5
                            ? "text-blue-500"
                            : dayIndex === 6
                            ? "text-red-500"
                            : "text-gray-800"
                        } ${!isCurrentMonth ? "opacity-40" : ""}`}
                      >
                        {date.getDate()}
                      </Link>

                      {items.length > 0 ? (
                        <span className="text-[8px] font-semibold text-gray-400 md:text-[10px]">
                          {items.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-[2px] md:space-y-1">
                      {items.slice(0, 3).map((item) => {
                        const color = STAFF_COLORS[item.staff_name] || "#6b7280";

                        return (
                          <Link
                            key={item.id}
                            href={`/reservation/detail/${item.id}`}
                            className="block rounded px-1 py-[2px] text-[8px] font-medium leading-tight text-white md:rounded-md md:px-2 md:py-1 md:text-[11px]"
                            style={{ backgroundColor: color }}
                            title={`${item.start_time} / ${item.staff_name} / ${item.customer_name || item.menu}`}
                          >
                            <div className="truncate">{buildCompactLabel(item)}</div>
                          </Link>
                        );
                      })}

                      {items.length > 3 ? (
                        <Link
                          href={`/reservation/day?date=${dateString}`}
                          className="block px-0.5 text-[8px] font-semibold text-gray-500 md:px-1 md:text-[11px]"
                        >
                          +{items.length - 3}
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