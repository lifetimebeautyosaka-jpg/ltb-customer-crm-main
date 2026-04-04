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

type TicketUsageRow = {
  id: number;
  reservation_id: number | null;
  ticket_id: number | null;
  ticket_name: string | null;
  before_count: number | null;
  after_count: number | null;
};

type SaleRow = {
  id: number;
  reservation_id: number | null;
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

function detectServiceType(menu?: string | null): "ストレッチ" | "トレーニング" {
  const text = String(menu || "");
  if (text.includes("ストレッチ")) return "ストレッチ";
  return "トレーニング";
}

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

  const reservationIds = items.map((item) => item.id).filter(Boolean);

  let usageMap = new Map<number, TicketUsageRow>();
  let salesReservationSet = new Set<number>();

  if (reservationIds.length > 0) {
    const { data: usageData } = await supabase
      .from("ticket_usages")
      .select("id, reservation_id, ticket_id, ticket_name, before_count, after_count")
      .in("reservation_id", reservationIds);

    const usageList = (usageData as TicketUsageRow[] | null) || [];
    usageMap = new Map(
      usageList
        .filter((row) => row.reservation_id !== null)
        .map((row) => [Number(row.reservation_id), row])
    );

    const { data: salesData } = await supabase
      .from("sales")
      .select("id, reservation_id")
      .in("reservation_id", reservationIds);

    salesReservationSet = new Set(
      ((salesData as SaleRow[] | null) || [])
        .map((row) => Number(row.reservation_id))
        .filter((id) => !Number.isNaN(id) && id > 0)
    );
  }

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

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "18px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#4b5563",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: "#16a34a",
                  display: "inline-block",
                }}
              />
              回数券消化済み
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: "#2563eb",
                  display: "inline-block",
                }}
              />
              売上登録済み
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: "#fb923c",
                  display: "inline-block",
                }}
              />
              未消化
            </div>
          </div>

          {error ? (
            <div style={emptyStyle}>予約データの取得に失敗しました。</div>
          ) : items.length === 0 ? (
            <div style={emptyStyle}>この日の予約はありません</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {items.map((item) => {
                const color = STAFF_COLORS[item.staff_name || "その他"] || "#9ca3af";
                const usage = usageMap.get(item.id);
                const isSalesRegistered = salesReservationSet.has(item.id);
                const serviceType = detectServiceType(item.menu);

                const salesHref = `/sales?date=${encodeURIComponent(item.date || "")}&customer_name=${encodeURIComponent(
                  item.customer_name || ""
                )}&store_name=${encodeURIComponent(item.store_name || "")}&staff_name=${encodeURIComponent(
                  item.staff_name || ""
                )}&service_type=${encodeURIComponent(serviceType)}&menu=${encodeURIComponent(
                  item.menu || ""
                )}&reservation_id=${encodeURIComponent(String(item.id))}`;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "78px 6px 1fr 52px",
                      gap: "12px",
                      alignItems: "start",
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
                      <Link
                        href={`/reservation/detail/${item.id}`}
                        style={{
                          display: "block",
                          textDecoration: "none",
                          color: "#111827",
                        }}
                      >
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

                          {usage ? (
                            <span
                              style={{
                                ...chipStyle,
                                background: "#ecfdf5",
                                color: "#065f46",
                                border: "1px solid #a7f3d0",
                              }}
                            >
                              回数券消化済み
                            </span>
                          ) : (
                            <span
                              style={{
                                ...chipStyle,
                                background: "#fff7ed",
                                color: "#9a3412",
                                border: "1px solid #fdba74",
                              }}
                            >
                              未消化
                            </span>
                          )}

                          {isSalesRegistered ? (
                            <span
                              style={{
                                ...chipStyle,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #93c5fd",
                              }}
                            >
                              売上登録済み
                            </span>
                          ) : null}
                        </div>

                        {usage ? (
                          <div
                            style={{
                              marginTop: "8px",
                              fontSize: "13px",
                              color: "#065f46",
                              lineHeight: 1.5,
                              fontWeight: 700,
                            }}
                          >
                            {usage.ticket_name || "回数券"} / 消化前 {usage.before_count ?? "-"} → 消化後 {usage.after_count ?? "-"}
                          </div>
                        ) : null}

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
                      </Link>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: "12px",
                        }}
                      >
                        <Link href={`/reservation/detail/${item.id}`} style={actionButtonStyle}>
                          詳細を見る
                        </Link>

                        {isSalesRegistered ? (
                          <span style={doneButtonStyle}>売上登録済み</span>
                        ) : (
                          <Link href={salesHref} style={actionDarkButtonStyle}>
                            売上登録へ
                          </Link>
                        )}
                      </div>
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
                  </div>
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

const actionButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: "13px",
};

const actionDarkButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  background: "#111827",
  color: "#ffffff",
  border: "1px solid #111827",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: "13px",
};

const doneButtonStyle: React.CSSProperties = {
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #93c5fd",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: "13px",
  display: "inline-block",
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