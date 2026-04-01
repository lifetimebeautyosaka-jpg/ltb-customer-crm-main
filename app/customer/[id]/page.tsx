"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Customer = {
  id: string | number;
  name: string;
  goal?: string;
  sessions?: number;
  phone?: string;
  plan?: string;
};

type Sale = {
  id?: string | number;
  date?: string;
  customerId?: string | number;
  customerName?: string;
  menuName?: string;
  staff?: string;
  totalAmount?: number;
};

type TrainingHistory = {
  id: string;
  date: string;
  menu: string;
  memo: string;
};

type BodyRecord = {
  id: string;
  date: string;
  height: string;
  weight: string;
  bodyFat: string;
  muscleMass: string;
  visceralFat: string;
};

type CustomerSubscription = {
  planType: "月2回" | "月4回" | "無制限";
  planStyle: "マンツーマン" | "ペア";
  price: number;
  monthlyCount: number;
  usedCount: number;
  carryOver: number;
  remaining: number;
  status: "有効" | "停止";
  nextPayment: string;
  isUnlimited: boolean;
};

type TicketHistory = {
  id: string;
  date: string;
  staff: string;
  memo: string;
};

type CustomerTicket = {
  name: string;
  total: number;
  used: number;
  remaining: number;
  expiryDate: string;
  status: "有効" | "停止" | "終了";
  history: TicketHistory[];
};

type CustomerDetail = {
  memo: string;
  lastVisit: string;
  bodyRecords: BodyRecord[];
  trainingHistory: TrainingHistory[];
  subscription: CustomerSubscription;
  ticket: CustomerTicket;
};

const glassCardClass =
  "relative overflow-hidden rounded-[30px] border border-white/35 bg-white/40 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.10)] backdrop-blur-2xl";

const glassCardLgClass =
  "relative overflow-hidden rounded-[34px] border border-white/35 bg-white/40 p-8 shadow-[0_28px_80px_rgba(0,0,0,0.12)] backdrop-blur-2xl";

const glassInnerClass =
  "rounded-2xl border border-white/35 bg-white/35 px-4 py-4 backdrop-blur-xl";

const glassInputClass =
  "w-full rounded-2xl border border-white/45 bg-white/45 px-4 py-3 text-gray-900 outline-none backdrop-blur-xl placeholder:text-gray-400";

const darkButtonClass =
  "rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-black";

const redButtonClass =
  "rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(239,68,68,0.25)] transition hover:bg-red-600";

const lightButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-white/45 bg-white/30 px-4 py-2.5 text-sm font-semibold text-gray-800 backdrop-blur-xl transition hover:bg-white/45";

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateJP(dateString: string) {
  if (!dateString) return "-";
  return dateString.replaceAll("-", "/");
}

function defaultSubscription(): CustomerSubscription {
  return {
    planType: "月2回",
    planStyle: "マンツーマン",
    price: 17600,
    monthlyCount: 2,
    usedCount: 0,
    carryOver: 0,
    remaining: 2,
    status: "有効",
    nextPayment: getTodayString(),
    isUnlimited: false,
  };
}

function defaultTicket(): CustomerTicket {
  return {
    name: "10回券",
    total: 10,
    used: 0,
    remaining: 10,
    expiryDate: "",
    status: "有効",
    history: [],
  };
}

function calcRemaining(sub: CustomerSubscription) {
  if (sub.planType === "無制限") return 999;
  return Math.max(0, sub.monthlyCount + sub.carryOver - sub.usedCount);
}

function calcTicketRemaining(ticket: Pick<CustomerTicket, "total" | "used">) {
  return Math.max(0, Number(ticket.total || 0) - Number(ticket.used || 0));
}

function planPrice(
  type: CustomerSubscription["planType"],
  style: CustomerSubscription["planStyle"]
) {
  if (type === "月2回" && style === "マンツーマン") return 17600;
  if (type === "月2回" && style === "ペア") return 12320;
  if (type === "月4回" && style === "マンツーマン") return 33880;
  if (type === "月4回" && style === "ペア") return 23716;
  if (type === "無制限" && style === "マンツーマン") return 41250;
  return 29172;
}

function monthlyCount(type: CustomerSubscription["planType"]) {
  if (type === "月2回") return 2;
  if (type === "月4回") return 4;
  return 999;
}

