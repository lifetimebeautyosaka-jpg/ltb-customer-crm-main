"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReservationItem = {
  id: string;
  date: string;
  startTime: string;
  storeName: string;
  staffName: string;
  menu: string;
  status: "予定" | "完了" | "キャンセル";
};

type PaymentItem = {
  id: string;
  date: string;
  amount: number;
  label: string;
  status: "支払い済み" | "未払い";
};

type MyPageData = {
  customerName: string;
  customerCode: string;
  planName: string;
  monthlyCount: number;
  usedCount: number;
  carryOver: number;
  nextPaymentDate: string;
  membershipStatus: "有効" | "停止" | "休会";
  nextReservation: ReservationItem | null;
  reservations: ReservationItem[];
  payments: PaymentItem[];
  notices: string[];
};

const demoData: MyPageData = {
  customerName: "山田 花子",
  customerCode: "GYMUP-001",
  planName: "月4回コース",
  monthlyCount: 4,
  usedCount: 1,
  carryOver: 1,
  nextPaymentDate: "2026-05-01",
  membershipStatus: "有効",
  nextReservation: {
    id: "r1",
    date: "2026-04-18",
    startTime: "10:00",
    storeName: "江戸堀本店",
    staffName: "山口",
    menu: "パーソナルトレーニング",
    status: "予定",
  },
  reservations: [
    {
      id: "r1",
      date: "2026-04-18",
      startTime: "10:00",
      storeName: "江戸堀本店",
      staffName: "山口",
      menu: "パーソナルトレーニング",
      status: "予定",
    },
    {
      id: "r2",
      date: "2026-04-11",
      startTime: "11:00",
      storeName: "江戸堀本店",
      staffName: "中西",
      menu: "ストレッチ",
      status: "完了",
    },
    {
      id: "r3",
      date: "2026-04-04",
      startTime: "13:30",
      storeName: "福島店",
      staffName: "池田",
      menu: "パーソナルトレーニング",
      status: "完了",
    },
  ],
  payments: [
    {
      id: "p1",
      date: "2026-04-01",
      amount: 33880,
      label: "月4回コース 4月分",
      status: "支払い済み",
    },
    {
      id: "p2",
      date: "2026-03-01",
      amount: 33880,
      label: "月4回コース 3月分",
      status: "支払い済み",
    },
  ],
  notices: [
    "次回決済日は 2026-05-01 です。",
    "予約変更は前日までにご連絡ください。",
    "当日の体調に不安がある場合は無理をせずご相談ください。",
  ],
};

const pageBg =
  "linear-gradient(135deg, #f8fafc 0%, #eef2f7 50%, #f8fafc 100%)";

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: 24,
  boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: "#0f172a",
  margin: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
  letterSpacing: "0.08em",
};

const valueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function formatYen(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(status: MyPageData["membershipStatus"]) {
  if (status === "有効") return "#16a34a";
  if (status === "休会") return "#d97706";
  return "#dc2626";
}

function getReservationStatusStyle(status: ReservationItem["status"]) {
  if (status === "予定") {
    return {
      background: "rgba(37,99,235,0.08)",
      color: "#2563eb",
      border: "1px solid rgba(37,99,235,0.18)",
    };
  }
  if (status === "完了") {
    return {
      background: "rgba(22,163,74,0.08)",
      color: "#16a34a",
      border: "1px solid rgba(22,163,74,0.18)",
    };
  }
  return {
    background: "rgba(220,38,38,0.08)",
    color: "#dc2626",
    border: "1px solid rgba(220,38,38,0.18)",
  };
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: 18,
        minHeight: 132,
      }}
    >
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, marginTop: 12 }}>{value}</div>
      {sub ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            lineHeight: 1.7,
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export default function MyPage() {
  const [data, setData] = useState<MyPageData>(demoData);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gymup_mypage_demo");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<MyPageData>;
      setData({
        ...demoData,
        ...parsed,
        nextReservation:
          parsed.nextReservation === undefined
            ? demoData.nextReservation
            : parsed.nextReservation,
        reservations: parsed.reservations || demoData.reservations,
        payments: parsed.payments || demoData.payments,
        notices: parsed.notices || demoData.notices,
      });
    } catch (error) {
      console.error("マイページデータ読み込みエラー:", error);
    }
  }, []);

  const remainingCount = useMemo(() => {
    return Math.max(data.monthlyCount + data.carryOver - data.usedCount, 0);
  }, [data]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: pageBg,
        padding: "20px 14px 40px",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: 20,
            display: "grid",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#64748b",
                  marginBottom: 6,
                  letterSpacing: "0.08em",
                }}
              >
                MEMBER PAGE
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 30,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                こんにちは、{data.customerName} 様
              </h1>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                会員番号：{data.customerCode}
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.7)",
                border: `1px solid ${getStatusColor(data.membershipStatus)}22`,
                fontSize: 14,
                fontWeight: 800,
                color: getStatusColor(data.membershipStatus),
                whiteSpace: "nowrap",
              }}
            >
              ● {data.membershipStatus}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/reservation"
              style={{
                textDecoration: "none",
                height: 46,
                padding: "0 18px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #111827 0%, #dc2626 100%)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              予約画面へ
            </Link>

            <Link
              href="/"
              style={{
                textDecoration: "none",
                height: 46,
                padding: "0 18px",
                borderRadius: 14,
                background: "#fff",
                color: "#111827",
                fontSize: 14,
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e2e8f0",
              }}
            >
              トップへ戻る
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <SummaryCard
            label="現在のプラン"
            value={data.planName}
            sub={`次回決済日 ${formatDate(data.nextPaymentDate)}`}
          />
          <SummaryCard
            label="残り回数"
            value={`${remainingCount}回`}
            sub={`月回数 ${data.monthlyCount}回 / 繰越 ${data.carryOver}回 / 消化 ${data.usedCount}回`}
          />
          <SummaryCard
            label="次回予約"
            value={
              data.nextReservation
                ? `${formatDate(data.nextReservation.date)} ${data.nextReservation.startTime}`
                : "予約なし"
            }
            sub={
              data.nextReservation
                ? `${data.nextReservation.storeName} / ${data.nextReservation.staffName}`
                : "次回予約をお取りください"
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "1.15fr 0.85fr",
          }}
        >
          <div
            style={{
              ...cardStyle,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <h2 style={sectionTitleStyle}>予約一覧</h2>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  fontWeight: 700,
                }}
              >
                直近 {data.reservations.length}件
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {data.reservations.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 18,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    padding: 16,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {formatDate(item.date)} {item.startTime}
                    </div>

                    <div
                      style={{
                        ...getReservationStatusStyle(item.status),
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {item.status}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 6,
                      fontSize: 14,
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    <div>店舗：{item.storeName}</div>
                    <div>担当：{item.staffName}</div>
                    <div>メニュー：{item.menu}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                ...cardStyle,
                padding: 20,
              }}
            >
              <h2 style={{ ...sectionTitleStyle, marginBottom: 14 }}>
                お知らせ
              </h2>

              <div style={{ display: "grid", gap: 10 }}>
                {data.notices.map((notice, index) => (
                  <div
                    key={`${notice}-${index}`}
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 14,
                      fontSize: 14,
                      color: "#334155",
                      lineHeight: 1.8,
                      fontWeight: 600,
                    }}
                  >
                    {notice}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                ...cardStyle,
                padding: 20,
              }}
            >
              <h2 style={{ ...sectionTitleStyle, marginBottom: 14 }}>
                お支払い履歴
              </h2>

              <div style={{ display: "grid", gap: 10 }}>
                {data.payments.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 14,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color:
                            item.status === "支払い済み" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {item.status}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      {formatDate(item.date)}
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#111827",
                      }}
                    >
                      {formatYen(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            padding: 16,
            fontSize: 13,
            lineHeight: 1.8,
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          ※ このページは先行UI版です。次の段階で Stripe決済情報・Supabase顧客情報・予約データと自動連携させます。
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          main :global(.mypage-two-col) {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}