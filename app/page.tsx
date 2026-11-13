"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 以前はパスワードなしでスタッフとして入れるボタンがあったため廃止。
// 正式なログイン（Supabase Auth）の /login に移動させる。
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}
