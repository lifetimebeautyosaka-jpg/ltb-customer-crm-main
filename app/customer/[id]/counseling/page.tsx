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
    setSuccess("");
    setError("");
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
                <div style={bodyFigureCardStyle}>
                  <div style={bodyFigureTitleStyle}>正面・背面イメージ</div>
                  <div style={bodyFigureWrapStyle}>
                    <div style={humanFigureStyle}>◯</div>
                    <div style={humanFigureStyle}>◯</div>
                  </div>
                  <div style={bodyFigureTextStyle}>
                    下の部位ボタンから気になる箇所を選択してください。
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 260 }}>
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
  width: 250,
  minWidth: 250,
  borderRadius: 20,
  border: "1px solid rgba(251,191,146,0.35)",
  background: "linear-gradient(180deg, rgba(255,247,237,0.88), rgba(255,255,255,0.92))",
  padding: 16,
};

const bodyFigureTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#9a3412",
  marginBottom: 10,
};

const bodyFigureWrapStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  alignItems: "center",
  justifyItems: "center",
  minHeight: 180,
};

const humanFigureStyle: CSSProperties = {
  width: 70,
  height: 150,
  borderRadius: 40,
  border: "2px solid rgba(180,83,9,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#b45309",
  fontSize: 28,
  background: "rgba(255,255,255,0.82)",
};

const bodyFigureTextStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.7,
  color: "#92400e",
  marginTop: 10,
};
