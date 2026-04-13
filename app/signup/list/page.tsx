"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";

type SignupRow = {
  id: number | string;
  created_at: string | null;
  full_name: string | null;
  full_name_kana: string | null;
  gender: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  postal_code: string | null;
  address: string | null;
  store_name: string | null;
  plan_id: number | string | null;
  plan_name: string | null;
  monthly_price: number | null;
  visit_style: string | null;
  payment_method: string | null;
  trial_status: string | null;
  agree_terms: boolean | null;
  status: string | null;
  is_new_customer: boolean | null;
  memo: string | null;
};

type CustomerRow = {
  id: number | string;
  name: string | null;
  phone: string | null;
  email?: string | null;
};

type MonthlyContractRow = {
  id: number | string;
  customer_id: number | string;
  signup_id: number | string | null;
  course_name: string;
  plan_id: string | null;
  plan_name: string;
  monthly_price: number;
  payment_method: string;
  store_name: string | null;
  visit_style: string | null;
  start_date: string;
  billing_day: number;
  next_billing_date: string;
  contract_status: string;
  note: string | null;
  created_at: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUS_OPTIONS = [
  "未対応",
  "確認中",
  "顧客登録済",
  "売上登録待ち",
  "売上登録済",
  "契約作成済",
  "完了",
  "キャンセル",
];

function trimmed(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[‐-‒–—―ー－]/g, "-")
    .toLowerCase();
}

