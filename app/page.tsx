"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type ReservationItem = {
  id: string;
  date: string;
  start_time: string;
  customer_name: string;
  menu?: string;
  staff_name?: string;
  store_name?: string;
};

type DisplayReservation = {
  id: string;
  time: string;
  name: string;
  menu: string;
  staff: string;
  store: string;
};

type SystemStatus = "ONLINE" | "FALLBACK" | "OFFLINE";

const quickLinks = [
  { title: "顧客管理", href: "/customer", desc: "会員情報・履歴・進捗管理" },
  { title: "予約管理", href: "/reservation", desc: "当日確認・予約登録・日別管理" },
  { title: "売上管理", href: "/sales", desc: "売上登録・集計・区分確認" },
  { title: "勤怠管理", href: "/attendance", desc: "打刻・勤務時間・確認" },
  { title: "会計管理", href: "/accounting", desc: "前受金・会計区分・集計" },
  { title: "サブスク管理", href: "/subscription", desc: "契約状況・残回数・継続管理" },
];

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  try {
    return createClient(url, anonKey);
  } catch (error) {
    console.error("Supabase client create error:", error);
    return null;
  }
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTodayLabel() {
  const now = new Date();
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);
}

function normalizeReservation(raw: any): ReservationItem | null {
  if (!raw) return null;

  const id = String(
    raw.id ??
      `${raw.date ?? ""}-${raw.start_time ?? raw.startTime ?? ""}-${raw.customer_name ?? raw.customerName ?? raw.name ?? ""}`
  );
  const date = String(raw.date ?? "").trim();
  const startTime = String(raw.start_time ?? raw.startTime ?? "").trim();
  const customerName = String(
    raw.customer_name ?? raw.customerName ?? raw.name ?? ""
  ).trim();
  const menu = String(raw.menu ?? raw.menu_name ?? raw.course ?? "予約メニュー").trim();
  const staffName = String(raw.staff_name ?? raw.staffName ?? "担当未設定").trim();
  const storeName = String(raw.store_name ?? raw.storeName ?? "").trim();

  if (!date || !startTime || !customerName) return null;

  return {
    id,
    date,
    start_time: startTime,
    customer_name: customerName,
    menu,
    staff_name: staffName,
    store_name: storeName,
  };
}

function toDisplayReservation(item: ReservationItem): DisplayReservation {
  return {
    id: item.id,
    time: item.start_time?.slice(0, 5) || "--:--",
    name: item.customer_name || "名前未設定",
    menu: item.menu || "予約メニュー",
    staff: item.staff_name || "担当未設定",
    store: item.store_name || "",
  };
}

function sortReservations(list: ReservationItem[]) {
  return [...list].sort((a, b) => {
    const aTime = a.start_time || "";
    const bTime = b.start_time || "";
    return aTime.localeCompare(bTime);
  });
}

function parseLocalReservations(): ReservationItem[] {
  if (typeof window === "undefined") return [];

  const possibleKeys = ["reservations", "gymup_reservations", "ltb_reservations"];
  const merged: ReservationItem[] = [];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      const normalized = parsed
        .map(normalizeReservation)
        .filter(Boolean) as ReservationItem[];

      merged.push(...normalized);
    } catch (error) {
      console.error(`localStorage parse error: ${key}`, error);
    }
  }

  const uniqueMap = new Map<string, ReservationItem>();

  for (const item of merged) {
    const uniqueKey = [
      item.date,
      item.start_time,
      item.customer_name,
      item.menu || "",
      item.staff_name || "",
      item.store_name || "",
    ].join("::");

    if (!uniqueMap.has(uniqueKey)) {
      uniqueMap.set(uniqueKey, item);
    }
  }

  return Array.from(uniqueMap.values());
}

