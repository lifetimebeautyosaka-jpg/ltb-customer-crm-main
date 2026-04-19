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
            remainingCount: Number(row.remaining_count ?? row.remaining ?? 0) || 0,
            nextPaymentDate: row.next_payment_date || "",
          });

          resolvedCustomerName = String(row.name || resolvedCustomerName || "");
        }
      }

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
            remainingCount: Number(row.remaining_count ?? row.remaining ?? 0) || 0,
            nextPaymentDate: row.next_payment_date || "",
          });
        }
      }

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
    <>
      <style>{`
        .mypage-shell {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 14% 18%, rgba(255,255,255,0.05) 0%, transparent 24%),
            radial-gradient(circle at 82% 16%, rgba(117,146,255,0.14) 0%, transparent 22%),
            radial-gradient(circle at 78% 72%, rgba(255,255,255,0.03) 0%, transparent 20%),
            linear-gradient(180deg, #0f1012 0%, #16181b 48%, #111214 100%);
          color: #f5f7fa;
          padding: 24px 14px 52px;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .mypage-shell::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(120deg, rgba(240,138,39,0.06), transparent 34%),
            linear-gradient(300deg, rgba(240,138,39,0.04), transparent 28%);
        }

        .mypage-container {
          position: relative;
          z-index: 1;
          max-width: 960px;
          margin: 0 auto;
        }

        .mypage-card {
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 18px 48px rgba(0,0,0,0.24);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .mypage-card + .mypage-card {
          margin-top: 16px;
        }

        .mypage-hero {
          background:
            radial-gradient(circle at top right, rgba(240,138,39,0.12) 0%, transparent 30%),
            rgba(255,255,255,0.045);
        }

        .mypage-label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.42);
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .mypage-title {
          margin: 0;
          font-size: clamp(30px, 5vw, 42px);
          font-weight: 900;
          color: #ffffff;
          line-height: 1.2;
          letter-spacing: -0.04em;
        }

        .mypage-sub {
          margin-top: 12px;
          margin-bottom: 0;
          color: rgba(255,255,255,0.68);
          font-size: 15px;
          line-height: 1.9;
          max-width: 660px;
        }

        .mypage-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .mypage-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.84);
          font-size: 12px;
          font-weight: 700;
        }

        .mypage-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          margin-top: 18px;
        }

        .mypage-info-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          padding: 16px;
        }

        .mypage-info-label {
          font-size: 12px;
          color: rgba(255,255,255,0.42);
          font-weight: 700;
          margin-bottom: 8px;
        }

        .mypage-info-value {
          font-size: 24px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.35;
          letter-spacing: -0.02em;
          word-break: break-word;
        }

        .mypage-section-title {
          margin: 0 0 10px;
          font-size: clamp(26px, 4vw, 34px);
          font-weight: 900;
          color: #ffffff;
          line-height: 1.2;
          letter-spacing: -0.03em;
        }

        .mypage-section-desc {
          margin: 0;
          color: rgba(255,255,255,0.66);
          line-height: 1.85;
          font-size: 15px;
        }

        .mypage-actions {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          margin-top: 18px;
        }

        .mypage-primary-btn,
        .mypage-secondary-btn,
        .mypage-shop-btn {
          text-decoration: none;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .mypage-primary-btn {
          width: 100%;
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: linear-gradient(135deg, #f08a27 0%, #ff6a00 100%);
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          border: 1px solid rgba(240,138,39,0.4);
          box-shadow:
            0 12px 28px rgba(240,138,39,0.35),
            inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .mypage-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow:
            0 16px 36px rgba(240,138,39,0.5),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .mypage-secondary-btn {
          width: 100%;
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid rgba(240,138,39,0.3);
        }

        .mypage-secondary-btn:hover,
        .mypage-shop-btn:hover {
          transform: translateY(-1px);
        }

        .mypage-reserve-box {
          margin-top: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 22px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.07);
          display: grid;
          gap: 10px;
        }

        .mypage-reserve-row {
          display: grid;
          grid-template-columns: 76px 1fr;
          gap: 10px;
          align-items: start;
        }

        .mypage-reserve-label {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.42);
        }

        .mypage-reserve-value {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.7;
          word-break: break-word;
        }

        .mypage-empty {
          margin-top: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 22px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.42);
          font-size: 15px;
        }

        .mypage-products {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          margin-top: 18px;
        }

        .mypage-product-card {
          background: rgba(255,255,255,0.03);
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 12px 28px rgba(0,0,0,0.22);
        }

        .mypage-product-image {
          width: 100%;
          height: 190px;
          object-fit: cover;
          display: block;
          background: #0f1012;
        }

        .mypage-product-body {
          padding: 16px;
        }

        .mypage-product-name {
          font-size: 17px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.55;
          margin-bottom: 8px;
        }

        .mypage-product-price {
          font-size: 24px;
          font-weight: 900;
          color: #f08a27;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .mypage-product-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.62);
          line-height: 1.8;
          margin-bottom: 14px;
        }

        .mypage-shop-btn {
          width: 100%;
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: linear-gradient(135deg, #f08a27 0%, #ff6a00 100%);
          color: #ffffff;
          font-weight: 800;
          font-size: 14px;
          border: 1px solid rgba(240,138,39,0.4);
          box-shadow: 0 10px 24px rgba(240,138,39,0.3);
        }

        .mypage-error {
          background: rgba(120, 25, 25, 0.22);
          border: 1px solid rgba(252, 165, 165, 0.24);
          color: #fecaca;
          border-radius: 18px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .mypage-shell {
            padding: 18px 12px 40px;
          }

          .mypage-card {
            border-radius: 24px;
            padding: 18px;
          }

          .mypage-actions,
          .mypage-grid,
          .mypage-products {
            grid-template-columns: 1fr;
          }

          .mypage-reserve-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .mypage-hero-badges {
            flex-direction: column;
            align-items: stretch;
          }

          .mypage-badge {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <main className="mypage-shell">
        <div className="mypage-container">
          <section className="mypage-card mypage-hero">
            <div className="mypage-label">MEMBER MY PAGE</div>

            <h1 className="mypage-title">{customerName}様のマイページ</h1>

            <p className="mypage-sub">
              ご契約内容、次回予約、おすすめ商品をまとめて確認できます。
              必要な情報にすぐアクセスできるよう、見やすく整理しています。
            </p>

            <div className="mypage-hero-badges">
              <div className="mypage-badge">
                {loading ? "読込中..." : `プラン：${subscription.planName || "未設定"}`}
              </div>
              <div className="mypage-badge">
                {loading ? "読込中..." : `残り：${subscription.remainingCount}回`}
              </div>
              <div className="mypage-badge">
                {nextReservation
                  ? `次回予約：${formatDateTime(nextReservation.date, nextReservation.startTime)}`
                  : "次回予約：未設定"}
              </div>
            </div>
          </section>

          {errorMessage ? <div className="mypage-error">{errorMessage}</div> : null}

          <section className="mypage-card">
            <div className="mypage-label">SUBSCRIPTION</div>

            <h2 className="mypage-section-title">サブスクリプション</h2>

            <p className="mypage-section-desc">
              現在のプラン内容や残り回数、次回決済予定日を確認できます。
            </p>

            <div className="mypage-grid">
              <InfoCard label="現在のプラン" value={loading ? "読込中..." : subscription.planName || "未設定"} />
              <InfoCard label="契約状況" value={loading ? "読込中..." : subscription.status || "未設定"} />
              <InfoCard
                label="残りの回数"
                value={loading ? "読込中..." : `${subscription.remainingCount}回`}
                accent="#f08a27"
              />
              <InfoCard
                label="次回決済日"
                value={loading ? "読込中..." : formatPaymentDate(subscription.nextPaymentDate)}
              />
            </div>

            <div className="mypage-actions">
              <Link href="/subscription" className="mypage-primary-btn">
                サブスク申込・確認
              </Link>

              <Link href="/customer" className="mypage-secondary-btn">
                契約内容を見る
              </Link>
            </div>
          </section>

          <section className="mypage-card">
            <div className="mypage-label">NEXT RESERVATION</div>

            <h2 className="mypage-section-title">次回予約・リマインド</h2>

            <p className="mypage-section-desc">
              {loading ? "予約情報を読み込み中です..." : reminderText}
            </p>

            {nextReservation ? (
              <div className="mypage-reserve-box">
                <ReserveRow
                  label="日時"
                  value={formatDateTime(nextReservation.date, nextReservation.startTime)}
                />
                <ReserveRow label="店舗" value={nextReservation.storeName} />
                <ReserveRow label="担当" value={nextReservation.staffName} />
                <ReserveRow label="メニュー" value={nextReservation.menu} />
              </div>
            ) : (
              <div className="mypage-empty">予約がまだ入っていません。</div>
            )}

            <div className="mypage-actions">
  <Link href="/reservation" className="mypage-primary-btn">
    予約を確認する
  </Link>

  <Link href="/reservation" className="mypage-secondary-btn">
    次回予約を入れる
  </Link>

  👉ここに追加👇

  <Link href="/mypage/meal" className="mypage-secondary-btn">
    食事管理を見る
  </Link>

  <Link href="/mypage/meal/new" className="mypage-primary-btn">
    食事を送る
  </Link>
</div>

          <section className="mypage-card">
            <div className="mypage-label">SHOP</div>

            <h2 className="mypage-section-title">おすすめ商品</h2>

            <p className="mypage-section-desc">
              トレーニングやボディメイクをサポートするおすすめ商品です。
            </p>

            <div className="mypage-products">
              {recommendedProducts.map((product) => (
                <div key={product.id} className="mypage-product-card">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="mypage-product-image"
                  />

                  <div className="mypage-product-body">
                    <div className="mypage-product-name">{product.name}</div>

                    <div className="mypage-product-price">{yen(product.price)}</div>

                    <div className="mypage-product-desc">{product.description}</div>

                    <Link href="/shop" className="mypage-shop-btn">
                      ショップを見る
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <Link href="/shop" className="mypage-primary-btn">
                物販ページへ進む
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function InfoCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="mypage-info-card">
      <div className="mypage-info-label">{label}</div>
      <div
        className="mypage-info-value"
        style={{ color: accent || "#ffffff" }}
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
    <div className="mypage-reserve-row">
      <div className="mypage-reserve-label">{label}</div>
      <div className="mypage-reserve-value">{value}</div>
    </div>
  );
}