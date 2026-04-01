"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Customer = {
  id: string;
  name: string;
  phone: string;
  plan: string;
  createdAt: string;
  updatedAt?: string;
};

const PLAN_OPTIONS = [
  "トレーニング 月2回",
  "トレーニング 月4回",
  "トレーニング 無制限",
  "プレミアムダイエット16",
  "プレミアムダイエット24",
  "プレミアムダイエット32",
  "ストレッチ",
  "そのほか",
];

export default function CustomerPage() {
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState(PLAN_OPTIONS[0]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);

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
        if (Array.isArray(parsed)) {
          setCustomers(parsed);
        } else {
          setCustomers([]);
        }
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("gymup_customers", JSON.stringify(customers));
  }, [customers, mounted]);

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const sorted = [...customers].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    if (!keyword) return sorted;

    return sorted.filter((customer) => {
      return (
        customer.name?.toLowerCase().includes(keyword) ||
        customer.phone?.toLowerCase().includes(keyword) ||
        customer.plan?.toLowerCase().includes(keyword)
      );
    });
  }, [customers, search]);

  const handleAddCustomer = () => {
    if (!name.trim()) {
      alert("顧客名を入力してください");
      return;
    }

    const newCustomer: Customer = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),
      name: name.trim(),
      phone: phone.trim(),
      plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setName("");
    setPhone("");
    setPlan(PLAN_OPTIONS[0]);
  };

  const handleDeleteCustomer = (id: string, customerName: string) => {
    const ok = window.confirm(`「${customerName}」を削除しますか？`);
    if (!ok) return;

    setCustomers((prev) => prev.filter((customer) => customer.id !== id));

    try {
      localStorage.removeItem(`customer-${id}`);
    } catch {}
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f7f7f8 0%, #ececef 45%, #e5e7eb 100%)",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* 🔥 ヘッダー */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              顧客管理
            </h1>
            <p
              style={{
                marginTop: "8px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              顧客追加・検索・詳細確認ができます
            </p>
          </div>

          {/* 🔥 ホーム戻るボタン */}
          <Link href="/" style={homeButtonStyle}>
            ← ホームへ
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "24px",
          }}
        >
          {/* 顧客追加 */}
          <div style={cardStyle}>
            <h2 style={titleStyle}>顧客追加</h2>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>顧客名</label>
                <input
                  type="text"
                  placeholder="例：山田 太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>電話番号</label>
                <input
                  type="text"
                  placeholder="例：090-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>プラン</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  style={inputStyle}
                >
                  {PLAN_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button onClick={handleAddCustomer} style={buttonStyle}>
                顧客を追加する
              </button>
            </div>
          </div>

          {/* 顧客一覧 */}
          <div style={cardStyle}>
            <div style={listHeaderStyle}>
              <h2 style={titleStyle}>顧客一覧</h2>

              <input
                type="text"
                placeholder="検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, maxWidth: "300px" }}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <div style={emptyStyle}>顧客がまだいません</div>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} style={itemStyle}>
                    <div style={itemTop}>
                      <div>
                        <div style={nameStyle}>{customer.name}</div>

                        <div style={infoWrap}>
                          <div style={infoBoxStyle}>
                            <div style={infoLabelStyle}>電話番号</div>
                            <div style={infoValueStyle}>
                              {customer.phone || "未入力"}
                            </div>
                          </div>

                          <div style={infoBoxStyle}>
                            <div style={infoLabelStyle}>プラン</div>
                            <div style={infoValueStyle}>
                              {customer.plan}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <Link
                          href={`/customer/${customer.id}`}
                          style={detailButtonStyle}
                        >
                          詳細
                        </Link>

                        <button
                          onClick={() =>
                            handleDeleteCustomer(customer.id, customer.name)
                          }
                          style={deleteButtonStyle}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== デザイン ===== */

const homeButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  padding: "10px 16px",
  borderRadius: "12px",
  background: "#111827",
  color: "#fff",
  fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(14px)",
  borderRadius: "24px",
  padding: "28px",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: "22px",
  fontWeight: 700,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const labelStyle: React.CSSProperties = {
  marginBottom: "6px",
  fontSize: "13px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #ddd",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: "12px",
  background: "#111827",
  color: "#fff",
  fontWeight: 700,
};

const listHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "16px",
};

const emptyStyle: React.CSSProperties = {
  padding: "20px",
  textAlign: "center",
  color: "#888",
};

const itemStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "16px",
  background: "#fff",
};

const itemTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
};

const nameStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "18px",
  marginBottom: "10px",
};

const infoWrap: React.CSSProperties = {
  display: "flex",
  gap: "10px",
};

const infoBoxStyle: React.CSSProperties = {
  padding: "10px",
  border: "1px solid #eee",
  borderRadius: "10px",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#777",
};

const infoValueStyle: React.CSSProperties = {
  fontWeight: 600,
};

const detailButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid #ddd",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  background: "#111827",
  color: "#fff",
};