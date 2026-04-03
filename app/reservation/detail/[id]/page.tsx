import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ReservationRow = {
  id: number;
  customer_name: string | null;
  date: string | null;
  start_time: string | null;
  store_name: string | null;
  staff_name: string | null;
  menu: string | null;
  payment_method: string | null;
  memo: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function formatDateJP(dateStr?: string | null) {
  if (!dateStr) return "未設定";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${week[d.getDay()]}）`;
}

function detectServiceType(menu?: string | null) {
  const text = String(menu || "");
  if (text.includes("ストレッチ")) return "ストレッチ";
  return "トレーニング";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: "12px",
        padding: "14px 0",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#111827",
          fontSize: "15px",
          fontWeight: 600,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {value || "未設定"}
      </div>
    </div>
  );
}

export default async function ReservationDetailPage({ params }: PageProps) {
  const resolved = await params;
  const id = Number(resolved.id);

  if (!id || Number.isNaN(id)) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <h1 style={titleStyle}>予約詳細</h1>
            <p style={errorTextStyle}>予約IDが不正です。</p>

            <div style={{ marginTop: "18px" }}>
              <Link href="/reservation" style={mainButtonStyle}>
                カレンダーへ
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("id, customer_name, date, start_time, store_name, staff_name, menu, payment_method, memo")
    .eq("id", id)
    .single<ReservationRow>();

  if (error || !data) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <h1 style={titleStyle}>予約詳細</h1>
            <p style={errorTextStyle}>予約データが見つかりませんでした。</p>

            <div style={{ marginTop: "18px" }}>
              <Link href="/reservation" style={mainButtonStyle}>
                カレンダーへ
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const dayHref = data.date ? `/reservation/day?date=${data.date}` : "/reservation";
  const calendarHref = data.date ? `/reservation?month=${String(data.date).slice(0, 7)}` : "/reservation";

  const salesHref =
    `/sales?` +
    `date=${encodeURIComponent(data.date || "")}` +
    `&customer=${encodeURIComponent(data.customer_name || "")}` +
    `&store=${encodeURIComponent(data.store_name || "")}` +
    `&staff=${encodeURIComponent(data.staff_name || "")}` +
    `&service=${encodeURIComponent(detectServiceType(data.menu))}` +
    `&menu=${encodeURIComponent(data.menu || "")}`;

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <h1 style={titleStyle}>予約詳細</h1>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href={salesHref} style={mainButtonStyle}>
              売上登録へ
            </Link>

            <Link href={calendarHref} style={subButtonStyle}>
              カレンダーへ
            </Link>

            <Link href={dayHref} style={subButtonStyle}>
              ← 日別へ戻る
            </Link>
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              marginBottom: "18px",
              padding: "18px",
              borderRadius: "18px",
              background: "#111827",
              color: "#fff",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "8px" }}>
              お客様
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800 }}>
              {data.customer_name || "未設定"}
            </div>
          </div>

          <DetailRow label="日付" value={formatDateJP(data.date)} />
          <DetailRow label="開始時間" value={data.start_time || "未設定"} />
          <DetailRow label="店舗" value={data.store_name || "未設定"} />
          <DetailRow label="担当者" value={data.staff_name || "未設定"} />
          <DetailRow label="メニュー" value={data.menu || "未設定"} />
          <DetailRow label="支払い方法" value={data.payment_method || "未設定"} />
          <DetailRow label="メモ" value={data.memo || "なし"} />

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link href={salesHref} style={mainButtonStyle}>
              売上登録へ
            </Link>

            <Link href={dayHref} style={subButtonStyle}>
              ← 日別一覧へ戻る
            </Link>

            <Link href={calendarHref} style={subButtonStyle}>
              カレンダーへ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f5f5",
  padding: "20px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "860px",
  margin: "0 auto",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 800,
  color: "#111827",
};

const errorTextStyle: React.CSSProperties = {
  marginTop: "12px",
  color: "#b91c1c",
  fontWeight: 700,
};

const mainButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  background: "#111827",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "14px",
};

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  background: "#fff",
  color: "#111827",
  border: "1px solid #d1d5db",
  padding: "10px 16px",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "14px",
};