export default function HomePage() {
  const [todayReservations, setTodayReservations] = useState<DisplayReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationError, setReservationError] = useState("");
  const [activeMembers, setActiveMembers] = useState<number | null>(null);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("OFFLINE");
  const [logoError, setLogoError] = useState(false);

  const todayLabel = useMemo(() => formatTodayLabel(), []);

  useEffect(() => {
    let mounted = true;

    async function loadTopData() {
      setLoadingReservations(true);
      setReservationError("");

      const today = getTodayDateString();

      try {
        const supabase = getSupabaseClient();

        if (supabase) {
          const [reservationsResult, customersResult] = await Promise.all([
            supabase
              .from("reservations")
              .select("id, date, start_time, customer_name, menu, staff_name, store_name")
              .eq("date", today)
              .order("start_time", { ascending: true }),
            supabase.from("customers").select("id", { count: "exact", head: true }),
          ]);

          if (reservationsResult.error) {
            throw reservationsResult.error;
          }

          const normalizedReservations = (reservationsResult.data || [])
            .map(normalizeReservation)
            .filter(Boolean) as ReservationItem[];

          const sorted = sortReservations(normalizedReservations);
          const display = sorted.slice(0, 6).map(toDisplayReservation);

          if (!mounted) return;

          setTodayReservations(display);
          setTodayCount(sorted.length);
          setActiveMembers(customersResult.count ?? 0);
          setSystemStatus("ONLINE");
          setLoadingReservations(false);
          return;
        }

        const localReservations = parseLocalReservations();
        const todayLocal = sortReservations(
          localReservations.filter((item) => item.date === today)
        );
        const display = todayLocal.slice(0, 6).map(toDisplayReservation);

        if (!mounted) return;

        setTodayReservations(display);
        setTodayCount(todayLocal.length);
        setActiveMembers(null);
        setSystemStatus(todayLocal.length > 0 ? "FALLBACK" : "OFFLINE");
        setLoadingReservations(false);
      } catch (error) {
        console.error("TOP data load error:", error);

        try {
          const today = getTodayDateString();
          const localReservations = parseLocalReservations();
          const todayLocal = sortReservations(
            localReservations.filter((item) => item.date === today)
          );
          const display = todayLocal.slice(0, 6).map(toDisplayReservation);

          if (!mounted) return;

          setTodayReservations(display);
          setTodayCount(todayLocal.length);
          setActiveMembers(null);
          setSystemStatus(todayLocal.length > 0 ? "FALLBACK" : "OFFLINE");
          setLoadingReservations(false);

          if (todayLocal.length === 0) {
            setReservationError("予約データの取得に失敗しました");
          }
        } catch (fallbackError) {
          console.error("fallback load error:", fallbackError);

          if (!mounted) return;

          setTodayReservations([]);
          setTodayCount(0);
          setActiveMembers(null);
          setSystemStatus("OFFLINE");
          setLoadingReservations(false);
          setReservationError("予約データの取得に失敗しました");
        }
      }
    }

    loadTopData();

    return () => {
      mounted = false;
    };
  }, []);

  const statusLabel =
    systemStatus === "ONLINE"
      ? "Online"
      : systemStatus === "FALLBACK"
      ? "Fallback"
      : "Offline";

  const statCards = [
    {
      label: "Today Reservations",
      value: loadingReservations ? "..." : String(todayCount),
    },
    {
      label: "Active Members",
      value: activeMembers === null ? "--" : String(activeMembers),
    },
    {
      label: "System Status",
      value: statusLabel,
    },
  ];

  return (
    <>
      <style>{`
        .gymup-home {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.035) 0%, transparent 28%),
            radial-gradient(circle at bottom right, rgba(255,255,255,0.025) 0%, transparent 22%),
            linear-gradient(180deg, #0f1012 0%, #16181b 48%, #111214 100%);
          color: #f5f7fa;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .gymup-home::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, rgba(240,138,39,0.06), transparent 34%),
            linear-gradient(300deg, rgba(240,138,39,0.04), transparent 28%);
          pointer-events: none;
        }

        .gymup-home__container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 34px 24px 28px;
        }

        .gymup-home__grid {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
          gap: 28px;
          align-items: stretch;
          min-height: calc(100vh - 62px);
        }

        .gymup-home__left {
          display: flex;
          flex-direction: column;
          gap: 22px;
          min-width: 0;
        }

        .gymup-home__right {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .gymup-home__hero-card,
        .gymup-home__menu-card,
        .gymup-home__dashboard {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.045);
          box-shadow: 0 18px 48px rgba(0,0,0,0.24);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 28px;
        }

        .gymup-home__hero-card {
          padding: 26px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 420px;
        }

        .gymup-home__menu-card {
          padding: 22px;
        }

        .gymup-home__logo-wrap {
          display: flex;
          align-items: center;
          min-height: 108px;
          margin-bottom: 16px;
        }

        .gymup-home__logo-box {
          width: min(100%, 520px);
        }

        .gymup-home__logo {
          display: block;
          width: 100%;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 12px 34px rgba(0,0,0,0.28));
          user-select: none;
          pointer-events: none;
        }

        .gymup-home__text-logo {
          display: inline-flex;
          align-items: flex-end;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(240,138,39,0.35);
        }

        .gymup-home__text-logo-main {
          font-size: clamp(38px, 5vw, 72px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #ffffff;
        }

        .gymup-home__text-logo-sub {
          font-size: clamp(15px, 2vw, 24px);
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: #f08a27;
          padding-bottom: 8px;
        }

        .gymup-home__copy {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 620px;
        }

        .gymup-home__eyebrow {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.68);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .gymup-home__title {
          margin: 0;
          font-size: clamp(34px, 5vw, 60px);
          line-height: 1.06;
          letter-spacing: -0.04em;
          font-weight: 700;
          color: #ffffff;
        }

        .gymup-home__desc {
          margin: 0;
          max-width: 560px;
          color: rgba(255,255,255,0.66);
          font-size: 15px;
          line-height: 1.9;
        }

        .gymup-home__cta-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .gymup-home__btn-primary,
        .gymup-home__btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          padding: 0 22px;
          border-radius: 16px;
          text-decoration: none;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .gymup-home__btn-primary {
          background: #f08a27;
          color: #141414;
          font-size: 15px;
          font-weight: 700;
          box-shadow: 0 12px 28px rgba(240, 138, 39, 0.22);
        }

        .gymup-home__btn-secondary {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #f5f7fa;
          font-size: 15px;
          font-weight: 600;
        }

        .gymup-home__btn-primary:hover,
        .gymup-home__btn-secondary:hover,
        .gymup-home__menu-link:hover,
        .gymup-home__mini-link:hover {
          transform: translateY(-1px);
        }

        .gymup-home__section-label {
          font-size: 12px;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 16px;
        }

        .gymup-home__menu-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .gymup-home__menu-link {
          display: block;
          text-decoration: none;
          color: inherit;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .gymup-home__menu-link:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
        }

        .gymup-home__menu-title {
          margin-bottom: 6px;
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }

        .gymup-home__menu-desc {
          font-size: 13px;
          line-height: 1.65;
          color: rgba(255,255,255,0.56);
        }

        .gymup-home__dashboard {
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .gymup-home__dashboard-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 16px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.025);
        }

        .gymup-home__dots {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gymup-home__dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(255,255,255,0.16);
        }

        .gymup-home__dashboard-label {
          font-size: 13px;
          color: rgba(255,255,255,0.54);
          letter-spacing: 0.04em;
        }

        .gymup-home__dashboard-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          flex: 1;
        }

        .gymup-home__stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .gymup-home__stat {
          border-radius: 20px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
        }

        .gymup-home__stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.48);
          margin-bottom: 10px;
          letter-spacing: 0.04em;
        }

        .gymup-home__stat-value {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .gymup-home__panels {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 16px;
          flex: 1;
        }

        .gymup-home__panel-large,
        .gymup-home__panel-small {
          border-radius: 24px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
        }

        .gymup-home__panel-stack {
          display: grid;
          gap: 16px;
        }

        .gymup-home__panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 16px;
        }

        .gymup-home__panel-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
        }

        .gymup-home__panel-meta {
          font-size: 13px;
          color: #f08a27;
          font-weight: 600;
        }

        .gymup-home__schedule {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .gymup-home__schedule-item {
          display: grid;
          grid-template-columns: 74px 1fr;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.028);
        }

        .gymup-home__schedule-time {
          font-size: 14px;
          font-weight: 700;
          color: #f08a27;
        }

        .gymup-home__schedule-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
          word-break: break-word;
        }

        .gymup-home__schedule-sub {
          font-size: 12px;
          line-height: 1.6;
          color: rgba(255,255,255,0.56);
          word-break: break-word;
        }

        .gymup-home__empty {
          padding: 20px 14px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          font-size: 13px;
          line-height: 1.7;
          color: rgba(255,255,255,0.58);
        }

        .gymup-home__mini-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .gymup-home__mini-link {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 10px;
          border-radius: 14px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          color: #f5f7fa;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.028);
          transition: transform 0.2s ease, background 0.2s ease;
          text-align: center;
        }

        .gymup-home__mini-link:hover {
          background: rgba(255,255,255,0.045);
        }

        .gymup-home__alerts {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
        }

        .gymup-home__alert {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255,255,255,0.7);
        }

        .gymup-home__alert-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #f08a27;
          flex-shrink: 0;
        }

        @media (max-width: 1100px) {
          .gymup-home__grid {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .gymup-home__hero-card {
            min-height: auto;
          }

          .gymup-home__title {
            font-size: clamp(34px, 7vw, 52px);
          }
        }

        @media (max-width: 768px) {
          .gymup-home__container {
            padding: 18px 14px 22px;
          }

          .gymup-home__grid {
            gap: 18px;
          }

          .gymup-home__left {
            gap: 18px;
          }

          .gymup-home__hero-card,
          .gymup-home__menu-card,
          .gymup-home__dashboard,
          .gymup-home__panel-large,
          .gymup-home__panel-small {
            border-radius: 22px;
          }

          .gymup-home__hero-card {
            padding: 20px;
          }

          .gymup-home__menu-card {
            padding: 18px;
          }

          .gymup-home__logo-wrap {
            justify-content: center;
            min-height: auto;
            margin-bottom: 10px;
          }

          .gymup-home__logo-box {
            width: min(88vw, 320px);
          }

          .gymup-home__copy {
            align-items: center;
            text-align: center;
            max-width: 100%;
          }

          .gymup-home__eyebrow {
            align-self: center;
          }

          .gymup-home__title {
            font-size: 34px;
            line-height: 1.12;
          }

          .gymup-home__desc {
            font-size: 14px;
            line-height: 1.8;
          }

          .gymup-home__cta-row {
            width: 100%;
            flex-direction: column;
          }

          .gymup-home__btn-primary,
          .gymup-home__btn-secondary {
            width: 100%;
          }

          .gymup-home__menu-grid,
          .gymup-home__stats,
          .gymup-home__panels,
          .gymup-home__mini-grid {
            grid-template-columns: 1fr;
          }

          .gymup-home__dashboard-body {
            padding: 16px;
          }

          .gymup-home__schedule-item {
            grid-template-columns: 62px 1fr;
            padding: 12px;
          }

          .gymup-home__stat-value {
            font-size: 22px;
          }

          .gymup-home__text-logo {
            justify-content: center;
          }
        }
      `}</style>

      <main className="gymup-home">
        <div className="gymup-home__container">
          <div className="gymup-home__grid">
            <div className="gymup-home__left">
              <div className="gymup-home__hero-card">
                <div className="gymup-home__logo-wrap">
                  <div className="gymup-home__logo-box">
                    {!logoError ? (
                      <img
                        src="/logo.png"
                        alt="GYMUP"
                        className="gymup-home__logo"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="gymup-home__text-logo" aria-label="GYMUP CRM">
                        <div className="gymup-home__text-logo-main">GYMUP</div>
                        <div className="gymup-home__text-logo-sub">CRM</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="gymup-home__copy">
                  <div className="gymup-home__eyebrow">GYM / PILATES CRM</div>

                  <h1 className="gymup-home__title">
                    現場の管理を、
                    <br />
                    ひとつに整理する。
                  </h1>

                  <p className="gymup-home__desc">
                    予約、顧客、売上、勤怠、会計、サブスク管理まで。
                    GYMUP CRMは、ジム・ピラティス運営に必要な業務を見やすく整理し、
                    日々の現場で使いやすい形にまとめる管理システムです。
                  </p>

                  <div className="gymup-home__cta-row">
                    <Link href="/customer" className="gymup-home__btn-primary">
                      管理画面へ入る
                    </Link>
                    <Link href="/login" className="gymup-home__btn-secondary">
                      会員ログイン
                    </Link>
                  </div>
                </div>
              </div>

              <div className="gymup-home__menu-card">
                <div className="gymup-home__section-label">MAIN MENU</div>

                <div className="gymup-home__menu-grid">
                  {quickLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="gymup-home__menu-link">
                      <div className="gymup-home__menu-title">{item.title}</div>
                      <div className="gymup-home__menu-desc">{item.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="gymup-home__right">
              <div className="gymup-home__dashboard">
                <div className="gymup-home__dashboard-top">
                  <div className="gymup-home__dots">
                    <span className="gymup-home__dot" />
                    <span className="gymup-home__dot" />
                    <span className="gymup-home__dot" />
                  </div>
                  <div className="gymup-home__dashboard-label">Dashboard Preview</div>
                </div>

                <div className="gymup-home__dashboard-body">
                  <div className="gymup-home__stats">
                    {statCards.map((stat) => (
                      <div key={stat.label} className="gymup-home__stat">
                        <div className="gymup-home__stat-label">{stat.label}</div>
                        <div className="gymup-home__stat-value">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="gymup-home__panels">
                    <div className="gymup-home__panel-large">
                      <div className="gymup-home__panel-head">
                        <div className="gymup-home__panel-title">Today Schedule</div>
                        <div className="gymup-home__panel-meta">{todayLabel}</div>
                      </div>

                      <div className="gymup-home__schedule">
                        {loadingReservations ? (
                          <div className="gymup-home__empty">今日の予約を読み込み中です...</div>
                        ) : todayReservations.length > 0 ? (
                          todayReservations.map((item) => (
                            <div key={item.id} className="gymup-home__schedule-item">
                              <div className="gymup-home__schedule-time">{item.time}</div>
                              <div>
                                <div className="gymup-home__schedule-name">{item.name}</div>
                                <div className="gymup-home__schedule-sub">
                                  {item.menu} / {item.staff}
                                  {item.store ? ` / ${item.store}` : ""}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="gymup-home__empty">
                            本日の予約はありません。
                            {reservationError ? `（${reservationError}）` : ""}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="gymup-home__panel-stack">
                      <div className="gymup-home__panel-small">
                        <div className="gymup-home__panel-title">Operations</div>
                        <div className="gymup-home__mini-grid">
                          <Link href="/reservation" className="gymup-home__mini-link">
                            予約管理
                          </Link>
                          <Link href="/sales" className="gymup-home__mini-link">
                            売上管理
                          </Link>
                          <Link href="/attendance" className="gymup-home__mini-link">
                            勤怠管理
                          </Link>
                          <Link href="/subscription" className="gymup-home__mini-link">
                            サブスク管理
                          </Link>
                        </div>
                      </div>

                      <div className="gymup-home__panel-small">
                        <div className="gymup-home__panel-title">System Notes</div>
                        <div className="gymup-home__alerts">
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>ロゴ画像が読めない時は文字ロゴへ自動切替</span>
                          </div>
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>今日の予約は実データを優先表示</span>
                          </div>
                          <div className="gymup-home__alert">
                            <span className="gymup-home__alert-dot" />
                            <span>スマホでも崩れにくい1カラム表示</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}