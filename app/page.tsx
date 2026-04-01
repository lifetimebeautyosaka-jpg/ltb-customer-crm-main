"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UserRole = "admin" | "staff" | "";

type Customer = {
  id: string | number;
  name: string;
  phone?: string;
  plan?: string;
};

type Meal = {
  id: string;
  date: string;
  image?: string;
  comment: string;
  feedback?: string;
  createdAt: string;
};

type MealAlert = {
  customerId: string;
  customerName: string;
  mealId: string;
  date: string;
  comment: string;
  createdAt: string;
};

type ReservationStatus = "reserved" | "visited" | "tentative" | "blocked";

type Reservation = {
  id: string;
  customerId?: string;
  customerName: string;
  menu: string;
  startAt: string;
  endAt: string;
  staff: string;
  store: string;
  price: number;
  paymentMethod: string;
  status: ReservationStatus;
  memo?: string;
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<UserRole>("");
  const [displayName, setDisplayName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    setMounted(true);

    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    const savedRole = (localStorage.getItem("gymup_user_role") as UserRole) || "";
    const savedName = localStorage.getItem("gymup_current_staff_name") || "";

    setRole(savedRole);
    setDisplayName(savedName);

    try {
      const savedCustomers =
        localStorage.getItem("gymup_customers") ||
        localStorage.getItem("customers");

      if (savedCustomers) {
        const parsed = JSON.parse(savedCustomers);
        setCustomers(Array.isArray(parsed) ? parsed : []);
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    }

    try {
      const savedReservations = localStorage.getItem("gymup_reservations");
      if (savedReservations) {
        const parsed = JSON.parse(savedReservations);
        setReservations(Array.isArray(parsed) ? parsed : []);
      } else {
        setReservations([]);
      }
    } catch {
      setReservations([]);
    }
  }, []);

  const roleLabel = useMemo(() => {
    if (role === "admin") return "管理者";
    if (role === "staff") return "スタッフ";
    return "未設定";
  }, [role]);

  const mealAlerts = useMemo(() => {
    const alerts: MealAlert[] = [];

    customers.forEach((customer) => {
      try {
        const savedMeals = localStorage.getItem(`gymup_meals_${customer.id}`);
        const parsedMeals: Meal[] = savedMeals ? JSON.parse(savedMeals) : [];

        if (!Array.isArray(parsedMeals)) return;

        parsedMeals.forEach((meal) => {
          const hasNoFeedback = !meal.feedback || !meal.feedback.trim();
          if (hasNoFeedback) {
            alerts.push({
              customerId: String(customer.id),
              customerName: customer.name,
              mealId: meal.id,
              date: meal.date || "",
              comment: meal.comment || "",
              createdAt: meal.createdAt || "",
            });
          }
        });
      } catch {
        //
      }
    });

    return alerts.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return bTime - aTime;
    });
  }, [customers]);

  const reservationSummary = useMemo(() => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

    const todayReservations = reservations.filter((r) => r.startAt?.startsWith(todayKey));
    const tentativeCount = todayReservations.filter((r) => r.status === "tentative").length;
    const reservedCount = todayReservations.filter(
      (r) => r.status === "reserved" || r.status === "visited"
    ).length;
    const salesForecast = todayReservations
      .filter((r) => r.status === "reserved" || r.status === "visited")
      .reduce((sum, r) => sum + (Number(r.price) || 0), 0);

    const sortedUpcoming = [...todayReservations].sort((a, b) =>
      String(a.startAt).localeCompare(String(b.startAt))
    );

    const nextReservation =
      sortedUpcoming.find((r) => {
        const t = new Date(r.startAt).getTime();
        return Number.isFinite(t) && t >= Date.now();
      }) || sortedUpcoming[0];

    return {
      todayCount: todayReservations.length,
      tentativeCount,
      reservedCount,
      salesForecast,
      nextReservation,
    };
  }, [reservations]);

  const handleLogout = () => {
    localStorage.removeItem("gymup_logged_in");
    localStorage.removeItem("gymup_user_role");
    localStorage.removeItem("gymup_current_staff_name");
    localStorage.removeItem("gymup_login_id");
    localStorage.removeItem("gymup_current_login_id");
    window.location.href = "/login";
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: `
          radial-gradient(circle at 15% 18%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 12%, transparent 32%),
          radial-gradient(circle at 82% 20%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.35) 10%, transparent 30%),
          radial-gradient(circle at 70% 78%, rgba(255,255,255,0.55) 0%, transparent 24%),
          radial-gradient(circle at 28% 78%, rgba(255,255,255,0.38) 0%, transparent 22%),
          linear-gradient(135deg, #eef2f7 0%, #dfe7ef 22%, #cfd6df 48%, #bcc5cf 72%, #e8edf3 100%)
        `,
        padding: "24px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "-80px",
          width: "420px",
          height: "420px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 35%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "80px",
          right: "-100px",
          width: "380px",
          height: "380px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.28) 38%, transparent 72%)",
          filter: "blur(24px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          left: "35%",
          width: "520px",
          height: "520px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 40%, transparent 72%)",
          filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1180px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={heroCardStyle}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "30px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.05) 100%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "-30px",
              right: "80px",
              width: "180px",
              height: "180px",
              borderRadius: "999px",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.18) 38%, transparent 72%)",
              filter: "blur(18px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                flexWrap: "wrap",
              }}
            >
              <img
                src="/gymup-logo.png"
                alt="GYMUP CRM"
                style={{
                  width: "88px",
                  height: "88px",
                  objectFit: "contain",
                  display: "block",
                  filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.12))",
                }}
              />

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    color: "#6b7280",
                    marginBottom: "10px",
                  }}
                >
                  GYMUP CRM
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: "36px",
                    fontWeight: 800,
                    color: "#111827",
                    lineHeight: 1.15,
                  }}
                >
                  ホーム
                </h1>

                <p
                  style={{
                    margin: "10px 0 0 0",
                    fontSize: "15px",
                    color: "#4b5563",
                    lineHeight: 1.8,
                  }}
                >
                  顧客管理・予約管理・売上管理・会計管理・勤怠管理・食事管理・アカウント管理をここから開けます
                </p>
              </div>
            </div>

            <button onClick={handleLogout} style={logoutButtonStyle}>
              ログアウト
            </button>
          </div>
        </div>

        <section style={reservationHeroStyle}>
          <div style={reservationHeroGlowStyle} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "18px",
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ flex: 1, minWidth: "240px" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                RESERVATION
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "30px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                予約管理
              </h2>
              <p
                style={{
                  margin: "10px 0 0 0",
                  fontSize: "15px",
                  color: "#475569",
                  lineHeight: 1.8,
                }}
              >
                月カレンダーと1日表示で、今日の予約確認も先の予約入力もすぐできます。
              </p>
            </div>

            <Link href="/reservation" style={reservationMainButtonStyle}>
              予約管理を開く
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginTop: "20px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={reservationInfoCardStyle}>
              <div style={reservationInfoLabelStyle}>今日の予約</div>
              <div style={reservationInfoValueStyle}>{reservationSummary.todayCount}件</div>
            </div>

            <div style={reservationInfoCardStyle}>
              <div style={reservationInfoLabelStyle}>仮予約</div>
              <div style={reservationInfoValueStyle}>{reservationSummary.tentativeCount}件</div>
            </div>

            <div style={reservationInfoCardStyle}>
              <div style={reservationInfoLabelStyle}>来店予定</div>
              <div style={reservationInfoValueStyle}>{reservationSummary.reservedCount}件</div>
            </div>

            <div style={reservationInfoCardStyle}>
              <div style={reservationInfoLabelStyle}>売上見込み</div>
              <div style={reservationInfoValueStyle}>
                ¥{reservationSummary.salesForecast.toLocaleString()}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "14px 16px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.68)",
              border: "1px solid rgba(255,255,255,0.84)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
              次の予約
            </div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
              {reservationSummary.nextReservation
                ? `${reservationSummary.nextReservation.customerName} / ${
                    reservationSummary.nextReservation.menu
                  } / ${new Date(reservationSummary.nextReservation.startAt).toLocaleString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "本日の予約はありません"}
            </div>
          </div>
        </section>

        {mealAlerts.length > 0 ? (
          <section style={alertSectionStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: "#b91c1c",
                    marginBottom: "8px",
                  }}
                >
                  NEW MEAL ALERT
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  新着食事アラート
                </h2>
              </div>

              <div style={alertBadgeStyle}>未返信 {mealAlerts.length}件</div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {mealAlerts.slice(0, 6).map((alert) => (
                <div key={alert.mealId} style={alertRowStyle}>
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div
                      style={{
                        fontSize: "17px",
                        fontWeight: 800,
                        color: "#111827",
                        marginBottom: "6px",
                      }}
                    >
                      {alert.customerName}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      投稿日：{alert.date || "-"}
                    </div>

                    <div
                      style={{
                        fontSize: "14px",
                        color: "#374151",
                        lineHeight: 1.7,
                      }}
                    >
                      {alert.comment.length > 80
                        ? `${alert.comment.slice(0, 80)}...`
                        : alert.comment || "コメントなし"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link href={`/customer/${alert.customerId}/meal`} style={subButtonStyle}>
                      一覧を見る
                    </Link>

                    <Link
                      href={`/customer/${alert.customerId}/meal/feedback?mealId=${alert.mealId}`}
                      style={alertMainButtonStyle}
                    >
                      返信する
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {mealAlerts.length > 6 ? (
              <div style={{ marginTop: "14px" }}>
                <Link href="/meal" style={subButtonStyle}>
                  すべての食事アラートを見る
                </Link>
              </div>
            ) : null}
          </section>
        ) : (
          <section style={noAlertSectionStyle}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              MEAL ALERT
            </div>
            <h2
              style={{
                margin: "0 0 8px 0",
                fontSize: "24px",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              新着食事アラートはありません
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#4b5563",
                lineHeight: 1.8,
              }}
            >
              現在、未返信の食事投稿はありません。
            </p>
          </section>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              <Link href="/reservation" style={menuCardPrimaryStyle}>
                <div style={menuShineStyle} />
                <div style={menuTitleStyle}>予約管理</div>
                <div style={menuTextStyle}>
                  月カレンダー・1日表示・予約追加を最優先で開く
                </div>
              </Link>

              <Link href="/customer" style={menuCardStyle}>
                <div style={menuShineStyle} />
                <div style={menuTitleStyle}>顧客管理</div>
                <div style={menuTextStyle}>顧客追加、顧客一覧、詳細確認</div>
              </Link>

              <Link href="/sales" style={menuCardStyle}>
                <div style={menuShineStyle} />
                <div style={menuTitleStyle}>売上管理</div>
                <div style={menuTextStyle}>売上入力、履歴確認、集計</div>
              </Link>

              <Link href="/accounting" style={menuCardStyle}>
                <div style={menuShineStyle} />
                <div style={menuTitleStyle}>会計管理</div>
                <div style={menuTextStyle}>前受金、月別集計、サブスク確認</div>
              </Link>

              <Link href="/attendance" style={menuCardStyle}>
                <div style={menuShineStyle} />
                <div style={menuTitleStyle}>勤怠管理</div>
                <div style={menuTextStyle}>スタッフ打刻、勤怠確認</div>
              </Link>

              <Link href="/meal" style={menuCardStyle}>
                <div style={menuShineStyle} />
                {mealAlerts.length > 0 ? <div style={menuBadgeStyle}>{mealAlerts.length}</div> : null}
                <div style={menuTitleStyle}>食事管理</div>
                <div style={menuTextStyle}>
                  顧客を選んで食事投稿・確認・フィードバック
                </div>
              </Link>

              <Link href="/account" style={menuCardStyle}>
                <div style={menuShineStyle} />
                <div style={menuTitleStyle}>アカウント</div>
                <div style={menuTextStyle}>ログインID、表示名、権限の管理</div>
              </Link>
            </div>
          </div>

          <div style={sideCardStyle}>
            <div
              style={{
                position: "absolute",
                top: "-20px",
                left: "-10px",
                width: "140px",
                height: "140px",
                borderRadius: "999px",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.18) 38%, transparent 72%)",
                filter: "blur(14px)",
                pointerEvents: "none",
              }}
            />

            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
                position: "relative",
                zIndex: 1,
              }}
            >
              現在のログイン情報
            </h2>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>表示名</div>
              <div style={infoValueStyle}>{displayName || "未設定"}</div>
            </div>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>権限</div>
              <div style={infoValueStyle}>{roleLabel}</div>
            </div>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>ログイン状態</div>
              <div style={infoValueStyle}>
                {localStorage.getItem("gymup_logged_in") === "true"
                  ? "ログイン中"
                  : "未ログイン"}
              </div>
            </div>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>未返信の食事投稿</div>
              <div style={infoValueStyle}>{mealAlerts.length}件</div>
            </div>

            <div style={infoBoxStyle}>
              <div style={infoLabelStyle}>今日の予約</div>
              <div style={infoValueStyle}>{reservationSummary.todayCount}件</div>
            </div>

            <div style={ruleBoxStyle}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                現在のルール
              </div>
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.86)",
                }}
              >
                食事投稿あり ＋ フィードバック未入力
                <br />
                のものをホームでアラート表示します。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const heroCardStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background: "rgba(255,255,255,0.42)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.78)",
  borderRadius: "30px",
  padding: "30px",
  boxShadow:
    "0 24px 70px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
  marginBottom: "24px",
};

const reservationHeroStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background: "rgba(255,255,255,0.54)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.82)",
  borderRadius: "26px",
  padding: "24px",
  boxShadow:
    "0 20px 50px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
  marginBottom: "24px",
};

const reservationHeroGlowStyle: React.CSSProperties = {
  position: "absolute",
  top: "-40px",
  right: "-30px",
  width: "180px",
  height: "180px",
  borderRadius: "999px",
  background:
    "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.20) 40%, transparent 75%)",
  filter: "blur(12px)",
  pointerEvents: "none",
};

const reservationMainButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "16px",
  padding: "14px 18px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "14px",
  boxShadow: "0 14px 34px rgba(17,24,39,0.18)",
  whiteSpace: "nowrap",
};

const reservationInfoCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.86)",
  borderRadius: "18px",
  padding: "14px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92)",
};

const reservationInfoLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  marginBottom: "6px",
};

const reservationInfoValueStyle: React.CSSProperties = {
  fontSize: "20px",
  color: "#111827",
  fontWeight: 800,
};

const alertSectionStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background: "rgba(255,255,255,0.52)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(252,165,165,0.65)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow:
    "0 18px 46px rgba(239,68,68,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
  marginBottom: "24px",
};

const noAlertSectionStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background: "rgba(255,255,255,0.44)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.78)",
  borderRadius: "24px",
  padding: "22px",
  boxShadow:
    "0 18px 46px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  marginBottom: "24px",
};

const alertBadgeStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "10px 14px",
  background: "#b91c1c",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "14px",
};

const alertRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(254,202,202,0.95)",
  borderRadius: "18px",
  padding: "16px",
};

const menuCardStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  display: "block",
  textDecoration: "none",
  background: "rgba(255,255,255,0.48)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.80)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow:
    "0 18px 46px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  color: "#111827",
};

const menuCardPrimaryStyle: React.CSSProperties = {
  ...menuCardStyle,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(241,245,249,0.88) 100%)",
  border: "1px solid rgba(148,163,184,0.35)",
  boxShadow:
    "0 22px 54px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255,255,255,0.96)",
};

const menuShineStyle: React.CSSProperties = {
  position: "absolute",
  top: "-40px",
  right: "-20px",
  width: "140px",
  height: "140px",
  borderRadius: "999px",
  background:
    "radial-gradient(circle, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.18) 42%, transparent 72%)",
  filter: "blur(10px)",
  pointerEvents: "none",
};

const menuBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: "14px",
  right: "14px",
  minWidth: "28px",
  height: "28px",
  borderRadius: "999px",
  background: "#b91c1c",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 8px",
  zIndex: 2,
};

const sideCardStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background: "rgba(255,255,255,0.45)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.80)",
  borderRadius: "24px",
  padding: "22px",
  boxShadow:
    "0 18px 46px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
};

const menuTitleStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  fontSize: "22px",
  fontWeight: 800,
  marginBottom: "10px",
  color: "#111827",
};

const menuTextStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  fontSize: "14px",
  lineHeight: 1.8,
  color: "#4b5563",
};

const logoutButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  background: "rgba(17,24,39,0.96)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 14px 34px rgba(17,24,39,0.20)",
};

const infoBoxStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  background: "rgba(255,255,255,0.66)",
  border: "1px solid rgba(255,255,255,0.82)",
  borderRadius: "16px",
  padding: "14px",
  marginBottom: "12px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92)",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  marginBottom: "6px",
};

const infoValueStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#111827",
  fontWeight: 700,
};

const ruleBoxStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  marginTop: "18px",
  borderRadius: "16px",
  background: "rgba(17,24,39,0.94)",
  padding: "16px",
  color: "#fff",
  boxShadow: "0 14px 34px rgba(17,24,39,0.16)",
};

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "14px",
  padding: "11px 16px",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(203,213,225,0.95)",
  color: "#111827",
  fontWeight: 700,
  textAlign: "center",
};

const alertMainButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "14px",
  padding: "11px 16px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "center",
};