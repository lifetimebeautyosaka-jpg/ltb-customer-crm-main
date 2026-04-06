"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Customer = {
  id: string;
  name?: string | null;
};

type TrainingSession = {
  id: string;
  customer_id: string;
  session_date: string | null;
  body_weight: number | null;
  body_fat?: number | null;
  muscle_mass?: number | null;
  visceral_fat?: number | null;
  summary: string | null;
  next_task: string | null;
  posture_note: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

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

function toNumberOrNull(value: string) {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function metricLabel(label: string, color: string): CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 700,
    color,
    marginBottom: 6,
  };
}

function buildLinePoints(values: number[], width = 560, height = 180, pad = 20) {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((v, i) => {
      const x =
        values.length === 1
          ? width / 2
          : pad + (i * (width - pad * 2)) / (values.length - 1);
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function CustomerTrainingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = String(params?.id ?? "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [error, setError] = useState("");

  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const [sessionDate, setSessionDate] = useState(defaultDate);
  const [bodyWeight, setBodyWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [visceralFat, setVisceralFat] = useState("");
  const [summary, setSummary] = useState("");
  const [nextTask, setNextTask] = useState("");
  const [postureNote, setPostureNote] = useState("");

  const [editing, setEditing] = useState<TrainingSession | null>(null);
  const [editSessionDate, setEditSessionDate] = useState("");
  const [editBodyWeight, setEditBodyWeight] = useState("");
  const [editBodyFat, setEditBodyFat] = useState("");
  const [editMuscleMass, setEditMuscleMass] = useState("");
  const [editVisceralFat, setEditVisceralFat] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editNextTask, setEditNextTask] = useState("");
  const [editPostureNote, setEditPostureNote] = useState("");

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
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, customerId]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      if (!supabase) {
        setError("Supabase環境変数が未設定です。");
        return;
      }

      const [customerRes, sessionsRes] = await Promise.all([
        supabase.from("customers").select("id, name").eq("id", customerId).maybeSingle(),
        supabase
          .from("training_sessions")
          .select("*")
          .eq("customer_id", customerId)
          .order("session_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (customerRes.error) throw customerRes.error;
      if (sessionsRes.error) {
        const msg = sessionsRes.error.message;
        if (msg.includes("body_fat")) throw new Error("training_sessions に body_fat 列がありません。SQLを先に実行してください。");
        if (msg.includes("muscle_mass")) throw new Error("training_sessions に muscle_mass 列がありません。SQLを先に実行してください。");
        if (msg.includes("visceral_fat")) throw new Error("training_sessions に visceral_fat 列がありません。SQLを先に実行してください。");
        throw sessionsRes.error;
      }

      setCustomer((customerRes.data as Customer | null) || null);
      setSessions((sessionsRes.data as TrainingSession[]) || []);

      const copyFrom = searchParams.get("copyFrom");
      if (copyFrom && sessionsRes.data) {
        const hit = (sessionsRes.data as TrainingSession[]).find((s) => String(s.id) === String(copyFrom));
        if (hit) {
          setBodyWeight(hit.body_weight != null ? String(hit.body_weight) : "");
          setBodyFat(hit.body_fat != null ? String(hit.body_fat) : "");
          setMuscleMass(hit.muscle_mass != null ? String(hit.muscle_mass) : "");
          setVisceralFat(hit.visceral_fat != null ? String(hit.visceral_fat) : "");
          setSummary(hit.summary || "");
          setNextTask(hit.next_task || "");
          setPostureNote(hit.posture_note || "");
        }
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "データ取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!supabase) {
      alert("Supabase環境変数が未設定です。");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { error } = await supabase.from("training_sessions").insert({
        customer_id: customerId,
        session_date: sessionDate,
        body_weight: toNumberOrNull(bodyWeight),
        body_fat: toNumberOrNull(bodyFat),
        muscle_mass: toNumberOrNull(muscleMass),
        visceral_fat: toNumberOrNull(visceralFat),
        summary,
        next_task: nextTask,
        posture_note: postureNote,
      });

      if (error) throw error;

      setBodyWeight("");
      setBodyFat("");
      setMuscleMass("");
      setVisceralFat("");
      setSummary("");
      setNextTask("");
      setPostureNote("");

      await loadAll();
      alert("履歴を保存しました。");
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "保存に失敗しました。";
      setError(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(session: TrainingSession) {
    setEditing(session);
    setEditSessionDate(session.session_date || "");
    setEditBodyWeight(session.body_weight != null ? String(session.body_weight) : "");
    setEditBodyFat(session.body_fat != null ? String(session.body_fat) : "");
    setEditMuscleMass(session.muscle_mass != null ? String(session.muscle_mass) : "");
    setEditVisceralFat(session.visceral_fat != null ? String(session.visceral_fat) : "");
    setEditSummary(session.summary || "");
    setEditNextTask(session.next_task || "");
    setEditPostureNote(session.posture_note || "");
  }

  function cancelEdit() {
    setEditing(null);
    setEditSessionDate("");
    setEditBodyWeight("");
    setEditBodyFat("");
    setEditMuscleMass("");
    setEditVisceralFat("");
    setEditSummary("");
    setEditNextTask("");
    setEditPostureNote("");
  }

  async function handleUpdate() {
    if (!supabase || !editing) return;

    try {
      setSaving(true);
      setError("");

      const { error } = await supabase
        .from("training_sessions")
        .update({
          session_date: editSessionDate,
          body_weight: toNumberOrNull(editBodyWeight),
          body_fat: toNumberOrNull(editBodyFat),
          muscle_mass: toNumberOrNull(editMuscleMass),
          visceral_fat: toNumberOrNull(editVisceralFat),
          summary: editSummary,
          next_task: editNextTask,
          posture_note: editPostureNote,
        })
        .eq("id", editing.id);

      if (error) throw error;

      cancelEdit();
      await loadAll();
      alert("履歴を更新しました。");
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "更新に失敗しました。";
      setError(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    if (!window.confirm("この履歴を削除しますか？")) return;

    try {
      setSaving(true);
      setError("");

      const { error } = await supabase.from("training_sessions").delete().eq("id", id);
      if (error) throw error;

      await loadAll();
      alert("履歴を削除しました。");
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "削除に失敗しました。";
      setError(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  const chartData = useMemo(() => {
    const asc = [...sessions].reverse();
    return {
      labels: asc.map((s) => formatDate(s.session_date)),
      weight: asc.map((s) => (s.body_weight != null ? Number(s.body_weight) : null)).filter((v): v is number => v != null),
      bodyFat: asc.map((s) => (s.body_fat != null ? Number(s.body_fat) : null)).filter((v): v is number => v != null),
      muscleMass: asc.map((s) => (s.muscle_mass != null ? Number(s.muscle_mass) : null)).filter((v): v is number => v != null),
      visceralFat: asc.map((s) => (s.visceral_fat != null ? Number(s.visceral_fat) : null)).filter((v): v is number => v != null),
    };
  }, [sessions]);

  return (
    <main style={pageStyle}>
      <div style={bgGlowA} />
      <div style={bgGlowB} />

      <div style={containerStyle}>
        <div style={topRowStyle}>
          <Link href={`/customer/${customerId}`} style={backLinkStyle}>
            ← 顧客詳細へ戻る
          </Link>
          <div style={eyebrowStyle}>TRAINING PAGE</div>
        </div>

        <section style={glassStyle}>
          <div style={miniLabelStyle}>GYMUP TRAINING</div>
          <h1 style={titleStyle}>トレーニング履歴</h1>
          <p style={descStyle}>
            {customer?.name ? `${customer.name}様` : "顧客"} の体組成データと履歴を管理します。
          </p>
        </section>

        {error && <div style={errorBoxStyle}>{error}</div>}

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>NEW SESSION</div>
              <h2 style={panelTitleStyle}>履歴追加</h2>
            </div>
          </div>

          <div style={formGridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>日付</label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>体重</label>
              <input value={bodyWeight} onChange={(e) => setBodyWeight(e.target.value)} placeholder="kg" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>体脂肪</label>
              <input value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="%" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>筋肉量</label>
              <input value={muscleMass} onChange={(e) => setMuscleMass(e.target.value)} placeholder="kg" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>内臓脂肪</label>
              <input value={visceralFat} onChange={(e) => setVisceralFat(e.target.value)} placeholder="数値" style={inputStyle} />
            </div>
          </div>

          <div style={{ ...formGridStyle, marginTop: 14 }}>
            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>総評</label>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} style={textareaStyle} />
            </div>
            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>次回課題</label>
              <textarea value={nextTask} onChange={(e) => setNextTask(e.target.value)} rows={3} style={textareaStyle} />
            </div>
            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>姿勢メモ</label>
              <textarea value={postureNote} onChange={(e) => setPostureNote(e.target.value)} rows={3} style={textareaStyle} />
            </div>
          </div>

          <div style={buttonRowStyle}>
            <button style={primaryButtonStyle} onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>BODY GRAPH</div>
              <h2 style={panelTitleStyle}>推移グラフ</h2>
            </div>
          </div>

          <div style={chartGridStyle}>
            {[
              { title: "体重", color: "#2563eb", values: chartData.weight, suffix: "kg" },
              { title: "体脂肪", color: "#db2777", values: chartData.bodyFat, suffix: "%" },
              { title: "筋肉量", color: "#059669", values: chartData.muscleMass, suffix: "kg" },
              { title: "内臓脂肪", color: "#d97706", values: chartData.visceralFat, suffix: "" },
            ].map((chart) => (
              <div key={chart.title} style={chartCardStyle}>
                <div style={metricLabel(chart.title, chart.color)}>{chart.title}</div>
                {chart.values.length === 0 ? (
                  <div style={emptyTextStyle}>データがまだありません</div>
                ) : (
                  <>
                    <svg viewBox="0 0 560 180" style={svgStyle}>
                      <polyline
                        fill="none"
                        stroke={chart.color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={buildLinePoints(chart.values)}
                      />
                    </svg>
                    <div style={chartLatestStyle}>
                      最新値：{chart.values[chart.values.length - 1]}
                      {chart.suffix}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelMiniStyle}>HISTORY</div>
              <h2 style={panelTitleStyle}>履歴一覧</h2>
            </div>
          </div>

          {loading ? (
            <div style={emptyTextStyle}>読み込み中...</div>
          ) : sessions.length === 0 ? (
            <div style={emptyTextStyle}>履歴がまだありません</div>
          ) : (
            <div style={historyListStyle}>
              {sessions.map((s) => (
                <article key={s.id} style={historyCardStyle}>
                  <div style={historyHeaderStyle}>
                    <div>
                      <div style={historyDateStyle}>{formatDate(s.session_date)}</div>
                      <div style={historyMetaStyle}>
                        更新：{formatDateTime(s.updated_at || s.created_at)}
                      </div>
                    </div>
                    <div style={historyButtonWrapStyle}>
                      <button style={editButtonStyle} onClick={() => startEdit(s)}>編集</button>
                      <button style={deleteButtonStyle} onClick={() => handleDelete(s.id)}>削除</button>
                    </div>
                  </div>

                  <div style={metricsGridStyle}>
                    <div style={metricBoxStyle}><div style={smallLabelStyle}>体重</div><div style={smallValueStyle}>{s.body_weight ?? "—"}</div></div>
                    <div style={metricBoxStyle}><div style={smallLabelStyle}>体脂肪</div><div style={smallValueStyle}>{s.body_fat ?? "—"}</div></div>
                    <div style={metricBoxStyle}><div style={smallLabelStyle}>筋肉量</div><div style={smallValueStyle}>{s.muscle_mass ?? "—"}</div></div>
                    <div style={metricBoxStyle}><div style={smallLabelStyle}>内臓脂肪</div><div style={smallValueStyle}>{s.visceral_fat ?? "—"}</div></div>
                  </div>

                  <div style={noteGridStyle}>
                    <div style={noteBoxStyle}>
                      <div style={smallLabelStyle}>総評</div>
                      <div style={noteTextStyle}>{s.summary || "未入力"}</div>
                    </div>
                    <div style={noteBoxStyle}>
                      <div style={smallLabelStyle}>次回課題</div>
                      <div style={noteTextStyle}>{s.next_task || "未入力"}</div>
                    </div>
                    <div style={noteBoxStyle}>
                      <div style={smallLabelStyle}>姿勢メモ</div>
                      <div style={noteTextStyle}>{s.posture_note || "未入力"}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {editing && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={panelMiniStyle}>EDIT SESSION</div>
                <h3 style={panelTitleStyle}>履歴編集</h3>
              </div>
              <button onClick={cancelEdit} style={closeButtonStyle}>✕</button>
            </div>

            <div style={formGridStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>日付</label>
                <input type="date" value={editSessionDate} onChange={(e) => setEditSessionDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>体重</label>
                <input value={editBodyWeight} onChange={(e) => setEditBodyWeight(e.target.value)} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>体脂肪</label>
                <input value={editBodyFat} onChange={(e) => setEditBodyFat(e.target.value)} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>筋肉量</label>
                <input value={editMuscleMass} onChange={(e) => setEditMuscleMass(e.target.value)} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>内臓脂肪</label>
                <input value={editVisceralFat} onChange={(e) => setEditVisceralFat(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ ...formGridStyle, marginTop: 14 }}>
              <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>総評</label>
                <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} rows={4} style={textareaStyle} />
              </div>
              <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>次回課題</label>
                <textarea value={editNextTask} onChange={(e) => setEditNextTask(e.target.value)} rows={3} style={textareaStyle} />
              </div>
              <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>姿勢メモ</label>
                <textarea value={editPostureNote} onChange={(e) => setEditPostureNote(e.target.value)} rows={3} style={textareaStyle} />
              </div>
            </div>

            <div style={buttonRowStyle}>
              <button style={secondaryButtonStyle} onClick={cancelEdit}>キャンセル</button>
              <button style={primaryButtonStyle} onClick={handleUpdate} disabled={saving}>
                {saving ? "保存中..." : "更新する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
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

const glassStyle: CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.75)",
  borderRadius: 28,
  padding: "24px 22px",
  marginBottom: 20,
  boxShadow: "0 18px 40px rgba(148,163,184,0.14)",
  backdropFilter: "blur(10px)",
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

const fieldStyle: CSSProperties = {
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

const buttonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 16,
  flexWrap: "wrap",
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

const chartGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
};

const chartCardStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 16,
};

const svgStyle: CSSProperties = {
  width: "100%",
  height: 180,
  display: "block",
};

const chartLatestStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: "#334155",
  fontWeight: 700,
};

const emptyTextStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 14,
};

const historyListStyle: CSSProperties = {
  display: "grid",
  gap: 16,
};

const historyCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 24,
  padding: 18,
};

const historyHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  flexWrap: "wrap",
  marginBottom: 14,
};

const historyDateStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 6,
};

const historyMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
};

const historyButtonWrapStyle: CSSProperties = {
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

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
  marginBottom: 14,
};

const metricBoxStyle: CSSProperties = {
  borderRadius: 16,
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(148,163,184,0.14)",
  padding: 14,
};

const smallLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 6,
};

const smallValueStyle: CSSProperties = {
  fontSize: 18,
  color: "#0f172a",
  fontWeight: 800,
};

const noteGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const noteBoxStyle: CSSProperties = {
  borderRadius: 16,
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(148,163,184,0.14)",
  padding: 14,
};

const noteTextStyle: CSSProperties = {
  fontSize: 14,
  color: "#334155",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
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