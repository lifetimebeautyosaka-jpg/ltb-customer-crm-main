import Link from "next/link";

type SearchParams = Promise<{
  date?: string;
  store?: string;
  staff?: string;
}>;

type DayReservation = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  subtitle?: string;
  note?: string;
  color: string;
  store: string;
  staff: string;
  staffIcon: string;
};

const SAMPLE_DAY_RESERVATIONS: DayReservation[] = [
  {
    id: 1,
    date: "2026-04-02",
    startTime: "終日",
    endTime: "",
    title: "ビビビ祭ポイント還元有効期限 4月末まで",
    color: "#111111",
    store: "江戸堀",
    staff: "山口",
    staffIcon: "山",
  },
  {
    id: 2,
    date: "2026-04-02",
    startTime: "終日",
    endTime: "",
    title: "石川休み",
    subtitle: "予定",
    color: "#60a5fa",
    store: "江戸堀",
    staff: "石川",
    staffIcon: "石",
  },
  {
    id: 3,
    date: "2026-04-02",
    startTime: "9:00",
    endTime: "18:00",
    title: "池田勤務",
    color: "#a78bfa",
    store: "福島",
    staff: "池田",
    staffIcon: "池",
  },
  {
    id: 4,
    date: "2026-04-02",
    startTime: "9:30",
    endTime: "10:30",
    title: "神尾ふさえ 96-49",
    color: "#34d399",
    store: "江戸堀",
    staff: "山口",
    staffIcon: "山",
  },
  {
    id: 5,
    date: "2026-04-02",
    startTime: "11:00",
    endTime: "11:40",
    title: "F太田様ストレッチ 4-3",
    color: "#9ca3af",
    store: "福島",
    staff: "池田",
    staffIcon: "池",
  },
  {
    id: 6,
    date: "2026-04-02",
    startTime: "13:00",
    endTime: "19:00",
    title: "菱谷出勤",
    color: "#fbbf24",
    store: "箕面",
    staff: "菱谷",
    staffIcon: "菱",
  },
  {
    id: 7,
    date: "2026-04-02",
    startTime: "13:20",
    endTime: "14:00",
    title: "M渡邉様ストレッチ",
    subtitle: "駐車場",
    color: "#fbbf24",
    store: "箕面",
    staff: "菱谷",
    staffIcon: "輝",
  },
  {
    id: 8,
    date: "2026-04-02",
    startTime: "14:30",
    endTime: "15:50",
    title: "N川迫様ストレッチ 8-2",
    subtitle: "指名料1,000円 領収済",
    color: "#9ca3af",
    store: "福島",
    staff: "池田",
    staffIcon: "池",
  },
  {
    id: 9,
    date: "2026-04-02",
    startTime: "15:00",
    endTime: "16:20",
    title: "F本岡様ストレッチ 80",
    subtitle: "80分11900円 指名料1000円 合計12900円",
    color: "#fbbf24",
    store: "箕面",
    staff: "菱谷",
    staffIcon: "輝",
  },
  {
    id: 10,
    date: "2026-04-02",
    startTime: "15:00",
    endTime: "16:00",
    title: "M柳父様セッション",
    subtitle: "駐車場",
    color: "#34d399",
    store: "江戸堀",
    staff: "山口",
    staffIcon: "山",
  },
  {
    id: 11,
    date: "2026-04-02",
    startTime: "16:00",
    endTime: "17:00",
    title: "M柳父様セッション",
    color: "#34d399",
    store: "江戸堀",
    staff: "山口",
    staffIcon: "山",
  },
  {
    id: 12,
    date: "2026-04-02",
    startTime: "16:30",
    endTime: "17:30",
    title: "M河原様",
    subtitle: "駐車場",
    color: "#34d399",
    store: "江戸堀",
    staff: "山口",
    staffIcon: "山",
  },
  {
    id: 13,
    date: "2026-04-02",
    startTime: "18:15",
    endTime: "19:15",
    title: "FP イテヤ様ストレッチ 8-4",
    color: "#34d399",
    store: "江戸堀",
    staff: "山口",
    staffIcon: "山",
  },
];

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

function buildBackHref(date: string, store: string, staff: string) {
  return `/reservation?month=${currentMonthFromDate(date)}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;
}

function buildShiftHref(date: string, store: string, staff: string, type: "prev" | "next") {
  const next = type === "prev" ? prevDate(date) : nextDate(date);
  return `/reservation/day?date=${next}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;
}

function buildNewHref(date: string, store: string, staff: string) {
  return `/reservation/new?date=${date}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;
}

function getFilteredReservations(date: string, store: string, staff: string) {
  return SAMPLE_DAY_RESERVATIONS.filter((item) => {
    const matchDate = item.date === date;
    const matchStore = store === "すべて" || item.store === store;
    const matchStaff = staff === "すべて" || item.staff === staff;
    return matchDate && matchStore && matchStaff;
  }).sort((a, b) => {
    if (a.startTime === "終日" && b.startTime !== "終日") return -1;
    if (a.startTime !== "終日" && b.startTime === "終日") return 1;
    return a.startTime.localeCompare(b.startTime);
  });
}

export default async function ReservationDayPage(props: { searchParams?: SearchParams }) {
  const resolved = (await props.searchParams) || {};
  const date = resolved.date && /^\d{4}-\d{2}-\d{2}$/.test(resolved.date) ? resolved.date : toDateString(new Date());
  const store = resolved.store || "すべて";
  const staff = resolved.staff || "すべて";

  const items = getFilteredReservations(date, store, staff);

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
            }}
          >
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
              {formatJapaneseDate(date)}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                href={buildNewHref(date, store, staff)}
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
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <Link
              href={buildBackHref(date, store, staff)}
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
              月表示へ戻る
            </Link>

            <Link
              href={buildShiftHref(date, store, staff, "prev")}
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
              ← 前日
            </Link>

            <Link
              href={buildShiftHref(date, store, staff, "next")}
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
              翌日 →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {items.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "20px",
                  padding: "24px",
                  textAlign: "center",
                  color: "#6b7280",
                  fontWeight: 700,
                }}
              >
                この日の予約はありません
              </div>
            ) : (
              items.map((item) => (
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
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#111827" }}>{item.startTime}</div>
                    {item.endTime ? (
                      <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px", fontWeight: 700 }}>
                        {item.endTime}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      width: "4px",
                      borderRadius: "999px",
                      background: item.color,
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
                      {item.title}
                    </div>

                    {item.subtitle ? (
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "16px",
                          color: "#6b7280",
                          lineHeight: 1.4,
                          fontWeight: 500,
                        }}
                      >
                        {item.subtitle}
                      </div>
                    ) : null}

                    {item.note ? (
                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "15px",
                          color: "#6b7280",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.note}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "999px",
                      background: item.color,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: 800,
                      marginTop: "4px",
                    }}
                  >
                    {item.staffIcon}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}