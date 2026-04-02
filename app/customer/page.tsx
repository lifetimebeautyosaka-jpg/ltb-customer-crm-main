"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
};

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // 初回読み込み
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 一覧取得
  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*");

    console.log("取得結果:", data, error);

    if (error) {
      alert("取得エラー: " + error.message);
      return;
    }

    setCustomers(data || []);
  };

  // 追加
  const handleAddCustomer = async () => {
    const { data, error } = await supabase
      .from("customers")
      .insert([
        {
          name: name,
          phone: phone || null,
        },
      ])
      .select();

    console.log("登録結果:", data, error);

    if (error) {
      alert("登録エラー: " + error.message);
      return;
    }

    alert("登録成功");

    setName("");
    setPhone("");

    fetchCustomers();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>顧客管理_NEW</h1>

      <input
        placeholder="名前"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="電話番号"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button onClick={handleAddCustomer}>
        追加
      </button>

      <div style={{ marginTop: 20 }}>
        {customers.map((c) => (
          <div key={c.id}>
            {c.name} - {c.phone}
          </div>
        ))}
      </div>
    </div>
  );
}