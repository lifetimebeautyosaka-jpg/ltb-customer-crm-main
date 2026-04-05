"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { BG, GLASS, CARD, BUTTON_PRIMARY } from "../../../styles/theme";

type Customer = {
  id: string;
  name?: string;
  kana?: string;
  gender?: string;
  age?: number | string;
  phone?: string;
  email?: string;
  birthday?: string;
  goal?: string;
  memo?: string;
  planType?: string;
  planStyle?: string;
  monthlyCount?: number;
  usedCount?: number;
  carryOver?: number;
  remaining?: number;
  price?: number;
  status?: string;
  nextPayment?: string;
  lastVisitAt?: string;
  created_at?: string;
  updated_at?: string;
  height?: number | string;
  weight?: number | string;
  bodyFat?: number | string;
  muscleMass?: number | string;
  visceralFat?: number | string;
  ltv?: number | null;
};

type TrainingSet = {
  id?: string;
  row_id?: string | null;
  row_order?: number | null;
  category?: string | null;
  exercise_name?: string | null;
  set_count?: number | null;
  reps?: string | null;
  weight?: string | null;
  seconds?: string | null;
  memo?: string | null;
};

type TrainingSession = {
  id: string;
  customer_id: string;
  session_date: string | null;
  body_weight: number | null;
  summary: string | null;
  next_task: string | null;
  posture_note: string | null;
  stretch_menu: string[] | null;
  posture_image_urls: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  training_sets?: TrainingSet[];
};

type SaleItem = {
  id: string | number;
  customer_id?: string | number | null;
  customer_name?: string | null;
  sale_date?: string | null;
  menu_type?: string | null;
  sale_type?: string | null;
  payment_method?: string | null;
  amount?: number | null;
  staff_name?: string | null;
  store_name?: string | null;
  reservation_id?: number | null;
  memo?: string | null;
  created_at?: string | null;
};

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

function toStyle(value: unknown): CSSProperties {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as CSSProperties;
  }
  if (typeof value === "string" && value.trim()) {
    return { background: value };
  }
  return {};
}

const BG_STYLE = toStyle(BG);
const GLASS_STYLE = toStyle(GLASS);
const CARD_STYLE = toStyle(CARD);
const BUTTON_PRIMARY_STYLE = toStyle(BUTTON_PRIMARY);

const miniLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 6,
};

const valueTextStyle: CSSProperties = {
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.6,
};

function formatDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("ja-JP");
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString("ja-JP");
}

function formatCurrency(value?: number | string | null) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return "—";
  return `¥${num.toLocaleString()}`;
}

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function parseLocalStorageJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getCustomerFromLocalStorage(customerId: string): Customer | null {
  if (typeof window === "undefined") return null;

  const keys = [
    "gymup_customers",
    "customers",
    "gymup_customer_list",
    "customer_list",
  ];

  for (const key of keys) {
    const list = parseLocalStorageJson<Customer[]>(key);
    if (Array.isArray(list)) {
      const found = list.find((item) => String(item.id) === String(customerId));
      if (found) return found;
    }
  }

  const detailKeys = [
    `customer-${customerId}`,
    `gymup_customer_${customerId}`,
    `customer_detail_${customerId}`,
  ];

  for (const key of detailKeys) {
    const detail = parseLocalStorageJson<Customer>(key);
    if (detail) {
      return {
        ...detail,
        id: customerId,
      };
    }
  }

  return null;
}

