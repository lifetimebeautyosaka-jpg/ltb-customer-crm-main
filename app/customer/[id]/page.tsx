"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type CustomerRow = {
  id: number | string;
  name?: string | null;
  kana?: string | null;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  age?: number | string | null;
  birthday?: string | null;

  height?: number | string | null;
  weight?: number | string | null;
  bodyFat?: number | string | null;
  muscleMass?: number | string | null;
  visceralFat?: number | string | null;

  body_fat?: number | string | null;
  muscle_mass?: number | string | null;
  visceral_fat?: number | string | null;

  goal?: string | null;
  memo?: string | null;
  notes?: string | null;
  note?: string | null;
  purpose?: string | null;
  target?: string | null;

  planType?: string | null;
  planStyle?: string | null;
  monthlyCount?: number | string | null;
  usedCount?: number | string | null;
  carryOver?: number | string | null;
  remaining?: number | string | null;
  nextPayment?: string | null;
  lastVisitDate?: string | null;

  plan_type?: string | null;
  plan_style?: string | null;
  monthly_count?: number | string | null;
  used_count?: number | string | null;
  carry_over?: number | string | null;
  remaining_count?: number | string | null;
  next_payment_date?: string | null;
  last_visit_date?: string | null;

  price?: number | string | null;
  status?: string | null;
  ltv?: number | string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

