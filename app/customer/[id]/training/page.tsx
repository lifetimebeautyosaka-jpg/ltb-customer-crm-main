"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type TrainingSet = {
  id?: string;
  session_id?: string;
  exercise_name: string;
  weight: string;
  reps: string;
  sets: string;
  rpe: string;
  memo: string;
};

type TrainingSession = {
  id: string;
  customer_id: number;
  date: string | null;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  visceral_fat: number | null;
  condition: string | null;
  sleep_hours: number | null;
  note: string | null;

  split_angle: number | null;
  forward_flexion: number | null;
  shoulder_right: number | null;
  shoulder_left: number | null;
  posture_note: string | null;

  summary: string | null;
  next_task: string | null;
  template_name: string | null;
  created_at: string;
  training_sets?: TrainingSet[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const exerciseOptions = [
  "スクワット",
  "ベンチプレス",
  "デッドリフト",
  "ラットプルダウン",
  "シーテッドロー",
  "ワンハンドロー",
  "チェストプレス",
  "インクラインベンチプレス",
  "ダンベルフライ",
  "ショルダープレス",
  "サイドレイズ",
  "リアレイズ",
  "レッグプレス",
  "ブルガリアンスクワット",
  "ヒップスラスト",
  "ルーマニアンデッドリフト",
  "レッグエクステンション",
  "レッグカール",
  "アームカール",
  "ハンマーカール",
  "トライセプスプレスダウン",
  "フレンチプレス",
  "プランク",
  "クランチ",
  "ストレッチ",
  "開脚ストレッチ",
  "肩可動域改善",
  "体幹トレーニング",
];

const emptySetRow = (): TrainingSet => ({
  exercise_name: "",
  weight: "",
  reps: "",
  sets: "",
  rpe: "",
  memo: "",
});

export default function CustomerTrainingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id;
  const copySessionId = searchParams.get("copy");

  const customerId = useMemo(() => {
    if (Array.isArray(rawId)) return Number(rawId[0]);
    return Number(rawId);
  }, [rawId]);

  const [mounted, setMounted] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bodyWeight, setBodyWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [visceralFat, setVisceralFat] = useState("");
  const [condition, setCondition] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [note, setNote] = useState("");

  const [splitAngle, setSplitAngle] = useState("");
  const [forwardFlexion, setForwardFlexion] = useState("");
  const [shoulderRight, setShoulderRight] = useState("");
  const [shoulderLeft, setShoulderLeft] = useState("");
  const [postureNote, setPostureNote] = useState("");

  const [summary, setSummary] = useState("");
  const [nextTask, setNextTask] = useState("");
  const [templateName, setTemplateName] = useState("");

  const [setRows, setSetRows] = useState<TrainingSet[]>([
    emptySetRow(),
    emptySetRow(),
    emptySetRow(),
  ]);

  const [history, setHistory] = useState<TrainingSession[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    const loggedIn =
      localStorage.getItem("gymup_logged_in") ||
      localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!customerId || Number.isNaN(customerId)) return;
    fetchHistory();
  }, [mounted, customerId]);

  useEffect(() => {
    if (!mounted) return;
    if (!copySessionId) return;
    if (history.length === 0) return;

    const target = history.find((item) => item.id === copySessionId);
    if (!target) return;

    applyCopyFromHistory(target);
  }, [mounted, copySessionId, history]);

  const fetchHistory = async () => {
    if (!supabase) {
      setErrorMessage("Supabase環境変数が未設定です。");
      setLoadingHistory(false);
      return;
    }

    try {
      setLoadingHistory(true);
      setErrorMessage("");

      const { data: sessions, error: sessionsError } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("customer_id", customerId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      const sessionIds = (sessions || []).map((s) => s.id);

      let setsMap: Record<string, TrainingSet[]> = {};

      if (sessionIds.length > 0) {
        const { data: setsData, error: setsError } = await supabase
          .from("training_sets")
          .select("*")
          .in("session_id", sessionIds)
          .order("created_at", { ascending: true });

        if (setsError) throw setsError;

        setsMap = (setsData || []).reduce((acc: Record<string, TrainingSet[]>, item: any) => {
          const key = item.session_id;
          if (!acc[key]) acc[key] = [];
          acc[key].push({
            id: item.id,
            session_id: item.session_id,
            exercise_name: item.exercise_name ?? "",
            weight: item.weight != null ? String(item.weight) : "",
            reps: item.reps != null ? String(item.reps) : "",
            sets: item.sets != null ? String(item.sets) : "",
            rpe: item.rpe != null ? String(item.rpe) : "",
            memo: item.memo ?? "",
          });
          return acc;
        }, {});
      }

      const merged: TrainingSession[] = (sessions || []).map((s: any) => ({
        ...s,
        training_sets: setsMap[s.id] || [],
      }));

      setHistory(merged);
    } catch (error: any) {
      setErrorMessage(error?.message || "履歴の取得に失敗しました。");
    } finally {
      setLoadingHistory(false);
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setBodyWeight("");
    setBodyFat("");
    setMuscleMass("");
    setVisceralFat("");
    setCondition("");
    setSleepHours("");
    setNote("");

    setSplitAngle("");
    setForwardFlexion("");
    setShoulderRight("");
    setShoulderLeft("");
    setPostureNote("");

    setSummary("");
    setNextTask("");
    setTemplateName("");
    setSetRows([emptySetRow(), emptySetRow(), emptySetRow()]);
    setSelectedHistoryId(null);
    setCopyMessage("");
  };

  const addSetRow = () => {
    setSetRows((prev) => [...prev, emptySetRow()]);
  };

  const removeSetRow = (index: number) => {
    setSetRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateSetRow = (
    index: number,
    field: keyof TrainingSet,
    value: string
  ) => {
    setSetRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const toNullableNumber = (value: string) => {
    if (value === "" || value == null) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const applyCopyFromHistory = (item: TrainingSession) => {
    setSummary(item.summary || "");
    setNextTask(item.next_task || "");
    setTemplateName(item.template_name || "");
    setNote(item.note || "");
    setPostureNote(item.posture_note || "");

    const copiedRows =
      item.training_sets && item.training_sets.length > 0
        ? item.training_sets.map((set) => ({
            exercise_name: set.exercise_name || "",
            weight: set.weight || "",
            reps: set.reps || "",
            sets: set.sets || "",
            rpe: set.rpe || "",
            memo: set.memo || "",
          }))
        : [emptySetRow(), emptySetRow(), emptySetRow()];

    setSetRows(copiedRows);
    setSelectedHistoryId(item.id);
    setCopyMessage(`履歴 ${item.date || ""} の内容をコピー中`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!supabase) {
      setErrorMessage("Supabase環境変数が未設定です。");
      return;
    }

    if (!customerId || Number.isNaN(customerId)) {
      setErrorMessage("顧客IDが不正です。");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const sessionPayload = {
        customer_id: customerId,
        date: date || null,
        weight: toNullableNumber(bodyWeight),
        body_fat: toNullableNumber(bodyFat),
        muscle_mass: toNullableNumber(muscleMass),
        visceral_fat: toNullableNumber(visceralFat),
        condition: condition || null,
        sleep_hours: toNullableNumber(sleepHours),
        note: note || null,

        split_angle: toNullableNumber(splitAngle),
        forward_flexion: toNullableNumber(forwardFlexion),
        shoulder_right: toNullableNumber(shoulderRight),
        shoulder_left: toNullableNumber(shoulderLeft),
        posture_note: postureNote || null,

        summary: summary || null,
        next_task: nextTask || null,
        template_name: templateName || null,
      };

      const { data: insertedSession, error: sessionError } = await supabase
        .from("training_sessions")
        .insert(sessionPayload)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const validSets = setRows.filter((row) => {
        return (
          row.exercise_name.trim() ||
          row.weight.trim() ||
          row.reps.trim() ||
          row.sets.trim() ||
          row.rpe.trim() ||
          row.memo.trim()
        );
      });

      if (validSets.length > 0) {
        const setsPayload = validSets.map((row) => ({
          session_id: insertedSession.id,
          exercise_name: row.exercise_name || null,
          weight: toNullableNumber(row.weight),
          reps: row.reps ? Number(row.reps) : null,
          sets: row.sets ? Number(row.sets) : null,
          rpe: toNullableNumber(row.rpe),
          memo: row.memo || null,
        }));

        const { error: setsError } = await supabase
          .from("training_sets")
          .insert(setsPayload);

        if (setsError) throw setsError;
      }

      setSuccessMessage("保存しました。");
      resetForm();
      await fetchHistory();
    } catch (error: any) {
      setErrorMessage(error?.message || "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const renderHistoryDetail = (item: TrainingSession) => {
    const isOpen = selectedHistoryId === item.id;

    return (
      <div
        key={item.id}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          background: "#fff",
          padding: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedHistoryId(isOpen ? null : item.id)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                {item.date || "日付未設定"}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                体重: {item.weight ?? "-"} / 体脂肪: {item.body_fat ?? "-"} / 筋肉量:{" "}
                {item.muscle_mass ?? "-"}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#8b5e3c",
                fontWeight: 700,
                background: "#f7f1eb",
                borderRadius: 9999,
                padding: "6px 10px",
              }}
            >
              {isOpen ? "閉じる" : "詳細を見る"}
            </div>
          </div>
        </button>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={() => applyCopyFromHistory(item)}
            style={{
              border: "none",
              background: "linear-gradient(135deg, #8b5e3c 0%, #c49a6c 100%)",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            この履歴をコピー
          </button>
        </div>

        {isOpen && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <InfoBox label="内臓脂肪" value={item.visceral_fat} />
              <InfoBox label="体調" value={item.condition} />
              <InfoBox label="睡眠時間" value={item.sleep_hours} />
              <InfoBox label="開脚" value={item.split_angle} />
              <InfoBox label="前屈" value={item.forward_flexion} />
              <InfoBox label="肩可動域 右" value={item.shoulder_right} />
              <InfoBox label="肩可動域 左" value={item.shoulder_left} />
              <InfoBox label="テンプレ名" value={item.template_name} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <SectionMiniTitle>姿勢メモ</SectionMiniTitle>
              <HistoryText>{item.posture_note}</HistoryText>
            </div>

            <div style={{ marginBottom: 14 }}>
              <SectionMiniTitle>セッションメモ</SectionMiniTitle>
              <HistoryText>{item.note}</HistoryText>
            </div>

            <div style={{ marginBottom: 14 }}>
              <SectionMiniTitle>トレーニング内容</SectionMiniTitle>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 720,
                    borderCollapse: "collapse",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={thStyle}>種目名</th>
                      <th style={thStyle}>重量</th>
                      <th style={thStyle}>回数</th>
                      <th style={thStyle}>セット数</th>
                      <th style={thStyle}>RPE</th>
                      <th style={thStyle}>メモ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(item.training_sets || []).length > 0 ? (
                      item.training_sets!.map((set, idx) => (
                        <tr key={set.id || idx}>
                          <td style={tdStyle}>{set.exercise_name || "-"}</td>
                          <td style={tdStyle}>{set.weight || "-"}</td>
                          <td style={tdStyle}>{set.reps || "-"}</td>
                          <td style={tdStyle}>{set.sets || "-"}</td>
                          <td style={tdStyle}>{set.rpe || "-"}</td>
                          <td style={tdStyle}>{set.memo || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={tdStyle} colSpan={6}>
                          種目データなし
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <SectionMiniTitle>総評</SectionMiniTitle>
              <HistoryText>{item.summary}</HistoryText>
            </div>

            <div>
              <SectionMiniTitle>次回課題</SectionMiniTitle>
              <HistoryText>{item.next_task}</HistoryText>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8f8f7 0%, #f3efe9 45%, #f8f8f7 100%)",
        padding: "24px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <Link
            href={`/customer/${customerId}`}
            style={{
              display: "inline-block",
              textDecoration: "none",
              color: "#6b7280",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            ← 顧客詳細へ戻る
          </Link>

          <div
            style={{
              background: "#ffffffcc",
              backdropFilter: "blur(8px)",
              border: "1px solid #ece7df",
              borderRadius: 24,
              padding: "24px 20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.16em",
                color: "#8b5e3c",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              TRAINING SESSION
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                lineHeight: 1.3,
                color: "#111827",
              }}
            >
              顧客トレーニング履歴
            </h1>
            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              顧客ID: {customerId || "-"} のセッション記録を入力・保存できます。
            </p>
          </div>
        </div>

        {copyMessage ? (
          <div
            style={{
              marginBottom: 16,
              background: "#fff7ed",
              color: "#9a3412",
              border: "1px solid #fed7aa",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 14,
            }}
          >
            {copyMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div
            style={{
              marginBottom: 16,
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 14,
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div
            style={{
              marginBottom: 16,
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 14,
            }}
          >
            {successMessage}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 20,
          }}
        >
          <section
            style={{
              background: "#fff",
              border: "1px solid #ece7df",
              borderRadius: 24,
              padding: 20,
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <SectionTitle>上部：セッション情報</SectionTitle>

            <div style={grid2Style}>
              <InputBox
                label="日付"
                value={date}
                onChange={setDate}
                type="date"
              />
              <InputBox
                label="体重"
                value={bodyWeight}
                onChange={setBodyWeight}
                placeholder="例 65.2"
              />
              <InputBox
                label="体脂肪率"
                value={bodyFat}
                onChange={setBodyFat}
                placeholder="例 18.5"
              />
              <InputBox
                label="筋肉量"
                value={muscleMass}
                onChange={setMuscleMass}
                placeholder="例 48.3"
              />
              <InputBox
                label="内臓脂肪"
                value={visceralFat}
                onChange={setVisceralFat}
                placeholder="例 7"
              />
              <InputBox
                label="睡眠時間"
                value={sleepHours}
                onChange={setSleepHours}
                placeholder="例 6.5"
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <Label>体調</Label>
              <input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="例 良好 / 少し疲れあり"
                style={inputStyle}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <Label>メモ</Label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="今日の状態・気になる点など"
                style={textareaStyle}
              />
            </div>

            <div style={{ marginTop: 26 }}>
              <SectionTitle>ストレッチ向け項目</SectionTitle>
              <div style={grid2Style}>
                <InputBox
                  label="開脚"
                  value={splitAngle}
                  onChange={setSplitAngle}
                  placeholder="例 120"
                />
                <InputBox
                  label="前屈"
                  value={forwardFlexion}
                  onChange={setForwardFlexion}
                  placeholder="例 10"
                />
                <InputBox
                  label="肩可動域 右"
                  value={shoulderRight}
                  onChange={setShoulderRight}
                  placeholder="例 160"
                />
                <InputBox
                  label="肩可動域 左"
                  value={shoulderLeft}
                  onChange={setShoulderLeft}
                  placeholder="例 155"
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <Label>姿勢メモ</Label>
                <textarea
                  value={postureNote}
                  onChange={(e) => setPostureNote(e.target.value)}
                  rows={3}
                  placeholder="巻き肩、骨盤前傾、左右差など"
                  style={textareaStyle}
                />
              </div>
            </div>
          </section>

          <section
            style={{
              background: "#fff",
              border: "1px solid #ece7df",
              borderRadius: 24,
              padding: 20,
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <SectionTitle>中央：トレーニング入力</SectionTitle>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: 820,
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>種目名</th>
                    <th style={thStyle}>重量</th>
                    <th style={thStyle}>回数</th>
                    <th style={thStyle}>セット数</th>
                    <th style={thStyle}>RPE</th>
                    <th style={thStyle}>メモ</th>
                    <th style={thStyle}>削除</th>
                  </tr>
                </thead>
                <tbody>
                  {setRows.map((row, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>
                        <input
                          list={`exercise-options-${index}`}
                          value={row.exercise_name}
                          onChange={(e) =>
                            updateSetRow(index, "exercise_name", e.target.value)
                          }
                          style={tableInputStyle}
                          placeholder="種目を選択 or 入力"
                        />
                        <datalist id={`exercise-options-${index}`}>
                          {exerciseOptions.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={row.weight}
                          onChange={(e) =>
                            updateSetRow(index, "weight", e.target.value)
                          }
                          style={tableInputStyle}
                          placeholder="50"
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={row.reps}
                          onChange={(e) =>
                            updateSetRow(index, "reps", e.target.value)
                          }
                          style={tableInputStyle}
                          placeholder="10"
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={row.sets}
                          onChange={(e) =>
                            updateSetRow(index, "sets", e.target.value)
                          }
                          style={tableInputStyle}
                          placeholder="3"
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={row.rpe}
                          onChange={(e) =>
                            updateSetRow(index, "rpe", e.target.value)
                          }
                          style={tableInputStyle}
                          placeholder="8"
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={row.memo}
                          onChange={(e) =>
                            updateSetRow(index, "memo", e.target.value)
                          }
                          style={tableInputStyle}
                          placeholder="フォーム注意点など"
                        />
                      </td>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          onClick={() => removeSetRow(index)}
                          style={smallDeleteButtonStyle}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addSetRow}
              style={{
                marginTop: 14,
                border: "1px solid #d6c3b3",
                background: "#faf6f2",
                color: "#6f4e37",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ＋ 種目追加
            </button>

            <div style={{ marginTop: 26 }}>
              <SectionTitle>下部：総評・次回課題</SectionTitle>

              <div style={{ marginTop: 14 }}>
                <Label>テンプレ名</Label>
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="例 下半身強化 / 肩改善"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <Label>総評</Label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="本日の総評"
                  style={textareaStyle}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <Label>次回課題</Label>
                <textarea
                  value={nextTask}
                  onChange={(e) => setNextTask(e.target.value)}
                  rows={4}
                  placeholder="次回の重点ポイント"
                  style={textareaStyle}
                />
              </div>

              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    border: "none",
                    background:
                      "linear-gradient(135deg, #8b5e3c 0%, #c49a6c 100%)",
                    color: "#fff",
                    borderRadius: 14,
                    padding: "14px 22px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 10px 20px rgba(139,94,60,0.22)",
                  }}
                >
                  {saving ? "保存中..." : "保存する"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#374151",
                    borderRadius: 14,
                    padding: "14px 22px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  入力リセット
                </button>
              </div>
            </div>
          </section>
        </div>

        <section
          style={{
            marginTop: 24,
            background: "#fff",
            border: "1px solid #ece7df",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <SectionTitle>履歴一覧</SectionTitle>

          {loadingHistory ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>履歴を読み込み中...</div>
          ) : history.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              まだ履歴はありません。
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              {history.map((item) => renderHistoryDetail(item))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: 20,
        color: "#111827",
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

function SectionMiniTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#8b5e3c",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function HistoryText({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        color: "#374151",
        fontSize: 14,
        whiteSpace: "pre-wrap",
        minHeight: 44,
      }}
    >
      {children || "-"}
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div
      style={{
        background: "#faf7f3",
        border: "1px solid #eee4d8",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#8b5e3c",
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, color: "#111827", fontWeight: 600 }}>
        {value ?? "-"}
      </div>
    </div>
  );
}

function InputBox({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#6f4e37",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

const grid2Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: "0 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: 12,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
};

const thStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: "10px 8px",
  textAlign: "left",
  color: "#374151",
  fontWeight: 700,
  fontSize: 13,
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: 8,
  verticalAlign: "top",
  fontSize: 14,
};

const tableInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 100,
  height: 38,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  padding: "0 10px",
  fontSize: 14,
  boxSizing: "border-box",
};

const smallDeleteButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 700,
  cursor: "pointer",
};