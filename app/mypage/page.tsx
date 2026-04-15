"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type CustomerRow = {
  id: string | number;
  name?: string | null;
  plan_type?: string | null;
  status?: string | null;
  remaining_count?: number | null;
  remaining?: number | null;
  next_payment_date?: string | null;
};

type ReservationRow = {
  id: string | number;
  customer_id?: string | number | null;
  customer_name?: string | null;
  date?: string | null;
  start_time?: string | null;
  store_name?: string | null;
  staff_name?: string | null;
  menu?: string | null;
};

type SubscriptionInfo = {
  planName: string;
  status: string;
  remainingCount: number;
  nextPaymentDate: string;
};

type ReservationInfo = {
  date: string;
  startTime: string;
  storeName: string;
  staffName: string;
  menu: string;
};

type ProductInfo = {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
};

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

// shopページの雰囲気に合わせた商品カード
const recommendedProducts: ProductInfo[] = [
  {
    id: 1,
    name: "WPCプロテイン ヨーグルト風味",
    price: 2911,
    image: "https://via.placeholder.com/600x360?text=Yogurt+Protein",
    description: "飲みやすく続けやすい人気フレーバー。",
  },
  {
    id: 2,
    name: "WPCプロテイン チョコ風味",
    price: 3200,
    image: "https://via.placeholder.com/600x360?text=Choco+Protein",
    description: "トレーニング後にも満足感のある定番フレーバー。",
  },
];

