"use client";

import { useEffect, useMemo, useState } from "react";
import CRMLayout from "../../components/CRMLayout";

type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt?: string;
};

type ReservationStatus = "予約" | "来店" | "完了" | "キャンセル";

type Reservation = {
  id: string;
  customerId: string;
  customerName: string;
  phone?: string;
  menu: string;
  staff: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  memo?: string;
  status: ReservationStatus;
  createdAt: string;
};

const RESERVATIONS_KEY = "gymup_reservations";
const CUSTOMERS_PRIMARY_KEY = "gymup_customers";
const CUSTOMERS_FALLBACK_KEY = "customers";

const STAFF_COLORS: Record<
  string,
  { bg: string; border: string; text: string; dot: string }
> = {
  山口: { bg: "#e8fff4", border: "#38d39f", text: "#158f62", dot: "#2ecc71" },
  池田: { bg: "#eef8ff", border: "#5ab6ff", text: "#1e78c8", dot: "#3498db" },
  服部: { bg: "#fff6e8", border: "#ffb74d", text: "#c47a00", dot: "#f39c12" },
  中野: { bg: "#f4efff", border: "#a78bfa", text: "#6d4aff", dot: "#8b5cf6" },
  菱谷: { bg: "#fff0f3", border: "#ff8cab", text: "#cf4269", dot: "#ec4899" },
  その他: { bg: "#f3f4f6", border: "#cbd5e1", text: "#475569", dot: "#94a3b8" },
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "").trim();
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, "");
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadCustomers(): Customer[] {
  const a = safeParse<Customer[]>(localStorage.getItem(CUSTOMERS_PRIMARY_KEY), []);
  const b = safeParse<Customer[]>(localStorage.getItem(CUSTOMERS_FALLBACK_KEY), []);
  const merged = [...a, ...b];
  const map = new Map<string, Customer>();
  merged.forEach((c) => {
    if (c?.id) map.set(c.id, c);
  });
  return Array.from(map.values());
}

function saveCustomers(customers: Customer[]) {
  localStorage.setItem(CUSTOMERS_PRIMARY_KEY, JSON.stringify(customers));
  localStorage.setItem(CUSTOMERS_FALLBACK_KEY, JSON.stringify(customers));
}

function loadReservations(): Reservation[] {
  return safeParse<Reservation[]>(localStorage.getItem(RESERVATIONS_KEY), []);
}