function normalizeSubscription(
  sub?: Partial<CustomerSubscription>
): CustomerSubscription {
  const base = defaultSubscription();
  const merged = { ...base, ...sub };
  const isUnlimited = merged.planType === "無制限";
  const next: CustomerSubscription = {
    ...merged,
    isUnlimited,
    monthlyCount: monthlyCount(merged.planType),
    price: planPrice(merged.planType, merged.planStyle),
    carryOver: isUnlimited ? 0 : Math.max(0, merged.carryOver ?? 0),
    usedCount: Math.max(0, merged.usedCount ?? 0),
    nextPayment: merged.nextPayment || getTodayString(),
  };
  return {
    ...next,
    remaining: calcRemaining(next),
  };
}

function normalizeTicket(ticket?: Partial<CustomerTicket>): CustomerTicket {
  const base = defaultTicket();
  const merged = { ...base, ...ticket };
  const total = Math.max(0, Number(merged.total || 0));
  const used = Math.max(0, Number(merged.used || 0));
  const remaining = calcTicketRemaining({ total, used });

  let status = merged.status || "有効";
  if (remaining <= 0 && status === "有効") {
    status = "終了";
  }

  return {
    ...merged,
    total,
    used,
    remaining,
    status,
    expiryDate: merged.expiryDate || "",
    history: Array.isArray(merged.history) ? merged.history : [],
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={glassInnerClass}>
      <div className="mb-1 text-sm text-gray-500">{title}</div>
      <div className="text-base font-semibold text-gray-900">{children}</div>
    </div>
  );
}

