"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

const recommendedProducts: ProductInfo[] = [
  {
    id: 1,
    name: "WPCプロテイン ヨーグルト風味",
    price: 2911,
    image: "https://via.placeholder.com/300x180",
    description: "飲みやすく続けやすい人気フレーバー",
  },
  {
    id: 2,
    name: "WPCプロテイン チョコ風味",
    price: 3200,
    image: "https://via.placeholder.com/300x180",
    description: "満足感があり、トレーニング後にもおすすめ",
  },
];

function formatJapaneseDate(dateStr?: string) {
  if (!dateStr) return "未設定";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatPaymentDate(dateStr?: string) {
  if (!dateStr) return "未設定";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function yen(value: number) {
  return `¥${value.toLocaleString()}`;
}

export default function MyPage() {
  const [mounted, setMounted] = useState(false);
  const [customerName, setCustomerName] = useState("お客様");
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    planName: "月4回コース",
    status: "有効",
    remainingCount: 2,
    nextPaymentDate: "",
  });
  const [nextReservation, setNextReservation] = useState<ReservationInfo | null>(null);

  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;

    const storedName =
      localStorage.getItem("gymup_mypage_customer_name") ||
      localStorage.getItem("gymup_current_customer_name") ||
      localStorage.getItem("gymup_current_staff_name");

    if (storedName) {
      setCustomerName(storedName);
    }

    const storedPlan = localStorage.getItem("gymup_mypage_subscription");
    if (storedPlan) {
      try {
        const parsed = JSON.parse(storedPlan);
        setSubscription({
          planName: parsed.planName || "月4回コース",
          status: parsed.status || "有効",
          remainingCount:
            typeof parsed.remainingCount === "number" ? parsed.remainingCount : 2,
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
  }, []);

  const reminderText = useMemo(() => {
    if (!nextReservation) return "現在、予約は入っておりません。";
    return `${formatJapaneseDate(nextReservation.date)} ${nextReservation.startTime}〜 のご予約があります。`;
  }, [nextReservation]);

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "22px 14px 48px",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 28,
            padding: 24,
            boxShadow: "0 10px 26px rgba(15,23,42,0.05)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#9ca3af",
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
              color: "#111827",
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
              color: "#6b7280",
              fontSize: 15,
              lineHeight: 1.9,
            }}
          >
            サブスク状況、次回予約、おすすめ商品をまとめて確認できます。
          </p>
        </section>

        <section
          style={{
            background: "linear-gradient(180deg, #111827 0%, #0f172a 100%)",
            color: "#ffffff",
            borderRadius: 28,
            padding: 22,
            boxShadow: "0 16px 36px rgba(15,23,42,0.14)",
            marginBottom: 16,
            border: "1px solid #1f2937",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.56)",
              marginBottom: 12,
            }}
          >
            SUBSCRIPTION
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.25,
              marginBottom: 14,
              letterSpacing: "-0.03em",
            }}
          >
            サブスクリプション
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            }}
          >
            <StatusCardDark label="現在のプラン" value={subscription.planName} />
            <StatusCardDark label="契約状況" value={subscription.status} />
            <StatusCardDark
              label="残りの回数"
              value={`${subscription.remainingCount}回`}
              accent="#f59e0b"
            />
            <StatusCardDark
              label="次回決済日"
              value={formatPaymentDate(subscription.nextPaymentDate)}
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
            <Link
              href="/subscription"
              style={{
                minHeight: 52,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                borderRadius: 16,
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#111827",
                fontWeight: 900,
                fontSize: 15,
                boxShadow: "0 10px 22px rgba(245,158,11,0.22)",
              }}
            >
              サブスク申込・確認
            </Link>

            <Link
              href="/customer"
              style={{
                minHeight: 52,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                borderRadius: 16,
                background: "#1f2937",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 15,
                border: "1px solid #374151",
              }}
            >
              契約内容を見る
            </Link>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 28,
            padding: 22,
            boxShadow: "0 10px 26px rgba(15,23,42,0.05)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#9ca3af",
              marginBottom: 12,
            }}
          >
            NEXT RESERVATION
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#111827",
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
              color: "#4b5563",
              lineHeight: 1.85,
              fontSize: 16,
            }}
          >
            {reminderText}
          </p>

          {nextReservation ? (
            <div
              style={{
                marginTop: 16,
                background: "#f9fafb",
                borderRadius: 18,
                padding: 16,
                border: "1px solid #eef2f7",
                display: "grid",
                gap: 10,
              }}
            >
              <ReserveRow
                label="日時"
                value={`${formatJapaneseDate(nextReservation.date)} ${nextReservation.startTime}〜`}
              />
              <ReserveRow label="店舗" value={nextReservation.storeName} />
              <ReserveRow label="担当" value={nextReservation.staffName} />
              <ReserveRow label="メニュー" value={nextReservation.menu} />
            </div>
          ) : (
            <div
              style={{
                marginTop: 16,
                background: "#f9fafb",
                borderRadius: 18,
                padding: 16,
                border: "1px solid #eef2f7",
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
            <Link
              href="/reservation"
              style={{
                minHeight: 52,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                borderRadius: 16,
                background: "#111827",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 15,
                boxShadow: "0 10px 22px rgba(15,23,42,0.12)",
              }}
            >
              予約を確認する
            </Link>

            <Link
              href="/reservation"
              style={{
                minHeight: 52,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                borderRadius: 16,
                background: "#ffffff",
                color: "#374151",
                fontWeight: 700,
                fontSize: 15,
                border: "1px solid #d1d5db",
              }}
            >
              次回予約を入れる
            </Link>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 28,
            padding: 22,
            boxShadow: "0 10px 26px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#9ca3af",
              marginBottom: 12,
            }}
          >
            SHOP
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#111827",
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
              color: "#4b5563",
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
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            {recommendedProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 22,
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: 176,
                    objectFit: "cover",
                    display: "block",
                    background: "#f3f4f6",
                  }}
                />

                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: "#111827",
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
                      color: "#111827",
                      marginBottom: 8,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {yen(product.price)}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      lineHeight: 1.75,
                      marginBottom: 14,
                    }}
                  >
                    {product.description}
                  </div>

                  <Link
                    href="/shop"
                    style={{
                      width: "100%",
                      minHeight: 44,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      borderRadius: 14,
                      background: "#111827",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    ショップを見る
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/shop"
            style={{
              marginTop: 18,
              width: "100%",
              minHeight: 54,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              borderRadius: 16,
              background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 15,
              boxShadow: "0 12px 26px rgba(15,23,42,0.12)",
            }}
          >
            物販ページへ進む
          </Link>
        </section>
      </div>
    </main>
  );
}

function StatusCardDark({
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
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: 18,
        padding: 16,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#9ca3af",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
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
          color: "#9ca3af",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1.7,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}