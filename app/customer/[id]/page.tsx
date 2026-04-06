"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type TrainingLog = {
  id: number;
  customer_id: string;
  training_date: string;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  visceral_fat: number | null;
  note: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CustomerRow = {
  id: number | string;
  name?: string | null;
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

function toNumberOrNull(value: string) {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatDateLabel(dateStr?: string | null) {
  if (!dateStr) return "-";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(date);
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function displayMetric(value: number | null | undefined, unit = "") {
  if (value == null) return "-";
  return `${value}${unit}`;
}

export default function CustomerTrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("顧客");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [logs, setLogs] = useState<TrainingLog[]>([]);

  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const [trainingDate, setTrainingDate] = useState(defaultDate);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [visceralFat, setVisceralFat] = useState("");
  const [note, setNote] = useState("");

  const [editingLog, setEditingLog] = useState<TrainingLog | null>(null);
  const [editTrainingDate, setEditTrainingDate] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editBodyFat, setEditBodyFat] = useState("");
  const [editMuscleMass, setEditMuscleMass] = useState("");
  const [editVisceralFat, setEditVisceralFat] = useState("");
  const [editNote, setEditNote] = useState("");

  async function loadCustomerName(id: string) {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("customers")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`顧客取得エラー: ${error.message}`);
    }

    const row = (data as CustomerRow | null) || null;
    setCustomerName(row?.name || "顧客");
  }

  async function loadLogs(id: string) {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("training_logs")
      .select("*")
      .eq("customer_id", id)
      .order("training_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("body_fat")) {
        throw new Error("training_logs テーブルに body_fat 列がありません。列追加SQLを実行してください。");
      }
      if (error.message.includes("muscle_mass")) {
        throw new Error("training_logs テーブルに muscle_mass 列がありません。列追加SQLを実行してください。");
      }
      if (error.message.includes("visceral_fat")) {
        throw new Error("training_logs テーブルに visceral_fat 列がありません。列追加SQLを実行してください。");
      }
      throw new Error(`履歴取得エラー: ${error.message}`);
    }

    setLogs((data as TrainingLog[] | null) || []);
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setErrorMessage("");

        const resolved = await params;
        const id = String(resolved.id || "");
        setCustomerId(id);

        if (!supabase) {
          setErrorMessage("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。");
          return;
        }

        await loadCustomerName(id);
        await loadLogs(id);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "初期化に失敗しました。";
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [params, supabase]);

  async function handleAddLog() {
    if (!supabase || !customerId) return;

    if (!trainingDate) {
      alert("日付を入力してください。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const { error } = await supabase.from("training_logs").insert({
        customer_id: customerId,
        training_date: trainingDate,
        weight: toNumberOrNull(weight),
        body_fat: toNumberOrNull(bodyFat),
        muscle_mass: toNumberOrNull(muscleMass),
        visceral_fat: toNumberOrNull(visceralFat),
        note,
      });

      if (error) {
        if (error.message.includes("body_fat")) {
          throw new Error("training_logs テーブルに body_fat 列がありません。列追加SQLを実行してください。");
        }
        if (error.message.includes("muscle_mass")) {
          throw new Error("training_logs テーブルに muscle_mass 列がありません。列追加SQLを実行してください。");
        }
        if (error.message.includes("visceral_fat")) {
          throw new Error("training_logs テーブルに visceral_fat 列がありません。列追加SQLを実行してください。");
        }
        throw new Error(`登録エラー: ${error.message}`);
      }

      setWeight("");
      setBodyFat("");
      setMuscleMass("");
      setVisceralFat("");
      setNote("");

      await loadLogs(customerId);
      alert("トレーニング履歴を登録しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "登録に失敗しました。";
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(log: TrainingLog) {
    setEditingLog(log);
    setEditTrainingDate(log.training_date || "");
    setEditWeight(log.weight != null ? String(log.weight) : "");
    setEditBodyFat(log.body_fat != null ? String(log.body_fat) : "");
    setEditMuscleMass(log.muscle_mass != null ? String(log.muscle_mass) : "");
    setEditVisceralFat(log.visceral_fat != null ? String(log.visceral_fat) : "");
    setEditNote(log.note || "");
  }

  function closeEditModal() {
    setEditingLog(null);
    setEditTrainingDate("");
    setEditWeight("");
    setEditBodyFat("");
    setEditMuscleMass("");
    setEditVisceralFat("");
    setEditNote("");
  }

  async function handleSaveEdit() {
    if (!supabase || !editingLog || !customerId) return;

    if (!editTrainingDate) {
      alert("日付を入力してください。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const { error } = await supabase
        .from("training_logs")
        .update({
          training_date: editTrainingDate,
          weight: toNumberOrNull(editWeight),
          body_fat: toNumberOrNull(editBodyFat),
          muscle_mass: toNumberOrNull(editMuscleMass),
          visceral_fat: toNumberOrNull(editVisceralFat),
          note: editNote,
        })
        .eq("id", editingLog.id);

      if (error) {
        throw new Error(`更新エラー: ${error.message}`);
      }

      await loadLogs(customerId);
      closeEditModal();
      alert("履歴を更新しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "更新に失敗しました。";
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLog(id: number) {
    if (!supabase || !customerId) return;

    const ok = window.confirm("この履歴を削除しますか？");
    if (!ok) return;

    try {
      setSaving(true);
      setErrorMessage("");

      const { error } = await supabase.from("training_logs").delete().eq("id", id);

      if (error) {
        throw new Error(`削除エラー: ${error.message}`);
      }

      await loadLogs(customerId);
      alert("履歴を削除しました。");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "削除に失敗しました。";
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={bgGlowA} />
      <div style={bgGlowB} />

      <div style={containerStyle}>
        <div style={topRowStyle}>
          <Link href={`/customer/${customerId}`} style={backLinkStyle}>
            ← 顧客詳細へ戻る
          </Link>
          <div style={eyebrowStyle}>TRAINING RECORD</div>
        </div>

        <div style={heroCardStyle}>
          <div style={heroLeftStyle}>
            <div style={miniLabelStyle}>GYMUP TRAINING</div>
            <h1 style={titleStyle}>トレーニング履歴</h1>
            <p style={descStyle}>
              {customerName} 様の体重・体脂肪・筋肉量・内臓脂肪を記録し、あとから編集できます。
            </p>
          </div>
        </div>

        {errorMessage && <div style={errorBoxStyle}>{errorMessage}</div>}

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>NEW RECORD</div>
              <h2 style={panelTitleStyle}>履歴を追加</h2>
            </div>
          </div>

          <div style={formGridStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>日付</label>
              <input type="date" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} style={inputStyle} />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>体重（kg）</label>
              <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="例 68.5" style={inputStyle} />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>体脂肪（%）</label>
              <input value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="例 18.2" style={inputStyle} />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>筋肉量（kg）</label>
              <input value={muscleMass} onChange={(e) => setMuscleMass(e.target.value)} placeholder="例 52.3" style={inputStyle} />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>内臓脂肪</label>
              <input value={visceralFat} onChange={(e) => setVisceralFat(e.target.value)} placeholder="例 8" style={inputStyle} />
            </div>

            <div style={{ ...fieldGroupStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>メモ</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="測定メモ" style={textareaStyle} />
            </div>
          </div>

          <div style={buttonRowStyle}>
            <button onClick={handleAddLog} disabled={saving} style={primaryButtonStyle}>
              {saving ? "保存中..." : "履歴を追加"}
            </button>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>HISTORY</div>
              <h2 style={panelTitleStyle}>履歴一覧</h2>
            </div>
          </div>

          {loading ? (
            <div style={loadingStyle}>読み込み中...</div>
          ) : logs.length === 0 ? (
            <div style={emptyStyle}>まだ履歴がありません。</div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>日付</th>
                    <th style={thStyle}>体重</th>
                    <th style={thStyle}>体脂肪</th>
                    <th style={thStyle}>筋肉量</th>
                    <th style={thStyle}>内臓脂肪</th>
                    <th style={thStyle}>メモ</th>
                    <th style={thStyle}>更新</th>
                    <th style={thStyle}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={tdStyleStrong}>{formatDateLabel(log.training_date)}</td>
                      <td style={tdStyle}>{displayMetric(log.weight, "kg")}</td>
                      <td style={tdStyle}>{displayMetric(log.body_fat, "%")}</td>
                      <td style={tdStyle}>{displayMetric(log.muscle_mass, "kg")}</td>
                      <td style={tdStyle}>{displayMetric(log.visceral_fat)}</td>
                      <td style={tdNoteStyle}>{log.note || "-"}</td>
                      <td style={tdStyle}>{formatDateTime(log.updated_at || log.created_at)}</td>
                      <td style={tdStyle}>
                        <div style={actionButtonWrapStyle}>
                          <button style={editButtonStyle} onClick={() => openEditModal(log)}>
                            編集
                          </button>
                          <button style={deleteButtonStyle} onClick={() => handleDeleteLog(log.id)}>
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingLog && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={panelMiniStyle}>EDIT RECORD</div>
                <h3 style={modalTitleStyle}>履歴を編集</h3>
              </div>
              <button onClick={closeEditModal} style={closeButtonStyle}>
                ✕
              </button>
            </div>

            <div style={formGridStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>日付</label>
                <input type="date" value={editTrainingDate} onChange={(e) => setEditTrainingDate(e.target.value)} style={inputStyle} />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>体重（kg）</label>
                <input value={editWeight} onChange={(e) => setEditWeight(e.target.value)} style={inputStyle} />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>体脂肪（%）</label>
                <input value={editBodyFat} onChange={(e) => setEditBodyFat(e.target.value)} style={inputStyle} />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>筋肉量（kg）</label>
                <input value={editMuscleMass} onChange={(e) => setEditMuscleMass(e.target.value)} style={inputStyle} />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>内臓脂肪</label>
                <input value={editVisceralFat} onChange={(e) => setEditVisceralFat(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ ...fieldGroupStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>メモ</label>
                <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={4} style={textareaStyle} />
              </div>
            </div>

            <div style={buttonRowStyle}>
              <button onClick={closeEditModal} style={secondaryButtonStyle}>
                キャンセル
              </button>
              <button onClick={handleSaveEdit} disabled={saving} style={primaryButtonStyle}>
                {saving ? "保存中..." : "更新する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #eef4ff 0%, #f8fbff 30%, #f3f7ff 65%, #eef2ff 100%)",
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
  background:
    "radial-gradient(circle, rgba(147,197,253,0.22) 0%, rgba(147,197,253,0) 72%)",
  pointerEvents: "none",
};

const bgGlowB: CSSProperties = {
  position: "absolute",
  right: -120,
  top: 80,
  width: 360,
  height: 360,
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(196,181,253,0.18) 0%, rgba(196,181,253,0) 72%)",
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

const heroCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.75)",
  borderRadius: 28,
  padding: "24px 22px",
  marginBottom: 20,
  boxShadow: "0 18px 40px rgba(148,163,184,0.14)",
  backdropFilter: "blur(10px)",
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

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const fieldGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(15,23,42,0.78)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.82)",
  color: "#0f172a",
  padding: "0 14px",
  outline: "none",
  fontSize: 14,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.82)",
  color: "#0f172a",
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
  resize: "vertical",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 16,
  flexWrap: "wrap",
};

const primaryButtonStyle: CSSProperties = {
  minWidth: 140,
  height: 48,
  border: "none",
  borderRadius: 16,
  background: "linear-gradient(135deg, #ffffff, #eaf1ff)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(148,163,184,0.15)",
  padding: "0 16px",
};

const secondaryButtonStyle: CSSProperties = {
  minWidth: 120,
  height: 48,
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: 16,
  background: "rgba(255,255,255,0.84)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "0 16px",
};

const tableWrapStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "separate",
  borderSpacing: 0,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  fontSize: 12,
  color: "rgba(15,23,42,0.56)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.55)",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  fontSize: 13,
  color: "#0f172a",
  borderBottom: "1px solid rgba(226,232,240,0.82)",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const tdStyleStrong: CSSProperties = {
  ...tdStyle,
  fontWeight: 700,
};

const tdNoteStyle: CSSProperties = {
  ...tdStyle,
  whiteSpace: "normal",
  minWidth: 180,
  lineHeight: 1.6,
};

const actionButtonWrapStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const editButtonStyle: CSSProperties = {
  height: 36,
  border: "1px solid rgba(203,213,225,0.95)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  padding: "0 14px",
};

const deleteButtonStyle: CSSProperties = {
  height: 36,
  border: "1px solid rgba(254,202,202,0.95)",
  borderRadius: 12,
  background: "rgba(254,242,242,0.95)",
  color: "#b91c1c",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  padding: "0 14px",
};

const loadingStyle: CSSProperties = {
  padding: "18px 0",
  fontSize: 14,
  color: "rgba(15,23,42,0.62)",
};

const emptyStyle: CSSProperties = {
  padding: "18px 0",
  fontSize: 14,
  color: "rgba(15,23,42,0.62)",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.22)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 1000,
};

const modalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 760,
  background: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(255,255,255,0.85)",
  borderRadius: 24,
  padding: 22,
  boxShadow: "0 24px 60px rgba(15,23,42,0.16)",
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  fontWeight: 800,
};

const closeButtonStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 9999,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 16,
  cursor: "pointer",
};