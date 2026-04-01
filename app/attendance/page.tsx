"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AttendanceTopPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("gymup_logged_in");
    const userRole = localStorage.getItem("gymup_user_role") || "";
    const userName = localStorage.getItem("gymup_current_staff_name") || "";

    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }

    setRole(userRole);
    setName(userName);
    setIsLoaded(true);
  }, [router]);

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#d1d5db] text-gray-700">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#e5e7eb_0%,#d1d5db_42%,#9ca3af_100%)] text-gray-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 -left-36 h-[560px] w-[560px] rounded-full bg-white/70 blur-[140px]" />
        <div className="absolute bottom-[-140px] right-[-80px] h-[460px] w-[460px] rounded-full bg-white/50 blur-[120px]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 1px, transparent 24px)",
        }}
      />

      <header className="relative border-b border-white/35 bg-white/35 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img
              src="/gymup-logo.png"
              alt="GYMUP"
              className="h-11 w-auto object-contain"
            />
            <div>
              <div className="text-lg font-bold tracking-[0.08em] text-gray-900">
                GYMUP CRM
              </div>
              <div className="text-xs text-gray-600">勤怠管理</div>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.20)] transition hover:bg-neutral-800"
          >
            ホームへ戻る
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <section className="relative mb-10 overflow-hidden rounded-[34px] border border-white/35 bg-white/40 p-8 shadow-[0_28px_80px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 rounded-[34px] border border-white/45" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.70)_0%,rgba(255,255,255,0)_100%)]" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-600 backdrop-blur-xl">
              <span className="inline-block h-2 w-2 rounded-full bg-black/70" />
              Attendance
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              勤怠管理
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-8 text-gray-700 md:text-base">
              {name ? `${name} さんでログイン中。` : ""}
              {role === "admin"
                ? " 管理者用メニューとスタッフ用メニューを表示しています。"
                : " スタッフ用メニューのみ表示しています。"}
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {role === "admin" && (
            <Link href="/attendance/admin" className="block h-full">
              <div className="group relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-[28px] border border-white/35 bg-white/40 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(0,0,0,0.14)]">
                <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/40" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0)_100%)]" />

                <div className="relative">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-3 py-1.5 text-[11px] font-semibold tracking-[0.20em] text-gray-600 backdrop-blur-xl">
                    <span className="inline-block h-2 w-2 rounded-full bg-black/70" />
                    ADMIN
                  </div>

                  <h2 className="text-2xl font-bold leading-tight text-gray-900">
                    管理者メニュー
                  </h2>

                  <div className="mt-3 h-[1px] w-10 bg-white/60" />

                  <p className="mt-4 flex-1 text-sm leading-7 text-gray-700">
                    管理者用タイムカード、賃金台帳、給与明細管理へ進めます。
                  </p>

                  <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,0.20)] transition group-hover:bg-black">
                    開く
                    <span className="transition group-hover:translate-x-0.5">→</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <Link href="/attendance/staff" className="block h-full">
            <div className="group relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-[28px] border border-white/35 bg-white/40 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(0,0,0,0.14)]">
              <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/40" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0)_100%)]" />

              <div className="relative">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-3 py-1.5 text-[11px] font-semibold tracking-[0.20em] text-gray-600 backdrop-blur-xl">
                  <span className="inline-block h-2 w-2 rounded-full bg-black/70" />
                  STAFF
                </div>

                <h2 className="text-2xl font-bold leading-tight text-gray-900">
                  スタッフメニュー
                </h2>

                <div className="mt-3 h-[1px] w-10 bg-white/60" />

                <p className="mt-4 flex-1 text-sm leading-7 text-gray-700">
                  スタッフ用タイムカードや勤怠確認ページへ進めます。
                </p>

                <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,0.20)] transition group-hover:bg-black">
                  開く
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}