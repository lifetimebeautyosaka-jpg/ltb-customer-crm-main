"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
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

const AUTH_STORAGE_KEY = "gymup_logged_in";
const ROLE_STORAGE_KEY = "gymup_user_role";
const STAFF_NAME_STORAGE_KEY = "gymup_current_staff_name";

type CustomerOption = {
  id: string;
  name: string;
  kana: string;
  phone: string;
  planType?: string;
};

type TicketContractRow = {
  id: string | number;
  customer_id: string | number;
  ticket_name: string;
  service_type: string;
  total_count: number;
  used_count: number;
  remaining_count: number;
  unit_price: number;
  prepaid_amount: number;
  prepaid_balance: number;
  status: string;
  start_date?: string | null;
  created_at?: string | null;
};

type TicketPreset = {
  label: string;
  ticketName: string;
  serviceType: "ストレッチ" | "トレーニング";
  totalCount: number;
  unitPrice: number;
};

const TICKET_PRESETS: TicketPreset[] = [
  // ストレッチ旧
  { label: "40分4回_旧", ticketName: "40分4回_旧", serviceType: "ストレッチ", totalCount: 4, unitPrice: 5330 },
  { label: "40分8回_旧", ticketName: "40分8回_旧", serviceType: "ストレッチ", totalCount: 8, unitPrice: 5090 },
  { label: "40分12回_旧", ticketName: "40分12回_旧", serviceType: "ストレッチ", totalCount: 12, unitPrice: 5000 },

  { label: "60分4回_旧", ticketName: "60分4回_旧", serviceType: "ストレッチ", totalCount: 4, unitPrice: 7980 },
  { label: "60分8回_旧", ticketName: "60分8回_旧", serviceType: "ストレッチ", totalCount: 8, unitPrice: 7640 },
  { label: "60分12回_旧", ticketName: "60分12回_旧", serviceType: "ストレッチ", totalCount: 12, unitPrice: 7500 },

  { label: "80分4回_旧", ticketName: "80分4回_旧", serviceType: "ストレッチ", totalCount: 4, unitPrice: 10670 },
  { label: "80分8回_旧", ticketName: "80分8回_旧", serviceType: "ストレッチ", totalCount: 8, unitPrice: 10180 },
  { label: "80分12回_旧", ticketName: "80分12回_旧", serviceType: "ストレッチ", totalCount: 12, unitPrice: 10000 },

  { label: "120分4回_旧", ticketName: "120分4回_旧", serviceType: "ストレッチ", totalCount: 4, unitPrice: 16000 },
  { label: "120分8回_旧", ticketName: "120分8回_旧", serviceType: "ストレッチ", totalCount: 8, unitPrice: 15270 },
  { label: "120分12回_旧", ticketName: "120分12回_旧", serviceType: "ストレッチ", totalCount: 12, unitPrice: 15000 },

  // ストレッチ新
  { label: "40分4回_新", ticketName: "40分4回_新", serviceType: "ストレッチ", totalCount: 4, unitPrice: 5330 },
  { label: "40分8回_新", ticketName: "40分8回_新", serviceType: "ストレッチ", totalCount: 8, unitPrice: 5090 },
  { label: "40分12回_新", ticketName: "40分12回_新", serviceType: "ストレッチ", totalCount: 12, unitPrice: 5000 },

  { label: "60分4回_新", ticketName: "60分4回_新", serviceType: "ストレッチ", totalCount: 4, unitPrice: 7980 },
  { label: "60分8回_新", ticketName: "60分8回_新", serviceType: "ストレッチ", totalCount: 8, unitPrice: 7640 },
  { label: "60分12回_新", ticketName: "60分12回_新", serviceType: "ストレッチ", totalCount: 12, unitPrice: 7500 },

  { label: "80分4回_新", ticketName: "80分4回_新", serviceType: "ストレッチ", totalCount: 4, unitPrice: 10670 },
  { label: "80分8回_新", ticketName: "80分8回_新", serviceType: "ストレッチ", totalCount: 8, unitPrice: 10180 },
  { label: "80分12回_新", ticketName: "80分12回_新", serviceType: "ストレッチ", totalCount: 12, unitPrice: 10000 },

  { label: "120分4回_新", ticketName: "120分4回_新", serviceType: "ストレッチ", totalCount: 4, unitPrice: 16000 },
  { label: "120分8回_新", ticketName: "120分8回_新", serviceType: "ストレッチ", totalCount: 8, unitPrice: 15270 },
  { label: "120分12回_新", ticketName: "120分12回_新", serviceType: "ストレッチ", totalCount: 12, unitPrice: 15000 },

  // トレーニング
  { label: "ダイエット16回", ticketName: "ダイエット16回", serviceType: "トレーニング", totalCount: 16, unitPrice: 11000 },
  { label: "ゴールド24回", ticketName: "ゴールド24回", serviceType: "トレーニング", totalCount: 24, unitPrice: 10450 },
  { label: "プラチナ32回", ticketName: "プラチナ32回", serviceType: "トレーニング", totalCount: 32, unitPrice: 10230 },
  { label: "月2回", ticketName: "月2回", serviceType: "トレーニング", totalCount: 2, unitPrice: 8800 },
  { label: "月4回", ticketName: "月4回", serviceType: "トレーニング", totalCount: 4, unitPrice: 8470 },
  { label: "月8回", ticketName: "月8回", serviceType: "トレーニング", totalCount: 8, unitPrice: 8250 },
];

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function yen(value: number | string | null | undefined) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "—";
  return `¥${num.toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP").format(date);
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

export default function TicketContractsPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  const [selectedTicketName, setSelectedTicketName] = useState("");
  const [serviceType, setServiceType] = useState<"ストレッチ" | "トレーニング">("ストレッチ");
  const [totalCount, setTotalCount] = useState("4");
  const [unitPrice, setUnitPrice] = useState("0");
  const [usedCount, setUsedCount] = useState("0");
  const [remainingCount, setRemainingCount] = useState("4");
  const [prepaidAmount, setPrepaidAmount] = useState("0");
  const [prepaidBalance, setPrepaidBalance] = useState("0");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState(toYmd(new Date()));

  const [contracts, setContracts] = useState<TicketContractRow[]>([]);

  useEffect(() => {
    const loggedIn = localStorage.getItem(AUTH_STORAGE_KEY);
    const role = localStorage.getItem(ROLE_STORAGE_KEY);
    const staffName = localStorage.getItem(STAFF_NAME_STORAGE_KEY);

    const legacyStaffLoggedIn = localStorage.getItem("gymup_staff_logged_in");
    const legacyIsLoggedIn = localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      if (legacyStaffLoggedIn === "true" || legacyIsLoggedIn === "true") {
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
        localStorage.setItem(ROLE_STORAGE_KEY, role || "staff");
        if (!staffName) {
          localStorage.setItem(STAFF_NAME_STORAGE_KEY, "スタッフ");
        }
      }
    }

    localStorage.removeItem("gymup_staff_logged_in");
    localStorage.removeItem("isLoggedIn");

    const finalLoggedIn = localStorage.getItem(AUTH_STORAGE_KEY);
    const finalRole = localStorage.getItem(ROLE_STORAGE_KEY);

    if (finalLoggedIn !== "true" || !finalRole) {
      router.replace("/login/staff");
      return;
    }

    setAuthChecked(true);
    void Promise.all([loadCustomers(), loadContracts()]);
  }, [router]);

  const filteredCustomers = useMemo(() => {
    const q = trimmed(customerSearch).toLowerCase();
    if (!q) return customers.slice(0, 30);

    return customers
      .filter((customer) => {
        return (
          customer.name.toLowerCase().includes(q) ||
          customer.kana.toLowerCase().includes(q) ||
          customer.phone.includes(q)
        );
      })
      .slice(0, 30);
  }, [customerSearch, customers]);

  const selectedPreset = useMemo(() => {
    return TICKET_PRESETS.find((preset) => preset.ticketName === selectedTicketName) || null;
  }, [selectedTicketName]);

  useEffect(() => {
    if (!selectedPreset) return;

    const total = selectedPreset.totalCount;
    const unit = selectedPreset.unitPrice;
    const prepaid = total * unit;

    setServiceType(selectedPreset.serviceType);
    setTotalCount(String(total));
    setUnitPrice(String(unit));
    setUsedCount("0");
    setRemainingCount(String(total));
    setPrepaidAmount(String(prepaid));
    setPrepaidBalance(String(prepaid));
  }, [selectedPreset]);

  async function loadCustomers() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      setLoadingCustomers(false);
      return;
    }

    try {
      setLoadingCustomers(true);

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, kana, phone, plan_type")
        .order("id", { ascending: false })
        .limit(500);

      if (error) throw error;

      const normalized = (((data as any[]) || []).map((row) => ({
        id: String(row.id),
        name: row.name || "",
        kana: row.kana || "",
        phone: row.phone || "",
        planType: row.plan_type || "",
      })) as CustomerOption[]);

      setCustomers(normalized);
    } catch (e) {
      console.error(e);
      setError(`顧客取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadContracts() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      setLoadingContracts(false);
      return;
    }

    try {
      setLoadingContracts(true);

      const { data, error } = await supabase
        .from("ticket_contracts")
        .select("*")
        .order("id", { ascending: false })
        .limit(50);

      if (error) throw error;

      setContracts((data as TicketContractRow[]) || []);
    } catch (e) {
      console.error(e);
      setError(`契約取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoadingContracts(false);
    }
  }

  function handleSelectCustomer(customer: CustomerOption) {
    setSelectedCustomerId(customer.id);
    setSelectedCustomerName(customer.name);
    setCustomerSearch(customer.name);
  }

  function handleManualCountChange(nextCount: string) {
    setTotalCount(nextCount);
    const total = Number(nextCount || 0);
    const unit = Number(unitPrice || 0);
    const used = Number(usedCount || 0);
    const prepaid = total * unit;

    setRemainingCount(String(Math.max(total - used, 0)));
    setPrepaidAmount(String(prepaid));
    setPrepaidBalance(String(prepaid));
  }

  function handleManualUnitPriceChange(nextUnit: string) {
    setUnitPrice(nextUnit);
    const total = Number(totalCount || 0);
    const unit = Number(nextUnit || 0);
    const prepaid = total * unit;

    setPrepaidAmount(String(prepaid));
    setPrepaidBalance(String(prepaid));
  }

  async function handleCreateContract() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    if (!selectedCustomerId) {
      setError("顧客を選択してください。");
      return;
    }

    if (!trimmed(selectedTicketName)) {
      setError("回数券メニューを選択してください。");
      return;
    }

    const total = Number(totalCount || 0);
    const used = Number(usedCount || 0);
    const remaining = Number(remainingCount || 0);
    const unit = Number(unitPrice || 0);
    const prepaid = Number(prepaidAmount || 0);
    const balance = Number(prepaidBalance || 0);

    if (!Number.isFinite(total) || total <= 0) {
      setError("総回数を正しく入力してください。");
      return;
    }

    if (!Number.isFinite(unit) || unit <= 0) {
      setError("単価を正しく入力してください。");
      return;
    }

    if (!trimmed(startDate)) {
      setError("購入日を入力してください。");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { error } = await supabase.from("ticket_contracts").insert({
        customer_id: Number(selectedCustomerId),
        ticket_name: trimmed(selectedTicketName),
        service_type: serviceType,
        total_count: total,
        used_count: used,
        remaining_count: remaining,
        unit_price: unit,
        prepaid_amount: prepaid,
        prepaid_balance: balance,
        status,
        start_date: startDate,
      });

      if (error) throw error;

      const { error: customerUpdateError } = await supabase
        .from("customers")
        .update({
          plan_type: trimmed(selectedTicketName),
        })
        .eq("id", Number(selectedCustomerId));

      if (customerUpdateError) {
        console.warn(customerUpdateError);
      }

      setSuccess("回数券契約を登録しました。");
      setSelectedCustomerId("");
      setSelectedCustomerName("");
      setCustomerSearch("");
      setSelectedTicketName("");
      setServiceType("ストレッチ");
      setTotalCount("4");
      setUnitPrice("0");
      setUsedCount("0");
      setRemainingCount("4");
      setPrepaidAmount("0");
      setPrepaidBalance("0");
      setStatus("active");
      setStartDate(toYmd(new Date()));

      await Promise.all([loadCustomers(), loadContracts()]);
    } catch (e) {
      console.error(e);
      setError(`契約登録エラー: ${extractErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked) return null;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topRow}>
          <Link href="/dashboard" style={styles.backLink}>
            ← ダッシュボードへ戻る
          </Link>
          <Link href="/reservation" style={styles.linkButton}>
            予約管理へ
          </Link>
        </div>

        <section style={styles.heroCard}>
          <div style={styles.eyebrow}>TICKET CONTRACTS</div>
          <h1 style={styles.pageTitle}>回数券購入登録</h1>
          <p style={styles.pageSub}>
            回数券の購入時は売上に入れず、前受金として契約を登録します。
            消化時に売上化する前提の画面です。
          </p>
        </section>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {success ? <div style={styles.successBox}>{success}</div> : null}

        <div style={styles.mainGrid}>
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>顧客選択</h2>

            <label style={styles.label}>顧客検索</label>
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="名前・かな・電話で検索"
              style={styles.input}
            />

            <div style={styles.searchList}>
              {loadingCustomers ? (
                <div style={styles.emptyBox}>読み込み中...</div>
              ) : filteredCustomers.length === 0 ? (
                <div style={styles.emptyBox}>該当する顧客がいません。</div>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    style={{
                      ...styles.searchItem,
                      ...(selectedCustomerId === customer.id ? styles.searchItemActive : {}),
                    }}
                  >
                    <div style={styles.searchItemTitle}>{customer.name || "名称なし"}</div>
                    <div style={styles.searchItemSub}>
                      {customer.kana || "かな未設定"} / {customer.phone || "電話未設定"}
                    </div>
                    <div style={styles.searchItemSub}>
                      現在プラン: {customer.planType || "未設定"}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div style={styles.selectedBox}>
              <div style={styles.selectedLabel}>選択中の顧客</div>
              <div style={styles.selectedValue}>
                {selectedCustomerId ? `${selectedCustomerName}（ID: ${selectedCustomerId}）` : "未選択"}
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>回数券登録</h2>

            <div style={styles.formGrid}>
              <div style={styles.fullWidth}>
                <label style={styles.label}>回数券メニュー</label>
                <select
                  value={selectedTicketName}
                  onChange={(e) => setSelectedTicketName(e.target.value)}
                  style={styles.input}
                >
                  <option value="">選択してください</option>
                  {TICKET_PRESETS.map((preset) => (
                    <option key={preset.ticketName} value={preset.ticketName}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>サービス種別</label>
                <input value={serviceType} readOnly style={styles.inputReadOnly} />
              </div>

              <div>
                <label style={styles.label}>購入日</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>総回数</label>
                <input
                  value={totalCount}
                  onChange={(e) => handleManualCountChange(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>1回単価</label>
                <input
                  value={unitPrice}
                  onChange={(e) => handleManualUnitPriceChange(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>使用回数</label>
                <input
                  value={usedCount}
                  onChange={(e) => setUsedCount(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>残回数</label>
                <input
                  value={remainingCount}
                  onChange={(e) => setRemainingCount(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>前受金額</label>
                <input
                  value={prepaidAmount}
                  onChange={(e) => setPrepaidAmount(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>前受残高</label>
                <input
                  value={prepaidBalance}
                  onChange={(e) => setPrepaidBalance(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div className="full">
                <label style={styles.label}>ステータス</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={styles.input}
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="closed">closed</option>
                </select>
              </div>
            </div>

            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>契約名</span>
                <strong>{selectedTicketName || "—"}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>顧客</span>
                <strong>{selectedCustomerName || "—"}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>前受金額</span>
                <strong>{yen(prepaidAmount)}</strong>
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={() => void handleCreateContract()}
                style={styles.primaryButton}
                disabled={saving}
              >
                {saving ? "登録中..." : "回数券購入を登録する"}
              </button>
            </div>
          </section>
        </div>

        <section style={styles.card}>
          <div style={styles.contractHeader}>
            <h2 style={styles.sectionTitle}>最近の回数券契約</h2>
            <button type="button" onClick={() => void loadContracts()} style={styles.linkButtonAsButton}>
              再読み込み
            </button>
          </div>

          {loadingContracts ? (
            <div style={styles.emptyBox}>読み込み中...</div>
          ) : contracts.length === 0 ? (
            <div style={styles.emptyBox}>契約データがありません。</div>
          ) : (
            <div style={styles.contractList}>
              {contracts.map((contract) => (
                <div key={String(contract.id)} style={styles.contractCard}>
                  <div style={styles.contractTitleRow}>
                    <div style={styles.contractTitle}>{contract.ticket_name}</div>
                    <div style={styles.statusBadge}>{contract.status}</div>
                  </div>
                  <div style={styles.contractMeta}>顧客ID: {contract.customer_id}</div>
                  <div style={styles.contractMeta}>種別: {contract.service_type}</div>
                  <div style={styles.contractMeta}>
                    回数: {contract.total_count} / 残回数: {contract.remaining_count}
                  </div>
                  <div style={styles.contractMeta}>
                    単価: {yen(contract.unit_price)} / 前受: {yen(contract.prepaid_amount)}
                  </div>
                  <div style={styles.contractMeta}>
                    前受残高: {yen(contract.prepaid_balance)}
                  </div>
                  <div style={styles.contractMeta}>
                    購入日: {formatDate(contract.start_date)} / 登録日: {formatDate(contract.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    padding: "24px 16px 60px",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gap: 20,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 14,
    background: "#fff",
    color: "#334155",
    border: "1px solid #e2e8f0",
  },
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 14,
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
  },
  linkButtonAsButton: {
    minHeight: 38,
    padding: "0 12px",
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 13,
    background: "#fff",
    color: "#334155",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
  },
  heroCard: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(255,255,255,0.96)",
    borderRadius: 22,
    padding: 24,
    boxShadow: "0 14px 30px rgba(15,23,42,0.05)",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.2em",
    color: "#94a3b8",
    fontWeight: 800,
    marginBottom: 8,
  },
  pageTitle: {
    margin: 0,
    fontSize: 30,
    color: "#0f172a",
    fontWeight: 900,
  },
  pageSub: {
    marginTop: 10,
    marginBottom: 0,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.7,
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 14,
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 14,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  card: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(255,255,255,0.96)",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 14px 30px rgba(15,23,42,0.05)",
  },
  sectionTitle: {
    margin: 0,
    marginBottom: 14,
    fontSize: 20,
    color: "#0f172a",
    fontWeight: 900,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    height: 44,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0f172a",
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
  },
  inputReadOnly: {
    width: "100%",
    boxSizing: "border-box",
    height: 44,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
  },
  searchList: {
    display: "grid",
    gap: 8,
    marginTop: 10,
    maxHeight: 380,
    overflowY: "auto",
  },
  searchItem: {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 14,
    padding: "12px 14px",
    textAlign: "left",
    cursor: "pointer",
  },
  searchItemActive: {
    border: "2px solid #111827",
    background: "#fff",
  },
  searchItemTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 4,
  },
  searchItemSub: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.6,
  },
  selectedBox: {
    marginTop: 14,
    borderRadius: 14,
    background: "#fff",
    border: "1px solid #e2e8f0",
    padding: 14,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    marginBottom: 6,
  },
  selectedValue: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  summaryBox: {
    marginTop: 16,
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: 14,
    display: "grid",
    gap: 8,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 14,
    color: "#334155",
  },
  buttonRow: {
    marginTop: 18,
    display: "flex",
    justifyContent: "flex-end",
  },
  primaryButton: {
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
  },
  contractHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  contractList: {
    display: "grid",
    gap: 12,
  },
  contractCard: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 16,
    padding: 14,
  },
  contractTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#e2e8f0",
    color: "#334155",
    fontSize: 12,
    fontWeight: 800,
  },
  contractMeta: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.7,
  },
  emptyBox: {
    minHeight: 120,
    borderRadius: 16,
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: 700,
    fontSize: 14,
    textAlign: "center",
    padding: 16,
  },
};