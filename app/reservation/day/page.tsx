import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type SearchParams = Promise<{
  date?: string;
  store?: string;
  staff?: string;
}>;

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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(dateStr?: string) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date();
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatJapaneseDate(dateStr: string) {
  const date = parseDate(dateStr);
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${week[date.getDay()]}曜日`;
}

function prevDate(dateStr: string) {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() - 1);
  return toDateString(date);
}

function nextDate(dateStr: string) {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + 1);
  return toDateString(date);
}

function currentMonthFromDate(dateStr: string) {
  const date = parseDate(dateStr);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function getInitial(name?: string | null) {
  if (!name) return "他";
  return name.slice(0, 1);
}

const STAFF_COLORS: Record<string, string> = {
  山口: "#16a34a",
  中西: "#ec4899",
  池田: "#8b5cf6",
  石川: "#3b82f6",
  菱谷: "#f59e0b",
  林: "#111827",
  井上: "#6b7280",
  その他: "#9ca3af",
};

export default async function ReservationDayPage(props: { searchParams?: SearchParams }) {
  const resolved = (await props.searchParams) || {};
  const date =
    resolved.date && /^\d{4}-\d{2}-\d{2}$/.test(resolved.date)
      ? resolved.date
      : toDateString(new Date());

  const store = resolved.store || "すべて";
  const staff = resolved.staff || "すべて";

  let query = supabase
    .from("reservations")
    .select("id, customer_name, date, start_time, store_name, staff_name, menu, payment_method, memo")
    .eq("date", date)
    .order("start_time", { ascending: true });

  if (store !== "すべて") {
    query = query.eq("store_name", store);
  }

  if (staff !== "すべて") {
    query = query.eq("staff_name", staff);
  }

  const { data, error } = await query;
  const items = ((data as ReservationRow[] | null) || []).sort((a, b) =>
    String(a.start_time || "").localeCompare(String(b.start_time || ""))
  );

  const backHref = `/reservation?month=${currentMonthFromDate(date)}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;
  const prevHref = `/reservation/day?date=${prevDate(date)}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;
  const nextHref = `/reservation/day?date=${nextDate(date)}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;
  const newHref = `/reservation/new?date=${date}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5", paddingBottom: "90px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px 12px 40px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "28px",
            padding: "18px 16px 22px",
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
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
              {formatJapaneseDate(date)}
            </div>

            <Link
              href={newHref}
              style={{
                textDecoration: "none",
                width: "48px",
                height: "48px",
                borderRadius: "999px",
                background: "#111111",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                lineHeight: 1,
                fontWeight: 400,
              }}
            >
              +
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <Link href={backHref} style={subButtonStyle}>
              カレンダーへ戻る
            </Link>

            <Link href={prevHref} style={subButtonStyle}>
              ← 前日
            </Link>

            <Link href={nextHref} style={subButtonStyle}>
              翌日 →
            </Link>
          </div>

          {error ? (
            <div style={emptyStyle}>予約データの取得に失敗しました。</div>
          ) : items.length === 0 ? (
            <div style={emptyStyle}>この日の予約はありません</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {items.map((item) => {
                const color = STAFF_COLORS[item.staff_name || "その他"] || "#9ca3af";

                return (
                  <Link
                    key={item.id}
                    href={`/reservation/detail/${item.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "78px 6px 1fr 52px",
                      gap: "12px",
                      alignItems: "start",
                      textDecoration: "none",
                      color: "#111827",
                    }}
                  >
                    <div style={{ textAlign: "right", paddingTop: "2px" }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#111827" }}>
                        {item.start_time || "未定"}
                      </div>
                    </div>

                    <div
                      style={{
                        width: "4px",
                        borderRadius: "999px",
                        background: color,
                        minHeight: "70px",
                        marginTop: "2px",
                      }}
                    />

                    <div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 800,
                          color: "#111827",
                          letterSpacing: "-0.03em",
                          lineHeight: 1.2,
                        }}
                      >
                        {item.customer_name || item.menu || "予約"}
                      </div>

                      <div
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {item.store_name ? <span style={chipStyle}>{item.store_name}</span> : null}
                        {item.staff_name ? (
                          <span style={{ ...chipStyle, background: color, color: "#fff", border: "none" }}>
                            {item.staff_name}
                          </span>
                        ) : null}
                        {item.payment_method ? <span style={chipStyle}>{item.payment_method}</span> : null}
                        {item.menu ? <span style={chipStyle}>{item.menu}</span> : null}
                      </div>

                      {item.memo ? (
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "14px",
                            color: "#6b7280",
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {item.memo}
                        </div>
                      ) : null}
                    </div>

                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "999px",
                        background: color,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: 800,
                        marginTop: "4px",
                      }}
                    >
                      {getInitial(item.staff_name)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: "14px",
};

const chipStyle: React.CSSProperties = {
  borderRadius: "999px",
  border: "1px solid #d1d5db",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 700,
  background: "#fff",
  color: "#111827",
};

const emptyStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "24px",
  textAlign: "center",
  color: "#6b7280",
  fontWeight: 700,
};