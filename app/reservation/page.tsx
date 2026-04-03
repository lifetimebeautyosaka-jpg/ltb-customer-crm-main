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
const MENU_OPTIONS = [
  "ストレッチ",
  "トレーニング",
  "ペアトレーニング",
  "ヘッドスパ",
  "アロマ",
  "カウンセリング",
  "その他",
];
const PAYMENT_OPTIONS = ["現金", "カード", "回数券", "月額", "その他"];

type CustomerRow = {
  id: number;
  name: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatJapaneseDate(dateStr: string) {
  const date = new Date(dateStr);
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日（${week[date.getDay()]}）`;
}

function getQueryParam(name: string) {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

export default function ReservationNewPage() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(toDateString(new Date()));
  const [storeName, setStoreName] = useState("江戸堀");
  const [staffName, setStaffName] = useState("山口");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [menu, setMenu] = useState("ストレッチ");
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [memo, setMemo] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const queryDate = getQueryParam("date");
    const queryMonth = getQueryParam("month");
    const queryStore = getQueryParam("store");
    const queryStaff = getQueryParam("staff");

    if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
      setDate(queryDate);
    } else if (queryMonth && /^\d{4}-\d{2}$/.test(queryMonth)) {
      setDate(`${queryMonth}-01`);
    }

    if (queryStore && queryStore !== "すべて") {
      setStoreName(queryStore);
    }

    if (queryStaff && queryStaff !== "すべて") {
      setStaffName(queryStaff);
    }
  }, []);

  const backHref = useMemo(() => {
    return `/reservation/day?date=${date}&store=${encodeURIComponent(storeName)}&staff=${encodeURIComponent(staffName)}`;
  }, [date, storeName, staffName]);

  const topHref = "/";

  const validate = () => {
    if (!customerName.trim()) {
      setErrorMessage("お客様名を入力してください。");
      return false;
    }

    if (!date) {
      setErrorMessage("日付を入力してください。");
      return false;
    }

    if (!startTime) {
      setErrorMessage("開始時間を入力してください。");
      return false;
    }

    if (!endTime) {
      setErrorMessage("終了時間を入力してください。");
      return false;
    }

    if (startTime >= endTime) {
      setErrorMessage("終了時間は開始時間より後にしてください。");
      return false;
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!validate()) return;

    setSaving(true);

    try {
      const trimmedName = customerName.trim();

      // 1. 顧客検索
      const { data: existingCustomer, error: customerFindError } = await supabase
        .from("customers")
        .select("id, name")
        .eq("name", trimmedName)
        .limit(1)
        .maybeSingle<CustomerRow>();

      if (customerFindError) {
        throw new Error("顧客検索に失敗しました。");
      }

      let customerId: number | null = existingCustomer?.id ?? null;

      // 2. いなければ customers に追加
      if (!customerId) {
        const { data: newCustomer, error: customerInsertError } = await supabase
          .from("customers")
          .insert([
            {
              name: trimmedName,
            },
          ])
          .select("id, name")
          .single<CustomerRow>();

        if (customerInsertError) {
          throw new Error("新規顧客の登録に失敗しました。");
        }

        customerId = newCustomer.id;
      }

      // 3. reservations に保存
      const { error: reservationInsertError } = await supabase.from("reservations").insert([
        {
          customer_id: customerId,
          customer_name: trimmedName,
          date,
          start_time: startTime,
          end_time: endTime,
          store_name: storeName,
          staff_name: staffName,
          menu,
          payment_method: paymentMethod,
          memo: memo.trim() || null,
          price: price.trim() ? Number(price) : null,
        },
      ]);

      if (reservationInsertError) {
        throw new Error("予約の保存に失敗しました。");
      }

      setMessage("予約を保存しました。顧客リストにも自動連携しました。");

      setTimeout(() => {
        router.push(backHref);
        router.refresh();
      }, 700);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "保存中にエラーが発生しました。";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "16px 12px 40px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "28px",
            padding: "20px 16px 24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "6px",
              borderRadius: "999px",
              background: "#d1d5db",
              margin: "0 auto 18px",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                }}
              >
                新規予約
              </div>
              <div
                style={{
                  marginTop: "6px",
                  color: "#6b7280",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {formatJapaneseDate(date)}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Link
                href={topHref}
                style={{
                  textDecoration: "none",
                  background: "#ffffff",
                  color: "#111827",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                🏠 トップ
              </Link>

              <Link
                href={backHref}
                style={{
                  textDecoration: "none",
                  background: "#ffffff",
                  color: "#111827",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                ← 戻る
              </Link>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <section>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: "14px",
                }}
              >
                基本情報
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "14px",
                }}
              >
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>お客様名</label>
                  <input
                    type="text"
                    placeholder="例：山田太郎"
                    style={inputStyle}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>日付</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>店舗</label>
                  <select value={storeName} onChange={(e) => setStoreName(e.target.value)} style={inputStyle}>
                    {STORE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>開始時間</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>終了時間</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>担当者</label>
                  <select value={staffName} onChange={(e) => setStaffName(e.target.value)} style={inputStyle}>
                    {STAFF_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>メニュー</label>
                  <select value={menu} onChange={(e) => setMenu(e.target.value)} style={inputStyle}>
                    {MENU_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: "14px",
                }}
              >
                金額・支払い
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "14px",
                }}
              >
                <div>
                  <label style={labelStyle}>料金</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="例：8000"
                    style={inputStyle}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>支払い方法</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={inputStyle}
                  >
                    {PAYMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: "14px",
                }}
              >
                補足
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={labelStyle}>メモ</label>
                  <textarea
                    placeholder="例：駐車場あり、指名料あり、回数券4-2 など"
                    style={{
                      ...inputStyle,
                      minHeight: "120px",
                      resize: "vertical",
                      paddingTop: "14px",
                    }}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {message ? (
              <div
                style={{
                  background: "#ecfdf5",
                  color: "#065f46",
                  border: "1px solid #a7f3d0",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {message}
              </div>
            ) : null}

            {errorMessage ? (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            <section>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "4px",
                }}
              >
                <button
                  type="button"
                  onClick={() => router.push(backHref)}
                  disabled={saving}
                  style={{
                    height: "54px",
                    borderRadius: "16px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#111827",
                    fontWeight: 800,
                    fontSize: "16px",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  キャンセル
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    height: "54px",
                    borderRadius: "16px",
                    border: "none",
                    background: "#111827",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "16px",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "保存中..." : "保存する"}
                </button>
              </div>
            </section>
          </form>
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "52px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  padding: "0 14px",
  fontSize: "16px",
  color: "#111827",
  boxSizing: "border-box",
};