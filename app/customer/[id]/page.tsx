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

type SaleRow = {
  id: string;
  customer_id?: string | null;
  amount?: number | null;
  sale_date?: string | null;
};

type CustomerTicketRow = {
  id: string | number;
  customer_id?: string | number | null;
  customer_name?: string | null;
  ticket_name?: string | null;
  service_type?: string | null;
  total_count?: number | null;
  remaining_count?: number | null;
  purchase_date?: string | null;
  expiry_date?: string | null;
  status?: string | null;
  note?: string | null;
  created_at?: string | null;
};

type CounselingSheetRow = {
  id?: string;
  customer_id: string;
  furigana?: string | null;
  full_name?: string | null;
  address?: string | null;
  phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relation?: string | null;
  occupation?: string | null;
  referral_sources?: string[] | null;
  referral_source_other?: string | null;
  visit_purposes?: string[] | null;
  visit_purpose_other?: string | null;
  symptoms?: string[] | null;
  symptom_other?: string | null;
  body_areas?: string[] | null;
  concern_since?: string | null;
  preferred_pressure?: string | null;
  session_preferences?: string[] | null;
  session_preference_other?: string | null;
  medical_histories?: string[] | null;
  medical_history_other?: string | null;
  major_history_status?: string | null;
  major_history_details?: string | null;
  surgery_history_status?: string | null;
  surgery_history_details?: string | null;
  pacemaker_status?: string | null;
  pregnancy_status?: string | null;
  pregnancy_months?: string | null;
  breastfeeding_status?: string | null;
  notes?: string | null;
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

type TicketForm = {
  ticket_name: string;
  service_type: "ストレッチ" | "トレーニング";
  total_count: string;
  expiry_date: string;
  note: string;
};

const initialTicketForm: TicketForm = {
  ticket_name: "",
  service_type: "ストレッチ",
  total_count: "",
  expiry_date: "",
  note: "",
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
    age: row.age !== null && row.age !== undefined ? String(row.age) : "",
    birthday: row.birthday || "",
    address: row.address || "",
    goal: row.goal || row.goals || "",
    memo: row.memo || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function calcDiff(latest?: number | null, previous?: number | null): number | null {
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
  if (values.length === 1) return `${width / 2},${height / 2}`;

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

function calcTicketComputedStatus(ticket: CustomerTicketRow) {
  const baseStatus = ticket.status || "";
  const remaining = Number(ticket.remaining_count || 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (baseStatus === "無効") return "無効";
  if (remaining <= 0) return "消化済み";

  if (ticket.expiry_date) {
    const expiry = new Date(ticket.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    if (!Number.isNaN(expiry.getTime()) && expiry < today) {
      return "期限切れ";
    }
  }

  return "有効";
}

function ticketStatusStyle(status: string): CSSProperties {
  switch (status) {
    case "有効":
      return {
        background: "rgba(22,163,74,0.10)",
        color: "#15803d",
        border: "1px solid rgba(22,163,74,0.18)",
      };
    case "期限切れ":
      return {
        background: "rgba(245,158,11,0.12)",
        color: "#b45309",
        border: "1px solid rgba(245,158,11,0.22)",
      };
    case "消化済み":
      return {
        background: "rgba(59,130,246,0.10)",
        color: "#1d4ed8",
        border: "1px solid rgba(59,130,246,0.18)",
      };
    default:
      return {
        background: "rgba(239,68,68,0.10)",
        color: "#b91c1c",
        border: "1px solid rgba(239,68,68,0.18)",
      };
  }
}

function summarizeCounseling(sheet: CounselingSheetRow | null) {
  if (!sheet) {
    return {
      purposes: "未登録",
      symptoms: "未登録",
      bodyAreas: "未登録",
      occupation: "未登録",
      notes: "未登録",
      updatedAt: "—",
    };
  }

  return {
    purposes:
      sheet.visit_purposes && sheet.visit_purposes.length > 0
        ? sheet.visit_purposes.slice(0, 3).join(" / ")
        : "未登録",
    symptoms:
      sheet.symptoms && sheet.symptoms.length > 0
        ? sheet.symptoms.slice(0, 3).join(" / ")
        : "未登録",
    bodyAreas:
      sheet.body_areas && sheet.body_areas.length > 0
        ? sheet.body_areas.slice(0, 4).join(" / ")
        : "未登録",
    occupation: sheet.occupation || "未登録",
    notes: sheet.notes?.trim() ? sheet.notes : "未登録",
    updatedAt: formatDateTime(sheet.updated_at || sheet.created_at),
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const customerId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");

  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState<NormalizedCustomer | null>(null);
  const [sessions, setSessions] = useState<TrainingSessionRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [tickets, setTickets] = useState<CustomerTicketRow[]>([]);
  const [counselingSheet, setCounselingSheet] = useState<CounselingSheetRow | null>(null);

  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState<TicketForm>(initialTicketForm);
  const [ticketSaving, setTicketSaving] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
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

      const numericCustomerId = Number(customerId);
      const customerIdForQuery = Number.isNaN(numericCustomerId)
        ? customerId
        : numericCustomerId;

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerIdForQuery)
        .single();

      if (customerError) throw customerError;

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
        .order("session_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (sessionError) throw sessionError;

      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id, customer_id, amount, sale_date")
        .eq("customer_id", String(customerId));

      if (salesError) {
        console.warn("sales取得エラー:", salesError.message);
      }

      const { data: ticketData, error: ticketFetchError } = await supabase
        .from("customer_tickets")
        .select(
          "id, customer_id, customer_name, ticket_name, service_type, total_count, remaining_count, purchase_date, expiry_date, status, note, created_at"
        )
        .eq("customer_id", String(customerId))
        .order("created_at", { ascending: false });

      if (ticketFetchError) {
        console.warn("customer_tickets取得エラー:", ticketFetchError.message);
      }

      const { data: counselingData, error: counselingError } = await supabase
        .from("counseling_sheets")
        .select("*")
        .eq("customer_id", String(customerId))
        .maybeSingle();

      if (counselingError && counselingError.code !== "PGRST116") {
        console.warn("counseling_sheets取得エラー:", counselingError.message);
      }

      setCustomer(normalizeCustomer(customerData as CustomerRow));
      setSessions((sessionData as TrainingSessionRow[]) || []);
      setSales((salesData as SaleRow[]) || []);
      setTickets((ticketData as CustomerTicketRow[]) || []);
      setCounselingSheet((counselingData as CounselingSheetRow) || null);
    } catch (e: any) {
      setError(e?.message || "データ取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  function updateTicketForm<K extends keyof TicketForm>(
    key: K,
    value: TicketForm[K]
  ) {
    setTicketForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveTicket() {
    if (!supabase || !customer) return;

    setTicketError("");
    setTicketSuccess("");

    const totalCount = Number(ticketForm.total_count);

    if (!ticketForm.ticket_name.trim()) {
      setTicketError("回数券名を入力してください。");
      return;
    }

    if (!ticketForm.total_count || Number.isNaN(totalCount) || totalCount <= 0) {
      setTicketError("回数は1以上で入力してください。");
      return;
    }

    setTicketSaving(true);

    try {
      const today = new Date().toISOString().slice(0, 10);

      const payload = {
        customer_id: customer.id,
        customer_name: customer.name || "",
        ticket_name: ticketForm.ticket_name.trim(),
        service_type: ticketForm.service_type,
        total_count: totalCount,
        remaining_count: totalCount,
        purchase_date: today,
        expiry_date: ticketForm.expiry_date || null,
        status: "有効",
        note: ticketForm.note.trim() || null,
      };

      const { error: insertError } = await supabase
        .from("customer_tickets")
        .insert(payload);

      if (insertError) throw insertError;

      setTicketSuccess("回数券を追加しました。");
      setTicketForm(initialTicketForm);
      setShowTicketForm(false);
      await loadData();
    } catch (e: any) {
      setTicketError(e?.message || "回数券の追加に失敗しました。");
    } finally {
      setTicketSaving(false);
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

  const weightDiff = calcDiff(latestSession?.body_weight, previousSession?.body_weight);
  const muscleDiff = calcDiff(latestSession?.muscle_mass, previousSession?.muscle_mass);

  const visitCount = sessions.length;

  const ltv = useMemo(() => {
    return sales.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [sales]);

  const activeTickets = useMemo(() => {
    return tickets.filter((item) => calcTicketComputedStatus(item) === "有効");
  }, [tickets]);

  const remainingTickets = useMemo(() => {
    return tickets.reduce((sum, item) => {
      return sum + Math.max(Number(item.remaining_count || 0), 0);
    }, 0);
  }, [tickets]);

  const weightChartSessions = useMemo(() => {
    return sessions.filter(
      (item) =>
        item.body_weight !== null &&
        item.body_weight !== undefined &&
        item.session_date
    );
  }, [sessions]);

  const bodyFatChartSessions = useMemo(() => {
    return sessions.filter(
      (item) =>
        item.body_fat !== null &&
        item.body_fat !== undefined &&
        item.session_date
    );
  }, [sessions]);

  const weightValues = weightChartSessions
    .map((item) => item.body_weight)
    .filter((v): v is number => v !== null && v !== undefined);

  const bodyFatValues = bodyFatChartSessions
    .map((item) => item.body_fat)
    .filter((v): v is number => v !== null && v !== undefined);

  const weightChartPoints = buildChartPoints(weightValues, 520, 180);
  const bodyFatChartPoints = buildChartPoints(bodyFatValues, 520, 180);

  const counselingSummary = summarizeCounseling(counselingSheet);

  const mobile = windowWidth < 768;
  const tablet = windowWidth < 1100;

  if (!mounted) return null;

  if (loading) {
    return (
      <main style={{ ...BG_STYLE, minHeight: "100vh", padding: "24px 16px 80px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ ...CARD_STYLE, borderRadius: 24, padding: 24 }}>
            読み込み中...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ ...BG_STYLE, minHeight: "100vh", padding: mobile ? "16px 12px 72px" : "24px 16px 80px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
        <div style={{ ...CARD_STYLE, borderRadius: 24, padding: mobile ? 16 : 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: 16,
              flexWrap: "wrap",
              flexDirection: mobile ? "column" : "row",
            }}
          >
            <div>
              <div style={eyebrowStyle}>CUSTOMER DETAIL</div>
              <h1 style={{ ...pageTitleStyle, fontSize: mobile ? 24 : 30 }}>顧客詳細</h1>
            </div>

            <div
  style={{
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    width: mobile ? "100%" : "auto",
    flexDirection: mobile ? "column" : "row",
  }}
>
  <button
    type="button"
    
    style={{ ...secondaryButtonStyle, width: mobile ? "100%" : "auto" }}
  >
    顧客一覧へ戻る
  </button>

  <button
    type="button"
    onClick={() => {
      setShowTicketForm((prev) => !prev);
      setTicketError("");
      setTicketSuccess("");
    }}
    style={{
      ...buttonLinkStyle,
      ...BUTTON_PRIMARY_STYLE,
      border: "none",
      cursor: "pointer",
      width: mobile ? "100%" : "auto",
    }}
  >
    ＋ 回数券追加
  </button>

  <Link
    href={`/customer/${customerId}/counseling`}
    style={{
      ...buttonLinkStyle,
      ...BUTTON_PRIMARY_STYLE,
      width: mobile ? "100%" : "auto",
    }}
  >
    カウンセリングシート
  </Link>

  <Link
    href={`/customer/${customerId}/subscription`}
    style={{
      ...buttonLinkStyle,
      ...BUTTON_PRIMARY_STYLE,
      width: mobile ? "100%" : "auto",
    }}
  >
    月額契約
  </Link>

  <Link
    href={`/customer/${customerId}/training`}
    style={{
      ...buttonLinkStyle,
      ...BUTTON_PRIMARY_STYLE,
      width: mobile ? "100%" : "auto",
    }}
  >
    トレーニング履歴へ
  </Link>
</div>
</div>

        {error ? <div style={alertErrorStyle}>{error}</div> : null}
        {ticketError ? <div style={alertErrorStyle}>{ticketError}</div> : null}
        {ticketSuccess ? <div style={alertSuccessStyle}>{ticketSuccess}</div> : null}

        <section style={{ ...CARD_STYLE, borderRadius: 24, padding: mobile ? 16 : 20 }}>
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
            <TextBlock label="目標" value={customer?.goal || "未設定"} />
            <TextBlock label="メモ" value={customer?.memo || "未設定"} />
            <TextBlock label="登録日" value={formatDateTime(customer?.createdAt)} />
          </div>
        </section>

        <section style={{ ...CARD_STYLE, borderRadius: 24, padding: mobile ? 16 : 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: 12,
              flexWrap: "wrap",
              flexDirection: mobile ? "column" : "row",
              marginBottom: 16,
            }}
          >
            <h2 style={sectionTitleStyle}>カウンセリング要約</h2>

            <Link
              href={`/customer/${customerId}/counseling`}
              style={{ ...miniButtonLinkStyle, width: mobile ? "100%" : "auto" }}
            >
              {counselingSheet ? "詳細を見る / 編集" : "新規入力"}
            </Link>
          </div>

          {!counselingSheet ? (
            <div style={emptyBoxStyle}>まだカウンセリングシートは登録されていません。</div>
          ) : (
            <div style={counselingSummaryGridStyle}>
              <div style={metricCardStyle}>
                <div style={metricLabelStyle}>職業</div>
                <div style={metricValueSmallStyle}>{counselingSummary.occupation}</div>
                <div style={metricSubStyle}>最終更新 {counselingSummary.updatedAt}</div>
              </div>

              <div style={metricCardStyle}>
                <div style={metricLabelStyle}>来店目的</div>
                <div style={metricValueSmallStyle}>{counselingSummary.purposes}</div>
                <div style={metricSubStyle}>visit_purposes</div>
              </div>

              <div style={metricCardStyle}>
                <div style={metricLabelStyle}>主な症状</div>
                <div style={metricValueSmallStyle}>{counselingSummary.symptoms}</div>
                <div style={metricSubStyle}>symptoms</div>
              </div>

              <div style={metricCardStyle}>
                <div style={metricLabelStyle}>気になる部位</div>
                <div style={metricValueSmallStyle}>{counselingSummary.bodyAreas}</div>
                <div style={metricSubStyle}>body_areas</div>
              </div>

              <div style={{ ...metricCardStyle, gridColumn: "1 / -1" }}>
                <div style={metricLabelStyle}>メモ・配慮事項</div>
                <div style={counselingNoteStyle}>{counselingSummary.notes}</div>
              </div>
            </div>
          )}
        </section>

        {showTicketForm ? (
          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: mobile ? 16 : 20 }}>
            <h2 style={sectionTitleStyle}>回数券追加</h2>

            <div style={ticketFormGridStyle}>
              <div>
                <div style={historyLabelStyle}>回数券名</div>
                <input
                  value={ticketForm.ticket_name}
                  onChange={(e) => updateTicketForm("ticket_name", e.target.value)}
                  placeholder="例：ストレッチ4回券"
                  style={inputStyle}
                />
              </div>

              <div>
                <div style={historyLabelStyle}>サービス種別</div>
                <select
                  value={ticketForm.service_type}
                  onChange={(e) =>
                    updateTicketForm(
                      "service_type",
                      e.target.value as "ストレッチ" | "トレーニング"
                    )
                  }
                  style={inputStyle}
                >
                  <option value="ストレッチ">ストレッチ</option>
                  <option value="トレーニング">トレーニング</option>
                </select>
              </div>

              <div>
                <div style={historyLabelStyle}>回数</div>
                <input
                  type="number"
                  min="1"
                  value={ticketForm.total_count}
                  onChange={(e) => updateTicketForm("total_count", e.target.value)}
                  placeholder="例：4"
                  style={inputStyle}
                />
              </div>

              <div>
                <div style={historyLabelStyle}>有効期限</div>
                <input
                  type="date"
                  value={ticketForm.expiry_date}
                  onChange={(e) => updateTicketForm("expiry_date", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={historyLabelStyle}>メモ</div>
                <textarea
                  value={ticketForm.note}
                  onChange={(e) => updateTicketForm("note", e.target.value)}
                  placeholder="補足があれば入力"
                  style={textareaStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 16,
                flexDirection: mobile ? "column" : "row",
              }}
            >
              <button
                type="button"
                onClick={handleSaveTicket}
                disabled={ticketSaving}
                style={{
                  ...buttonLinkStyle,
                  ...BUTTON_PRIMARY_STYLE,
                  border: "none",
                  cursor: "pointer",
                  width: mobile ? "100%" : "auto",
                }}
              >
                {ticketSaving ? "保存中..." : "回数券を保存"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTicketForm(false);
                  setTicketForm(initialTicketForm);
                  setTicketError("");
                }}
                style={{ ...secondaryButtonStyle, width: mobile ? "100%" : "auto" }}
              >
                キャンセル
              </button>
            </div>
          </section>
        ) : null}

        <section style={{ ...CARD_STYLE, borderRadius: 24, padding: mobile ? 16 : 20 }}>
          <h2 style={sectionTitleStyle}>KPI</h2>

          <div style={metricsGridStyle}>
            <MetricCard label="来店回数" value={`${visitCount}回`} sub="training_sessions件数" />
            <MetricCard label="LTV" value={`¥${ltv.toLocaleString()}`} sub={`${sales.length}件の売上`} />
            <MetricCard label="回数券残数" value={`${remainingTickets}回`} sub={`${tickets.length}件の回数券`} />
            <MetricCard label="有効回数券" value={`${activeTickets.length}件`} sub="現在利用可能" />
          </div>
        </section>

        <section style={{ ...CARD_STYLE, borderRadius: 24, padding: mobile ? 16 : 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: 12,
              flexWrap: "wrap",
              flexDirection: mobile ? "column" : "row",
              marginBottom: 16,
            }}
          >
            <h2 style={sectionTitleStyle}>保有回数券一覧</h2>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
              新しい順に表示
            </div>
          </div>

          {tickets.length === 0 ? (
            <div style={emptyBoxStyle}>まだ回数券は登録されていません。</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {tickets.map((ticket) => {
                const computedStatus = calcTicketComputedStatus(ticket);

                return (
                  <article key={String(ticket.id)} style={historyItemStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                            marginBottom: 6,
                          }}
                        >
                          <div style={historyDateStyle}>
                            {ticket.ticket_name || "回数券名未設定"}
                          </div>
                          <span
                            style={{
                              ...ticketBadgeStyle,
                              ...ticketStatusStyle(computedStatus),
                            }}
                          >
                            {computedStatus}
                          </span>
                        </div>

                        <div style={historySubStyle}>
                          サービス種別 {ticket.service_type || "—"}
                        </div>
                        <div style={historySubStyle}>
                          残数 {Number(ticket.remaining_count || 0)} / {Number(ticket.total_count || 0)}
                        </div>
                        <div style={historySubStyle}>
                          購入日 {formatDate(ticket.purchase_date)} / 有効期限 {formatDate(ticket.expiry_date)}
                        </div>
                        <div style={historySubStyle}>
                          メモ {ticket.note || "—"}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ ...CARD_STYLE, borderRadius: 24, padding: mobile ? 16 : 20 }}>
          <h2 style={sectionTitleStyle}>最新トレーニングデータ</h2>

          <div style={metricsGridStyle}>
            <MetricCard
              label="身長"
              value={formatMetric(latestSession?.body_height, "cm")}
              sub={latestSession?.session_date ? `最新日: ${formatDate(latestSession.session_date)}` : "未登録"}
            />
            <MetricCard
              label="体重"
              value={formatMetric(latestSession?.body_weight, "kg")}
              sub={weightDiff !== null ? `前回比 ${diffLabel(weightDiff, "kg")}` : "比較データなし"}
              subColor={diffColor(weightDiff)}
            />
            <MetricCard
              label="体脂肪"
              value={formatMetric(latestSession?.body_fat, "%")}
              sub={latestSession?.session_date ? `更新日: ${formatDate(latestSession.session_date)}` : "未登録"}
            />
            <MetricCard
              label="筋肉量"
              value={formatMetric(latestSession?.muscle_mass, "kg")}
              sub={muscleDiff !== null ? `前回比 ${diffLabel(muscleDiff, "kg")}` : "比較データなし"}
              subColor={diffColor(muscleDiff)}
            />
            <MetricCard
              label="内臓脂肪"
              value={formatMetric(latestSession?.visceral_fat)}
              sub={latestSession?.session_date ? `更新日: ${formatDate(latestSession.session_date)}` : "未登録"}
            />
            <MetricCard
              label="履歴件数"
              value={`${sessions.length}件`}
              sub="training_sessions"
            />
          </div>

          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            <TextBlock label="最新総評" value={latestSession?.summary || "未登録"} />
            <TextBlock label="最新の次回課題" value={latestSession?.next_task || "未登録"} />
            <TextBlock label="最新の姿勢メモ" value={latestSession?.posture_note || "未登録"} />
          </div>
        </section>

        <ChartSection
          title="体重推移グラフ"
          sessions={weightChartSessions}
          values={weightValues}
          points={weightChartPoints}
          unit="kg"
          lineId="weightLine"
          startColor="#2563eb"
          endColor="#06b6d4"
          emptyLabel="体重データがまだありません。"
        />

        <ChartSection
          title="体脂肪推移グラフ"
          sessions={bodyFatChartSessions}
          values={bodyFatValues}
          points={bodyFatChartPoints}
          unit="%"
          lineId="bodyFatLine"
          startColor="#f97316"
          endColor="#f59e0b"
          emptyLabel="体脂肪データがまだありません。"
        />

        <section style={{ ...CARD_STYLE, borderRadius: 24, padding: mobile ? 16 : 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: 12,
              flexWrap: "wrap",
              flexDirection: mobile ? "column" : "row",
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
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={historyDateStyle}>{formatDate(session.session_date)}</div>
                        <div style={historySubStyle}>
                          身長 {formatMetric(session.body_height, "cm")} / 体重 {formatMetric(session.body_weight, "kg")}
                        </div>
                        <div style={historySubStyle}>
                          体脂肪 {formatMetric(session.body_fat, "%")} / 筋肉量 {formatMetric(session.muscle_mass, "kg")} / 内臓脂肪 {formatMetric(session.visceral_fat)}
                        </div>
                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                          <TextBlock label="総評" value={session.summary || "未登録"} />
                          <TextBlock label="次回課題" value={session.next_task || "未登録"} />
                          <TextBlock label="姿勢メモ" value={session.posture_note || "未登録"} />
                        </div>
                      </div>

                      <Link
                        href={`/customer/${customerId}/training?edit=${session.id}`}
                        style={{ ...miniButtonLinkStyle, width: mobile ? "100%" : "auto" }}
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
      <div style={{ ...metricSubStyle, color: subColor || "#64748b" }}>
        {sub}
      </div>
    </div>
  );
}

function ChartSection({
  title,
  sessions,
  values,
  points,
  unit,
  lineId,
  startColor,
  endColor,
  emptyLabel,
}: {
  title: string;
  sessions: TrainingSessionRow[];
  values: number[];
  points: string;
  unit: string;
  lineId: string;
  startColor: string;
  endColor: string;
  emptyLabel: string;
}) {
  return (
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
        <h2 style={sectionTitleStyle}>{title}</h2>
        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
          データ {sessions.length}件
        </div>
      </div>

      {sessions.length === 0 ? (
        <div style={emptyBoxStyle}>{emptyLabel}</div>
      ) : sessions.length === 1 ? (
        <div style={singleChartBoxStyle}>
          <div style={singleChartValueStyle}>{formatMetric(values[0], unit)}</div>
          <div style={singleChartDateStyle}>{formatDate(sessions[0].session_date)}</div>
        </div>
      ) : (
        <div style={chartWrapStyle}>
          <svg viewBox="0 0 560 220" style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={startColor} />
                <stop offset="100%" stopColor={endColor} />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map((i) => {
              const y = 20 + i * 40;
              return (
                <line
                  key={i}
                  x1="20"
                  y1={y}
                  x2="540"
                  y2={y}
                  stroke="rgba(203,213,225,0.6)"
                  strokeWidth="1"
                />
              );
            })}

            <polyline
              fill="none"
              stroke={`url(#${lineId})`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              transform="translate(20,20)"
            />

            {values.map((value, index) => {
              const min = Math.min(...values);
              const max = Math.max(...values);
              const range = max - min || 1;
              const x = (index / (values.length - 1)) * 520 + 20;
              const y = 20 + (180 - ((value - min) / range) * 180);

              return (
                <g key={`${lineId}-${index}`}>
                  <circle cx={x} cy={y} r="5" fill="#ffffff" stroke={`url(#${lineId})`} strokeWidth="3" />
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      fill: "#334155",
                    }}
                  >
                    {value}{unit}
                  </text>
                  <text
                    x={x}
                    y={212}
                    textAnchor="middle"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      fill: "#64748b",
                    }}
                  >
                    {formatDate(sessions[index]?.session_date)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}

const eyebrowStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.12em",
  color: "#64748b",
  marginBottom: 4,
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.2,
  color: "#0f172a",
  fontWeight: 800,
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 16px 0",
  fontSize: 20,
  color: "#0f172a",
  fontWeight: 800,
};

const buttonLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "10px 16px",
  borderRadius: 14,
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14,
};

const miniButtonLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.92)",
  color: "#334155",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 13,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.92)",
  color: "#334155",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "10px 16px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.95)",
  color: "#0f172a",
  padding: "0 14px",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 110,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.95)",
  color: "#0f172a",
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
  resize: "vertical",
  boxSizing: "border-box",
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

const alertSuccessStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(240,253,244,0.98)",
  border: "1px solid rgba(22,163,74,0.22)",
  color: "#15803d",
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
  wordBreak: "break-word",
};

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const counselingSummaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

const metricValueSmallStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.5,
  marginBottom: 8,
  wordBreak: "break-word",
};

const metricSubStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#64748b",
};

const counselingNoteStyle: CSSProperties = {
  fontSize: 14,
  color: "#334155",
  lineHeight: 1.8,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const historyLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#64748b",
  marginBottom: 8,
};

const textBlockStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
  fontSize: 14,
  lineHeight: 1.8,
  color: "#334155",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const ticketFormGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const emptyBoxStyle: CSSProperties = {
  minHeight: 110,
  borderRadius: 16,
  border: "1px dashed rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 20,
  color: "#64748b",
  fontSize: 14,
  fontWeight: 700,
};

const historyItemStyle: CSSProperties = {
  padding: "16px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.86)",
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
};

const historyDateStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 6,
  wordBreak: "break-word",
};

const historySubStyle: CSSProperties = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.7,
  wordBreak: "break-word",
};

const ticketBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 28,
  padding: "0 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const chartWrapStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
  borderRadius: 18,
  background: "rgba(255,255,255,0.86)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 10,
};

const singleChartBoxStyle: CSSProperties = {
  minHeight: 180,
  borderRadius: 18,
  background: "rgba(255,255,255,0.86)",
  border: "1px solid rgba(226,232,240,0.95)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  textAlign: "center",
};

const singleChartValueStyle: CSSProperties = {
  fontSize: 34,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.1,
};

const singleChartDateStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  fontWeight: 700,
  color: "#64748b",
};

function dummy() {
  return null;
}