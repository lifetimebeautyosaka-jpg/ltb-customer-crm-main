import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type SearchParams = Promise<{
  month?: string;
  store?: string;
  staff?: string;
}>;

type ReservationRow = {
  id: number;
  date: string;
  customer_name: string | null;
  store_name: string | null;
  staff_name: string | null;
  menu: string | null;
};

type CalendarItem = {
  id: number;
  date: string;
  title: string;
  color: string;
  store: string;
  staff: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORE_TABS = ["すべて", "江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町"];
const STAFF_TABS = ["すべて", "山口", "中西", "池田", "石川", "菱谷", "林", "井上", "その他"];

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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toMonthString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getMonthDate(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function shiftMonth(month: string, offset: number) {
  const d = getMonthDate(month);
  d.setMonth(d.getMonth() + offset);
  return toMonthString(d);
}

function formatMonthLabel(month: string) {
  const d = getMonthDate(month);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function weekdayLabel(index: number) {
  return ["月", "火", "水", "木", "金", "土", "日"][index];
}

function buildCalendarDays(month: string) {
  const firstDay = getMonthDate(month);
  const year = firstDay.getFullYear();
  const monthIndex = firstDay.getMonth();

  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, monthIndex, 1 - firstWeekday);

  return Array.from({ length: 35 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    return {
      date: toDateString(d),
      day: d.getDate(),
      isCurrentMonth: d.getMonth() === monthIndex,
      isToday: toDateString(d) === toDateString(new Date()),
    };
  });
}

function buildTabHref(month: string, store: string, staff: string, nextType: "store" | "staff", nextValue: string) {
  const nextStore = nextType === "store" ? nextValue : store;
  const nextStaff = nextType === "staff" ? nextValue : staff;
  return `/reservation?month=${month}&store=${encodeURIComponent(nextStore)}&staff=${encodeURIComponent(nextStaff)}`;
}

function buildDayHref(date: string, store: string, staff: string) {
  return `/reservation/day?date=${date}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;
}

function buildNewHref(month: string, store: string, staff: string) {
  return `/reservation/new?month=${month}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;
}

function getDisplayTitle(row: ReservationRow) {
  if (row.customer_name?.trim()) return row.customer_name.trim();
  if (row.menu?.trim()) return row.menu.trim();
  return "予約";
}

function mapReservationToCalendarItem(row: ReservationRow): CalendarItem {
  const staff = row.staff_name || "その他";
  return {
    id: row.id,
    date: row.date,
    title: getDisplayTitle(row),
    color: STAFF_COLORS[staff] || "#9ca3af",
    store: row.store_name || "未設定",
    staff,
  };
}

function getDayItems(items: CalendarItem[], date: string, store: string, staff: string) {
  return items
    .filter((item) => {
      const matchDate = item.date === date;
      const matchStore = store === "すべて" || item.store === store;
      const matchStaff = staff === "すべて" || item.staff === staff;
      return matchDate && matchStore && matchStaff;
    })
    .slice(0, 4);
}

export default async function ReservationPage(props: { searchParams?: SearchParams }) {
  const resolved = (await props.searchParams) || {};
  const todayMonth = toMonthString(new Date());

  const month = resolved.month && /^\d{4}-\d{2}$/.test(resolved.month) ? resolved.month : todayMonth;
  const store = resolved.store || "すべて";
  const staff = resolved.staff || "すべて";

  const monthDate = getMonthDate(month);
  const startDate = toDateString(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
  const endDate = toDateString(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));

  let query = supabase
    .from("reservations")
    .select("id, date, customer_name, store_name, staff_name, menu")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (store !== "すべて") {
    query = query.eq("store_name", store);
  }

  if (staff !== "すべて") {
    query = query.eq("staff_name", staff);
  }

  const { data, error } = await query;

  const reservations: CalendarItem[] = error
    ? []
    : ((data as ReservationRow[] | null) || []).map(mapReservationToCalendarItem);

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const days = buildCalendarDays(month);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5", paddingBottom: "100px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 12px 40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "18px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href={`/reservation?month=${prevMonth}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`}
              style={{
                textDecoration: "none",
                background: "#ffffff",
                color: "#111827",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "10px 14px",
                fontWeight: 700,
              }}
            >
              ←
            </Link>

            <div style={{ fontSize: "36px", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
              {formatMonthLabel(month)}
            </div>

            <Link
              href={`/reservation?month=${nextMonth}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`}
              style={{
                textDecoration: "none",
                background: "#ffffff",
                color: "#111827",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "10px 14px",
                fontWeight: 700,
              }}
            >
              →
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/"
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
              href={buildNewHref(month, store, staff)}
              style={{
                textDecoration: "none",
                background: "#111827",
                color: "#ffffff",
                borderRadius: "999px",
                width: "56px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "34px",
                lineHeight: 1,
                boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
                flexShrink: 0,
              }}
            >
              +
            </Link>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px", marginBottom: "12px" }}>
            {STORE_TABS.map((tab) => {
              const active = store === tab;
              return (
                <Link
                  key={tab}
                  href={buildTabHref(month, store, staff, "store", tab)}
                  style={{
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    padding: "12px 18px",
                    borderRadius: "16px",
                    border: active ? "2px solid #111827" : "1px solid #d1d5db",
                    background: active ? "#111827" : "#ffffff",
                    color: active ? "#ffffff" : "#111827",
                    fontWeight: 700,
                    fontSize: "15px",
                  }}
                >
                  {tab}
                </Link>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
            {STAFF_TABS.map((tab) => {
              const active = staff === tab;
              return (
                <Link
                  key={tab}
                  href={buildTabHref(month, store, staff, "staff", tab)}
                  style={{
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    padding: "10px 16px",
                    borderRadius: "999px",
                    border: active ? "2px solid #111827" : "1px solid #d1d5db",
                    background: active ? "#f3f4f6" : "#ffffff",
                    color: "#111827",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  {tab}
                </Link>
              );
            })}
          </div>
        </div>

        {error ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "20px",
              color: "#991b1b",
              fontWeight: 700,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            予約データの取得に失敗しました。
          </div>
        ) : (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                borderBottom: "1px solid #e5e7eb",
                background: "#fafafa",
              }}
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    padding: "14px 6px",
                    fontWeight: 700,
                    color: i === 5 ? "#2563eb" : i === 6 ? "#ef4444" : "#6b7280",
                    fontSize: "15px",
                  }}
                >
                  {weekdayLabel(i)}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              }}
            >
              {days.map((day) => {
                const items = getDayItems(reservations, day.date, store, staff);

                return (
                  <Link
                    key={day.date}
                    href={buildDayHref(day.date, store, staff)}
                    style={{
                      textDecoration: "none",
                      color: "#111827",
                      minHeight: "150px",
                      borderRight: "1px solid #e5e7eb",
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px",
                      background: day.isCurrentMonth ? "#ffffff" : "#fafafa",
                      display: "block",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "999px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "15px",
                          background: day.isToday ? "#111827" : "transparent",
                          color: day.isToday ? "#ffffff" : day.isCurrentMonth ? "#111827" : "#9ca3af",
                        }}
                      >
                        {day.day}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: item.color,
                            color: "#ffffff",
                            borderRadius: "6px",
                            padding: "4px 6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.title}
                        </div>
                      ))}

                      {items.length === 0 ? (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#d1d5db",
                            paddingTop: "2px",
                          }}
                        >
                          予約なし
                        </div>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}