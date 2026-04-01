"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: string | number;
  name: string;
};

type ServiceType = "ストレッチ" | "トレーニング";
type AccountingType = "売上" | "前受金";
type NominationType = "なし" | "あり";

type SaleCategory =
  | "ストレッチ現金"
  | "ストレッチカード"
  | "ストレッチ受領済み"
  | "ストレッチ前受金"
  | "トレーニング現金"
  | "トレーニングカード"
  | "トレーニング受領済み"
  | "トレーニング前受金";

type Sale = {
  id: string | number;
  date: string;
  customerId: string | number;
  customerName: string;
  menuName: string;
  staff: string;
  baseAmount: number;
  nominationType: NominationType;
  nominationFee: number;
  totalAmount: number;
  serviceType: ServiceType;
  accountingType: AccountingType;
  category: SaleCategory;
  note: string;
};

type PlanType = "月2回" | "月4回" | "無制限";
type PlanStyle = "マンツーマン" | "ペア";
type SubscriptionStatus = "有効" | "停止";

type CustomerSubscription = {
  planType: PlanType;
  planStyle: PlanStyle;
  price: number;
  monthlyCount: number;
  usedCount: number;
  carryOver: number;
  remaining: number;
  status: SubscriptionStatus;
  nextPayment: string;
  lastResetMonth: string;
  isUnlimited: boolean;
};

type CustomerDetail = {
  memo?: string;
  lastVisit?: string;
  bodyRecords?: unknown[];
  trainingHistory?: unknown[];
  progressPhotos?: unknown[];
  subscription?: CustomerSubscription;
};

function formatCurrency(value: number) {
  return `¥${Number(value || 0).toLocaleString()}`;
}

function toDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(dateString: string) {
  const target = toDate(dateString);
  if (!target) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = end.getTime() - start.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getPaymentLabel(category: SaleCategory) {
  if (category.endsWith("現金")) return "現金";
  if (category.endsWith("カード")) return "カード";
  if (category.endsWith("受領済み")) return "受領済み";
  if (category.endsWith("前受金")) return "前受金";
  return "その他";
}

export default function AccountingPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    { customerId: string | number; customerName: string; subscription: CustomerSubscription }[]
  >([]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

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
      const savedSales =
        localStorage.getItem("gymup_sales") ||
        localStorage.getItem("sales");

      if (savedSales) {
        const parsed = JSON.parse(savedSales);
        setSales(Array.isArray(parsed) ? parsed : []);
      } else {
        setSales([]);
      }
    } catch {
      setSales([]);
    }

    const subscriptionRows: {
      customerId: string | number;
      customerName: string;
      subscription: CustomerSubscription;
    }[] = [];

    try {
      const savedCustomers =
        localStorage.getItem("gymup_customers") ||
        localStorage.getItem("customers");

      const parsedCustomers: Customer[] = savedCustomers ? JSON.parse(savedCustomers) : [];

      parsedCustomers.forEach((customer) => {
        try {
          const raw = localStorage.getItem(`customer-${customer.id}`);
          if (!raw) return;

          const detail: CustomerDetail = JSON.parse(raw);
          if (!detail?.subscription) return;

          subscriptionRows.push({
            customerId: customer.id,
            customerName: customer.name,
            subscription: detail.subscription,
          });
        } catch {
          return;
        }
      });
    } catch {
      //
    }

    setSubscriptions(subscriptionRows);
    setMounted(true);
  }, []);

  const advanceEntries = useMemo(() => {
    return sales
      .filter((sale) => sale.accountingType === "前受金")
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sales]);

  const advanceByCustomer = useMemo(() => {
    const grouped: Record<
      string,
      {
        customerName: string;
        total: number;
      }
    > = {};

    advanceEntries.forEach((sale) => {
      const key = String(sale.customerId);
      if (!grouped[key]) {
        grouped[key] = {
          customerName: sale.customerName,
          total: 0,
        };
      }
      grouped[key].total += Number(sale.totalAmount || 0);
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [advanceEntries]);

  const subscriptionSummary = useMemo(() => {
    const result = {
      total: subscriptions.length,
      monthly2: 0,
      monthly4: 0,
      unlimited: 0,
      paused: 0,
      carryOverUsers: 0,
      monthlyRevenue: 0,
    };

    subscriptions.forEach(({ subscription }) => {
      if (subscription.planType === "月2回") result.monthly2 += 1;
      if (subscription.planType === "月4回") result.monthly4 += 1;
      if (subscription.planType === "無制限") result.unlimited += 1;
      if (subscription.status === "停止") result.paused += 1;
      if ((subscription.carryOver ?? 0) > 0) result.carryOverUsers += 1;
      if (subscription.status === "有効") {
        result.monthlyRevenue += Number(subscription.price || 0);
      }
    });

    return result;
  }, [subscriptions]);

  const nextPaymentCustomers = useMemo(() => {
    return subscriptions
      .map((row) => ({
        ...row,
        days: daysUntil(row.subscription.nextPayment),
      }))
      .filter((row) => row.days !== null && row.days! >= 0 && row.days! <= 7)
      .sort((a, b) => (a.days! > b.days! ? 1 : -1));
  }, [subscriptions]);

  const accountingTypeTotals = useMemo(() => {
    return {
      売上: sales
        .filter((sale) => sale.accountingType === "売上")
        .reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0),
      前受金: sales
        .filter((sale) => sale.accountingType === "前受金")
        .reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0),
    };
  }, [sales]);

  const categoryTotals = useMemo(() => {
    const grouped: Record<SaleCategory, number> = {
      ストレッチ現金: 0,
      ストレッチカード: 0,
      ストレッチ受領済み: 0,
      ストレッチ前受金: 0,
      トレーニング現金: 0,
      トレーニングカード: 0,
      トレーニング受領済み: 0,
      トレーニング前受金: 0,
    };

    sales.forEach((sale) => {
      grouped[sale.category] += Number(sale.totalAmount || 0);
    });

    return Object.entries(grouped);
  }, [sales]);

  const paymentMethodTotals = useMemo(() => {
    const grouped: Record<string, number> = {
      現金: 0,
      カード: 0,
      受領済み: 0,
      前受金: 0,
    };

    sales.forEach((sale) => {
      const key = getPaymentLabel(sale.category);
      grouped[key] += Number(sale.totalAmount || 0);
    });

    return Object.entries(grouped);
  }, [sales]);

  const serviceTotals = useMemo(() => {
    return {
      ストレッチ: sales
        .filter((sale) => sale.serviceType === "ストレッチ")
        .reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0),
      トレーニング: sales
        .filter((sale) => sale.serviceType === "トレーニング")
        .reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0),
    };
  }, [sales]);

  const staffTotals = useMemo(() => {
    const grouped: Record<string, number> = {};

    sales.forEach((sale) => {
      const key = sale.staff || "未設定";
      grouped[key] = (grouped[key] || 0) + Number(sale.totalAmount || 0);
    });

    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [sales]);

  const monthlyTotals = useMemo(() => {
    const grouped: Record<
      string,
      {
        total: number;
        sales: number;
        advance: number;
        stretch: number;
        training: number;
      }
    > = {};

    sales.forEach((sale) => {
      const month = (sale.date || "").slice(0, 7);
      if (!month) return;

      if (!grouped[month]) {
        grouped[month] = {
          total: 0,
          sales: 0,
          advance: 0,
          stretch: 0,
          training: 0,
        };
      }

      grouped[month].total += Number(sale.totalAmount || 0);

      if (sale.accountingType === "売上") {
        grouped[month].sales += Number(sale.totalAmount || 0);
      } else {
        grouped[month].advance += Number(sale.totalAmount || 0);
      }

      if (sale.serviceType === "ストレッチ") {
        grouped[month].stretch += Number(sale.totalAmount || 0);
      } else {
        grouped[month].training += Number(sale.totalAmount || 0);
      }
    });

    return Object.entries(grouped)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([month, values]) => ({
        month,
        ...values,
      }));
  }, [sales]);

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#e5e7eb 0%,#d1d5db 42%,#9ca3af 100%)",
        color: "#111827",
        paddingBottom: "40px",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          background: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800 }}>GYMUP CRM</div>
            <div style={{ fontSize: "12px", color: "#4b5563" }}>会計管理</div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/" style={subButtonStyle}>
              ホームへ戻る
            </Link>
            <button
              onClick={() => router.push("/sales")}
              style={mainButtonStyle}
            >
              売上管理へ
            </button>
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "30px 24px 0",
          display: "grid",
          gap: "24px",
        }}
      >
        <section style={glassCardLgStyle}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.45)",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#4b5563",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: "rgba(0,0,0,0.7)",
              }}
            />
            ACCOUNTING
          </div>

          <h1 style={{ margin: 0, fontSize: "38px", fontWeight: 800 }}>
            会計管理
          </h1>

          <p
            style={{
              marginTop: "16px",
              maxWidth: "760px",
              fontSize: "15px",
              lineHeight: 1.9,
              color: "#374151",
            }}
          >
            前受金管理、サブスク状況、カテゴリ別集計、会計集計をまとめて確認できます。
          </p>
        </section>

        <section style={glassCardStyle}>
          <h2 style={sectionTitleStyle}>前受金管理</h2>

          <div style={metricGrid2Style}>
            <Metric title="前受金件数" value={`${advanceEntries.length}件`} />
            <Metric title="前受金合計" value={formatCurrency(accountingTypeTotals.前受金)} />
          </div>

          <h3 style={subTitleStyle}>顧客別前受金残高</h3>
          {advanceByCustomer.length === 0 ? (
            <p style={emptyTextStyle}>前受金データがありません。</p>
          ) : (
            <div style={listGridStyle}>
              {advanceByCustomer.map((row, index) => (
                <SoftRow
                  key={`${row.customerName}-${index}`}
                  label={row.customerName}
                  value={formatCurrency(row.total)}
                />
              ))}
            </div>
          )}

          <h3 style={subTitleStyle}>前受金登録履歴</h3>
          {advanceEntries.length === 0 ? (
            <p style={emptyTextStyle}>前受金の登録履歴がありません。</p>
          ) : (
            <div style={listGridStyle}>
              {advanceEntries.slice(0, 10).map((sale) => (
                <div key={String(sale.id)} style={glassInnerStyle}>
                  <div style={{ marginBottom: "8px", fontWeight: 800 }}>
                    {sale.date} / {sale.customerName}
                  </div>
                  <div style={detailGridStyle}>
                    <div>メニュー：{sale.menuName}</div>
                    <div>カテゴリ：{sale.category}</div>
                    <div>担当者：{sale.staff}</div>
                    <div>金額：{formatCurrency(sale.totalAmount)}</div>
                    {sale.note ? <div>メモ：{sale.note}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={glassCardStyle}>
          <h2 style={sectionTitleStyle}>サブスク管理</h2>

          <div style={metricGrid4Style}>
            <Metric title="契約人数" value={`${subscriptionSummary.total}人`} />
            <Metric title="月2回" value={`${subscriptionSummary.monthly2}人`} />
            <Metric title="月4回" value={`${subscriptionSummary.monthly4}人`} />
            <Metric title="無制限" value={`${subscriptionSummary.unlimited}人`} />
            <Metric title="停止中" value={`${subscriptionSummary.paused}人`} />
            <Metric title="繰越あり" value={`${subscriptionSummary.carryOverUsers}人`} />
            <Metric
              title="有効契約の月額合計"
              value={formatCurrency(subscriptionSummary.monthlyRevenue)}
            />
          </div>

          <h3 style={subTitleStyle}>次回支払日が近い顧客</h3>
          {nextPaymentCustomers.length === 0 ? (
            <p style={emptyTextStyle}>7日以内の支払予定顧客はいません。</p>
          ) : (
            <div style={listGridStyle}>
              {nextPaymentCustomers.map((row) => (
                <div key={String(row.customerId)} style={glassInnerStyle}>
                  <div style={{ marginBottom: "8px", fontWeight: 800 }}>
                    {row.customerName}
                  </div>
                  <div style={detailGridStyle}>
                    <div>プラン：{row.subscription.planType}</div>
                    <div>スタイル：{row.subscription.planStyle}</div>
                    <div>次回支払日：{row.subscription.nextPayment}</div>
                    <div>あと {row.days} 日</div>
                    <div>月額：{formatCurrency(row.subscription.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={glassCardStyle}>
          <h2 style={sectionTitleStyle}>売上区分集計</h2>

          <div style={metricGrid2Style}>
            <Metric title="売上" value={formatCurrency(accountingTypeTotals.売上)} />
            <Metric title="前受金" value={formatCurrency(accountingTypeTotals.前受金)} />
          </div>

          <h3 style={subTitleStyle}>カテゴリ別集計</h3>
          <div style={listGridStyle}>
            {categoryTotals.map(([categoryName, amount]) => (
              <SoftRow
                key={categoryName}
                label={categoryName}
                value={formatCurrency(amount)}
              />
            ))}
          </div>

          <h3 style={subTitleStyle}>支払方法別集計</h3>
          <div style={listGridStyle}>
            {paymentMethodTotals.map(([name, amount]) => (
              <SoftRow key={name} label={name} value={formatCurrency(amount)} />
            ))}
          </div>
        </section>

        <section style={glassCardStyle}>
          <h2 style={sectionTitleStyle}>会計集計</h2>

          <div style={metricGrid2Style}>
            <Metric title="ストレッチ合計" value={formatCurrency(serviceTotals.ストレッチ)} />
            <Metric title="トレーニング合計" value={formatCurrency(serviceTotals.トレーニング)} />
          </div>

          <h3 style={subTitleStyle}>担当者別集計</h3>
          {staffTotals.length === 0 ? (
            <p style={emptyTextStyle}>売上データがありません。</p>
          ) : (
            <div style={listGridStyle}>
              {staffTotals.map(([staffName, amount]) => (
                <SoftRow key={staffName} label={staffName} value={formatCurrency(amount)} />
              ))}
            </div>
          )}

          <h3 style={subTitleStyle}>月別会計集計</h3>
          {monthlyTotals.length === 0 ? (
            <p style={emptyTextStyle}>月別データがありません。</p>
          ) : (
            <div style={listGridStyle}>
              {monthlyTotals.map((row) => (
                <div key={row.month} style={glassInnerStyle}>
                  <div style={{ marginBottom: "8px", fontWeight: 800 }}>{row.month}</div>
                  <div style={detailGridStyle}>
                    <div>合計：{formatCurrency(row.total)}</div>
                    <div>売上：{formatCurrency(row.sales)}</div>
                    <div>前受金：{formatCurrency(row.advance)}</div>
                    <div>ストレッチ：{formatCurrency(row.stretch)}</div>
                    <div>トレーニング：{formatCurrency(row.training)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div style={glassInnerStyle}>
      <div style={{ marginBottom: "6px", fontSize: "13px", color: "#4b5563" }}>{title}</div>
      <div style={{ fontSize: "30px", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function SoftRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        ...glassInnerStyle,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span style={{ fontWeight: 800 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const glassCardStyle: React.CSSProperties = {
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.35)",
  background: "rgba(255,255,255,0.40)",
  padding: "24px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.10)",
  backdropFilter: "blur(20px)",
};

const glassCardLgStyle: React.CSSProperties = {
  borderRadius: "34px",
  border: "1px solid rgba(255,255,255,0.35)",
  background: "rgba(255,255,255,0.40)",
  padding: "32px",
  boxShadow: "0 28px 80px rgba(0,0,0,0.12)",
  backdropFilter: "blur(20px)",
};

const glassInnerStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.35)",
  background: "rgba(255,255,255,0.35)",
  padding: "16px",
  backdropFilter: "blur(14px)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 18px 0",
  fontSize: "30px",
  fontWeight: 800,
};

const subTitleStyle: React.CSSProperties = {
  margin: "24px 0 12px 0",
  fontSize: "22px",
  fontWeight: 800,
};

const metricGrid2Style: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  marginBottom: "18px",
};

const metricGrid4Style: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  marginBottom: "18px",
};

const listGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
  fontSize: "14px",
  color: "#374151",
};

const emptyTextStyle: React.CSSProperties = {
  color: "#4b5563",
};

const subButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "12px",
  padding: "12px 16px",
  background: "rgba(255,255,255,0.30)",
  border: "1px solid rgba(255,255,255,0.45)",
  color: "#1f2937",
  fontWeight: 700,
};

const mainButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};