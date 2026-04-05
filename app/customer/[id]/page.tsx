"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { BG, CARD, BUTTON_PRIMARY } from "../../../styles/theme";

type Customer = {
  id: number | string;
  name?: string;
  kana?: string;
  gender?: string;
  age?: number | string;
  phone?: string;
  email?: string;
  height?: number | string;
  weight?: number | string;
  bodyFat?: number | string;
  muscleMass?: number | string;
  visceralFat?: number | string;
  goal?: string;
  memo?: string;
  notes?: string;
  note?: string;
  purpose?: string;
  target?: string;
  planType?: string;
  planStyle?: string;
  price?: number | string;
  monthlyCount?: number | string;
  usedCount?: number | string;
  carryOver?: number | string;
  remaining?: number | string;
  status?: string;
  nextPayment?: string;
  lastVisitDate?: string;
  ltv?: number | string;
  [key: string]: any;
};

type TrainingSetItem = {
  id: string;
  session_id?: string;
  exercise_name: string | null;
  weight: number | null;
  reps: number | null;
  sets: number | null;
  rpe: number | null;
  memo: string | null;
};

type TrainingHistoryItem = {
  id: string;
  date: string | null;
  weight: number | null;
  summary: string | null;
  next_task: string | null;
  template_name: string | null;
  posture_note: string | null;
  posture_image_urls?: string[] | null;
  created_at: string;
  training_sets?: TrainingSetItem[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default function CustomerDetailPage() {
  const params = useParams();
  const rawId = params?.id;

  const id = useMemo(() => {
    if (Array.isArray(rawId)) return String(rawId[0]);
    return String(rawId || "");
  }, [rawId]);

  const numericId = useMemo(() => {
    const n = Number(id);
    return Number.isNaN(n) ? null : n;
  }, [id]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [latestTrainingDate, setLatestTrainingDate] = useState("");
  const [latestTrainingWeight, setLatestTrainingWeight] = useState("");
  const [latestTrainingId, setLatestTrainingId] = useState("");
  const [loadingTrainingSummary, setLoadingTrainingSummary] = useState(false);
  const [recentTrainingHistory, setRecentTrainingHistory] = useState<
    TrainingHistoryItem[]
  >([]);

  useEffect(() => {
    setMounted(true);

    const loggedIn =
      localStorage.getItem("gymup_logged_in") ||
      localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }
  }, []);

  useEffect(() => {
    if (!mounted || !id) return;
    fetchCustomer();
  }, [mounted, id]);

  useEffect(() => {
    if (!mounted || !numericId) return;
    fetchTrainingSummaryAndHistory(numericId);
  }, [mounted, numericId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      let foundCustomer: Customer | null = null;

      if (supabase && numericId != null) {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", numericId)
          .maybeSingle();

        if (!error && data) {
          foundCustomer = data as Customer;
        }
      }

      if (!foundCustomer) {
        const detailRaw = localStorage.getItem(`customer-${id}`);
        if (detailRaw) {
          try {
            const parsed = JSON.parse(detailRaw);
            foundCustomer = {
              id,
              ...parsed,
            };
          } catch {}
        }
      }

      if (!foundCustomer) {
        const customersRaw = localStorage.getItem("customers");
        if (customersRaw) {
          try {
            const parsed = JSON.parse(customersRaw);
            if (Array.isArray(parsed)) {
              const matched = parsed.find(
                (item: any) =>
                  String(item?.id) === String(id) ||
                  String(item?.customerId) === String(id)
              );
              if (matched) {
                foundCustomer = matched;
              }
            }
          } catch {}
        }
      }

      if (!foundCustomer) {
        setErrorMessage("顧客情報が見つかりませんでした。");
        setCustomer(null);
        return;
      }

      setCustomer(foundCustomer);
    } catch (error: any) {
      setErrorMessage(error?.message || "顧客情報の取得に失敗しました。");
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingSummaryAndHistory = async (customerId: number) => {
    if (!supabase) return;

    try {
      setLoadingTrainingSummary(true);

      const { data: sessions, error: sessionError } = await supabase
        .from("training_sessions")
        .select(
          "id, date, weight, summary, next_task, template_name, posture_note, posture_image_urls, created_at"
        )
        .eq("customer_id", customerId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);

      if (sessionError) throw sessionError;

      const sessionRows = (sessions || []) as TrainingHistoryItem[];
      const sessionIds = sessionRows.map((item) => item.id);

      let setsMap: Record<string, TrainingSetItem[]> = {};

      if (sessionIds.length > 0) {
        const { data: setsData, error: setsError } = await supabase
          .from("training_sets")
          .select("id, session_id, exercise_name, weight, reps, sets, rpe, memo")
          .in("session_id", sessionIds)
          .order("created_at", { ascending: true });

        if (setsError) throw setsError;

        setsMap = (setsData || []).reduce(
          (acc: Record<string, TrainingSetItem[]>, item: any) => {
            const key = item.session_id;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item as TrainingSetItem);
            return acc;
          },
          {}
        );
      }

      const rows = sessionRows.map((item) => ({
        ...item,
        training_sets: setsMap[item.id] || [],
      }));

      const latest = rows[0];
      setLatestTrainingId(latest?.id ? String(latest.id) : "");
      setLatestTrainingDate(latest?.date ? String(latest.date) : "");
      setLatestTrainingWeight(
        latest?.weight != null ? `${latest.weight}kg` : ""
      );
      setRecentTrainingHistory(rows);
    } catch (e) {
      console.error("トレーニング情報取得失敗:", e);
      setRecentTrainingHistory([]);
    } finally {
      setLoadingTrainingSummary(false);
    }
  };

  const displayName =
    customer?.name ||
    customer?.customer_name ||
    customer?.full_name ||
    customer?.nickname ||
    "顧客名未設定";

  const displayGoal = customer?.goal || customer?.purpose || customer?.target || "";
  const displayMemo = customer?.memo || customer?.notes || customer?.note || "";

  if (!mounted) return null;

  return (
    <main style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.glowC} />

      <div style={styles.container}>
        <div style={styles.headerBar}>
          <Link href="/customer" style={styles.backLink}>
            ← 顧客一覧へ戻る
          </Link>
        </div>

        <section
          style={{
            ...CARD,
            ...styles.heroCard,
          }}
        >
          <div style={styles.heroShine} />
          <div style={styles.eyebrow}>CUSTOMER DETAIL</div>
          <h1 style={styles.name}>{displayName}</h1>
          <p style={styles.sub}>顧客ID: {id || "-"}</p>
        </section>

        {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

        {loading ? (
          <div style={{ ...CARD, padding: "24px", color: "#64748b" }}>
            読み込み中...
          </div>
        ) : customer ? (
          <>
            <div style={styles.mainGrid}>
              <section style={{ ...CARD, padding: "24px" }}>
                <h2 style={styles.sectionTitle}>顧客情報</h2>

                <div style={styles.infoGrid}>
                  <InfoCard label="氏名" value={displayName} />
                  <InfoCard label="フリガナ" value={customer.kana} />
                  <InfoCard label="性別" value={customer.gender} />
                  <InfoCard label="年齢" value={customer.age} />
                  <InfoCard label="電話番号" value={customer.phone} />
                  <InfoCard label="メール" value={customer.email} />
                  <InfoCard label="身長" value={withUnit(customer.height, "cm")} />
                  <InfoCard label="現在体重" value={withUnit(customer.weight, "kg")} />
                  <InfoCard label="体脂肪率" value={withUnit(customer.bodyFat, "%")} />
                  <InfoCard label="筋肉量" value={withUnit(customer.muscleMass, "kg")} />
                  <InfoCard label="内臓脂肪" value={customer.visceralFat} />
                  <InfoCard label="最終来店日" value={customer.lastVisitDate} />
                  <InfoCard label="LTV" value={yen(customer.ltv)} />
                </div>

                <div style={{ marginTop: 18 }}>
                  <MiniLabel>目標・目的</MiniLabel>
                  <MemoBox>{displayGoal || "未設定"}</MemoBox>
                </div>

                <div style={{ marginTop: 14 }}>
                  <MiniLabel>メモ</MiniLabel>
                  <MemoBox>{displayMemo || "未設定"}</MemoBox>
                </div>
              </section>

              <section style={{ ...CARD, padding: "24px" }}>
                <h2 style={styles.sectionTitle}>契約・利用状況</h2>

                <div style={styles.infoGrid}>
                  <InfoCard label="プラン種別" value={customer.planType} />
                  <InfoCard label="利用形態" value={customer.planStyle} />
                  <InfoCard label="月額料金" value={yen(customer.price)} />
                  <InfoCard label="月回数" value={customer.monthlyCount} />
                  <InfoCard label="使用回数" value={customer.usedCount} />
                  <InfoCard label="繰越" value={customer.carryOver} />
                  <InfoCard label="残回数" value={customer.remaining} />
                  <InfoCard label="契約状態" value={customer.status} />
                  <InfoCard label="次回支払日" value={customer.nextPayment} />
                </div>
              </section>
            </div>

            <section style={{ ...CARD, padding: "24px", marginTop: "20px" }}>
              <h2 style={styles.sectionTitle}>トレーニングサマリー</h2>

              <div style={styles.infoGrid}>
                <InfoCard
                  label="前回トレーニング日"
                  value={
                    loadingTrainingSummary ? "読込中..." : latestTrainingDate || "未登録"
                  }
                />
                <InfoCard
                  label="最終体重"
                  value={
                    loadingTrainingSummary ? "読込中..." : latestTrainingWeight || "未登録"
                  }
                />
                <InfoCard
                  label="履歴件数"
                  value={
                    loadingTrainingSummary ? "読込中..." : recentTrainingHistory.length || 0
                  }
                />
              </div>

              <div style={styles.actionGrid}>
                <Link href={`/customer/${id}/training`} style={styles.linkReset}>
                  <button
                    style={{
                      ...BUTTON_PRIMARY,
                      padding: "14px 18px",
                      width: "100%",
                      boxShadow: "0 10px 20px rgba(139,94,60,0.22)",
                    }}
                  >
                    トレーニング開始
                  </button>
                </Link>

                <Link href={`/customer/${id}/training`} style={styles.linkReset}>
                  <button style={styles.whiteButton}>履歴を見る</button>
                </Link>

                <Link
                  href={
                    latestTrainingId
                      ? `/customer/${id}/training?copy=${latestTrainingId}`
                      : `/customer/${id}/training`
                  }
                  style={styles.linkReset}
                >
                  <button style={styles.softButton}>履歴からコピーして開始</button>
                </Link>
              </div>
            </section>

            <section style={{ ...CARD, padding: "24px", marginTop: "20px" }}>
              <h2 style={styles.sectionTitle}>最近のトレーニング履歴からコピー</h2>

              {loadingTrainingSummary ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>読み込み中...</div>
              ) : recentTrainingHistory.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>
                  まだトレーニング履歴はありません。
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {recentTrainingHistory.map((item) => (
                    <div key={item.id} style={styles.historyCard}>
                      <div style={styles.historyTop}>
                        <div>
                          <div style={styles.historyDate}>
                            {item.date || "日付未設定"}
                          </div>
                          <div style={styles.historyMeta}>
                            体重: {item.weight != null ? `${item.weight}kg` : "-"}
                            {item.template_name ? ` / テンプレ: ${item.template_name}` : ""}
                          </div>
                        </div>

                        <Link
                          href={`/customer/${id}/training?copy=${item.id}`}
                          style={styles.linkReset}
                        >
                          <button
                            style={{
                              ...BUTTON_PRIMARY,
                              padding: "10px 14px",
                              boxShadow: "0 10px 20px rgba(139,94,60,0.18)",
                            }}
                          >
                            この履歴をコピー
                          </button>
                        </Link>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <MiniLabel>種目一覧</MiniLabel>
                        {item.training_sets && item.training_sets.length > 0 ? (
                          <div style={styles.trainingSetList}>
                            {item.training_sets.map((set) => (
                              <div key={set.id} style={styles.trainingSetItem}>
                                <div style={styles.trainingSetName}>
                                  {set.exercise_name || "種目未設定"}
                                </div>
                                <div style={styles.trainingSetMeta}>
                                  重量: {set.weight ?? "-"} / 回数: {set.reps ?? "-"} / セット:{" "}
                                  {set.sets ?? "-"} / RPE: {set.rpe ?? "-"}
                                </div>
                                {set.memo ? (
                                  <div style={styles.trainingSetMemo}>メモ: {set.memo}</div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <MemoBox compact>種目データなし</MemoBox>
                        )}
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <MiniLabel>総評</MiniLabel>
                        <MemoBox compact>{item.summary || "未設定"}</MemoBox>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <MiniLabel>次回課題</MiniLabel>
                        <MemoBox compact>{item.next_task || "未設定"}</MemoBox>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <MiniLabel>姿勢メモ</MiniLabel>
                        <MemoBox compact>{item.posture_note || "未設定"}</MemoBox>
                      </div>

                      {item.posture_image_urls && item.posture_image_urls.length > 0 ? (
                        <div style={{ marginTop: 12 }}>
                          <MiniLabel>姿勢画像</MiniLabel>
                          <div style={styles.imageGrid}>
                            {item.posture_image_urls.map((url, idx) => (
                              <a
                                key={`${item.id}-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.imageLink}
                              >
                                <img src={url} alt="姿勢画像" style={styles.postureImage} />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return <div style={styles.miniLabel}>{children}</div>;
}

function MemoBox({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.memoBox,
        minHeight: compact ? 40 : 52,
        padding: compact ? 10 : 12,
      }}
    >
      {children}
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value || "未設定"}</div>
    </div>
  );
}

function withUnit(value: any, unit: string) {
  if (value === null || value === undefined || value === "") return "";
  return `${value}${unit}`;
}

function yen(value: any) {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `¥${num.toLocaleString()}`;
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    padding: "24px 20px 60px",
    background: BG,
  },
  glowA: {
    position: "absolute",
    top: "-90px",
    left: "-70px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.95)",
    filter: "blur(55px)",
    pointerEvents: "none",
  },
  glowB: {
    position: "absolute",
    top: "120px",
    right: "-60px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.85)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },
  glowC: {
    position: "absolute",
    bottom: "-120px",
    left: "18%",
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    background: "rgba(203,213,225,0.35)",
    filter: "blur(75px)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1180px",
    margin: "0 auto",
  },
  headerBar: {
    marginBottom: "16px",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 700,
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    padding: "28px 24px",
    borderRadius: "28px",
    marginBottom: "20px",
  },
  heroShine: {
    position: "absolute",
    top: 0,
    left: "-20%",
    width: "60%",
    height: "2px",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 35%, rgba(245,158,11,0.45) 52%, rgba(255,255,255,0.9) 70%, transparent 100%)",
    transform: "skewX(-28deg)",
  },
  eyebrow: {
    marginBottom: "10px",
    fontSize: "11px",
    letterSpacing: "0.22em",
    color: "#94a3b8",
    fontWeight: 700,
  },
  name: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },
  sub: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#64748b",
    fontSize: 14,
  },
  errorBox: {
    marginBottom: 16,
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 20,
  },
  sectionTitle: {
    margin: 0,
    marginBottom: 14,
    fontSize: 20,
    color: "#0f172a",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  infoCard: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 14,
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  infoLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  miniLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: 6,
    letterSpacing: "0.08em",
  },
  memoBox: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.95)",
    borderRadius: 14,
    color: "#475569",
    fontSize: 14,
    whiteSpace: "pre-wrap",
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 16,
  },
  linkReset: {
    textDecoration: "none",
  },
  whiteButton: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.95)",
    background: "rgba(255,255,255,0.82)",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  softButton: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid rgba(214,195,179,0.8)",
    background: "rgba(255,255,255,0.6)",
    color: "#8b5e3c",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.96)",
  },
  historyCard: {
    border: "1px solid rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.68)",
    boxShadow:
      "0 14px 30px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  historyTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  historyDate: {
    fontSize: 17,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 6,
  },
  historyMeta: {
    fontSize: 13,
    color: "#64748b",
  },
  trainingSetList: {
    display: "grid",
    gap: 10,
  },
  trainingSetItem: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 12,
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  trainingSetName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
  },
  trainingSetMeta: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
  },
  trainingSetMemo: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  },
  imageLink: {
    display: "block",
    textDecoration: "none",
  },
  postureImage: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.95)",
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
    background: "#fff",
  },
};