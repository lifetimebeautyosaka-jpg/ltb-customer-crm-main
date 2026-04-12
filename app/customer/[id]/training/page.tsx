"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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

type CustomerRow = {
  id: string | number;
  name?: string | null;
  kana?: string | null;
  height?: number | null;
};

type BodyAreaPoint = {
  id: string;
  label: string;
  top: string;
  left: string;
  side: "front" | "back";
};

type TightAreaLevelMap = Record<string, 1 | 2 | 3>;

const TIGHT_AREA_PREFIX = "__TIGHT_AREAS_V2__:";

const FRONT_BODY_AREAS: BodyAreaPoint[] = [
  { id: "front_neck", label: "首前", top: "8%", left: "50%", side: "front" },

  { id: "front_right_shoulder", label: "右肩前", top: "16%", left: "34%", side: "front" },
  { id: "front_left_shoulder", label: "左肩前", top: "16%", left: "66%", side: "front" },

  { id: "front_chest", label: "胸", top: "22%", left: "50%", side: "front" },

  { id: "front_right_arm", label: "右上腕", top: "28%", left: "22%", side: "front" },
  { id: "front_left_arm", label: "左上腕", top: "28%", left: "78%", side: "front" },

  { id: "front_elbow_r", label: "右ひじ", top: "38%", left: "20%", side: "front" },
  { id: "front_elbow_l", label: "左ひじ", top: "38%", left: "80%", side: "front" },

  { id: "front_forearm_r", label: "右前腕", top: "46%", left: "18%", side: "front" },
  { id: "front_forearm_l", label: "左前腕", top: "46%", left: "82%", side: "front" },

  { id: "front_upper_abs", label: "みぞおち", top: "34%", left: "50%", side: "front" },
  { id: "front_waist", label: "腹部", top: "44%", left: "50%", side: "front" },

  { id: "front_hip_r", label: "右股関節", top: "58%", left: "42%", side: "front" },
  { id: "front_hip_l", label: "左股関節", top: "58%", left: "58%", side: "front" },

  { id: "front_thigh_r", label: "右もも", top: "70%", left: "43%", side: "front" },
  { id: "front_thigh_l", label: "左もも", top: "70%", left: "57%", side: "front" },

  { id: "front_knee_r", label: "右ひざ", top: "82%", left: "44%", side: "front" },
  { id: "front_knee_l", label: "左ひざ", top: "82%", left: "56%", side: "front" },

  { id: "front_shin_r", label: "右すね", top: "92%", left: "44%", side: "front" },
  { id: "front_shin_l", label: "左すね", top: "92%", left: "56%", side: "front" },
];

const BACK_BODY_AREAS: BodyAreaPoint[] = [
  { id: "back_neck", label: "首後", top: "8%", left: "50%", side: "back" },

  { id: "back_right_shoulder", label: "右肩後", top: "16%", left: "34%", side: "back" },
  { id: "back_left_shoulder", label: "左肩後", top: "16%", left: "66%", side: "back" },

  { id: "back_upper_back", label: "肩甲骨", top: "26%", left: "50%", side: "back" },

  { id: "back_arm_r", label: "右上腕", top: "30%", left: "22%", side: "back" },
  { id: "back_arm_l", label: "左上腕", top: "30%", left: "78%", side: "back" },

  { id: "back_elbow_r", label: "右ひじ", top: "40%", left: "20%", side: "back" },
  { id: "back_elbow_l", label: "左ひじ", top: "40%", left: "80%", side: "back" },

  { id: "back_forearm_r", label: "右前腕", top: "48%", left: "18%", side: "back" },
  { id: "back_forearm_l", label: "左前腕", top: "48%", left: "82%", side: "back" },

  { id: "back_mid_back", label: "背中中部", top: "38%", left: "50%", side: "back" },
  { id: "back_lower_back", label: "腰", top: "48%", left: "50%", side: "back" },

  { id: "back_glutes", label: "臀部", top: "60%", left: "50%", side: "back" },

  { id: "back_ham_r", label: "右もも裏", top: "72%", left: "43%", side: "back" },
  { id: "back_ham_l", label: "左もも裏", top: "72%", left: "57%", side: "back" },

  { id: "back_knee_r", label: "右ひざ裏", top: "84%", left: "44%", side: "back" },
  { id: "back_knee_l", label: "左ひざ裏", top: "84%", left: "56%", side: "back" },

  { id: "back_calf_r", label: "右ふくらはぎ", top: "94%", left: "44%", side: "back" },
  { id: "back_calf_l", label: "左ふくらはぎ", top: "94%", left: "56%", side: "back" },
];

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
    "Dベンチプレス",
    "Dインクラインベンチプレス",
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
    "Dブルガリアン",
    "バックランジ",
    "Dバックランジ",
    "レッグプレス",
    "レッグエクステンション",
    "レッグカール",
    "ヒップスラスト",
    "デッドリフト",
    "ルーマニアンデッドリフト",
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

