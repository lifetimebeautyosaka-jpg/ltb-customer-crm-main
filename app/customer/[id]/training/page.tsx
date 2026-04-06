"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { BG, CARD, BUTTON_PRIMARY } from "../../../../styles/theme";

type TrainingSetRow = {
  rowId: string;
  category: string | number;
  exercise_name: string | number;
  set_count: string | number;
  reps: string | number;
  weight: string | number;
  seconds: string | number;
  memo: string | number;
};

type TrainingSetDB = {
  id?: string;
  session_id?: string;
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
  body_height?: number | null;
  body_weight: number | null;
  body_fat?: number | null;
  muscle_mass?: number | null;
  visceral_fat?: number | null;
  summary: string | null;
  next_task: string | null;
  posture_note: string | null;
  stretch_menu: string[] | null;
  posture_image_urls: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  training_sets?: TrainingSetDB[];
};

const CATEGORY_OPTIONS = [
  "胸",
  "背中",
  "脚",
  "肩",
  "腕",
  "体幹",
  "有酸素",
  "ストレッチ",
  "その他",
];

const EXERCISE_MAP: Record<string, string[]> = {
  胸: [
    "ベンチプレス",
    "インクラインベンチプレス",
    "ダンベルプレス",
    "ダンベルフライ",
    "チェストプレス",
    "プッシュアップ",
  ],
  背中: [
    "ラットプルダウン",
    "シーテッドロー",
    "ベントオーバーロウ",
    "ワンハンドロウ",
    "チンニング",
    "デッドリフト",
    "ルーマニアンデッドリフト",
  ],
  脚: [
    "スクワット",
    "フロントスクワット",
    "ブルガリアンスクワット",
    "ランジ",
    "ステップアップ",
    "レッグプレス",
    "レッグエクステンション",
    "レッグカール",
    "ヒップスラスト",
    "スミススクワット",
  ],
  肩: [
    "ショルダープレス",
    "サイドレイズ",
    "リアレイズ",
    "フロントレイズ",
    "アップライトロウ",
  ],
  腕: [
    "アームカール",
    "ハンマーカール",
    "トライセプスプレスダウン",
    "フレンチプレス",
  ],
  体幹: [
    "クランチ",
    "レッグレイズ",
    "プランク",
    "サイドプランク",
    "ロシアンツイスト",
  ],
  有酸素: ["バイク", "ウォーキング", "ジョギング"],
  ストレッチ: ["ストレッチ"],
  その他: ["その他"],
};

const ALL_EXERCISES = Array.from(new Set(Object.values(EXERCISE_MAP).flat()));

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

function toSafeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function trimmed(value: unknown): string {
  return toSafeString(value).trim();
}

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

function makeRow(): TrainingSetRow {
  return {
    rowId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    category: "",
    exercise_name: "",
    set_count: "",
    reps: "",
    weight: "",
    seconds: "",
    memo: "",
  };
}

function getExercisesByCategory(category: string) {
  if (!category) return ALL_EXERCISES;
  return EXERCISE_MAP[category] || ["その他"];
}

function toNumberOrNull(value: unknown) {
  const s = trimmed(value);
  if (!s) return null;
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
}

