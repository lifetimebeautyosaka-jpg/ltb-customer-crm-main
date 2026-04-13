"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: number;
  name: string;
  kana: string | null;
  phone: string | null;
};

type ReservationHistoryRow = {
  customer_id?: number | null;
  customer_name?: string | null;
  staff_name?: string | null;
  date?: string | null;
  created_at?: string | null;
};

type CustomerSubscriptionRow = {
  id?: string;
  customer_id?: string | number | null;
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
  memo?: string | null;
  updated_at?: string | null;
};

type SearchableCustomer = Customer & {
  assignedStaff?: string;
  subscription?: CustomerSubscriptionRow | null;
};

const STORES = ["江戸堀", "箕面", "福島", "福島P", "天満橋", "中崎町"];
const STAFFS = ["山口", "中西", "池田", "石川", "羽田", "菱谷", "井上", "林", "その他"];
const MENUS = ["ストレッチ", "トレーニング", "ペアトレ", "ヘッドスパ", "アロマ", "その他"];
const PAYMENT_METHODS = ["現金", "カード", "銀行振込", "その他", "サブスク", "回数券"];
const VISIT_TYPES = ["新規", "再来"];

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ja-JP");
}

function calcRemaining(subscription?: CustomerSubscriptionRow | null) {
  if (!subscription) return null;
  if (
    subscription.remaining_count !== null &&
    subscription.remaining_count !== undefined
  ) {
    return Number(subscription.remaining_count);
  }
  const monthly = Number(subscription.monthly_count || 0);
  const used = Number(subscription.used_count || 0);
  const carry = Number(subscription.carry_over || 0);
  return Math.max(monthly + carry - used, 0);
}

export default function ReservationNewPage() {
  return (
    <Suspense fallback={<ReservationNewPageFallback />}>
      <ReservationNewPageInner />
    </Suspense>
  );
}

function ReservationNewPageFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8f8f8 0%, #efefef 45%, #f9f9f9 100%)",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>読み込み中...</div>
        </div>
      </div>
    </div>
  );
}

function ReservationNewPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const customerIdFromQuery = searchParams.get("customerId");
  const dateFromQuery = searchParams.get("date");

  const [customers, setCustomers] = useState<SearchableCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customerIdFromQuery ?? ""
  );
  const [customerName, setCustomerName] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [date, setDate] = useState(dateFromQuery || todayStr());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [storeName, setStoreName] = useState("江戸堀");
  const [staffName, setStaffName] = useState("山口");
  const [menu, setMenu] = useState("ストレッチ");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [memo, setMemo] = useState("");
  const [visitType, setVisitType] = useState("再来");

  const selectedCustomer = useMemo(() => {
    const id = Number(selectedCustomerId);
    if (!id) return null;
    return customers.find((c) => c.id === id) ?? null;
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) {
      return customers.slice(0, 20);
    }

    return customers
      .filter((customer) => {
        const fields = [
          customer.name || "",
          customer.kana || "",
          customer.phone || "",
          customer.assignedStaff || "",
        ]
          .join(" ")
          .toLowerCase();

        return fields.includes(q);
      })
      .slice(0, 30);
  }, [customers, customerSearch]);

  const selectedSubscription = selectedCustomer?.subscription || null;
  const remainingCount = calcRemaining(selectedSubscription);

  useEffect(() => {
    void fetchCustomersAndRelated();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.name || "");
      setCustomerSearch(
        `${selectedCustomer.name}${selectedCustomer.phone ? ` / ${selectedCustomer.phone}` : ""}`
      );
      setVisitType("再来");
    }
  }, [selectedCustomer]);

  async function fetchCustomersAndRelated() {
    setLoadingCustomers(true);

    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("id, name, kana, phone")
      .order("id", { ascending: false });

    if (customerError) {
      alert(`顧客取得エラー: ${customerError.message}`);
      setLoadingCustomers(false);
      return;
    }

    const baseCustomers = ((customerData ?? []) as Customer[]).map((c) => ({
      ...c,
      assignedStaff: "",
      subscription: null,
    }));

    const staffMapByCustomerId = new Map<number, string>();
    const staffMapByCustomerName = new Map<string, string>();

    const { data: reservationHistoryData } = await supabase
      .from("reservations")
      .select("customer_id, customer_name, staff_name, date, created_at")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1000);

    ((reservationHistoryData ?? []) as ReservationHistoryRow[]).forEach((row) => {
      const staff = row.staff_name || "";
      if (!staff) return;

      if (
        row.customer_id !== null &&
        row.customer_id !== undefined &&
        !staffMapByCustomerId.has(Number(row.customer_id))
      ) {
        staffMapByCustomerId.set(Number(row.customer_id), staff);
      }

      if (row.customer_name && !staffMapByCustomerName.has(row.customer_name)) {
        staffMapByCustomerName.set(row.customer_name, staff);
      }
    });

    const subscriptionMap = new Map<string, CustomerSubscriptionRow>();

    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("customer_subscriptions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (!subscriptionError) {
      ((subscriptionData ?? []) as CustomerSubscriptionRow[]).forEach((row) => {
        const key = String(row.customer_id ?? "");
        if (key && !subscriptionMap.has(key)) {
          subscriptionMap.set(key, row);
        }
      });
    }

    const merged = baseCustomers.map((customer) => {
      const assignedStaff =
        staffMapByCustomerId.get(customer.id) ||
        staffMapByCustomerName.get(customer.name) ||
        "";

      const subscription =
        subscriptionMap.get(String(customer.id)) || null;

      return {
        ...customer,
        assignedStaff,
        subscription,
      };
    });

    setCustomers(merged);
    setLoadingCustomers(false);
  }

  function handleSelectCustomer(customer: SearchableCustomer) {
    setSelectedCustomerId(String(customer.id));
    setCustomerName(customer.name || "");
    setCustomerSearch(
      `${customer.name}${customer.phone ? ` / ${customer.phone}` : ""}`
    );
    setShowSearchResults(false);

    if (customer.assignedStaff && STAFFS.includes(customer.assignedStaff)) {
      setStaffName(customer.assignedStaff);
    }

    setVisitType("再来");
  }

  async function handleSave() {
    if (!customerName.trim()) {
      alert("顧客を選択してください");
      return;
    }
    if (!date) {
      alert("日付を入力してください");
      return;
    }
    if (!startTime) {
      alert("開始時間を入力してください");
      return;
    }
    if (!endTime) {
      alert("終了時間を入力してください");
      return;
    }
    if (!storeName) {
      alert("店舗を選択してください");
      return;
    }
    if (!staffName) {
      alert("担当スタッフを選択してください");
      return;
    }
    if (!visitType) {
      alert("来店区分を選択してください");
      return;
    }

    setSaving(true);

    const payload = {
      customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
      customer_name: customerName,
      date,
      start_time: startTime,
      end_time: endTime,
      store_name: storeName,
      staff_name: staffName,
      menu,
      payment_method: paymentMethod,
      memo,
      visit_type: visitType,
      reservation_status: "予約済",
      is_first_visit: visitType === "新規",
    };

    const { error } = await supabase.from("reservations").insert([payload]);

    setSaving(false);

    if (error) {
      alert(`予約保存エラー: ${error.message}`);
      return;
    }

    alert("予約を保存しました");
    router.push("/reservation");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8f8f8 0%, #efefef 45%, #f9f9f9 100%)",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>予約作成</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/reservation" style={topBtnStyle}>
              予約一覧へ
            </Link>
            <Link href="/" style={topBtnStyle}>
              TOPへ
            </Link>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>基本情報</div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>顧客検索</label>
            <input
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="顧客名・かな・電話番号・担当者で検索"
              style={inputStyle}
              disabled={loadingCustomers}
            />

            {showSearchResults ? (
              <div style={searchResultWrapStyle}>
                {loadingCustomers ? (
                  <div style={searchEmptyStyle}>顧客を読み込み中...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div style={searchEmptyStyle}>該当する顧客がいません。</div>
                ) : (
                  filteredCustomers.map((customer) => {
                    const remaining = calcRemaining(customer.subscription);

                    return (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        style={searchItemButtonStyle}
                      >
                        <div style={{ display: "grid", gap: 4, textAlign: "left" }}>
                          <div style={searchNameStyle}>
                            {customer.name}
                            {customer.kana ? `（${customer.kana}）` : ""}
                          </div>
                          <div style={searchSubStyle}>
                            {customer.phone || "電話番号なし"}
                          </div>
                          <div style={searchSubStyle}>
                            担当：{customer.assignedStaff || "未設定"}
                          </div>
                          <div style={searchSubStyle}>
                            サブスク：
                            {customer.subscription
                              ? `${customer.subscription.status || "有効"} / 残${remaining ?? 0}回`
                              : "未登録"}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>顧客選択</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={inputStyle}
                disabled={loadingCustomers}
              >
                <option value="">顧客を選択してください</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.phone ? ` / ${customer.phone}` : ""}
                    {customer.assignedStaff ? ` / 担当:${customer.assignedStaff}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>顧客名</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={inputStyle}
                placeholder="顧客名"
              />
            </div>

            <div>
              <label style={labelStyle}>担当者（顧客の既存担当）</label>
              <div style={readonlyBoxStyle}>
                {selectedCustomer?.assignedStaff || "未設定"}
              </div>
            </div>

            <div>
              <label style={labelStyle}>来店区分</label>
              <div style={{ display: "flex", gap: 10 }}>
                {VISIT_TYPES.map((type) => {
                  const active = visitType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVisitType(type)}
                      style={{
                        ...toggleBtnStyle,
                        background:
                          active ? (type === "新規" ? "#2563eb" : "#4b5563") : "#fff",
                        color: active ? "#fff" : "#111",
                        border: active
                          ? "1px solid transparent"
                          : "1px solid #d1d5db",
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>開始時間</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>終了時間</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>店舗</label>
              <select
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                style={inputStyle}
              >
                {STORES.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>担当スタッフ</label>
              <select
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                style={inputStyle}
              >
                {STAFFS.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>メニュー</label>
              <select
                value={menu}
                onChange={(e) => setMenu(e.target.value)}
                style={inputStyle}
              >
                {MENUS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>支払方法</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={inputStyle}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={subscriptionCardStyle}>
              <div style={sectionMiniTitleStyle}>サブスク情報</div>

              {!selectedCustomer ? (
                <div style={subscriptionEmptyStyle}>
                  顧客を選択するとサブスク情報を表示します。
                </div>
              ) : !selectedSubscription ? (
                <div style={subscriptionEmptyStyle}>
                  この顧客のサブスク契約は未登録です。
                </div>
              ) : (
                <div style={subscriptionGridStyle}>
                  <InfoBox
                    label="状態"
                    value={selectedSubscription.status || "未設定"}
                  />
                  <InfoBox
                    label="プラン"
                    value={selectedSubscription.plan_name || "未設定"}
                  />
                  <InfoBox
                    label="種別"
                    value={selectedSubscription.plan_type || "未設定"}
                  />
                  <InfoBox
                    label="契約形態"
                    value={selectedSubscription.plan_style || "未設定"}
                  />
                  <InfoBox
                    label="サービス"
                    value={selectedSubscription.service_type || "未設定"}
                  />
                  <InfoBox
                    label="残回数"
                    value={
                      remainingCount !== null && remainingCount !== undefined
                        ? `${remainingCount}回`
                        : "未設定"
                    }
                  />
                  <InfoBox
                    label="次回決済日"
                    value={formatDate(selectedSubscription.next_payment_date)}
                  />
                  <InfoBox
                    label="料金"
                    value={
                      selectedSubscription.price
                        ? `¥${Number(selectedSubscription.price).toLocaleString()}`
                        : "未設定"
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
              placeholder="メモ"
            />
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link href="/reservation" style={cancelBtnStyle}>
              キャンセル
            </Link>
            <button
              type="button"
              onClick={handleSave}
              style={saveBtnStyle}
              disabled={saving}
            >
              {saving ? "保存中..." : "予約を保存する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={infoBoxStyle}>
      <div style={infoBoxLabelStyle}>{label}</div>
      <div style={infoBoxValueStyle}>{value}</div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: 24,
  padding: 22,
  boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
  backdropFilter: "blur(10px)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 16,
};

const sectionMiniTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  marginBottom: 12,
  color: "#111827",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 8,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const readonlyBoxStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  background: "#f9fafb",
  fontSize: 14,
  color: "#111827",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
};

const toggleBtnStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 14,
  fontWeight: 700,
  cursor: "pointer",
  minWidth: 100,
};

const topBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 14,
  background: "#111827",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
};

const cancelBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 18px",
  borderRadius: 14,
  background: "#e5e7eb",
  color: "#111827",
  textDecoration: "none",
  fontWeight: 700,
};

const saveBtnStyle: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: 14,
  background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
  color: "#fff",
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
};

const searchResultWrapStyle: React.CSSProperties = {
  marginTop: 10,
  borderRadius: 18,
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#fff",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  maxHeight: 360,
  overflowY: "auto",
};

const searchItemButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "#fff",
  padding: "14px 16px",
  cursor: "pointer",
  borderBottom: "1px solid #f1f5f9",
};

const searchNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const searchSubStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#475569",
  lineHeight: 1.5,
};

const searchEmptyStyle: React.CSSProperties = {
  padding: "16px",
  fontSize: 14,
  color: "#64748b",
};

const subscriptionCardStyle: React.CSSProperties = {
  borderRadius: 18,
  background: "rgba(248,250,252,0.95)",
  border: "1px solid #e2e8f0",
  padding: 16,
};

const subscriptionEmptyStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#64748b",
  lineHeight: 1.7,
};

const subscriptionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const infoBoxStyle: React.CSSProperties = {
  borderRadius: 14,
  background: "#fff",
  border: "1px solid #e5e7eb",
  padding: "12px 14px",
};

const infoBoxLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
  marginBottom: 6,
};

const infoBoxValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  lineHeight: 1.5,
};