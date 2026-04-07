"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

type CustomerRow = {
  id: string | number;
  name?: string | null;
  kana?: string | null;
  phone?: string | null;
};

type CounselingRow = {
  id: string | number;
  customer_id: string | number;
  reservation_id?: string | number | null;
  customer_name?: string | null;
  goal?: string | null;
  trouble?: string | null;
  past_history?: string | null;
  posture_note?: string | null;
  body_note?: string | null;
  meal_note?: string | null;
  life_style?: string | null;
  memo?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type FormState = {
  goal: string;
  trouble: string;
  past_history: string;
  posture_note: string;
  body_note: string;
  meal_note: string;
  life_style: string;
  memo: string;
};

const initialForm: FormState = {
  goal: "",
  trouble: "",
  past_history: "",
  posture_note: "",
  body_note: "",
  meal_note: "",
  life_style: "",
  memo: "",
};

function trimmed(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP");
}

export default function CustomerCounselingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const rawId = params?.id;
  const customerId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");
  const reservationId = searchParams.get("reservationId") || "";

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [latestCounseling, setLatestCounseling] = useState<CounselingRow | null>(null);

  const [form, setForm] = useState<FormState>(initialForm);

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
      setError("顧客IDが取得できませんでした。");
      setLoading(false);
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
      setSuccess("");

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, kana, phone")
        .eq("id", customerId)
        .single();

      if (customerError) throw customerError;

      const { data: counselingData, error: counselingError } = await supabase
        .from("counselings")
        .select(
          "id, customer_id, reservation_id, customer_name, goal, trouble, past_history, posture_note, body_note, meal_note, life_style, memo, created_at, updated_at"
        )
        .eq("customer_id", Number(customerId))
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (counselingError) throw counselingError;

      const latest = (counselingData as CounselingRow[] | null)?.[0] || null;

      setCustomer((customerData as CustomerRow) || null);
      setLatestCounseling(latest);

      if (latest) {
        setForm({
          goal: latest.goal || "",
          trouble: latest.trouble || "",
          past_history: latest.past_history || "",
          posture_note: latest.posture_note || "",
          body_note: latest.body_note || "",
          meal_note: latest.meal_note || "",
          life_style: latest.life_style || "",
          memo: latest.memo || "",
        });
      } else {
        setForm(initialForm);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "データ取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    if (!customerId || !customer) {
      setError("顧客情報が取得できていません。");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        customer_id: Number(customerId),
        reservation_id: reservationId ? Number(reservationId) : null,
        customer_name: trimmed(customer.name),
        goal: trimmed(form.goal) || null,
        trouble: trimmed(form.trouble) || null,
        past_history: trimmed(form.past_history) || null,
        posture_note: trimmed(form.posture_note) || null,
        body_note: trimmed(form.body_note) || null,
        meal_note: trimmed(form.meal_note) || null,
        life_style: trimmed(form.life_style) || null,
        memo: trimmed(form.memo) || null,
        updated_at: new Date().toISOString(),
      };

      if (latestCounseling?.id) {
        const { error: updateError } = await supabase
          .from("counselings")
          .update(payload)
          .eq("id", latestCounseling.id);

        if (updateError) throw updateError;
        setSuccess("カウンセリングシートを更新しました。");
      } else {
        const { error: insertError } = await supabase
          .from("counselings")
          .insert(payload);

        if (insertError) throw insertError;
        setSuccess("カウンセリングシートを保存しました。");
      }

      await loadData();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  const pageTitle = useMemo(() => {
    return customer?.name ? `${customer.name}様 カウンセリング` : "カウンセリング";
  }, [customer]);

  if (!mounted) return null;

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.loadingCard}>読み込み中...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <section style={styles.heroCard}>
          <div>
            <div style={styles.eyebrow}>COUNSELING SHEET</div>
            <h1 style={styles.title}>{pageTitle}</h1>
            <div style={styles.subText}>
              顧客ごとの最新カウンセリングを保存・更新できます
            </div>
          </div>

          <div style={styles.heroActions}>
            <Link href={`/customer/${customerId}`} style={styles.secondaryLink}>
              顧客詳細へ戻る
            </Link>

            {reservationId ? (
              <Link
                href={`/reservation/detail/${reservationId}`}
                style={styles.secondaryLink}
              >
                予約詳細へ
              </Link>
            ) : null}
          </div>
        </section>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {success ? <div style={styles.successBox}>{success}</div> : null}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>顧客情報</h2>

          <div style={styles.infoGrid}>
            <InfoItem label="顧客ID" value={String(customer?.id ?? "—")} />
            <InfoItem label="氏名" value={customer?.name || "—"} />
            <InfoItem label="かな" value={customer?.kana || "—"} />
            <InfoItem label="電話番号" value={customer?.phone || "—"} />
            <InfoItem label="予約ID" value={reservationId || "—"} />
            <InfoItem
              label="最終更新"
              value={formatDateTime(latestCounseling?.updated_at || latestCounseling?.created_at)}
            />
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>カウンセリング入力</h2>

          <div style={styles.formGrid}>
            <FieldBlock label="目標">
              <textarea
                value={form.goal}
                onChange={(e) => updateForm("goal", e.target.value)}
                style={styles.textarea}
                placeholder="例：ダイエット、姿勢改善、肩こり改善 など"
              />
            </FieldBlock>

            <FieldBlock label="主訴・悩み">
              <textarea
                value={form.trouble}
                onChange={(e) => updateForm("trouble", e.target.value)}
                style={styles.textarea}
                placeholder="例：腰痛、肩こり、猫背、疲れやすい など"
              />
            </FieldBlock>

            <FieldBlock label="既往歴・注意点">
              <textarea
                value={form.past_history}
                onChange={(e) => updateForm("past_history", e.target.value)}
                style={styles.textarea}
                placeholder="例：ヘルニア経験、膝痛あり、通院歴 など"
              />
            </FieldBlock>

            <FieldBlock label="姿勢評価">
              <textarea
                value={form.posture_note}
                onChange={(e) => updateForm("posture_note", e.target.value)}
                style={styles.textarea}
                placeholder="例：反り腰、巻き肩、骨盤前傾 など"
              />
            </FieldBlock>

            <FieldBlock label="身体評価・体の状態">
              <textarea
                value={form.body_note}
                onChange={(e) => updateForm("body_note", e.target.value)}
                style={styles.textarea}
                placeholder="例：下半身の張り、肩甲骨の可動域低下 など"
              />
            </FieldBlock>

            <FieldBlock label="食事・栄養メモ">
              <textarea
                value={form.meal_note}
                onChange={(e) => updateForm("meal_note", e.target.value)}
                style={styles.textarea}
                placeholder="例：朝食抜きが多い、たんぱく質不足気味 など"
              />
            </FieldBlock>

            <FieldBlock label="生活習慣">
              <textarea
                value={form.life_style}
                onChange={(e) => updateForm("life_style", e.target.value)}
                style={styles.textarea}
                placeholder="例：デスクワーク中心、睡眠6時間、運動習慣なし など"
              />
            </FieldBlock>

            <FieldBlock label="メモ">
              <textarea
                value={form.memo}
                onChange={(e) => updateForm("memo", e.target.value)}
                style={styles.textareaLarge}
                placeholder="その他メモ、今後の方針、次回提案内容など"
              />
            </FieldBlock>
          </div>

          <div style={styles.actionRow}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                ...styles.primaryButton,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "保存中..." : latestCounseling ? "更新して保存" : "新規保存"}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/customer/${customerId}`)}
              style={styles.cancelButton}
            >
              戻る
            </button>
          </div>
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
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value || "—"}</div>
    </div>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={styles.fieldBlock}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2f7 45%, #e9eef5 100%)",
    padding: "20px 12px 48px",
  },
  wrap: {
    maxWidth: 980,
    margin: "0 auto",
    display: "grid",
    gap: 16,
  },
  loadingCard: {
    background: "#fff",
    borderRadius: 24,
    padding: 28,
    textAlign: "center",
    fontWeight: 800,
    color: "#334155",
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  },
  heroCard: {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.72)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#64748b",
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: "clamp(24px, 4vw, 34px)",
    color: "#111827",
    fontWeight: 900,
    lineHeight: 1.2,
  },
  subText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: 700,
  },
  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  secondaryLink: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 14,
    background: "#fff",
    border: "1px solid #dbe2ea",
    color: "#111827",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "rgba(255,255,255,0.84)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.74)",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: 20,
    fontWeight: 900,
    color: "#111827",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  infoCard: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    padding: "14px 14px",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    marginBottom: 6,
    letterSpacing: "0.04em",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  formGrid: {
    display: "grid",
    gap: 14,
  },
  fieldBlock: {
    display: "grid",
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#374151",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 16,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "12px 14px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.6,
  },
  textareaLarge: {
    width: "100%",
    minHeight: 140,
    borderRadius: 16,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "12px 14px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.6,
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 18,
  },
  primaryButton: {
    minHeight: 46,
    border: "none",
    borderRadius: 14,
    background: "#111827",
    color: "#fff",
    padding: "0 18px",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  cancelButton: {
    minHeight: 46,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    padding: "0 18px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.6,
  },
  successBox: {
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.6,
  },
};