"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { BG, CARD, BUTTON_PRIMARY } from "../../../../styles/theme";

type CustomerRow = {
  id: number | string;
  name?: string | null;
  kana?: string | null;
  phone?: string | null;
  email?: string | null;
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

type FormState = {
  furigana: string;
  full_name: string;
  address: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  occupation: string;

  referral_sources: string[];
  referral_source_other: string;

  visit_purposes: string[];
  visit_purpose_other: string;

  symptoms: string[];
  symptom_other: string;

  body_areas: string[];

  concern_since: string;
  preferred_pressure: string;

  session_preferences: string[];
  session_preference_other: string;

  medical_histories: string[];
  medical_history_other: string;

  major_history_status: string;
  major_history_details: string;

  surgery_history_status: string;
  surgery_history_details: string;

  pacemaker_status: string;

  pregnancy_status: string;
  pregnancy_months: string;
  breastfeeding_status: string;

  notes: string;
};

type ViewMode = "front" | "back";

type BodyPoint = {
  key: string;
  label: string;
  left: string;
  top: string;
  size?: number;
};

const REFERRAL_OPTIONS = [
  "Web",
  "ホームページ",
  "ブログ",
  "チラシ",
  "看板",
  "Instagram",
  "LINE",
  "紹介",
  "通りがかり",
  "その他",
];

const PURPOSE_OPTIONS = [
  "痩身",
  "リラクゼーション",
  "自分の身体の状態を知りたい",
  "体質改善",
  "体型改善",
  "姿勢改善",
  "O脚X脚の改善",
  "パフォーマンスアップ",
  "柔軟性アップ",
  "サイズダウン",
  "その他",
];

const SYMPTOM_OPTIONS = [
  "肩こり",
  "首こり",
  "腰痛",
  "冷え性",
  "むくみ",
  "生理痛",
  "便秘",
  "更年期",
  "頭痛",
  "猫背",
  "反り腰",
  "その他",
];

const BODY_AREA_OPTIONS = [
  "首",
  "肩",
  "背中上部",
  "背中下部",
  "腰",
  "胸",
  "お腹",
  "骨盤",
  "股関節",
  "お尻",
  "太もも前",
  "太もも裏",
  "膝",
  "ふくらはぎ",
  "足首",
  "二の腕",
  "肘",
  "手首",
];

const OCCUPATION_OPTIONS = [
  "会社員",
  "会社経営",
  "自営業",
  "医師",
  "公務員",
  "派遣社員",
  "パートアルバイト",
  "学生",
  "その他",
];

const CONCERN_SINCE_OPTIONS = [
  "3ヶ月以内",
  "半年以内",
  "1年以内",
  "1年以上前",
  "産後",
  "その他",
];

const PRESSURE_OPTIONS = ["弱め", "普通", "強め", "お任せ"];

const SESSION_PREFERENCE_OPTIONS = [
  "ぐっすり眠りたい",
  "その都度身体について知りたい",
  "お話を聞いて欲しい",
  "静かに受けたい",
  "その他",
];

const MEDICAL_HISTORY_OPTIONS = [
  "ヘルニア",
  "分離症",
  "すべり症",
  "椎間板症",
  "自律神経失調症",
  "ムチウチ",
  "動脈瘤",
  "脳",
  "骨折",
  "その他",
];

const FRONT_POINTS: BodyPoint[] = [
  { key: "front_neck", label: "首", left: "50%", top: "15%" },
  { key: "front_left_shoulder", label: "肩", left: "36%", top: "20%", size: 16 },
  { key: "front_right_shoulder", label: "肩", left: "64%", top: "20%", size: 16 },
  { key: "front_chest", label: "胸", left: "50%", top: "25%" },
  { key: "front_left_upper_arm", label: "二の腕", left: "24%", top: "28%" },
  { key: "front_right_upper_arm", label: "二の腕", left: "76%", top: "28%" },
  { key: "front_left_elbow", label: "肘", left: "18%", top: "40%" },
  { key: "front_right_elbow", label: "肘", left: "82%", top: "40%" },
  { key: "front_left_wrist", label: "手首", left: "15%", top: "52%" },
  { key: "front_right_wrist", label: "手首", left: "85%", top: "52%" },
  { key: "front_abdomen", label: "お腹", left: "50%", top: "38%" },
  { key: "front_pelvis", label: "骨盤", left: "50%", top: "48%" },
  { key: "front_left_hip", label: "股関節", left: "40%", top: "54%" },
  { key: "front_right_hip", label: "股関節", left: "60%", top: "54%" },
  { key: "front_left_thigh", label: "太もも前", left: "44%", top: "64%" },
  { key: "front_right_thigh", label: "太もも前", left: "56%", top: "64%" },
  { key: "front_left_knee", label: "膝", left: "45%", top: "78%" },
  { key: "front_right_knee", label: "膝", left: "55%", top: "78%" },
  { key: "front_left_calf", label: "ふくらはぎ", left: "45%", top: "89%" },
  { key: "front_right_calf", label: "ふくらはぎ", left: "55%", top: "89%" },
  { key: "front_left_ankle", label: "足首", left: "45%", top: "97%" },
  { key: "front_right_ankle", label: "足首", left: "55%", top: "97%" },
];

const BACK_POINTS: BodyPoint[] = [
  { key: "back_neck", label: "首", left: "50%", top: "15%" },
  { key: "back_left_shoulder", label: "肩", left: "36%", top: "20%", size: 16 },
  { key: "back_right_shoulder", label: "肩", left: "64%", top: "20%", size: 16 },
  { key: "back_upper_back", label: "背中上部", left: "50%", top: "28%" },
  { key: "back_left_upper_arm", label: "二の腕", left: "24%", top: "28%" },
  { key: "back_right_upper_arm", label: "二の腕", left: "76%", top: "28%" },
  { key: "back_left_elbow", label: "肘", left: "18%", top: "40%" },
  { key: "back_right_elbow", label: "肘", left: "82%", top: "40%" },
  { key: "back_left_wrist", label: "手首", left: "15%", top: "52%" },
  { key: "back_right_wrist", label: "手首", left: "85%", top: "52%" },
  { key: "back_mid_back", label: "背中下部", left: "50%", top: "40%" },
  { key: "back_lower_back", label: "腰", left: "50%", top: "48%" },
  { key: "back_left_hip", label: "お尻", left: "42%", top: "56%" },
  { key: "back_right_hip", label: "お尻", left: "58%", top: "56%" },
  { key: "back_left_pelvis", label: "骨盤", left: "46%", top: "52%" },
  { key: "back_right_pelvis", label: "骨盤", left: "54%", top: "52%" },
  { key: "back_left_thigh", label: "太もも裏", left: "44%", top: "66%" },
  { key: "back_right_thigh", label: "太もも裏", left: "56%", top: "66%" },
  { key: "back_left_knee", label: "膝", left: "45%", top: "78%" },
  { key: "back_right_knee", label: "膝", left: "55%", top: "78%" },
  { key: "back_left_calf", label: "ふくらはぎ", left: "45%", top: "89%" },
  { key: "back_right_calf", label: "ふくらはぎ", left: "55%", top: "89%" },
  { key: "back_left_ankle", label: "足首", left: "45%", top: "97%" },
  { key: "back_right_ankle", label: "足首", left: "55%", top: "97%" },
];

const emptyForm: FormState = {
  furigana: "",
  full_name: "",
  address: "",
  phone: "",
  emergency_contact_name: "",
  emergency_contact_relation: "",
  occupation: "",

  referral_sources: [],
  referral_source_other: "",

  visit_purposes: [],
  visit_purpose_other: "",

  symptoms: [],
  symptom_other: "",

  body_areas: [],

  concern_since: "",
  preferred_pressure: "",

  session_preferences: [],
  session_preference_other: "",

  medical_histories: [],
  medical_history_other: "",

  major_history_status: "なし",
  major_history_details: "",

  surgery_history_status: "なし",
  surgery_history_details: "",

  pacemaker_status: "なし",

  pregnancy_status: "なし",
  pregnancy_months: "",
  breastfeeding_status: "なし",

  notes: "",
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

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
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

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function normalizeFormFromSheet(sheet: CounselingSheetRow): FormState {
  return {
    furigana: sheet.furigana || "",
    full_name: sheet.full_name || "",
    address: sheet.address || "",
    phone: sheet.phone || "",
    emergency_contact_name: sheet.emergency_contact_name || "",
    emergency_contact_relation: sheet.emergency_contact_relation || "",
    occupation: sheet.occupation || "",

    referral_sources: safeArray(sheet.referral_sources),
    referral_source_other: sheet.referral_source_other || "",

    visit_purposes: safeArray(sheet.visit_purposes),
    visit_purpose_other: sheet.visit_purpose_other || "",

    symptoms: safeArray(sheet.symptoms),
    symptom_other: sheet.symptom_other || "",

    body_areas: safeArray(sheet.body_areas),

    concern_since: sheet.concern_since || "",
    preferred_pressure: sheet.preferred_pressure || "",

    session_preferences: safeArray(sheet.session_preferences),
    session_preference_other: sheet.session_preference_other || "",

    medical_histories: safeArray(sheet.medical_histories),
    medical_history_other: sheet.medical_history_other || "",

    major_history_status: sheet.major_history_status || "なし",
    major_history_details: sheet.major_history_details || "",

    surgery_history_status: sheet.surgery_history_status || "なし",
    surgery_history_details: sheet.surgery_history_details || "",

    pacemaker_status: sheet.pacemaker_status || "なし",

    pregnancy_status: sheet.pregnancy_status || "なし",
    pregnancy_months: sheet.pregnancy_months || "",
    breastfeeding_status: sheet.breastfeeding_status || "なし",

    notes: sheet.notes || "",
  };
}

function silhouetteSvg(view: ViewMode) {
  if (view === "front") {
    return `
      <svg viewBox="0 0 220 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="人体前面">
        <defs>
          <linearGradient id="bodyGradFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fff7ed"/>
            <stop offset="100%" stop-color="#ffffff"/>
          </linearGradient>
        </defs>
        <circle cx="110" cy="52" r="28" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="96" y="79" width="28" height="24" rx="10" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="69" y="100" width="82" height="118" rx="34" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="26" y="108" width="28" height="95" rx="14" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="166" y="108" width="28" height="95" rx="14" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="20" y="194" width="22" height="92" rx="11" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="178" y="194" width="22" height="92" rx="11" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="82" y="218" width="56" height="56" rx="22" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="80" y="269" width="26" height="118" rx="13" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="114" y="269" width="26" height="118" rx="13" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="82" y="387" width="22" height="94" rx="11" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
        <rect x="116" y="387" width="22" height="94" rx="11" fill="url(#bodyGradFront)" stroke="#c2410c" stroke-width="2"/>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 220 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="人体背面">
      <defs>
        <linearGradient id="bodyGradBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      <circle cx="110" cy="52" r="28" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="96" y="79" width="28" height="24" rx="10" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="69" y="100" width="82" height="118" rx="34" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="26" y="108" width="28" height="95" rx="14" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="166" y="108" width="28" height="95" rx="14" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="20" y="194" width="22" height="92" rx="11" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="178" y="194" width="22" height="92" rx="11" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="82" y="218" width="56" height="60" rx="22" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="80" y="278" width="26" height="118" rx="13" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="114" y="278" width="26" height="118" rx="13" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="82" y="396" width="22" height="94" rx="11" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
      <rect x="116" y="396" width="22" height="94" rx="11" fill="url(#bodyGradBack)" stroke="#c2410c" stroke-width="2"/>
    </svg>
  `;
}

function BodyTapMap({
  viewMode,
  selectedAreas,
  onToggle,
}: {
  viewMode: ViewMode;
  selectedAreas: string[];
  onToggle: (label: string) => void;
}) {
  const points = viewMode === "front" ? FRONT_POINTS : BACK_POINTS;
  const svg = silhouetteSvg(viewMode);

  return (
    <div style={bodyFigureCardStyle}>
      <div style={bodyFigureHeaderStyle}>
        <div style={bodyFigureTitleStyle}>正面・背面イメージ</div>
        <div style={bodySwitchWrapStyle}>
          <button
            type="button"
            style={viewMode === "front" ? bodySwitchActiveStyle : bodySwitchStyle}
            onClick={() => onToggle("__switch_front__")}
          >
            前面
          </button>
          <button
            type="button"
            style={viewMode === "back" ? bodySwitchActiveStyle : bodySwitchStyle}
            onClick={() => onToggle("__switch_back__")}
          >
            背面
          </button>
        </div>
      </div>

      <div style={bodyFigureWrapStyle}>
        <div
          style={bodySvgWrapStyle}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {points.map((point) => {
          const active = selectedAreas.includes(point.label);
          const size = point.size ?? 18;

          return (
            <button
              key={point.key}
              type="button"
              title={point.label}
              aria-label={point.label}
              onClick={() => onToggle(point.label)}
              style={{
                ...bodyPointStyle,
                width: size,
                height: size,
                left: point.left,
                top: point.top,
                background: active ? "#ef4444" : "rgba(255,255,255,0.95)",
                border: active
                  ? "2px solid #dc2626"
                  : "2px solid rgba(180,83,9,0.30)",
                boxShadow: active
                  ? "0 0 0 6px rgba(239,68,68,0.14)"
                  : "0 6px 16px rgba(15,23,42,0.08)",
              }}
            />
          );
        })}
      </div>

      <div style={bodyFigureTextStyle}>
        人体の赤丸をタップすると選択されます。もう一度タップで解除できます。
      </div>
    </div>
  );
}

export default function CounselingPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const customerId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sheetId, setSheetId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bodyViewMode, setBodyViewMode] = useState<ViewMode>("front");

  const selectedPurposeCount = useMemo(() => form.visit_purposes.length, [form.visit_purposes]);
  const selectedSymptomCount = useMemo(() => form.symptoms.length, [form.symptoms]);
  const selectedBodyAreaCount = useMemo(() => form.body_areas.length, [form.body_areas]);

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
      setError("顧客IDが取得できませんでした。");
      return;
    }

    void init();
  }, [mounted, customerId, router]);

  async function init() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const numericCustomerId = Number(customerId);
      const customerIdForQuery = Number.isNaN(numericCustomerId)
        ? customerId
        : numericCustomerId;

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, kana, phone, email")
        .eq("id", customerIdForQuery)
        .maybeSingle();

      if (customerError) throw customerError;
      if (customerData) {
        const customerRow = customerData as CustomerRow;
        setCustomer(customerRow);
        setForm((prev) => ({
          ...prev,
          full_name: prev.full_name || customerRow.name || "",
          furigana: prev.furigana || customerRow.kana || "",
          phone: prev.phone || customerRow.phone || "",
        }));
      }

      const { data: sheetData, error: sheetError } = await supabase
        .from("counseling_sheets")
        .select("*")
        .eq("customer_id", String(customerId))
        .maybeSingle();

      if (sheetError && sheetError.code !== "PGRST116") throw sheetError;

      if (sheetData) {
        const sheet = sheetData as CounselingSheetRow;
        setSheetId(sheet.id || null);
        setForm(normalizeFormFromSheet(sheet));
      }
    } catch (e) {
      console.error(e);
      setError(`読み込みエラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function toggleMultiField(
    key:
      | "referral_sources"
      | "visit_purposes"
      | "symptoms"
      | "body_areas"
      | "session_preferences"
      | "medical_histories",
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: toggleValue(prev[key], value),
    }));
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      full_name: customer?.name || "",
      furigana: customer?.kana || "",
      phone: customer?.phone || "",
    });
    setBodyViewMode("front");
    setSuccess("");
    setError("");
  }

  function handleBodyMapAction(value: string) {
    if (value === "__switch_front__") {
      setBodyViewMode("front");
      return;
    }
    if (value === "__switch_back__") {
      setBodyViewMode("back");
      return;
    }
    toggleMultiField("body_areas", value);
  }

  async function handleSave() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    if (!customerId) {
      setError("顧客IDが取得できません。");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.full_name.trim()) {
        setError("氏名を入力してください。");
        return;
      }

      const payload = {
        customer_id: String(customerId),
        furigana: form.furigana.trim() || null,
        full_name: form.full_name.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_relation: form.emergency_contact_relation.trim() || null,
        occupation: form.occupation || null,

        referral_sources: form.referral_sources,
        referral_source_other: form.referral_source_other.trim() || null,

        visit_purposes: form.visit_purposes,
        visit_purpose_other: form.visit_purpose_other.trim() || null,

        symptoms: form.symptoms,
        symptom_other: form.symptom_other.trim() || null,

        body_areas: form.body_areas,

        concern_since: form.concern_since || null,
        preferred_pressure: form.preferred_pressure || null,

        session_preferences: form.session_preferences,
        session_preference_other: form.session_preference_other.trim() || null,

        medical_histories: form.medical_histories,
        medical_history_other: form.medical_history_other.trim() || null,

        major_history_status: form.major_history_status || null,
        major_history_details: form.major_history_details.trim() || null,

        surgery_history_status: form.surgery_history_status || null,
        surgery_history_details: form.surgery_history_details.trim() || null,

        pacemaker_status: form.pacemaker_status || null,

        pregnancy_status: form.pregnancy_status || null,
        pregnancy_months: form.pregnancy_months.trim() || null,
        breastfeeding_status: form.breastfeeding_status || null,

        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (sheetId) {
        const { error: updateError } = await supabase
          .from("counseling_sheets")
          .update(payload)
          .eq("id", sheetId);

        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("counseling_sheets")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        setSheetId(data.id);
      }

      setSuccess("カウンセリングシートを保存しました。");
    } catch (e) {
      console.error(e);
      setError(`保存エラー: ${extractErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <main
      style={{
        ...BG_STYLE,
        minHeight: "100vh",
        padding: "24px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <section
          style={{
            ...CARD_STYLE,
            borderRadius: 24,
            padding: 22,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={eyebrowStyle}>COUNSELING SHEET</div>
              <h1 style={pageTitleStyle}>カウンセリングシート</h1>
              <p style={pageSubStyle}>
                お客様の状態把握のため、質問へのご回答をお願いいたします。
              </p>
              {customer?.name ? (
                <div style={customerPillStyle}>対象顧客：{customer.name}</div>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => router.push(`/customer/${customerId}`)}
                style={secondaryButtonStyle}
              >
                顧客詳細へ戻る
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={secondaryButtonStyle}
              >
                入力をリセット
              </button>
            </div>
          </div>
        </section>

        {error ? <div style={{ ...alertErrorStyle, marginBottom: 16 }}>{error}</div> : null}
        {success ? <div style={{ ...alertSuccessStyle, marginBottom: 16 }}>{success}</div> : null}

        {loading ? (
          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 22 }}>
            読み込み中...
          </section>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 22 }}>
              <h2 style={sectionTitleStyle}>基本情報</h2>

              <div style={twoColumnGridStyle}>
                <Field label="フリガナ">
                  <input
                    value={form.furigana}
                    onChange={(e) => updateField("furigana", e.target.value)}
                    placeholder="例：ヤマダタロウ"
                    style={inputStyle}
                  />
                </Field>

                <Field label="氏名">
                  <input
                    value={form.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                    placeholder="例：山田 太郎"
                    style={inputStyle}
                  />
                </Field>

                <Field label="住所">
                  <input
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="住所を入力"
                    style={inputStyle}
                  />
                </Field>

                <Field label="お電話">
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="例：09012345678"
                    style={inputStyle}
                  />
                </Field>

                <Field label="緊急連絡先の氏名">
                  <input
                    value={form.emergency_contact_name}
                    onChange={(e) =>
                      updateField("emergency_contact_name", e.target.value)
                    }
                    placeholder="例：山田 花子"
                    style={inputStyle}
                  />
                </Field>

                <Field label="緊急連絡先との関係">
                  <input
                    value={form.emergency_contact_relation}
                    onChange={(e) =>
                      updateField("emergency_contact_relation", e.target.value)
                    }
                    placeholder="例：妻、母、友人"
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div style={{ marginTop: 16 }}>
                <Label>ご職業</Label>
                <div style={chipGridStyle}>
                  {OCCUPATION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateField("occupation", option)}
                      style={form.occupation === option ? chipSelectedStyle : chipStyle}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <Label>当店を知ったきっかけ</Label>
                <div style={chipGridStyle}>
                  {REFERRAL_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleMultiField("referral_sources", option)}
                      style={
                        form.referral_sources.includes(option)
                          ? chipSelectedStyle
                          : chipStyle
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 10 }}>
                  <input
                    value={form.referral_source_other}
                    onChange={(e) =>
                      updateField("referral_source_other", e.target.value)
                    }
                    placeholder="その他のきっかけ"
                    style={inputStyle}
                  />
                </div>
              </div>
            </section>

            <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 22 }}>
              <div style={sectionHeaderRowStyle}>
                <h2 style={sectionTitleStyle}>ご来店の目的</h2>
                <span style={countBadgeStyle}>{selectedPurposeCount}件選択</span>
              </div>

              <div style={chipGridStyle}>
                {PURPOSE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleMultiField("visit_purposes", option)}
                    style={
                      form.visit_purposes.includes(option)
                        ? chipSelectedStyle
                        : chipStyle
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                <input
                  value={form.visit_purpose_other}
                  onChange={(e) =>
                    updateField("visit_purpose_other", e.target.value)
                  }
                  placeholder="その他の目的"
                  style={inputStyle}
                />
              </div>
            </section>

            <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 22 }}>
              <div style={sectionHeaderRowStyle}>
                <h2 style={sectionTitleStyle}>身体について気になる症状</h2>
                <span style={countBadgeStyle}>{selectedSymptomCount}件選択</span>
              </div>

              <div style={chipGridStyle}>
                {SYMPTOM_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleMultiField("symptoms", option)}
                    style={
                      form.symptoms.includes(option)
                        ? chipSelectedStyle
                        : chipStyle
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                <input
                  value={form.symptom_other}
                  onChange={(e) => updateField("symptom_other", e.target.value)}
                  placeholder="その他の症状"
                  style={inputStyle}
                />
              </div>
            </section>

            <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 22 }}>
              <div style={sectionHeaderRowStyle}>
                <h2 style={sectionTitleStyle}>気になる部位</h2>
                <span style={countBadgeStyle}>{selectedBodyAreaCount}件選択</span>
              </div>

              <div style={bodyCardWrapStyle}>
                <BodyTapMap
                  viewMode={bodyViewMode}
                  selectedAreas={form.body_areas}
                  onToggle={handleBodyMapAction}
                />

                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={selectedAreaTitleStyle}>選択中の部位</div>

                  {form.body_areas.length === 0 ? (
                    <div style={bodyEmptyStyle}>まだ選択されていません。</div>
                  ) : (
                    <div style={{ ...chipGridStyle, marginBottom: 14 }}>
                      {form.body_areas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleMultiField("body_areas", area)}
                          style={selectedAreaChipStyle}
                        >
                          {area} ×
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={selectedAreaTitleStyle}>部位ボタンからも選択できます</div>
                  <div style={chipGridStyle}>
                    {BODY_AREA_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleMultiField("body_areas", option)}
                        style={
                          form.body_areas.includes(option)
                            ? chipSelectedStyle
                            : chipStyle
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 22 }}>
              <h2 style={sectionTitleStyle}>改善したい点・施術希望</h2>

              <div style={twoColumnGridStyle}>
                <Field label="いつ頃から気になりましたか？">
                  <div style={chipGridStyle}>
                    {CONCERN_SINCE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField("concern_since", option)}
                        style={form.concern_since === option ? chipSelectedStyle : chipStyle}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="施術の強さのご希望">
                  <div style={chipGridStyle}>
                    {PRESSURE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField("preferred_pressure", option)}
                        style={form.preferred_pressure === option ? chipSelectedStyle : chipStyle}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div style={{ marginTop: 16 }}>
                <Label>施術中の過ごし方について</Label>
                <div style={chipGridStyle}>
                  {SESSION_PREFERENCE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleMultiField("session_preferences", option)}
                      style={
                        form.session_preferences.includes(option)
                          ? chipSelectedStyle
                          : chipStyle
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 10 }}>
                  <input
                    value={form.session_preference_other}
                    onChange={(e) =>
                      updateField("session_preference_other", e.target.value)
                    }
                    placeholder="その他のご希望"
                    style={inputStyle}
                  />
                </div>
              </div>
            </section>

            <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 22 }}>
              <h2 style={sectionTitleStyle}>既往歴・手術歴など</h2>

              <div style={{ marginBottom: 16 }}>
                <Label>今までに下記の病気や怪我をした事はありますか？</Label>
                <div style={chipGridStyle}>
                  {MEDICAL_HISTORY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleMultiField("medical_histories", option)}
                      style={
                        form.medical_histories.includes(option)
                          ? chipSelectedStyle
                          : chipStyle
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 10 }}>
                  <input
                    value={form.medical_history_other}
                    onChange={(e) =>
                      updateField("medical_history_other", e.target.value)
                    }
                    placeholder="その他の病歴・怪我歴"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={twoColumnGridStyle}>
                <Field label="これまでに大きな病気や怪我をした事はありますか？">
                  <div style={chipGridStyle}>
                    {["なし", "あり"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField("major_history_status", option)}
                        style={
                          form.major_history_status === option
                            ? chipSelectedStyle
                            : chipStyle
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={form.major_history_details}
                    onChange={(e) =>
                      updateField("major_history_details", e.target.value)
                    }
                    placeholder="内容を入力"
                    style={{ ...textareaStyle, minHeight: 100, marginTop: 10 }}
                  />
                </Field>

                <Field label="過去に手術の経験はありますか？">
                  <div style={chipGridStyle}>
                    {["なし", "あり"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField("surgery_history_status", option)}
                        style={
                          form.surgery_history_status === option
                            ? chipSelectedStyle
                            : chipStyle
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={form.surgery_history_details}
                    onChange={(e) =>
                      updateField("surgery_history_details", e.target.value)
                    }
                    placeholder="内容を入力"
                    style={{ ...textareaStyle, minHeight: 100, marginTop: 10 }}
                  />
                </Field>
              </div>

              <div style={twoColumnGridStyle}>
                <Field label="ペースメーカーを使用されていますか？">
                  <div style={chipGridStyle}>
                    {["なし", "あり"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField("pacemaker_status", option)}
                        style={
                          form.pacemaker_status === option
                            ? chipSelectedStyle
                            : chipStyle
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="妊娠の可能性はありますか？">
                  <div style={chipGridStyle}>
                    {["なし", "可能性あり", "妊娠中"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField("pregnancy_status", option)}
                        style={
                          form.pregnancy_status === option
                            ? chipSelectedStyle
                            : chipStyle
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <input
                      value={form.pregnancy_months}
                      onChange={(e) => updateField("pregnancy_months", e.target.value)}
                      placeholder="妊娠中の場合：○ヶ月"
                      style={inputStyle}
                    />
                  </div>
                </Field>
              </div>

              <div style={{ marginTop: 16 }}>
                <Label>授乳中ですか？</Label>
                <div style={chipGridStyle}>
                  {["なし", "あり"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateField("breastfeeding_status", option)}
                      style={
                        form.breastfeeding_status === option
                          ? chipSelectedStyle
                          : chipStyle
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 22 }}>
              <h2 style={sectionTitleStyle}>その他・ご要望・配慮事項</h2>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="その他、ご要望、心配事などございましたらご自由にご記入ください。"
                style={{ ...textareaStyle, minHeight: 150 }}
              />
            </section>

            <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 22 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  style={{
                    ...BUTTON_PRIMARY_STYLE,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "保存中..." : "カウンセリングシートを保存"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/customer/${customerId}`)}
                  style={secondaryButtonStyle}
                >
                  顧客詳細へ戻る
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={labelStyle}>{children}</div>;
}

const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 900,
  color: "#0f172a",
};

const pageSubStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.8,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.18em",
  color: "#b08968",
  fontWeight: 800,
  marginBottom: 8,
};

const customerPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  marginTop: 14,
  minHeight: 34,
  padding: "0 14px",
  borderRadius: 9999,
  background: "rgba(255,247,237,0.96)",
  border: "1px solid rgba(251,191,146,0.4)",
  color: "#9a3412",
  fontSize: 12,
  fontWeight: 800,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 800,
};

const sectionHeaderRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const countBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 36,
  borderRadius: 9999,
  background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#334155",
  padding: "0 14px",
  fontSize: 12,
  fontWeight: 800,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "#475569",
  fontWeight: 700,
  marginBottom: 8,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 48,
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

const secondaryButtonStyle: CSSProperties = {
  minWidth: 150,
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.92)",
  color: "#334155",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "0 16px",
};

const alertErrorStyle: CSSProperties = {
  background: "rgba(254,226,226,0.92)",
  border: "1px solid rgba(248,113,113,0.28)",
  color: "#b91c1c",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 14,
  lineHeight: 1.7,
};

const alertSuccessStyle: CSSProperties = {
  background: "rgba(220,252,231,0.92)",
  border: "1px solid rgba(74,222,128,0.28)",
  color: "#166534",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 14,
  lineHeight: 1.7,
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const chipGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const chipStyle: CSSProperties = {
  minHeight: 40,
  borderRadius: 9999,
  padding: "0 16px",
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const chipSelectedStyle: CSSProperties = {
  ...chipStyle,
  border: "1px solid rgba(251,191,146,0.65)",
  background: "rgba(255,247,237,0.98)",
  color: "#9a3412",
};

const bodyCardWrapStyle: CSSProperties = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
};

const bodyFigureCardStyle: CSSProperties = {
  width: 290,
  minWidth: 290,
  borderRadius: 20,
  border: "1px solid rgba(251,191,146,0.35)",
  background: "linear-gradient(180deg, rgba(255,247,237,0.88), rgba(255,255,255,0.92))",
  padding: 16,
};

const bodyFigureHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
};

const bodyFigureTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#9a3412",
};

const bodySwitchWrapStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const bodySwitchStyle: CSSProperties = {
  minWidth: 64,
  height: 34,
  borderRadius: 9999,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.96)",
  color: "#475569",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  padding: "0 12px",
};

const bodySwitchActiveStyle: CSSProperties = {
  ...bodySwitchStyle,
  border: "1px solid rgba(251,191,146,0.65)",
  background: "rgba(255,247,237,0.98)",
  color: "#9a3412",
};

const bodyFigureWrapStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 220,
  margin: "0 auto",
  aspectRatio: "220 / 520",
};

const bodySvgWrapStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
};

const bodyPointStyle: CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  borderRadius: "9999px",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const bodyFigureTextStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.7,
  color: "#92400e",
  marginTop: 12,
};

const selectedAreaTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#9a3412",
  marginBottom: 10,
};

const selectedAreaChipStyle: CSSProperties = {
  minHeight: 38,
  borderRadius: 9999,
  padding: "0 14px",
  border: "1px solid rgba(248,113,113,0.28)",
  background: "rgba(254,226,226,0.92)",
  color: "#b91c1c",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const bodyEmptyStyle: CSSProperties = {
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  padding: "0 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#64748b",
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 14,
};