function saveReservations(reservations: Reservation[]) {
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMonthDays(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function getStaffStyle(staff: string) {
  return STAFF_COLORS[staff] || STAFF_COLORS["その他"];
}

function sortReservations(list: Reservation[]) {
  return [...list].sort((a, b) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
  );
}

function saveCustomerDetail(customer: Customer) {
  const key = `customer-${customer.id}`;
  const existing = safeParse<Record<string, unknown> | null>(
    localStorage.getItem(key),
    null
  );

  const next = {
    ...(existing || {}),
    id: customer.id,
    name: customer.name,
    phone: customer.phone || "",
    email: customer.email || "",
    createdAt:
      typeof existing?.createdAt === "string"
        ? existing.createdAt
        : customer.createdAt,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(key, JSON.stringify(next));
}

export default function ReservationsPage() {
  const [mounted, setMounted] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [openedReservation, setOpenedReservation] = useState<Reservation | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [menu, setMenu] = useState("ストレッチ");
  const [staff, setStaff] = useState("山口");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    setMounted(true);

    const loggedIn =
      localStorage.getItem("gymup_logged_in") || localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    const loadedCustomers = loadCustomers();
    const loadedReservations = sortReservations(loadReservations());

    setCustomers(loadedCustomers);
    setReservations(loadedReservations);

    const today = formatDateKey(new Date());
    setSelectedDate(today);
    setDate(today);
  }, []);

  const monthDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach((r) => {
      const arr = map.get(r.date) || [];
      arr.push(r);
      map.set(r.date, sortReservations(arr));
    });
    return map;
  }, [reservations]);

  const selectedReservations = useMemo(() => {
    if (!selectedDate) return [];
    return groupedByDate.get(selectedDate) || [];
  }, [groupedByDate, selectedDate]);

  const handleCreateReservation = () => {
    if (!customerName.trim()) {
      alert("お客様名を入力してください");
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
    if (!endTime) {
      alert("終了時間を入力してください");
      return;
    }
    if (!staff.trim()) {
      alert("担当スタッフを選択してください");
      return;
    }

    const now = new Date().toISOString();
    const normalizedInputPhone = normalizePhone(phone);
    const normalizedInputName = normalizeName(customerName);

    let currentCustomers = loadCustomers();

    let matchedCustomer =
      currentCustomers.find((c) => {
        if (!normalizedInputPhone) return false;
        return normalizePhone(c.phone || "") === normalizedInputPhone;
      }) ||
      currentCustomers.find((c) => normalizeName(c.name) === normalizedInputName);

    if (!matchedCustomer) {
      matchedCustomer = {
        id: createId("customer"),
        name: customerName.trim(),
        phone: phone.trim(),
        createdAt: now,
        updatedAt: now,
      };
      currentCustomers = [matchedCustomer, ...currentCustomers];
      saveCustomers(currentCustomers);
      saveCustomerDetail(matchedCustomer);
      setCustomers(currentCustomers);
    } else {
      const updatedCustomer: Customer = {
        ...matchedCustomer,
        name: matchedCustomer.name || customerName.trim(),
        phone: matchedCustomer.phone || phone.trim(),
        updatedAt: now,
      };
      currentCustomers = currentCustomers.map((c) =>
        c.id === updatedCustomer.id ? updatedCustomer : c
      );
      saveCustomers(currentCustomers);
      saveCustomerDetail(updatedCustomer);
      setCustomers(currentCustomers);
      matchedCustomer = updatedCustomer;
    }

    const newReservation: Reservation = {
      id: createId("reservation"),
      customerId: matchedCustomer.id,
      customerName: matchedCustomer.name,
      phone: matchedCustomer.phone || phone.trim(),
      menu,
      staff,
      date,
      startTime,
      endTime,
      memo: memo.trim(),
      status: "予約",
      createdAt: now,
    };

    const nextReservations = sortReservations([...loadReservations(), newReservation]);
    saveReservations(nextReservations);
    setReservations(nextReservations);
    setSelectedDate(date);

    setCustomerName("");
    setPhone("");
    setMenu("ストレッチ");
    setStaff("山口");
    setStartTime("");
    setEndTime("");
    setMemo("");

    alert("予約を保存しました。顧客管理にも自動登録しました。");
  };

  const updateReservationStatus = (id: string, status: ReservationStatus) => {
    const next = reservations.map((r) => (r.id === id ? { ...r, status } : r));
    saveReservations(next);
    setReservations(sortReservations(next));

    if (openedReservation?.id === id) {
      const updated = next.find((r) => r.id === id) || null;
      setOpenedReservation(updated);
    }
  };

  const deleteReservation = (id: string) => {
    const ok = window.confirm("この予約を削除しますか？");
    if (!ok) return;

    const next = reservations.filter((r) => r.id !== id);
    saveReservations(next);
    setReservations(sortReservations(next));

    if (openedReservation?.id === id) {
      setOpenedReservation(null);
    }
  };

  const changeMonth = (diff: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + diff, 1));
  };

  if (!mounted) return null;

  return (
    <CRMLayout title="予約管理">
      <main style={styles.page}>
        <section style={styles.topRow}>
          <div style={styles.calendarCard}>
            <div style={styles.calendarHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button style={styles.navButton} onClick={() => changeMonth(-1)}>
                  ‹
                </button>
                <h1 style={styles.monthTitle}>
                  {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                </h1>
                <button style={styles.navButton} onClick={() => changeMonth(1)}>
                  ›
                </button>
              </div>

              <button
                style={styles.todayButton}
                onClick={() => {
                  const now = new Date();
                  const today = formatDateKey(now);
                  setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  setSelectedDate(today);
                  setDate(today);
                }}
              >
                今日
              </button>
            </div>

            <div style={styles.weekHeader}>
              {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                <div key={day} style={styles.weekCell}>
                  {day}
                </div>
              ))}
            </div>

            <div style={styles.calendarGrid}>
              {monthDays.map((day) => {
                const key = formatDateKey(day);
                const items = groupedByDate.get(key) || [];
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = key === formatDateKey(new Date());
                const isSelected = key === selectedDate;

                return (
                  <div
                    key={key}
                    style={{
                      ...styles.dayCell,
                      ...(isCurrentMonth ? {} : styles.dayCellMuted),
                      ...(isSelected ? styles.dayCellSelected : {}),
                    }}
                    onClick={() => {
                      setSelectedDate(key);
                      setDate(key);
                    }}
                  >
                    <div
                      style={{
                        ...styles.dayNumber,
                        ...(isToday ? styles.todayDot : {}),
                      }}
                    >
                      {day.getDate()}
                    </div>

                    <div style={styles.dayReservations}>
                      {items.slice(0, 4).map((item) => {
                        const staffStyle = getStaffStyle(item.staff);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            style={{
                              ...styles.resChip,
                              background: staffStyle.bg,
                              borderLeft: `4px solid ${staffStyle.border}`,
                              color: staffStyle.text,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(key);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setOpenedReservation(item);
                              setSelectedDate(key);
                            }}
                          >
                            {item.startTime} {item.customerName}
                          </button>
                        );
                      })}

                      {items.length > 4 ? (
                        <div style={styles.moreText}>+{items.length - 4}件</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside style={styles.formCard}>
            <h2 style={styles.sectionTitle}>新規予約</h2>

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>お客様名</label>
                <input
                  style={styles.input}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="例：山田 花子"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>電話番号</label>
                <input
                  style={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09012345678"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>メニュー</label>
                <select
                  style={styles.input}
                  value={menu}
                  onChange={(e) => setMenu(e.target.value)}
                >
                  <option value="ストレッチ">ストレッチ</option>
                  <option value="トレーニング">トレーニング</option>
                  <option value="ペアトレーニング">ペアトレーニング</option>
                  <option value="食事管理">食事管理</option>
                  <option value="体験">体験</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>担当スタッフ</label>
                <select
                  style={styles.input}
                  value={staff}
                  onChange={(e) => setStaff(e.target.value)}
                >
                  <option value="山口">山口</option>
                  <option value="池田">池田</option>
                  <option value="服部">服部</option>
                  <option value="中野">中野</option>
                  <option value="菱谷">菱谷</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>日付</label>
                <input
                  style={styles.input}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>開始</label>
                <input
                  style={styles.input}
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>終了</label>
                <input
                  style={styles.input}
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                <label style={styles.label}>メモ</label>
                <textarea
                  style={styles.textarea}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="駐車場 / 指名料 / 回数券 / 注意点など"
                />
              </div>
            </div>

            <button style={styles.primaryButton} onClick={handleCreateReservation}>
              予約を保存
            </button>

            <div style={styles.legendBox}>
              <div style={styles.legendTitle}>スタッフ色分け</div>
              <div style={styles.legendWrap}>
                {Object.keys(STAFF_COLORS).map((name) => {
                  const c = STAFF_COLORS[name];
                  return (
                    <div key={name} style={styles.legendItem}>
                      <span
                        style={{
                          ...styles.legendDot,
                          background: c.dot,
                        }}
                      />
                      {name}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>

        <section style={styles.daySection}>
          <div style={styles.dayHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {selectedDate ? selectedDate.replace(/-/g, "/") : ""} の予約一覧
              </h2>
              <p style={styles.daySub}>
                予約チップを**ダブルクリック**すると詳細が開きます。スマホは**1回タップ**で下から開きます。
              </p>
            </div>
          </div>

          {selectedReservations.length === 0 ? (
            <div style={styles.emptyBox}>この日の予約はありません。</div>
          ) : (
            <div style={styles.dayList}>
              {selectedReservations.map((item) => {
                const staffStyle = getStaffStyle(item.staff);
                return (
                  <button
                    key={item.id}
                    type="button"
                    style={{
                      ...styles.dayListCard,
                      borderLeft: `6px solid ${staffStyle.border}`,
                    }}
                    onClick={() => setOpenedReservation(item)}
                    onDoubleClick={() => setOpenedReservation(item)}
                  >
                    <div style={styles.dayListLeft}>
                      <div style={styles.timeBig}>
                        {item.startTime} - {item.endTime}
                      </div>
                      <div style={styles.nameBig}>{item.customerName}</div>
                      <div style={styles.metaText}>
                        {item.menu} / {item.staff} / {item.phone || "電話番号なし"}
                      </div>
                      {item.memo ? <div style={styles.memoText}>{item.memo}</div> : null}
                    </div>

                    <div
                      style={{
                        ...styles.staffCircle,
                        background: staffStyle.dot,
                      }}
                    >
                      {item.staff.slice(0, 1)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {openedReservation ? (
          <>
            <div style={styles.overlay} onClick={() => setOpenedReservation(null)} />

            <div style={styles.drawer}>
              <div style={styles.drawerHandle} />
              <div style={styles.drawerHeader}>
                <div>
                  <div style={styles.drawerDate}>{openedReservation.date}</div>
                  <h3 style={styles.drawerTitle}>{openedReservation.customerName}</h3>
                </div>
                <button
                  style={styles.closeButton}
                  onClick={() => setOpenedReservation(null)}
                >
                  ×
                </button>
              </div>

              <div style={styles.detailGrid}>
                <DetailItem label="開始" value={openedReservation.startTime} />
                <DetailItem label="終了" value={openedReservation.endTime} />
                <DetailItem label="メニュー" value={openedReservation.menu} />
                <DetailItem label="スタッフ" value={openedReservation.staff} />
                <DetailItem label="電話番号" value={openedReservation.phone || "-"} />
                <DetailItem label="状態" value={openedReservation.status} />
              </div>

              <div style={styles.memoDetail}>
                <div style={styles.label}>メモ</div>
                <div style={styles.memoDetailText}>
                  {openedReservation.memo || "メモはありません"}
                </div>
              </div>

              <div style={styles.actionBar}>
                <button
                  style={styles.smallAction}
                  onClick={() => updateReservationStatus(openedReservation.id, "来店")}
                >
                  来店
                </button>
                <button
                  style={styles.smallAction}
                  onClick={() => updateReservationStatus(openedReservation.id, "完了")}
                >
                  完了
                </button>
                <button
                  style={styles.smallAction}
                  onClick={() => updateReservationStatus(openedReservation.id, "キャンセル")}
                >
                  キャンセル
                </button>
                <button
                  style={styles.deleteAction}
                  onClick={() => deleteReservation(openedReservation.id)}
                >
                  削除
                </button>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </CRMLayout>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailCard}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={styles.detailValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    padding: 16,
    position: "relative",
  },
  topRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(320px, 0.9fr)",
    gap: 18,
  },
  calendarCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
    minWidth: 0,
  },
  formCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: 22,
    cursor: "pointer",
  },
  todayButton: {
    height: 38,
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  monthTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: "#111827",
  },
  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 8,
    marginBottom: 8,
  },
  weekCell: {
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 700,
    fontSize: 13,
    padding: "6px 0",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 8,
  },
  dayCell: {
    minHeight: 140,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 8,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    overflow: "hidden",
  },
  dayCellMuted: {
    background: "#fafafa",
    opacity: 0.55,
  },
  dayCellSelected: {
    border: "2px solid #111827",
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 800,
    color: "#111827",
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  todayDot: {
    background: "#111827",
    color: "#fff",
  },
  dayReservations: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
  },
  resChip: {
    border: "none",
    borderRadius: 8,
    padding: "5px 7px",
    fontSize: 11,
    lineHeight: 1.3,
    textAlign: "left",
    cursor: "pointer",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  moreText: {
    fontSize: 11,
    color: "#6b7280",
    paddingLeft: 4,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#111827",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
  },
  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
  },
  textarea: {
    minHeight: 90,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: 12,
    fontSize: 14,
    outline: "none",
    resize: "vertical",
  },
  primaryButton: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 15,
  },
  legendBox: {
    marginTop: 14,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
  },
  legendTitle: {
    fontWeight: 800,
    fontSize: 13,
    marginBottom: 8,
    color: "#111827",
  },
  legendWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#374151",
    fontWeight: 700,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    display: "inline-block",
  },
  daySection: {
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
  },
  dayHeader: {
    marginBottom: 12,
  },
  daySub: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 13,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    textAlign: "center",
    color: "#6b7280",
  },
  dayList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  dayListCard: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 16,
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    textAlign: "left",
    cursor: "pointer",
  },
  dayListLeft: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  timeBig: {
    fontSize: 13,
    fontWeight: 700,
    color: "#6b7280",
  },
  nameBig: {
    fontSize: 20,
    fontWeight: 800,
    color: "#111827",
  },
  metaText: {
    fontSize: 13,
    color: "#4b5563",
  },
  memoText: {
    fontSize: 13,
    color: "#6b7280",
  },
  staffCircle: {
    minWidth: 44,
    width: 44,
    height: 44,
    borderRadius: 999,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.35)",
    zIndex: 40,
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "min(460px, 100vw)",
    height: "100vh",
    background: "#fff",
    zIndex: 50,
    boxShadow: "-10px 0 30px rgba(15,23,42,0.15)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    overflowY: "auto",
  },
  drawerHandle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    background: "#d1d5db",
    alignSelf: "center",
    display: "none",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  drawerDate: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: 700,
  },
  drawerTitle: {
    margin: "6px 0 0",
    fontSize: 28,
    fontWeight: 900,
    color: "#111827",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 24,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  detailCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#f9fafb",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 700,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: 800,
  },
  memoDetail: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
  },
  memoDetailText: {
    marginTop: 6,
    lineHeight: 1.8,
    color: "#374151",
    fontSize: 14,
  },
  actionBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: "auto",
  },
  smallAction: {
    height: 40,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "0 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  deleteAction: {
    height: 40,
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    padding: "0 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
};