function withUnit(value: unknown, unit: string) {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${unit}`;
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

function normalizeCustomer(row: CustomerRow | null) {
  if (!row) {
    return {
      id: "",
      name: "—",
      kana: "",
      height: "",
    };
  }

  return {
    id: String(row.id ?? ""),
    name: row.name || "—",
    kana: row.kana || "",
    height:
      row.height !== null && row.height !== undefined ? String(row.height) : "",
  };
}

function parseStoredTightAreas(rawPostureNote?: string | null) {
  const raw = rawPostureNote || "";
  if (!raw.startsWith(TIGHT_AREA_PREFIX)) {
    return {
      tightAreaLevels: {} as TightAreaLevelMap,
      postureNote: raw,
    };
  }

  const firstLineEnd = raw.indexOf("\n");
  const firstLine = firstLineEnd === -1 ? raw : raw.slice(0, firstLineEnd);
  const body = firstLine.replace(TIGHT_AREA_PREFIX, "").trim();
  const note = firstLineEnd === -1 ? "" : raw.slice(firstLineEnd + 1);

  try {
    const parsed = JSON.parse(body);
    const mapped: TightAreaLevelMap = {};

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      Object.entries(parsed).forEach(([key, value]) => {
        const num = Number(value);
        if (num === 1 || num === 2 || num === 3) {
          mapped[key] = num as 1 | 2 | 3;
        }
      });
    }

    return {
      tightAreaLevels: mapped,
      postureNote: note,
    };
  } catch {
    return {
      tightAreaLevels: {},
      postureNote: note || raw,
    };
  }
}

function buildStoredPostureNote(note: string, tightAreaLevels: TightAreaLevelMap) {
  const cleanMap: TightAreaLevelMap = {};
  Object.entries(tightAreaLevels).forEach(([key, value]) => {
    if (value === 1 || value === 2 || value === 3) {
      cleanMap[key] = value;
    }
  });

  const head = `${TIGHT_AREA_PREFIX}${JSON.stringify(cleanMap)}`;
  const body = note.trim();
  return body ? `${head}\n${body}` : head;
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

  const parsedPosture = parseStoredTightAreas(session.posture_note);

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
    postureNote: parsedPosture.postureNote || "",
    tightAreaLevels: parsedPosture.tightAreaLevels,
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

function getLevelLabel(level?: number) {
  if (level === 1) return "弱";
  if (level === 2) return "中";
  if (level === 3) return "強";
  return "—";
}

function getHeatColor(level?: number) {
  if (level === 1) return "rgba(250, 204, 21, 0.95)";
  if (level === 2) return "rgba(251, 146, 60, 0.95)";
  if (level === 3) return "rgba(239, 68, 68, 0.96)";
  return "rgba(255,255,255,0.96)";
}

function getHeatShadow(level?: number) {
  if (level === 1) return "0 0 0 6px rgba(250, 204, 21, 0.16)";
  if (level === 2) return "0 0 0 8px rgba(251, 146, 60, 0.18)";
  if (level === 3) return "0 0 0 10px rgba(239, 68, 68, 0.22)";
  return "0 6px 18px rgba(15,23,42,0.08)";
}

function getHeatTextColor(level?: number) {
  if (level === 1 || level === 2 || level === 3) return "#fff";
  return "#334155";
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

  const [customerName, setCustomerName] = useState("—");
  const [customerKana, setCustomerKana] = useState("");
  const [customerBaseHeight, setCustomerBaseHeight] = useState("");

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
  const [tightAreaLevels, setTightAreaLevels] = useState<TightAreaLevelMap>({});
  const [bodySide, setBodySide] = useState<"front" | "back">("front");

  const [stretchMenu, setStretchMenu] = useState("");
  const [postureImageUrls, setPostureImageUrls] = useState<string[]>([]);
  const [setRows, setSetRows] = useState<TrainingSetRow[]>([makeRow()]);
  const [history, setHistory] = useState<TrainingSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const lastRowRef = useRef<HTMLDivElement | null>(null);

  const currentBodyAreas = bodySide === "front" ? FRONT_BODY_AREAS : BACK_BODY_AREAS;

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
      const numericCustomerId = Number(customerId);
      const customerIdForQuery = Number.isNaN(numericCustomerId)
        ? customerId
        : numericCustomerId;

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, kana, height")
        .eq("id", customerIdForQuery)
        .single();

      if (customerError) throw customerError;

      const customer = normalizeCustomer((customerData as CustomerRow) || null);
      setCustomerName(customer.name || "—");
      setCustomerKana(customer.kana || "");
      setCustomerBaseHeight(customer.height || "");

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

      const list = (data as TrainingSession[]) ?? [];
      setHistory(list);

      if (!editingSessionId) {
        const latest = list.find(
          (item) => item.body_height !== null && item.body_height !== undefined
        );

        if (
          latest &&
          latest.body_height !== null &&
          latest.body_height !== undefined
        ) {
          setBodyHeight(String(latest.body_height));
        } else {
          setBodyHeight(customer.height || "");
        }
      }
    } catch (e) {
      console.error(e);
      setError(`取得エラー: ${extractErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm(clearMessage = false) {
    setEditingSessionId(null);
    setSessionDate(new Date().toISOString().slice(0, 10));

    const latest = history.find(
      (item) => item.body_height !== null && item.body_height !== undefined
    );

    setBodyHeight(
      latest && latest.body_height !== null && latest.body_height !== undefined
        ? String(latest.body_height)
        : customerBaseHeight || ""
    );

    setBodyWeight("");
    setBodyFat("");
    setMuscleMass("");
    setVisceralFat("");
    setSummary("");
    setNextTask("");
    setPostureNote("");
    setTightAreaLevels({});
    setBodySide("front");
    setStretchMenu("");
    setPostureImageUrls([]);
    setSetRows([makeRow()]);
    setError("");
    if (clearMessage) setSuccess("");
  }

  function applySessionToForm(session: TrainingSession, isEdit: boolean) {
    const form = sessionToForm(session);

    setSessionDate(form.sessionDate || new Date().toISOString().slice(0, 10));
    setBodyHeight(form.bodyHeight || customerBaseHeight || "");
    setBodyWeight(form.bodyWeight);
    setBodyFat(form.bodyFat);
    setMuscleMass(form.muscleMass);
    setVisceralFat(form.visceralFat);
    setSummary(form.summary);
    setNextTask(form.nextTask);
    setPostureNote(form.postureNote);
    setTightAreaLevels(form.tightAreaLevels);
    setStretchMenu(form.stretchMenu);
    setPostureImageUrls(form.postureImageUrls);
    setSetRows(form.setRows);
    setEditingSessionId(isEdit ? session.id : null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cycleTightAreaLevel(areaId: string) {
    setTightAreaLevels((prev) => {
      const current = prev[areaId];
      const next: TightAreaLevelMap = { ...prev };

      if (!current) {
        next[areaId] = 1;
      } else if (current === 1) {
        next[areaId] = 2;
      } else if (current === 2) {
        next[areaId] = 3;
      } else {
        delete next[areaId];
      }

      return next;
    });
  }

  function clearAllTightAreas() {
    setTightAreaLevels({});
  }

  function updateRow(rowId: string, key: keyof TrainingSetRow, value: string) {
    setSetRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;

        if (key === "category") {
          return {
            ...row,
            category: value,
            exercise_name: "",
          };
        }

        return { ...row, [key]: value };
      })
    );
  }

  function addRow() {
    setSetRows((prev) => [...prev, makeRow()]);
  }

  function addRowAndScroll() {
    addRow();

    setTimeout(() => {
      lastRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
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
        posture_note: buildStoredPostureNote(postureNote, tightAreaLevels),
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
          set_count: trimmed(row.set_count)
            ? Number(trimmed(row.set_count))
            : null,
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
        editingSessionId
          ? "履歴を更新しました。"
          : "トレーニング履歴を保存しました。"
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

  const selectedAreas = useMemo(() => {
    const allAreas = [...FRONT_BODY_AREAS, ...BACK_BODY_AREAS];
    return Object.entries(tightAreaLevels)
      .filter(([, level]) => level === 1 || level === 2 || level === 3)
      .map(([areaId, level]) => {
        const found = allAreas.find((item) => item.id === areaId);
        return {
          id: areaId,
          label: found?.label || areaId,
          level,
        };
      });
  }, [tightAreaLevels]);

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
                {editingSessionId
                  ? "トレーニング履歴を編集"
                  : "トレーニング履歴を登録"}
              </h1>
              <div
                style={{
                  marginTop: 10,
                  color: "#334155",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                顧客名：{customerName}
                {customerKana ? `（${customerKana}）` : ""}
              </div>
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
                <span style={labelStyle}>顧客名</span>
                <input
                  value={customerName}
                  readOnly
                  style={{ ...inputStyle, background: "#f8fafc" }}
                />
              </label>

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
              <h2 style={sectionTitleStyle}>硬いところ・つらいところ</h2>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setBodySide("front")}
                  style={{
                    ...toggleSideButtonStyle,
                    ...(bodySide === "front" ? toggleSideButtonActiveStyle : {}),
                  }}
                >
                  前面
                </button>
                <button
                  type="button"
                  onClick={() => setBodySide("back")}
                  style={{
                    ...toggleSideButtonStyle,
                    ...(bodySide === "back" ? toggleSideButtonActiveStyle : {}),
                  }}
                >
                  背面
                </button>
                <button
                  type="button"
                  onClick={clearAllTightAreas}
                  style={clearButtonStyle}
                >
                  クリア
                </button>
              </div>
            </div>

            <div style={legendWrapStyle}>
              <span style={legendTextStyle}>タップごとに</span>
              <span style={{ ...legendChipStyle, background: "rgba(250, 204, 21, 0.95)" }}>弱</span>
              <span style={{ ...legendChipStyle, background: "rgba(251, 146, 60, 0.95)" }}>中</span>
              <span style={{ ...legendChipStyle, background: "rgba(239, 68, 68, 0.96)" }}>強</span>
              <span style={legendTextStyle}>→ 未選択</span>
            </div>

            <div style={bodyMapWrapStyle}>
              <div style={bodyMapStageStyle}>
                <div style={bodySilhouetteStyle}>
                  <div style={bodyHeadStyle} />
                  <div style={bodyTorsoStyle} />
                  <div style={bodyArmLeftStyle} />
                  <div style={bodyArmRightStyle} />
                  <div style={bodyLegLeftStyle} />
                  <div style={bodyLegRightStyle} />
                </div>

                {currentBodyAreas.map((point) => {
                  const level = tightAreaLevels[point.id];

                  return (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => cycleTightAreaLevel(point.id)}
                      style={{
                        ...bodyPointButtonStyle,
                        top: point.top,
                        left: point.left,
                        background: getHeatColor(level),
                        color: getHeatTextColor(level),
                        boxShadow: getHeatShadow(level),
                        border:
                          level && level > 0
                            ? "1px solid rgba(255,255,255,0.18)"
                            : "1px solid rgba(148,163,184,0.20)",
                      }}
                    >
                      {point.label}
                      {level ? ` ${level}` : ""}
                    </button>
                  );
                })}
              </div>

              <div style={bodyMapHelpStyle}>
                模型の部位をタップすると「未選択 → 弱 → 中 → 強 → 未選択」で切り替わります。
              </div>

              <div style={chipWrapStyle}>
                {selectedAreas.length === 0 ? (
                  <span style={emptyChipStyle}>未選択</span>
                ) : (
                  selectedAreas.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => cycleTightAreaLevel(item.id)}
                      style={{
                        ...selectedChipButtonStyle,
                        background: getHeatColor(item.level),
                        color: getHeatTextColor(item.level),
                      }}
                    >
                      {item.label}（{getLevelLabel(item.level)}） ×
                    </button>
                  ))
                )}
              </div>
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

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <span style={countBadgeStyle}>入力種目数：{exerciseCount}</span>
                <button
                  type="button"
                  onClick={addRowAndScroll}
                  style={addRowButtonTopStyle}
                >
                  ＋ 行を追加
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {setRows.map((row, index) => {
                const exerciseOptions = getExercisesByCategory(
                  trimmed(row.category)
                );
                const isLast = index === setRows.length - 1;

                return (
                  <div
                    key={toSafeString(row.rowId)}
                    style={exerciseCardStyle}
                    ref={isLast ? lastRowRef : null}
                  >
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
                            updateRow(
                              toSafeString(row.rowId),
                              "category",
                              e.target.value
                            )
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
                            updateRow(
                              toSafeString(row.rowId),
                              "exercise_name",
                              e.target.value
                            )
                          }
                          style={tableInputStyle}
                        >
                          <option value="">
                            {trimmed(row.category)
                              ? "種目を選択"
                              : "先にカテゴリを選択"}
                          </option>
                          {exerciseOptions.map((option) => (
                            <option
                              key={`${trimmed(row.category)}-${option}`}
                              value={option}
                            >
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
                            updateRow(
                              toSafeString(row.rowId),
                              "set_count",
                              e.target.value
                            )
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
                            updateRow(
                              toSafeString(row.rowId),
                              "reps",
                              e.target.value
                            )
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
                            updateRow(
                              toSafeString(row.rowId),
                              "weight",
                              e.target.value
                            )
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
                            updateRow(
                              toSafeString(row.rowId),
                              "seconds",
                              e.target.value
                            )
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
                            updateRow(
                              toSafeString(row.rowId),
                              "memo",
                              e.target.value
                            )
                          }
                          placeholder="フォーム意識、注意点など"
                          style={{ ...textareaStyle, minHeight: 88 }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={addRowAndScroll}
                  style={addRowButtonBottomStyle}
                >
                  ＋ 次の行を追加
                </button>
              </div>
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
                          aspectRatio: "1 / 1",
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
          </section>

          <section style={{ ...CARD_STYLE, borderRadius: 24, padding: 20 }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...primaryButtonStyle,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "保存中..."
                  : editingSessionId
                  ? "更新する"
                  : "保存する"}
              </button>
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
                marginBottom: 14,
              }}
            >
              <h2 style={sectionTitleStyle}>トレーニング履歴</h2>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                件数：{history.length}
              </div>
            </div>

            {loading ? (
              <div style={emptyStateStyle}>読み込み中...</div>
            ) : history.length === 0 ? (
              <div style={emptyStateStyle}>まだ履歴がありません。</div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {history.map((item) => {
                  const setCount = safeArray(item.training_sets).length;
                  const parsedPosture = parseStoredTightAreas(item.posture_note);

                  return (
                    <div key={item.id} style={historyCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <div style={historyDateStyle}>
                            {formatDate(item.session_date)}
                          </div>
                          <div style={historyMetaStyle}>
                            作成：{formatDateTime(item.created_at)}
                          </div>
                          {item.updated_at && (
                            <div style={historyMetaStyle}>
                              更新：{formatDateTime(item.updated_at)}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => applySessionToForm(item, true)}
                            style={secondaryButtonMiniStyle}
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            onClick={() => applySessionToForm(item, false)}
                            style={secondaryButtonMiniStyle}
                          >
                            コピー
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            style={dangerButtonMiniStyle}
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      <div style={historyMetricGridStyle}>
                        <MetricPill
                          label="身長"
                          value={withUnit(item.body_height, "cm")}
                        />
                        <MetricPill
                          label="体重"
                          value={withUnit(item.body_weight, "kg")}
                        />
                        <MetricPill
                          label="体脂肪"
                          value={withUnit(item.body_fat, "%")}
                        />
                        <MetricPill
                          label="筋肉量"
                          value={withUnit(item.muscle_mass, "kg")}
                        />
                        <MetricPill
                          label="内臓脂肪"
                          value={withUnit(item.visceral_fat, "")}
                        />
                        <MetricPill
                          label="種目数"
                          value={setCount > 0 ? `${setCount}件` : "—"}
                        />
                      </div>

                      {Object.keys(parsedPosture.tightAreaLevels).length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={subSectionTitleStyle}>硬いところ・つらいところ</div>
                          <div style={chipWrapStyle}>
                            {Object.entries(parsedPosture.tightAreaLevels).map(([areaId, level]) => {
                              const allAreas = [...FRONT_BODY_AREAS, ...BACK_BODY_AREAS];
                              const found = allAreas.find((item2) => item2.id === areaId);

                              return (
                                <span
                                  key={areaId}
                                  style={{
                                    ...chipStyle,
                                    background: getHeatColor(level),
                                    color: getHeatTextColor(level),
                                  }}
                                >
                                  {found?.label || areaId}（{getLevelLabel(level)}）
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {safeArray(item.stretch_menu).length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={subSectionTitleStyle}>ストレッチ項目</div>
                          <div style={chipWrapStyle}>
                            {safeArray(item.stretch_menu).map((menu, idx) => (
                              <span key={`${menu}-${idx}`} style={chipStyle}>
                                {menu}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {safeArray(item.training_sets).length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={subSectionTitleStyle}>トレーニング内容</div>
                          <div style={{ display: "grid", gap: 10 }}>
                            {safeArray(item.training_sets)
                              .sort((a, b) => (a.row_order ?? 0) - (b.row_order ?? 0))
                              .map((setItem, idx) => (
                                <div key={setItem.id || `${item.id}-${idx}`} style={setCardStyle}>
                                  <div style={setCardHeaderStyle}>
                                    <div style={setCardIndexStyle}>種目 {idx + 1}</div>
                                    <div style={setCardExerciseStyle}>
                                      {setItem.exercise_name || "—"}
                                    </div>
                                  </div>

                                  <div style={setMetricGridStyle}>
                                    <MiniMetric label="カテゴリ" value={setItem.category || "—"} />
                                    <MiniMetric
                                      label="セット"
                                      value={
                                        setItem.set_count !== null &&
                                        setItem.set_count !== undefined
                                          ? `${setItem.set_count}`
                                          : "—"
                                      }
                                    />
                                    <MiniMetric label="回数" value={setItem.reps || "—"} />
                                    <MiniMetric label="重量" value={setItem.weight || "—"} />
                                    <MiniMetric label="秒数" value={setItem.seconds || "—"} />
                                  </div>

                                  {setItem.memo && (
                                    <div style={setMemoStyle}>
                                      <div style={setMemoLabelStyle}>メモ</div>
                                      <div style={setMemoTextStyle}>{setItem.memo}</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {(item.summary || item.next_task || parsedPosture.postureNote) && (
                        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                          <InfoBlock title="総評" text={item.summary} />
                          <InfoBlock title="次回課題" text={item.next_task} />
                          <InfoBlock title="姿勢メモ" text={parsedPosture.postureNote} />
                        </div>
                      )}

                      {safeArray(item.posture_image_urls).length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={subSectionTitleStyle}>姿勢画像</div>
                          <div style={imageGridStyle}>
                            {safeArray(item.posture_image_urls).map((url, idx) => (
                              <div key={`${url}-${idx}`} style={historyImageCardStyle}>
                                <img
                                  src={url}
                                  alt={`history-posture-${idx + 1}`}
                                  style={historyImageStyle}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={metricPillStyle}>
      <div style={metricPillLabelStyle}>{label}</div>
      <div style={metricPillValueStyle}>{value}</div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={miniMetricStyle}>
      <div style={miniMetricLabelStyle}>{label}</div>
      <div style={miniMetricValueStyle}>{value}</div>
    </div>
  );
}

function InfoBlock({
  title,
  text,
}: {
  title: string;
  text?: string | null;
}) {
  if (!text?.trim()) return null;

  return (
    <div style={infoBlockStyle}>
      <div style={infoBlockTitleStyle}>{title}</div>
      <div style={infoBlockTextStyle}>{text}</div>
    </div>
  );
}

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 22,
  color: "#0f172a",
};

const subSectionTitleStyle: CSSProperties = {
  fontSize: 13,
  color: "#475569",
  fontWeight: 800,
  marginBottom: 10,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "#334155",
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 46,
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "#fff",
  padding: "0 14px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "#fff",
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
};

const tableInputStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 42,
};

const primaryButtonStyle: CSSProperties = {
  ...(BUTTON_PRIMARY_STYLE || {}),
  minHeight: 46,
  padding: "0 18px",
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "#fff",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonMiniStyle: CSSProperties = {
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "#fff",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const dangerButtonMiniStyle: CSSProperties = {
  ...secondaryButtonMiniStyle,
  color: "#b91c1c",
  border: "1px solid rgba(239,68,68,0.28)",
  background: "rgba(254,242,242,0.9)",
};

const clearButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(254,242,242,0.96)",
  color: "#b91c1c",
  cursor: "pointer",
  fontWeight: 700,
};

const alertErrorStyle: CSSProperties = {
  borderRadius: 16,
  padding: "14px 16px",
  background: "rgba(254,242,242,0.95)",
  border: "1px solid rgba(239,68,68,0.20)",
  color: "#b91c1c",
  fontSize: 14,
  fontWeight: 600,
};

const alertSuccessStyle: CSSProperties = {
  borderRadius: 16,
  padding: "14px 16px",
  background: "rgba(240,253,244,0.95)",
  border: "1px solid rgba(34,197,94,0.18)",
  color: "#15803d",
  fontSize: 14,
  fontWeight: 600,
};

const countBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 999,
  background: "rgba(59,130,246,0.08)",
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 700,
};

const addRowButtonTopStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(59,130,246,0.18)",
  background: "rgba(239,246,255,0.96)",
  color: "#1d4ed8",
  cursor: "pointer",
  fontWeight: 700,
};

const addRowButtonBottomStyle: CSSProperties = {
  ...addRowButtonTopStyle,
  minHeight: 42,
};

const legendWrapStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 12,
};

const legendChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 26,
  padding: "0 10px",
  borderRadius: 999,
  color: "#fff",
  fontSize: 12,
  fontWeight: 800,
};

const legendTextStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
};

const bodyMapWrapStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const toggleSideButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "#fff",
  color: "#334155",
  fontWeight: 700,
  cursor: "pointer",
};

const toggleSideButtonActiveStyle: CSSProperties = {
  background: "rgba(37,99,235,0.10)",
  border: "1px solid rgba(37,99,235,0.22)",
  color: "#1d4ed8",
};

const bodyMapStageStyle: CSSProperties = {
  position: "relative",
  height: 520,
  borderRadius: 24,
  background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  border: "1px solid rgba(148,163,184,0.16)",
  overflow: "hidden",
};

const bodySilhouetteStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
};

const bodyHeadStyle: CSSProperties = {
  position: "absolute",
  top: "4%",
  left: "50%",
  transform: "translateX(-50%)",
  width: 70,
  height: 70,
  borderRadius: "50%",
  background: "rgba(148,163,184,0.22)",
};

const bodyTorsoStyle: CSSProperties = {
  position: "absolute",
  top: "18%",
  left: "50%",
  transform: "translateX(-50%)",
  width: 140,
  height: 190,
  borderRadius: 40,
  background: "rgba(148,163,184,0.22)",
};

const bodyArmLeftStyle: CSSProperties = {
  position: "absolute",
  top: "20%",
  left: "calc(50% - 105px)",
  width: 38,
  height: 190,
  borderRadius: 30,
  background: "rgba(148,163,184,0.18)",
  transform: "rotate(8deg)",
};

const bodyArmRightStyle: CSSProperties = {
  position: "absolute",
  top: "20%",
  left: "calc(50% + 67px)",
  width: 38,
  height: 190,
  borderRadius: 30,
  background: "rgba(148,163,184,0.18)",
  transform: "rotate(-8deg)",
};

const bodyLegLeftStyle: CSSProperties = {
  position: "absolute",
  top: "52%",
  left: "calc(50% - 55px)",
  width: 42,
  height: 210,
  borderRadius: 30,
  background: "rgba(148,163,184,0.18)",
};

const bodyLegRightStyle: CSSProperties = {
  position: "absolute",
  top: "52%",
  left: "calc(50% + 13px)",
  width: 42,
  height: 210,
  borderRadius: 30,
  background: "rgba(148,163,184,0.18)",
};

const bodyPointButtonStyle: CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  minHeight: 34,
  padding: "0 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const bodyMapHelpStyle: CSSProperties = {
  fontSize: 13,
  color: "#64748b",
};

const chipWrapStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const chipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 30,
  padding: "0 10px",
  borderRadius: 999,
  background: "rgba(37,99,235,0.08)",
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 700,
};

const emptyChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 30,
  padding: "0 10px",
  borderRadius: 999,
  background: "rgba(148,163,184,0.10)",
  color: "#64748b",
  fontSize: 12,
  fontWeight: 700,
};

const selectedChipButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 32,
  padding: "0 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const exerciseCardStyle: CSSProperties = {
  borderRadius: 20,
  background: "rgba(248,250,252,0.88)",
  border: "1px solid rgba(148,163,184,0.14)",
  padding: 16,
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
  minHeight: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(254,242,242,0.95)",
  color: "#b91c1c",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const exerciseCardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

const removeImageButtonStyle: CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  minHeight: 30,
  padding: "0 10px",
  borderRadius: 999,
  border: "none",
  background: "rgba(15,23,42,0.82)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const emptyStateStyle: CSSProperties = {
  minHeight: 120,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 18,
  background: "rgba(248,250,252,0.92)",
  color: "#64748b",
  fontSize: 14,
};

const historyCardStyle: CSSProperties = {
  borderRadius: 22,
  background: "rgba(248,250,252,0.94)",
  border: "1px solid rgba(148,163,184,0.14)",
  padding: 18,
};

const historyDateStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
};

const historyMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 4,
};

const historyMetricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
};

const metricPillStyle: CSSProperties = {
  borderRadius: 14,
  padding: "12px 12px 10px",
  background: "#fff",
  border: "1px solid rgba(148,163,184,0.16)",
};

const metricPillLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  marginBottom: 4,
  fontWeight: 700,
};

const metricPillValueStyle: CSSProperties = {
  fontSize: 15,
  color: "#0f172a",
  fontWeight: 800,
};

const setCardStyle: CSSProperties = {
  borderRadius: 16,
  background: "#fff",
  border: "1px solid rgba(148,163,184,0.14)",
  padding: 14,
};

const setCardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
};

const setCardIndexStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
};

const setCardExerciseStyle: CSSProperties = {
  fontSize: 16,
  color: "#0f172a",
  fontWeight: 800,
};

const setMetricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: 8,
};

const miniMetricStyle: CSSProperties = {
  borderRadius: 12,
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(148,163,184,0.14)",
  padding: "10px 10px 8px",
};

const miniMetricLabelStyle: CSSProperties = {
  fontSize: 10,
  color: "#64748b",
  marginBottom: 4,
  fontWeight: 700,
};

const miniMetricValueStyle: CSSProperties = {
  fontSize: 13,
  color: "#0f172a",
  fontWeight: 700,
};

const setMemoStyle: CSSProperties = {
  marginTop: 10,
  borderRadius: 12,
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(148,163,184,0.14)",
  padding: 12,
};

const setMemoLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 4,
};

const setMemoTextStyle: CSSProperties = {
  fontSize: 13,
  color: "#0f172a",
  lineHeight: 1.7,
};

const infoBlockStyle: CSSProperties = {
  borderRadius: 14,
  padding: 14,
  background: "#fff",
  border: "1px solid rgba(148,163,184,0.14)",
};

const infoBlockTitleStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 6,
};

const infoBlockTextStyle: CSSProperties = {
  fontSize: 14,
  color: "#0f172a",
  lineHeight: 1.8,
};

const imageGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
};

const historyImageCardStyle: CSSProperties = {
  borderRadius: 16,
  overflow: "hidden",
  background: "#fff",
  border: "1px solid rgba(148,163,184,0.14)",
};

const historyImageStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  display: "block",
};