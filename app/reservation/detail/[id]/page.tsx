"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

function formatJapaneseDate(dateStr: string) {
  const date = new Date(dateStr);
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${week[date.getDay()]}）`;
}

function getInitial(staffName: string) {
  return staffName.slice(0, 1);
}

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchReservation = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setReservation(null);
      setErrorMessage("予約データの取得に失敗しました。");
      setLoading(false);
      return;
    }

    setReservation(data as Reservation);
    setLoading(false);
  };

  useEffect(() => {
    if (!id) return;
    fetchReservation();
  }, [id]);

  const color = useMemo(() => {
    if (!reservation) return "#6b7280";
    return STAFF_COLORS[reservation.staff_name] || "#6b7280";
  }, [reservation]);

  const handleDelete = async () => {
    if (!reservation) return;

    const ok = window.confirm("この予約を削除しますか？");
    if (!ok) return;

    setDeleting(true);

    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reservation.id);

    if (error) {
      alert("削除に失敗しました。");
      setDeleting(false);
      return;
    }

    router.push(`/reservation/day?date=${reservation.date}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#222]">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (errorMessage || !reservation) {
    return (
      <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#222]">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-500">{errorMessage || "予約が見つかりません。"}</p>
          <div className="mt-4">
            <Link
              href="/reservation"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              月表示へ戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#222]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">予約詳細</h1>
            <p className="mt-1 text-sm text-gray-500">内容を確認できます</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/reservation/day?date=${reservation.date}`}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              日表示へ戻る
            </Link>
            <Link
              href="/reservation"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              月表示へ
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div
            className="px-5 py-5 text-white md:px-6"
            style={{ backgroundColor: color }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm opacity-90">{formatJapaneseDate(reservation.date)}</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  {reservation.customer_name?.trim() || reservation.menu}
                </h2>
                <p className="mt-2 text-sm opacity-90">{reservation.start_time}</p>
              </div>

              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold"
              >
                {getInitial(reservation.staff_name)}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4">
                <p className="text-xs font-semibold tracking-wide text-gray-500">担当者</p>
                <p className="mt-2 text-lg font-bold">{reservation.staff_name}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4">
                <p className="text-xs font-semibold tracking-wide text-gray-500">店舗</p>
                <p className="mt-2 text-lg font-bold">{reservation.store_name}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4">
                <p className="text-xs font-semibold tracking-wide text-gray-500">メニュー</p>
                <p className="mt-2 text-lg font-bold">{reservation.menu}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4">
                <p className="text-xs font-semibold tracking-wide text-gray-500">支払い方法</p>
                <p className="mt-2 text-lg font-bold">
                  {reservation.payment_method || "未入力"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4 md:col-span-2">
                <p className="text-xs font-semibold tracking-wide text-gray-500">顧客名</p>
                <p className="mt-2 text-lg font-bold">
                  {reservation.customer_name || "未入力"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4 md:col-span-2">
                <p className="text-xs font-semibold tracking-wide text-gray-500">メモ</p>
                <p className="mt-2 whitespace-pre-wrap text-base text-gray-800">
                  {reservation.memo || "未入力"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/reservation/edit/${reservation.id}`}
                className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                編集ページへ
              </Link>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "削除中..." : "この予約を削除"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}