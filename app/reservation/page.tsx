import Link from "next/link";

type SearchParams = Promise<{
  month?: string;
  store?: string;
  staff?: string;
}>;

type ReservationItem = {
  id: number;
  date: string;
  title: string;
  color: string;
  store: string;
  staff: string;
};

const STORE_TABS = ["すべて", "江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町"];
const STAFF_TABS = ["すべて", "山口", "中西", "池田", "石川", "菱谷", "林", "井上", "その他"];

const SAMPLE_RESERVATIONS: ReservationItem[] = [
  { id: 1, date: "2026-04-02", title: "石川休み", color: "#60a5fa", store: "江戸堀", staff: "石川" },
  { id: 2, date: "2026-04-02", title: "池田勤務", color: "#a78bfa", store: "福島", staff: "池田" },
  { id: 3, date: "2026-04-02", title: "M渡邉様ストレッチ", color: "#fbbf24", store: "箕面", staff: "菱谷" },
  { id: 4, date: "2026-04-02", title: "M柳父様セッション", color: "#34d399", store: "江戸堀", staff: "山口" },
  { id: 5, date: "2026-04-03", title: "M中野様", color: "#34d399", store: "箕面", staff: "中西" },
  { id: 6, date: "2026-04-03", title: "渡部様 4-2", color: "#34d399", store: "福島", staff: "山口" },
  { id: 7, date: "2026-04-04", title: "FP山崎様", color: "#34d399", store: "天満橋", staff: "山口" },
  { id: 8, date: "2026-04-05", title: "M福井様", color: "#34d399", store: "中崎町", staff: "中西" },
  { id: 9, date: "2026-04-08", title: "石川休み", color: "#60a5fa", store: "江戸堀", staff: "石川" },
  { id: 10, date: "2026-04-09", title: "神尾たかし", color: "#34d399", store: "箕面", staff: "山口" },
  { id: 11, date: "2026-04-10", title: "M中野様", color: "#34d399", store: "箕面", staff: "中西" },
  { id: 12, date: "2026-04-11", title: "F河村様ペア", color: "#fca5a5", store: "福島", staff: "池田" },
  { id: 13, date: "2026-04-12", title: "石川勤務", color: "#60a5fa", store: "江戸堀", staff: "石川" },
  { id: 14, date: "2026-04-15", title: "石川休み", color: "#60a5fa", store: "江戸堀", staff: "石川" },
  { id: 15, date: "2026-04-16", title: "M中野様", color: "#34d399", store: "箕面", staff: "中西" },
  { id: 16, date: "2026-04-18", title: "A仲田芽衣", color: "#d1d5db", store: "福島P", staff: "その他" },
  { id: 17, date: "2026-04-19", title: "FP平井さん", color: "#93c5fd", store: "江戸堀", staff: "石川" },
  { id: 18, date: "2026-04-22", title: "N吉川様スト", color: "#93c5fd", store: "箕面", staff: "山口" },
  { id: 19, date: "2026-04-24", title: "HC", color: "#86efac", store: "江戸堀", staff: "その他" },
  { id: 20, date: "2026-04-25", title: "M西田様", color: "#93c5fd", store: "箕面", staff: "中西" },
  { id: 21, date: "2026-04-29", title: "昭和の日", color: "#ef4444", store: "すべて", staff: "その他" },
  { id: 22, date: "2026-04-30", title: "橋本様セッション", color: "#34d399", store: "天満橋", staff: "山口" },
];

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

function getDayItems(date: string, store: string, staff: string) {
  return SAMPLE_RESERVATIONS.filter((item) => {
    const matchDate = item.date === date;
    const matchStore = store === "すべて" || item.store === store;
    const matchStaff = staff === "すべて" || item.staff === staff;
    return matchDate && matchStore && matchStaff;
  }).slice(0, 4);
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

export default async function ReservationPage(props: { searchParams?: SearchParams }) {
  const resolved = (await props.searchParams) || {};
  const todayMonth = toMonthString(new Date());

  const month = resolved.month && /^\d{4}-\d{2}$/.test(resolved.month) ? resolved.month : todayMonth;
  const store = resolved.store || "すべて";
  const staff = resolved.staff || "すべて";

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
              const items = getDayItems(day.date, store, staff);

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
      </div>
    </main>
  );
}