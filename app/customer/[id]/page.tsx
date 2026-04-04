"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Customer = {
  id: number | string;
  name?: string;
  kana?: string;
  gender?: string;
  age?: number | string;
  phone?: string;
  email?: string;
  height?: number | string;
  weight?: number | string;
  bodyFat?: number | string;
  muscleMass?: number | string;
  visceralFat?: number | string;
  goal?: string;
  memo?: string;
  notes?: string;
  planType?: string;
  planStyle?: string;
  price?: number | string;
  monthlyCount?: number | string;
  usedCount?: number | string;
  carryOver?: number | string;
  remaining?: number | string;
  status?: string;
  nextPayment?: string;
  lastVisitDate?: string;
  ltv?: number | string;
  [key: string]: any;
};

type TrainingHistoryItem = {
  id: string;
  date: string | null;
  weight: number | null;
  summary: string | null;
  next_task: string | null;
  template_name: string | null;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default function CustomerDetailPage() {
  const params = useParams();
  const rawId = params?.id;

  const id = useMemo(() => {
    if (Array.isArray(rawId)) return String(rawId[0]);
    return String(rawId || "");
  }, [rawId]);

  const numericId = useMemo(() => {
    const n = Number(id);
    return Number.isNaN(n) ? null : n;
  }, [id]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [latestTrainingDate, setLatestTrainingDate] = useState("");
  const [latestTrainingWeight, setLatestTrainingWeight] = useState("");
  const [latestTrainingId, setLatestTrainingId] = useState("");
  const [loadingTrainingSummary, setLoadingTrainingSummary] = useState(false);
  const [recentTrainingHistory, setRecentTrainingHistory] = useState<
    TrainingHistoryItem[]
  >([]);

  useEffect(() => {
    setMounted(true);

    const loggedIn =
      localStorage.getItem("gymup_logged_in") ||
      localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }
  }, []);

  useEffect(() => {
    if (!mounted || !id) return;
    fetchCustomer();
  }, [mounted, id]);

  useEffect(() => {
    if (!mounted || !numericId) return;
    fetchTrainingSummaryAndHistory(numericId);
  }, [mounted, numericId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      let foundCustomer: Customer | null = null;

      // 1) Supabase customers テーブルを優先
      if (supabase && numericId != null) {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", numericId)
          .maybeSingle();

        if (!error && data) {
          foundCustomer = data as Customer;
        }
      }

      // 2) localStorage fallback
      if (!foundCustomer) {
        const detailRaw = localStorage.getItem(`customer-${id}`);
        if (detailRaw) {
          try {
            const parsed = JSON.parse(detailRaw);
            foundCustomer = {
              id,
              ...parsed,
            };
          } catch {}
        }
      }

      // 3) customers 配列 fallback
      if (!foundCustomer) {
        const customersRaw = localStorage.getItem("customers");
        if (customersRaw) {
          try {
            const parsed = JSON.parse(customersRaw);
            if (Array.isArray(parsed)) {
              const matched = parsed.find(
                (item: any) =>
                  String(item?.id) === String(id) ||
                  String(item?.customerId) === String(id)
              );
              if (matched) {
                foundCustomer = matched;
              }
            }
          } catch {}
        }
      }

      if (!foundCustomer) {
        setErrorMessage("顧客情報が見つかりませんでした。");
        setCustomer(null);
        return;
      }

      setCustomer(foundCustomer);
    } catch (error: any) {
      setErrorMessage(error?.message || "顧客情報の取得に失敗しました。");
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingSummaryAndHistory = async (customerId: number) => {
    if (!supabase) return;

    try {
      setLoadingTrainingSummary(true);

      const { data, error } = await supabase
        .from("training_sessions")
        .select("id, date, weight, summary, next_task, template_name, created_at")
        .eq("customer_id", customerId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      const rows = (data || []) as TrainingHistoryItem[];

      const latest = rows[0];
      setLatestTrainingId(latest?.id ? String(latest.id) : "");
      setLatestTrainingDate(latest?.date ? String(latest.date) : "");
      setLatestTrainingWeight(
        latest?.weight != null ? `${latest.weight}kg` : ""
      );
      setRecentTrainingHistory(rows);
    } catch (e) {
      console.error("トレーニング情報取得失敗:", e);
      setRecentTrainingHistory([]);
    } finally {
      setLoadingTrainingSummary(false);
    }
  };

  const displayName =
    customer?.name ||
    customer?.customer_name ||
    customer?.full_name ||
    customer?.nickname ||
    "顧客名未設定";

  const displayGoal = customer?.goal || customer?.purpose || customer?.target || "";
  const displayMemo = customer?.memo || customer?.notes || customer?.note || "";

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8f8f7 0%, #f3efe9 45%, #f8f8f7 100%)",
        padding: "24px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <Link
          href="/customer"
          style={{
            display: "inline-block",
            textDecoration: "none",
            color: "#6b7280",
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          ← 顧客一覧へ戻る
        </Link>

        <div
          style={{
            background: "#ffffffcc",
            backdropFilter: "blur(8px)",
            border: "1px solid #ece7df",
            borderRadius: 24,
            padding: "24px 20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.16em",
              color: "#8b5e3c",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            CUSTOMER DETAIL
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
              lineHeight: 1.3,
              color: "#111827",
            }}
          >
            {displayName}
          </h1>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            顧客ID: {id || "-"}
          </p>
        </div>

        {errorMessage ? (
          <div
            style={{
              marginBottom: 16,
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 14,
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #ece7df",
              borderRadius: 20,
              padding: 24,
              color: "#6b7280",
            }}
          >
            読み込み中...
          </div>
        ) : customer ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr",
                gap: 20,
              }}
            >
              <section
                style={{
                  background: "#fff",
                  border: "1px solid #ece7df",
                  borderRadius: 24,
                  padding: 20,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                }}
              >
                <SectionTitle>顧客情報</SectionTitle>

                <div style={infoGridStyle}>
                  <InfoCard label="氏名" value={displayName} />
                  <InfoCard label="フリガナ" value={customer.kana} />
                  <InfoCard label="性別" value={customer.gender} />
                  <InfoCard label="年齢" value={customer.age} />
                  <InfoCard label="電話番号" value={customer.phone} />
                  <InfoCard label="メール" value={customer.email} />
                  <InfoCard label="身長" value={withUnit(customer.height, "cm")} />
                  <InfoCard
                    label="現在体重"
                    value={withUnit(customer.weight, "kg")}
                  />
                  <InfoCard
                    label="体脂肪率"
                    value={withUnit(customer.bodyFat, "%")}
                  />
                  <InfoCard
                    label="筋肉量"
                    value={withUnit(customer.muscleMass, "kg")}
                  />
                  <InfoCard
                    label="内臓脂肪"
                    value={customer.visceralFat}
                  />
                  <InfoCard label="最終来店日" value={customer.lastVisitDate} />
                  <InfoCard label="LTV" value={yen(customer.ltv)} />
                </div>

                <div style={{ marginTop: 18 }}>
                  <MiniLabel>目標・目的</MiniLabel>
                  <MemoBox>{displayGoal || "未設定"}</MemoBox>
                </div>

                <div style={{ marginTop: 14 }}>
                  <MiniLabel>メモ</MiniLabel>
                  <MemoBox>{displayMemo || "未設定"}</MemoBox>
                </div>
              </section>

              <section
                style={{
                  background: "#fff",
                  border: "1px solid #ece7df",
                  borderRadius: 24,
                  padding: 20,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                }}
              >
                <SectionTitle>契約・利用状況</SectionTitle>

                <div style={infoGridStyle}>
                  <InfoCard label="プラン種別" value={customer.planType} />
                  <InfoCard label="利用形態" value={customer.planStyle} />
                  <InfoCard label="月額料金" value={yen(customer.price)} />
                  <InfoCard label="月回数" value={customer.monthlyCount} />
                  <InfoCard label="使用回数" value={customer.usedCount} />
                  <InfoCard label="繰越" value={customer.carryOver} />
                  <InfoCard label="残回数" value={customer.remaining} />
                  <InfoCard label="契約状態" value={customer.status} />
                  <InfoCard label="次回支払日" value={customer.nextPayment} />
                </div>
              </section>
            </div>

            <section
              style={{
                marginTop: 20,
                background: "#fff",
                border: "1px solid #ece7df",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <SectionTitle>トレーニングサマリー</SectionTitle>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <InfoCard
                  label="前回トレーニング日"
                  value={
                    loadingTrainingSummary
                      ? "読込中..."
                      : latestTrainingDate || "未登録"
                  }
                />
                <InfoCard
                  label="最終体重"
                  value={
                    loadingTrainingSummary
                      ? "読込中..."
                      : latestTrainingWeight || "未登録"
                  }
                />
                <InfoCard
                  label="履歴件数"
                  value={
                    loadingTrainingSummary
                      ? "読込中..."
                      : recentTrainingHistory.length || 0
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                <Link
                  href={`/customer/${id}/training`}
                  style={{ textDecoration: "none" }}
                >
                  <ActionButton primary>トレーニング開始</ActionButton>
                </Link>

                <Link
                  href={`/customer/${id}/training`}
                  style={{ textDecoration: "none" }}
                >
                  <ActionButton>履歴を見る</ActionButton>
                </Link>

                <Link
                  href={
                    latestTrainingId
                      ? `/customer/${id}/training?copy=${latestTrainingId}`
                      : `/customer/${id}/training`
                  }
                  style={{ textDecoration: "none" }}
                >
                  <ActionButton soft>履歴からコピーして開始</ActionButton>
                </Link>
              </div>
            </section>

            <section
              style={{
                marginTop: 20,
                background: "#fff",
                border: "1px solid #ece7df",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <SectionTitle>最近のトレーニング履歴からコピー</SectionTitle>

              {loadingTrainingSummary ? (
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  読み込み中...
                </div>
              ) : recentTrainingHistory.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  まだトレーニング履歴はありません。
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {recentTrainingHistory.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 16,
                        padding: 16,
                        background: "#fafaf9",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              color: "#111827",
                              marginBottom: 6,
                            }}
                          >
                            {item.date || "日付未設定"}
                          </div>
                          <div style={{ fontSize: 13, color: "#6b7280" }}>
                            体重:{" "}
                            {item.weight != null ? `${item.weight}kg` : "-"}
                            {item.template_name
                              ? ` / テンプレ: ${item.template_name}`
                              : ""}
                          </div>
                        </div>

                        <Link
                          href={`/customer/${id}/training?copy=${item.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <ActionButton primary small>
                            この履歴をコピー
                          </ActionButton>
                        </Link>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <MiniLabel>総評</MiniLabel>
                        <MemoBox compact>{item.summary || "未設定"}</MemoBox>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <MiniLabel>次回課題</MiniLabel>
                        <MemoBox compact>{item.next_task || "未設定"}</MemoBox>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: 20,
        color: "#111827",
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: "#8b5e3c",
        fontWeight: 700,
        marginBottom: 6,
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </div>
  );
}

function MemoBox({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: compact ? 10 : 12,
        color: "#374151",
        fontSize: 14,
        whiteSpace: "pre-wrap",
        minHeight: compact ? 40 : 52,
      }}
    >
      {children}
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#faf7f3",
        border: "1px solid #eee4d8",
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#8b5e3c",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          color: "#111827",
          fontWeight: 700,
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {value || "未設定"}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  primary = false,
  soft = false,
  small = false,
}: {
  children: React.ReactNode;
  primary?: boolean;
  soft?: boolean;
  small?: boolean;
}) {
  const background = primary
    ? "linear-gradient(135deg, #8b5e3c 0%, #c49a6c 100%)"
    : soft
    ? "#faf6f2"
    : "#fff";

  const color = primary ? "#fff" : soft ? "#6f4e37" : "#374151";
  const border = primary ? "none" : soft ? "1px solid #d6c3b3" : "1px solid #e5e7eb";
  const boxShadow = primary ? "0 8px 18px rgba(139,94,60,0.22)" : "none";

  return (
    <button
      style={{
        width: "100%",
        padding: small ? "10px 14px" : "14px 16px",
        borderRadius: 14,
        border,
        background,
        color,
        fontWeight: 700,
        fontSize: small ? 14 : 15,
        cursor: "pointer",
        boxShadow,
      }}
    >
      {children}
    </button>
  );
}

function withUnit(value: any, unit: string) {
  if (value === null || value === undefined || value === "") return "";
  return `${value}${unit}`;
}

function yen(value: any) {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `¥${num.toLocaleString()}`;
}

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};