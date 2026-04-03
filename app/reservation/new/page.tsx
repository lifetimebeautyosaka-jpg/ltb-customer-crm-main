"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STORE_OPTIONS = ["江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町"];
const STAFF_OPTIONS = ["山口", "中西", "池田", "石川", "菱谷", "林", "井上", "その他"];
const MENU_OPTIONS = ["ストレッチ", "トレーニング", "ペアトレーニング", "ヘッドスパ", "アロマ", "その他"];
const PAYMENT_OPTIONS = ["現金", "カード", "回数券", "月額", "その他"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function Page() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(toDateString(new Date()));
  const [storeName, setStoreName] = useState("江戸堀");
  const [staffName, setStaffName] = useState("山口");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [menu, setMenu] = useState("ストレッチ");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [memo, setMemo] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const backHref = useMemo(() => {
    return `/reservation/day?date=${date}`;
  }, [date]);

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    const name = customerName.trim();

    if (!name) {
      alert("名前を入力");
      setSaving(false);
      return;
    }

    // 顧客登録
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (!data) {
      await supabase.from("customers").insert([{ name }]);
    }

    // 予約保存
    const { error } = await supabase.from("reservations").insert([
      {
        customer_name: name,
        date,
        start_time: startTime,
        store_name: storeName,
        staff_name: staffName,
        menu,
        payment_method: paymentMethod,
        memo,
      },
    ]);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setMsg("保存完了");

    setTimeout(() => {
      router.push(backHref);
    }, 800);
  };

  return (
    <main style={{ background: "#f5f5f5", minHeight: "100vh", padding: "20px" }}>
      
      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "800" }}>新規予約</h2>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/">🏠</Link>
          <Link href={backHref}>←</Link>
        </div>
      </div>

      {/* カード */}
      <form onSubmit={handleSave} style={card}>
        
        <div style={grid}>
          <Input label="名前" value={customerName} set={setCustomerName} />

          <Input label="日付" type="date" value={date} set={setDate} />

          <Select label="店舗" value={storeName} set={setStoreName} list={STORE_OPTIONS} />

          <Select label="担当" value={staffName} set={setStaffName} list={STAFF_OPTIONS} />

          <Input label="開始時間" type="time" value={startTime} set={setStartTime} />

          <Input label="終了時間" type="time" value={endTime} set={setEndTime} />

          <Select label="メニュー" value={menu} set={setMenu} list={MENU_OPTIONS} />

          <Select label="支払い" value={paymentMethod} set={setPaymentMethod} list={PAYMENT_OPTIONS} />
        </div>

        <textarea
          placeholder="メモ"
          style={textarea}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        <button style={saveBtn} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </button>

        {msg && <p style={{ color: "green", textAlign: "center" }}>{msg}</p>}
      </form>
    </main>
  );
}

/* パーツ */

function Input({ label, value, set, type = "text" }: any) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <input type={type} value={value} onChange={(e) => set(e.target.value)} style={input} />
    </div>
  );
}

function Select({ label, value, set, list }: any) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <select value={value} onChange={(e) => set(e.target.value)} style={input}>
        {list.map((v: string) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </div>
  );
}

/* スタイル */

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "15px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "15px",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const labelStyle = {
  fontSize: "12px",
  marginBottom: "4px",
  fontWeight: "600",
};

const input = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const textarea = {
  width: "100%",
  minHeight: "80px",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const saveBtn = {
  background: "#111",
  color: "#fff",
  padding: "12px",
  borderRadius: "10px",
  fontSize: "16px",
};