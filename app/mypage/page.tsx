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
    if (!nextReservation) return "現在、予約は入っていません。";
    return `${formatJapaneseDate(nextReservation.date)} ${nextReservation.startTime}〜 のご予約があります。`;
  }, [nextReservation]);

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2ff 55%, #f8fafc 100%)",
        padding: "20px 14px 48px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <section
          style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: 24,
            padding: 22,
            boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#94a3b8",
              marginBottom: 8,
            }}
          >
            MY PAGE
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.3,
            }}
          >
            {customerName}様のマイページ
          </h1>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              color: "#64748b",
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            サブスク状況、次回予約、おすすめ商品をまとめて確認できます。
          </p>
        </section>

        <section
          style={{
            background: "#111827",
            color: "#fff",
            borderRadius: 22,
            padding: 20,
            boxShadow: "0 16px 36px rgba(15,23,42,0.14)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.58)",
              marginBottom: 10,
            }}
          >
            SUBSCRIPTION
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
              label="残り回数"
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
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <Link
              href="/subscription"
              style={{
                flex: 1,
                minWidth: 180,
                minHeight: 46,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                borderRadius: 14,
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#111827",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              サブスク申込・確認
            </Link>

            <Link
              href="/customer"
              style={{
                flex: 1,
                minWidth: 180,
                minHeight: 46,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              契約内容を見る
            </Link>
          </div>
        </section>

        <section
          style={{
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: 22,
            padding: 20,
            boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#94a3b8",
              marginBottom: 10,
            }}
          >
            NEXT RESERVATION
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.4,
              marginBottom: 8,
            }}
          >
            次回予約・リマインド
          </div>

          <p
            style={{
              margin: 0,
              color: "#475569",
              lineHeight: 1.8,
              fontSize: 15,
            }}
          >
            {reminderText}
          </p>

          {nextReservation ? (
            <div
              style={{
                marginTop: 14,
                background: "#f8fafc",
                borderRadius: 16,
                padding: 14,
                display: "grid",
                gap: 8,
              }}
            >
              <ReserveRow label="日時" value={`${formatJapaneseDate(nextReservation.date)} ${nextReservation.startTime}〜`} />
              <ReserveRow label="店舗" value={nextReservation.storeName} />
              <ReserveRow label="担当" value={nextReservation.staffName} />
              <ReserveRow label="メニュー" value={nextReservation.menu} />
            </div>
          ) : (
            <div
              style={{
                marginTop: 14,
                background: "#f8fafc",
                borderRadius: 16,
                padding: 14,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              予約がまだ入っていません。
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <Link
              href="/reservation"
              style={{
                flex: 1,
                minWidth: 180,
                minHeight: 46,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                borderRadius: 14,
                background: "#111827",
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              予約を確認する
            </Link>

            <Link
              href="/reservation"
              style={{
                flex: 1,
                minWidth: 180,
                minHeight: 46,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                background: "#fff",
                color: "#334155",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              次回予約を入れる
            </Link>
          </div>
        </section>

        <section
          style={{
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: 22,
            padding: 20,
            boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#94a3b8",
              marginBottom: 10,
            }}
          >
            SHOP
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.4,
              marginBottom: 8,
            }}
          >
            おすすめ商品
          </div>

          <p
            style={{
              marginTop: 0,
              color: "#475569",
              lineHeight: 1.8,
              fontSize: 15,
              marginBottom: 16,
            }}
          >
            トレーニングやボディメイクをサポートするおすすめ商品です。
          </p>

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            {recommendedProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
                  border: "1px solid #eef2f7",
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: 170,
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                <div style={{ padding: 14 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    {product.name}
                  </div>

                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: "#111827",
                      marginBottom: 8,
                    }}
                  >
                    {yen(product.price)}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      lineHeight: 1.7,
                      marginBottom: 12,
                    }}
                  >
                    {product.description}
                  </div>

                  <Link
                    href="/shop"
                    style={{
                      width: "100%",
                      minHeight: 42,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      borderRadius: 12,
                      background: "#111827",
                      color: "#fff",
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
              marginTop: 16,
              width: "100%",
              minHeight: 50,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              borderRadius: 14,
              background: "linear-gradient(135deg, #111827, #334155)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
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
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.56)",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: accent || "#fff",
          lineHeight: 1.3,
          wordBreak: "break-word",
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
          color: "#94a3b8",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#0f172a",
          lineHeight: 1.6,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}