type TrainingSessionRow = {
  id: string;
  customer_id: string;
  session_date: string | null;
  body_height?: number | null;
  body_weight?: number | null;
  body_fat?: number | null;
  muscle_mass?: number | null;
  visceral_fat?: number | null;
  summary?: string | null;
  next_task?: string | null;
  posture_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function displayValue(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function formatPrice(value?: number | string | null) {
  const n = toNumberOrNull(value);
  if (n == null) return "—";
  return `${n.toLocaleString("ja-JP")}円`;
}

function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

function pickNumberLike(...values: unknown[]): number | string | null {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value as number | string;
  }
  return null;
}

function normalizeCustomer(row: CustomerRow): CustomerRow {
  return {
    ...row,
    goal: pickText(row.goal, row.purpose, row.target),
    memo: pickText(row.memo, row.notes, row.note),

    bodyFat: pickNumberLike(row.bodyFat, row.body_fat),
    muscleMass: pickNumberLike(row.muscleMass, row.muscle_mass),
    visceralFat: pickNumberLike(row.visceralFat, row.visceral_fat),

    planType: pickText(row.planType, row.plan_type),
    planStyle: pickText(row.planStyle, row.plan_style),
    nextPayment: pickText(row.nextPayment, row.next_payment_date),
    lastVisitDate: pickText(row.lastVisitDate, row.last_visit_date),

    monthlyCount: pickNumberLike(row.monthlyCount, row.monthly_count),
    usedCount: pickNumberLike(row.usedCount, row.used_count),
    carryOver: pickNumberLike(row.carryOver, row.carry_over),
    remaining: pickNumberLike(row.remaining, row.remaining_count),
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const rawId = params?.id;
  const customerId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [latestSession, setLatestSession] = useState<TrainingSessionRow | null>(null);

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

    if (!customerId) {
      setLoading(false);
      setErrorMessage("顧客IDが取得できませんでした。");
      return;
    }

    void init();
  }, [mounted, customerId, router]);

  async function init() {
    if (!supabase) {
      setLoading(false);
      setErrorMessage("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const numericCustomerId = Number(customerId);
      const customerIdForQuery = Number.isNaN(numericCustomerId)
        ? customerId
        : numericCustomerId;

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerIdForQuery)
        .maybeSingle();

      if (customerError) {
        throw new Error(`顧客取得エラー: ${customerError.message}`);
      }

      if (!customerData) {
        throw new Error(`顧客データは見つかりませんでした。ID: ${customerId}`);
      }

      setCustomer(normalizeCustomer(customerData as CustomerRow));

      const { data: sessionData, error: sessionError } = await supabase
        .from("training_sessions")
        .select(`
          id,
          customer_id,
          session_date,
          body_height,
          body_weight,
          body_fat,
          muscle_mass,
          visceral_fat,
          summary,
          next_task,
          posture_note,
          created_at,
          updated_at
        `)
        .eq("customer_id", String(customerId))
        .order("session_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (sessionError) {
        throw new Error(`トレーニング履歴取得エラー: ${sessionError.message}`);
      }

      setLatestSession((sessionData?.[0] as TrainingSessionRow) || null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "読み込みに失敗しました。";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div style={pageStyle}>
      <div style={bgGlowA} />
      <div style={bgGlowB} />

      <div style={containerStyle}>
        <div style={topRowStyle}>
          <Link href="/customer" style={backLinkStyle}>
            ← 顧客一覧へ戻る
          </Link>
          <div style={eyebrowStyle}>CUSTOMER DETAIL</div>
        </div>

        {loading ? (
          <div style={loadingCardStyle}>読み込み中...</div>
        ) : errorMessage ? (
          <div style={errorBoxStyle}>{errorMessage}</div>
        ) : !customer ? (
          <div style={errorBoxStyle}>顧客データが見つかりませんでした。</div>
        ) : (
          <>
            <section style={heroCardStyle}>
              <div style={heroLeftStyle}>
                <div style={miniLabelStyle}>GYMUP CRM</div>
                <h1 style={titleStyle}>{customer.name || "顧客詳細"}</h1>
                <p style={descStyle}>
                  顧客情報・契約状況・最新のトレーニング記録を確認できます。
                </p>
              </div>

              <div style={heroButtonWrapStyle}>
                <Link href={`/customer/${customerId}/training`} style={primaryLinkButtonStyle}>
                  トレーニング履歴
                </Link>
                <Link href={`/customer/${customerId}/training?mode=new`} style={secondaryLinkButtonStyle}>
                  新規トレーニング入力
                </Link>
              </div>
            </section>

            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={panelMiniStyle}>PROFILE</div>
                  <h2 style={panelTitleStyle}>顧客情報</h2>
                </div>
              </div>

              <div style={infoGridStyle}>
                <InfoItem label="氏名" value={customer.name} />
                <InfoItem label="かな" value={customer.kana} />
                <InfoItem label="電話" value={customer.phone} />
                <InfoItem label="メール" value={customer.email} />
                <InfoItem label="性別" value={customer.gender} />
                <InfoItem label="年齢" value={displayValue(customer.age)} />
                <InfoItem label="誕生日" value={formatDate(customer.birthday)} />
                <InfoItem label="身長" value={displayValue(customer.height, "cm")} />
                <InfoItem label="現在の体重" value={displayValue(customer.weight, "kg")} />
                <InfoItem label="体脂肪率" value={displayValue(customer.bodyFat, "%")} />
                <InfoItem label="筋肉量" value={displayValue(customer.muscleMass, "kg")} />
                <InfoItem label="内臓脂肪" value={displayValue(customer.visceralFat)} />
                <InfoItem label="最終来店日" value={formatDate(customer.lastVisitDate)} />
                <InfoItem label="LTV" value={formatPrice(customer.ltv)} />
              </div>

              <div style={memoWrapStyle}>
                <div style={memoBlockStyle}>
                  <div style={memoLabelStyle}>目標</div>
                  <div style={memoValueStyle}>{customer.goal || "未設定"}</div>
                </div>

                <div style={memoBlockStyle}>
                  <div style={memoLabelStyle}>メモ</div>
                  <div style={memoValueStyle}>{customer.memo || "未設定"}</div>
                </div>
              </div>
            </section>

            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={panelMiniStyle}>CONTRACT</div>
                  <h2 style={panelTitleStyle}>契約・利用状況</h2>
                </div>
              </div>

              <div style={infoGridStyle}>
                <InfoItem label="プラン種類" value={customer.planType} />
                <InfoItem label="利用形態" value={customer.planStyle} />
                <InfoItem label="月回数" value={displayValue(customer.monthlyCount, "回")} />
                <InfoItem label="使用回数" value={displayValue(customer.usedCount, "回")} />
                <InfoItem label="繰越回数" value={displayValue(customer.carryOver, "回")} />
                <InfoItem label="残回数" value={displayValue(customer.remaining, "回")} />
                <InfoItem label="料金" value={formatPrice(customer.price)} />
                <InfoItem label="ステータス" value={customer.status} />
                <InfoItem label="次回支払日" value={formatDate(customer.nextPayment)} />
              </div>
            </section>

            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={panelMiniStyle}>LATEST TRAINING</div>
                  <h2 style={panelTitleStyle}>最新トレーニング記録</h2>
                </div>
                <Link href={`/customer/${customerId}/training`} style={miniActionLinkStyle}>
                  一覧を見る →
                </Link>
              </div>

              {!latestSession ? (
                <div style={emptyStyle}>まだトレーニング履歴がありません。</div>
              ) : (
                <div style={latestCardStyle}>
                  <div style={infoGridStyle}>
                    <InfoItem label="セッション日" value={formatDate(latestSession.session_date)} />
                    <InfoItem label="身長" value={displayValue(latestSession.body_height, "cm")} />
                    <InfoItem label="体重" value={displayValue(latestSession.body_weight, "kg")} />
                    <InfoItem label="体脂肪" value={displayValue(latestSession.body_fat, "%")} />
                    <InfoItem label="筋肉量" value={displayValue(latestSession.muscle_mass, "kg")} />
                    <InfoItem label="内臓脂肪" value={displayValue(latestSession.visceral_fat)} />
                    <InfoItem
                      label="更新日時"
                      value={formatDateTime(latestSession.updated_at || latestSession.created_at)}
                    />
                  </div>

                  <div style={memoWrapStyle}>
                    <div style={memoBlockStyle}>
                      <div style={memoLabelStyle}>総評</div>
                      <div style={memoValueStyle}>{latestSession.summary || "未入力"}</div>
                    </div>

                    <div style={memoBlockStyle}>
                      <div style={memoLabelStyle}>次回課題</div>
                      <div style={memoValueStyle}>{latestSession.next_task || "未入力"}</div>
                    </div>

                    <div style={memoBlockStyle}>
                      <div style={memoLabelStyle}>姿勢メモ</div>
                      <div style={memoValueStyle}>{latestSession.posture_note || "未入力"}</div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div style={infoCardStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #eef4ff 0%, #f8fbff 30%, #f3f7ff 65%, #eef2ff 100%)",
  position: "relative",
  overflow: "hidden",
};

const bgGlowA: CSSProperties = {
  position: "absolute",
  top: -140,
  left: -120,
  width: 420,
  height: 420,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(147,197,253,0.22) 0%, rgba(147,197,253,0) 72%)",
  pointerEvents: "none",
};

const bgGlowB: CSSProperties = {
  position: "absolute",
  right: -120,
  top: 80,
  width: 360,
  height: 360,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(196,181,253,0.18) 0%, rgba(196,181,253,0) 72%)",
  pointerEvents: "none",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 1180,
  margin: "0 auto",
  padding: "28px 18px 60px",
};

const topRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  color: "rgba(30,41,59,0.78)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(30,41,59,0.42)",
};

const loadingCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.75)",
  borderRadius: 24,
  padding: 24,
  color: "#0f172a",
  boxShadow: "0 18px 40px rgba(148,163,184,0.14)",
};

const heroCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.75)",
  borderRadius: 28,
  padding: "24px 22px",
  marginBottom: 20,
  boxShadow: "0 18px 40px rgba(148,163,184,0.14)",
  backdropFilter: "blur(10px)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};

const heroLeftStyle: CSSProperties = {
  flex: 1,
  minWidth: 260,
};

const miniLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  color: "rgba(30,41,59,0.48)",
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 42px)",
  lineHeight: 1.1,
  color: "#0f172a",
  fontWeight: 800,
};