function formatJapaneseDate(dateStr?: string | null) {
  if (!dateStr) return "未設定";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatPaymentDate(dateStr?: string | null) {
  if (!dateStr) return "未設定";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(dateStr?: string | null, timeStr?: string | null) {
  if (!dateStr) return "未設定";
  return `${formatJapaneseDate(dateStr)} ${timeStr || ""}`.trim();
}

function yen(value: number) {
  return `¥${value.toLocaleString()}`;
}

function getTodayYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeCustomerName(raw: unknown) {
  if (!raw) return "お客様";
  return String(raw).trim();
}

export default function MyPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("お客様");

  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    planName: "月4回コース",
    status: "有効",
    remainingCount: 0,
    nextPaymentDate: "",
  });

  const [nextReservation, setNextReservation] = useState<ReservationInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const localCustomerId =
      localStorage.getItem("gymup_mypage_customer_id") ||
      localStorage.getItem("gymup_current_customer_id") ||
      localStorage.getItem("gymup_customer_id") ||
      "";

    const localCustomerName =
      localStorage.getItem("gymup_mypage_customer_name") ||
      localStorage.getItem("gymup_current_customer_name") ||
      localStorage.getItem("gymup_customer_name") ||
      "";

    setCustomerId(localCustomerId);
    setCustomerName(normalizeCustomerName(localCustomerName));

    void loadMyPageData(localCustomerId, localCustomerName);
  }, [mounted]);

  async function loadMyPageData(localCustomerId: string, localCustomerName: string) {
    try {
      setLoading(true);
      setErrorMessage("");

      // まずlocalStorageフォールバック
      const storedPlan = localStorage.getItem("gymup_mypage_subscription");
      if (storedPlan) {
        try {
          const parsed = JSON.parse(storedPlan);
          setSubscription({
            planName: parsed.planName || "月4回コース",
            status: parsed.status || "有効",
            remainingCount:
              typeof parsed.remainingCount === "number" ? parsed.remainingCount : 0,
            nextPaymentDate: parsed.nextPaymentDate || "",
          });
        } catch (error) {
          console.error(error);
        }
      }

      const storedReservation = localStorage.getItem("gymup_mypage_next_reservation");
      if (storedReservation) {
        try {
          const parsed = JSON.parse(storedReservation);
          if (parsed?.date && parsed?.startTime) {
            setNextReservation({
              date: parsed.date,
              startTime: parsed.startTime,
              storeName: parsed.storeName || "店舗未設定",
              staffName: parsed.staffName || "担当未設定",
              menu: parsed.menu || "メニュー未設定",
            });
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (!supabase) {
        setLoading(false);
        return;
      }

      let resolvedCustomerId = localCustomerId;
      let resolvedCustomerName = localCustomerName;

      // customer_id があれば優先して顧客取得
      if (resolvedCustomerId) {
        const { data: customerById, error: customerError } = await supabase
          .from("customers")
          .select("id, name, plan_type, status, remaining_count, next_payment_date")
          .eq("id", Number(resolvedCustomerId))
          .maybeSingle();

        if (!customerError && customerById) {
          const row = customerById as CustomerRow;

          setCustomerName(normalizeCustomerName(row.name || resolvedCustomerName || "お客様"));
          setSubscription({
            planName: row.plan_type || "未設定",
            status: row.status || "有効",
            remainingCount:
              Number(
                row.remaining_count ??
                  row.remaining ??
                  0
              ) || 0,
            nextPaymentDate: row.next_payment_date || "",
          });

          resolvedCustomerName = String(row.name || resolvedCustomerName || "");
        }
      }

      // customer_idが無い場合は名前で探す
      if (!resolvedCustomerId && resolvedCustomerName) {
        const { data: customerByName, error: customerNameError } = await supabase
          .from("customers")
          .select("id, name, plan_type, status, remaining_count, next_payment_date")
          .eq("name", resolvedCustomerName)
          .maybeSingle();

        if (!customerNameError && customerByName) {
          const row = customerByName as CustomerRow;
          resolvedCustomerId = String(row.id);

          setCustomerId(String(row.id));
          setCustomerName(normalizeCustomerName(row.name || resolvedCustomerName || "お客様"));
          setSubscription({
            planName: row.plan_type || "未設定",
            status: row.status || "有効",
            remainingCount:
              Number(
                row.remaining_count ??
                  row.remaining ??
                  0
              ) || 0,
            nextPaymentDate: row.next_payment_date || "",
          });
        }
      }

      // 次回予約取得
      const today = getTodayYmd();

      if (resolvedCustomerId) {
        const { data: reservationData } = await supabase
          .from("reservations")
          .select("id, customer_id, customer_name, date, start_time, store_name, staff_name, menu")
          .eq("customer_id", Number(resolvedCustomerId))
          .gte("date", today)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(1);

        const first = (reservationData as ReservationRow[] | null)?.[0];

        if (first?.date) {
          setNextReservation({
            date: first.date || "",
            startTime: first.start_time || "",
            storeName: first.store_name || "店舗未設定",
            staffName: first.staff_name || "担当未設定",
            menu: first.menu || "メニュー未設定",
          });
        }
      } else if (resolvedCustomerName) {
        const { data: reservationData } = await supabase
          .from("reservations")
          .select("id, customer_id, customer_name, date, start_time, store_name, staff_name, menu")
          .eq("customer_name", resolvedCustomerName)
          .gte("date", today)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(1);

        const first = (reservationData as ReservationRow[] | null)?.[0];

        if (first?.date) {
          setNextReservation({
            date: first.date || "",
            startTime: first.start_time || "",
            storeName: first.store_name || "店舗未設定",
            staffName: first.staff_name || "担当未設定",
            menu: first.menu || "メニュー未設定",
          });
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "マイページ情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const reminderText = useMemo(() => {
    if (!nextReservation) return "現在、予約は入っておりません。";
    return `${formatDateTime(nextReservation.date, nextReservation.startTime)} のご予約があります。`;
  }, [nextReservation]);

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0f14",
        padding: "22px 14px 46px",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <section
          style={{
            background: "#11161f",
            border: "1px solid #1f2937",
            borderRadius: 28,
            padding: 26,
            boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#6b7280",
              marginBottom: 10,
            }}
          >
            MY PAGE
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.25,
              letterSpacing: "-0.03em",
            }}
          >
            {customerName}様のマイページ
          </h1>

          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              color: "#9ca3af",
              fontSize: 15,
              lineHeight: 1.9,
            }}
          >
            サブスク状況、次回予約、物販をまとめて確認できます。
          </p>
        </section>

        {errorMessage ? (
          <div
            style={{
              background: "#2a1114",
              border: "1px solid #7f1d1d",
              color: "#fca5a5",
              borderRadius: 18,
              padding: "14px 16px",
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <section
          style={{
            background: "linear-gradient(180deg, #111827 0%, #0f172a 100%)",
            border: "1px solid #1f2937",
            borderRadius: 28,
            padding: 22,
            boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#6b7280",
              marginBottom: 12,
            }}
          >
            SUBSCRIPTION
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              lineHeight: 1.25,
              marginBottom: 16,
              color: "#ffffff",
              letterSpacing: "-0.03em",
            }}
          >
            サブスクリプション
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            }}
          >
            <DarkInfoCard label="現在のプラン" value={loading ? "読込中..." : subscription.planName || "未設定"} />
            <DarkInfoCard label="契約状況" value={loading ? "読込中..." : subscription.status || "未設定"} />
            <DarkInfoCard
              label="残りの回数"
              value={loading ? "読込中..." : `${subscription.remainingCount}回`}
              accent="#f59e0b"
            />
            <DarkInfoCard
              label="次回決済日"
              value={loading ? "読込中..." : formatPaymentDate(subscription.nextPaymentDate)}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              marginTop: 16,
            }}
          >
            <Link href="/subscription" style={primaryButtonStyle}>
              サブスク申込・確認
            </Link>

            <Link href="/customer" style={secondaryDarkButtonStyle}>
              契約内容を見る
            </Link>
          </div>
        </section>

        <section
          style={{
            background: "#11161f",
            border: "1px solid #1f2937",
            borderRadius: 28,
            padding: 22,
            boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#6b7280",
              marginBottom: 12,
            }}
          >
            NEXT RESERVATION
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.25,
              marginBottom: 10,
              letterSpacing: "-0.03em",
            }}
          >
            次回予約・リマインド
          </div>

          <p
            style={{
              marginTop: 0,
              marginBottom: 0,
              color: "#9ca3af",
              lineHeight: 1.85,
              fontSize: 16,
            }}
          >
            {loading ? "予約情報を読み込み中です..." : reminderText}
          </p>

          {nextReservation ? (
            <div
              style={{
                marginTop: 16,
                background: "#0f141c",
                borderRadius: 20,
                padding: 16,
                border: "1px solid #1f2937",
                display: "grid",
                gap: 10,
              }}
            >
              <ReserveRow
                label="日時"
                value={formatDateTime(nextReservation.date, nextReservation.startTime)}
              />
              <ReserveRow label="店舗" value={nextReservation.storeName} />
              <ReserveRow label="担当" value={nextReservation.staffName} />
              <ReserveRow label="メニュー" value={nextReservation.menu} />
            </div>
          ) : (
            <div
              style={{
                marginTop: 16,
                background: "#0f141c",
                borderRadius: 20,
                padding: 16,
                border: "1px solid #1f2937",
                color: "#6b7280",
                fontSize: 15,
              }}
            >
              予約がまだ入っていません。
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              marginTop: 16,
            }}
          >
            <Link href="/reservation" style={primaryDarkButtonStyle}>
              予約を確認する
            </Link>

            <Link href="/reservation" style={secondaryDarkButtonStyle}>
              次回予約を入れる
            </Link>
          </div>
        </section>

        <section
          style={{
            background: "#11161f",
            border: "1px solid #1f2937",
            borderRadius: 28,
            padding: 22,
            boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#6b7280",
              marginBottom: 12,
            }}
          >
            SHOP
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.25,
              marginBottom: 10,
              letterSpacing: "-0.03em",
            }}
          >
            おすすめ商品
          </div>

          <p
            style={{
              marginTop: 0,
              color: "#9ca3af",
              lineHeight: 1.85,
              fontSize: 16,
              marginBottom: 18,
            }}
          >
            トレーニングやボディメイクをサポートするおすすめ商品です。
          </p>

          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            }}
          >
            {recommendedProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#0f141c",
                  borderRadius: 24,
                  overflow: "hidden",
                  border: "1px solid #1f2937",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.24)",
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    display: "block",
                    background: "#0b0f14",
                  }}
                />

                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: "#ffffff",
                      lineHeight: 1.55,
                      marginBottom: 8,
                    }}
                  >
                    {product.name}
                  </div>

                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#f59e0b",
                      marginBottom: 8,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {yen(product.price)}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#9ca3af",
                      lineHeight: 1.75,
                      marginBottom: 14,
                    }}
                  >
                    {product.description}
                  </div>

                  <Link href="/shop" style={primaryDarkButtonStyle}>
                    ショップを見る
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/shop"
            style={{
              ...primaryButtonStyle,
              marginTop: 18,
            }}
          >
            物販ページへ進む
          </Link>
        </section>
      </div>
    </main>
  );
}

function DarkInfoCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#0f141c",
        border: "1px solid #1f2937",
        borderRadius: 20,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: accent || "#ffffff",
          lineHeight: 1.35,
          wordBreak: "break-word",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ReserveRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "72px 1fr",
        gap: 10,
        alignItems: "start",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#6b7280",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.7,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 54,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  borderRadius: 16,
  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  color: "#111827",
  fontWeight: 900,
  fontSize: 15,
  boxShadow: "0 12px 26px rgba(245,158,11,0.18)",
};

const primaryDarkButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  borderRadius: 14,
  background: "#f59e0b",
  color: "#111827",
  fontWeight: 800,
  fontSize: 14,
};

const secondaryDarkButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  borderRadius: 14,
  background: "#1f2937",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 14,
  border: "1px solid #374151",
};