"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { BG, CARD, BUTTON_PRIMARY } from "../../../../styles/theme";

type TrainingSetRow = {
  rowId: string;
  category: string;
  exercise_name: string;
  set_count: string;
  reps: string;
  weight: string;
  seconds: string;
  memo: string;
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
  body_weight: number | null;
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

const EXERCISE_OPTIONS = [
  "スクワット",
  "フロントスクワット",
  "ブルガリアンスクワット",
  "ランジ",
  "ステップアップ",
  "レッグプレス",
  "レッグエクステンション",
  "レッグカール",
  "ヒップスラスト",
  "ルーマニアンデッドリフト",
  "デッドリフト",
  "スミススクワット",
  "ベンチプレス",
  "インクラインベンチプレス",
  "ダンベルプレス",
  "ダンベルフライ",
  "チェストプレス",
  "プッシュアップ",
  "ラットプルダウン",
  "シーテッドロー",
  "ベントオーバーロウ",
  "ワンハンドロウ",
  "チンニング",
  "ショルダープレス",
  "サイドレイズ",
  "リアレイズ",
  "フロントレイズ",
  "アップライトロウ",
  "アームカール",
  "ハンマーカール",
  "トライセプスプレスダウン",
  "フレンチプレス",
  "クランチ",
  "レッグレイズ",
  "プランク",
  "サイドプランク",
  "ロシアンツイスト",
  "バイク",
  "ウォーキング",
  "ジョギング",
  "ストレッチ",
  "その他",
];

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
    bodyWeight:
      session.body_weight !== null && session.body_weight !== undefined
        ? String(session.body_weight)
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
  const customerId = String(params?.id ?? "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [bodyWeight, setBodyWeight] = useState("");
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

    const loggedIn = localStorage.getItem("gymup_logged_in");
    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }

    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, customerId]);

  useEffect(() => {
    if (!mounted || history.length === 0) return;

    const copyFrom = searchParams.get("copyFrom");
    const editId = searchParams.get("edit");

    if (editId) {
      const target = history.find((item) => item.id === editId);
      if (target) {
        applySessionToForm(target, true);
      }
      return;
    }

    if (copyFrom) {
      const target = history.find((item) => item.id === copyFrom);
      if (target) {
        applySessionToForm(target, false);
        setSuccess("履歴をコピーしました。内容を調整して保存できます。");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, mounted, searchParams]);

  async function loadHistory() {
    if (!supabase) {
      setLoading(false);
      setError("Supabaseの環境変数が設定されていません。");
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
        .eq("customer_id", customerId)
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
    setBodyWeight("");
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
    setBodyWeight(form.bodyWeight);
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
      prev.map((row) => (row.rowId === rowId ? { ...row, [key]: value } : row))
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

        const { data } = supabase.storage.from("training-images").getPublicUrl(fileName);
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

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const stretchMenuArray = stretchMenu
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const validRows = setRows.filter((row) => {
        return (
          row.category.trim() ||
          row.exercise_name.trim() ||
          row.set_count.trim() ||
          row.reps.trim() ||
          row.weight.trim() ||
          row.seconds.trim() ||
          row.memo.trim()
        );
      });

      const sessionPayload = {
        customer_id: customerId,
        session_date: sessionDate || null,
        body_weight: bodyWeight ? Number(bodyWeight) : null,
        summary: summary.trim() || null,
        next_task: nextTask.trim() || null,
        posture_note: postureNote.trim() || null,
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

      if (!sessionId) {
        throw new Error("セッションIDの取得に失敗しました。");
      }

      if (validRows.length > 0) {
        const rowsPayload = validRows.map((row, index) => ({
          session_id: sessionId,
          row_id: row.rowId,
          row_order: index,
          category: row.category.trim() || null,
          exercise_name: row.exercise_name.trim() || null,
          set_count: row.set_count ? Number(row.set_count) : null,
          reps: row.reps.trim() || null,
          weight: row.weight.trim() || null,
          seconds: row.seconds.trim() || null,
          memo: row.memo.trim() || null,
        }));

        const { error: rowsError } = await supabase
          .from("training_sets")
          .insert(rowsPayload);

        if (rowsError) throw rowsError;
      }

      await loadHistory();
      resetForm(false);
      setSuccess(editingSessionId ? "履歴を更新しました。" : "トレーニング履歴を保存しました。");
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

      if (editingSessionId === sessionId) {
        resetForm(true);
      }

      setSuccess("履歴を削除しました。");
      await loadHistory();
    } catch (e) {
      console.error(e);
      setError(`削除エラー: ${extractErrorMessage(e)}`);
    }
  }

  const exerciseCount = useMemo(() => {
    return setRows.filter((row) => row.exercise_name.trim()).length;
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
              <button type="button" onClick={() => resetForm(true)} style={secondaryButtonStyle}>
                新規入力に戻す
              </button>
            </div>
          </div>
        </div>

        {error && <div style={{ ...alertErrorStyle, marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ ...alertSuccessStyle, marginBottom: 16 }}>{success}</div>}

        <div style={{ display: "grid", gap: 18 }}>
          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}>
            <h2 style={sectionTitleStyle}>基本情報</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>セッション日</span>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
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
                <button type="button" onClick={addRow} style={BUTTON_PRIMARY_STYLE}>
                  行を追加
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {setRows.map((row, index) => (
                <div key={row.rowId} style={exerciseCardStyle}>
                  <div style={exerciseCardHeaderStyle}>
                    <div style={exerciseCardIndexStyle}>種目 {index + 1}</div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.rowId)}
                      style={trainingDeleteButtonStyle}
                    >
                      削除
                    </button>
                  </div>

                  <div style={exerciseCardGridStyle}>
                    <label style={{ display: "grid", gap: 8 }}>
                      <span style={labelStyle}>カテゴリ</span>
                      <select
                        value={row.category}
                        onChange={(e) => updateRow(row.rowId, "category", e.target.value)}
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
                        value={row.exercise_name}
                        onChange={(e) =>
                          updateRow(row.rowId, "exercise_name", e.target.value)
                        }
                        style={tableInputStyle}
                      >
                        <option value="">種目を選択</option>
                        {EXERCISE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: "grid", gap: 8 }}>
                      <span style={labelStyle}>セット数</span>
                      <input
                        value={row.set_count}
                        onChange={(e) => updateRow(row.rowId, "set_count", e.target.value)}
                        placeholder="3"
                        style={tableInputStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: 8 }}>
                      <span style={labelStyle}>回数</span>
                      <input
                        value={row.reps}
                        onChange={(e) => updateRow(row.rowId, "reps", e.target.value)}
                        placeholder="10回"
                        style={tableInputStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: 8 }}>
                      <span style={labelStyle}>重量</span>
                      <input
                        value={row.weight}
                        onChange={(e) => updateRow(row.rowId, "weight", e.target.value)}
                        placeholder="40kg"
                        style={tableInputStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: 8 }}>
                      <span style={labelStyle}>秒数</span>
                      <input
                        value={row.seconds}
                        onChange={(e) => updateRow(row.rowId, "seconds", e.target.value)}
                        placeholder="30秒"
                        style={tableInputStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: 8, gridColumn: "1 / -1" }}>
                      <span style={labelStyle}>メモ</span>
                      <textarea
                        value={row.memo}
                        onChange={(e) => updateRow(row.rowId, "memo", e.target.value)}
                        placeholder="フォーム意識、注意点など"
                        style={{ ...textareaStyle, minHeight: 88 }}
                      />
                    </label>
                  </div>
                </div>
              ))}
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
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
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
                <button type="button" onClick={() => resetForm(true)} style={secondaryButtonStyle}>
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
                          <div style={historyDateStyle}>{formatDate(session.session_date)}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={historyBadgeStyle}>
                              体重：{session.body_weight ? `${session.body_weight} kg` : "—"}
                            </span>
                            <span style={historyBadgeStyle}>種目数：{sets.length}</span>
                            <span style={historyBadgeStyle}>
                              更新：{formatDateTime(session.updated_at || session.created_at)}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => applySessionToForm(session, false)}
                            style={copyButtonStyle}
                          >
                            履歴コピー
                          </button>

                          <button
                            type="button"
                            onClick={() => applySessionToForm(session, true)}
                            style={secondaryButtonStyle}
                          >
                            編集する
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(session.id)}
                            style={dangerButtonStyle}
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                          gap: 14,
                        }}
                      >
                        <div style={historyInnerBoxStyle}>
                          <div style={historyBoxTitleStyle}>種目一覧</div>

                          {sets.length === 0 ? (
                            <div style={{ color: "#64748b", fontSize: 14 }}>未登録</div>
                          ) : (
                            <div style={{ display: "grid", gap: 8 }}>
                              {sets.map((set, idx) => (
                                <div
                                  key={set.row_id || `${session.id}-${idx}`}
                                  style={setItemStyle}
                                >
                                  <div style={setItemTitleStyle}>
                                    {set.exercise_name || "種目名未入力"}
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {set.category && <span>カテゴリ：{set.category}</span>}
                                    {set.set_count !== null && set.set_count !== undefined && (
                                      <span>セット：{set.set_count}</span>
                                    )}
                                    {set.reps && <span>回数：{set.reps}</span>}
                                    {set.weight && <span>重量：{set.weight}</span>}
                                    {set.seconds && <span>秒数：{set.seconds}</span>}
                                  </div>
                                  {set.memo && (
                                    <div style={{ marginTop: 6, color: "#475569" }}>
                                      メモ：{set.memo}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {safeArray(session.stretch_menu).length > 0 && (
                            <>
                              <div style={{ ...historyBoxTitleStyle, marginTop: 12 }}>
                                ストレッチ項目
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {safeArray(session.stretch_menu).map((item, idx) => (
                                  <span key={`${session.id}-stretch-${idx}`} style={stretchBadgeStyle}>
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        <div style={historyInnerBoxStyle}>
                          <div style={historyBoxTitleStyle}>総評</div>
                          <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                            {session.summary || "未入力"}
                          </div>

                          <div style={{ ...historyBoxTitleStyle, marginTop: 14 }}>次回課題</div>
                          <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                            {session.next_task || "未入力"}
                          </div>

                          <div style={{ ...historyBoxTitleStyle, marginTop: 14 }}>姿勢メモ</div>
                          <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                            {session.posture_note || "未入力"}
                          </div>
                        </div>
                      </div>

                      {images.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={historyBoxTitleStyle}>姿勢画像</div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                              gap: 12,
                            }}
                          >
                            {images.map((url, idx) => (
                              <div
                                key={`${session.id}-img-${idx}`}
                                style={{
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
                              </div>
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
  color: "#334155",
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(255,255,255,0.86)",
  padding: "0 14px",
  color: "#0f172a",
  fontSize: 14,
  outline: "none",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(255,255,255,0.86)",
  padding: "12px 14px",
  color: "#0f172a",
  fontSize: 14,
  outline: "none",
  resize: "vertical",
};

const secondaryButtonStyle: CSSProperties = {
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(255,255,255,0.82)",
  color: "#0f172a",
  padding: "0 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(248,113,113,0.22)",
  background: "rgba(254,242,242,0.96)",
  color: "#b91c1c",
  padding: "0 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const alertErrorStyle: CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(254,242,242,0.95)",
  border: "1px solid rgba(248,113,113,0.22)",
  color: "#b91c1c",
  fontWeight: 700,
};

const alertSuccessStyle: CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(236,253,245,0.95)",
  border: "1px solid rgba(16,185,129,0.18)",
  color: "#047857",
  fontWeight: 700,
};

const countBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 42,
  padding: "0 14px",
  borderRadius: 999,
  background: "rgba(59,130,246,0.08)",
  color: "#1d4ed8",
  fontWeight: 800,
  fontSize: 13,
};

const exerciseCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: 20,
  padding: 14,
};

const exerciseCardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const exerciseCardIndexStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#334155",
};

const exerciseCardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const tableInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 42,
  borderRadius: 12,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.92)",
  color: "#0f172a",
  padding: "0 10px",
  outline: "none",
  fontSize: 13,
};

const trainingDeleteButtonStyle: CSSProperties = {
  minWidth: 88,
  height: 40,
  border: "1px solid rgba(254,202,202,0.95)",
  borderRadius: 12,
  background: "rgba(254,242,242,0.95)",
  color: "#b91c1c",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
  padding: "0 12px",
};

const removeImageButtonStyle: CSSProperties = {
  position: "absolute",
  right: 8,
  bottom: 8,
  border: "none",
  borderRadius: 10,
  background: "rgba(15,23,42,0.76)",
  color: "#fff",
  fontSize: 12,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 700,
};

const emptyBoxStyle: CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(148,163,184,0.16)",
  color: "#64748b",
};

const historyCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 24,
  padding: 18,
};

const historyDateStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 6,
};

const historyBadgeStyle: CSSProperties = {
  fontSize: 12,
  background: "rgba(15,23,42,0.06)",
  color: "#334155",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 700,
};

const historyInnerBoxStyle: CSSProperties = {
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(148,163,184,0.14)",
  borderRadius: 18,
  padding: 14,
};

const historyBoxTitleStyle: CSSProperties = {
  fontSize: 13,
  color: "#475569",
  fontWeight: 800,
  marginBottom: 10,
};

const setItemStyle: CSSProperties = {
  borderRadius: 14,
  padding: 10,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(148,163,184,0.14)",
  fontSize: 13,
  color: "#334155",
};

const setItemTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 6,
};

const stretchBadgeStyle: CSSProperties = {
  fontSize: 12,
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(16,185,129,0.08)",
  color: "#047857",
  fontWeight: 700,
};

const copyButtonStyle: CSSProperties = {
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(59,130,246,0.18)",
  background: "rgba(239,246,255,0.96)",
  color: "#1d4ed8",
  padding: "0 16px",
  fontWeight: 700,
  cursor: "pointer",
};