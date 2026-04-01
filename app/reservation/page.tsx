"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ReservationStatus = "reserved" | "visited" | "tentative" | "blocked" | "holiday";

type Reservation = {
  id: string;
  customerId: string;
  customerName: string;
  menu: string;
  startAt: string;
  endAt: string;
  staff: string;
  store: string;
  price: number;
  paymentMethod: string;
  status: ReservationStatus;
  memo?: string;
};

type TimelineItem =
  | { type: "reservation"; reservation: Reservation }
  | { type: "gap"; startAt: string; endAt: string };

type Sale = {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  menuName: string;
  staff: string;
  totalAmount: number;
  paymentMethod: string;
  reservationId: string;
};

type TicketHistory = {
  id: string;
  date: string;
  staff: string;
  memo: string;
};

type CustomerTicket = {
  name: string;
  total: number;
  used: number;
  remaining: number;
  expiryDate: string;
  status: "有効" | "停止" | "終了";
  history: TicketHistory[];
};

type CustomerDetail = {
  memo?: string;
  lastVisit?: string;
  bodyRecords?: unknown[];
  trainingHistory?: unknown[];
  subscription?: unknown;
  ticket?: CustomerTicket;
};

const STORAGE_KEY = "gymup_reservations";
const SALES_KEY = "gymup_sales";

