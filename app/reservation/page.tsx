"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

type ReservationRow = {
  id: string | number;
  customer_id?: string | number | null;
  customer_name?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  store_name?: string | null;
  staff_name?: string | null;
  menu?: string | null;
  payment_method?: string | null;
  memo?: string | null;
  created_at?: string | null;
};

type CustomerRow = {
  id: string | number;
  name?: string | null;
  kana?: string | null;
  phone?: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
  kana: string;
  phone: string;
};

const STORE_OPTIONS = [
  "すべて",
  "江戸堀",
  "箕面",
  "福島",
  "福島P",
  "天満橋",
  "中崎町",
];

const STORE_OPTIONS_FOR_FORM = [
  "江戸堀",
  "箕面",
  "福島",
  "福島P",
  "天満橋",
  "中崎町",
];

const STAFF_OPTIONS = [
  "山口",
  "中西",
  "池田",
  "羽田",
  "石川",
  "菱谷",
  "林",
  "井上",
  "その他",
];

const MENU_OPTIONS = [
  "ストレッチ",
  "トレーニング",
  "ペアトレ",
  "ヘッドスパ",
  "アロマ",
  "その他",
];

const PAYMENT_OPTIONS = ["現金", "カード", "銀行振込", "その他"];

const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatJapaneseDate(dateStr: string) {
  const date = new Date(dateStr);
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${week[date.getDay()]}曜日`;
}

function getMondayStart(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildCalendarDays(currentMonth: Date) {
  const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const last = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const start = getMondayStart(first);
  const end = new Date(last);
  const lastDay = last.getDay();
  const addDays = lastDay === 0 ? 0 : 7 - lastDay;
  end.setDate(end.getDate() + addDays);
  end.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function addOneHour(time: string) {
  if (!time || !time.includes(":")) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + 60);
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

function getStaffColor(staffName?: string | null) {
  const name = trimmed(staffName);

  if (name.includes("山口")) return "#22c55e";
  if (name.includes("中西")) return "#ec4899";
  if (name.includes("池田")) return "#8b5e3c";
  if (name.includes("石川")) return "#2563eb";
  if (name.includes("羽田")) return "#ef4444";
  if (name.includes("菱谷")) return "#eab308";
  if (name.includes("井上")) return "#111827";
  if (name.includes("林")) return "#111827";

  return "#9ca3af";
}

function sortReservations(a: ReservationRow, b: ReservationRow) {
  const aTime = trimmed(a.start_time);
  const bTime = trimmed(b.start_time);
  if (aTime < bTime) return -1;
  if (aTime > bTime) return 1;
  return 0;
}

function extractErrorMessage(error: unknown): string {
  if (!error) return "不明なエラーです。";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  if (typeof error === "object") {
    const maybe = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      typeof maybe.message === "string" ? maybe.message : "",
      typeof maybe.details === "string" ? maybe.details : "",
      typeof maybe.hint === "string" ? maybe.hint : "",
      typeof maybe.code === "string" ? `code: ${maybe.code}` : "",
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(" / ");
  }

  return "不明なエラーです。";
}

export default function ReservationPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedStoreFilter, setSelectedStoreFilter] = useState("すべて");
  const [selectedDate, setSelectedDate] = useState(toYmd(new Date()));
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerKana, setCustomerKana] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [formDate, setFormDate] = useState(toYmd(new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [endTimeTouched, setEndTimeTouched] = useState(false);

  const [storeName, setStoreName] = useState("江戸堀");
  const [staffName, setStaffName] = useState("山口");
  const [menu, setMenu] = useState("ストレッチ");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loggedIn =
      localStorage.getItem("gymup_logged_in") ||
      localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }

    void loadAll();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    void loadReservations();
  }, [currentMonth, mounted]);

  async function loadAll() {
    await Promise.all([loadCustomers(), loadReservations()]);
  }

  async function loadCustomers() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, kana, phone")
        .order("id", { ascending: false })
        .limit(400);

      if (error) throw error;

      const normalized = ((data as CustomerRow[]) || []).map((row) => ({
        id: String(row.id),
        name: row.name || "",
        kana: row.kana || "",
        phone: row.phone || "",
      }));

      setCustomers(normalized);
    } catch (e) {
      console.error(e);
      setError(`顧客取得エラー: ${extractErrorMessage(e)}`);
    }
  }

  async function loadReservations() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const start = toYmd(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
      const end = toYmd(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));

      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, customer_id, customer_name, date, start_time, end_time, store_name, staff_name, menu, payment_method, memo, created_at"
        )
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;

      setReservations((data as ReservationRow[]) || []);
    } catch (e) {
      console.error(e);
      setError(`予約取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const q = trimmed(customerSearch).toLowerCase();
    if (!q) return customers.slice(0, 25);

    return customers
      .filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          c.kana.toLowerCase().includes(q) ||
          c.phone.includes(q)
        );
      })
      .slice(0, 25);
  }, [customerSearch, customers]);

  const visibleReservations = useMemo(() => {
    if (selectedStoreFilter === "すべて") return reservations;
    return reservations.filter((item) => item.store_name === selectedStoreFilter);
  }, [reservations, selectedStoreFilter]);

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, ReservationRow[]>();

    for (const item of visibleReservations) {
      const key = trimmed(item.date);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    for (const [, value] of map) {
      value.sort(sortReservations);
    }

    return map;
  }, [visibleReservations]);

  const selectedDayReservations = useMemo(() => {
    return [...(reservationsByDate.get(selectedDate) || [])].sort(sortReservations);
  }, [reservationsByDate, selectedDate]);

  function openDay(dateStr: string) {
    setSelectedDate(dateStr);
    setDaySheetOpen(true);
  }

  function openCreateModal(dateStr?: string) {
    const useDate = dateStr || selectedDate || toYmd(new Date());
    setFormDate(useDate);
    setStartTime("10:00");
    setEndTime("11:00");
    setEndTimeTouched(false);
    setSelectedCustomerId("");
    setCustomerSearch("");
    setCustomerName("");
    setCustomerKana("");
    setCustomerPhone("");
    setStoreName("江戸堀");
    setStaffName("山口");
    setMenu("ストレッチ");
    setPaymentMethod("現金");
    setMemo("");
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function handleSelectCustomer(id: string) {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (!found) return;
    setCustomerName(found.name);
    setCustomerKana(found.kana);
    setCustomerPhone(found.phone);
    setCustomerSearch(found.name);
  }

  async function findOrCreateCustomerId(): Promise<string | null> {
    if (!supabase) throw new Error("Supabase未設定です。");

    const name = trimmed(customerName);
    const kana = trimmed(customerKana);
    const rawPhone = trimmed(customerPhone);
    const phone = normalizePhone(rawPhone);

    if (!name) return null;

    if (selectedCustomerId) {
      return selectedCustomerId;
    }

    const localMatch = customers.find((c) => {
      const sameName = trimmed(c.name) === name;
      const samePhone = phone && normalizePhone(c.phone) === phone;
      return sameName && (samePhone || !phone);
    });

    if (localMatch) return localMatch.id;

    if (phone) {
      const { data: phoneMatch, error: phoneMatchError } = await supabase
        .from("customers")
        .select("id, name, kana, phone")
        .eq("phone", rawPhone)
        .limit(1)
        .maybeSingle();

      if (phoneMatchError) {
        console.warn(phoneMatchError);
      }

      if (phoneMatch) {
        return String((phoneMatch as CustomerRow).id);
      }
    }

    const { data: nameMatch, error: nameMatchError } = await supabase
      .from("customers")
      .select("id, name, kana, phone")
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (nameMatchError) {
      console.warn(nameMatchError);
    }

    if (nameMatch) {
      return String((nameMatch as CustomerRow).id);
    }

    const { data: inserted, error: insertError } = await supabase
      .from("customers")
      .insert({
        name,
        kana: kana || null,
        phone: rawPhone || null,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return String(inserted.id);
  }

  async function handleSaveReservation() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    if (!trimmed(customerName)) {
      setError("顧客名を入力してください。");
      return;
    }

    if (!trimmed(formDate)) {
      setError("日付を入力してください。");
      return;
    }

    if (!trimmed(startTime)) {
      setError("開始時間を入力してください。");
      return;
    }

    if (!trimmed(endTime)) {
      setError("終了時間を入力してください。");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const customerId = await findOrCreateCustomerId();

      const payload = {
        customer_id: customerId ? Number(customerId) : null,
        customer_name: trimmed(customerName),
        date: formDate,
        start_time: startTime,
        end_time: endTime,
        store_name: storeName,
        staff_name: staffName,
        menu,
        payment_method: paymentMethod,
        memo: trimmed(memo) || null,
      };

      const { error } = await supabase.from("reservations").insert(payload);
      if (error) throw error;

      setSuccess("予約を保存しました。");
      setFormOpen(false);
      setSelectedDate(formDate);
      setDaySheetOpen(true);
      await Promise.all([loadCustomers(), loadReservations()]);
    } catch (e) {
      console.error(e);
      setError(`予約保存エラー: ${extractErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function handleChangeStartTime(value: string) {
    setStartTime(value);
    if (!endTimeTouched || !trimmed(endTime)) {
      setEndTime(addOneHour(value));
    }
  }

  function goPrevMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function goNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  if (!mounted) return null;

  return (
    <main style={styles.page}>
      <div style={styles.mobileWrap}>
        <section style={styles.topBar}>
          <div style={styles.topHeaderRow}>
            <div style={styles.monthRow}>
              <button type="button" onClick={goPrevMonth} style={styles.arrowBtn}>
                ‹
              </button>
              <h1 style={styles.monthTitle}>{formatMonthTitle(currentMonth)}</h1>
              <button type="button" onClick={goNextMonth} style={styles.arrowBtn}>
                ›
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              style={styles.topBtn}
            >
              TOPへ戻る
            </button>
          </div>

          <div style={styles.filterRow}>
            {STORE_OPTIONS.map((store) => (
              <button
                key={store}
                type="button"
                onClick={() => setSelectedStoreFilter(store)}
                style={{
                  ...styles.storeChip,
                  ...(selectedStoreFilter === store ? styles.storeChipActive : {}),
                }}
              >
                {store}
              </button>
            ))}
          </div>

          <div style={styles.legendBox}>
            {[
              "山口",
              "中西",
              "池田",
              "石川",
              "羽田",
              "菱谷",
              "井上",
              "林",
              "その他",
            ].map((name) => (
              <div key={name} style={styles.legendItem}>
                <span
                  style={{
                    ...styles.legendDot,
                    background: getStaffColor(name),
                  }}
                />
                {name}
              </div>
            ))}
          </div>
        </section>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {success ? <div style={styles.successBox}>{success}</div> : null}

        <section style={styles.calendarCard}>
          <div style={styles.weekHeader}>
            {WEEK_LABELS.map((label, index) => (
              <div
                key={label}
                style={{
                  ...styles.weekLabel,
                  color:
                    index === 5 ? "#2563eb" : index === 6 ? "#ef4444" : "#94a3b8",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div style={styles.calendarGrid}>
            {calendarDays.map((dateObj) => {
              const ymd = toYmd(dateObj);
              const items = reservationsByDate.get(ymd) || [];
              const isCurrentMonth = dateObj.getMonth() === currentMonth.getMonth();
              const isToday = ymd === toYmd(new Date());
              const isSelected = ymd === selectedDate;

              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => openDay(ymd)}
                  style={{
                    ...styles.dayCell,
                    ...(isSelected ? styles.dayCellSelected : {}),
                    opacity: isCurrentMonth ? 1 : 0.4,
                  }}
                >
                  <div style={styles.dayHead}>
                    <span
                      style={{
                        ...styles.dayNumber,
                        color:
                          dateObj.getDay() === 0
                            ? "#ef4444"
                            : dateObj.getDay() === 6
                            ? "#2563eb"
                            : "#0f172a",
                        ...(isToday ? styles.todayBadge : {}),
                      }}
                    >
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div style={styles.eventListMini}>
                    {items.slice(0, 3).map((item) => (
                      <div
                        key={String(item.id)}
                        style={{
                          ...styles.eventMini,
                          borderLeft: `4px solid ${getStaffColor(item.staff_name)}`,
                        }}
                      >
                        <span style={styles.eventMiniText}>
                          {trimmed(item.customer_name) || trimmed(item.staff_name) || "予定"}
                        </span>
                      </div>
                    ))}

                    {items.length > 3 ? (
                      <div style={styles.moreText}>+{items.length - 3}件</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={() => openCreateModal(selectedDate)}
          style={styles.fab}
        >
          ＋
        </button>

        {daySheetOpen ? (
          <div style={styles.sheetOverlay} onClick={() => setDaySheetOpen(false)}>
            <div
              style={styles.sheet}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.sheetHandle} />
              <div style={styles.sheetHeader}>
                <div>
                  <div style={styles.sheetDate}>{formatJapaneseDate(selectedDate)}</div>
                  <div style={styles.sheetCount}>
                    {selectedDayReservations.length}件
                  </div>
                </div>

                <div style={styles.sheetHeaderBtns}>
                  <button
                    type="button"
                    onClick={() => openCreateModal(selectedDate)}
                    style={styles.roundIconBtn}
                  >
                    ＋
                  </button>
                </div>
              </div>

              <div style={styles.sheetBody}>
                {loading ? (
                  <div style={styles.emptyText}>読み込み中...</div>
                ) : selectedDayReservations.length === 0 ? (
                  <div style={styles.emptyText}>この日の予定はまだありません。</div>
                ) : (
                  selectedDayReservations.map((item) => (
                    <button
                      key={String(item.id)}
                      type="button"
                      onClick={() => router.push(`/reservation/detail/${item.id}`)}
                      style={styles.dayEventRow}
                    >
                      <div style={styles.timeCol}>
                        <div style={styles.timeMain}>{trimmed(item.start_time) || "—"}</div>
                        <div style={styles.timeSub}>{trimmed(item.end_time) || "—"}</div>
                      </div>

                      <div
                        style={{
                          ...styles.colorBar,
                          background: getStaffColor(item.staff_name),
                        }}
                      />

                      <div style={styles.dayEventMain}>
                        <div style={styles.dayEventTopLine}>
                          <div style={styles.dayEventTitle}>
                            {trimmed(item.customer_name) || "予定"}
                          </div>
                          <div
                            style={{
                              ...styles.staffMiniBadge,
                              borderColor: getStaffColor(item.staff_name),
                              color: getStaffColor(item.staff_name),
                            }}
                          >
                            {trimmed(item.staff_name) || "その他"}
                          </div>
                        </div>

                        <div style={styles.dayEventSub}>
                          {trimmed(item.menu) || "—"}
                          {trimmed(item.payment_method)
                            ? ` / ${trimmed(item.payment_method)}`
                            : ""}
                        </div>

                        <div style={styles.dayEventSubMuted}>
                          {trimmed(item.store_name) || "—"}
                        </div>

                        {trimmed(item.memo) ? (
                          <div style={styles.dayEventMemo}>{trimmed(item.memo)}</div>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        {formOpen ? (
          <div style={styles.sheetOverlay} onClick={() => setFormOpen(false)}>
            <div
              style={styles.formModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.sheetHandle} />

              <div style={styles.formHeader}>
                <div style={styles.formTitle}>新規予約</div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  style={styles.closeBtn}
                >
                  ×
                </button>
              </div>

              <div style={styles.formBody}>
                <label style={styles.field}>
                  <span style={styles.label}>顧客検索</span>
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="氏名・かな・電話で検索"
                    style={styles.input}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>既存顧客を選択</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">選択しない（新規/手入力）</option>
                    {filteredCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.phone ? ` / ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={styles.formGrid2}>
                  <label style={styles.field}>
                    <span style={styles.label}>顧客名</span>
                    <input
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setSelectedCustomerId("");
                      }}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>かな</span>
                    <input
                      value={customerKana}
                      onChange={(e) => {
                        setCustomerKana(e.target.value);
                        setSelectedCustomerId("");
                      }}
                      style={styles.input}
                    />
                  </label>
                </div>

                <label style={styles.field}>
                  <span style={styles.label}>電話番号</span>
                  <input
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setSelectedCustomerId("");
                    }}
                    style={styles.input}
                  />
                </label>

                <div style={styles.formGrid2}>
                  <label style={styles.field}>
                    <span style={styles.label}>日付</span>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>店舗</span>
                    <select
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      style={styles.input}
                    >
                      {STORE_OPTIONS_FOR_FORM.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div style={styles.formGrid2}>
                  <label style={styles.field}>
                    <span style={styles.label}>開始時間</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleChangeStartTime(e.target.value)}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>終了時間</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        setEndTimeTouched(true);
                      }}
                      style={styles.input}
                    />
                  </label>
                </div>

                <div style={styles.autoHelp}>
                  開始時間を入れると、終了時間は1時間後が自動セットされます。あとで手動調整OK
                </div>

                <div style={styles.formGrid2}>
                  <label style={styles.field}>
                    <span style={styles.label}>担当スタッフ</span>
                    <select
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      style={styles.input}
                    >
                      {STAFF_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>メニュー</span>
                    <select
                      value={menu}
                      onChange={(e) => setMenu(e.target.value)}
                      style={styles.input}
                    >
                      {MENU_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label style={styles.field}>
                  <span style={styles.label}>支払方法</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={styles.input}
                  >
                    {PAYMENT_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>メモ</span>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    style={styles.textarea}
                    placeholder="備考・領収・回数券メモなど"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSaveReservation}
                  disabled={saving}
                  style={{
                    ...styles.saveBtn,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "保存中..." : "予約を保存"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "0",
  },
  mobileWrap: {
    maxWidth: 430,
    margin: "0 auto",
    minHeight: "100vh",
    background: "#f3f4f6",
    position: "relative",
    paddingBottom: 90,
  },
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(243,244,246,0.95)",
    backdropFilter: "blur(12px)",
    padding: "16px 12px 10px",
  },
  topHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  monthRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  monthTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  },
  arrowBtn: {
    border: "none",
    background: "#ffffff",
    width: 38,
    height: 38,
    borderRadius: 999,
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    cursor: "pointer",
    flexShrink: 0,
  },
  topBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 800,
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  filterRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 8,
  },
  storeChip: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    borderRadius: 16,
    padding: "8px 12px",
    whiteSpace: "nowrap",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  storeChipActive: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
  },
  legendBox: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 2,
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 8px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #e5e7eb",
    fontSize: 10,
    fontWeight: 700,
    color: "#374151",
    whiteSpace: "nowrap",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    display: "inline-block",
    flexShrink: 0,
  },
  calendarCard: {
    padding: "8px 10px 20px",
  },
  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 6,
    marginBottom: 8,
    padding: "0 4px",
  },
  weekLabel: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: 12,
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 6,
  },
  dayCell: {
    border: "none",
    background: "#ffffff",
    borderRadius: 18,
    minHeight: 108,
    padding: "8px 6px",
    textAlign: "left",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    cursor: "pointer",
  },
  dayCellSelected: {
    outline: "2px solid #111827",
  },
  dayHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: 900,
    minWidth: 24,
    textAlign: "center",
  },
  todayBadge: {
    background: "#111827",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 8px",
  },
  eventListMini: {
    display: "grid",
    gap: 4,
  },
  eventMini: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "4px 4px 4px 6px",
    overflow: "hidden",
  },
  eventMiniText: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#334155",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  moreText: {
    fontSize: 10,
    fontWeight: 700,
    color: "#64748b",
    paddingLeft: 2,
  },
  fab: {
    position: "fixed",
    right: "max(calc(50% - 200px), 18px)",
    bottom: 22,
    width: 62,
    height: 62,
    borderRadius: 999,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontSize: 34,
    boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
    zIndex: 40,
    cursor: "pointer",
  },
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.28)",
    zIndex: 50,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: "8px 0 14px",
    maxHeight: "88vh",
    overflow: "hidden",
  },
  formModal: {
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: "10px 0 20px",
    maxHeight: "90vh",
    overflow: "hidden",
  },
  sheetHandle: {
    width: 56,
    height: 6,
    borderRadius: 999,
    background: "#d1d5db",
    margin: "0 auto 10px",
  },
  sheetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px 8px",
  },
  sheetDate: {
    fontSize: 16,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.2,
  },
  sheetCount: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: 700,
    color: "#6b7280",
  },
  sheetHeaderBtns: {
    display: "flex",
    gap: 8,
  },
  roundIconBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    width: 38,
    height: 38,
    borderRadius: 999,
    fontSize: 22,
    fontWeight: 700,
    cursor: "pointer",
  },
  sheetBody: {
    overflowY: "auto",
    maxHeight: "calc(88vh - 88px)",
    padding: "0 10px 2px",
    display: "grid",
    gap: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 700,
    padding: "22px 10px",
  },
  dayEventRow: {
    width: "100%",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 14,
    padding: "8px 9px",
    display: "grid",
    gridTemplateColumns: "44px 5px minmax(0,1fr)",
    gap: 8,
    alignItems: "start",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  },
  timeCol: {
    textAlign: "center",
    paddingTop: 1,
  },
  timeMain: {
    fontSize: 13,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.05,
  },
  timeSub: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: 700,
    color: "#6b7280",
    lineHeight: 1.1,
  },
  colorBar: {
    width: 5,
    borderRadius: 999,
    alignSelf: "stretch",
    minHeight: 46,
  },
  dayEventMain: {
    minWidth: 0,
  },
  dayEventTopLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 2,
  },
  dayEventTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.25,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
    flex: 1,
  },
  staffMiniBadge: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 800,
    border: "1px solid",
    borderRadius: 999,
    padding: "2px 6px",
    background: "#fff",
    lineHeight: 1.1,
  },
  dayEventSub: {
    fontSize: 11,
    fontWeight: 700,
    color: "#374151",
    lineHeight: 1.35,
  },
  dayEventSubMuted: {
    fontSize: 10,
    fontWeight: 700,
    color: "#6b7280",
    lineHeight: 1.35,
    marginTop: 1,
  },
  dayEventMemo: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 1.35,
    color: "#6b7280",
    background: "#f8fafc",
    borderRadius: 8,
    padding: "4px 6px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  formHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px 12px",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "#111827",
  },
  closeBtn: {
    border: "none",
    background: "#f3f4f6",
    color: "#111827",
    width: 36,
    height: 36,
    borderRadius: 999,
    fontSize: 20,
    fontWeight: 700,
    cursor: "pointer",
  },
  formBody: {
    overflowY: "auto",
    maxHeight: "calc(90vh - 68px)",
    padding: "0 18px 10px",
    display: "grid",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 800,
    color: "#374151",
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "12px 14px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
    resize: "vertical",
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  autoHelp: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#6b7280",
    background: "#f8fafc",
    borderRadius: 12,
    padding: "10px 12px",
  },
  saveBtn: {
    height: 48,
    border: "none",
    borderRadius: 14,
    background: "#111827",
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    marginTop: 4,
  },
  errorBox: {
    margin: "8px 12px 0",
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.5,
  },
  successBox: {
    margin: "8px 12px 0",
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.5,
  },
};