"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    const role = localStorage.getItem("gymup_user_role");

    if (isLoggedIn !== "true") {
      router.replace("/login");
      return;
    }

    if (role !== "admin") {
      router.replace("/attendance/staff");
      return;
    }

    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#e5e7eb_0%,#d1d5db_42%,#9ca3af_100%)]">
        <div className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl px-8 py-6 shadow-xl text-gray-900 font-semibold">
          認証確認中...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}