const descStyle: CSSProperties = {
  margin: "12px 0 0",
  fontSize: 14,
  lineHeight: 1.8,
  color: "rgba(15,23,42,0.68)",
};

const heroButtonWrapStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const primaryLinkButtonStyle: CSSProperties = {
  minWidth: 150,
  height: 48,
  border: "none",
  borderRadius: 16,
  background: "linear-gradient(135deg, #ffffff, #eaf1ff)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(148,163,184,0.15)",
  padding: "0 18px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryLinkButtonStyle: CSSProperties = {
  minWidth: 170,
  height: 48,
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: 16,
  background: "rgba(255,255,255,0.84)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "0 18px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const errorBoxStyle: CSSProperties = {
  marginBottom: 20,
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(254,226,226,0.9)",
  border: "1px solid rgba(248,113,113,0.28)",
  color: "#b91c1c",
  fontSize: 14,
};

const panelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.52)",
  border: "1px solid rgba(255,255,255,0.76)",
  borderRadius: 26,
  padding: 20,
  boxShadow: "0 14px 34px rgba(148,163,184,0.12)",
  backdropFilter: "blur(10px)",
  marginBottom: 18,
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 16,
  flexWrap: "wrap",
};

const panelMiniStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.22em",
  color: "rgba(30,41,59,0.42)",
  marginBottom: 6,
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 700,
};

const miniActionLinkStyle: CSSProperties = {
  textDecoration: "none",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
};

const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const infoCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: "14px 14px 12px",
};

const infoLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(15,23,42,0.52)",
  marginBottom: 8,
};

const infoValueStyle: CSSProperties = {
  fontSize: 15,
  color: "#0f172a",
  fontWeight: 700,
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const memoWrapStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 16,
};

const memoBlockStyle: CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: "14px 16px",
};

const memoLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(15,23,42,0.52)",
  marginBottom: 8,
};

const memoValueStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.8,
  color: "#0f172a",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const latestCardStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const emptyStyle: CSSProperties = {
  padding: "14px 0",
  color: "rgba(15,23,42,0.62)",
  fontSize: 14,
};