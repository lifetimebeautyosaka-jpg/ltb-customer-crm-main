"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type CustomerRow = {
  id: string | number;
  name?: string | null;
  customer_name?: string | null;
  kana?: string | null;
  furigana?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  email?: string | null;
  created_at?: string | null;
};

type SubscriptionRow = {
  id: string;
  customer_id: string;
  customer_name?: string | null;
  plan_name?: string | null;
  plan_type?: string | null;
  plan_style?: string | null;
  service_type?: string | null;
  monthly_count?: number | null;
  used_count?: number | null;
  carry_over?: number | null;
  remaining_count?: number | null;
  price?: number | null;
  status?: string | null;
  start_date?: string | null;
  next_payment_date?: string | null;
  last_reset_month?: string | null;
  memo?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type NormalizedCustomer = {
  id: string;
  name: string;
  kana: string;
  phone: string;
  email: string;
  createdAt: string;
};

type SubscriptionForm = {
  plan_name: string;
  plan_type: string;
  plan_style: "マンツーマン" | "ペア";
  service_type: "ストレッチ" | "トレーニング" | "両方";
  monthly_count: string;
  used_count: string;
  carry_over: string;
  price: string;
  status: "有効" | "停止";
  start_date: string;
  next_payment_date: string;
  memo: string;
};

const initialForm: SubscriptionForm = {
  plan_name: "",
  plan_type: "月4回",
  plan_style: "マンツーマン",
  service_type: "ストレッチ",
  monthly_count: "4",
  used_count: "0",
  carry_over: "0",
  price: "",
  status: "有効",
  start_date: "",
  next_payment_date: "",
  memo: "",
};

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

const BG_STYLE: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #f7f7f8 0%, #eceef1 45%, #e7eaef 100%)",
};

const CARD_STYLE: CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const BUTTON_PRIMARY_STYLE: CSSProperties = {
  background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
  color: "#ffffff",
  boxShadow: "0 10px 24px rgba(17,24,39,0.22)",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ja-JP");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP");
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `¥${Number(value).toLocaleString()}`;
}

function normalizeCustomer(row: CustomerRow): NormalizedCustomer {
  return {
    id: String(row.id),
    name: row.name || row.customer_name || "—",
    kana: row.kana || row.furigana || "",
    phone: row.phone || row.phone_number || "",
    email: row.email || "",
    createdAt: row.created_at || "",
  };
}

function safeNumber(value: string | number | null | undefined, fallback = 0) {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function calcRemaining(
  monthlyCount: number,
  usedCount: number,
  carryOver: number
) {
  return Math.max(monthlyCount + carryOver - usedCount, 0);
}

function getStorageKey(customerId: string) {
  return `gymup_subscription_${customerId}`;
}

function readLocalSubscription(customerId: string): SubscriptionRow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(customerId));
    if (!raw) return null;
    return JSON.parse(raw) as SubscriptionRow;
  } catch {
    return null;
  }
}

function saveLocalSubscription(customerId: string, data: SubscriptionRow) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(customerId), JSON.stringify(data));
}

