"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CustomerRow = {
  id: number | string;
  name: string | null;
  phone: string | null;
  email: string | null;
  memo?: string | null;
};

type ContractStatus = "有効" | "停止" | "休会" | "解約";
type BillingStatus = "請求予定" | "決済済" | "未払い" | "失敗" | "キャンセル";
type PaymentMethod =
  | "カード"
  | "クレジットカード"
  | "口座振替"
  | "現金"
  | "銀行振込"
  | "店頭決済"
  | "その他";

type MonthlyContractRow = {
  id: number | string;
  customer_id: number | string;
  signup_id: number | string | null;
  course_name: string;
  plan_id: string | null;
  plan_name: string;
  monthly_price: number;
  payment_method: PaymentMethod;
  store_name: string | null;
  visit_style: string | null;
  start_date: string;
  billing_day: number;
  next_billing_date: string;
  contract_status: ContractStatus;
  end_date: string | null;
  cancel_requested_at: string | null;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type MonthlyBillingRow = {
  id: number | string;
  contract_id: number | string;
  customer_id: number | string;
  billing_month: string;
  billing_date: string;
  due_date: string | null;
  amount: number;
  payment_method: PaymentMethod;
  billing_status: BillingStatus;
  paid_at: string | null;
  sales_id: number | string | null;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ContractForm = {
  course_name: string;
  plan_id: string;
  plan_name: string;
  monthly_price: string;
  payment_method: PaymentMethod;
  store_name: string;
  visit_style: string;
  start_date: string;
  billing_day: string;
  contract_status: ContractStatus;
  note: string;
};

function trimmed(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateJP(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}/${`${d.getMonth() + 1}`.padStart(2, "0")}/${`${d.getDate()}`.padStart(2, "0")}`;
}

function formatCurrency(value: number) {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

function buildBillingMonth(dateString: string) {
  return dateString.slice(0, 7);
}

function buildNextBillingDate(startDate: string, billingDay: number) {
  const base = new Date(startDate);
  if (Number.isNaN(base.getTime())) return startDate;

  const year = base.getFullYear();
  const month = base.getMonth();
  const next = new Date(year, month + 1, Math.min(billingDay, 28));
  const y = next.getFullYear();
  const m = `${next.getMonth() + 1}`.padStart(2, "0");
  const d = `${next.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CustomerSubscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = String(params?.id || "");

  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [contracts, setContracts] = useState<MonthlyContractRow[]>([]);
  const [billings, setBillings] = useState<MonthlyBillingRow[]>([]);

  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [loadingBillings, setLoadingBillings] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ContractForm>({
    course_name: "ボディメイクコース",
    plan_id: "bodymake_monthly",
    plan_name: "ボディメイク月額コース",
    monthly_price: "36000",
    payment_method: "クレジットカード",
    store_name: "江戸堀",
    visit_style: "マンツーマン",
    start_date: todayString(),
    billing_day: `${Math.min(new Date().getDate(), 28)}`,
    contract_status: "有効",
    note: "",
  });

  useEffect(() => {
    setMounted(true);

    const isLoggedIn =
      localStorage.getItem("gymup_logged_in") || localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }
  }, []);

  const fetchCustomer = async () => {
    try {
      setLoadingCustomer(true);

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email, memo")
        .eq("id", Number(customerId))
        .maybeSingle();

      if (error) {
        alert(`顧客取得エラー: ${error.message}`);
        setCustomer(null);
        return;
      }

      setCustomer((data as CustomerRow | null) || null);
    } catch (error) {
      console.error("fetchCustomer error:", error);
      setCustomer(null);
    } finally {
      setLoadingCustomer(false);
    }
  };

  const fetchContracts = async () => {
    try {
      setLoadingContracts(true);

      const { data, error } = await supabase
        .from("monthly_contracts")
        .select(
          "id, customer_id, signup_id, course_name, plan_id, plan_name, monthly_price, payment_method, store_name, visit_style, start_date, billing_day, next_billing_date, contract_status, end_date, cancel_requested_at, note, created_at, updated_at"
        )
        .eq("customer_id", Number(customerId))
        .order("created_at", { ascending: false });

      if (error) {
        alert(`契約取得エラー: ${error.message}`);
        setContracts([]);
        return;
      }

      setContracts((data as MonthlyContractRow[] | null) || []);
    } catch (error) {
      console.error("fetchContracts error:", error);
      setContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  };

  const fetchBillings = async () => {
    try {
      setLoadingBillings(true);

      const { data, error } = await supabase
        .from("monthly_billings")
        .select(
          "id, contract_id, customer_id, billing_month, billing_date, due_date, amount, payment_method, billing_status, paid_at, sales_id, note, created_at, updated_at"
        )
        .eq("customer_id", Number(customerId))
        .order("billing_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        alert(`請求取得エラー: ${error.message}`);
        setBillings([]);
        return;
      }

      setBillings((data as MonthlyBillingRow[] | null) || []);
    } catch (error) {
      console.error("fetchBillings error:", error);
      setBillings([]);
    } finally {
      setLoadingBillings(false);
    }
  };

  useEffect(() => {
    if (!mounted || !customerId) return;
    void fetchCustomer();
    void fetchContracts();
    void fetchBillings();
  }, [mounted, customerId]);

  const contractMap = useMemo(() => {
    const map = new Map<string, MonthlyContractRow>();
    contracts.forEach((row) => map.set(String(row.id), row));
    return map;
  }, [contracts]);

  const activeContracts = useMemo(() => {
    return contracts.filter((c) => c.contract_status === "有効");
  }, [contracts]);

  const totalActiveMonthlyAmount = useMemo(() => {
    return activeContracts.reduce((sum, row) => sum + Number(row.monthly_price || 0), 0);
  }, [activeContracts]);

  const unpaidBillings = useMemo(() => {
    return billings.filter((b) => b.billing_status === "未払い");
  }, [billings]);

  const totalUnpaidAmount = useMemo(() => {
    return unpaidBillings.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [unpaidBillings]);

  const updateForm = <K extends keyof ContractForm>(key: K, value: ContractForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateContract = async () => {
    if (!customer) {
      alert("顧客情報が見つかりません");
      return;
    }

    if (!trimmed(form.course_name)) {
      alert("コース名を入力してください");
      return;
    }

    if (!trimmed(form.plan_name)) {
      alert("プラン名を入力してください");
      return;
    }

    if (!form.monthly_price || Number(form.monthly_price) <= 0) {
      alert("月額料金を入力してください");
      return;
    }

    if (!form.start_date) {
      alert("開始日を入力してください");
      return;
    }

    if (!form.billing_day || Number(form.billing_day) < 1 || Number(form.billing_day) > 28) {
      alert("課金日は1〜28で入力してください");
      return;
    }

    try {
      setSaving(true);

      const billingDay = Number(form.billing_day);
      const startDate = form.start_date;
      const nextBillingDate = startDate;
      const firstBillingMonth = buildBillingMonth(startDate);

      const contractPayload = {
        customer_id: Number(customer.id),
        signup_id: null,
        course_name: trimmed(form.course_name),
        plan_id: trimmed(form.plan_id) || null,
        plan_name: trimmed(form.plan_name),
        monthly_price: Number(form.monthly_price),
        payment_method: form.payment_method,
        store_name: trimmed(form.store_name) || null,
        visit_style: trimmed(form.visit_style) || null,
        start_date: startDate,
        billing_day: billingDay,
        next_billing_date: nextBillingDate,
        contract_status: form.contract_status,
        note: trimmed(form.note) || null,
      };

      const { data: insertedContract, error: contractError } = await supabase
        .from("monthly_contracts")
        .insert([contractPayload])
        .select(
          "id, customer_id, signup_id, course_name, plan_id, plan_name, monthly_price, payment_method, store_name, visit_style, start_date, billing_day, next_billing_date, contract_status, end_date, cancel_requested_at, note, created_at, updated_at"
        )
        .single();

      if (contractError) {
        throw new Error(`契約作成エラー: ${contractError.message}`);
      }

      const contractId = insertedContract?.id;
      if (!contractId) {
        throw new Error("契約IDの取得に失敗しました");
      }

      const billingPayload = {
        contract_id: Number(contractId),
        customer_id: Number(customer.id),
        billing_month: firstBillingMonth,
        billing_date: startDate,
        due_date: startDate,
        amount: Number(form.monthly_price),
        payment_method: form.payment_method,
        billing_status: "請求予定",
        note: `顧客詳細から初回請求作成 / customer_id: ${customer.id}`,
      };

      const { error: billingError } = await supabase
        .from("monthly_billings")
        .insert([billingPayload]);

      if (billingError) {
        await supabase.from("monthly_contracts").delete().eq("id", contractId);
        throw new Error(`初回請求作成エラー: ${billingError.message}`);
      }

      const previewNextDate = buildNextBillingDate(startDate, billingDay);

      const { error: updateContractError } = await supabase
        .from("monthly_contracts")
        .update({
          next_billing_date: previewNextDate,
        })
        .eq("id", Number(contractId));

      if (updateContractError) {
        throw new Error(`次回請求日更新エラー: ${updateContractError.message}`);
      }

      alert("月額契約と初回請求を作成しました");

      setForm((prev) => ({
        ...prev,
        note: "",
        start_date: todayString(),
        billing_day: `${Math.min(new Date().getDate(), 28)}`,
      }));

      await fetchContracts();
      await fetchBillings();
    } catch (error) {
      console.error("handleCreateContract error:", error);
      alert(error instanceof Error ? error.message : "契約作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f7f7f8 0%, #eceef1 45%, #e7eaef 100%)",
    padding: mobile ? "16px" : "24px",
    color: "#111827",
  };

  const innerStyle: CSSProperties = {
    maxWidth: "1480px",
    margin: "0 auto",
    display: "grid",
    gap: "18px",
  };

  const cardStyle: CSSProperties = {
    background: "rgba(255,255,255,0.84)",
    border: "1px solid rgba(255,255,255,0.9)",
    borderRadius: "24px",
    padding: mobile ? "16px" : "20px",
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(12px)",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: mobile ? "stretch" : "center",
    gap: "12px",
    flexDirection: mobile ? "column" : "row",
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: mobile ? "26px" : "34px",
    fontWeight: 800,
    letterSpacing: "0.02em",
  };

  const subTextStyle: CSSProperties = {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#6b7280",
  };

  const linkButtonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 16px",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
  };

  const primaryButtonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  };

  const textareaStyle: CSSProperties = {
    ...inputStyle,
    minHeight: "110px",
    resize: "vertical",
    lineHeight: 1.6,
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#6b7280",
    marginBottom: "7px",
  };

  const miniTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
  };

  const statGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: mobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
    gap: "12px",
  };

  const statCardStyle: CSSProperties = {
    borderRadius: "20px",
    padding: "16px",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
  };

  const statLabelStyle: CSSProperties = {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: 700,
    marginBottom: "8px",
  };

  const statValueStyle: CSSProperties = {
    fontSize: mobile ? "16px" : "22px",
    fontWeight: 800,
  };

  const formGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: mobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  };

  const tableWrapStyle: CSSProperties = {
    width: "100%",
    overflowX: "auto",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "#fff",
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    minWidth: "1240px",
    borderCollapse: "collapse",
    fontSize: "14px",
  };

  const thStyle: CSSProperties = {
    textAlign: "left",
    padding: "13px 14px",
    fontWeight: 800,
    color: "#374151",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };

  const tdStyle: CSSProperties = {
    padding: "13px 14px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  };

  const pillStyle = (bg: string, color = "#111827"): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: bg,
    color,
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  });

  if (!mounted) return null;

  return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <section style={cardStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>月額契約追加</h1>
              <p style={subTextStyle}>既存顧客から月額契約を作成し、初回請求まで作成します</p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={linkButtonStyle}
              >
                戻る
              </button>
              <Link href={`/customer/${customerId}`} style={linkButtonStyle}>
                顧客詳細へ
              </Link>
              <Link href="/accounting" style={linkButtonStyle}>
                会計管理へ
              </Link>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={miniTitleStyle}>顧客情報</h2>
          <div style={{ marginTop: "14px", ...statGridStyle }}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>顧客名</div>
              <div style={statValueStyle}>
                {loadingCustomer ? "..." : customer?.name || "未設定"}
              </div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>電話番号</div>
              <div style={statValueStyle}>
                {loadingCustomer ? "..." : customer?.phone || "—"}
              </div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>メール</div>
              <div style={statValueStyle}>
                {loadingCustomer ? "..." : customer?.email || "—"}
              </div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>顧客ID</div>
              <div style={statValueStyle}>{customerId}</div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={statGridStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>契約数</div>
              <div style={statValueStyle}>{contracts.length}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>有効契約</div>
              <div style={statValueStyle}>{activeContracts.length}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>有効月額合計</div>
              <div style={statValueStyle}>{formatCurrency(totalActiveMonthlyAmount)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>未払い合計</div>
              <div style={statValueStyle}>{formatCurrency(totalUnpaidAmount)}</div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={miniTitleStyle}>月額契約を追加</h2>

          <div style={{ marginTop: "16px", ...formGridStyle }}>
            <div>
              <label style={labelStyle}>コース名</label>
              <input
                value={form.course_name}
                onChange={(e) => updateForm("course_name", e.target.value)}
                placeholder="例：ボディメイクコース"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>プランID</label>
              <input
                value={form.plan_id}
                onChange={(e) => updateForm("plan_id", e.target.value)}
                placeholder="例：bodymake_monthly"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>プラン名</label>
              <input
                value={form.plan_name}
                onChange={(e) => updateForm("plan_name", e.target.value)}
                placeholder="例：ボディメイク月額コース"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>月額料金</label>
              <input
                inputMode="numeric"
                value={form.monthly_price}
                onChange={(e) => updateForm("monthly_price", e.target.value)}
                placeholder="例：36000"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>支払方法</label>
              <select
                value={form.payment_method}
                onChange={(e) => updateForm("payment_method", e.target.value as PaymentMethod)}
                style={inputStyle}
              >
                <option value="クレジットカード">クレジットカード</option>
                <option value="カード">カード</option>
                <option value="口座振替">口座振替</option>
                <option value="現金">現金</option>
                <option value="銀行振込">銀行振込</option>
                <option value="店頭決済">店頭決済</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>店舗</label>
              <input
                value={form.store_name}
                onChange={(e) => updateForm("store_name", e.target.value)}
                placeholder="例：江戸堀"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>利用形態</label>
              <select
                value={form.visit_style}
                onChange={(e) => updateForm("visit_style", e.target.value)}
                style={inputStyle}
              >
                <option value="マンツーマン">マンツーマン</option>
                <option value="ペア">ペア</option>
                <option value="未定">未定</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>契約開始日</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => updateForm("start_date", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>課金日（1〜28）</label>
              <input
                inputMode="numeric"
                value={form.billing_day}
                onChange={(e) => updateForm("billing_day", e.target.value)}
                placeholder="例：5"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>契約状態</label>
              <select
                value={form.contract_status}
                onChange={(e) => updateForm("contract_status", e.target.value as ContractStatus)}
                style={inputStyle}
              >
                <option value="有効">有効</option>
                <option value="停止">停止</option>
                <option value="休会">休会</option>
                <option value="解約">解約</option>
              </select>
            </div>

            <div style={{ gridColumn: mobile ? "auto" : "1 / -1" }}>
              <label style={labelStyle}>備考</label>
              <textarea
                value={form.note}
                onChange={(e) => updateForm("note", e.target.value)}
                placeholder="例：店頭でカード登録済み / 初月説明済み"
                style={textareaStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: "18px" }}>
            <button
              type="button"
              onClick={handleCreateContract}
              disabled={saving}
              style={{
                ...primaryButtonStyle,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "作成中..." : "月額契約と初回請求を作成"}
            </button>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={miniTitleStyle}>既存契約一覧</h2>

          <div style={{ marginTop: "14px", ...tableWrapStyle }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>コース</th>
                  <th style={thStyle}>プラン</th>
                  <th style={thStyle}>月額</th>
                  <th style={thStyle}>支払方法</th>
                  <th style={thStyle}>店舗</th>
                  <th style={thStyle}>開始日</th>
                  <th style={thStyle}>課金日</th>
                  <th style={thStyle}>次回請求日</th>
                  <th style={thStyle}>状態</th>
                  <th style={thStyle}>備考</th>
                </tr>
              </thead>
              <tbody>
                {loadingContracts ? (
                  <tr>
                    <td style={tdStyle} colSpan={10}>
                      読み込み中...
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={10}>
                      契約はまだありません
                    </td>
                  </tr>
                ) : (
                  contracts.map((row) => (
                    <tr key={String(row.id)}>
                      <td style={tdStyle}>{row.course_name}</td>
                      <td style={tdStyle}>{row.plan_name}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>
                        {formatCurrency(row.monthly_price)}
                      </td>
                      <td style={tdStyle}>{row.payment_method}</td>
                      <td style={tdStyle}>{trimmed(row.store_name) || "—"}</td>
                      <td style={tdStyle}>{formatDateJP(row.start_date)}</td>
                      <td style={tdStyle}>{row.billing_day}日</td>
                      <td style={tdStyle}>{formatDateJP(row.next_billing_date)}</td>
                      <td style={tdStyle}>
                        <span
                          style={pillStyle(
                            row.contract_status === "有効" ? "#dcfce7" : "#f3f4f6",
                            row.contract_status === "有効" ? "#166534" : "#374151"
                          )}
                        >
                          {row.contract_status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: "pre-wrap" }}>
                        {row.note || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={miniTitleStyle}>請求一覧</h2>

          <div style={{ marginTop: "14px", ...tableWrapStyle }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>請求月</th>
                  <th style={thStyle}>契約</th>
                  <th style={thStyle}>請求日</th>
                  <th style={thStyle}>金額</th>
                  <th style={thStyle}>支払方法</th>
                  <th style={thStyle}>状態</th>
                  <th style={thStyle}>売上連携</th>
                  <th style={thStyle}>備考</th>
                </tr>
              </thead>
              <tbody>
                {loadingBillings ? (
                  <tr>
                    <td style={tdStyle} colSpan={8}>
                      読み込み中...
                    </td>
                  </tr>
                ) : billings.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={8}>
                      請求はまだありません
                    </td>
                  </tr>
                ) : (
                  billings.map((row) => {
                    const contract = contractMap.get(String(row.contract_id));
                    return (
                      <tr key={String(row.id)}>
                        <td style={tdStyle}>{row.billing_month}</td>
                        <td style={tdStyle}>
                          {contract?.plan_name || contract?.course_name || "未設定"}
                        </td>
                        <td style={tdStyle}>{formatDateJP(row.billing_date)}</td>
                        <td style={{ ...tdStyle, fontWeight: 800 }}>
                          {formatCurrency(row.amount)}
                        </td>
                        <td style={tdStyle}>{row.payment_method}</td>
                        <td style={tdStyle}>
                          <span
                            style={pillStyle(
                              row.billing_status === "決済済"
                                ? "#dcfce7"
                                : row.billing_status === "未払い"
                                ? "#fee2e2"
                                : row.billing_status === "請求予定"
                                ? "#dbeafe"
                                : "#f3f4f6",
                              row.billing_status === "決済済"
                                ? "#166534"
                                : row.billing_status === "未払い"
                                ? "#991b1b"
                                : row.billing_status === "請求予定"
                                ? "#1d4ed8"
                                : "#374151"
                            )}
                          >
                            {row.billing_status}
                          </span>
                        </td>
                        <td style={tdStyle}>{row.sales_id ? `sales:${row.sales_id}` : "未連携"}</td>
                        <td style={{ ...tdStyle, whiteSpace: "pre-wrap" }}>
                          {row.note || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}