"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BG, CARD, BUTTON_PRIMARY } from "../../styles/theme";

type Customer = {
  id: number | string;
  name?: string;
  kana?: string;
  gender?: string;
  age?: number | string;
  birthday?: string;
  phone?: string;
  email?: string;
  height?: number | string;
  weight?: number | string;
  bodyFat?: number | string;
  muscleMass?: number | string;
  visceralFat?: number | string;
  goal?: string;
  memo?: string;
  notes?: string;
  note?: string;
  purpose?: string;
  target?: string;
  planType?: string;
  planStyle?: string;
  price?: number | string;
  monthlyCount?: number | string;
  usedCount?: number | string;
  carryOver?: number | string;
  remaining?: number | string;
  status?: string;
  nextPayment?: string;
  lastVisitDate?: string;
  lastVisitAt?: string;
  ltv?: number | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
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

export default function CustomerPage() {
  const [mounted, setMounted] = useState(false);
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
    if (!mounted) return;
    fetchCustomers();
  }, [mounted]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const localList = getLocalCustomers();

      if (!supabase) {
        setCustomers(sortCustomers(localList));
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        setCustomers(sortCustomers(localList));
        return;
      }

      const dbList = ((data || []) as Customer[]).map(normalizeCustomer);
      const merged = mergeCustomers(dbList, localList);

      setCustomers(sortCustomers(merged));
      saveLocalCustomers(merged);
    } catch (error: any) {
      console.error(error);
      setCustomers(sortCustomers(getLocalCustomers()));
      setErrorMessage("顧客一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const handleChange = (key: keyof Customer, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(String(customer.id));
    setForm({
      ...emptyForm,
      ...customer,
      id: customer.id,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("この顧客を削除しますか？");
    if (!ok) return;

    try {
      const next = customers.filter((item) => String(item.id) !== String(id));
      setCustomers(next);
      saveLocalCustomers(next);
      localStorage.removeItem(`customer-${id}`);

      if (supabase) {
        await supabase.from("customers").delete().eq("id", Number(id));
      }

      setMessage("削除しました。");
      if (editingId === String(id)) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("削除に失敗しました。");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setErrorMessage("");

      if (!String(form.name || "").trim()) {
        setErrorMessage("氏名を入力してください。");
        return;
      }

      const nextId =
        editingId ||
        String(getNextCustomerId(customers));

      const payload: Customer = normalizeCustomer({
        ...form,
        id: nextId,
        purpose: form.goal || "",
        target: form.goal || "",
        notes: form.memo || "",
        note: form.memo || "",
        lastVisitAt: form.lastVisitDate || "",
        updated_at: new Date().toISOString(),
        created_at:
          editingId && form.created_at ? form.created_at : new Date().toISOString(),
      });

      const nextList = upsertLocalCustomer(customers, payload);
      setCustomers(sortCustomers(nextList));
      saveLocalCustomers(nextList);
      saveLocalCustomerDetail(payload);

      if (supabase) {
        try {
          const dbPayload = buildDbPayload(payload);
          const { error } = await supabase
            .from("customers")
            .upsert(dbPayload, { onConflict: "id" });

          if (error) {
            console.error("Supabase save skipped:", error.message);
          }
        } catch (dbError) {
          console.error("Supabase save failed:", dbError);
        }
      }

      setMessage(editingId ? "顧客情報を更新しました。" : "顧客を登録しました。");
      resetForm();
    } catch (error) {
      console.error(error);
      setErrorMessage("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <main style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.glowC} />

      <div style={styles.container}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/" style={styles.backLink}>
            ← ホームへ戻る
          </Link>

          <div style={{ ...CARD, padding: "24px", marginTop: 12 }}>
            <div style={styles.eyebrow}>CUSTOMER MANAGEMENT</div>
            <h1 style={styles.pageTitle}>顧客管理</h1>
            <p style={styles.pageSub}>
              顧客登録・編集・検索・詳細確認ができます。
            </p>
          </div>
        </div>

        {message ? <div style={styles.successBox}>{message}</div> : null}
        {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

        <div style={styles.mainGrid}>
          <section style={{ ...CARD, padding: "20px" }}>
            <h2 style={styles.sectionTitle}>
              {editingId ? "顧客編集" : "新規顧客登録"}
            </h2>

            <div style={styles.formGrid}>
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

            <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...BUTTON_PRIMARY,
                  padding: "14px 22px",
                  boxShadow: "0 10px 20px rgba(139,94,60,0.22)",
                }}
              >
                {saving ? "保存中..." : editingId ? "更新する" : "登録する"}
              </button>

              <button type="button" onClick={resetForm} style={styles.whiteButton}>
                リセット
              </button>
            </div>
          </section>

          <section style={{ ...CARD, padding: "20px" }}>
            <h2 style={styles.sectionTitle}>顧客一覧</h2>

            <div style={{ marginBottom: 14 }}>
              <Label>検索</Label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="名前・電話・プランで検索"
                style={styles.input}
              />
            </div>

            {loading ? (
              <div style={styles.muted}>読み込み中...</div>
            ) : filteredCustomers.length === 0 ? (
              <div style={styles.muted}>顧客データがありません。</div>
            ) : (
              <div style={styles.customerList}>
                {filteredCustomers.map((customer) => (
                  <div key={String(customer.id)} style={styles.customerCard}>
                    <div style={styles.customerTop}>
                      <div>
                        <div style={styles.customerName}>
                          {customer.name || "顧客名未設定"}
                        </div>
                        <div style={styles.customerMeta}>
                          ID: {customer.id} / 電話: {customer.phone || "—"}
                        </div>
                        <div style={styles.customerMeta}>
                          プラン: {customer.planType || "—"} / 状態: {customer.status || "—"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link
                          href={`/customer/${customer.id}`}
                          style={styles.detailLink}
                        >
                          詳細
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleEdit(customer)}
                          style={styles.editButton}
                        >
                          編集
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(String(customer.id))}
                          style={styles.deleteButton}
                        >
                          削除
                        </button>
                      </div>
                    </div>

                    <div style={styles.customerInfoGrid}>
                      <MiniInfo label="身長" value={withUnit(customer.height, "cm")} />
                      <MiniInfo label="体重" value={withUnit(customer.weight, "kg")} />
                      <MiniInfo label="目標" value={customer.goal || "未設定"} />
                      <MiniInfo label="料金" value={yen(customer.price)} />
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

function getLocalCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem("customers");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeCustomer) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomers(list: Customer[]) {
  localStorage.setItem("customers", JSON.stringify(list));
}

function saveLocalCustomerDetail(customer: Customer) {
  localStorage.setItem(`customer-${customer.id}`, JSON.stringify(customer));
}

function mergeCustomers(dbList: Customer[], localList: Customer[]) {
  const map = new Map<string, Customer>();

  dbList.forEach((item) => {
    map.set(String(item.id), normalizeCustomer(item));
  });

  localList.forEach((item) => {
    const key = String(item.id);
    const prev = map.get(key) || {};
    map.set(key, normalizeCustomer({ ...prev, ...item }));
  });

  return Array.from(map.values());
}

function upsertLocalCustomer(list: Customer[], customer: Customer) {
  const next = [...list];
  const index = next.findIndex((item) => String(item.id) === String(customer.id));

  if (index >= 0) {
    next[index] = normalizeCustomer({
      ...next[index],
      ...customer,
    });
  } else {
    next.push(normalizeCustomer(customer));
  }

  return next;
}

function getNextCustomerId(list: Customer[]) {
  const nums = list
    .map((item) => Number(item.id))
    .filter((num) => !Number.isNaN(num));

  if (nums.length === 0) return 1;
  return Math.max(...nums) + 1;
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
    bodyFat: item?.bodyFat ?? "",
    muscleMass: item?.muscleMass ?? "",
    visceralFat: item?.visceralFat ?? "",
    goal: item?.goal ?? item?.purpose ?? item?.target ?? "",
    memo: item?.memo ?? item?.notes ?? item?.note ?? "",
    notes: item?.notes ?? item?.memo ?? "",
    note: item?.note ?? item?.memo ?? "",
    purpose: item?.purpose ?? item?.goal ?? "",
    target: item?.target ?? item?.goal ?? "",
    planType: item?.planType ?? "",
    planStyle: item?.planStyle ?? "",
    price: item?.price ?? "",
    monthlyCount: item?.monthlyCount ?? "",
    usedCount: item?.usedCount ?? "",
    carryOver: item?.carryOver ?? "",
    remaining: item?.remaining ?? "",
    status: item?.status ?? "",
    nextPayment: item?.nextPayment ?? "",
    lastVisitDate: item?.lastVisitDate ?? item?.lastVisitAt ?? "",
    lastVisitAt: item?.lastVisitAt ?? item?.lastVisitDate ?? "",
    ltv: item?.ltv ?? "",
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
    bodyFat: toNullableNumber(customer.bodyFat),
    muscleMass: toNullableNumber(customer.muscleMass),
    visceralFat: toNullableNumber(customer.visceralFat),
    goal: customer.goal || null,
    memo: customer.memo || null,
    planType: customer.planType || null,
    planStyle: customer.planStyle || null,
    price: toNullableNumber(customer.price),
    monthlyCount: toNullableNumber(customer.monthlyCount),
    usedCount: toNullableNumber(customer.usedCount),
    carryOver: toNullableNumber(customer.carryOver),
    remaining: toNullableNumber(customer.remaining),
    status: customer.status || null,
    nextPayment: customer.nextPayment || null,
    lastVisitDate: customer.lastVisitDate || null,
    ltv: toNullableNumber(customer.ltv),
    updated_at: new Date().toISOString(),
  };
}

function toNullableNumber(value: any) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function withUnit(value: any, unit: string) {
  if (value === null || value === undefined || value === "") return "";
  return `${value}${unit}`;
}

function yen(value: any) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return "—";
  return `¥${num.toLocaleString()}`;
}

function sortCustomers(list: Customer[]) {
  return [...list].sort((a, b) => Number(a.id) - Number(b.id));
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    padding: "24px 20px 60px",
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
    maxWidth: "1200px",
    margin: "0 auto",
  },
  backLink: {
    display: "inline-flex",
    textDecoration: "none",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 700,
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
    fontSize: 30,
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
    marginBottom: 16,
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
  },
  errorBox: {
    marginBottom: 16,
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 20,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    color: "#0f172a",
    marginBottom: 12,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginTop: 8,
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
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  customerName: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },
  customerMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
  },
  muted: {
    color: "#64748b",
    fontSize: 14,
  },
};