const STAFFS = ["全員", "山口", "石川", "池田", "羽田", "中西", "井上", "菱谷", "その他"];
const STORES = ["江戸堀", "箕面", "福島", "中崎町", "天満橋", "江坂", "西梅田"];
const MENUS = ["ストレッチ", "トレーニング", "業務", "休み"];
const PAYMENT_METHODS = ["トレーニングコース", "ストレッチ回数券", "現金", "カード", "その他"];
const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatDateJP(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function formatTime(value: string) {
  const d = new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isSameDay(dateTime: string, targetDate: Date) {
  const d = new Date(dateTime);
  return (
    d.getFullYear() === targetDate.getFullYear() &&
    d.getMonth() === targetDate.getMonth() &&
    d.getDate() === targetDate.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthGrid(baseDate: Date) {
  const firstDay = startOfMonth(baseDate);
  const weekday = firstDay.getDay();
  const mondayIndex = weekday === 0 ? 6 : weekday - 1;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - mondayIndex);

  const days: Date[] = [];
  for (let i = 0; i < 35; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function getStatusPillStyle(status: ReservationStatus) {
  switch (status) {
    case "reserved":
      return { bg: "#d9f7e8", color: "#0f9f5f", line: "#35c985" };
    case "tentative":
      return { bg: "#ffe0e5", color: "#ef6b79", line: "#ff8c95" };
    case "blocked":
      return { bg: "#dff0ff", color: "#3192e6", line: "#5db1f2" };
    case "holiday":
      return { bg: "#d7ebff", color: "#2486e8", line: "#4ca2f2" };
    case "visited":
      return { bg: "#ece7e4", color: "#8e7f75", line: "#a99a90" };
    default:
      return { bg: "#eef2f6", color: "#64748b", line: "#94a3b8" };
  }
}

function getStatusLabel(status: ReservationStatus) {
  switch (status) {
    case "reserved":
      return "通常";
    case "tentative":
      return "仮";
    case "blocked":
      return "業務";
    case "visited":
      return "来店済み";
    case "holiday":
      return "休み";
    default:
      return status;
  }
}

function buildTimeline(items: Reservation[]): TimelineItem[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const result: TimelineItem[] = [];

  sorted.forEach((reservation, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      const prevEnd = new Date(prev.endAt).getTime();
      const currentStart = new Date(reservation.startAt).getTime();
      if (currentStart > prevEnd) {
        result.push({
          type: "gap",
          startAt: prev.endAt,
          endAt: reservation.startAt,
        });
      }
    }
    result.push({ type: "reservation", reservation });
  });

  return result;
}

function defaultTicket(): CustomerTicket {
  return {
    name: "10回券",
    total: 10,
    used: 0,
    remaining: 10,
    expiryDate: "",
    status: "有効",
    history: [],
  };
}

function normalizeTicket(ticket?: Partial<CustomerTicket>): CustomerTicket {
  const base = defaultTicket();
  const merged = { ...base, ...ticket };
  const total = Math.max(0, Number(merged.total || 0));
  const used = Math.max(0, Number(merged.used || 0));
  const remaining = Math.max(0, total - used);

  let status = merged.status || "有効";
  if (remaining <= 0 && status === "有効") status = "終了";

  return {
    ...merged,
    total,
    used,
    remaining,
    status,
    expiryDate: merged.expiryDate || "",
    history: Array.isArray(merged.history) ? merged.history : [],
  };
}

function getTicketRemaining(customerId: string) {
  try {
    const raw = localStorage.getItem(`customer-${customerId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ticket) return null;
    const ticket = normalizeTicket(parsed.ticket);
    return ticket.remaining;
  } catch {
    return null;
  }
}

function buildInitialReservations(): Reservation[] {
  const today = new Date();
  const monthBase = new Date(today.getFullYear(), today.getMonth(), 1);

  const d = (day: number, time: string) =>
    `${monthBase.getFullYear()}-${pad(monthBase.getMonth() + 1)}-${pad(day)}T${time}`;

  return [
    {
      id: createId(),
      customerId: "1",
      customerName: "森本様",
      menu: "トレーニング",
      startAt: d(18, "07:50"),
      endAt: d(18, "08:50"),
      staff: "山口",
      store: "西梅田",
      price: 7000,
      paymentMethod: "トレーニングコース",
      status: "reserved",
      memo: "",
    },
    {
      id: createId(),
      customerId: "2",
      customerName: "服部様",
      menu: "トレーニング",
      startAt: d(18, "09:30"),
      endAt: d(18, "11:00"),
      staff: "山口",
      store: "西梅田",
      price: 7000,
      paymentMethod: "トレーニングコース",
      status: "reserved",
      memo: "",
    },
    {
      id: createId(),
      customerId: "3",
      customerName: "消防点検",
      menu: "業務",
      startAt: d(18, "10:00"),
      endAt: d(18, "12:00"),
      staff: "中西",
      store: "福島",
      price: 0,
      paymentMethod: "その他",
      status: "blocked",
      memo: "室内の検査あり",
    },
    {
      id: createId(),
      customerId: "4",
      customerName: "湯山様",
      menu: "ストレッチ",
      startAt: d(18, "12:00"),
      endAt: d(18, "13:00"),
      staff: "山口",
      store: "西梅田",
      price: 6000,
      paymentMethod: "その他",
      status: "tentative",
      memo: "仮予約",
    },
    {
      id: createId(),
      customerId: "5",
      customerName: "大井様",
      menu: "ストレッチ",
      startAt: d(18, "13:30"),
      endAt: d(18, "14:30"),
      staff: "中西",
      store: "福島",
      price: 7000,
      paymentMethod: "カード",
      status: "reserved",
      memo: "指名料込み",
    },
    {
      id: createId(),
      customerId: "6",
      customerName: "星谷様",
      menu: "ストレッチ",
      startAt: d(18, "14:00"),
      endAt: d(18, "15:00"),
      staff: "山口",
      store: "西梅田",
      price: 6000,
      paymentMethod: "ストレッチ回数券",
      status: "reserved",
      memo: "",
    },
    {
      id: createId(),
      customerId: "7",
      customerName: "谷川様",
      menu: "トレーニング",
      startAt: d(18, "16:30"),
      endAt: d(18, "17:30"),
      staff: "池田",
      store: "江戸堀",
      price: 7000,
      paymentMethod: "トレーニングコース",
      status: "reserved",
      memo: "",
    },
  ];
}

function loadReservations(): Reservation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return buildInitialReservations();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : buildInitialReservations();
  } catch {
    return buildInitialReservations();
  }
}

function saveReservations(items: Reservation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadSales(): Sale[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(SALES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSales(items: Sale[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SALES_KEY, JSON.stringify(items));
}

function MonthCalendar({
  calendarDate,
  selectedDate,
  reservations,
  selectedStaff,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onOpenDate,
}: {
  calendarDate: Date;
  selectedDate: Date;
  reservations: Reservation[];
  selectedStaff: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  onOpenDate: (date: Date) => void;
}) {
  const days = useMemo(() => getMonthGrid(calendarDate), [calendarDate]);
  const todayKey = toLocalDateString(new Date());
  const tapRef = useRef<{ key: string; time: number } | null>(null);

  const handleTap = (date: Date) => {
    const key = toLocalDateString(date);
    const now = Date.now();

    if (tapRef.current && tapRef.current.key === key && now - tapRef.current.time < 320) {
      onOpenDate(date);
      tapRef.current = null;
      return;
    }

    tapRef.current = { key, time: now };
    onSelectDate(date);
  };

  return (
    <section style={monthWrapStyle}>
      <div style={monthHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onPrevMonth} style={monthArrowStyle}>‹</button>
          <h1 style={monthTitleStyle}>{formatMonthLabel(calendarDate)}</h1>
          <button onClick={onNextMonth} style={monthArrowStyle}>›</button>
        </div>

        <div style={monthHintStyle}>日付ダブルタップで詳細</div>
      </div>

      <div style={weekHeaderStyle}>
        {WEEKDAYS.map((day) => (
          <div key={day} style={weekCellStyle}>
            {day}
          </div>
        ))}
      </div>

      <div style={calendarGridStyle}>
        {days.map((day) => {
          const dateKey = toLocalDateString(day);
          const items = reservations
            .filter((r) => isSameDay(r.startAt, day))
            .filter((r) => selectedStaff === "全員" || r.staff === selectedStaff)
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

          const isCurrentMonth = isSameMonth(day, calendarDate);
          const isSelected = dateKey === toLocalDateString(selectedDate);
          const isToday = dateKey === todayKey;

          return (
            <button
              key={dateKey}
              onClick={() => handleTap(day)}
              onDoubleClick={() => onOpenDate(day)}
              style={{
                ...dayCellStyle,
                opacity: isCurrentMonth ? 1 : 0.45,
                background: isSelected ? "#f6f7f8" : "#ffffff",
                borderColor: isSelected ? "#111111" : "#e9e9eb",
              }}
            >
              <div style={dayHeaderMiniStyle}>
                <span
                  style={{
                    ...dayNumberStyle,
                    ...(isToday
                      ? {
                          background: "#111111",
                          color: "#ffffff",
                          borderRadius: 999,
                          padding: "1px 8px",
                        }
                      : {}),
                  }}
                >
                  {day.getDate()}
                </span>
              </div>

              <div style={dayEventsWrapStyle}>
                {items.slice(0, 4).map((item) => {
                  const style = getStatusPillStyle(item.status);
                  return (
                    <div
                      key={item.id}
                      style={{
                        ...monthEventPillStyle,
                        background: style.bg,
                        color: style.color,
                      }}
                    >
                      {item.customerName}
                    </div>
                  );
                })}

                {items.length > 4 ? (
                  <div style={moreTextStyle}>+{items.length - 4}</div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StaffTabs({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (staff: string) => void;
}) {
  return (
    <div style={staffScrollStyle}>
      {STAFFS.map((staff) => {
        const active = selected === staff;
        return (
          <button
            key={staff}
            onClick={() => onChange(staff)}
            style={{
              ...staffTabStyle,
              ...(active
                ? { background: "#111111", color: "#ffffff", borderColor: "#111111" }
                : {}),
            }}
          >
            {staff}
          </button>
        );
      })}
    </div>
  );
}

function DayTimeline({
  items,
  onSelect,
}: {
  items: TimelineItem[];
  onSelect: (reservation: Reservation) => void;
}) {
  if (items.length === 0) {
    return <div style={emptyStyle}>この日の予約はありません</div>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {items.map((item, idx) =>
        item.type === "gap" ? (
          <div key={`gap-${idx}`} style={gapStyle}>
            {formatTime(item.startAt)}〜{formatTime(item.endAt)} 空き
          </div>
        ) : (
          <button
            key={item.reservation.id}
            onClick={() => onSelect(item.reservation)}
            style={timelineCardButtonStyle}
          >
            <div style={timeColStyle}>
              <div style={startTimeStyle}>{formatTime(item.reservation.startAt)}</div>
              <div style={endTimeStyle}>{formatTime(item.reservation.endAt)}</div>
            </div>

            <div
              style={{
                ...timeLineBarStyle,
                background: getStatusPillStyle(item.reservation.status).line,
              }}
            />

            <div style={timelineMainStyle}>
              <div style={timelineTopStyle}>
                <div style={timelineTitleStyle}>{item.reservation.customerName}</div>
                <div style={avatarCircleStyle}>
                  {item.reservation.staff.slice(0, 1)}
                </div>
              </div>

              <div style={timelineSubStyle}>
                {item.reservation.menu} / {item.reservation.paymentMethod} / {item.reservation.store}
              </div>

              {item.reservation.paymentMethod === "ストレッチ回数券" && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    color:
                      (getTicketRemaining(item.reservation.customerId) ?? 0) <= 0
                        ? "#dc2626"
                        : "#111111",
                  }}
                >
                  残り：{getTicketRemaining(item.reservation.customerId) ?? "-"}回
                </div>
              )}

              {item.reservation.memo ? (
                <div style={timelineMemoStyle}>{item.reservation.memo}</div>
              ) : null}
            </div>
          </button>
        )
      )}
    </div>
  );
}

function ModalShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ReservationDetailModal({
  reservation,
  open,
  onClose,
  onVisit,
}: {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
  onVisit: (reservation: Reservation) => void;
}) {
  if (!reservation) return null;

  const alreadyVisited = reservation.status === "visited";

  return (
    <ModalShell open={open} onClose={onClose}>
      <div style={sheetHeaderStyle}>
        <div>
          <div style={sheetEyebrowStyle}>DETAIL</div>
          <div style={sheetTitleStyle}>{reservation.customerName}</div>
        </div>
        <button onClick={onClose} style={closeStyle}>閉じる</button>
      </div>

      <div style={detailListStyle}>
        <DetailRow label="メニュー" value={reservation.menu} />
        <DetailRow label="時間" value={`${formatTime(reservation.startAt)}〜${formatTime(reservation.endAt)}`} />
        <DetailRow label="担当" value={reservation.staff} />
        <DetailRow label="店舗" value={reservation.store} />
        <DetailRow label="金額" value={`¥${reservation.price.toLocaleString()}`} />
        <DetailRow label="支払方法" value={reservation.paymentMethod} />
        <DetailRow label="状態" value={getStatusLabel(reservation.status)} />
        <DetailRow label="メモ" value={reservation.memo || "-"} />
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        <button
          onClick={() => onVisit(reservation)}
          disabled={alreadyVisited}
          style={{
            ...submitStyle,
            opacity: alreadyVisited ? 0.55 : 1,
            cursor: alreadyVisited ? "not-allowed" : "pointer",
          }}
        >
          {alreadyVisited ? "来店処理済み" : "来店済みにする"}
        </button>
      </div>
    </ModalShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
}

function AddReservationModal({
  open,
  onClose,
  selectedDate,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
  onAdd: (reservation: Reservation) => void;
}) {
  const baseDate = toLocalDateString(selectedDate);

  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    menu: MENUS[0],
    startAt: `${baseDate}T10:00`,
    endAt: `${baseDate}T11:00`,
    staff: "山口",
    store: STORES[0],
    price: "6600",
    paymentMethod: PAYMENT_METHODS[0],
    status: "reserved" as ReservationStatus,
    memo: "",
  });

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        startAt: `${baseDate}T10:00`,
        endAt: `${baseDate}T11:00`,
      }));
    }
  }, [open, baseDate]);

  const setValue = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) return;

    onAdd({
      id: createId(),
      customerId: form.customerId.trim() || String(Date.now()),
      customerName: form.customerName.trim(),
      menu: form.menu,
      startAt: form.startAt,
      endAt: form.endAt,
      staff: form.staff,
      store: form.store,
      price: Number(form.price) || 0,
      paymentMethod: form.paymentMethod,
      status: form.status,
      memo: form.memo.trim(),
    });

    onClose();
    setForm({
      customerId: "",
      customerName: "",
      menu: MENUS[0],
      startAt: `${baseDate}T10:00`,
      endAt: `${baseDate}T11:00`,
      staff: "山口",
      store: STORES[0],
      price: "6600",
      paymentMethod: PAYMENT_METHODS[0],
      status: "reserved",
      memo: "",
    });
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <div style={sheetHeaderStyle}>
        <div>
          <div style={sheetEyebrowStyle}>ADD</div>
          <div style={sheetTitleStyle}>予約追加</div>
        </div>
        <button onClick={onClose} style={closeStyle}>閉じる</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
        <Field label="顧客ID">
          <input value={form.customerId} onChange={(e) => setValue("customerId", e.target.value)} style={inputStyle} placeholder="customer id" />
        </Field>

        <Field label="顧客名">
          <input value={form.customerName} onChange={(e) => setValue("customerName", e.target.value)} style={inputStyle} placeholder="山田様" />
        </Field>

        <Field label="メニュー">
          <select value={form.menu} onChange={(e) => setValue("menu", e.target.value)} style={selectStyle}>
            {MENUS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="開始">
            <input type="datetime-local" value={form.startAt} onChange={(e) => setValue("startAt", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="終了">
            <input type="datetime-local" value={form.endAt} onChange={(e) => setValue("endAt", e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="担当">
            <select value={form.staff} onChange={(e) => setValue("staff", e.target.value)} style={selectStyle}>
              {STAFFS.filter((s) => s !== "全員").map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="店舗">
            <select value={form.store} onChange={(e) => setValue("store", e.target.value)} style={selectStyle}>
              {STORES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="金額">
            <input type="number" value={form.price} onChange={(e) => setValue("price", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="支払方法">
            <select value={form.paymentMethod} onChange={(e) => setValue("paymentMethod", e.target.value)} style={selectStyle}>
              {PAYMENT_METHODS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="状態">
          <select value={form.status} onChange={(e) => setValue("status", e.target.value)} style={selectStyle}>
            <option value="reserved">通常</option>
            <option value="tentative">仮</option>
            <option value="blocked">業務</option>
            <option value="visited">来店済み</option>
            <option value="holiday">休み</option>
          </select>
        </Field>

        <Field label="メモ">
          <textarea value={form.memo} onChange={(e) => setValue("memo", e.target.value)} style={{ ...inputStyle, minHeight: 90, height: "auto", resize: "vertical", paddingTop: 12 }} />
        </Field>

        <button type="submit" style={submitStyle}>追加する</button>
      </form>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={fieldLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

export default function ReservationPage() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState("全員");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const detailSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initial = loadReservations();
    setReservations(initial);
    saveReservations(initial);
  }, []);

  useEffect(() => {
    saveReservations(reservations);
  }, [reservations]);

  const filteredByStaff = useMemo(() => {
    return reservations.filter((item) => selectedStaff === "全員" || item.staff === selectedStaff);
  }, [reservations, selectedStaff]);

  const selectedDayReservations = useMemo(() => {
    return filteredByStaff
      .filter((item) => isSameDay(item.startAt, selectedDate))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [filteredByStaff, selectedDate]);

  const timeline = useMemo(() => buildTimeline(selectedDayReservations), [selectedDayReservations]);

  const summary = useMemo(() => {
    const tentativeCount = selectedDayReservations.filter((r) => r.status === "tentative").length;
    const salesForecast = selectedDayReservations
      .filter((r) => r.status === "reserved" || r.status === "visited")
      .reduce((sum, r) => sum + (Number(r.price) || 0), 0);

    return {
      count: selectedDayReservations.length,
      tentativeCount,
      salesForecast,
    };
  }, [selectedDayReservations]);

  const openDayDetail = (date: Date) => {
    setSelectedDate(date);
    setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleAddReservation = (reservation: Reservation) => {
    setReservations((prev) =>
      [...prev, reservation].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    );
    setSelectedDate(new Date(reservation.startAt));
    setCalendarDate(new Date(reservation.startAt));
  };

  const handleVisit = (reservation: Reservation) => {
    if (reservation.status === "visited") {
      alert("この予約はすでに来店処理済みです");
      return;
    }

    const updatedReservations = reservations.map((r) =>
      r.id === reservation.id ? { ...r, status: "visited" as ReservationStatus } : r
    );
    setReservations(updatedReservations);

    const currentSales = loadSales();
    const alreadyAdded = currentSales.some((sale) => sale.reservationId === reservation.id);

    if (!alreadyAdded) {
      const newSale: Sale = {
        id: createId(),
        date: new Date().toISOString(),
        customerId: reservation.customerId,
        customerName: reservation.customerName,
        menuName: reservation.menu,
        staff: reservation.staff,
        totalAmount: Number(reservation.price) || 0,
        paymentMethod: reservation.paymentMethod,
        reservationId: reservation.id,
      };

      saveSales([...currentSales, newSale]);
    }

    const customerKey = `customer-${reservation.customerId}`;
    let customerDetail: CustomerDetail = {};

    try {
      const raw = localStorage.getItem(customerKey);
      customerDetail = raw ? JSON.parse(raw) : {};
    } catch {
      customerDetail = {};
    }

    customerDetail.lastVisit = getTodayString();

    if (reservation.paymentMethod === "ストレッチ回数券") {
      const ticket = normalizeTicket(customerDetail.ticket);

      if (ticket.status === "停止") {
        alert("この顧客の回数券は停止中です。来店処理はしましたが、回数券は消化していません。");
      } else if (ticket.remaining <= 0) {
        alert("この顧客の回数券残数がありません。来店処理はしましたが、回数券は消化していません。");
      } else {
        ticket.used += 1;
        ticket.remaining = Math.max(0, ticket.total - ticket.used);
        ticket.history = [
          ...ticket.history,
          {
            id: createId(),
            date: getTodayString(),
            staff: reservation.staff,
            memo: `予約連動 / ${reservation.menu}`,
          },
        ];

        if (ticket.remaining <= 0 && ticket.status === "有効") {
          ticket.status = "終了";
        }

        customerDetail.ticket = ticket;
      }
    }

    localStorage.setItem(customerKey, JSON.stringify(customerDetail));

    setSelectedReservation((prev) =>
      prev && prev.id === reservation.id ? { ...prev, status: "visited" } : prev
    );

    alert("来店処理が完了しました");
  };

  return (
    <main style={pageStyle}>
      <div style={phoneWrapStyle}>
        <div style={topBarStyle}>
          <div style={topBarLeftStyle}>予約管理</div>
          <button onClick={() => setAddOpen(true)} style={plusStyle}>＋</button>
        </div>

        <MonthCalendar
          calendarDate={calendarDate}
          selectedDate={selectedDate}
          reservations={filteredByStaff}
          selectedStaff={selectedStaff}
          onPrevMonth={() => setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          onSelectDate={(date) => setSelectedDate(date)}
          onOpenDate={openDayDetail}
        />

        <StaffTabs selected={selectedStaff} onChange={setSelectedStaff} />

        <section ref={detailSectionRef} style={detailWrapStyle}>
          <div style={detailHeadStyle}>
            <div>
              <div style={detailDateStyle}>{formatDateJP(selectedDate)}</div>
              <div style={detailSubTextStyle}>
                予約 {summary.count}件 / 仮 {summary.tentativeCount}件 / 売上見込み ¥{summary.salesForecast.toLocaleString()}
              </div>
            </div>
          </div>

          <DayTimeline
            items={timeline}
            onSelect={(reservation) => {
              setSelectedReservation(reservation);
              setDetailOpen(true);
            }}
          />
        </section>
      </div>

      <AddReservationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        selectedDate={selectedDate}
        onAdd={handleAddReservation}
      />

      <ReservationDetailModal
        reservation={selectedReservation}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onVisit={handleVisit}
      />
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#efefef",
  padding: "16px 0 32px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const phoneWrapStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 860,
  margin: "0 auto",
  background: "#f5f5f5",
  borderRadius: 32,
  padding: 18,
  boxSizing: "border-box",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 14,
};

const topBarLeftStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111",
};

const plusStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 999,
  border: "none",
  background: "#111",
  color: "#fff",
  fontSize: 28,
  lineHeight: 1,
  cursor: "pointer",
};

const monthWrapStyle: React.CSSProperties = {
  background: "#f5f5f5",
};

const monthHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const monthTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 900,
  color: "#111",
};

const monthArrowStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #dddddf",
  background: "#fff",
  fontSize: 22,
  cursor: "pointer",
};

const monthHintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#777",
  fontWeight: 600,
};

const weekHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0,1fr))",
  gap: 6,
  marginBottom: 6,
};

const weekCellStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: 13,
  fontWeight: 700,
  color: "#8b8b8f",
  padding: "4px 0",
};

const calendarGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0,1fr))",
  gap: 6,
};

const dayCellStyle: React.CSSProperties = {
  minHeight: 118,
  borderRadius: 16,
  border: "1px solid #e9e9eb",
  background: "#fff",
  padding: 6,
  textAlign: "left",
  cursor: "pointer",
  boxSizing: "border-box",
};

const dayHeaderMiniStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
};

const dayNumberStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#222",
};

const dayEventsWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
};

const monthEventPillStyle: React.CSSProperties = {
  borderRadius: 6,
  padding: "4px 6px",
  fontSize: 11,
  fontWeight: 800,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const moreTextStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#777",
  fontWeight: 700,
};

const staffScrollStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  padding: "14px 0 16px",
};

const staffTabStyle: React.CSSProperties = {
  flex: "0 0 auto",
  borderRadius: 999,
  border: "1px solid #dddddf",
  background: "#fff",
  color: "#222",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const detailWrapStyle: React.CSSProperties = {
  background: "#f5f5f5",
  paddingTop: 8,
};

const detailHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16,
};

const detailDateStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  color: "#111",
};

const detailSubTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#777",
  marginTop: 6,
};

const emptyStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  border: "1px solid #ececef",
  padding: 24,
  color: "#777",
  textAlign: "center",
};

const gapStyle: React.CSSProperties = {
  background: "#f0f0f2",
  borderRadius: 16,
  padding: "12px 16px",
  fontSize: 14,
  color: "#666",
  border: "1px solid #e3e3e5",
};

const timelineCardButtonStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "74px 6px 1fr",
  gap: 14,
  alignItems: "stretch",
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

const timeColStyle: React.CSSProperties = {
  paddingTop: 6,
};

const startTimeStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#222",
};

const endTimeStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#9a9a9f",
  marginTop: 8,
};

const timeLineBarStyle: React.CSSProperties = {
  width: 4,
  borderRadius: 999,
};

const timelineMainStyle: React.CSSProperties = {
  background: "transparent",
  paddingBottom: 12,
};

const timelineTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const timelineTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  color: "#171717",
  lineHeight: 1.2,
};

const avatarCircleStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 999,
  background: "#33c86f",
  color: "#fff",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

const timelineSubStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  color: "#7d7d82",
  lineHeight: 1.7,
};

const timelineMemoStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 14,
  color: "#8b8b90",
  lineHeight: 1.7,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.28)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: 12,
  zIndex: 100,
};

const sheetStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: 28,
  background: "#fff",
  padding: 20,
  boxSizing: "border-box",
};

const sheetHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 18,
};

const sheetEyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#8b8b90",
  letterSpacing: "0.12em",
};

const sheetTitleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  color: "#111",
  marginTop: 4,
};

const closeStyle: React.CSSProperties = {
  border: "1px solid #e3e3e5",
  background: "#fff",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const detailListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const detailRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 16px",
  borderRadius: 16,
  background: "#f7f7f8",
};

const detailLabelStyle: React.CSSProperties = {
  color: "#7d7d82",
  fontSize: 14,
};

const detailValueStyle: React.CSSProperties = {
  color: "#111",
  fontWeight: 700,
  fontSize: 14,
  textAlign: "right",
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#555",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  borderRadius: 14,
  border: "1px solid #dedee2",
  backgroundColor: "#fff",
  padding: "12px 14px",
  fontSize: 14,
  color: "#111",
  boxSizing: "border-box",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  borderRadius: 14,
  border: "1px solid #dedee2",
  backgroundColor: "#fff",
  padding: "0 40px 0 14px",
  fontSize: 14,
  color: "#111",
  boxSizing: "border-box",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  outline: "none",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, #666 50%), linear-gradient(135deg, #666 50%, transparent 50%)",
  backgroundPosition:
    "calc(100% - 18px) calc(50% - 3px), calc(100% - 12px) calc(50% - 3px)",
  backgroundSize: "6px 6px, 6px 6px",
  backgroundRepeat: "no-repeat",
};

const submitStyle: React.CSSProperties = {
  marginTop: 4,
  width: "100%",
  border: "none",
  borderRadius: 16,
  background: "#111",
  color: "#fff",
  fontSize: 15,
  fontWeight: 800,
  padding: "14px 16px",
  cursor: "pointer",
};