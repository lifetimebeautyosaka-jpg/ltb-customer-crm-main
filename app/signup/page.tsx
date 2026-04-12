"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Plan = {
  id: string;
  name: string;
  price: number;
  description: string;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    id: "stretch_4",
    name: "ストレッチ 月4回コース",
    price: 32000,
    description: "定期的に身体を整えたい方向けの基本プラン",
    badge: "おすすめ",
  },
  {
    id: "stretch_8",
    name: "ストレッチ 月8回コース",
    price: 64000,
    description: "不調改善を早めたい方向けの高頻度プラン",
  },
  {
    id: "training_4",
    name: "トレーニング 月4回コース",
    price: 36000,
    description: "運動習慣をつけたい方向けの定番プラン",
  },
  {
    id: "training_8",
    name: "トレーニング 月8回コース",
    price: 72000,
    description: "しっかり結果を出したい方向け",
  },
  {
    id: "pair_4",
    name: "ペア 月4回コース",
    price: 44000,
    description: "ご家族・ご友人と一緒に通いたい方向け",
    badge: "人気",
  },
  {
    id: "unlimited",
    name: "通い放題プラン",
    price: 99000,
    description: "本気で身体を変えたい方向けの最上位プラン",
  },
];

const inputStyle =
  "w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 outline-none backdrop-blur-md transition focus:border-violet-300/50 focus:bg-white/14";

const labelStyle = "mb-2 block text-sm font-medium text-white/85";

