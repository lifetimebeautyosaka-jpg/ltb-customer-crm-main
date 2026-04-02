"use client";

import { supabase } from "@/lib/supabase";

export default function CustomerPage() {
  const handleTest = async () => {
    alert("追加開始");

    const { data, error } = await supabase
      .from("customers")
      .insert([{ name: "テスト太郎", phone: "09000000000" }])
      .select();

    console.log("data:", data);
    console.log("error:", error);

    if (error) {
      alert("登録エラー: " + error.message);
      return;
    }

    alert("登録成功");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>顧客管理_SUPABASE_CHECK</h1>
      <button onClick={handleTest}>追加</button>
    </div>
  );
}