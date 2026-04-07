"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

type CustomerRow = {
  id: string | number;
  name?: string | null;
  kana?: string | null;
  furigana?: string | null;
  phone?: string | null;
  phone_number?: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
  kana: string;
  phone: string;
};

const STORE_OPTIONS = [
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

function normalizeCustomer(row: CustomerRow): CustomerOption {
  return {
    id: String(row.id),
    name: row.name || "",
    kana: row.kana || row.furigana || "",
    phone: row.phone || row.phone_number || "",
  };
}

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, "");
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
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerKana, setCustomerKana] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("10:00");
  const [storeName, setStoreName] = useState(STORE_OPTIONS[0]);
  const [staffName, setStaffName] = useState(STAFF_OPTIONS[0]);
  const [menu, setMenu] = useState(MENU_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_OPTIONS[0]);
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

    void loadCustomers();
  }, [mounted, router]);

  async function loadCustomers() {
    if (!supabase) {
      setLoadingCustomers(false);
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      setLoadingCustomers(true);
      setError("");

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, kana, furigana, phone, phone_number")
        .order("id", { ascending: false })
        .limit(300);

      if (error) throw error;

      setCustomers(((data as CustomerRow[]) || []).map(normalizeCustomer));
    } catch (e) {
      console.error(e);
      setError(`顧客取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoadingCustomers(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const q = trimmed(customerSearch).toLowerCase();
    if (!q) return customers.slice(0, 30);

    return customers
      .filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          c.kana.toLowerCase().includes(q) ||
          c.phone.includes(q)
        );
      })
      .slice(0, 30);
  }, [customerSearch, customers]);

  function handleSelectCustomer(customerId: string) {
    setSelectedCustomerId(customerId);

    const found = customers.find((c) => c.id === customerId);
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

    const localExact = customers.find((c) => {
      const sameName = trimmed(c.name) === name;
      const samePhone = phone && normalizePhone(c.phone) === phone;
      return sameName && (samePhone || !phone);
    });

    if (localExact) {
      return localExact.id;
    }

    if (phone) {
      const { data: phoneMatch, error: phoneMatchError } = await supabase
        .from("customers")
        .select("id, name, kana, furigana, phone, phone_number")
        .or(`phone.eq.${rawPhone},phone_number.eq.${rawPhone}`)
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
      .select("id, name, kana, furigana, phone, phone_number")
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (nameMatchError) {
      console.warn(nameMatchError);
    }

    if (nameMatch) {
      return String((nameMatch as CustomerRow).id);
    }

    const insertPayload = {
      name,
      kana: kana || null,
      phone: rawPhone || null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("customers")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    return String(inserted.id);
  }

  async function handleSave() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    const name = trimmed(customerName);

    if (!name) {
      setError("顧客名を入力してください。");
      return;
    }

    if (!trimmed(date)) {
      setError("予約日を入力してください。");
      return;
    }

    if (!trimmed(startTime)) {
      setError("開始時間を入力してください。");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const customerId = await findOrCreateCustomerId();

      const reservationPayload = {
        customer_id: customerId ? Number(customerId) : null,
        customer_name: name,
        date,
        start_time: startTime,
        store_name: storeName,
        staff_name: staffName,
        menu,
        payment_method: paymentMethod,
        memo: trimmed(memo) || null,
      };

      const { error: reservationError } = await supabase
        .from("reservations")
        .insert(reservationPayload);

      if (reservationError) {
        throw reservationError;
      }

      setSuccess("予約を保存しました。");
      await loadCustomers();

      setTimeout(() => {
        if (customerId) {
          router.push(`/customer/${customerId}`);
        } else {
          router.push("/reservation");
        }
      }, 400);
    } catch (e) {
      console.error(e);
      setError(`予約保存エラー: ${extractErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <section style={styles.headerCard}>
          <div>
            <div style={styles.eyebrow}>NEW RESERVATION</div>
            <h1 style={styles.title}>新規予約</h1>
          </div>

          <div style={styles.headerButtons}>
            <button
              type="button"
              onClick={() => router.push("/reservation")}
              style={styles.secondaryButton}
            >
              予約一覧へ戻る
            </button>
            <button
              type="button"
              onClick={() => router.push("/customer")}
              style={styles.secondaryButton}
            >
              顧客一覧へ
            </button>
          </div>
        </section>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {success ? <div style={styles.successBox}>{success}</div> : null}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>顧客選択 / 顧客入力</h2>

          <div style={styles.grid2}>
            <label style={styles.field}>
              <span style={styles.label}>顧客検索</span>
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="氏名・かな・電話番号で検索"
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>既存顧客を選択</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                style={styles.input}
                disabled={loadingCustomers}
              >
                <option value="">
                  {loadingCustomers ? "顧客を読み込み中..." : "選択しない（新規/手入力）"}
                </option>
                {filteredCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.phone ? ` / ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={styles.grid3}>
            <label style={styles.field}>
              <span style={styles.label}>顧客名</span>
              <input
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setSelectedCustomerId("");
                }}
                placeholder="例：山田太郎"
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
                placeholder="例：やまだたろう"
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>電話番号</span>
              <input
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  setSelectedCustomerId("");
                }}
                placeholder="例：09012345678"
                style={styles.input}
              />
            </label>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>予約情報</h2>

          <div style={styles.grid3}>
            <label style={styles.field}>
              <span style={styles.label}>予約日</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>開始時間</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
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
                {STORE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

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
          </div>

          <label style={styles.field}>
            <span style={styles.label}>メモ</span>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="備考・注意点など"
              style={styles.textarea}
            />
          </label>
        </section>

        <section style={styles.footerCard}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              ...styles.primaryButton,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "保存中..." : "予約を保存"}
          </button>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: "24px 16px 80px",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gap: 18,
  },
  headerCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.12em",
    color: "#64748b",
    marginBottom: 6,
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: 28,
    color: "#0f172a",
  },
  headerButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    display: "grid",
    gap: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  footerCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(203,213,225,0.95)",
    background: "#ffffff",
    padding: "0 14px",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 14,
    border: "1px solid rgba(203,213,225,0.95)",
    background: "#ffffff",
    padding: "12px 14px",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  secondaryButton: {
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.24)",
    background: "#ffffff",
    color: "#334155",
    fontSize: 14,
    fontWeight: 700,
    padding: "0 16px",
    cursor: "pointer",
  },
  primaryButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 800,
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(254,242,242,0.98)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: 700,
  },
  successBox: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(240,253,244,0.98)",
    border: "1px solid rgba(34,197,94,0.18)",
    color: "#15803d",
    fontSize: 14,
    fontWeight: 700,
  },
};