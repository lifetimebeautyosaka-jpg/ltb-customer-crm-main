"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

const emptyRow = (): TrainingSetRow => ({
  rowId: crypto.randomUUID(),
  category: "",
  exercise_name: "",
  set_count: "",
  reps: "",
  weight: "",
  seconds: "",
  memo: "",
});

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

function sessionToForm(session: TrainingSession) {
  const sets = safeArray(session.training_sets)
    .sort((a, b) => (a.row_order ?? 0) - (b.row_order ?? 0))
    .map((set) => ({
      rowId: set.row_id || crypto.randomUUID(),
      category: set.category || "",
      exercise_name: set.exercise_name || "",
      set_count: set.set_count !== null && set.set_count !== undefined ? String(set.set_count) : "",
      reps: set.reps || "",
      weight: set.weight || "",
      seconds: set.seconds || "",
      memo: set.memo || "",
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
    setRows: sets.length > 0 ? sets : [emptyRow()],
    postureImageUrls: safeArray(session.posture_image_urls),
  };
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
  const [setRows, setSetRows] = useState<TrainingSetRow[]>([emptyRow()]);
  const [postureImageUrls, setPostureImageUrls] = useState<string[]>([]);
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
        setSuccess("履歴をコピーしました。必要があれば内容を調整して保存してください。");
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
      const { data, error } = await supabase
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

      if (error) throw error;
      setHistory((data as TrainingSession[]) ?? []);
    } catch (e: unknown) {
      console.error(e);
      setError("トレーニング履歴の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingSessionId(null);
    setSessionDate(new Date().toISOString().slice(0, 10));
    setBodyWeight("");
    setSummary("");
    setNextTask("");
    setPostureNote("");
    setStretchMenu("");
    setSetRows([emptyRow()]);
    setPostureImageUrls([]);
    setError("");
    setSuccess("");
  }

  function applySessionToForm(session: TrainingSession, isEdit: boolean) {
    const form = sessionToForm(session);

    setSessionDate(form.sessionDate || new Date().toISOString().slice(0, 10));
    setBodyWeight(form.bodyWeight);
    setSummary(form.summary);
    setNextTask(form.nextTask);
    setPostureNote(form.postureNote);
    setStretchMenu(form.stretchMenu);
    setSetRows(form.setRows);
    setPostureImageUrls(form.postureImageUrls);
    setEditingSessionId(isEdit ? session.id : null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateRow(rowId: string, key: keyof TrainingSetRow, value: string) {
    setSetRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, [key]: value } : row))
    );
  }

  function addRow() {
    setSetRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(rowId: string) {
    setSetRows((prev) => {
      if (prev.length === 1) return [emptyRow()];
      return prev.filter((row) => row.rowId !== rowId);
    });
  }

  async function handleUploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${customerId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("training-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("training-images").getPublicUrl(fileName);
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }
      }

      setPostureImageUrls((prev) => [...prev, ...uploadedUrls]);
      setSuccess("姿勢画像をアップロードしました。");
    } catch (e: unknown) {
      console.error(e);
      setError("画像アップロードに失敗しました。Storage設定を確認してください。");
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
        const { data: inserted, error: insertError } = await supabase
          .from("training_sessions")
          .insert(sessionPayload)
          .select("id")
          .single();

        if (insertError) throw insertError;
        sessionId = inserted.id;
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

      setSuccess(editingSessionId ? "履歴を更新しました。" : "トレーニング履歴を保存しました。");
      resetForm();
      await loadHistory();
    } catch (e: unknown) {
      console.error(e);
      setError("保存に失敗しました。カラム名やSupabase設定を確認してください。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
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
        resetForm();
      }

      setSuccess("履歴を削除しました。");
      await loadHistory();
    } catch (e: unknown) {
      console.error(e);
      setError("履歴の削除に失敗しました。");
    }
  }

  const formTitle = editingSessionId ? "トレーニング履歴を編集" : "トレーニング履歴を登録";

  const totalExerciseCount = useMemo(() => {
    return setRows.filter((row) => row.exercise_name.trim()).length;
  }, [setRows]);

  if (!mounted) return null;

  return (
    <main
      style={{
        ...BG,
        minHeight: "100vh",
        padding: "24px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            ...CARD,
            borderRadius: 26,
            padding: 20,
            marginBottom: 18,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(248,250,252,0.78))",
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
                {formTitle}
              </h1>
              <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 14 }}>
                セッション情報・ストレッチ項目・種目テーブル・総評・画像をまとめて管理できます
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/customer/${customerId}`} style={{ textDecoration: "none" }}>
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
                  顧客詳細へ戻る
                </button>
              </Link>

              <button
                onClick={resetForm}
                type="button"
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
                新規入力に戻す
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              ...CARD,
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

        {success && (
          <div
            style={{
              ...CARD,
              marginBottom: 16,
              borderRadius: 20,
              padding: 16,
              color: "#065f46",
              background:
                "linear-gradient(135deg, rgba(236,253,245,0.95), rgba(220,252,231,0.88))",
              border: "1px solid rgba(16,185,129,0.22)",
            }}
          >
            {success}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ ...CARD, borderRadius: 26, padding: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                SESSION INFO
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ color: "#334155", fontWeight: 700, fontSize: 14 }}>
                    セッション日
                  </span>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ color: "#334155", fontWeight: 700, fontSize: 14 }}>
                    体重（kg）
                  </span>
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
                  <span style={{ color: "#334155", fontWeight: 700, fontSize: 14 }}>
                    ストレッチ項目
                  </span>
                  <textarea
                    value={stretchMenu}
                    onChange={(e) => setStretchMenu(e.target.value)}
                    placeholder={"1行に1項目ずつ入力\n例：股関節ストレッチ\n胸椎回旋"}
                    style={{ ...textareaStyle, minHeight: 110 }}
                  />
                </label>
              </div>
            </div>

            <div style={{ ...CARD, borderRadius: 26, padding: 20 }}>
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
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    TRAINING SETS
                  </div>
                  <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>
                    種目テーブル
                  </h2>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(59,130,246,0.08)",
                      color: "#1d4ed8",
                      fontWeight: 800,
                    }}
                  >
                    入力種目数：{totalExerciseCount}
                  </span>
                  <button type="button" onClick={addRow} style={BUTTON_PRIMARY}>
                    行を追加
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 980 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "140px 170px 100px 100px 100px 100px 1fr 90px",
                      gap: 10,
                      marginBottom: 10,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#64748b",
                      padding: "0 6px",
                    }}
                  >
                    <div>カテゴリ</div>
                    <div>種目名</div>
                    <div>セット数</div>
                    <div>回数</div>
                    <div>重量</div>
                    <div>秒数</div>
                    <div>メモ</div>
                    <div>操作</div>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    {setRows.map((row) => (
                      <div
                        key={row.rowId}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "140px 170px 100px 100px 100px 100px 1fr 90px",
                          gap: 10,
                          background: "rgba(255,255,255,0.68)",
                          border: "1px solid rgba(148,163,184,0.16)",
                          borderRadius: 18,
                          padding: 10,
                        }}
                      >
                        <input
                          value={row.category}
                          onChange={(e) => updateRow(row.rowId, "category", e.target.value)}
                          placeholder="例：下半身"
                          style={tableInputStyle}
                        />
                        <input
                          value={row.exercise_name}
                          onChange={(e) =>
                            updateRow(row.rowId, "exercise_name", e.target.value)
                          }
                          placeholder="例：スクワット"
                          style={tableInputStyle}
                        />
                        <input
                          value={row.set_count}
                          onChange={(e) => updateRow(row.rowId, "set_count", e.target.value)}
                          placeholder="3"
                          style={tableInputStyle}
                        />
                        <input
                          value={row.reps}
                          onChange={(e) => updateRow(row.rowId, "reps", e.target.value)}
                          placeholder="10回"
                          style={tableInputStyle}
                        />
                        <input
                          value={row.weight}
                          onChange={(e) => updateRow(row.rowId, "weight", e.target.value)}
                          placeholder="40kg"
                          style={tableInputStyle}
                        />
                        <input
                          value={row.seconds}
                          onChange={(e) => updateRow(row.rowId, "seconds", e.target.value)}
                          placeholder="30秒"
                          style={tableInputStyle}
                        />
                        <input
                          value={row.memo}
                          onChange={(e) => updateRow(row.rowId, "memo", e.target.value)}
                          placeholder="フォーム意識など"
                          style={tableInputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => removeRow(row.rowId)}
                          style={{
                            border: "none",
                            borderRadius: 12,
                            background: "rgba(239,68,68,0.12)",
                            color: "#b91c1c",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...CARD, borderRadius: 26, padding: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                REVIEW & TASK
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ color: "#334155", fontWeight: 700, fontSize: 14 }}>
                    総評
                  </span>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="本日の総評を入力"
                    style={{ ...textareaStyle, minHeight: 120 }}
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ color: "#334155", fontWeight: 700, fontSize: 14 }}>
                    次回課題
                  </span>
                  <textarea
                    value={nextTask}
                    onChange={(e) => setNextTask(e.target.value)}
                    placeholder="次回に向けた課題を入力"
                    style={{ ...textareaStyle, minHeight: 120 }}
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ color: "#334155", fontWeight: 700, fontSize: 14 }}>
                    姿勢メモ
                  </span>
                  <textarea
                    value={postureNote}
                    onChange={(e) => setPostureNote(e.target.value)}
                    placeholder="姿勢・可動域・左右差などのメモ"
                    style={{ ...textareaStyle, minHeight: 120 }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ ...CARD, borderRadius: 26, padding: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                POSTURE IMAGE
              </div>

              <label
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                <span style={{ color: "#334155", fontWeight: 700, fontSize: 14 }}>
                  姿勢画像アップロード
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => void handleUploadFiles(e.target.files)}
                  style={inputStyle}
                />
              </label>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                {uploading ? "アップロード中..." : "複数画像アップロードOK"}
              </div>

              {postureImageUrls.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          border: "none",
                          borderRadius: 999,
                          background: "rgba(15,23,42,0.78)",
                          color: "#fff",
                          padding: "8px 10px",
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ ...CARD, borderRadius: 26, padding: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                SAVE ACTION
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  style={{
                    ...BUTTON_PRIMARY,
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
                    onClick={resetForm}
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
                    編集をやめて新規入力に戻す
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="history"
          style={{
            ...CARD,
            borderRadius: 28,
            padding: 22,
            marginTop: 18,
          }}
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
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                TRAINING HISTORY
              </div>
              <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>
                履歴一覧
              </h2>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              {loading ? "読み込み中..." : `履歴 ${history.length}件`}
            </div>
          </div>

          {loading ? (
            <div style={{ color: "#475569" }}>読み込み中です...</div>
          ) : history.length === 0 ? (
            <div
              style={{
                borderRadius: 20,
                padding: 18,
                background: "rgba(255,255,255,0.62)",
                border: "1px solid rgba(148,163,184,0.16)",
                color: "#475569",
              }}
            >
              まだ履歴はありません。
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {history.map((session) => {
                const sets = safeArray(session.training_sets).sort(
                  (a, b) => (a.row_order ?? 0) - (b.row_order ?? 0)
                );
                const images = safeArray(session.posture_image_urls);

                return (
                  <article
                    key={session.id}
                    style={{
                      background: "rgba(255,255,255,0.72)",
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
                        flexWrap: "wrap",
                        gap: 12,
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
                            種目数：{sets.length}
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
                            更新：{formatDateTime(session.updated_at || session.created_at)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => applySessionToForm(session, false)}
                          style={{
                            padding: "12px 16px",
                            borderRadius: 14,
                            border: "1px solid rgba(59,130,246,0.24)",
                            background: "rgba(239,246,255,0.95)",
                            color: "#1d4ed8",
                            cursor: "pointer",
                            fontWeight: 800,
                          }}
                        >
                          履歴コピー
                        </button>

                        <button
                          type="button"
                          onClick={() => applySessionToForm(session, true)}
                          style={{
                            padding: "12px 16px",
                            borderRadius: 14,
                            border: "1px solid rgba(15,23,42,0.14)",
                            background: "rgba(255,255,255,0.88)",
                            color: "#0f172a",
                            cursor: "pointer",
                            fontWeight: 800,
                          }}
                        >
                          編集する
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDeleteSession(session.id)}
                          style={{
                            padding: "12px 16px",
                            borderRadius: 14,
                            border: "1px solid rgba(239,68,68,0.18)",
                            background: "rgba(254,242,242,0.95)",
                            color: "#b91c1c",
                            cursor: "pointer",
                            fontWeight: 800,
                          }}
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
                      <div
                        style={{
                          background: "rgba(248,250,252,0.92)",
                          border: "1px solid rgba(148,163,184,0.14)",
                          borderRadius: 18,
                          padding: 14,
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 10 }}>
                          種目一覧
                        </div>

                        {sets.length === 0 ? (
                          <div style={{ color: "#64748b", fontSize: 14 }}>未登録</div>
                        ) : (
                          <div style={{ display: "grid", gap: 8 }}>
                            {sets.map((set, idx) => (
                              <div
                                key={set.row_id || `${session.id}-${idx}`}
                                style={{
                                  borderRadius: 14,
                                  background: "rgba(255,255,255,0.76)",
                                  border: "1px solid rgba(148,163,184,0.14)",
                                  padding: 12,
                                  color: "#334155",
                                  fontSize: 14,
                                }}
                              >
                                <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
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
                            <div
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                fontWeight: 700,
                                marginTop: 12,
                                marginBottom: 10,
                              }}
                            >
                              ストレッチ項目
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {safeArray(session.stretch_menu).map((item, idx) => (
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
                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>
                          総評
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                          {session.summary || "未入力"}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            fontWeight: 700,
                            marginTop: 14,
                            marginBottom: 8,
                          }}
                        >
                          次回課題
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                          {session.next_task || "未入力"}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            fontWeight: 700,
                            marginTop: 14,
                            marginBottom: 8,
                          }}
                        >
                          姿勢メモ
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                          {session.posture_note || "未入力"}
                        </div>
                      </div>
                    </div>

                    {images.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 10 }}>
                          姿勢画像
                        </div>
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
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(255,255,255,0.82)",
  padding: "12px 14px",
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 16,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(255,255,255,0.82)",
  padding: "14px 16px",
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
};

const tableInputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.22)",
  background: "rgba(255,255,255,0.9)",
  padding: "10px 12px",
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
};