function sessionToForm(session: TrainingSession) {
  const rows = safeArray(session.training_sets)
    .sort((a, b) => (a.row_order ?? 0) - (b.row_order ?? 0))
    .map((item) => ({
      rowId:
        item.row_id ||
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`),
      category: item.category || "",
      exercise_name: item.exercise_name || "",
      set_count:
        item.set_count !== null && item.set_count !== undefined
          ? String(item.set_count)
          : "",
      reps: item.reps || "",
      weight: item.weight || "",
      seconds: item.seconds || "",
      memo: item.memo || "",
    }));

  return {
    sessionDate: session.session_date ? session.session_date.slice(0, 10) : "",
    bodyHeight:
      session.body_height !== null && session.body_height !== undefined
        ? String(session.body_height)
        : "",
    bodyWeight:
      session.body_weight !== null && session.body_weight !== undefined
        ? String(session.body_weight)
        : "",
    bodyFat:
      session.body_fat !== null && session.body_fat !== undefined
        ? String(session.body_fat)
        : "",
    muscleMass:
      session.muscle_mass !== null && session.muscle_mass !== undefined
        ? String(session.muscle_mass)
        : "",
    visceralFat:
      session.visceral_fat !== null && session.visceral_fat !== undefined
        ? String(session.visceral_fat)
        : "",
    summary: session.summary || "",
    nextTask: session.next_task || "",
    postureNote: session.posture_note || "",
    stretchMenu: safeArray(session.stretch_menu).join("\n"),
    postureImageUrls: safeArray(session.posture_image_urls),
    setRows: rows.length > 0 ? rows : [makeRow()],
  };
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

export default function TrainingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawId = params?.id;
  const customerId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [bodyHeight, setBodyHeight] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [visceralFat, setVisceralFat] = useState("");

  const [summary, setSummary] = useState("");
  const [nextTask, setNextTask] = useState("");
  const [postureNote, setPostureNote] = useState("");
  const [stretchMenu, setStretchMenu] = useState("");
  const [postureImageUrls, setPostureImageUrls] = useState<string[]>([]);
  const [setRows, setSetRows] = useState<TrainingSetRow[]>([makeRow()]);
  const [history, setHistory] = useState<TrainingSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

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
      setError("顧客IDが取得できませんでした。顧客詳細ページから開き直してください。");
      return;
    }

    void loadHistory();
  }, [mounted, customerId, router]);

  useEffect(() => {
    if (!mounted || history.length === 0) return;

    const copyFrom = searchParams.get("copyFrom");
    const editId = searchParams.get("edit");

    if (editId) {
      const target = history.find((item) => item.id === editId);
      if (target) applySessionToForm(target, true);
      return;
    }

    if (copyFrom) {
      const target = history.find((item) => item.id === copyFrom);
      if (target) {
        applySessionToForm(target, false);
        setSuccess("履歴をコピーしました。内容を調整して保存できます。");
      }
    }
  }, [history, mounted, searchParams]);

  async function loadHistory() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    if (!customerId) {
      setLoading(false);
      setError("顧客IDが見つかりません。");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("training_sessions")
        .select(
          `
          *,
          training_sets (
            id,
            session_id,
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
        .eq("customer_id", String(customerId))
        .order("session_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setHistory((data as TrainingSession[]) ?? []);
    } catch (e) {
      console.error(e);
      setError(`履歴取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm(clearMessage = false) {
    setEditingSessionId(null);
    setSessionDate(new Date().toISOString().slice(0, 10));
    setBodyHeight("");
    setBodyWeight("");
    setBodyFat("");
    setMuscleMass("");
    setVisceralFat("");
    setSummary("");
    setNextTask("");
    setPostureNote("");
    setStretchMenu("");
    setPostureImageUrls([]);
    setSetRows([makeRow()]);
    setError("");
    if (clearMessage) setSuccess("");
  }

  function applySessionToForm(session: TrainingSession, isEdit: boolean) {
    const form = sessionToForm(session);

    setSessionDate(form.sessionDate || new Date().toISOString().slice(0, 10));
    setBodyHeight(form.bodyHeight);
    setBodyWeight(form.bodyWeight);
    setBodyFat(form.bodyFat);
    setMuscleMass(form.muscleMass);
    setVisceralFat(form.visceralFat);
    setSummary(form.summary);
    setNextTask(form.nextTask);
    setPostureNote(form.postureNote);
    setStretchMenu(form.stretchMenu);
    setPostureImageUrls(form.postureImageUrls);
    setSetRows(form.setRows);
    setEditingSessionId(isEdit ? session.id : null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateRow(rowId: string, key: keyof TrainingSetRow, value: string) {
    setSetRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;

        if (key === "category") {
          const nextExercises = getExercisesByCategory(value);
          const keepExercise =
            trimmed(row.exercise_name) && nextExercises.includes(trimmed(row.exercise_name))
              ? trimmed(row.exercise_name)
              : "";

          return {
            ...row,
            category: value,
            exercise_name: keepExercise,
          };
        }

        return { ...row, [key]: value };
      })
    );
  }

  function addRow() {
    setSetRows((prev) => [...prev, makeRow()]);
  }

  function removeRow(rowId: string) {
    setSetRows((prev) => {
      if (prev.length === 1) return [makeRow()];
      return prev.filter((row) => row.rowId !== rowId);
    });
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const urls: string[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${customerId}/${Date.now()}-${
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random()
        }.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("training-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("training-images")
          .getPublicUrl(fileName);

        if (data.publicUrl) urls.push(data.publicUrl);
      }

      setPostureImageUrls((prev) => [...prev, ...urls]);
      setSuccess("姿勢画像をアップロードしました。");
    } catch (e) {
      console.error(e);
      setError(`画像アップロードエラー: ${extractErrorMessage(e)}`);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setPostureImageUrls((prev) => prev.filter((item) => item !== url));
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
      const stretchMenuArray = trimmed(stretchMenu)
        ? toSafeString(stretchMenu)
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const validRows = setRows.filter((row) => {
        return (
          trimmed(row.category) ||
          trimmed(row.exercise_name) ||
          trimmed(row.set_count) ||
          trimmed(row.reps) ||
          trimmed(row.weight) ||
          trimmed(row.seconds) ||
          trimmed(row.memo)
        );
      });

      const sessionPayload = {
        customer_id: String(customerId),
        session_date: sessionDate || null,
        body_height: toNumberOrNull(bodyHeight),
        body_weight: toNumberOrNull(bodyWeight),
        body_fat: toNumberOrNull(bodyFat),
        muscle_mass: toNumberOrNull(muscleMass),
        visceral_fat: toNumberOrNull(visceralFat),
        summary: trimmed(summary) || null,
        next_task: trimmed(nextTask) || null,
        posture_note: trimmed(postureNote) || null,
        stretch_menu: stretchMenuArray,
        posture_image_urls: postureImageUrls,
      };

      let sessionId = editingSessionId;

      if (editingSessionId) {
        const { error: updateError } = await supabase
          .from("training_sessions")
          .update(sessionPayload)
          .eq("id", editingSessionId);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from("training_sets")
          .delete()
          .eq("session_id", editingSessionId);

        if (deleteError) throw deleteError;
      } else {
        const { data, error: insertError } = await supabase
          .from("training_sessions")
          .insert(sessionPayload)
          .select("id")
          .single();

        if (insertError) throw insertError;
        sessionId = data.id;
      }

      if (!sessionId) throw new Error("セッションIDの取得に失敗しました。");

      if (validRows.length > 0) {
        const rowsPayload = validRows.map((row, index) => ({
          session_id: sessionId,
          row_id: toSafeString(row.rowId),
          row_order: index,
          category: trimmed(row.category) || null,
          exercise_name: trimmed(row.exercise_name) || null,
          set_count: trimmed(row.set_count) ? Number(trimmed(row.set_count)) : null,
          reps: trimmed(row.reps) || null,
          weight: trimmed(row.weight) || null,
          seconds: trimmed(row.seconds) || null,
          memo: trimmed(row.memo) || null,
        }));

        const { error: rowsError } = await supabase
          .from("training_sets")
          .insert(rowsPayload);

        if (rowsError) throw rowsError;
      }

      await loadHistory();
      resetForm(false);
      setSuccess(
        editingSessionId ? "履歴を更新しました。" : "トレーニング履歴を保存しました。"
      );
    } catch (e) {
      console.error(e);
      setError(`保存エラー: ${extractErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sessionId: string) {
    if (!supabase) return;

    const ok = window.confirm("この履歴を削除しますか？");
    if (!ok) return;

    try {
      setError("");
      setSuccess("");

      const { error: deleteSetsError } = await supabase
        .from("training_sets")
        .delete()
        .eq("session_id", sessionId);

      if (deleteSetsError) throw deleteSetsError;

      const { error: deleteSessionError } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", sessionId);

      if (deleteSessionError) throw deleteSessionError;

      if (editingSessionId === sessionId) resetForm(true);

      setSuccess("履歴を削除しました。");
      await loadHistory();
    } catch (e) {
      console.error(e);
      setError(`削除エラー: ${extractErrorMessage(e)}`);
    }
  }

  const exerciseCount = useMemo(() => {
    return setRows.filter((row) => trimmed(row.exercise_name)).length;
  }, [setRows]);

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
                TRAINING SESSION
              </div>
              <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>
                {editingSessionId ? "トレーニング履歴を編集" : "トレーニング履歴を登録"}
              </h1>
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
                onClick={() => resetForm(true)}
                style={secondaryButtonStyle}
              >
                新規入力に戻す
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ ...alertErrorStyle, marginBottom: 16 }}>{error}</div>
        )}
        {success && (
          <div style={{ ...alertSuccessStyle, marginBottom: 16 }}>{success}</div>
        )}

        <div style={{ display: "grid", gap: 18 }}>
          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}>
            <h2 style={sectionTitleStyle}>基本情報</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
              }}
            >
              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>身長（cm）</span>
                <input
                  type="number"
                  step="0.1"
                  value={bodyHeight}
                  onChange={(e) => setBodyHeight(e.target.value)}
                  placeholder="例：170"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>体重（kg）</span>
                <input
                  type="number"
                  step="0.1"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder="例：65.4"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>体脂肪（%）</span>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="例：18.5"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>筋肉量（kg）</span>
                <input
                  type="number"
                  step="0.1"
                  value={muscleMass}
                  onChange={(e) => setMuscleMass(e.target.value)}
                  placeholder="例：48.2"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>内臓脂肪</span>
                <input
                  type="number"
                  step="0.1"
                  value={visceralFat}
                  onChange={(e) => setVisceralFat(e.target.value)}
                  placeholder="例：7"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>セッション日</span>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>ストレッチ項目</span>
                <textarea
                  value={stretchMenu}
                  onChange={(e) => setStretchMenu(e.target.value)}
                  placeholder={"1行に1項目ずつ入力\n例：股関節ストレッチ\n胸椎回旋"}
                  style={{ ...textareaStyle, minHeight: 100 }}
                />
              </label>
            </div>
          </section>

          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <h2 style={sectionTitleStyle}>トレーニング種目</h2>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={countBadgeStyle}>入力種目数：{exerciseCount}</span>
                <button
                  type="button"
                  onClick={addRow}
                  style={BUTTON_PRIMARY_STYLE}
                >
                  行を追加
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {setRows.map((row, index) => {
                const exerciseOptions = getExercisesByCategory(trimmed(row.category));

                return (
                  <div key={toSafeString(row.rowId)} style={exerciseCardStyle}>
                    <div style={exerciseCardHeaderStyle}>
                      <div style={exerciseCardIndexStyle}>種目 {index + 1}</div>
                      <button
                        type="button"
                        onClick={() => removeRow(toSafeString(row.rowId))}
                        style={trainingDeleteButtonStyle}
                      >
                        削除
                      </button>
                    </div>

                    <div style={exerciseCardGridStyle}>
                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={labelStyle}>カテゴリ</span>
                        <select
                          value={toSafeString(row.category)}
                          onChange={(e) =>
                            updateRow(toSafeString(row.rowId), "category", e.target.value)
                          }
                          style={tableInputStyle}
                        >
                          <option value="">選択</option>
                          {CATEGORY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={labelStyle}>種目名</span>
                        <select
                          value={toSafeString(row.exercise_name)}
                          onChange={(e) =>
                            updateRow(toSafeString(row.rowId), "exercise_name", e.target.value)
                          }
                          style={tableInputStyle}
                        >
                          <option value="">
                            {trimmed(row.category) ? "種目を選択" : "先にカテゴリを選択"}
                          </option>
                          {exerciseOptions.map((option) => (
                            <option key={`${trimmed(row.category)}-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={labelStyle}>セット数</span>
                        <input
                          value={toSafeString(row.set_count)}
                          onChange={(e) =>
                            updateRow(toSafeString(row.rowId), "set_count", e.target.value)
                          }
                          placeholder="3"
                          style={tableInputStyle}
                        />
                      </label>

                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={labelStyle}>回数</span>
                        <input
                          value={toSafeString(row.reps)}
                          onChange={(e) =>
                            updateRow(toSafeString(row.rowId), "reps", e.target.value)
                          }
                          placeholder="10回"
                          style={tableInputStyle}
                        />
                      </label>

                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={labelStyle}>重量</span>
                        <input
                          value={toSafeString(row.weight)}
                          onChange={(e) =>
                            updateRow(toSafeString(row.rowId), "weight", e.target.value)
                          }
                          placeholder="40kg"
                          style={tableInputStyle}
                        />
                      </label>

                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={labelStyle}>秒数</span>
                        <input
                          value={toSafeString(row.seconds)}
                          onChange={(e) =>
                            updateRow(toSafeString(row.rowId), "seconds", e.target.value)
                          }
                          placeholder="30秒"
                          style={tableInputStyle}
                        />
                      </label>

                      <label
                        style={{
                          display: "grid",
                          gap: 8,
                          gridColumn: "1 / -1",
                        }}
                      >
                        <span style={labelStyle}>メモ</span>
                        <textarea
                          value={toSafeString(row.memo)}
                          onChange={(e) =>
                            updateRow(toSafeString(row.rowId), "memo", e.target.value)
                          }
                          placeholder="フォーム意識、注意点など"
                          style={{ ...textareaStyle, minHeight: 88 }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}>
            <h2 style={sectionTitleStyle}>総評・次回課題・姿勢</h2>

            <div style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>総評</span>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="本日の総評を入力"
                  style={{ ...textareaStyle, minHeight: 110 }}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>次回課題</span>
                <textarea
                  value={nextTask}
                  onChange={(e) => setNextTask(e.target.value)}
                  placeholder="次回に向けた課題を入力"
                  style={{ ...textareaStyle, minHeight: 110 }}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>姿勢メモ</span>
                <textarea
                  value={postureNote}
                  onChange={(e) => setPostureNote(e.target.value)}
                  placeholder="姿勢・可動域・左右差などのメモ"
                  style={{ ...textareaStyle, minHeight: 110 }}
                />
              </label>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "grid", gap: 10 }}>
                <span style={labelStyle}>姿勢画像アップロード</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => void handleUpload(e.target.files)}
                  style={inputStyle}
                />
              </label>

              <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
                {uploading ? "アップロード中..." : "複数画像アップロードOK"}
              </div>

              {postureImageUrls.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  {postureImageUrls.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      style={{
                        position: "relative",
                        borderRadius: 18,
                        overflow: "hidden",
                        border: "1px solid rgba(148,163,184,0.16)",
                        background: "#fff",
                      }}
                    >
                      <img
                        src={url}
                        alt={`posture-${idx + 1}`}
                        style={{
                          width: "100%",
                          aspectRatio: "3 / 4",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        style={removeImageButtonStyle}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 20,
              }}
            >
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
                {saving
                  ? "保存中..."
                  : editingSessionId
                  ? "更新して保存"
                  : "新規保存"}
              </button>

              {editingSessionId && (
                <button
                  type="button"
                  onClick={() => resetForm(true)}
                  style={secondaryButtonStyle}
                >
                  編集をやめる
                </button>
              )}
            </div>
          </section>

          <section
            id="history"
            style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}
          >
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
              <h2 style={sectionTitleStyle}>履歴一覧</h2>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
                {loading ? "読み込み中..." : `履歴 ${history.length}件`}
              </div>
            </div>

            {loading ? (
              <div style={{ color: "#475569" }}>読み込み中です...</div>
            ) : history.length === 0 ? (
              <div style={emptyBoxStyle}>まだ履歴はありません。</div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {history.map((session) => {
                  const sets = safeArray(session.training_sets).sort(
                    (a, b) => (a.row_order ?? 0) - (b.row_order ?? 0)
                  );
                  const images = safeArray(session.posture_image_urls);

                  return (
                    <article key={session.id} style={historyCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: 12,
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <div style={historyDateStyle}>
                            {formatDate(session.session_date)}
                          </div>
                          <div style={historySubStyle}>
                            体重 {session.body_weight ?? "—"}kg / 体脂肪{" "}
                            {session.body_fat ?? "—"}%
                          </div>
                          <div style={historySubStyle}>
                            筋肉量 {session.muscle_mass ?? "—"}kg / 内臓脂肪{" "}
                            {session.visceral_fat ?? "—"}
                          </div>
                          <div style={historySubStyle}>
                            更新日時 {formatDateTime(session.updated_at || session.created_at)}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => applySessionToForm(session, true)}
                            style={historyActionButtonStyle}
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            onClick={() => applySessionToForm(session, false)}
                            style={historyActionButtonStyle}
                          >
                            コピー
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(session.id)}
                            style={historyDeleteButtonStyle}
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      {(session.summary || session.next_task || session.posture_note) && (
                        <div style={historyTextBlockWrapStyle}>
                          <div style={historyTextBlockStyle}>
                            <div style={historyTextLabelStyle}>総評</div>
                            <div style={historyTextValueStyle}>
                              {session.summary || "—"}
                            </div>
                          </div>
                          <div style={historyTextBlockStyle}>
                            <div style={historyTextLabelStyle}>次回課題</div>
                            <div style={historyTextValueStyle}>
                              {session.next_task || "—"}
                            </div>
                          </div>
                          <div style={historyTextBlockStyle}>
                            <div style={historyTextLabelStyle}>姿勢メモ</div>
                            <div style={historyTextValueStyle}>
                              {session.posture_note || "—"}
                            </div>
                          </div>
                        </div>
                      )}

                      {safeArray(session.stretch_menu).length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={historyTextLabelStyle}>ストレッチ項目</div>
                          <div style={chipWrapStyle}>
                            {safeArray(session.stretch_menu).map((item, idx) => (
                              <span key={`${item}-${idx}`} style={chipStyle}>
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {sets.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={historyTextLabelStyle}>トレーニング種目</div>
                          <div style={setTableWrapStyle}>
                            <table style={setTableStyle}>
                              <thead>
                                <tr>
                                  <th style={thStyle}>カテゴリ</th>
                                  <th style={thStyle}>種目名</th>
                                  <th style={thStyle}>セット数</th>
                                  <th style={thStyle}>回数</th>
                                  <th style={thStyle}>重量</th>
                                  <th style={thStyle}>秒数</th>
                                  <th style={thStyle}>メモ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sets.map((set) => (
                                  <tr key={set.id}>
                                    <td style={tdStyle}>{set.category || "—"}</td>
                                    <td style={tdStyle}>{set.exercise_name || "—"}</td>
                                    <td style={tdStyle}>{set.set_count ?? "—"}</td>
                                    <td style={tdStyle}>{set.reps || "—"}</td>
                                    <td style={tdStyle}>{set.weight || "—"}</td>
                                    <td style={tdStyle}>{set.seconds || "—"}</td>
                                    <td style={tdStyleMemo}>{set.memo || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {images.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={historyTextLabelStyle}>姿勢画像</div>
                          <div style={historyImageGridStyle}>
                            {images.map((url, idx) => (
                              <img
                                key={`${url}-${idx}`}
                                src={url}
                                alt={`history-posture-${idx + 1}`}
                                style={historyImageStyle}
                              />
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
      </div>
    </main>
  );
}

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 800,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "#475569",
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.88)",
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
  background: "rgba(255,255,255,0.88)",
  color: "#0f172a",
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
  resize: "vertical",
  boxSizing: "border-box",
};

const tableInputStyle: CSSProperties = {
  width: "100%",
  height: 46,
  borderRadius: 12,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  padding: "0 12px",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};

const secondaryButtonStyle: CSSProperties = {
  minWidth: 140,
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.88)",
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

const countBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 40,
  borderRadius: 9999,
  background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#334155",
  padding: "0 14px",
  fontSize: 13,
  fontWeight: 700,
};

const exerciseCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.92)",
  borderRadius: 20,
  padding: 16,
  boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
};

const exerciseCardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const exerciseCardIndexStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "#0f172a",
};

const trainingDeleteButtonStyle: CSSProperties = {
  height: 36,
  borderRadius: 12,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(254,242,242,0.95)",
  color: "#b91c1c",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  padding: "0 12px",
};

const removeImageButtonStyle: CSSProperties = {
  position: "absolute",
  right: 10,
  bottom: 10,
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(239,68,68,0.25)",
  background: "rgba(255,255,255,0.95)",
  color: "#b91c1c",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
  padding: "0 12px",
};

const exerciseCardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const emptyBoxStyle: CSSProperties = {
  padding: "18px 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#475569",
  fontSize: 14,
};

const historyCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 22,
  padding: 18,
  boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
};

const historyDateStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 6,
};

const historySubStyle: CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  lineHeight: 1.8,
};

const historyActionButtonStyle: CSSProperties = {
  height: 38,
  borderRadius: 12,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.92)",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  padding: "0 14px",
};

const historyDeleteButtonStyle: CSSProperties = {
  height: 38,
  borderRadius: 12,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(254,242,242,0.95)",
  color: "#b91c1c",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  padding: "0 14px",
};

const historyTextBlockWrapStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 14,
};

const historyTextBlockStyle: CSSProperties = {
  background: "rgba(248,250,252,0.9)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: "12px 14px",
};

const historyTextLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 8,
};

const historyTextValueStyle: CSSProperties = {
  fontSize: 14,
  color: "#0f172a",
  lineHeight: 1.8,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const chipWrapStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 8,
};

const chipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 32,
  borderRadius: 9999,
  background: "rgba(241,245,249,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#334155",
  padding: "0 12px",
  fontSize: 12,
  fontWeight: 700,
};

const setTableWrapStyle: CSSProperties = {
  marginTop: 8,
  overflowX: "auto",
};

const setTableStyle: CSSProperties = {
  width: "100%",
  minWidth: 760,
  borderCollapse: "separate",
  borderSpacing: 0,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  background: "rgba(248,250,252,0.95)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "12px 10px",
  fontSize: 13,
  color: "#0f172a",
  borderBottom: "1px solid rgba(226,232,240,0.8)",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const tdStyleMemo: CSSProperties = {
  ...tdStyle,
  whiteSpace: "normal",
  minWidth: 180,
  lineHeight: 1.7,
};

const historyImageGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  marginTop: 8,
};

const historyImageStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  objectFit: "cover",
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "#fff",
};