"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: number;
  name: string;
  kana: string | null;
  phone: string | null;
};

const STORES = ["江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町"];
const STAFFS = ["山口", "中西", "池田", "石川", "羽田", "菱谷", "井上", "林", "その他"];
const MENUS = ["ストレッチ", "トレーニング", "ペアトレ", "ヘッドスパ", "アロマ", "その他"];
const PAYMENT_METHODS = ["現金", "カード", "銀行振込", "その他"];
const VISIT_TYPES = ["新規", "再来"];

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReservationNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const customerIdFromQuery = searchParams.get("customerId");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerIdFromQuery ?? "");
  const [customerName, setCustomerName] = useState("");

  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [storeName, setStoreName] = useState("江戸堀");
  const [staffName, setStaffName] = useState("山口");
  const [menu, setMenu] = useState("ストレッチ");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [memo, setMemo] = useState("");
  const [visitType, setVisitType] = useState("再来");

  const selectedCustomer = useMemo(() => {
    const id = Number(selectedCustomerId);
    if (!id) return null;
    return customers.find((c) => c.id === id) ?? null;
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.name || "");
    }
  }, [selectedCustomer]);

  async function fetchCustomers() {
    setLoadingCustomers(true);
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, kana, phone")
      .order("id", { ascending: false });

    if (error) {
      alert(`顧客取得エラー: ${error.message}`);
      setLoadingCustomers(false);
      return;
    }

    setCustomers((data ?? []) as Customer[]);
    setLoadingCustomers(false);
  }

  async function handleSave() {
    if (!customerName.trim()) {
      alert("顧客を選択してください");
      return;
    }
    if (!date) {
      alert("日付を入力してください");
      return;
    }
    if (!startTime) {
      alert("開始時間を入力してください");
      return;
    }
    if (!storeName) {
      alert("店舗を選択してください");
      return;
    }
    if (!staffName) {
      alert("担当スタッフを選択してください");
      return;
    }
    if (!visitType) {
      alert("来店区分を選択してください");
      return;
    }

    setSaving(true);

    const payload = {
      customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
      customer_name: customerName,
      date,
      start_time: startTime,
      end_time: endTime || "",
      store_name: storeName,
      staff_name: staffName,
      menu,
      payment_method: paymentMethod,
      memo,
      visit_type: visitType,
      reservation_status: "予約済",
      is_first_visit: visitType === "新規",
    };

    const { error } = await supabase.from("reservations").insert([payload]);

    setSaving(false);

    if (error) {
      alert(`予約保存エラー: ${error.message}`);
      return;
    }

    alert("予約を保存しました");
    router.push("/reservation");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8f8f8 0%, #efefef 45%, #f9f9f9 100%)",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>予約作成</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/reservation" style={topBtnStyle}>
              予約一覧へ
            </Link>
            <Link href="/" style={topBtnStyle}>
              TOPへ
            </Link>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>基本情報</div>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>顧客選択</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={inputStyle}
                disabled={loadingCustomers}
              >
                <option value="">顧客を選択してください</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.phone ? ` / ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>顧客名</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={inputStyle}
                placeholder="顧客名"
              />
            </div>

            <div>
              <label style={labelStyle}>来店区分</label>
              <div style={{ display: "flex", gap: 10 }}>
                {VISIT_TYPES.map((type) => {
                  const active = visitType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVisitType(type)}
                      style={{
                        ...toggleBtnStyle,
                        background: active ? (type === "新規" ? "#2563eb" : "#4b5563") : "#fff",
                        color: active ? "#fff" : "#111",
                        border: active ? "1px solid transparent" : "1px solid #d1d5db",
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>日付</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>開始時間</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>終了時間</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>店舗</label>
              <select value={storeName} onChange={(e) => setStoreName(e.target.value)} style={inputStyle}>
                {STORES.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>担当スタッフ</label>
              <select value={staffName} onChange={(e) => setStaffName(e.target.value)} style={inputStyle}>
                {STAFFS.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>メニュー</label>
              <select value={menu} onChange={(e) => setMenu(e.target.value)} style={inputStyle}>
                {MENUS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>支払方法</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={inputStyle}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
              placeholder="メモ"
            />
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link href="/reservation" style={cancelBtnStyle}>
              キャンセル
            </Link>
            <button type="button" onClick={handleSave} style={saveBtnStyle} disabled={saving}>
              {saving ? "保存中..." : "予約を保存する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: 24,
  padding: 22,
  boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
  backdropFilter: "blur(10px)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 16,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 8,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: 14,
  outline: "none",
};

const toggleBtnStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 14,
  fontWeight: 700,
  cursor: "pointer",
  minWidth: 100,
};

const topBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 14,
  background: "#111827",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
};

const cancelBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 18px",
  borderRadius: 14,
  background: "#e5e7eb",
  color: "#111827",
  textDecoration: "none",
  fontWeight: 700,
};

const saveBtnStyle: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: 14,
  background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
  color: "#fff",
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
};