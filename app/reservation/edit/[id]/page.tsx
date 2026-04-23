"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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
  visit_type?: string | null;
  reservation_status?: string | null;
  is_first_visit?: boolean | null;
  created_at?: string | null;
};

type CustomerRow = {
  id: string | number;
  name?: string | null;
  kana?: string | null;
  phone?: string | null;
  plan_type?: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
  kana: string;
  phone: string;
  planType?: string;
};

const STORE_OPTIONS = [
  "江戸堀",
  "箕面",
  "福島",
  "福島P",
  "天満橋",
  "中崎町",
  "江坂",
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
  "40分4回_旧",
  "40分8回_旧",
  "40分12回_旧",
  "60分4回_旧",
  "60分8回_旧",
  "60分12回_旧",
  "80分4回_旧",
  "80分8回_旧",
  "80分12回_旧",
  "120分4回_旧",
  "120分8回_旧",
  "120分12回_旧",
  "40分4回_新",
  "40分8回_新",
  "40分12回_新",
  "60分4回_新",
  "60分8回_新",
  "60分12回_新",
  "80分4回_新",
  "80分8回_新",
  "80分12回_新",
  "120分4回_新",
  "120分8回_新",
  "120分12回_新",
  "ダイエット16回",
  "ゴールド24回",
  "プラチナ32回",
  "月2回",
  "月4回",
  "月8回",
  "ペアトレ",
  "ヘッドスパ",
  "アロマ",
  "その他",
];

const PAYMENT_OPTIONS = ["現金", "カード", "銀行振込", "その他"];
const VISIT_TYPE_OPTIONS = ["新規", "再来"];

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

