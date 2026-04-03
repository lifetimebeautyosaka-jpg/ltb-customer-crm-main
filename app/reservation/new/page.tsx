"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const backHref = useMemo(() => {
    return `/reservation/day?date=${date}&store=${storeName}&staff=${staffName}`;
  }, [date, storeName, staffName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!customerName.trim()) {
      setErrorMessage("名前を入力してください");
      return;
    }

    setSaving(true);

    try {
      const name = customerName.trim();

      // 顧客チェック
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("name", name)
        .maybeSingle();

      if (!existing) {
        await supabase.from("customers").insert([{ name }]);
      }

      // 予約保存（customer_idなし）
      const { error } = await supabase.from("reservations").insert([
        {
          customer_name: name,
          date,
          start_time: startTime,
          end_time: endTime,
          store_name: storeName,
          staff_name: staffName,
          menu,
          payment_method: paymentMethod,
          memo,
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }

      setMessage("保存成功");

      setTimeout(() => {
        router.push(backHref);
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: "20px" }}>
      <h2>新規予約</h2>

      <div style={{ marginBottom: "10px" }}>
        <Link href="/">🏠トップ</Link> / <Link href={backHref}>←戻る</Link>
      </div>

      <form onSubmit={handleSave} style={{ display: "grid", gap: "10px", maxWidth: "400px" }}>
        <input placeholder="名前" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <select value={storeName} onChange={(e) => setStoreName(e.target.value)}>
          {STORE_OPTIONS.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>

        <select value={staffName} onChange={(e) => setStaffName(e.target.value)}>
          {STAFF_OPTIONS.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>

        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

        <select value={menu} onChange={(e) => setMenu(e.target.value)}>
          {MENU_OPTIONS.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>

        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {PAYMENT_OPTIONS.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>

        <textarea placeholder="メモ" value={memo} onChange={(e) => setMemo(e.target.value)} />

        <button disabled={saving}>{saving ? "保存中..." : "保存"}</button>
      </form>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
    </main>
  );
}