function createId() {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function CustomerSubscriptionPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const customerId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");

  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notice, setNotice] = useState("");

  const [customer, setCustomer] = useState<NormalizedCustomer | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [form, setForm] = useState<SubscriptionForm>(initialForm);

  const mobile = windowWidth < 768;
  const compact = windowWidth < 1100;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
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
      setError("顧客IDが取得できませんでした。顧客一覧から開き直してください。");
      return;
    }

    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, customerId, router]);

  async function loadData() {
    setLoading(true);
    setError("");
    setSuccess("");
    setNotice("");

    try {
      await loadCustomer();
      await loadSubscription();
    } catch (e: any) {
      setError(e?.message || "データ取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomer() {
    if (!supabase) {
      const fallbackCustomer: NormalizedCustomer = {
        id: customerId,
        name: "顧客",
        kana: "",
        phone: "",
        email: "",
        createdAt: "",
      };
      setCustomer(fallbackCustomer);
      setNotice("Supabase未接続のため、顧客情報は簡易表示です。");
      return;
    }

    const numericCustomerId = Number(customerId);
    const customerIdForQuery = Number.isNaN(numericCustomerId)
      ? customerId
      : numericCustomerId;

    const { data, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerIdForQuery)
      .single();

    if (customerError) {
      const fallbackCustomer: NormalizedCustomer = {
        id: customerId,
        name: "顧客",
        kana: "",
        phone: "",
        email: "",
        createdAt: "",
      };
      setCustomer(fallbackCustomer);
      setNotice("customers 取得に失敗したため、簡易表示に切り替えました。");
      return;
    }

    setCustomer(normalizeCustomer(data as CustomerRow));
  }

  async function loadSubscription() {
    const localData = readLocalSubscription(customerId);

    if (!supabase) {
      if (localData) {
        setSubscription(localData);
        setForm(fromRowToForm(localData));
      } else {
        setSubscription(null);
        setForm(initialFormWithToday());
      }
      if (!notice) {
        setNotice("Supabase未接続のため、月額契約は端末保存で動作します。");
      }
      return;
    }

    try {
      const { data, error: subError } = await supabase
        .from("customer_subscriptions")
        .select("*")
        .eq("customer_id", String(customerId))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        if (localData) {
          setSubscription(localData);
          setForm(fromRowToForm(localData));
          setNotice(
            "customer_subscriptions テーブル取得に失敗したため、端末保存データを表示しています。"
          );
          return;
        }

        setSubscription(null);
        setForm(initialFormWithToday());
        setNotice(
          "customer_subscriptions テーブルが未作成、または取得できないため、端末保存モードで利用できます。"
        );
        return;
      }

      const row = (data as SubscriptionRow | null) || null;

      if (!row) {
        if (localData) {
          setSubscription(localData);
          setForm(fromRowToForm(localData));
          setNotice("Supabaseに契約データがないため、端末保存データを表示しています。");
          return;
        }

        setSubscription(null);
        setForm(initialFormWithToday());
        return;
      }

      setSubscription(row);
      setForm(fromRowToForm(row));
    } catch {
      if (localData) {
        setSubscription(localData);
        setForm(fromRowToForm(localData));
        setNotice("月額契約は端末保存データを表示しています。");
      } else {
        setSubscription(null);
        setForm(initialFormWithToday());
      }
    }
  }

  function initialFormWithToday(): SubscriptionForm {
    const today = new Date().toISOString().slice(0, 10);
    return {
      ...initialForm,
      start_date: today,
      next_payment_date: today,
    };
  }

  function fromRowToForm(row: SubscriptionRow): SubscriptionForm {
    return {
      plan_name: row.plan_name || "",
      plan_type: row.plan_type || "月4回",
      plan_style: row.plan_style === "ペア" ? "ペア" : "マンツーマン",
      service_type:
        row.service_type === "トレーニング" || row.service_type === "両方"
          ? (row.service_type as "トレーニング" | "両方")
          : "ストレッチ",
      monthly_count: String(row.monthly_count ?? 4),
      used_count: String(row.used_count ?? 0),
      carry_over: String(row.carry_over ?? 0),
      price: row.price !== null && row.price !== undefined ? String(row.price) : "",
      status: row.status === "停止" ? "停止" : "有効",
      start_date: row.start_date || "",
      next_payment_date: row.next_payment_date || "",
      memo: row.memo || "",
    };
  }

  function updateForm<K extends keyof SubscriptionForm>(
    key: K,
    value: SubscriptionForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const monthlyCountNum = safeNumber(form.monthly_count, 0);
  const usedCountNum = safeNumber(form.used_count, 0);
  const carryOverNum = safeNumber(form.carry_over, 0);
  const priceNum = safeNumber(form.price, 0);
  const previewRemaining = calcRemaining(
    monthlyCountNum,
    usedCountNum,
    carryOverNum
  );

  const usageRate = useMemo(() => {
    const total = monthlyCountNum + carryOverNum;
    if (total <= 0) return 0;
    return Math.min(Math.round((usedCountNum / total) * 100), 100);
  }, [monthlyCountNum, usedCountNum, carryOverNum]);

  async function handleSave() {
    setError("");
    setSuccess("");
    setNotice("");

    if (!customerId) {
      setError("顧客IDが見つかりません。");
      return;
    }

    if (!form.plan_name.trim()) {
      setError("プラン名を入力してください。");
      return;
    }

    if (!form.monthly_count || safeNumber(form.monthly_count, -1) < 0) {
      setError("月回数を正しく入力してください。");
      return;
    }

    if (!form.used_count || safeNumber(form.used_count, -1) < 0) {
      setError("消化回数を正しく入力してください。");
      return;
    }

    if (!form.carry_over || safeNumber(form.carry_over, -1) < 0) {
      setError("繰越回数を正しく入力してください。");
      return;
    }

    setSaving(true);

    const payload: SubscriptionRow = {
      id: subscription?.id || createId(),
      customer_id: String(customerId),
      customer_name: customer?.name || "顧客",
      plan_name: form.plan_name.trim(),
      plan_type: form.plan_type,
      plan_style: form.plan_style,
      service_type: form.service_type,
      monthly_count: safeNumber(form.monthly_count, 0),
      used_count: safeNumber(form.used_count, 0),
      carry_over: safeNumber(form.carry_over, 0),
      remaining_count: previewRemaining,
      price: form.price.trim() ? safeNumber(form.price, 0) : null,
      status: form.status,
      start_date: form.start_date || null,
      next_payment_date: form.next_payment_date || null,
      last_reset_month:
        subscription?.last_reset_month || new Date().toISOString().slice(0, 7),
      memo: form.memo.trim() || null,
      created_at: subscription?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      saveLocalSubscription(customerId, payload);

      if (supabase) {
        const { error: upsertError } = await supabase
          .from("customer_subscriptions")
          .upsert(payload, { onConflict: "id" });

        if (upsertError) {
          setSubscription(payload);
          setSuccess("端末保存で月額契約を保存しました。");
          setNotice(
            "Supabase保存は失敗しましたが、画面上では利用できます。テーブル未作成の可能性があります。"
          );
          setSaving(false);
          return;
        }
      } else {
        setNotice("Supabase未接続のため、端末保存で保存しました。");
      }

      setSubscription(payload);
      setSuccess("月額契約を保存しました。");
    } catch (e: any) {
      setError(e?.message || "月額契約の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  function handleToggleStatus() {
    const nextStatus = form.status === "有効" ? "停止" : "有効";
    setForm((prev) => ({ ...prev, status: nextStatus }));
  }

  function handleResetMonth() {
    const updatedCarry = previewRemaining;
    setForm((prev) => ({
      ...prev,
      carry_over: String(updatedCarry),
      used_count: "0",
    }));
    setSuccess("月次リセット用に、残回数を繰越へ反映しました。保存して確定してください。");
    setError("");
  }

  function handleUseOne() {
    setForm((prev) => ({
      ...prev,
      used_count: String(Math.max(safeNumber(prev.used_count, 0) + 1, 0)),
    }));
    setError("");
    setSuccess("");
  }

  function handleBackOne() {
    setForm((prev) => ({
      ...prev,
      used_count: String(Math.max(safeNumber(prev.used_count, 0) - 1, 0)),
    }));
    setError("");
    setSuccess("");
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <main style={{ ...BG_STYLE, padding: "24px 16px 80px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ ...CARD_STYLE, borderRadius: 24, padding: 24 }}>
            読み込み中...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        ...BG_STYLE,
        padding: mobile ? "16px 12px 72px" : "24px 16px 80px",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
        <section
          style={{
            ...CARD_STYLE,
            borderRadius: 24,
            padding: mobile ? 16 : 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: 16,
              flexWrap: "wrap",
              flexDirection: mobile ? "column" : "row",
            }}
          >
            <div>
              <div style={eyebrowStyle}>SUBSCRIPTION</div>
              <h1 style={{ ...pageTitleStyle, fontSize: mobile ? 24 : 30 }}>
                サブスク（定額プラン）を管理
              </h1>
              <div style={subTitleStyle}>
                {customer?.name || "顧客"} のサブスク管理
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                width: mobile ? "100%" : "auto",
                flexDirection: mobile ? "column" : "row",
              }}
            >
              <button
                type="button"
                onClick={() => router.push(`/customer/${customerId}`)}
                style={{
                  ...secondaryButtonStyle,
                  width: mobile ? "100%" : "auto",
                }}
              >
                顧客詳細へ戻る
              </button>

              <Link
                href={`/customer/${customerId}/training`}
                style={{
                  ...buttonLinkStyle,
                  ...BUTTON_PRIMARY_STYLE,
                  width: mobile ? "100%" : "auto",
                }}
              >
                トレーニング履歴へ
              </Link>
            </div>
          </div>
        </section>

        {error ? <div style={alertErrorStyle}>{error}</div> : null}
        {success ? <div style={alertSuccessStyle}>{success}</div> : null}
        {notice ? <div style={alertNoticeStyle}>{notice}</div> : null}

        <section
          style={{
            ...CARD_STYLE,
            borderRadius: 24,
            padding: mobile ? 16 : 20,
          }}
        >
          <h2 style={sectionTitleStyle}>顧客情報</h2>

          <div style={infoGridStyle}>
            <InfoItem label="氏名" value={customer?.name || "—"} />
            <InfoItem label="かな" value={customer?.kana || "—"} />
            <InfoItem label="電話" value={customer?.phone || "—"} />
            <InfoItem label="メール" value={customer?.email || "—"} />
          </div>
        </section>

        <section
          style={{
            ...CARD_STYLE,
            borderRadius: 24,
            padding: mobile ? 16 : 20,
          }}
        >
          <h2 style={sectionTitleStyle}>現在の契約サマリー</h2>

          <div style={metricsGridStyle}>
            <MetricCard
              label="プラン"
              value={form.plan_name || "未設定"}
              sub={form.plan_type || "—"}
            />
            <MetricCard
              label="契約金額"
              value={form.price ? formatCurrency(priceNum) : "未設定"}
              sub={form.plan_style}
            />
            <MetricCard
              label="残回数"
              value={`${previewRemaining}回`}
              sub={`消化 ${usedCountNum}回 / 月回数 ${monthlyCountNum}回`}
            />
            <MetricCard
              label="繰越"
              value={`${carryOverNum}回`}
              sub={`利用率 ${usageRate}%`}
            />
            <MetricCard
              label="状態"
              value={form.status}
              sub={`次回決済日 ${formatDate(form.next_payment_date)}`}
            />
            <MetricCard
              label="開始日"
              value={formatDate(form.start_date)}
              sub={
                subscription?.updated_at
                  ? `最終更新 ${formatDateTime(subscription.updated_at)}`
                  : "新規登録"
              }
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={progressWrapStyle}>
              <div style={progressLabelStyle}>消化率</div>
              <div style={progressBarBgStyle}>
                <div
                  style={{
                    ...progressBarFillStyle,
                    width: `${Math.max(0, Math.min(usageRate, 100))}%`,
                  }}
                />
              </div>
              <div style={progressValueStyle}>{usageRate}%</div>
            </div>
          </div>
        </section>

        <section
          style={{
            ...CARD_STYLE,
            borderRadius: 24,
            padding: mobile ? 16 : 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: compact ? "stretch" : "center",
              gap: 12,
              flexWrap: "wrap",
              flexDirection: compact ? "column" : "row",
              marginBottom: 16,
            }}
          >
            <h2 style={sectionTitleStyle}>月額契約入力</h2>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                width: compact ? "100%" : "auto",
                flexDirection: mobile ? "column" : "row",
              }}
            >
              <button
                type="button"
                onClick={handleUseOne}
                style={{
                  ...secondaryButtonStyle,
                  width: mobile ? "100%" : "auto",
                }}
              >
                消化 +1
              </button>

              <button
                type="button"
                onClick={handleBackOne}
                style={{
                  ...secondaryButtonStyle,
                  width: mobile ? "100%" : "auto",
                }}
              >
                消化 -1
              </button>

              <button
                type="button"
                onClick={handleResetMonth}
                style={{
                  ...secondaryButtonStyle,
                  width: mobile ? "100%" : "auto",
                }}
              >
                月次リセット準備
              </button>

              <button
                type="button"
                onClick={handleToggleStatus}
                style={{
                  ...secondaryButtonStyle,
                  width: mobile ? "100%" : "auto",
                }}
              >
                {form.status === "有効" ? "停止に切替" : "有効に切替"}
              </button>
            </div>
          </div>

          <div style={formGridStyle}>
            <Field label="プラン名">
              <input
                value={form.plan_name}
                onChange={(e) => updateForm("plan_name", e.target.value)}
                placeholder="例：ストレッチ月4回プラン"
                style={inputStyle}
              />
            </Field>

            <Field label="プラン種別">
              <select
                value={form.plan_type}
                onChange={(e) => updateForm("plan_type", e.target.value)}
                style={inputStyle}
              >
                <option value="月2回">月2回</option>
                <option value="月4回">月4回</option>
                <option value="月8回">月8回</option>
                <option value="通い放題">通い放題</option>
                <option value="その他">その他</option>
              </select>
            </Field>

            <Field label="契約形態">
              <select
                value={form.plan_style}
                onChange={(e) =>
                  updateForm(
                    "plan_style",
                    e.target.value as "マンツーマン" | "ペア"
                  )
                }
                style={inputStyle}
              >
                <option value="マンツーマン">マンツーマン</option>
                <option value="ペア">ペア</option>
              </select>
            </Field>

            <Field label="サービス種別">
              <select
                value={form.service_type}
                onChange={(e) =>
                  updateForm(
                    "service_type",
                    e.target.value as "ストレッチ" | "トレーニング" | "両方"
                  )
                }
                style={inputStyle}
              >
                <option value="ストレッチ">ストレッチ</option>
                <option value="トレーニング">トレーニング</option>
                <option value="両方">両方</option>
              </select>
            </Field>

            <Field label="月回数">
              <input
                type="number"
                min="0"
                value={form.monthly_count}
                onChange={(e) => updateForm("monthly_count", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="消化回数">
              <input
                type="number"
                min="0"
                value={form.used_count}
                onChange={(e) => updateForm("used_count", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="繰越回数">
              <input
                type="number"
                min="0"
                value={form.carry_over}
                onChange={(e) => updateForm("carry_over", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="残回数">
              <div style={readonlyBoxStyle}>{previewRemaining}回</div>
            </Field>

            <Field label="月額料金（税込）">
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                placeholder="例：29800"
                style={inputStyle}
              />
            </Field>

            <Field label="状態">
              <select
                value={form.status}
                onChange={(e) =>
                  updateForm("status", e.target.value as "有効" | "停止")
                }
                style={inputStyle}
              >
                <option value="有効">有効</option>
                <option value="停止">停止</option>
              </select>
            </Field>

            <Field label="開始日">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => updateForm("start_date", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="次回決済日">
              <input
                type="date"
                value={form.next_payment_date}
                onChange={(e) => updateForm("next_payment_date", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <div style={labelStyle}>メモ</div>
              <textarea
                value={form.memo}
                onChange={(e) => updateForm("memo", e.target.value)}
                placeholder="例：1ヶ月繰越あり、毎月5日決済、家族共有なし など"
                style={textareaStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 18,
              flexDirection: mobile ? "column" : "row",
            }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                ...buttonLinkStyle,
                ...BUTTON_PRIMARY_STYLE,
                border: "none",
                cursor: "pointer",
                width: mobile ? "100%" : "auto",
              }}
            >
              {saving ? "保存中..." : "月額契約を保存"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (subscription) {
                  setForm(fromRowToForm(subscription));
                } else {
                  setForm(initialFormWithToday());
                }
                setError("");
                setSuccess("");
              }}
              style={{
                ...secondaryButtonStyle,
                width: mobile ? "100%" : "auto",
              }}
            >
              入力を元に戻す
            </button>
          </div>
        </section>

        <section
          style={{
            ...CARD_STYLE,
            borderRadius: 24,
            padding: mobile ? 16 : 20,
          }}
        >
          <h2 style={sectionTitleStyle}>運用メモ</h2>

          <div style={{ display: "grid", gap: 12 }}>
            <TextBlock
              label="おすすめ運用"
              value="月初または決済日に『月次リセット準備』→ 保存 の流れで使うと、残回数を繰越へ反映しやすいです。"
            />
            <TextBlock
              label="現在の保存先"
              value={
                notice.includes("端末保存")
                  ? "現在は端末保存モードを含みます。"
                  : "現在は Supabase 保存を優先して動作します。"
              }
            />
          </div>
        </section>
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
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
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
    <div style={infoCardStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value || "—"}</div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
      <div style={metricSubStyle}>{sub}</div>
    </div>
  );
}

function TextBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={textBlockStyle}>{value || "—"}</div>
    </div>
  );
}

const eyebrowStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.12em",
  color: "#64748b",
  marginBottom: 4,
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.2,
  color: "#0f172a",
  fontWeight: 800,
};

const subTitleStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: "#475569",
  fontWeight: 600,
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 16px 0",
  fontSize: 20,
  color: "#0f172a",
  fontWeight: 800,
};

const buttonLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "10px 16px",
  borderRadius: 14,
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.92)",
  color: "#334155",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: "10px 16px",
};

const alertErrorStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(254,242,242,0.98)",
  border: "1px solid rgba(239,68,68,0.22)",
  color: "#b91c1c",
  fontSize: 14,
  fontWeight: 700,
};

const alertSuccessStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(240,253,244,0.98)",
  border: "1px solid rgba(22,163,74,0.22)",
  color: "#15803d",
  fontSize: 14,
  fontWeight: 700,
};

const alertNoticeStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(239,246,255,0.98)",
  border: "1px solid rgba(59,130,246,0.2)",
  color: "#1d4ed8",
  fontSize: 14,
  fontWeight: 700,
};

const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const infoCardStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const infoLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  marginBottom: 6,
  letterSpacing: "0.04em",
};

const infoValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#0f172a",
  lineHeight: 1.6,
  wordBreak: "break-word",
};

const metricCardStyle: CSSProperties = {
  padding: "16px 16px 14px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
};

const metricLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  marginBottom: 8,
  letterSpacing: "0.05em",
};

const metricValueStyle: CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.15,
  marginBottom: 8,
  wordBreak: "break-word",
};

const metricSubStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#64748b",
  lineHeight: 1.5,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#64748b",
  marginBottom: 8,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 46,
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
  minHeight: 120,
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

const readonlyBoxStyle: CSSProperties = {
  width: "100%",
  minHeight: 46,
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.95)",
  color: "#0f172a",
  padding: "12px 14px",
  fontSize: 14,
  fontWeight: 800,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
};

const textBlockStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
  fontSize: 14,
  lineHeight: 1.8,
  color: "#334155",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const progressWrapStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "90px 1fr 60px",
  gap: 12,
  alignItems: "center",
};

const progressLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#475569",
};

const progressBarBgStyle: CSSProperties = {
  width: "100%",
  height: 12,
  borderRadius: 999,
  background: "rgba(226,232,240,0.95)",
  overflow: "hidden",
};

const progressBarFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background:
    "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(16,185,129,1) 100%)",
};

const progressValueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#0f172a",
  textAlign: "right",
};