function StatBox({ title, value }: { title: string; value: string }) {
  return (
    <div className={glassInnerClass}>
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}

function MetricMini({ title, value }: { title: string; value: string }) {
  return (
    <div className={glassInnerClass}>
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}

function SimpleLineChart({
  data,
  title,
  unit,
}: {
  data: { date: string; value: number }[];
  title: string;
  unit: string;
}) {
  if (data.length === 0) {
    return (
      <div className={glassInnerClass}>
        <div className="text-sm text-gray-600">{title} のデータがありません</div>
      </div>
    );
  }

  const width = 520;
  const height = 220;
  const padding = 32;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x =
      padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y =
      height - padding - ((d.value - min) / range) * (height - padding * 2);
    return { x, y, ...d };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/35 bg-white/45 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {data[data.length - 1].value}
            {unit}
          </p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[220px] w-full"
        preserveAspectRatio="none"
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <path d={path} fill="none" stroke="black" strokeWidth="3" />
        {points.map((p, index) => (
          <g key={`${p.date}-${index}`}>
            <circle cx={p.x} cy={p.y} r="4" fill="black" />
            <text
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? "");

  const [isLoaded, setIsLoaded] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [detail, setDetail] = useState<CustomerDetail>({
    memo: "",
    lastVisit: "",
    bodyRecords: [],
    trainingHistory: [],
    subscription: defaultSubscription(),
    ticket: defaultTicket(),
  });
  const [sales, setSales] = useState<Sale[]>([]);
  const [ticketMemo, setTicketMemo] = useState("");
  const [ticketStaff, setTicketStaff] = useState("山口");

  const [newBodyRecord, setNewBodyRecord] = useState<BodyRecord>({
    id: "",
    date: getTodayString(),
    height: "",
    weight: "",
    bodyFat: "",
    muscleMass: "",
    visceralFat: "",
  });

  useEffect(() => {
    if (!id) return;

    const loggedIn = localStorage.getItem("gymup_logged_in");
    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }

    try {
      const savedCustomers =
        localStorage.getItem("gymup_customers") ||
        localStorage.getItem("customers") ||
        "[]";
      const parsedCustomers = JSON.parse(savedCustomers);
      setCustomers(Array.isArray(parsedCustomers) ? parsedCustomers : []);
    } catch {
      setCustomers([]);
    }

    try {
      const savedDetail = localStorage.getItem(`customer-${id}`);
      if (savedDetail) {
        const parsed = JSON.parse(savedDetail);
        setDetail({
          memo: parsed?.memo || "",
          lastVisit: parsed?.lastVisit || "",
          bodyRecords: Array.isArray(parsed?.bodyRecords) ? parsed.bodyRecords : [],
          trainingHistory: Array.isArray(parsed?.trainingHistory)
            ? parsed.trainingHistory
            : [],
          subscription: normalizeSubscription(parsed?.subscription),
          ticket: normalizeTicket(parsed?.ticket),
        });
      } else {
        setDetail({
          memo: "",
          lastVisit: "",
          bodyRecords: [],
          trainingHistory: [],
          subscription: defaultSubscription(),
          ticket: defaultTicket(),
        });
      }
    } catch {
      setDetail({
        memo: "",
        lastVisit: "",
        bodyRecords: [],
        trainingHistory: [],
        subscription: defaultSubscription(),
        ticket: defaultTicket(),
      });
    }

    try {
      const savedSales =
        localStorage.getItem("gymup_sales") ||
        localStorage.getItem("sales") ||
        "[]";
      const parsedSales = JSON.parse(savedSales);
      setSales(Array.isArray(parsedSales) ? parsedSales : []);
    } catch {
      setSales([]);
    }

    setIsLoaded(true);
  }, [id, router]);

  useEffect(() => {
    if (!isLoaded || !id) return;
    localStorage.setItem(`customer-${id}`, JSON.stringify(detail));
  }, [detail, id, isLoaded]);

  const customer = useMemo(() => {
    return customers.find((c) => String(c.id) === String(id));
  }, [customers, id]);

  const customerSales = useMemo(() => {
    return sales
      .filter((sale) => String(sale.customerId) === String(id))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }, [sales, id]);

  const salesStats = useMemo(() => {
    const ltv = customerSales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount || 0),
      0
    );

    const visitCount = new Set(
      customerSales.map((sale) => String(sale.date || "").slice(0, 10))
    ).size;

    const lastVisitAt =
      customerSales.length > 0 ? String(customerSales[0].date || "") : detail.lastVisit || "";

    return {
      ltv,
      visitCount,
      lastVisitAt,
    };
  }, [customerSales, detail.lastVisit]);

  const sortedBodyRecords = useMemo(() => {
    return [...detail.bodyRecords].sort((a, b) => b.date.localeCompare(a.date));
  }, [detail.bodyRecords]);

  const latestBodyRecord = useMemo(() => {
    const asc = [...detail.bodyRecords].sort((a, b) => a.date.localeCompare(b.date));
    return asc[asc.length - 1] ?? null;
  }, [detail.bodyRecords]);

  const sortedTicketHistory = useMemo(() => {
    return [...detail.ticket.history].sort((a, b) => b.date.localeCompare(a.date));
  }, [detail.ticket.history]);

  const chartPoints = (key: keyof BodyRecord) =>
    [...detail.bodyRecords]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        date: r.date,
        value: Number(r[key] || 0),
      }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0);

  const addBodyRecord = () => {
    if (!newBodyRecord.date) {
      alert("日付を入力してください");
      return;
    }

    setDetail((prev) => ({
      ...prev,
      bodyRecords: [
        { ...newBodyRecord, id: String(Date.now()) },
        ...prev.bodyRecords,
      ].sort((a, b) => b.date.localeCompare(a.date)),
    }));

    setNewBodyRecord({
      id: "",
      date: getTodayString(),
      height: latestBodyRecord?.height || "",
      weight: "",
      bodyFat: "",
      muscleMass: "",
      visceralFat: "",
    });
  };

  const deleteBodyRecord = (recordId: string) => {
    if (!window.confirm("この体組成記録を削除しますか？")) return;
    setDetail((prev) => ({
      ...prev,
      bodyRecords: prev.bodyRecords.filter((r) => r.id !== recordId),
    }));
  };

  const addTrainingHistory = () => {
    setDetail((prev) => ({
      ...prev,
      trainingHistory: [
        {
          id: String(Date.now()),
          date: getTodayString(),
          menu: "",
          memo: "",
        },
        ...prev.trainingHistory,
      ],
    }));
  };

  const updateTrainingHistory = (
    targetId: string,
    key: keyof TrainingHistory,
    value: string
  ) => {
    setDetail((prev) => ({
      ...prev,
      trainingHistory: prev.trainingHistory.map((item) =>
        item.id === targetId ? { ...item, [key]: value } : item
      ),
    }));
  };

  const deleteTrainingHistory = (targetId: string) => {
    if (!window.confirm("この履歴を削除しますか？")) return;
    setDetail((prev) => ({
      ...prev,
      trainingHistory: prev.trainingHistory.filter((item) => item.id !== targetId),
    }));
  };

  const updateSubscription = <K extends keyof CustomerSubscription>(
    key: K,
    value: CustomerSubscription[K]
  ) => {
    setDetail((prev) => {
      const next = normalizeSubscription({
        ...prev.subscription,
        [key]: value,
      });
      return { ...prev, subscription: next };
    });
  };

  const saveSubscription = () => {
    setDetail((prev) => ({
      ...prev,
      subscription: normalizeSubscription(prev.subscription),
    }));
    alert("サブスク情報を保存しました");
  };

  const consumeSubscription = () => {
    const sub = normalizeSubscription(detail.subscription);
    if (sub.status === "停止") {
      alert("停止中のプランは消化できません");
      return;
    }
    if (!sub.isUnlimited && sub.remaining <= 0) {
      alert("残回数がありません");
      return;
    }

    const next = normalizeSubscription({
      ...sub,
      usedCount: sub.usedCount + 1,
    });

    setDetail((prev) => ({
      ...prev,
      subscription: next,
      lastVisit: getTodayString(),
    }));
  };

  const updateTicket = <K extends keyof CustomerTicket>(
    key: K,
    value: CustomerTicket[K]
  ) => {
    setDetail((prev) => ({
      ...prev,
      ticket: normalizeTicket({
        ...prev.ticket,
        [key]: value,
      }),
    }));
  };

  const saveTicket = () => {
    setDetail((prev) => ({
      ...prev,
      ticket: normalizeTicket(prev.ticket),
    }));
    alert("回数券情報を保存しました");
  };

  const consumeTicket = () => {
    const ticket = normalizeTicket(detail.ticket);

    if (ticket.status === "停止") {
      alert("停止中の回数券は消化できません");
      return;
    }

    if (ticket.remaining <= 0) {
      alert("残回数がありません");
      return;
    }

    const historyItem: TicketHistory = {
      id: String(Date.now()),
      date: getTodayString(),
      staff: ticketStaff || "山口",
      memo: ticketMemo || "",
    };

    const nextTicket = normalizeTicket({
      ...ticket,
      used: ticket.used + 1,
      history: [...ticket.history, historyItem],
    });

    setDetail((prev) => ({
      ...prev,
      ticket: nextTicket,
      lastVisit: getTodayString(),
    }));

    setTicketMemo("");
    alert("回数券を1回消化しました");
  };

  const deleteTicketHistory = (historyId: string) => {
    if (!window.confirm("この回数券履歴を削除しますか？")) return;
    setDetail((prev) => ({
      ...prev,
      ticket: normalizeTicket({
        ...prev.ticket,
        history: prev.ticket.history.filter((item) => item.id !== historyId),
      }),
    }));
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#d1d5db] text-gray-700">
        読み込み中...
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#e5e7eb_0%,#d1d5db_42%,#9ca3af_100%)] text-gray-900">
        <div className="relative flex min-h-screen items-center justify-center px-6">
          <div className={glassCardLgClass}>
            <div className="relative text-center">
              <p className="text-2xl font-bold text-gray-900">顧客が見つかりません</p>
              <p className="mt-3 text-sm text-gray-600">ID: {id}</p>
              <Link href="/customer" className={`${lightButtonClass} mt-6`}>
                顧客一覧へ戻る
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#e5e7eb_0%,#d1d5db_42%,#9ca3af_100%)] text-gray-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 -left-36 h-[560px] w-[560px] rounded-full bg-white/70 blur-[140px]" />
        <div className="absolute bottom-[-140px] right-[-80px] h-[460px] w-[460px] rounded-full bg-white/50 blur-[120px]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 1px, transparent 24px)",
        }}
      />

      <header className="relative border-b border-white/35 bg-white/35 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img
              src="/gymup-logo.png"
              alt="GYMUP"
              className="h-11 w-auto object-contain"
            />
            <div>
              <div className="text-lg font-bold tracking-[0.08em] text-gray-900">
                GYMUP CRM
              </div>
              <div className="text-xs text-gray-600">顧客詳細</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/customer" className={lightButtonClass}>
              顧客一覧へ戻る
            </Link>

            <Link href={`/customer/${id}/meal`} className={darkButtonClass}>
              食事管理
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl p-6 md:p-10">
        <section className={`${glassCardLgClass} mb-8`}>
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-600 backdrop-blur-xl">
                <span className="inline-block h-2 w-2 rounded-full bg-black/70" />
                Customer Detail
              </div>

              <h1 className="text-3xl font-bold text-gray-900 md:text-5xl">
                {customer.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-700 md:text-base">
                目的：{customer.goal || "-"} / 最終来店：{formatDateJP(detail.lastVisit)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatBox title="LTV" value={formatCurrency(salesStats.ltv)} />
              <StatBox title="来店回数" value={`${salesStats.visitCount}回`} />
              <StatBox title="残回数券" value={`${detail.ticket.remaining}回`} />
              <StatBox title="最終来店" value={formatDateJP(salesStats.lastVisitAt)} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className={`${glassCardClass} lg:col-span-1`}>
            <h2 className="text-2xl font-bold text-gray-900">基本情報</h2>

            <div className="mt-5 space-y-4">
              <InfoBlock title="名前">{customer.name}</InfoBlock>
              <InfoBlock title="目的">{customer.goal || "-"}</InfoBlock>
              <InfoBlock title="電話">{customer.phone || "-"}</InfoBlock>
              <InfoBlock title="プラン">{customer.plan || "-"}</InfoBlock>
              <InfoBlock title="回数券残">{detail.ticket.remaining}回</InfoBlock>

              <Field label="最終来店日">
                <input
                  type="date"
                  value={detail.lastVisit ?? ""}
                  onChange={(e) =>
                    setDetail({ ...detail, lastVisit: e.target.value })
                  }
                  className={glassInputClass}
                />
              </Field>
            </div>
          </section>

          <section className={`${glassCardClass} lg:col-span-2`}>
            <h2 className="text-2xl font-bold text-gray-900">最新の体組成</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-5">
              <MetricMini title="身長" value={latestBodyRecord?.height || "-"} />
              <MetricMini title="体重" value={latestBodyRecord?.weight || "-"} />
              <MetricMini title="体脂肪" value={latestBodyRecord?.bodyFat || "-"} />
              <MetricMini title="筋肉量" value={latestBodyRecord?.muscleMass || "-"} />
              <MetricMini title="内臓脂肪" value={latestBodyRecord?.visceralFat || "-"} />
            </div>

            <div className="mt-4">
              <Field label="メモ">
                <textarea
                  value={detail.memo}
                  onChange={(e) =>
                    setDetail({ ...detail, memo: e.target.value })
                  }
                  rows={4}
                  className={glassInputClass}
                />
              </Field>
            </div>
          </section>
        </div>

        <section className={`${glassCardClass} mt-8`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold text-gray-900">回数券管理</h2>
            <div className="flex gap-3">
              <button onClick={consumeTicket} className={darkButtonClass}>
                1回消化
              </button>
              <button onClick={saveTicket} className={lightButtonClass}>
                保存
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Field label="回数券名">
              <input
                value={detail.ticket.name}
                onChange={(e) => updateTicket("name", e.target.value)}
                className={glassInputClass}
                placeholder="10回券"
              />
            </Field>

            <Field label="総回数">
              <input
                type="number"
                value={detail.ticket.total}
                onChange={(e) => updateTicket("total", Number(e.target.value) || 0)}
                className={glassInputClass}
              />
            </Field>

            <Field label="使用回数">
              <input
                type="number"
                value={detail.ticket.used}
                onChange={(e) => updateTicket("used", Number(e.target.value) || 0)}
                className={glassInputClass}
              />
            </Field>

            <Field label="有効期限">
              <input
                type="date"
                value={detail.ticket.expiryDate}
                onChange={(e) => updateTicket("expiryDate", e.target.value)}
                className={glassInputClass}
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Field label="状態">
              <select
                value={detail.ticket.status}
                onChange={(e) =>
                  updateTicket("status", e.target.value as CustomerTicket["status"])
                }
                className={glassInputClass}
              >
                <option value="有効">有効</option>
                <option value="停止">停止</option>
                <option value="終了">終了</option>
              </select>
            </Field>

            <Field label="担当スタッフ">
              <input
                value={ticketStaff}
                onChange={(e) => setTicketStaff(e.target.value)}
                className={glassInputClass}
                placeholder="山口"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="消化メモ">
                <input
                  value={ticketMemo}
                  onChange={(e) => setTicketMemo(e.target.value)}
                  className={glassInputClass}
                  placeholder="来店処理 / 予約連動 など"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <MetricMini title="総回数" value={String(detail.ticket.total)} />
            <MetricMini title="使用回数" value={String(detail.ticket.used)} />
            <MetricMini title="残回数" value={String(detail.ticket.remaining)} />
            <MetricMini title="状態" value={detail.ticket.status} />
            <MetricMini
              title="有効期限"
              value={detail.ticket.expiryDate ? formatDateJP(detail.ticket.expiryDate) : "-"}
            />
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-lg font-bold text-gray-900">回数券消化履歴</h3>
            <div className="space-y-3">
              {sortedTicketHistory.length === 0 ? (
                <div className={glassInnerClass}>まだ消化履歴がありません。</div>
              ) : (
                sortedTicketHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`${glassInnerClass} flex flex-col gap-3 md:flex-row md:items-center md:justify-between`}
                  >
                    <div className="grid gap-1 text-sm text-gray-700 md:grid-cols-3 md:gap-4">
                      <span>{formatDateJP(item.date)}</span>
                      <span>担当：{item.staff || "-"}</span>
                      <span>メモ：{item.memo || "-"}</span>
                    </div>

                    <button
                      onClick={() => deleteTicketHistory(item.id)}
                      className={redButtonClass}
                    >
                      削除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className={`${glassCardClass} mt-8`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">サブスク管理</h2>
            <div className="flex gap-3">
              <button onClick={consumeSubscription} className={darkButtonClass}>
                1回消化
              </button>
              <button onClick={saveSubscription} className={lightButtonClass}>
                保存
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Field label="プラン種別">
              <select
                value={detail.subscription.planType}
                onChange={(e) =>
                  updateSubscription("planType", e.target.value as CustomerSubscription["planType"])
                }
                className={glassInputClass}
              >
                <option value="月2回">月2回</option>
                <option value="月4回">月4回</option>
                <option value="無制限">無制限</option>
              </select>
            </Field>

            <Field label="スタイル">
              <select
                value={detail.subscription.planStyle}
                onChange={(e) =>
                  updateSubscription("planStyle", e.target.value as CustomerSubscription["planStyle"])
                }
                className={glassInputClass}
              >
                <option value="マンツーマン">マンツーマン</option>
                <option value="ペア">ペア</option>
              </select>
            </Field>

            <Field label="次回支払日">
              <input
                type="date"
                value={detail.subscription.nextPayment}
                onChange={(e) => updateSubscription("nextPayment", e.target.value)}
                className={glassInputClass}
              />
            </Field>

            <Field label="状態">
              <select
                value={detail.subscription.status}
                onChange={(e) =>
                  updateSubscription("status", e.target.value as CustomerSubscription["status"])
                }
                className={glassInputClass}
              >
                <option value="有効">有効</option>
                <option value="停止">停止</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <MetricMini title="月額" value={formatCurrency(detail.subscription.price)} />
            <MetricMini title="月回数" value={String(detail.subscription.monthlyCount)} />
            <MetricMini title="使用回数" value={String(detail.subscription.usedCount)} />
            <MetricMini title="繰越" value={String(detail.subscription.carryOver)} />
            <MetricMini title="残回数" value={String(detail.subscription.remaining)} />
          </div>
        </section>

        <section className={`${glassCardClass} mt-8`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold text-gray-900">体組成を追加</h2>
            <button onClick={addBodyRecord} className={darkButtonClass}>
              体組成を保存
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-6">
            <input type="date" value={newBodyRecord.date} onChange={(e) => setNewBodyRecord({ ...newBodyRecord, date: e.target.value })} className={glassInputClass} />
            <input value={newBodyRecord.height} onChange={(e) => setNewBodyRecord({ ...newBodyRecord, height: e.target.value })} placeholder="身長" className={glassInputClass} />
            <input value={newBodyRecord.weight} onChange={(e) => setNewBodyRecord({ ...newBodyRecord, weight: e.target.value })} placeholder="体重" className={glassInputClass} />
            <input value={newBodyRecord.bodyFat} onChange={(e) => setNewBodyRecord({ ...newBodyRecord, bodyFat: e.target.value })} placeholder="体脂肪" className={glassInputClass} />
            <input value={newBodyRecord.muscleMass} onChange={(e) => setNewBodyRecord({ ...newBodyRecord, muscleMass: e.target.value })} placeholder="筋肉量" className={glassInputClass} />
            <input value={newBodyRecord.visceralFat} onChange={(e) => setNewBodyRecord({ ...newBodyRecord, visceralFat: e.target.value })} placeholder="内臓脂肪" className={glassInputClass} />
          </div>

          <div className="mt-6 grid gap-3">
            {sortedBodyRecords.length === 0 ? (
              <div className={glassInnerClass}>まだ体組成データがありません。</div>
            ) : (
              sortedBodyRecords.map((record) => (
                <div key={record.id} className={`${glassInnerClass} flex flex-col gap-3 md:flex-row md:items-center md:justify-between`}>
                  <div className="grid gap-1 text-sm text-gray-700 md:grid-cols-6 md:gap-4">
                    <span>{formatDateJP(record.date)}</span>
                    <span>身長：{record.height || "-"}</span>
                    <span>体重：{record.weight || "-"}</span>
                    <span>体脂肪：{record.bodyFat || "-"}</span>
                    <span>筋肉量：{record.muscleMass || "-"}</span>
                    <span>内臓脂肪：{record.visceralFat || "-"}</span>
                  </div>

                  <button onClick={() => deleteBodyRecord(record.id)} className={redButtonClass}>
                    削除
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={`${glassCardClass} mt-8`}>
          <h2 className="text-2xl font-bold text-gray-900">体組成グラフ</h2>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <SimpleLineChart data={chartPoints("weight")} title="体重推移" unit="kg" />
            <SimpleLineChart data={chartPoints("bodyFat")} title="体脂肪推移" unit="%" />
            <SimpleLineChart data={chartPoints("muscleMass")} title="筋肉量推移" unit="kg" />
            <SimpleLineChart data={chartPoints("visceralFat")} title="内臓脂肪推移" unit="" />
          </div>
        </section>

        <section className={`${glassCardClass} mt-8`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">トレーニング履歴</h2>
            <button onClick={addTrainingHistory} className={darkButtonClass}>
              履歴追加
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {detail.trainingHistory.length === 0 ? (
              <div className={glassInnerClass}>履歴がありません。</div>
            ) : (
              detail.trainingHistory.map((item) => (
                <div key={item.id} className={`${glassInnerClass} space-y-3`}>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => updateTrainingHistory(item.id, "date", e.target.value)}
                      className={glassInputClass}
                    />
                    <input
                      value={item.menu}
                      onChange={(e) => updateTrainingHistory(item.id, "menu", e.target.value)}
                      placeholder="メニュー"
                      className={glassInputClass}
                    />
                    <button onClick={() => deleteTrainingHistory(item.id)} className={redButtonClass}>
                      削除
                    </button>
                  </div>

                  <textarea
                    value={item.memo}
                    onChange={(e) => updateTrainingHistory(item.id, "memo", e.target.value)}
                    placeholder="メモ"
                    rows={3}
                    className={glassInputClass}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        <section className={`${glassCardClass} mt-8`}>
          <h2 className="text-2xl font-bold text-gray-900">売上履歴</h2>
          <div className="mt-6 space-y-3">
            {customerSales.length === 0 ? (
              <div className={glassInnerClass}>売上履歴がありません。</div>
            ) : (
              customerSales.map((sale, index) => (
                <div key={`${sale.id ?? index}`} className={glassInnerClass}>
                  <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-5">
                    <div>{formatDateJP(String(sale.date || ""))}</div>
                    <div>{sale.menuName || "-"}</div>
                    <div>{sale.staff || "-"}</div>
                    <div>{sale.customerName || customer.name}</div>
                    <div className="font-bold text-gray-900">
                      {formatCurrency(Number(sale.totalAmount || 0))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}