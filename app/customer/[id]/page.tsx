"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { BG, CARD, BUTTON_PRIMARY } from "../../../styles/theme";

type CustomerRow = {
  id: string | number;
  name?: string | null;
  customer_name?: string | null;
  kana?: string | null;
  furigana?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  email?: string | null;
  gender?: string | null;
  age?: number | null;
  birthday?: string | null;
  address?: string | null;
  memo?: string | null;
  goal?: string | null;
  goals?: string | null;
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

type NormalizedCustomer = {
  id: string;
  name: string;
  kana: string;
  phone: string;
  email: string;
  gender: string;
  age: string;
  birthday: string;
  address: string;
  goal: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
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
const CARD_STYLE = toStyle(CARD);
const BUTTON_PRIMARY_STYLE = toStyle(BUTTON_PRIMARY);

function toSafeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ja-JP");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP");
}

function formatMetric(value?: number | null, unit = "") {
  if (value === null || value === undefined) return "—";
  return `${value}${unit}`;
}

function normalizeCustomer(row: CustomerRow): NormalizedCustomer {
  return {
    id: String(row.id),
    name: row.name || row.customer_name || "—",
    kana: row.kana || row.furigana || "",
    phone: row.phone || row.phone_number || "",
    email: row.email || "",
    gender: row.gender || "",
    age:
      row.age !== null && row.age !== undefined ? String(row.age) : "",
    birthday: row.birthday || "",
    address: row.address || "",
    goal: row.goal || row.goals || "",
    memo: row.memo || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function calcDiff(
  latest?: number | null,
  previous?: number | null
): number | null {
  if (
    latest === null ||
    latest === undefined ||
    previous === null ||
    previous === undefined
  ) {
    return null;
  }
  return Number((latest - previous).toFixed(1));
}

function diffLabel(value: number | null, unit = "") {
  if (value === null) return "—";
  if (value > 0) return `+${value}${unit}`;
  return `${value}${unit}`;
}

function diffColor(value: number | null) {
  if (value === null) return "#64748b";
  if (value > 0) return "#dc2626";
  if (value < 0) return "#16a34a";
  return "#64748b";
}

function buildChartPoints(values: number[], width: number, height: number) {
  if (values.length === 0) return "";
  if (values.length === 1) {
    return `${width / 2},${height / 2}`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const customerId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState<NormalizedCustomer | null>(null);
  const [sessions, setSessions] = useState<TrainingSessionRow[]>([]);

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
      setError("顧客IDが取得できませんでした。顧客一覧から開き直してください。");
      return;
    }

    void loadData();
  }, [mounted, customerId, router]);

  async function loadData() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError) throw customerError;

      const { data: sessionData, error: sessionError } = await supabase
        .from("training_sessions")
        .select(
          `
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
        `
        )
        .eq("customer_id", String(customerId))
        .order("session_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (sessionError) throw sessionError;

      setCustomer(normalizeCustomer(customerData as CustomerRow));
      setSessions((sessionData as TrainingSessionRow[]) || []);
    } catch (e: any) {
      setError(e?.message || "データ取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const latestSession = useMemo(() => {
    if (sessions.length === 0) return null;
    return sessions[sessions.length - 1];
  }, [sessions]);

  const previousSession = useMemo(() => {
    if (sessions.length < 2) return null;
    return sessions[sessions.length - 2];
  }, [sessions]);

  const weightDiff = calcDiff(
    latestSession?.body_weight,
    previousSession?.body_weight
  );

  const muscleDiff = calcDiff(
    latestSession?.muscle_mass,
    previousSession?.muscle_mass
  );

  const chartSessions = useMemo(() => {
    return sessions.filter(
      (item) =>
        item.body_weight !== null &&
        item.body_weight !== undefined &&
        item.session_date
    );
  }, [sessions]);

  const chartValues = chartSessions
    .map((item) => item.body_weight)
    .filter((v): v is number => v !== null && v !== undefined);

  const chartPoints = buildChartPoints(chartValues, 520, 180);

  if (!mounted) return null;

  if (loading) {
    return (
      <main
        style={{
          ...BG_STYLE,
          minHeight: "100vh",
          padding: "24px 16px 80px",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ ...CARD_STYLE, borderRadius: 24, padding: 24 }}>
            読み込み中...
          </div>
        </div>
      </main>
    );
  }

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
            ...CARD_STYLE,
            borderRadius: 24,
            padding: 20,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
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
              <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>
                顧客詳細
              </h1>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => router.push("/customer")}
                style={secondaryButtonStyle}
              >
                顧客一覧へ戻る
              </button>

              <Link
                href={`/customer/${customerId}/training`}
                style={{
                  ...buttonLinkStyle,
                  ...BUTTON_PRIMARY_STYLE,
                }}
              >
                トレーニング履歴へ
              </Link>
            </div>
          </div>
        </div>

        {error ? (
          <div style={{ ...alertErrorStyle, marginBottom: 16 }}>{error}</div>
        ) : null}

        <div style={{ display: "grid", gap: 18 }}>
          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}>
            <h2 style={sectionTitleStyle}>基本情報</h2>

            <div style={infoGridStyle}>
              <InfoItem label="氏名" value={customer?.name || "—"} />
              <InfoItem label="かな" value={customer?.kana || "—"} />
              <InfoItem label="電話" value={customer?.phone || "—"} />
              <InfoItem label="メール" value={customer?.email || "—"} />
              <InfoItem label="性別" value={customer?.gender || "—"} />
              <InfoItem label="年齢" value={customer?.age || "—"} />
              <InfoItem label="誕生日" value={customer?.birthday || "—"} />
              <InfoItem label="住所" value={customer?.address || "—"} />
            </div>

            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
              <TextBlock
                label="目標"
                value={customer?.goal || "未設定"}
              />
              <TextBlock
                label="メモ"
                value={customer?.memo || "未設定"}
              />
            </div>
          </section>

          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}>
            <h2 style={sectionTitleStyle}>最新トレーニングデータ</h2>

            <div style={metricsGridStyle}>
              <MetricCard
                label="身長"
                value={formatMetric(latestSession?.body_height, "cm")}
                sub={
                  latestSession?.session_date
                    ? `最新日: ${formatDate(latestSession.session_date)}`
                    : "未登録"
                }
              />
              <MetricCard
                label="体重"
                value={formatMetric(latestSession?.body_weight, "kg")}
                sub={
                  weightDiff !== null
                    ? `前回比 ${diffLabel(weightDiff, "kg")}`
                    : "比較データなし"
                }
                subColor={diffColor(weightDiff)}
              />
              <MetricCard
                label="体脂肪"
                value={formatMetric(latestSession?.body_fat, "%")}
                sub={
                  latestSession?.session_date
                    ? `更新日: ${formatDate(latestSession.session_date)}`
                    : "未登録"
                }
              />
              <MetricCard
                label="筋肉量"
                value={formatMetric(latestSession?.muscle_mass, "kg")}
                sub={
                  muscleDiff !== null
                    ? `前回比 ${diffLabel(muscleDiff, "kg")}`
                    : "比較データなし"
                }
                subColor={diffColor(muscleDiff)}
              />
              <MetricCard
                label="内臓脂肪"
                value={formatMetric(latestSession?.visceral_fat)}
                sub={
                  latestSession?.session_date
                    ? `更新日: ${formatDate(latestSession.session_date)}`
                    : "未登録"
                }
              />
              <MetricCard
                label="履歴件数"
                value={`${sessions.length}件`}
                sub="training_sessions"
              />
            </div>

            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              <TextBlock
                label="最新総評"
                value={latestSession?.summary || "未登録"}
              />
              <TextBlock
                label="最新の次回課題"
                value={latestSession?.next_task || "未登録"}
              />
              <TextBlock
                label="最新の姿勢メモ"
                value={latestSession?.posture_note || "未登録"}
              />
            </div>
          </section>

          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}>
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
              <h2 style={sectionTitleStyle}>体重推移グラフ</h2>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
                データ {chartSessions.length}件
              </div>
            </div>

            {chartSessions.length === 0 ? (
              <div style={emptyBoxStyle}>体重データがまだありません。</div>
            ) : chartSessions.length === 1 ? (
              <div style={singleChartBoxStyle}>
                <div style={singleChartValueStyle}>
                  {formatMetric(chartSessions[0].body_weight, "kg")}
                </div>
                <div style={singleChartDateStyle}>
                  {formatDate(chartSessions[0].session_date)}
                </div>
              </div>
            ) : (
              <div style={chartWrapStyle}>
                <svg
                  viewBox="0 0 560 220"
                  style={{ width: "100%", height: "auto", display: "block" }}
                >
                  <defs>
                    <linearGradient id="weightLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  <line x1="20" y1="190" x2="540" y2="190" stroke="#cbd5e1" />
                  <line x1="20" y1="20" x2="20" y2="190" stroke="#cbd5e1" />

                  <polyline
                    fill="none"
                    stroke="url(#weightLine)"
                    strokeWidth="4"
                    points={chartPoints
                      .split(" ")
                      .map((point) => {
                        const [x, y] = point.split(",").map(Number);
                        return `${x + 20},${y + 10}`;
                      })
                      .join(" ")}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {chartValues.map((value, index) => {
                    const points = chartPoints.split(" ");
                    const [rawX, rawY] = points[index].split(",").map(Number);
                    const cx = rawX + 20;
                    const cy = rawY + 10;

                    return (
                      <g key={`${value}-${index}`}>
                        <circle cx={cx} cy={cy} r="5" fill="#2563eb" />
                        <text
                          x={cx}
                          y={cy - 12}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#334155"
                          fontWeight="700"
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div style={chartLabelRowStyle}>
                  {chartSessions.map((item, index) => (
                    <div key={`${item.session_date}-${index}`} style={chartDateStyle}>
                      {formatDate(item.session_date)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}>
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
              <h2 style={sectionTitleStyle}>トレーニング履歴サマリー</h2>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
                新しい順に表示
              </div>
            </div>

            {sessions.length === 0 ? (
              <div style={emptyBoxStyle}>まだトレーニング履歴はありません。</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {[...sessions]
                  .slice()
                  .reverse()
                  .map((session) => (
                    <article key={session.id} style={historyItemStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={historyDateStyle}>
                            {formatDate(session.session_date)}
                          </div>
                          <div style={historySubStyle}>
                            体重 {formatMetric(session.body_weight, "kg")} / 筋肉量{" "}
                            {formatMetric(session.muscle_mass, "kg")} / 体脂肪{" "}
                            {formatMetric(session.body_fat, "%")}
                          </div>
                          <div style={historySubStyle}>
                            内臓脂肪 {formatMetric(session.visceral_fat)} / 身長{" "}
                            {formatMetric(session.body_height, "cm")}
                          </div>
                        </div>

                        <Link
                          href={`/customer/${customerId}/training?edit=${session.id}`}
                          style={miniButtonLinkStyle}
                        >
                          この履歴を編集
                        </Link>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={infoCardStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value || "—"}</div>
    </div>
  );
}

function TextBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={historyLabelStyle}>{label}</div>
      <div style={textBlockStyle}>{value}</div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
}) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
      <div style={{ ...metricSubStyle, color: subColor || "#64748b" }}>{sub}</div>
    </div>
  );
}

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 20,
  fontWeight: 800,
  color: "#0f172a",
};

const secondaryButtonStyle: CSSProperties = {
  height: 42,
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(255,255,255,0.86)",
  color: "#334155",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  padding: "0 16px",
};

const buttonLinkStyle: CSSProperties = {
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 18px",
  minHeight: 42,
  borderRadius: 14,
  fontSize: 14,
  fontWeight: 800,
  color: "#fff",
};

const miniButtonLinkStyle: CSSProperties = {
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 12,
  background: "rgba(37,99,235,0.1)",
  border: "1px solid rgba(37,99,235,0.18)",
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 700,
};

const alertErrorStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(254,242,242,0.98)",
  border: "1px solid rgba(239,68,68,0.22)",
  color: "#b91c1c",
  fontSize: 14,
  fontWeight: 700,
};

const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const infoCardStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const infoLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  marginBottom: 6,
  letterSpacing: "0.04em",
};

const infoValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#0f172a",
  lineHeight: 1.6,
};

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const metricCardStyle: CSSProperties = {
  padding: "16px 16px 14px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
};

const metricLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  marginBottom: 8,
  letterSpacing: "0.05em",
};

const metricValueStyle: CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.1,
  marginBottom: 8,
};

const metricSubStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
};

const textBlockStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.8,
};

const chartWrapStyle: CSSProperties = {
  padding: "16px 14px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const chartLabelRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: `repeat(${Math.max(1, 1)}, minmax(0, 1fr))`,
  gap: 8,
  marginTop: 8,
};

const chartDateStyle: CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  textAlign: "center",
  lineHeight: 1.4,
};

const singleChartBoxStyle: CSSProperties = {
  padding: "22px 18px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
  textAlign: "center",
};

const singleChartValueStyle: CSSProperties = {
  fontSize: 32,
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 6,
};

const singleChartDateStyle: CSSProperties = {
  fontSize: 14,
  color: "#64748b",
  fontWeight: 700,
};

const emptyBoxStyle: CSSProperties = {
  padding: "18px 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#475569",
  fontSize: 14,
};

const historyItemStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const historyDateStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 4,
};

const historySubStyle: CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  lineHeight: 1.8,
};

const historyLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  marginBottom: 6,
  letterSpacing: "0.04em",
};