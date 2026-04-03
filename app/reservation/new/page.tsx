import Link from "next/link";

type SearchParams = Promise<{
  date?: string;
  month?: string;
  store?: string;
  staff?: string;
}>;

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

function getDefaultDate(resolvedDate?: string, resolvedMonth?: string) {
  if (resolvedDate && /^\d{4}-\d{2}-\d{2}$/.test(resolvedDate)) return resolvedDate;
  if (resolvedMonth && /^\d{4}-\d{2}$/.test(resolvedMonth)) return `${resolvedMonth}-01`;
  return toDateString(new Date());
}

function buildBackHref(date: string, store: string, staff: string) {
  return `/reservation/day?date=${date}&store=${encodeURIComponent(store)}&staff=${encodeURIComponent(staff)}`;
}

function formatJapaneseDate(dateStr: string) {
  const date = parseDate(dateStr);
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日（${week[date.getDay()]}）`;
}

export default async function ReservationNewPage(props: { searchParams?: SearchParams }) {
  const resolved = (await props.searchParams) || {};

  const defaultDate = getDefaultDate(resolved.date, resolved.month);
  const defaultStore = resolved.store && resolved.store !== "すべて" ? resolved.store : "江戸堀";
  const defaultStaff = resolved.staff && resolved.staff !== "すべて" ? resolved.staff : "山口";

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
                {formatJapaneseDate(defaultDate)}
              </div>
            </div>

            <Link
              href={buildBackHref(defaultDate, defaultStore, defaultStaff)}
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
              ← 日別一覧へ戻る
            </Link>
          </div>

          <form style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
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
                    defaultValue=""
                  />
                </div>

                <div>
                  <label style={labelStyle}>日付</label>
                  <input type="date" defaultValue={defaultDate} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>店舗</label>
                  <select defaultValue={defaultStore} style={inputStyle}>
                    {STORE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>開始時間</label>
                  <input type="time" defaultValue="10:00" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>終了時間</label>
                  <input type="time" defaultValue="11:00" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>担当者</label>
                  <select defaultValue={defaultStaff} style={inputStyle}>
                    {STAFF_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>メニュー</label>
                  <select defaultValue="ストレッチ" style={inputStyle}>
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
                    type="text"
                    placeholder="例：8000"
                    style={inputStyle}
                    defaultValue=""
                  />
                </div>

                <div>
                  <label style={labelStyle}>支払い方法</label>
                  <select defaultValue="現金" style={inputStyle}>
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
                    defaultValue=""
                  />
                </div>
              </div>
            </section>

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
                  style={{
                    height: "54px",
                    borderRadius: "16px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#111827",
                    fontWeight: 800,
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  下書き
                </button>

                <button
                  type="submit"
                  style={{
                    height: "54px",
                    borderRadius: "16px",
                    border: "none",
                    background: "#111827",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  保存する
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