function formatPrice(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    full_name_kana: "",
    gender: "",
    birth_date: "",
    phone: "",
    email: "",
    postal_code: "",
    address: "",
    store_name: "江戸堀",
    plan_id: "stretch_4",
    visit_style: "マンツーマン",
    payment_method: "クレジットカード",
    trial_status: "体験済み",
    agree_terms: false,
    memo: "",
  });

  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === form.plan_id) ?? PLANS[0],
    [form.plan_id]
  );

  const updateField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep1 = () => {
    if (!form.full_name.trim()) return "氏名を入力してください。";

    const phone = normalizePhone(form.phone);
    if (!phone) return "電話番号を入力してください。";
    if (phone.length < 10 || phone.length > 11) {
      return "電話番号の形式が正しくありません。";
    }

    if (!form.email.trim()) return "メールアドレスを入力してください。";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "メールアドレスの形式が正しくありません。";
    }

    return "";
  };

  const validateStep2 = () => {
    if (!form.plan_id) return "プランを選択してください。";
    if (!form.payment_method) return "支払い方法を選択してください。";
    if (!form.store_name) return "希望店舗を選択してください。";
    return "";
  };

  const validateStep3 = () => {
    if (!form.agree_terms) return "利用規約への同意が必要です。";
    return "";
  };

  const handleNext = () => {
    setError("");

    if (step === 1) {
      const msg = validateStep1();
      if (msg) {
        setError(msg);
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const msg = validateStep2();
      if (msg) {
        setError(msg);
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    setError("");

    const step1Error = validateStep1();
    if (step1Error) {
      setError(step1Error);
      return;
    }

    const step2Error = validateStep2();
    if (step2Error) {
      setError(step2Error);
      return;
    }

    const step3Error = validateStep3();
    if (step3Error) {
      setError(step3Error);
      return;
    }

    try {
      setLoading(true);

      const normalizedPhone = normalizePhone(form.phone);
      const normalizedEmail = form.email.trim().toLowerCase();

      const { data: duplicateList, error: duplicateError } = await supabase
        .from("online_signups")
        .select("id, email, phone")
        .or(`email.eq.${normalizedEmail},phone.eq.${normalizedPhone}`)
        .limit(1);

      if (duplicateError) {
        throw duplicateError;
      }

      if (duplicateList && duplicateList.length > 0) {
        setError("同じメールアドレスまたは電話番号の申請がすでにあります。");
        return;
      }

      const payload = {
        full_name: form.full_name.trim(),
        full_name_kana: form.full_name_kana.trim() || null,
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        phone: normalizedPhone,
        email: normalizedEmail,
        postal_code: form.postal_code.trim() || null,
        address: form.address.trim() || null,
        store_name: form.store_name || null,
        plan_id: form.plan_id,
        plan_name: selectedPlan.name,
        monthly_price: selectedPlan.price,
        visit_style: form.visit_style || null,
        payment_method: form.payment_method || null,
        trial_status: form.trial_status || null,
        agree_terms: form.agree_terms,
        status: "pending",
        is_new_customer: true,
        memo: form.memo.trim() || null,
      };

      const { error: insertError } = await supabase
        .from("online_signups")
        .insert(payload);

      if (insertError) {
        throw insertError;
      }

      setDone(true);
    } catch (e: any) {
      setError(e?.message || "送信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#09090f] text-white">
        <div className="relative isolate">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,92,230,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.22),transparent_30%),linear-gradient(180deg,#0b0b12_0%,#11111c_55%,#0b0b12_100%)]" />
          <div className="absolute left-[-80px] top-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute right-[-40px] top-24 h-72 w-72 rounded-full bg-pink-400/20 blur-3xl" />

          <div className="relative mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
            <div className="w-full rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-[0_0_60px_rgba(116,92,255,0.15)] backdrop-blur-xl md:p-10">
              <div className="mb-6 inline-flex rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200">
                受付完了
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                オンライン入会申請を
                <br />
                受け付けました。
              </h1>

              <p className="mt-5 text-base leading-8 text-white/75">
                ご入力内容を確認後、店舗側でご案内いたします。
                <br />
                担当スタッフからのご連絡をお待ちください。
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/6 p-5">
                <div className="text-sm text-white/60">申請内容</div>
                <div className="mt-2 text-xl font-semibold">{selectedPlan.name}</div>
                <div className="mt-1 text-violet-200">
                  {formatPrice(selectedPlan.price)} / 月
                </div>
                <div className="mt-2 text-sm text-white/65">
                  希望店舗：{form.store_name}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => router.push("/")}
                  className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-medium text-white transition hover:bg-white/15"
                >
                  TOPへ戻る
                </button>

                <button
                  onClick={() => router.push("/login")}
                  className="rounded-2xl bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 px-5 py-3 font-semibold text-white shadow-[0_0_30px_rgba(176,110,255,0.35)] transition hover:scale-[1.01]"
                >
                  ログイン画面へ
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#09090f] text-white">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,92,230,0.30),transparent_30%),radial-gradient(circle_at_top_right,rgba(244,114,182,0.24),transparent_26%),linear-gradient(180deg,#0b0b12_0%,#11111c_58%,#0b0b12_100%)]" />
        <div className="absolute left-[-90px] top-16 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-[-60px] top-20 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
          <header className="mb-6 rounded-[28px] border border-white/10 bg-black/35 px-4 py-4 backdrop-blur-xl md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-black tracking-tight text-white md:text-3xl">
                  GYMUP CRM
                </div>
                <div className="mt-1 text-sm tracking-[0.18em] text-violet-200/90">
                  ONLINE SIGNUP
                </div>
              </div>

              <div className="rounded-2xl bg-white/8 px-4 py-3 text-sm font-medium text-white/90 backdrop-blur-md">
                オンライン入会
              </div>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/8 p-5 shadow-[0_0_60px_rgba(116,92,255,0.15)] backdrop-blur-xl md:p-7">
              <div className="mb-4 inline-flex rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-1 text-sm text-violet-100">
                GYMUP オンライン入会処理
              </div>

              <h1 className="text-3xl font-black leading-tight md:text-5xl">
                スマホだけで
                <br />
                入会申請を完了
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                紙の契約書を使わず、店舗でも自宅でもそのまま申請可能。
                <br />
                申込内容はGYMUP側で確認し、会計・顧客管理へつなげられます。
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                  <div className="text-sm font-semibold text-white">完全ペーパーレス</div>
                  <div className="mt-2 text-sm leading-6 text-white/65">
                    紙契約書の記入や保管の手間を削減
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                  <div className="text-sm font-semibold text-white">顧客登録前の仮受付</div>
                  <div className="mt-2 text-sm leading-6 text-white/65">
                    まず申請を受け、管理側で確認してから本登録
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                  <div className="text-sm font-semibold text-white">会計連携の入口</div>
                  <div className="mt-2 text-sm leading-6 text-white/65">
                    申請内容を前受金・顧客管理へつなげやすい設計
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white/85">進行ステップ</div>
                  <div className="text-sm text-violet-200">STEP {step} / 3</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { no: 1, label: "会員情報" },
                    { no: 2, label: "プラン選択" },
                    { no: 3, label: "確認" },
                  ].map((item) => {
                    const active = step >= item.no;
                    return (
                      <div
                        key={item.no}
                        className={`rounded-2xl px-3 py-3 text-center text-sm font-medium transition ${
                          active
                            ? "bg-gradient-to-r from-indigo-400 to-violet-400 text-white shadow-[0_0_20px_rgba(133,102,255,0.35)]"
                            : "border border-white/10 bg-white/5 text-white/45"
                        }`}
                      >
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              {step === 1 && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelStyle}>氏名 *</label>
                    <input
                      className={inputStyle}
                      placeholder="山田 太郎"
                      value={form.full_name}
                      onChange={(e) => updateField("full_name", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelStyle}>氏名（カナ）</label>
                    <input
                      className={inputStyle}
                      placeholder="ヤマダタロウ"
                      value={form.full_name_kana}
                      onChange={(e) => updateField("full_name_kana", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelStyle}>性別</label>
                    <select
                      className={inputStyle}
                      value={form.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                    >
                      <option value="" className="text-black">
                        選択してください
                      </option>
                      <option value="男性" className="text-black">
                        男性
                      </option>
                      <option value="女性" className="text-black">
                        女性
                      </option>
                      <option value="その他" className="text-black">
                        その他
                      </option>
                      <option value="回答しない" className="text-black">
                        回答しない
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelStyle}>生年月日</label>
                    <input
                      type="date"
                      className={inputStyle}
                      value={form.birth_date}
                      onChange={(e) => updateField("birth_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelStyle}>電話番号 *</label>
                    <input
                      className={inputStyle}
                      placeholder="09012345678"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelStyle}>メールアドレス *</label>
                    <input
                      className={inputStyle}
                      type="email"
                      placeholder="example@gmail.com"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelStyle}>郵便番号</label>
                    <input
                      className={inputStyle}
                      placeholder="5300001"
                      value={form.postal_code}
                      onChange={(e) => updateField("postal_code", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelStyle}>利用形態</label>
                    <select
                      className={inputStyle}
                      value={form.visit_style}
                      onChange={(e) => updateField("visit_style", e.target.value)}
                    >
                      <option value="マンツーマン" className="text-black">
                        マンツーマン
                      </option>
                      <option value="ペア" className="text-black">
                        ペア
                      </option>
                      <option value="未定" className="text-black">
                        未定
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelStyle}>希望店舗 *</label>
                    <select
                      className={inputStyle}
                      value={form.store_name}
                      onChange={(e) => updateField("store_name", e.target.value)}
                    >
                      <option value="江戸堀" className="text-black">
                        江戸堀
                      </option>
                      <option value="箕面" className="text-black">
                        箕面
                      </option>
                      <option value="福島" className="text-black">
                        福島
                      </option>
                      <option value="福島P" className="text-black">
                        福島P
                      </option>
                      <option value="天満橋" className="text-black">
                        天満橋
                      </option>
                      <option value="中崎町" className="text-black">
                        中崎町
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelStyle}>体験状況</label>
                    <select
                      className={inputStyle}
                      value={form.trial_status}
                      onChange={(e) => updateField("trial_status", e.target.value)}
                    >
                      <option value="体験済み" className="text-black">
                        体験済み
                      </option>
                      <option value="未体験" className="text-black">
                        未体験
                      </option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelStyle}>住所</label>
                    <input
                      className={inputStyle}
                      placeholder="大阪府〇〇市〇〇..."
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-6">
                  <div className="grid gap-3">
                    {PLANS.map((plan) => {
                      const active = form.plan_id === plan.id;
                      return (
                        <button
                          type="button"
                          key={plan.id}
                          onClick={() => updateField("plan_id", plan.id)}
                          className={`rounded-[24px] border p-4 text-left transition ${
                            active
                              ? "border-violet-300/45 bg-gradient-to-r from-indigo-400/20 to-fuchsia-400/20 shadow-[0_0_24px_rgba(133,102,255,0.22)]"
                              : "border-white/10 bg-white/6 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-lg font-semibold text-white">
                                  {plan.name}
                                </div>
                                {plan.badge ? (
                                  <span className="rounded-full bg-violet-300/20 px-2 py-1 text-xs text-violet-100">
                                    {plan.badge}
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-1 text-sm text-white/60">
                                {plan.description}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-xl font-bold text-violet-100">
                                {formatPrice(plan.price)}
                              </div>
                              <div className="text-xs text-white/50">月額</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelStyle}>支払い方法 *</label>
                      <select
                        className={inputStyle}
                        value={form.payment_method}
                        onChange={(e) => updateField("payment_method", e.target.value)}
                      >
                        <option value="クレジットカード" className="text-black">
                          クレジットカード
                        </option>
                        <option value="口座振替" className="text-black">
                          口座振替
                        </option>
                        <option value="現金" className="text-black">
                          現金
                        </option>
                        <option value="銀行振込" className="text-black">
                          銀行振込
                        </option>
                        <option value="店頭決済" className="text-black">
                          店頭決済
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className={labelStyle}>備考</label>
                      <input
                        className={inputStyle}
                        placeholder="ペア希望 / 既往歴 / 紹介あり など"
                        value={form.memo}
                        onChange={(e) => updateField("memo", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                    <div className="mb-4 text-lg font-semibold text-white">
                      お申込み内容確認
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/50">氏名</div>
                        <div className="mt-1 font-medium text-white">{form.full_name}</div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/50">電話番号</div>
                        <div className="mt-1 font-medium text-white">
                          {normalizePhone(form.phone)}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/50">メールアドレス</div>
                        <div className="mt-1 font-medium text-white">{form.email}</div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/50">希望店舗</div>
                        <div className="mt-1 font-medium text-white">{form.store_name}</div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/50">利用形態</div>
                        <div className="mt-1 font-medium text-white">{form.visit_style}</div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/50">体験状況</div>
                        <div className="mt-1 font-medium text-white">{form.trial_status}</div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/50">申込プラン</div>
                        <div className="mt-1 font-medium text-white">
                          {selectedPlan.name}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/50">月額料金</div>
                        <div className="mt-1 font-medium text-violet-100">
                          {formatPrice(selectedPlan.price)}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3 md:col-span-2">
                        <div className="text-white/50">支払い方法</div>
                        <div className="mt-1 font-medium text-white">
                          {form.payment_method}
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                    <input
                      type="checkbox"
                      checked={form.agree_terms}
                      onChange={(e) => updateField("agree_terms", e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/20"
                    />
                    <span className="text-sm leading-7 text-white/75">
                      <Link href="/terms" className="underline underline-offset-4">
                        利用規約
                      </Link>
                      と
                      <Link
                        href="/privacy"
                        className="ml-1 underline underline-offset-4"
                      >
                        プライバシーポリシー
                      </Link>
                      に同意します。
                      <br />
                      申込内容確認後、店舗からご案内を差し上げます。
                    </span>
                  </label>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-medium text-white transition hover:bg-white/15"
                  >
                    戻る
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-2xl bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 px-5 py-3 font-semibold text-white shadow-[0_0_30px_rgba(176,110,255,0.35)] transition hover:scale-[1.01]"
                  >
                    次へ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="rounded-2xl bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 px-5 py-3 font-semibold text-white shadow-[0_0_30px_rgba(176,110,255,0.35)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "送信中..." : "入会申請を完了する"}
                  </button>
                )}
              </div>
            </div>

            <aside className="rounded-[32px] border border-white/10 bg-white/8 p-5 shadow-[0_0_60px_rgba(116,92,255,0.12)] backdrop-blur-xl md:p-7">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-indigo-400/20 via-violet-400/10 to-pink-400/20 p-5">
                <div className="text-sm font-semibold tracking-[0.2em] text-violet-100/90">
                  FEATURE
                </div>
                <div className="mt-3 text-2xl font-black leading-tight">
                  GYMUPの入会導線を
                  <br />
                  そのままデジタル化
                </div>

                <div className="mt-6 space-y-4 text-sm leading-7 text-white/78">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="font-semibold text-white">紙契約の手間削減</div>
                    <div className="mt-1">
                      入会申請をデジタル化し、記入・転記・保管の負担を軽減。
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="font-semibold text-white">新規受付の見える化</div>
                    <div className="mt-1">
                      pending状態で受け付け、管理側で確認してから顧客化。
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="font-semibold text-white">会計連動しやすい</div>
                    <div className="mt-1">
                      支払い方法・プラン・店舗情報を最初から持てるので会計処理に繋げやすいです。
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-white/80">選択中のプラン</div>
                <div className="mt-3 text-xl font-bold">{selectedPlan.name}</div>
                <div className="mt-1 text-violet-200">
                  {formatPrice(selectedPlan.price)} / 月
                </div>
                <div className="mt-3 text-sm leading-7 text-white/65">
                  {selectedPlan.description}
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-white/80">利用シーン</div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-white/68">
                  <li>・店舗タブレットでの対面入会</li>
                  <li>・自宅からのスマホ入会</li>
                  <li>・体験後の本入会導線</li>
                  <li>・今後の会計/顧客管理連携の入口</li>
                </ul>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}