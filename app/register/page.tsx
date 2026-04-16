"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [customerId, setCustomerId] = useState("");

  const handleRegister = async () => {
    if (!memberId || !password || !customerId) {
      alert("全部入力してください");
      return;
    }

    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("member_login_id", memberId);

    if (existing && existing.length > 0) {
      alert("このIDは使われています");
      return;
    }

    const { error } = await supabase
      .from("customers")
      .update({
        member_login_id: memberId,
        member_password: password,
        member_login_enabled: true,
      })
      .eq("id", Number(customerId));

    if (error) {
      console.error(error);
      alert("登録失敗");
      return;
    }

    alert("登録完了！");
    window.location.href = "/login";
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>会員登録</h2>

      <input
        placeholder="顧客ID"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="ログインID"
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="パスワード"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleRegister}>
        登録する
      </button>
    </div>
  );
}