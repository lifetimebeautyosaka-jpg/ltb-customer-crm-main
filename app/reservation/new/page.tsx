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
  const [completed, setCompleted] = useState(false);
  const [savedCustomerId, setSavedCustomerId] = useState("");

  const backHref = useMemo(() => {
    return `/reservation/day?date=${date}`;
  }, [date]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setCompleted(false);

    const name = customerName.trim();
    const memoText = memo.trim();

    if (!name) {
      alert("名前を入力してください");
      setSaving(false);
      return;
    }

    try {
      let customerId = "";

      const { data: existingCustomers, error: customerFindError } = await supabase
        .from("customers")
        .select("id")
        .eq("name", name)
        .order("id", { ascending: false })
        .limit(1);

      if (customerFindError) {
        alert(`顧客取得エラー: ${customerFindError.message}`);
        setSaving(false);
        return;
      }

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = String(existingCustomers[0].id);
      } else {
        const { data: insertedCustomer, error: customerInsertError } = await supabase
          .from("customers")
          .insert([{ name }])
          .select("id")
          .single();

        if (customerInsertError) {
          alert(`顧客登録エラー: ${customerInsertError.message}`);
          setSaving(false);
          return;
        }

        customerId = String(insertedCustomer.id);
      }

      const { error: reservationError } = await supabase
        .from("reservations")
        .insert([
          {
            customer_name: name,
            date,
            start_time: startTime,
            store_name: storeName,
            staff_name: staffName,
            menu,
            payment_method: paymentMethod,
            memo: memoText,
          },
        ]);

      if (reservationError) {
        alert(`予約保存エラー: ${reservationError.message}`);
        setSaving(false);
        return;
      }

      setSavedCustomerId(customerId);
      setMsg("保存完了");
      setCompleted(true);
    } catch (error: any) {
      alert(error?.message || "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push(backHref);
  };

  return (
    <main style={{ background: "#f5f5f5", minHeight: "100vh", padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: "26px", fontWeight: "800", margin: 0 }}>新規予約</h2>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/reservation" style={topBtn}>
            カレンダーへ
          </Link>

          <Link href={backHref} style={backBtn}>
            ← 戻る
          </Link>
        </div>
      </div>

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

        {msg && (
          <p style={{ color: "green", textAlign: "center", margin: 0, fontWeight: 700 }}>
            {msg}
          </p>
        )}
      </form>

      {completed && savedCustomerId && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={badgeStyle}>予約完了</div>

            <h3 style={{ margin: "0 0 10px", fontSize: "24px", fontWeight: 800 }}>
              カウンセリング入力しますか？
            </h3>

            <p style={{ margin: "0 0 20px", color: "#555", lineHeight: 1.7 }}>
              初回来店や情報確認が必要な場合は、
              このままカウンセリングシートへ進めます。
            </p>

            <div style={modalButtonWrap}>
              <Link href={`/customer/${savedCustomerId}/counseling`} style={modalPrimaryLink}>
                今すぐ入力する
              </Link>

              <button type="button" style={modalSecondaryBtn} onClick={handleSkip}>
                あとで入力する
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Input({
  label,
  value,
  set,
  type = "text",
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        style={input}
      />
    </div>
  );
}

function Select({
  label,
  value,
  set,
  list,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  list: string[];
}) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <select value={value} onChange={(e) => set(e.target.value)} style={input}>
        {list.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

const topBtn: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "14px",
  textDecoration: "none",
  fontWeight: 700,
};

const backBtn: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "14px",
  textDecoration: "none",
  color: "#111",
  fontWeight: 700,
};

const card: React.CSSProperties = {
  background: "#fff",
  padding: "20px",
  borderRadius: "15px",
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  maxWidth: "980px",
  margin: "0 auto",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  marginBottom: "4px",
  fontWeight: "600",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fff",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: "80px",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  resize: "vertical",
};

const saveBtn: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: "12px",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "20px",
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "460px",
  background: "#fff",
  borderRadius: "20px",
  padding: "28px 24px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  textAlign: "center",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  background: "#f3f4f6",
  color: "#111",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "14px",
};

const modalButtonWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const modalPrimaryLink: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#111",
  color: "#fff",
  padding: "14px 16px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 700,
};

const modalSecondaryBtn: React.CSSProperties = {
  width: "100%",
  background: "#f3f4f6",
  color: "#111",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
};