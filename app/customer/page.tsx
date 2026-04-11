"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import { BG, CARD, BUTTON_PRIMARY } from "../../styles/theme";

type Customer = {
  id: number | string;
  name?: string | null;
  kana?: string | null;
  gender?: string | null;
  age?: number | string | null;
  birthday?: string | null;
  phone?: string | null;
  email?: string | null;
  height?: number | string | null;
  weight?: number | string | null;
  bodyFat?: number | string | null;
  muscleMass?: number | string | null;
  visceralFat?: number | string | null;
  goal?: string | null;
  memo?: string | null;
  planType?: string | null;
  planStyle?: string | null;
  price?: number | string | null;
  monthlyCount?: number | string | null;
  usedCount?: number | string | null;
  carryOver?: number | string | null;
  remaining?: number | string | null;
  status?: string | null;
  nextPayment?: string | null;
  lastVisitDate?: string | null;
  ltv?: number | string | null;
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

const emptyForm: Customer = {
  id: "",
  name: "",
  kana: "",
  gender: "",
  age: "",
  birthday: "",
  phone: "",
  email: "",
  height: "",
  weight: "",
  bodyFat: "",
  muscleMass: "",
  visceralFat: "",
  goal: "",
  memo: "",
  planType: "",
  planStyle: "",
  price: "",
  monthlyCount: "",
  usedCount: "",
  carryOver: "",
  remaining: "",
  status: "",
  nextPayment: "",
  lastVisitDate: "",
  ltv: "",
};

function toNullableNumber(value: any) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function normalizeCustomer(item: any): Customer {
  return {
    ...item,
    id: item?.id ?? "",
    name: item?.name ?? "",
    kana: item?.kana ?? "",
    gender: item?.gender ?? "",
    age: item?.age ?? "",
    birthday: item?.birthday ?? "",
    phone: item?.phone ?? "",
    email: item?.email ?? "",
    height: item?.height ?? "",
    weight: item?.weight ?? "",
    bodyFat: item?.bodyFat ?? item?.body_fat ?? "",
    muscleMass: item?.muscleMass ?? item?.muscle_mass ?? "",
    visceralFat: item?.visceralFat ?? item?.visceral_fat ?? "",
    goal: item?.goal ?? item?.purpose ?? item?.target ?? "",
    memo: item?.memo ?? item?.notes ?? item?.note ?? "",
    planType: item?.planType ?? item?.plan_type ?? "",
    planStyle: item?.planStyle ?? item?.plan_style ?? "",
    price: item?.price ?? "",
    monthlyCount: item?.monthlyCount ?? item?.monthly_count ?? "",
    usedCount: item?.usedCount ?? item?.used_count ?? "",
    carryOver: item?.carryOver ?? item?.carry_over ?? "",
    remaining: item?.remaining ?? item?.remaining_count ?? "",
    status: item?.status ?? "",
    nextPayment: item?.nextPayment ?? item?.next_payment_date ?? "",
    lastVisitDate: item?.lastVisitDate ?? item?.last_visit_date ?? "",
    ltv: item?.ltv ?? "",
    created_at: item?.created_at ?? null,
    updated_at: item?.updated_at ?? null,
  };
}

function buildDbPayload(customer: Customer) {
  return {
    id: Number(customer.id),
    name: customer.name || null,
    kana: customer.kana || null,
    gender: customer.gender || null,
    age: toNullableNumber(customer.age),
    birthday: customer.birthday || null,
    phone: customer.phone || null,
    email: customer.email || null,
    height: toNullableNumber(customer.height),
    weight: toNullableNumber(customer.weight),
    body_fat: toNullableNumber(customer.bodyFat),
    muscle_mass: toNullableNumber(customer.muscleMass),
    visceral_fat: toNullableNumber(customer.visceralFat),
    goal: customer.goal || null,
    memo: customer.memo || null,
    plan_type: customer.planType || null,
    plan_style: customer.planStyle || null,
    price: toNullableNumber(customer.price),
    monthly_count: toNullableNumber(customer.monthlyCount),
    used_count: toNullableNumber(customer.usedCount),
    carry_over: toNullableNumber(customer.carryOver),
    remaining_count: toNullableNumber(customer.remaining),
    status: customer.status || null,
    next_payment_date: customer.nextPayment || null,
    last_visit_date: customer.lastVisitDate || null,
    ltv: toNullableNumber(customer.ltv),
    updated_at: new Date().toISOString(),
  };
}

function getNextCustomerId(list: Customer[]) {
  const nums = list
    .map((item) => Number(item.id))
    .filter((num) => !Number.isNaN(num));

  if (nums.length === 0) return 1;
  return Math.max(...nums) + 1;
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("ja-JP").format(d);
}

function yen(value: any) {
  const num = Number(value || 0);
  if (Number.isNaN(num) || value === "" || value === null || value === undefined) return "—";
  return `¥${num.toLocaleString()}`;
}

function withUnit(value: any, unit: string) {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${unit}`;
}

export default function CustomerPage() {
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1400);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState("");

  const [form, setForm] = useState<Customer>(emptyForm);
  const [editingId, setEditingId] = useState<string>("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    if (typeof window === "undefined") return;

    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void fetchCustomers();
  }, [mounted]);

  const tablet = windowWidth < 1180;
  const mobile = windowWidth < 768;

  async function fetchCustomers() {
    if (!supabase) {
      setErrorMessage("Supabaseの環境変数が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      setCustomers(((data || []) as Customer[]).map(normalizeCustomer));
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "顧客一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((customer) => {
      return [
        customer.id,
        customer.name,
        customer.kana,
        customer.phone,
        customer.email,
        customer.planType,
        customer.planStyle,
        customer.status,
      ]
        .map((v) => String(v || "").toLowerCase())
        .some((v) => v.includes(q));
    });
  }, [customers, keyword]);

  const activeCount = useMemo(() => {
    return customers.filter((c) => String(c.status || "") === "有効").length;
  }, [customers]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function handleChange(key: keyof Customer, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleEdit(customer: Customer) {
    setEditingId(String(customer.id));
    setForm({
      ...emptyForm,
      ...customer,
      id: customer.id,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("この顧客を削除しますか？");
    if (!ok) return;
    if (!supabase) return;

    try {
      setMessage("");
      setErrorMessage("");

      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", Number(id));

      if (error) throw error;

      setCustomers((prev) => prev.filter((item) => String(item.id) !== String(id)));
      setMessage("削除しました。");

      if (editingId === String(id)) resetForm();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "削除に失敗しました。");
    }
  }

  async function handleSave() {
    if (!supabase) {
      setErrorMessage("Supabaseの環境変数が未設定です。");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setErrorMessage("");

      if (!String(form.name || "").trim()) {
        setErrorMessage("氏名を入力してください。");
        return;
      }

      const nextId = editingId || String(getNextCustomerId(customers));

      const payload: Customer = normalizeCustomer({
        ...form,
        id: nextId,
      });

      const dbPayload: any = buildDbPayload(payload);

      if (!editingId) {
        dbPayload.created_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("customers")
        .upsert(dbPayload, { onConflict: "id" });

      if (error) throw error;

      await fetchCustomers();
      setMessage(editingId ? "顧客情報を更新しました。" : "顧客を登録しました。");
      resetForm();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <main style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.glowC} />

      <div style={styles.container}>
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              gap: 12,
              flexWrap: "wrap",
              flexDirection: mobile ? "column" : "row",
              marginBottom: 12,
            }}
          >
            <Link
              href="/"
              style={{
                ...styles.backLink,
                width: mobile ? "100%" : "auto",
              }}
            >
              ← ホームへ戻る
            </Link>

            <button
              type="button"
              onClick={() => void fetchCustomers()}
              style={{
                ...styles.topWhiteButton,
                width: mobile ? "100%" : "auto",
              }}
            >
              再読み込み
            </button>
          </div>

          <div style={{ ...CARD, padding: mobile ? "18px" : "24px", marginTop: 12 }}>
            <div style={styles.eyebrow}>CUSTOMER MANAGEMENT</div>
            <h1
              style={{
                ...styles.pageTitle,
                fontSize: mobile ? 24 : 30,
              }}
            >
              顧客管理
            </h1>
            <p style={styles.pageSub}>
              顧客登録・編集・検索・詳細確認ができます。
            </p>
          </div>
        </div>

        <section
          style={{
            ...styles.summaryGrid,
            gridTemplateColumns: mobile
              ? "1fr"
              : tablet
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(4, minmax(0, 1fr))",
          }}
        >
          <SummaryCard label="登録顧客数" value={`${customers.length}名`} />
          <SummaryCard label="表示件数" value={`${filteredCustomers.length}件`} />
          <SummaryCard label="有効顧客" value={`${activeCount}名`} />
          <SummaryCard label="編集中" value={editingId ? `ID ${editingId}` : "なし"} />
        </section>

        {message ? <div style={styles.successBox}>{message}</div> : null}
        {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

        <div
          style={{
            ...styles.mainGrid,
            gridTemplateColumns: tablet ? "1fr" : "1.1fr 0.9fr",
          }}
        >
          <section style={{ ...CARD, padding: mobile ? "16px" : "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: mobile ? "stretch" : "center",
                gap: 12,
                flexWrap: "wrap",
                flexDirection: mobile ? "column" : "row",
                marginBottom: 12,
              }}
            >
              <h2 style={styles.sectionTitle}>
                {editingId ? "顧客編集" : "新規顧客登録"}
              </h2>

              {editingId ? (
                <div style={styles.editingBadge}>編集中: ID {editingId}</div>
              ) : null}
            </div>

            <div
              style={{
                ...styles.formGrid,
                gridTemplateColumns: mobile
                  ? "1fr"
                  : tablet
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(3, minmax(0, 1fr))",
              }}
            >
              <Field
                label="氏名"
                input={
                  <input
                    value={String(form.name || "")}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="例 山崎利樹"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="かな"
                input={
                  <input
                    value={String(form.kana || "")}
                    onChange={(e) => handleChange("kana", e.target.value)}
                    placeholder="例 やまざきとしき"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="電話"
                input={
                  <input
                    value={String(form.phone || "")}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="例 09012345678"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="メール"
                input={
                  <input
                    value={String(form.email || "")}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="例 sample@mail.com"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="性別"
                input={
                  <select
                    value={String(form.gender || "")}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    style={styles.input}
                  >
                    <option value="">選択してください</option>
                    <option value="男性">男性</option>
                    <option value="女性">女性</option>
                    <option value="その他">その他</option>
                  </select>
                }
              />
              <Field
                label="年齢"
                input={
                  <input
                    value={String(form.age || "")}
                    onChange={(e) => handleChange("age", e.target.value)}
                    placeholder="例 34"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="誕生日"
                input={
                  <input
                    type="date"
                    value={String(form.birthday || "")}
                    onChange={(e) => handleChange("birthday", e.target.value)}
                    style={styles.input}
                  />
                }
              />
              <Field
                label="身長(cm)"
                input={
                  <input
                    value={String(form.height || "")}
                    onChange={(e) => handleChange("height", e.target.value)}
                    placeholder="例 170"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="現在体重(kg)"
                input={
                  <input
                    value={String(form.weight || "")}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    placeholder="例 65.2"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="体脂肪率(%)"
                input={
                  <input
                    value={String(form.bodyFat || "")}
                    onChange={(e) => handleChange("bodyFat", e.target.value)}
                    placeholder="例 18.5"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="筋肉量(kg)"
                input={
                  <input
                    value={String(form.muscleMass || "")}
                    onChange={(e) => handleChange("muscleMass", e.target.value)}
                    placeholder="例 48.3"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="内臓脂肪"
                input={
                  <input
                    value={String(form.visceralFat || "")}
                    onChange={(e) => handleChange("visceralFat", e.target.value)}
                    placeholder="例 7"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="プラン種別"
                input={
                  <input
                    value={String(form.planType || "")}
                    onChange={(e) => handleChange("planType", e.target.value)}
                    placeholder="例 月4回"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="利用形態"
                input={
                  <input
                    value={String(form.planStyle || "")}
                    onChange={(e) => handleChange("planStyle", e.target.value)}
                    placeholder="例 マンツーマン"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="月回数"
                input={
                  <input
                    value={String(form.monthlyCount || "")}
                    onChange={(e) => handleChange("monthlyCount", e.target.value)}
                    placeholder="例 4"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="使用回数"
                input={
                  <input
                    value={String(form.usedCount || "")}
                    onChange={(e) => handleChange("usedCount", e.target.value)}
                    placeholder="例 1"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="繰越"
                input={
                  <input
                    value={String(form.carryOver || "")}
                    onChange={(e) => handleChange("carryOver", e.target.value)}
                    placeholder="例 0"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="残回数"
                input={
                  <input
                    value={String(form.remaining || "")}
                    onChange={(e) => handleChange("remaining", e.target.value)}
                    placeholder="例 3"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="料金"
                input={
                  <input
                    value={String(form.price || "")}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="例 33880"
                    style={styles.input}
                  />
                }
              />
              <Field
                label="状態"
                input={
                  <select
                    value={String(form.status || "")}
                    onChange={(e) => handleChange("status", e.target.value)}
                    style={styles.input}
                  >
                    <option value="">選択してください</option>
                    <option value="有効">有効</option>
                    <option value="停止">停止</option>
                    <option value="休会">休会</option>
                  </select>
                }
              />
              <Field
                label="次回支払日"
                input={
                  <input
                    type="date"
                    value={String(form.nextPayment || "")}
                    onChange={(e) => handleChange("nextPayment", e.target.value)}
                    style={styles.input}
                  />
                }
              />
              <Field
                label="最終来店日"
                input={
                  <input
                    type="date"
                    value={String(form.lastVisitDate || "")}
                    onChange={(e) => handleChange("lastVisitDate", e.target.value)}
                    style={styles.input}
                  />
                }
              />
              <Field
                label="LTV"
                input={
                  <input
                    value={String(form.ltv || "")}
                    onChange={(e) => handleChange("ltv", e.target.value)}
                    placeholder="例 120000"
                    style={styles.input}
                  />
                }
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <Label>目標</Label>
              <textarea
                value={String(form.goal || "")}
                onChange={(e) => handleChange("goal", e.target.value)}
                rows={3}
                placeholder="例 体重-5kg、姿勢改善"
                style={styles.textarea}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <Label>メモ</Label>
              <textarea
                value={String(form.memo || "")}
                onChange={(e) => handleChange("memo", e.target.value)}
                rows={4}
                placeholder="備考・特徴・注意点など"
                style={styles.textarea}
              />
            </div>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                flexDirection: mobile ? "column" : "row",
              }}
            >
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                style={{
                  ...BUTTON_PRIMARY,
                  ...styles.primaryButton,
                  width: mobile ? "100%" : "auto",
                }}
              >
                {saving ? "保存中..." : editingId ? "更新する" : "登録する"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                style={{
                  ...styles.whiteButton,
                  width: mobile ? "100%" : "auto",
                }}
              >
                リセット
              </button>
            </div>
          </section>

          <section style={{ ...CARD, padding: mobile ? "16px" : "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: mobile ? "stretch" : "center",
                gap: 12,
                flexWrap: "wrap",
                flexDirection: mobile ? "column" : "row",
                marginBottom: 12,
              }}
            >
              <h2 style={styles.sectionTitle}>顧客一覧</h2>

              <div style={{ width: mobile ? "100%" : "320px", maxWidth: "100%" }}>
                <Label>検索</Label>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="名前・電話・プランで検索"
                  style={styles.input}
                />
              </div>
            </div>

            {loading ? (
              <div style={styles.mutedBox}>読み込み中...</div>
            ) : filteredCustomers.length === 0 ? (
              <div style={styles.mutedBox}>顧客データがありません。</div>
            ) : (
              <div style={styles.customerList}>
                {filteredCustomers.map((customer) => (
                  <div key={String(customer.id)} style={styles.customerCard}>
                    <div
                      style={{
                        ...styles.customerTop,
                        flexDirection: mobile ? "column" : "row",
                        alignItems: mobile ? "stretch" : "flex-start",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.customerName}>
                          {customer.name || "顧客名未設定"}
                        </div>
                        <div style={styles.customerMeta}>
                          ID: {customer.id} / 電話: {customer.phone || "—"}
                        </div>
                        <div style={styles.customerMeta}>
                          プラン: {customer.planType || "—"} / 状態: {customer.status || "—"}
                        </div>
                        <div style={styles.customerMeta}>
                          登録日: {formatDate(customer.created_at)}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          width: mobile ? "100%" : "auto",
                          flexDirection: mobile ? "column" : "row",
                        }}
                      >
                        <Link
                          href={`/customer/${customer.id}`}
                          style={{
                            ...styles.detailLink,
                            width: mobile ? "100%" : "auto",
                            justifyContent: "center",
                          }}
                        >
                          詳細
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleEdit(customer)}
                          style={{
                            ...styles.editButton,
                            width: mobile ? "100%" : "auto",
                          }}
                        >
                          編集
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(String(customer.id))}
                          style={{
                            ...styles.deleteButton,
                            width: mobile ? "100%" : "auto",
                          }}
                        >
                          削除
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        ...styles.customerInfoGrid,
                        gridTemplateColumns: mobile
                          ? "1fr"
                          : "repeat(auto-fit, minmax(140px, 1fr))",
                      }}
                    >
                      <MiniInfo label="身長" value={withUnit(customer.height, "cm")} />
                      <MiniInfo label="体重" value={withUnit(customer.weight, "kg")} />
                      <MiniInfo label="目標" value={customer.goal || "未設定"} />
                      <MiniInfo label="料金" value={yen(customer.price)} />
                      <MiniInfo label="次回支払日" value={formatDate(customer.nextPayment)} />
                      <MiniInfo label="LTV" value={yen(customer.ltv)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  input,
}: {
  label: string;
  input: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {input}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={styles.label}>{children}</div>;
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value || "—"}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryLabel}>{label}</div>
      <div style={styles.summaryValue}>{value}</div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    padding: "24px 16px 60px",
    background: BG,
  },
  glowA: {
    position: "absolute",
    top: "-90px",
    left: "-70px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.95)",
    filter: "blur(55px)",
    pointerEvents: "none",
  },
  glowB: {
    position: "absolute",
    top: "120px",
    right: "-60px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.85)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },
  glowC: {
    position: "absolute",
    bottom: "-120px",
    left: "18%",
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    background: "rgba(203,213,225,0.35)",
    filter: "blur(75px)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1400px",
    margin: "0 auto",
    display: "grid",
    gap: 20,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 700,
    minHeight: 44,
    padding: "0 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.95)",
  },
  topWhiteButton: {
    border: "1px solid rgba(255,255,255,0.95)",
    background: "rgba(255,255,255,0.82)",
    color: "#334155",
    borderRadius: 14,
    minHeight: 44,
    padding: "0 16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.22em",
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: 8,
  },
  pageTitle: {
    margin: 0,
    lineHeight: 1.3,
    color: "#0f172a",
    fontWeight: 900,
  },
  pageSub: {
    marginTop: 10,
    marginBottom: 0,
    color: "#64748b",
    fontSize: 14,
  },
  successBox: {
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
  },
  summaryGrid: {
    display: "grid",
    gap: 14,
  },
  summaryCard: {
    background: "rgba(255,255,255,0.74)",
    border: "1px solid rgba(255,255,255,0.96)",
    borderRadius: 18,
    padding: "16px",
    boxShadow:
      "0 14px 30px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 800,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    color: "#0f172a",
    fontWeight: 900,
    lineHeight: 1.15,
    wordBreak: "break-word",
  },
  mainGrid: {
    display: "grid",
    gap: 20,
    alignItems: "start",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    color: "#0f172a",
    fontWeight: 800,
  },
  editingBadge: {
    minHeight: 34,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 9999,
    padding: "0 12px",
    background: "rgba(59,130,246,0.08)",
    border: "1px solid rgba(59,130,246,0.18)",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 800,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(226,232,240,0.9)",
    background: "rgba(255,255,255,0.88)",
    color: "#0f172a",
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(226,232,240,0.9)",
    background: "rgba(255,255,255,0.88)",
    color: "#0f172a",
    padding: 12,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
  },
  formGrid: {
    display: "grid",
    gap: 14,
    marginTop: 8,
  },
  primaryButton: {
    padding: "14px 22px",
    boxShadow: "0 10px 20px rgba(139,94,60,0.22)",
  },
  whiteButton: {
    border: "1px solid rgba(255,255,255,0.95)",
    background: "rgba(255,255,255,0.82)",
    color: "#334155",
    borderRadius: 14,
    padding: "14px 22px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  customerList: {
    display: "grid",
    gap: 12,
  },
  customerCard: {
    border: "1px solid rgba(255,255,255,0.95)",
    borderRadius: 18,
    background: "rgba(255,255,255,0.68)",
    padding: 16,
    boxShadow:
      "0 14px 30px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  customerTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  customerName: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.3,
    wordBreak: "break-word",
  },
  customerMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
    wordBreak: "break-word",
  },
  detailLink: {
    textDecoration: "none",
    color: "#8b5e3c",
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid rgba(214,195,179,0.8)",
    background: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    padding: "10px 12px",
    display: "inline-flex",
    alignItems: "center",
  },
  editButton: {
    border: "1px solid rgba(59,130,246,0.18)",
    background: "rgba(59,130,246,0.08)",
    color: "#1d4ed8",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteButton: {
    border: "1px solid rgba(239,68,68,0.18)",
    background: "rgba(239,68,68,0.08)",
    color: "#b91c1c",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  customerInfoGrid: {
    marginTop: 12,
    display: "grid",
    gap: 10,
  },
  infoCard: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 12,
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  infoLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  mutedBox: {
    color: "#64748b",
    fontSize: 14,
    minHeight: 110,
    borderRadius: 16,
    border: "1px dashed rgba(203,213,225,0.9)",
    background: "rgba(255,255,255,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    textAlign: "center",
  },
};