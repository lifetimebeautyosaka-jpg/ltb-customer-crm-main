"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SignupRow = {
  id: number;
  created_at: string | null;
  updated_at: string | null;
  full_name: string | null;
  full_name_kana: string | null;
  gender: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  postal_code: string | null;
  address: string | null;
  store_name: string | null;
  plan_id: string | null;
  plan_name: string | null;
  monthly_price: number | null;
  visit_style: string | null;
  payment_method: string | null;
  trial_status: string | null;
  agree_terms: boolean | null;
  status: string | null;
  is_new_customer: boolean | null;
  memo: string | null;
};

type CustomerInsertPayload = {
  name: string;
  kana?: string | null;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  postal_code?: string | null;
  address?: string | null;
  memo?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ja-JP");
}

function formatPrice(value?: number | null) {
  if (value == null) return "—";
  return `¥${value.toLocaleString("ja-JP")}`;
}

function normalizePhone(value?: string | null) {
  return (value || "").replace(/[^\d]/g, "");
}

function buildCustomerMemo(signup: SignupRow) {
  const lines = [
    "【online_signups から登録】",
    `申請ID: ${signup.id}`,
    `申請日時: ${formatDate(signup.created_at)}`,
    `希望店舗: ${signup.store_name || "—"}`,
    `申込プラン: ${signup.plan_name || "—"}`,
    `月額料金: ${formatPrice(signup.monthly_price)}`,
    `利用形態: ${signup.visit_style || "—"}`,
    `支払方法: ${signup.payment_method || "—"}`,
    `体験状況: ${signup.trial_status || "—"}`,
    `新規フラグ: ${signup.is_new_customer ? "新規" : "—"}`,
    signup.memo ? `申請メモ: ${signup.memo}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

export default function SignupListPage() {
  const [rows, setRows] = useState<SignupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("online_signups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRows((data as SignupRow[]) || []);
    } catch (e: any) {
      setError(e?.message || "入会申請一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const storeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(rows.map((row) => row.store_name).filter(Boolean))
    ) as string[];
    return unique;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchKeyword =
        !keyword ||
        (row.full_name || "").toLowerCase().includes(keyword) ||
        (row.full_name_kana || "").toLowerCase().includes(keyword) ||
        (row.phone || "").toLowerCase().includes(keyword) ||
        (row.email || "").toLowerCase().includes(keyword) ||
        (row.plan_name || "").toLowerCase().includes(keyword) ||
        (row.store_name || "").toLowerCase().includes(keyword);

      const matchStatus =
        statusFilter === "all" ? true : (row.status || "pending") === statusFilter;

      const matchStore =
        storeFilter === "all" ? true : (row.store_name || "") === storeFilter;

      return matchKeyword && matchStatus && matchStore;
    });
  }, [rows, search, statusFilter, storeFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => (r.status || "pending") === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const converted = rows.filter((r) => r.status === "converted").length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    return { total, pending, approved, converted, cancelled };
  }, [rows]);

  const updateStatus = async (id: number, nextStatus: string) => {
    try {
      setProcessingId(id);
      setError("");

      const { error } = await supabase
        .from("online_signups")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await loadRows();
    } catch (e: any) {
      setError(e?.message || "ステータス更新に失敗しました。");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConvertToCustomer = async (signup: SignupRow) => {
    try {
      setProcessingId(signup.id);
      setError("");

      if (!signup.full_name?.trim()) {
        throw new Error("氏名がないため顧客登録できません。");
      }

      const normalizedPhone = normalizePhone(signup.phone);
      const normalizedEmail = (signup.email || "").trim().toLowerCase();

      const duplicateChecks: string[] = [];
      if (normalizedPhone) duplicateChecks.push(`phone.eq.${normalizedPhone}`);
      if (normalizedEmail) duplicateChecks.push(`email.eq.${normalizedEmail}`);

      if (duplicateChecks.length > 0) {
        const { data: duplicateCustomers, error: duplicateError } = await supabase
          .from("customers")
          .select("id,name,phone,email")
          .or(duplicateChecks.join(","))
          .limit(1);

        if (duplicateError) throw duplicateError;

        if (duplicateCustomers && duplicateCustomers.length > 0) {
          throw new Error("同じ電話番号またはメールアドレスの顧客がすでに存在します。");
        }
      }

      const customerPayload: CustomerInsertPayload = {
        name: signup.full_name.trim(),
        kana: signup.full_name_kana?.trim() || null,
        phone: normalizedPhone || null,
        email: normalizedEmail || null,
        gender: signup.gender || null,
        birth_date: signup.birth_date || null,
        postal_code: signup.postal_code || null,
        address: signup.address || null,
        memo: buildCustomerMemo(signup),
      };

      const { error: insertError } = await supabase
        .from("customers")
        .insert(customerPayload);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("online_signups")
        .update({
          status: "converted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", signup.id);

      if (updateError) throw updateError;

      await loadRows();
      window.alert("customers に登録しました。");
    } catch (e: any) {
      setError(e?.message || "顧客登録に失敗しました。");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b12] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm tracking-[0.2em] text-violet-200/90">
                GYMUP CRM
              </div>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                入会申請一覧
              </h1>
              <p className="mt-2 text-sm leading-7 text-white/65">
                online_signups に入ったオンライン入会申請を確認し、
                ステータス変更や customers 登録を行う管理ページです。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
              >
                入会ページへ
              </Link>
              <Link
                href="/"
                className="rounded-2xl bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(176,110,255,0.35)] transition hover:scale-[1.01]"
              >
                TOPへ戻る
              </Link>
            </div>
          </div>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/55">総申請数</div>
            <div className="mt-2 text-3xl font-black">{stats.total}</div>
          </div>

          <div className="rounded-[24px] border border-yellow-300/10 bg-yellow-400/5 p-5">
            <div className="text-sm text-yellow-100/70">未対応</div>
            <div className="mt-2 text-3xl font-black text-yellow-100">
              {stats.pending}
            </div>
          </div>

          <div className="rounded-[24px] border border-sky-300/10 bg-sky-400/5 p-5">
            <div className="text-sm text-sky-100/70">承認</div>
            <div className="mt-2 text-3xl font-black text-sky-100">
              {stats.approved}
            </div>
          </div>

          <div className="rounded-[24px] border border-emerald-300/10 bg-emerald-400/5 p-5">
            <div className="text-sm text-emerald-100/70">顧客登録済</div>
            <div className="mt-2 text-3xl font-black text-emerald-100">
              {stats.converted}
            </div>
          </div>

          <div className="rounded-[24px] border border-rose-300/10 bg-rose-400/5 p-5">
            <div className="text-sm text-rose-100/70">キャンセル</div>
            <div className="mt-2 text-3xl font-black text-rose-100">
              {stats.cancelled}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr_auto]">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                キーワード検索
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="氏名・カナ・電話・メール・プラン・店舗"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-violet-300/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                ステータス
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-violet-300/50"
              >
                <option value="all" className="text-black">
                  すべて
                </option>
                <option value="pending" className="text-black">
                  未対応
                </option>
                <option value="approved" className="text-black">
                  承認
                </option>
                <option value="converted" className="text-black">
                  顧客登録済
                </option>
                <option value="cancelled" className="text-black">
                  キャンセル
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">店舗</label>
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-violet-300/50"
              >
                <option value="all" className="text-black">
                  すべて
                </option>
                {storeOptions.map((store) => (
                  <option key={store} value={store} className="text-black">
                    {store}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadRows}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(176,110,255,0.35)] transition hover:scale-[1.01]"
              >
                再読込
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-white/70">
              読み込み中...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-white/70">
              該当する入会申請がありません。
            </div>
          ) : (
            filteredRows.map((row) => {
              const currentStatus = row.status || "pending";
              const isBusy = processingId === row.id;

              return (
                <div
                  key={row.id}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-2xl font-black">
                          {row.full_name || "氏名未設定"}
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            currentStatus === "pending"
                              ? "border border-yellow-300/20 bg-yellow-400/10 text-yellow-100"
                              : currentStatus === "approved"
                              ? "border border-sky-300/20 bg-sky-400/10 text-sky-100"
                              : currentStatus === "converted"
                              ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                              : "border border-rose-300/20 bg-rose-400/10 text-rose-100"
                          }`}
                        >
                          {currentStatus === "pending"
                            ? "未対応"
                            : currentStatus === "approved"
                            ? "承認"
                            : currentStatus === "converted"
                            ? "顧客登録済"
                            : "キャンセル"}
                        </span>

                        {row.is_new_customer ? (
                          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">
                            新規
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-sm text-white/50">
                        申請日時：{formatDate(row.created_at)}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoCard label="カナ" value={row.full_name_kana || "—"} />
                        <InfoCard label="電話番号" value={row.phone || "—"} />
                        <InfoCard label="メール" value={row.email || "—"} />
                        <InfoCard label="生年月日" value={formatDateOnly(row.birth_date)} />
                        <InfoCard label="希望店舗" value={row.store_name || "—"} />
                        <InfoCard label="利用形態" value={row.visit_style || "—"} />
                        <InfoCard label="体験状況" value={row.trial_status || "—"} />
                        <InfoCard label="支払方法" value={row.payment_method || "—"} />
                        <InfoCard label="プラン" value={row.plan_name || "—"} />
                        <InfoCard label="月額料金" value={formatPrice(row.monthly_price)} />
                        <InfoCard label="郵便番号" value={row.postal_code || "—"} />
                        <InfoCard label="規約同意" value={row.agree_terms ? "同意済" : "未同意"} />
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs text-white/50">住所</div>
                          <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-white/85">
                            {row.address || "—"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs text-white/50">備考</div>
                          <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-white/85">
                            {row.memo || "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full xl:w-[320px]">
                      <div className="rounded-[24px] border border-white/10 bg-black/15 p-4">
                        <div className="mb-3 text-sm font-semibold text-white/80">
                          操作
                        </div>

                        <div className="grid gap-3">
                          <button
                            disabled={isBusy}
                            onClick={() => updateStatus(row.id, "approved")}
                            className="rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "処理中..." : "承認にする"}
                          </button>

                          <button
                            disabled={isBusy}
                            onClick={() => handleConvertToCustomer(row)}
                            className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "処理中..." : "customers に登録"}
                          </button>

                          <button
                            disabled={isBusy}
                            onClick={() => updateStatus(row.id, "pending")}
                            className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-4 py-3 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "処理中..." : "未対応に戻す"}
                          </button>

                          <button
                            disabled={isBusy}
                            onClick={() => updateStatus(row.id, "cancelled")}
                            className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "処理中..." : "キャンセルにする"}
                          </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-6 text-white/55">
                          「customers に登録」を押すと、
                          online_signups の内容を customers に追加し、
                          この申請の status を converted に更新します。
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-2 break-words text-sm font-medium text-white">
        {value}
      </div>
    </div>
  );
}