function normalizePhone(value?: string | null) {
  return String(value || "").replace(/[^\d]/g, "");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const h = `${d.getHours()}`.padStart(2, "0");
  const min = `${d.getMinutes()}`.padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

function formatYmd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatBillingMonth(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

function normalizePaymentMethodForSales(value?: string | null) {
  const v = trimmed(value);
  if (v === "現金" || v === "カード" || v === "銀行振込" || v === "その他") {
    return v;
  }
  if (v === "クレジットカード") return "カード";
  return "その他";
}

function normalizePaymentMethodForContract(value?: string | null) {
  const v = trimmed(value);
  if (
    v === "カード" ||
    v === "クレジットカード" ||
    v === "口座振替" ||
    v === "現金" ||
    v === "銀行振込" ||
    v === "店頭決済" ||
    v === "その他"
  ) {
    return v;
  }
  return "クレジットカード";
}

function detectServiceTypeFromSignup(signup: SignupRow): "ストレッチ" | "トレーニング" {
  const joined = `${trimmed(signup.plan_name)} ${trimmed(signup.visit_style)} ${trimmed(
    signup.memo
  )}`;
  if (joined.includes("ストレッチ")) return "ストレッチ";
  return "トレーニング";
}

function buildMenuName(signup: SignupRow) {
  const planName = trimmed(signup.plan_name);
  const visitStyle = trimmed(signup.visit_style);

  if (planName && visitStyle) return `${planName} / ${visitStyle}`;
  if (planName) return planName;
  if (visitStyle) return visitStyle;
  return "オンライン入会";
}

function buildSalesMemo(signup: SignupRow) {
  const lines = [
    "オンライン入会申請から作成",
    signup.memo ? `申請メモ: ${signup.memo}` : "",
    signup.visit_style ? `通い方: ${signup.visit_style}` : "",
    signup.trial_status ? `体験状況: ${signup.trial_status}` : "",
    signup.is_new_customer === true
      ? "新規区分: 新規"
      : signup.is_new_customer === false
      ? "新規区分: 既存"
      : "",
    signup.address ? `住所: ${signup.address}` : "",
    signup.birth_date ? `生年月日: ${signup.birth_date}` : "",
    signup.gender ? `性別: ${signup.gender}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

function buildContractNote(signup: SignupRow) {
  const lines = [
    "online_signups から月額契約作成",
    `signup_id: ${signup.id}`,
    signup.memo ? `申請メモ: ${signup.memo}` : "",
    signup.trial_status ? `体験状況: ${signup.trial_status}` : "",
    signup.full_name_kana ? `氏名カナ: ${signup.full_name_kana}` : "",
    signup.phone ? `電話番号: ${signup.phone}` : "",
    signup.email ? `メール: ${signup.email}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

function deriveCourseName(signup: SignupRow) {
  const planName = trimmed(signup.plan_name);

  if (planName.includes("ボディメイク")) return "ボディメイクコース";
  if (planName.includes("ストレッチ")) return "ストレッチコース";
  if (planName.includes("トレーニング")) return "トレーニングコース";
  if (planName.includes("ペア")) return "ペアコース";
  if (planName.includes("通い放題")) return "通い放題コース";
  return "月額コース";
}

function findExistingCustomer(signup: SignupRow, customers: CustomerRow[]) {
  const signupName = normalizeText(signup.full_name);
  const signupPhone = normalizePhone(signup.phone);
  const signupEmail = normalizeText(signup.email);

  const byPhone = customers.find((c) => {
    const phone = normalizePhone(c.phone);
    return !!signupPhone && !!phone && phone === signupPhone;
  });
  if (byPhone) return byPhone;

  const byNameExact = customers.find(
    (c) => normalizeText(c.name) === signupName && !!signupName
  );
  if (byNameExact) return byNameExact;

  const byNamePartial = customers.find((c) => {
    const candidate = normalizeText(c.name);
    return !!signupName && (candidate.includes(signupName) || signupName.includes(candidate));
  });
  if (byNamePartial) return byNamePartial;

  const byEmail = customers.find(
    (c) => normalizeText(c.email) === signupEmail && !!signupEmail
  );
  if (byEmail) return byEmail;

  return null;
}

function findExistingContract(signup: SignupRow, contracts: MonthlyContractRow[]) {
  return contracts.find((row) => String(row.signup_id) === String(signup.id)) || null;
}

export default function SignupListPage() {
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [contracts, setContracts] = useState<MonthlyContractRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [contractLoading, setContractLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string>("");

  useEffect(() => {
    setMounted(true);

    const isLoggedIn =
      localStorage.getItem("gymup_logged_in") || localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const mobile = windowWidth < 768;

  const fetchSignups = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("online_signups")
        .select(
          "id, created_at, full_name, full_name_kana, gender, birth_date, phone, email, postal_code, address, store_name, plan_id, plan_name, monthly_price, visit_style, payment_method, trial_status, agree_terms, status, is_new_customer, memo"
        )
        .order("created_at", { ascending: false });

      if (error) {
        alert(`入会申請取得エラー: ${error.message}`);
        setSignups([]);
        return;
      }

      setSignups((data as SignupRow[] | null) || []);
    } catch (error) {
      console.error("fetchSignups error:", error);
      setSignups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setCustomerLoading(true);

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email")
        .order("name", { ascending: true });

      if (error) {
        console.warn("customers fetch error:", error.message);
        setCustomers([]);
        return;
      }

      setCustomers((data as CustomerRow[] | null) || []);
    } catch (error) {
      console.error("fetchCustomers error:", error);
      setCustomers([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      setContractLoading(true);

      const { data, error } = await supabase
        .from("monthly_contracts")
        .select(
          "id, customer_id, signup_id, course_name, plan_id, plan_name, monthly_price, payment_method, store_name, visit_style, start_date, billing_day, next_billing_date, contract_status, note, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("contracts fetch error:", error.message);
        setContracts([]);
        return;
      }

      setContracts((data as MonthlyContractRow[] | null) || []);
    } catch (error) {
      console.error("fetchContracts error:", error);
      setContracts([]);
    } finally {
      setContractLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    void fetchSignups();
    void fetchCustomers();
    void fetchContracts();
  }, [mounted]);

  const filteredSignups = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return signups;

    return signups.filter((row) => {
      return (
        trimmed(row.full_name).toLowerCase().includes(keyword) ||
        trimmed(row.full_name_kana).toLowerCase().includes(keyword) ||
        trimmed(row.phone).toLowerCase().includes(keyword) ||
        trimmed(row.email).toLowerCase().includes(keyword) ||
        trimmed(row.store_name).toLowerCase().includes(keyword) ||
        trimmed(row.plan_name).toLowerCase().includes(keyword) ||
        trimmed(row.status).toLowerCase().includes(keyword) ||
        trimmed(row.memo).toLowerCase().includes(keyword)
      );
    });
  }, [signups, search]);

  const statusCounts = useMemo(() => {
    const grouped: Record<string, number> = {};
    signups.forEach((row) => {
      const key = trimmed(row.status) || "未設定";
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return grouped;
  }, [signups]);

  const contractCounts = useMemo(() => {
    return {
      total: contracts.length,
      active: contracts.filter((c) => c.contract_status === "有効").length,
    };
  }, [contracts]);

  const handleChangeStatus = async (signupId: string | number, nextStatus: string) => {
    try {
      setSavingId(String(signupId));

      const { error } = await supabase
        .from("online_signups")
        .update({ status: nextStatus })
        .eq("id", signupId);

      if (error) {
        throw new Error(error.message);
      }

      setSignups((prev) =>
        prev.map((row) =>
          String(row.id) === String(signupId) ? { ...row, status: nextStatus } : row
        )
      );
    } catch (error) {
      console.error("handleChangeStatus error:", error);
      alert(error instanceof Error ? error.message : "ステータス更新に失敗しました");
    } finally {
      setSavingId("");
    }
  };

  const handleRegisterCustomer = async (signup: SignupRow) => {
    const existing = findExistingCustomer(signup, customers);

    if (existing) {
      alert(`すでに顧客登録済みの可能性があります: ${existing.name || "顧客名未設定"}`);
      return;
    }

    const fullName = trimmed(signup.full_name);
    if (!fullName) {
      alert("氏名がないため顧客登録できません");
      return;
    }

    try {
      setSavingId(String(signup.id));

      const payload: Record<string, unknown> = {
        name: fullName,
        phone: trimmed(signup.phone) || null,
        email: trimmed(signup.email) || null,
        memo: buildSalesMemo(signup) || null,
      };

      const { error: insertError } = await supabase.from("customers").insert([payload]);

      if (insertError) {
        throw new Error(`顧客登録エラー: ${insertError.message}`);
      }

      const { error: statusError } = await supabase
        .from("online_signups")
        .update({ status: "顧客登録済" })
        .eq("id", signup.id);

      if (statusError) {
        throw new Error(`申請ステータス更新エラー: ${statusError.message}`);
      }

      alert("customers に登録しました");
      await fetchCustomers();
      await fetchSignups();
    } catch (error) {
      console.error("handleRegisterCustomer error:", error);
      alert(error instanceof Error ? error.message : "顧客登録に失敗しました");
    } finally {
      setSavingId("");
    }
  };

  const goToSales = async (signup: SignupRow) => {
    try {
      setSavingId(String(signup.id));

      const existing = findExistingCustomer(signup, customers);
      const serviceType = detectServiceTypeFromSignup(signup);
      const menu = buildMenuName(signup);
      const memo = buildSalesMemo(signup);
      const paymentMethod = normalizePaymentMethodForSales(signup.payment_method);
      const amount = Number(signup.monthly_price || 0);

      const params = new URLSearchParams();

      params.set("from", "signup");
      params.set("signup_id", String(signup.id));
      params.set("customer_name", trimmed(signup.full_name));
      params.set("customer_kana", trimmed(signup.full_name_kana));
      params.set("phone", trimmed(signup.phone));
      params.set("email", trimmed(signup.email));
      params.set("store_name", trimmed(signup.store_name) || "未設定");
      params.set("menu_type", serviceType);
      params.set("menu", menu);
      params.set("payment_method", paymentMethod);
      params.set("amount", String(amount > 0 ? amount : ""));
      params.set("sale_type", "前受金");
      params.set("memo", memo);

      if (existing?.id !== null && existing?.id !== undefined) {
        params.set("customer_id", String(existing.id));
      }

      const { error: statusError } = await supabase
        .from("online_signups")
        .update({ status: "売上登録待ち" })
        .eq("id", signup.id);

      if (statusError) {
        throw new Error(`申請ステータス更新エラー: ${statusError.message}`);
      }

      window.location.href = `/sales?${params.toString()}`;
    } catch (error) {
      console.error("goToSales error:", error);
      alert(error instanceof Error ? error.message : "売上ページへの遷移に失敗しました");
    } finally {
      setSavingId("");
    }
  };

  const handleCreateContract = async (signup: SignupRow) => {
    const existingContract = findExistingContract(signup, contracts);
    if (existingContract) {
      alert("この申込はすでに月額契約作成済みです");
      return;
    }

    const fullName = trimmed(signup.full_name);
    if (!fullName) {
      alert("氏名がないため契約作成できません");
      return;
    }

    try {
      setSavingId(String(signup.id));

      let customer = findExistingCustomer(signup, customers);

      if (!customer) {
        const customerPayload: Record<string, unknown> = {
          name: fullName,
          phone: trimmed(signup.phone) || null,
          email: trimmed(signup.email) || null,
          memo: buildSalesMemo(signup) || null,
        };

        const { data: insertedCustomer, error: insertCustomerError } = await supabase
          .from("customers")
          .insert([customerPayload])
          .select("id, name, phone, email")
          .single();

        if (insertCustomerError) {
          throw new Error(`顧客自動作成エラー: ${insertCustomerError.message}`);
        }

        customer = insertedCustomer as CustomerRow;
      }

      const today = new Date();
      const startDate = formatYmd(today);
      const billingDay = Math.min(today.getDate(), 28);
      const nextBillingDate = startDate;
      const billingMonth = formatBillingMonth(today);

      const courseName = deriveCourseName(signup);
      const contractNote = buildContractNote(signup);
      const paymentMethod = normalizePaymentMethodForContract(signup.payment_method);

      const contractPayload = {
        customer_id: Number(customer.id),
        signup_id: Number(signup.id),
        course_name: courseName,
        plan_id: trimmed(signup.plan_id) || null,
        plan_name: trimmed(signup.plan_name) || courseName,
        monthly_price: Number(signup.monthly_price || 0),
        payment_method: paymentMethod,
        store_name: trimmed(signup.store_name) || null,
        visit_style: trimmed(signup.visit_style) || null,
        start_date: startDate,
        billing_day: billingDay,
        next_billing_date: nextBillingDate,
        contract_status: "有効",
        note: contractNote || null,
      };

      const { data: insertedContract, error: insertContractError } = await supabase
        .from("monthly_contracts")
        .insert([contractPayload])
        .select(
          "id, customer_id, signup_id, course_name, plan_id, plan_name, monthly_price, payment_method, store_name, visit_style, start_date, billing_day, next_billing_date, contract_status, note, created_at"
        )
        .single();

      if (insertContractError) {
        throw new Error(`月額契約作成エラー: ${insertContractError.message}`);
      }

      const contractId = insertedContract?.id;
      if (!contractId) {
        throw new Error("月額契約IDの取得に失敗しました");
      }

      const billingPayload = {
        contract_id: Number(contractId),
        customer_id: Number(customer.id),
        billing_month: billingMonth,
        billing_date: startDate,
        due_date: startDate,
        amount: Number(signup.monthly_price || 0),
        payment_method: paymentMethod,
        billing_status: "請求予定",
        note: `初回請求 / signup_id: ${signup.id}`,
      };

      const { error: insertBillingError } = await supabase
        .from("monthly_billings")
        .insert([billingPayload]);

      if (insertBillingError) {
        await supabase.from("monthly_contracts").delete().eq("id", contractId);
        throw new Error(`初回請求作成エラー: ${insertBillingError.message}`);
      }

      const { error: statusError } = await supabase
        .from("online_signups")
        .update({ status: "契約作成済" })
        .eq("id", signup.id);

      if (statusError) {
        throw new Error(`申請ステータス更新エラー: ${statusError.message}`);
      }

      alert("月額契約と初回請求を作成しました");
      await fetchCustomers();
      await fetchContracts();
      await fetchSignups();
    } catch (error) {
      console.error("handleCreateContract error:", error);
      alert(error instanceof Error ? error.message : "契約作成に失敗しました");
    } finally {
      setSavingId("");
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
    maxWidth: "1520px",
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
    padding: "11px 16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
  };

  const secondaryButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
  };

  const successButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "linear-gradient(135deg, #166534 0%, #16a34a 100%)",
  };

  const warningButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
  };

  const violetButtonStyle: CSSProperties = {
    ...primaryButtonStyle,
    background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)",
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

  const statGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: mobile
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(6, minmax(0, 1fr))",
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

  const tableWrapStyle: CSSProperties = {
    width: "100%",
    overflowX: "auto",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "#fff",
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    minWidth: "1680px",
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
              <h1 style={titleStyle}>オンライン入会申請一覧</h1>
              <p style={subTextStyle}>
                online_signups 一覧 / customers登録 / sales連携 / 月額契約作成
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/" style={linkButtonStyle}>
                TOPへ
              </Link>
              <Link href="/signup" style={linkButtonStyle}>
                入会ページへ
              </Link>
              <Link href="/sales" style={linkButtonStyle}>
                売上管理へ
              </Link>
              <Link href="/accounting" style={linkButtonStyle}>
                会計管理へ
              </Link>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={statGridStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>総件数</div>
              <div style={statValueStyle}>{signups.length}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>未対応</div>
              <div style={statValueStyle}>{statusCounts["未対応"] || 0}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>顧客登録済</div>
              <div style={statValueStyle}>{statusCounts["顧客登録済"] || 0}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>売上登録待ち</div>
              <div style={statValueStyle}>{statusCounts["売上登録待ち"] || 0}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>契約作成済</div>
              <div style={statValueStyle}>{statusCounts["契約作成済"] || 0}件</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>有効契約</div>
              <div style={statValueStyle}>
                {contractLoading ? "..." : `${contractCounts.active}件`}
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: "12px",
              flexDirection: mobile ? "column" : "row",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>申請一覧</h2>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="氏名・電話・メール・店舗・プランで検索"
              style={{ ...inputStyle, maxWidth: mobile ? "100%" : "360px" }}
            />
          </div>

          <div style={{ marginTop: "16px", ...tableWrapStyle }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>申請日時</th>
                  <th style={thStyle}>氏名</th>
                  <th style={thStyle}>カナ</th>
                  <th style={thStyle}>電話</th>
                  <th style={thStyle}>メール</th>
                  <th style={thStyle}>店舗</th>
                  <th style={thStyle}>プラン</th>
                  <th style={thStyle}>月額</th>
                  <th style={thStyle}>支払方法</th>
                  <th style={thStyle}>新規</th>
                  <th style={thStyle}>ステータス</th>
                  <th style={thStyle}>契約状態</th>
                  <th style={thStyle}>メモ</th>
                  <th style={thStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={tdStyle} colSpan={14}>
                      読み込み中...
                    </td>
                  </tr>
                ) : filteredSignups.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={14}>
                      データがありません
                    </td>
                  </tr>
                ) : (
                  filteredSignups.map((signup) => {
                    const existingCustomer = findExistingCustomer(signup, customers);
                    const existingContract = findExistingContract(signup, contracts);
                    const isBusy = savingId === String(signup.id);

                    return (
                      <tr key={String(signup.id)}>
                        <td style={tdStyle}>{formatDateTime(signup.created_at)}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 800 }}>{trimmed(signup.full_name) || "—"}</div>
                          {existingCustomer && (
                            <div style={{ marginTop: "6px" }}>
                              <span style={pillStyle("#dcfce7", "#166534")}>
                                顧客一致あり
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>{trimmed(signup.full_name_kana) || "—"}</td>
                        <td style={tdStyle}>{trimmed(signup.phone) || "—"}</td>
                        <td style={tdStyle}>{trimmed(signup.email) || "—"}</td>
                        <td style={tdStyle}>{trimmed(signup.store_name) || "—"}</td>
                        <td style={tdStyle}>
                          <div>{trimmed(signup.plan_name) || "—"}</div>
                          <div style={{ marginTop: "6px", color: "#6b7280", fontSize: "12px" }}>
                            {trimmed(signup.visit_style) || "—"}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          {signup.monthly_price !== null && signup.monthly_price !== undefined
                            ? `¥${Number(signup.monthly_price).toLocaleString()}`
                            : "—"}
                        </td>
                        <td style={tdStyle}>{trimmed(signup.payment_method) || "—"}</td>
                        <td style={tdStyle}>
                          {signup.is_new_customer === true ? (
                            <span style={pillStyle("#ede9fe", "#6d28d9")}>新規</span>
                          ) : signup.is_new_customer === false ? (
                            <span style={pillStyle("#f3f4f6", "#374151")}>既存</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={tdStyle}>
                          <select
                            value={trimmed(signup.status) || "未対応"}
                            onChange={(e) => handleChangeStatus(signup.id, e.target.value)}
                            style={{ ...inputStyle, minWidth: "150px", padding: "10px 12px" }}
                            disabled={isBusy}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={tdStyle}>
                          {existingContract ? (
                            <div style={{ display: "grid", gap: "6px" }}>
                              <span
                                style={pillStyle(
                                  existingContract.contract_status === "有効"
                                    ? "#dcfce7"
                                    : "#f3f4f6",
                                  existingContract.contract_status === "有効"
                                    ? "#166534"
                                    : "#374151"
                                )}
                              >
                                {existingContract.contract_status}
                              </span>
                              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                次回: {existingContract.next_billing_date || "—"}
                              </div>
                            </div>
                          ) : (
                            <span style={pillStyle("#fef3c7", "#92400e")}>未作成</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: "pre-wrap", minWidth: "220px" }}>
                          {trimmed(signup.memo) || "—"}
                        </td>
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              minWidth: "210px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleRegisterCustomer(signup)}
                              disabled={isBusy}
                              style={{
                                ...(existingCustomer ? secondaryButtonStyle : successButtonStyle),
                                opacity: isBusy ? 0.7 : 1,
                              }}
                            >
                              {existingCustomer ? "顧客一致あり" : "customers登録"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCreateContract(signup)}
                              disabled={isBusy || !!existingContract}
                              style={{
                                ...(existingContract ? secondaryButtonStyle : violetButtonStyle),
                                opacity: isBusy || existingContract ? 0.7 : 1,
                              }}
                            >
                              {existingContract ? "契約作成済み" : "月額契約作成"}
                            </button>

                            <button
                              type="button"
                              onClick={() => goToSales(signup)}
                              disabled={isBusy}
                              style={{
                                ...warningButtonStyle,
                                opacity: isBusy ? 0.7 : 1,
                              }}
                            >
                              売上登録へ
                            </button>
                          </div>
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