export default function ReservationEditPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = String(params?.id || "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [originalReservation, setOriginalReservation] = useState<ReservationRow | null>(null);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerKana, setCustomerKana] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [formDate, setFormDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [endTimeTouched, setEndTimeTouched] = useState(false);

  const [storeName, setStoreName] = useState("江戸堀");
  const [staffName, setStaffName] = useState("山口");
  const [menu, setMenu] = useState("ストレッチ");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [visitType, setVisitType] = useState("再来");
  const [memo, setMemo] = useState("");
  const [reservationStatus, setReservationStatus] = useState("予約済");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loggedIn =
      localStorage.getItem("gymup_logged_in") ||
      localStorage.getItem("gymup_staff_logged_in") ||
      localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      router.replace("/login/staff");
      return;
    }

    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, reservationId]);

  async function loadInitial() {
    await Promise.all([loadCustomers(), loadReservation()]);
  }

  async function loadCustomers() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, kana, phone, plan_type")
        .order("id", { ascending: false })
        .limit(400);

      if (error) throw error;

      const normalized = ((data as CustomerRow[]) || []).map((row) => ({
        id: String(row.id),
        name: row.name || "",
        kana: row.kana || "",
        phone: row.phone || "",
        planType: row.plan_type || "",
      }));

      setCustomers(normalized);
    } catch (e) {
      console.error(e);
      setError(`顧客取得エラー: ${extractErrorMessage(e)}`);
    }
  }

  async function loadReservation() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    if (!reservationId) {
      setLoading(false);
      setError("予約IDが取得できません。");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const reservationKey = toNumberOrNull(reservationId) ?? reservationId;

      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, customer_id, customer_name, date, start_time, end_time, store_name, staff_name, menu, payment_method, memo, visit_type, reservation_status, is_first_visit, created_at"
        )
        .eq("id", reservationKey)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("予約データが見つかりません。");

      const row = data as ReservationRow;
      setOriginalReservation(row);

      setSelectedCustomerId(trimmed(row.customer_id));
      setCustomerName(trimmed(row.customer_name));
      setCustomerSearch(trimmed(row.customer_name));
      setFormDate(trimmed(row.date));
      setStartTime(trimmed(row.start_time) || "10:00");
      setEndTime(trimmed(row.end_time) || "11:00");
      setEndTimeTouched(true);
      setStoreName(trimmed(row.store_name) || "江戸堀");
      setStaffName(trimmed(row.staff_name) || "山口");
      setMenu(trimmed(row.menu) || "ストレッチ");
      setPaymentMethod(trimmed(row.payment_method) || "現金");
      setVisitType(trimmed(row.visit_type) || (row.is_first_visit ? "新規" : "再来"));
      setMemo(trimmed(row.memo));
      setReservationStatus(trimmed(row.reservation_status) || "予約済");

      const customerId = trimmed(row.customer_id);
      if (customerId) {
        const found = customers.find((c) => c.id === customerId);
        if (found) {
          setCustomerKana(found.kana);
          setCustomerPhone(found.phone);
        } else {
          const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select("id, name, kana, phone, plan_type")
            .eq("id", Number(customerId))
            .maybeSingle();

          if (!customerError && customerData) {
            const customerRow = customerData as CustomerRow;
            setCustomerKana(trimmed(customerRow.kana));
            setCustomerPhone(trimmed(customerRow.phone));
          }
        }
      }
    } catch (e) {
      console.error(e);
      setError(`予約取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const q = trimmed(customerSearch).toLowerCase();
    if (!q) return customers.slice(0, 20);

    return customers
      .filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          c.kana.toLowerCase().includes(q) ||
          c.phone.includes(q)
        );
      })
      .slice(0, 20);
  }, [customerSearch, customers]);

  function handleSelectCustomer(id: string) {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (!found) return;

    setCustomerName(found.name);
    setCustomerKana(found.kana);
    setCustomerPhone(found.phone);
    setCustomerSearch(found.name);
    setVisitType("再来");
  }

  function handleChangeStartTime(value: string) {
    setStartTime(value);
    if (!endTimeTouched || !trimmed(endTime)) {
      setEndTime(addOneHour(value));
    }
  }

  async function findOrCreateCustomerId(): Promise<string | null> {
    if (!supabase) throw new Error("Supabase未設定です。");

    const name = trimmed(customerName);
    const kana = trimmed(customerKana);
    const rawPhone = trimmed(customerPhone);
    const phone = normalizePhone(rawPhone);

    if (!name) return null;

    if (selectedCustomerId) return selectedCustomerId;

    const localMatch = customers.find((c) => {
      const sameName = trimmed(c.name) === name;
      const samePhone = phone && normalizePhone(c.phone) === phone;
      return sameName && (samePhone || !phone);
    });

    if (localMatch) return localMatch.id;

    if (phone) {
      const { data: phoneMatch, error: phoneMatchError } = await supabase
        .from("customers")
        .select("id, name, kana, phone, plan_type")
        .eq("phone", rawPhone)
        .limit(1)
        .maybeSingle();

      if (phoneMatchError) {
        console.warn(phoneMatchError);
      }

      if (phoneMatch) return String((phoneMatch as CustomerRow).id);
    }

    const { data: nameMatch, error: nameMatchError } = await supabase
      .from("customers")
      .select("id, name, kana, phone, plan_type")
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (nameMatchError) {
      console.warn(nameMatchError);
    }

    if (nameMatch) return String((nameMatch as CustomerRow).id);

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

  async function handleSave() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    if (!originalReservation) {
      setError("元の予約データがありません。");
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

    if (!trimmed(visitType)) {
      setError("来店区分を選択してください。");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const customerId = await findOrCreateCustomerId();
      const reservationKey = toNumberOrNull(originalReservation.id) ?? originalReservation.id;

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
        visit_type: visitType,
        reservation_status: reservationStatus || "予約済",
        is_first_visit: visitType === "新規",
        memo: trimmed(memo) || null,
      };

      const { error } = await supabase
        .from("reservations")
        .update(payload)
        .eq("id", reservationKey);

      if (error) throw error;

      setSuccess("予約を更新しました。");

      setTimeout(() => {
        router.push(`/reservation/detail/${reservationKey}`);
      }, 300);
    } catch (e) {
      console.error(e);
      setError(`予約更新エラー: ${extractErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <section style={styles.heroCard}>
          <div style={styles.heroTop}>
            <div>
              <div style={styles.eyebrow}>GYMUP CRM</div>
              <h1 style={styles.title}>予約編集</h1>
              <div style={styles.subTitle}>既存の予約内容を更新します</div>
            </div>

            <div style={styles.topActions}>
              <button
                type="button"
                onClick={() => router.push("/reservation")}
                style={styles.darkBtn}
              >
                予約一覧へ
              </button>

              <button
                type="button"
                onClick={() =>
                  reservationId
                    ? router.push(`/reservation/detail/${reservationId}`)
                    : router.back()
                }
                style={styles.subBtn}
              >
                詳細へ戻る
              </button>
            </div>
          </div>

          {error ? <div style={styles.errorBox}>{error}</div> : null}
          {success ? <div style={styles.successBox}>{success}</div> : null}
        </section>

        {loading ? (
          <section style={styles.card}>
            <div style={styles.emptyBox}>読み込み中...</div>
          </section>
        ) : !originalReservation ? (
          <section style={styles.card}>
            <div style={styles.emptyBox}>予約データがありません。</div>
          </section>
        ) : (
          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>編集フォーム</h2>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formBlockFull}>
                <label style={styles.label}>顧客検索</label>
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="名前・かな・電話で検索"
                  style={styles.input}
                />

                {filteredCustomers.length > 0 ? (
                  <div style={styles.customerSuggestList}>
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c.id)}
                        style={styles.customerSuggestItem}
                      >
                        <div style={styles.customerSuggestTitle}>
                          {c.name || "名称なし"}
                        </div>
                        <div style={styles.customerSuggestSub}>
                          {c.kana || "かな未設定"} / {c.phone || "電話未設定"}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={styles.formBlockFull}>
                <label style={styles.label}>顧客名</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="山田 太郎"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>かな</label>
                <input
                  value={customerKana}
                  onChange={(e) => setCustomerKana(e.target.value)}
                  placeholder="やまだ たろう"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>電話番号</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="09012345678"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>日付</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>来店区分</label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  style={styles.input}
                >
                  {VISIT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>開始時間</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleChangeStartTime(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>終了時間</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setEndTimeTouched(true);
                  }}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>店舗</label>
                <select
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  style={styles.input}
                >
                  {STORE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>担当</label>
                <select
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  style={styles.input}
                >
                  {STAFF_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>メニュー</label>
                <select
                  value={menu}
                  onChange={(e) => setMenu(e.target.value)}
                  style={styles.input}
                >
                  {MENU_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>支払方法</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={styles.input}
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>予約ステータス</label>
                <select
                  value={reservationStatus}
                  onChange={(e) => setReservationStatus(e.target.value)}
                  style={styles.input}
                >
                  <option value="予約済">予約済</option>
                  <option value="売上済">売上済</option>
                  <option value="キャンセル">キャンセル</option>
                </select>
              </div>

              <div style={styles.formBlockFull}>
                <label style={styles.label}>メモ</label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={5}
                  style={styles.textarea}
                  placeholder="備考があれば入力"
                />
              </div>
            </div>

            <div style={styles.footerBar}>
              <button
                type="button"
                onClick={() =>
                  reservationId
                    ? router.push(`/reservation/detail/${reservationId}`)
                    : router.back()
                }
                style={styles.cancelBtn}
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                style={{
                  ...styles.saveBtn,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "保存中..." : "更新する"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    padding: "18px 12px 40px",
  },
  wrap: {
    maxWidth: 980,
    margin: "0 auto",
    display: "grid",
    gap: 14,
  },
  heroCard: {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.1,
    color: "#0f172a",
    fontWeight: 900,
  },
  subTitle: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    fontWeight: 700,
  },
  topActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  darkBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  subBtn: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  errorBox: {
    marginTop: 14,
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 13,
  },
  successBox: {
    marginTop: 14,
    background: "#dcfce7",
    color: "#166534",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 13,
  },
  card: {
    background: "#fff",
    borderRadius: 22,
    padding: 16,
    boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
  },
  emptyBox: {
    background: "#f8fafc",
    borderRadius: 16,
    padding: "18px 14px",
    color: "#64748b",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: "#0f172a",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  formBlockFull: {
    gridColumn: "1 / -1",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: "0 12px",
    fontSize: 14,
    color: "#0f172a",
    boxSizing: "border-box",
    outline: "none",
  },
  textarea: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: 12,
    fontSize: 14,
    color: "#0f172a",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
  },
  customerSuggestList: {
    display: "grid",
    gap: 8,
    marginTop: 10,
    maxHeight: 220,
    overflowY: "auto",
  },
  customerSuggestItem: {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#f8fafc",
    padding: 12,
    textAlign: "left",
    cursor: "pointer",
  },
  customerSuggestTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 4,
  },
  customerSuggestSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
  footerBar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 18,
    flexWrap: "wrap",
  },
  cancelBtn: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  saveBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 900,
  },
};