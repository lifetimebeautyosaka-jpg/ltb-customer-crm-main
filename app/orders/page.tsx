"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

type OrderRow = {
  id: number;
  stripe_session_id?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  created_at?: string | null;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  product_name: string;
  unit_amount: number;
  quantity: number;
  subtotal: number;
  created_at?: string | null;
};

type OrderWithItems = OrderRow & {
  items: OrderItemRow[];
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function yen(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `¥${Number(value).toLocaleString()}`;
}

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    void fetchOrders();
  }, []);

  async function fetchOrders() {
    if (!supabase) {
      setError("Supabaseの環境変数が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      const { data: itemData, error: itemError } = await supabase
        .from("order_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (itemError) throw itemError;

      const itemsByOrderId = new Map<number, OrderItemRow[]>();

      ((itemData || []) as OrderItemRow[]).forEach((item) => {
        if (!itemsByOrderId.has(item.order_id)) {
          itemsByOrderId.set(item.order_id, []);
        }
        itemsByOrderId.get(item.order_id)!.push(item);
      });

      const merged: OrderWithItems[] = ((orderData || []) as OrderRow[]).map((order) => ({
        ...order,
        items: itemsByOrderId.get(order.id) || [],
      }));

      setOrders(merged);
    } catch (error: any) {
      console.error(error);
      setError(error?.message || "注文履歴の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((order) => {
      const text = [
        order.id,
        order.customer_name,
        order.customer_email,
        order.payment_status,
        order.order_status,
        order.stripe_session_id,
        ...order.items.map((item) => item.product_name),
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return text.includes(q);
    });
  }, [orders, keyword]);

  const totalSales = useMemo(() => {
    return orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  }, [orders]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        padding: "24px 16px 60px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => router.push("/shop")}
            style={{
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#334155",
              borderRadius: 12,
              minHeight: 42,
              padding: "0 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← ショップへ戻る
          </button>

          <button
            onClick={() => void fetchOrders()}
            style={{
              border: "1px solid #111827",
              background: "#111827",
              color: "#fff",
              borderRadius: 12,
              minHeight: 42,
              padding: "0 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            再読み込み
          </button>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(255,255,255,0.9)",
            borderRadius: 22,
            padding: 22,
            boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, letterSpacing: "0.12em", marginBottom: 8 }}>
            ORDERS
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            注文履歴
          </h1>

          <p style={{ marginTop: 10, marginBottom: 0, color: "#64748b", lineHeight: 1.8 }}>
            Stripe決済後に Supabase へ保存された注文を確認できます。
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <SummaryCard label="注文件数" value={`${orders.length}件`} />
          <SummaryCard label="表示件数" value={`${filteredOrders.length}件`} />
          <SummaryCard label="売上合計" value={yen(totalSales)} />
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(255,255,255,0.9)",
            borderRadius: 18,
            padding: 16,
            boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>
            検索
          </div>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="注文者名・メール・商品名・session_id で検索"
            style={{
              width: "100%",
              height: 46,
              borderRadius: 12,
              border: "1px solid #dbe2ea",
              background: "#fff",
              padding: "0 12px",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error ? (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: 24,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            読み込み中...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: 24,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            注文データがありません。
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 18,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
                  border: "1px solid #eef2f7",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
                      注文 #{order.id}
                    </div>
                    <div style={{ marginTop: 4, color: "#64748b", fontSize: 13 }}>
                      {formatDate(order.created_at)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        background: "#dbeafe",
                        color: "#1d4ed8",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {order.payment_status || "不明"}
                    </span>

                    <span
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {order.order_status || "paid"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <InfoCard label="注文者名" value={order.customer_name || "—"} />
                  <InfoCard label="メール" value={order.customer_email || "—"} />
                  <InfoCard label="合計金額" value={yen(order.total_amount)} />
                  <InfoCard label="session_id" value={order.stripe_session_id || "—"} />
                </div>

                <div
                  style={{
                    borderTop: "1px solid #eef2f7",
                    paddingTop: 14,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#334155", marginBottom: 10 }}>
                    購入商品
                  </div>

                  {order.items.length === 0 ? (
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>商品情報なし</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.5fr 0.8fr 0.6fr 0.9fr",
                            gap: 8,
                            alignItems: "center",
                            background: "#f8fafc",
                            borderRadius: 12,
                            padding: "12px 10px",
                            fontSize: 13,
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {item.product_name}
                          </div>
                          <div style={{ color: "#475569" }}>{yen(item.unit_amount)}</div>
                          <div style={{ color: "#475569" }}>× {item.quantity}</div>
                          <div style={{ fontWeight: 800, color: "#111827", textAlign: "right" }}>
                            {yen(item.subtotal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(255,255,255,0.9)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, color: "#0f172a", fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#0f172a",
          fontWeight: 700,
          wordBreak: "break-word",
          lineHeight: 1.6,
        }}
      >
        {value}
      </div>
    </div>
  );
}