function getSummaryExercises(session: TrainingSession) {
  return safeArray(session.training_sets)
    .map((set) => set.exercise_name?.trim())
    .filter(Boolean) as string[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = String(params?.id ?? "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [error, setError] = useState("");
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loggedIn = localStorage.getItem("gymup_logged_in");
    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }

    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, customerId]);

  useEffect(() => {
    const copied = searchParams.get("copied");
    if (copied) {
      setCopiedNotice(true);
      const timer = setTimeout(() => setCopiedNotice(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const localCustomer = getCustomerFromLocalStorage(customerId);
      if (localCustomer) {
        setCustomer(localCustomer);
      }

      if (!supabase) {
        setSessions([]);
        setSales([]);
        return;
      }

      const [customerRes, sessionRes, salesRes] = await Promise.all([
        supabase.from("customers").select("*").eq("id", customerId).maybeSingle(),
        supabase
          .from("training_sessions")
          .select(
            `
            *,
            training_sets (
              id,
              row_id,
              row_order,
              category,
              exercise_name,
              set_count,
              reps,
              weight,
              seconds,
              memo
            )
          `
          )
          .eq("customer_id", customerId)
          .order("session_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("sales")
          .select(
            "id, customer_id, customer_name, sale_date, menu_type, sale_type, payment_method, amount, staff_name, store_name, reservation_id, memo, created_at"
          )
          .eq("customer_id", customerId)
          .order("sale_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (customerRes.error) {
        console.error(customerRes.error);
      } else if (customerRes.data) {
        setCustomer((prev) => ({
          ...(prev ?? { id: customerId }),
          ...customerRes.data,
        }));
      }

      if (sessionRes.error) {
        throw sessionRes.error;
      }

      if (salesRes.error) {
        throw salesRes.error;
      }

      setSessions((sessionRes.data as TrainingSession[]) ?? []);
      setSales((salesRes.data as SaleItem[]) ?? []);
    } catch (e) {
      console.error(e);
      setError("顧客情報・トレーニング履歴・売上履歴の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const latestSession = useMemo(() => {
    return sessions.length > 0 ? sessions[0] : null;
  }, [sessions]);

  const latestWeight = useMemo(() => {
    const found = sessions.find(
      (item) => item.body_weight !== null && item.body_weight !== undefined
    );
    return found?.body_weight ?? customer?.weight ?? "—";
  }, [sessions, customer]);

  const usageSummary = useMemo(() => {
    const monthlyCount = Number(customer?.monthlyCount ?? 0);
    const usedCount = Number(customer?.usedCount ?? 0);
    const carryOver = Number(customer?.carryOver ?? 0);
    const remaining =
      customer?.remaining !== undefined && customer?.remaining !== null
        ? Number(customer.remaining)
        : Math.max(monthlyCount + carryOver - usedCount, 0);

    return {
      monthlyCount,
      usedCount,
      carryOver,
      remaining,
    };
  }, [customer]);

  const salesSummary = useMemo(() => {
    const total = sales.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const latest = sales[0];
    return {
      count: sales.length,
      total,
      latestDate: latest?.sale_date || null,
    };
  }, [sales]);

  const displayLtv = useMemo(() => {
    if (customer?.ltv !== undefined && customer?.ltv !== null) {
      return Number(customer.ltv) || 0;
    }
    return salesSummary.total;
  }, [customer?.ltv, salesSummary.total]);

  if (!mounted) return null;

  return (
    <main
      style={{
        ...BG_STYLE,
        minHeight: "100vh",
        padding: "24px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            ...GLASS_STYLE,
            padding: 20,
            borderRadius: 24,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  color: "#64748b",
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                CUSTOMER DETAIL
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  lineHeight: 1.3,
                  color: "#0f172a",
                }}
              >
                顧客詳細
              </h1>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#475569",
                  fontSize: 14,
                }}
              >
                顧客情報・契約状況・トレーニング履歴・売上履歴を確認できます
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/customer" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(255,255,255,0.78)",
                    color: "#0f172a",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  顧客一覧へ戻る
                </button>
              </Link>

              <Link
                href={`/customer/${customerId}/training`}
                style={{ textDecoration: "none" }}
              >
                <button style={BUTTON_PRIMARY_STYLE}>トレーニング開始</button>
              </Link>
            </div>
          </div>
        </div>

        {copiedNotice && (
          <div
            style={{
              ...CARD_STYLE,
              marginBottom: 16,
              borderRadius: 20,
              padding: 16,
              color: "#065f46",
              background:
                "linear-gradient(135deg, rgba(236,253,245,0.95), rgba(220,252,231,0.88))",
              border: "1px solid rgba(16,185,129,0.22)",
            }}
          >
            履歴をコピーしてトレーニングページを開きました。
          </div>
        )}

        {error && (
          <div
            style={{
              ...CARD_STYLE,
              marginBottom: 16,
              borderRadius: 20,
              padding: 16,
              color: "#991b1b",
              background:
                "linear-gradient(135deg, rgba(254,242,242,0.95), rgba(254,226,226,0.9))",
              border: "1px solid rgba(239,68,68,0.18)",
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div style={{ ...CARD_STYLE, padding: 18, borderRadius: 24 }}>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              顧客情報
            </div>
            <h2 style={{ margin: "0 0 12px", fontSize: 24, color: "#0f172a" }}>
              {customer?.name ? `${customer.name}様` : "名前未登録"}
            </h2>
            <div style={{ display: "grid", gap: 8, color: "#334155", fontSize: 14 }}>
              <div>かな：{customer?.kana || "—"}</div>
              <div>電話：{customer?.phone || "—"}</div>
              <div>メール：{customer?.email || "—"}</div>
              <div>性別：{customer?.gender || "—"}</div>
              <div>年齢：{customer?.age || "—"}</div>
              <div>誕生日：{formatDate(customer?.birthday)}</div>
              <div>身長：{customer?.height || "—"}</div>
              <div>現在の体重：{customer?.weight || "—"}</div>
              <div>体脂肪率：{customer?.bodyFat || "—"}</div>
              <div>筋肉量：{customer?.muscleMass || "—"}</div>
              <div>内臓脂肪：{customer?.visceralFat || "—"}</div>
              <div>最終来店日：{formatDate(customer?.lastVisitAt)}</div>
              <div>LTV：{formatCurrency(displayLtv)}</div>
              <div>目標：{customer?.goal || "未設定"}</div>
              <div>メモ：{customer?.memo || "未設定"}</div>
            </div>
          </div>

          <div style={{ ...CARD_STYLE, padding: 18, borderRadius: 24 }}>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              契約・利用状況
            </div>
            <div style={{ display: "grid", gap: 8, color: "#334155", fontSize: 14 }}>
              <div>プラン種類：{customer?.planType || "—"}</div>
              <div>利用形態：{customer?.planStyle || "—"}</div>
              <div>月回数：{usageSummary.monthlyCount || "—"}</div>
              <div>使用回数：{usageSummary.usedCount || "—"}</div>
              <div>繰越：{usageSummary.carryOver || "—"}</div>
              <div>残回数：{usageSummary.remaining || "—"}</div>
              <div>料金：{customer?.price ? formatCurrency(customer.price) : "0円"}</div>
              <div>状態：{customer?.status || "—"}</div>
              <div>次回支払い日：{formatDate(customer?.nextPayment)}</div>
            </div>
          </div>

          <div style={{ ...CARD_STYLE, padding: 18, borderRadius: 24 }}>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              トレーニングサマリー
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  label: "前回トレーニング日",
                  value: formatDate(latestSession?.session_date),
                },
                {
                  label: "最終体重",
                  value: latestWeight === "—" ? "—" : `${latestWeight} kg`,
                },
                {
                  label: "履歴件数",
                  value: `${sessions.length}件`,
                },
                {
                  label: "最終更新",
                  value: formatDateTime(
                    latestSession?.updated_at || latestSession?.created_at
                  ),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,0.66)",
                    border: "1px solid rgba(148,163,184,0.18)",
                    borderRadius: 18,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginBottom: 6,
                      fontWeight: 700,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
              <Link
                href={`/customer/${customerId}/training`}
                style={{ textDecoration: "none" }}
              >
                <button style={BUTTON_PRIMARY_STYLE}>トレーニング開始</button>
              </Link>

              <Link
                href={`/customer/${customerId}/training#history`}
                style={{ textDecoration: "none" }}
              >
                <button
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(255,255,255,0.78)",
                    color: "#0f172a",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  履歴を見る
                </button>
              </Link>
            </div>
          </div>

          <div style={{ ...CARD_STYLE, padding: 18, borderRadius: 24 }}>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              売上サマリー
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  label: "売上件数",
                  value: `${salesSummary.count}件`,
                },
                {
                  label: "累計売上",
                  value: formatCurrency(salesSummary.total),
                },
                {
                  label: "最終支払日",
                  value: formatDate(salesSummary.latestDate),
                },
                {
                  label: "表示状態",
                  value: salesSummary.count > 0 ? "反映中" : "未登録",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,0.66)",
                    border: "1px solid rgba(148,163,184,0.18)",
                    borderRadius: 18,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginBottom: 6,
                      fontWeight: 700,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
              <Link href="/sales" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(255,255,255,0.78)",
                    color: "#0f172a",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  売上管理へ
                </button>
              </Link>
            </div>
          </div>
        </section>

        <section style={{ ...CARD_STYLE, borderRadius: 28, padding: 22, marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                SALES HISTORY
              </div>
              <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>
                売上履歴
              </h2>
            </div>

            <Link href="/sales" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(255,255,255,0.78)",
                  color: "#0f172a",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                売上管理へ
              </button>
            </Link>
          </div>

          {loading ? (
            <div style={{ color: "#475569", padding: "12px 0" }}>読み込み中です...</div>
          ) : sales.length === 0 ? (
            <div
              style={{
                borderRadius: 20,
                padding: 18,
                background: "rgba(255,255,255,0.62)",
                border: "1px solid rgba(148,163,184,0.16)",
                color: "#475569",
              }}
            >
              まだ売上履歴はありません。
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {sales.map((sale) => (
                <article
                  key={String(sale.id)}
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(148,163,184,0.18)",
                    borderRadius: 24,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 14,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#0f172a",
                          marginBottom: 6,
                        }}
                      >
                        {formatDate(sale.sale_date)}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 12,
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: "rgba(59,130,246,0.08)",
                            color: "#1d4ed8",
                            fontWeight: 700,
                          }}
                        >
                          金額：{formatCurrency(sale.amount)}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: "rgba(16,185,129,0.08)",
                            color: "#047857",
                            fontWeight: 700,
                          }}
                        >
                          支払方法：{sale.payment_method || "—"}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(15,23,42,0.06)",
                        color: "#334155",
                        fontWeight: 700,
                      }}
                    >
                      {sale.sale_type || "通常売上"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(248,250,252,0.92)",
                        border: "1px solid rgba(148,163,184,0.14)",
                        borderRadius: 18,
                        padding: 14,
                      }}
                    >
                      <div style={miniLabelStyle}>サービス区分</div>
                      <div style={valueTextStyle}>{sale.menu_type || "—"}</div>

                      <div style={{ ...miniLabelStyle, marginTop: 12 }}>担当者</div>
                      <div style={valueTextStyle}>{sale.staff_name || "—"}</div>

                      <div style={{ ...miniLabelStyle, marginTop: 12 }}>店舗</div>
                      <div style={valueTextStyle}>{sale.store_name || "—"}</div>
                    </div>

                    <div
                      style={{
                        background: "rgba(248,250,252,0.92)",
                        border: "1px solid rgba(148,163,184,0.14)",
                        borderRadius: 18,
                        padding: 14,
                      }}
                    >
                      <div style={miniLabelStyle}>予約ID</div>
                      <div style={valueTextStyle}>
                        {sale.reservation_id != null ? String(sale.reservation_id) : "—"}
                      </div>

                      <div style={{ ...miniLabelStyle, marginTop: 12 }}>メモ</div>
                      <div style={{ ...valueTextStyle, whiteSpace: "pre-wrap" }}>
                        {sale.memo || "未入力"}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={{ ...CARD_STYLE, borderRadius: 28, padding: 22 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                RECENT TRAINING COPY
              </div>
              <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>
                最近のトレーニング履歴からコピー
              </h2>
            </div>

            <Link
              href={`/customer/${customerId}/training#history`}
              style={{ textDecoration: "none" }}
            >
              <button
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(255,255,255,0.78)",
                  color: "#0f172a",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                履歴一覧へ
              </button>
            </Link>
          </div>

          {loading ? (
            <div style={{ color: "#475569", padding: "12px 0" }}>読み込み中です...</div>
          ) : sessions.length === 0 ? (
            <div
              style={{
                borderRadius: 20,
                padding: 18,
                background: "rgba(255,255,255,0.62)",
                border: "1px solid rgba(148,163,184,0.16)",
                color: "#475569",
              }}
            >
              まだトレーニング履歴はありません。
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {sessions.slice(0, 5).map((session) => {
                const exerciseNames = getSummaryExercises(session);
                const stretchMenu = safeArray(session.stretch_menu);
                const postureImages = safeArray(session.posture_image_urls);

                return (
                  <article
                    key={session.id}
                    style={{
                      background: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(148,163,184,0.18)",
                      borderRadius: 24,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 14,
                        flexWrap: "wrap",
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "#0f172a",
                            marginBottom: 6,
                          }}
                        >
                          {formatDate(session.session_date)}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 12,
                              background: "rgba(15,23,42,0.06)",
                              color: "#334155",
                              padding: "6px 10px",
                              borderRadius: 999,
                              fontWeight: 700,
                            }}
                          >
                            体重：{session.body_weight ? `${session.body_weight} kg` : "—"}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              background: "rgba(15,23,42,0.06)",
                              color: "#334155",
                              padding: "6px 10px",
                              borderRadius: 999,
                              fontWeight: 700,
                            }}
                          >
                            種目数：{exerciseNames.length}件
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link
                          href={`/customer/${customerId}/training?copyFrom=${session.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <button style={BUTTON_PRIMARY_STYLE}>この履歴をコピー</button>
                        </Link>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(248,250,252,0.92)",
                          border: "1px solid rgba(148,163,184,0.14)",
                          borderRadius: 18,
                          padding: 14,
                        }}
                      >
                        <div style={miniLabelStyle}>種目一覧</div>

                        {exerciseNames.length > 0 ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {exerciseNames.map((name, idx) => (
                              <span
                                key={`${session.id}-${name}-${idx}`}
                                style={{
                                  fontSize: 12,
                                  padding: "7px 10px",
                                  borderRadius: 999,
                                  background: "rgba(59,130,246,0.08)",
                                  color: "#1d4ed8",
                                  fontWeight: 700,
                                }}
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: "#64748b", fontSize: 14 }}>未登録</div>
                        )}

                        {stretchMenu.length > 0 && (
                          <>
                            <div style={{ ...miniLabelStyle, marginTop: 12 }}>
                              ストレッチ項目
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {stretchMenu.map((item, idx) => (
                                <span
                                  key={`${session.id}-stretch-${idx}`}
                                  style={{
                                    fontSize: 12,
                                    padding: "7px 10px",
                                    borderRadius: 999,
                                    background: "rgba(16,185,129,0.08)",
                                    color: "#047857",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <div
                        style={{
                          background: "rgba(248,250,252,0.92)",
                          border: "1px solid rgba(148,163,184,0.14)",
                          borderRadius: 18,
                          padding: 14,
                        }}
                      >
                        <div style={miniLabelStyle}>総評</div>
                        <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                          {session.summary || "未入力"}
                        </div>

                        <div style={{ ...miniLabelStyle, marginTop: 14 }}>次回課題</div>
                        <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                          {session.next_task || "未入力"}
                        </div>

                        <div style={{ ...miniLabelStyle, marginTop: 14 }}>姿勢メモ</div>
                        <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                          {session.posture_note || "未入力"}
                        </div>
                      </div>
                    </div>

                    {postureImages.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div style={miniLabelStyle}>姿勢画像</div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 12,
                          }}
                        >
                          {postureImages.map((url, idx) => (
                            <a
                              key={`${session.id}-image-${idx}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ textDecoration: "none" }}
                            >
                              <img
                                src={url}
                                alt={`姿勢画像 ${idx + 1}`}
                                style={{
                                  width: "100%",
                                  height: 180,
                                  objectFit: "cover",
                                  borderRadius: 18,
                                  border: "1px solid rgba(148,163,184,0.18)",
                                  background: "#fff",
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}