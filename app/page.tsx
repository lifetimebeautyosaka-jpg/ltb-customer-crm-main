"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CRMLayout from "../components/CRMLayout";

type UserRole = "admin" | "staff" | "";

type ReservationItem = {
  id?: string;
  date?: string;
  startTime?: string;
  customerName?: string;
  staffName?: string;
  menu?: string;
  status?: string;
};

type MealPost = {
  id?: string;
  feedback?: string;
  feedbackText?: string;
  replied?: boolean;
};

type CustomerItem = {
  id?: string | number;
  name?: string;
};

type SalesItem = {
  id?: string;
  amount?: number | string;
  price?: number | string;
  total?: number | string;
};

const CARD_BASE =
  "w-full min-w-0 rounded-[28px] border border-white/70 bg-white/70 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.08)]";

function formatTodayJP() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const num = Number(cleaned);
    return Number.isNaN(num) ? 0 : num;
  }
  return 0;
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole>("");
  const [staffName, setStaffName] = useState("");

  const [todayReservations, setTodayReservations] = useState<ReservationItem[]>([]);
  const [unrepliedMealsCount, setUnrepliedMealsCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);

  useEffect(() => {
    setMounted(true);

    const loginFlag = localStorage.getItem("gymup_logged_in");
    const savedRole = (localStorage.getItem("gymup_user_role") || "") as UserRole;
    const savedStaffName = localStorage.getItem("gymup_current_staff_name") || "";

    if (loginFlag !== "true") {
      window.location.href = "/login";
      return;
    }

    setLoggedIn(true);
    setRole(savedRole);
    setStaffName(savedStaffName);

    const today = formatTodayJP();

    const reservations = safeJsonParse<ReservationItem[]>(
      localStorage.getItem("gymup_reservations"),
      []
    );

    const todayList = reservations.filter((item) => {
      const isToday = item?.date === today;
      const matchStaff =
        savedRole === "admin" || !savedStaffName
          ? true
          : (item?.staffName || "") === savedStaffName;
      return isToday && matchStaff;
    });

    setTodayReservations(todayList);

    const customers = safeJsonParse<CustomerItem[]>(
      localStorage.getItem("gymup_customers"),
      []
    );
    setCustomerCount(customers.length);

    const sales = safeJsonParse<SalesItem[]>(localStorage.getItem("gymup_sales"), []);
    setSalesCount(sales.length);

    let unreplied = 0;

    customers.forEach((customer) => {
      const customerId = String(customer?.id ?? "");
      if (!customerId) return;

      const meals = safeJsonParse<MealPost[]>(
        localStorage.getItem(`gymup_meals_${customerId}`),
        []
      );

      meals.forEach((meal) => {
        const hasReply =
          meal?.replied === true ||
          Boolean(meal?.feedback) ||
          Boolean(meal?.feedbackText);

        if (!hasReply) unreplied += 1;
      });
    });

    setUnrepliedMealsCount(unreplied);
  }, []);

  const todayReservationsSorted = useMemo(() => {
    return [...todayReservations].sort((a, b) => {
      const aTime = a.startTime || "";
      const bTime = b.startTime || "";
      return aTime.localeCompare(bTime);
    });
  }, [todayReservations]);

  const monthlySalesTotal = useMemo(() => {
    const sales = safeJsonParse<SalesItem[]>(typeof window !== "undefined" ? localStorage.getItem("gymup_sales") : null, []);
    return sales.reduce((sum, item) => {
      return (
        sum +
        toNumber(item?.amount) +
        (item?.amount ? 0 : toNumber(item?.price)) +
        (item?.amount || item?.price ? 0 : toNumber(item?.total))
      );
    }, 0);
  }, [mounted]);

  const handleLogout = () => {
    localStorage.removeItem("gymup_logged_in");
    localStorage.removeItem("gymup_user_role");
    localStorage.removeItem("gymup_current_staff_name");
    window.location.href = "/login";
  };

  if (!mounted || !loggedIn) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#eef2f7_0%,#e5ebf3_100%)] px-4 py-10">
        <div className="mx-auto max-w-md rounded-[28px] border border-white/70 bg-white/70 p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md">
          <p className="text-sm text-slate-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <CRMLayout title="ホーム">
      <div className="min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#eef2f7_0%,#e5ebf3_100%)]">
        <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="grid min-w-0 grid-cols-1 gap-5">
              <section className={`${CARD_BASE} p-5 sm:p-7`}>
                <div className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-inner">
                      <img
                        src="/gymup-logo.png"
                        alt="GYMUP"
                        className="h-8 w-auto object-contain"
                      />
                    </div>

                    <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-slate-500">
                      ジムアップCRM
                    </p>
                    <h1 className="break-words text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                      ホーム
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                      顧客管理・予約管理・売上管理・会計管理・勤怠管理・食事管理・アカウント管理をここから開けます。
                    </p>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={handleLogout}
                      className="inline-flex h-14 items-center justify-center rounded-2xl bg-slate-900 px-6 text-base font-bold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:opacity-90"
                    >
                      ログアウト
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  <Link href="/reservation" className={`${CARD_BASE} p-5 transition hover:-translate-y-0.5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">予約</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">予約管理</h2>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                      月カレンダーと1日表示で、今日の予約確認も先の予約入力もすぐできます。
                    </p>
                    <div className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-base font-bold text-white">
                      予約管理を開く
                    </div>
                  </Link>

                  <Link href="/customer" className={`${CARD_BASE} p-5 transition hover:-translate-y-0.5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">顧客</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">顧客管理</h2>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                      顧客追加、一覧、詳細確認、回数券・サブスク管理までまとめて確認できます。
                    </p>
                    <div className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-base font-bold text-white">
                      顧客管理を開く
                    </div>
                  </Link>

                  <Link href="/sales" className={`${CARD_BASE} p-5 transition hover:-translate-y-0.5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">売上</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">売上管理</h2>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                      売上入力、履歴確認、CSV活用ベース、日々の売上チェックに対応します。
                    </p>
                    <div className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-base font-bold text-white">
                      売上管理を開く
                    </div>
                  </Link>

                  <Link href="/accounting" className={`${CARD_BASE} p-5 transition hover:-translate-y-0.5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">会計</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">会計管理</h2>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                      前受金、月別集計、サブスク確認など、会計のベース機能をまとめています。
                    </p>
                    <div className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-base font-bold text-white">
                      会計管理を開く
                    </div>
                  </Link>

                  <Link href="/attendance" className={`${CARD_BASE} p-5 transition hover:-translate-y-0.5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">勤怠</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">勤怠管理</h2>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                      スタッフ打刻、管理者確認、タイムカード運用の入口として使えます。
                    </p>
                    <div className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-base font-bold text-white">
                      勤怠管理を開く
                    </div>
                  </Link>

                  <Link href="/meal" className={`${CARD_BASE} p-5 transition hover:-translate-y-0.5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">食事</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">食事管理</h2>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                      投稿一覧、フィードバック、未返信管理まで、食事サポートの入口です。
                    </p>
                    <div className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-base font-bold text-white">
                      食事管理を開く
                    </div>
                  </Link>
                </div>
              </section>

              <section className={`${CARD_BASE} p-5 sm:p-7`}>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Today</p>
                    <h3 className="mt-2 text-3xl font-black text-slate-900">今日の予約</h3>
                  </div>
                  <Link
                    href="/reservation"
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow"
                  >
                    予約ページへ
                  </Link>
                </div>

                {todayReservationsSorted.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-5 text-sm leading-7 text-slate-500">
                    今日の予約はありません。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {todayReservationsSorted.slice(0, 6).map((item, index) => (
                      <div
                        key={`${item.id || "reservation"}-${index}`}
                        className="w-full min-w-0 rounded-[22px] border border-white/70 bg-white/80 p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-lg font-black text-slate-900">
                              {item.startTime || "--:--"} / {item.customerName || "お客様未設定"}
                            </p>
                            <p className="mt-1 break-words text-sm text-slate-600">
                              担当: {item.staffName || "-"} ・ メニュー: {item.menu || "-"}
                            </p>
                          </div>

                          <div className="shrink-0">
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {item.status === "visited" ? "来店済み" : "予約中"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="grid min-w-0 grid-cols-1 gap-5">
              <section className={`${CARD_BASE} p-5`}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Current user</p>
                <h3 className="mt-3 text-2xl font-black text-slate-900">現在のログイン情報</h3>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <div className="rounded-[22px] bg-white/80 p-4">
                    <p className="text-sm text-slate-500">表示名</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {staffName || (role === "admin" ? "管理者" : "スタッフ")}
                    </p>
                  </div>

                  <div className="rounded-[22px] bg-white/80 p-4">
                    <p className="text-sm text-slate-500">権限</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {role === "admin" ? "管理者" : "スタッフ"}
                    </p>
                  </div>

                  <div className="rounded-[22px] bg-white/80 p-4">
                    <p className="text-sm text-slate-500">ログイン状態</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">ログイン中</p>
                  </div>
                </div>
              </section>

              <section className={`${CARD_BASE} p-5`}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Quick stats</p>
                <h3 className="mt-3 text-2xl font-black text-slate-900">ホームアラート</h3>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <div className="rounded-[22px] bg-white/80 p-4">
                    <p className="text-sm text-slate-500">未返信の食事投稿</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{unrepliedMealsCount}件</p>
                  </div>

                  <div className="rounded-[22px] bg-white/80 p-4">
                    <p className="text-sm text-slate-500">今日の予約</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{todayReservationsSorted.length}件</p>
                  </div>

                  <div className="rounded-[22px] bg-white/80 p-4">
                    <p className="text-sm text-slate-500">顧客数</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{customerCount}名</p>
                  </div>

                  <div className="rounded-[22px] bg-white/80 p-4">
                    <p className="text-sm text-slate-500">売上登録件数</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{salesCount}件</p>
                  </div>

                  <div className="rounded-[22px] bg-slate-900 p-5 text-white">
                    <p className="text-sm text-slate-300">売上合計の簡易表示</p>
                    <p className="mt-2 text-3xl font-black">
                      ¥{monthlySalesTotal.toLocaleString()}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      gymup_sales から簡易集計しています。細かい月別集計は売上管理・会計管理で確認してください。
                    </p>
                  </div>
                </div>
              </section>

              <section className={`${CARD_BASE} p-5`}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Account</p>
                <h3 className="mt-3 text-2xl font-black text-slate-900">アカウント管理</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  表示名や権限周りの確認、アカウント関連ページへ移動できます。
                </p>

                <Link
                  href="/account"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:opacity-90"
                >
                  アカウント管理を開く
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}