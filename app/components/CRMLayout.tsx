"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

type Props = {
  title?: string;
  children: ReactNode;
};

export default function CRMLayout({ title, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState("");
  const [staffName, setStaffName] = useState("");

  useEffect(() => {
    setMounted(true);

    const loggedIn = localStorage.getItem("gymup_logged_in");
    const savedRole = localStorage.getItem("gymup_user_role") || "";
    const savedStaffName = localStorage.getItem("gymup_current_staff_name") || "";

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    setRole(savedRole);
    setStaffName(savedStaffName);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#eef2f7_0%,#e5ebf3_100%)] px-4 py-6">
        <div className="mx-auto max-w-[1200px] rounded-[24px] border border-white/70 bg-white/70 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md">
          <p className="text-sm text-slate-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/", label: "ホーム" },
    { href: "/reservation", label: "予約管理" },
    { href: "/customer", label: "顧客管理" },
    { href: "/sales", label: "売上管理" },
    { href: "/accounting", label: "会計管理" },
    { href: "/attendance", label: "勤怠管理" },
    { href: "/meal", label: "食事管理" },
    { href: "/account", label: "アカウント管理" },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#eef2f7_0%,#e5ebf3_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:items-start lg:gap-6 lg:px-6">
        {/* サイドメニュー */}
        <aside className="w-full min-w-0 lg:sticky lg:top-4 lg:w-[280px] lg:min-w-[280px]">
          <div className="rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-inner">
                <img
                  src="/gymup-logo.png"
                  alt="GYMUP"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold tracking-[0.18em] text-slate-500">
                  GYMUP CRM
                </p>
                <p className="truncate text-lg font-black text-slate-900">
                  {title || "管理画面"}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-[20px] bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">ログイン中</p>
              <p className="mt-1 break-words text-base font-bold text-slate-900">
                {staffName || (role === "admin" ? "管理者" : "スタッフ")}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                権限: {role === "admin" ? "管理者" : "スタッフ"}
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-[52px] items-center justify-center rounded-2xl bg-slate-100 px-3 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-900 hover:text-white"
                >
                  <span className="break-words">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* メイン */}
        <main className="w-full min-w-0 flex-1">
          <div className="w-full min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}