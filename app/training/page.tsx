"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type Customer = {
  id: number;
  name: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TrainingSearchPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    setMounted(true);

    const isLoggedIn = localStorage.getItem("gymup_logged_in");
    if (isLoggedIn !== "true") {
      window.location.href = "/login";
      return;
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setPageError("");

        const { data, error } = await supabase
          .from("customers")
          .select("id, name")
          .order("id", { ascending: true });

        console.log("training customers data:", data);
        console.log("training customers error:", error);

        if (error) {
          setPageError(`顧客データ取得エラー: ${error.message}`);
          setCustomers([]);
          return;
        }

        setCustomers((data as Customer[] | null) || []);
      } catch (error) {
        console.error("fetchCustomers error:", error);
        setPageError("顧客データ取得中にエラーが発生しました。");
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [mounted]);

  const filtered = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return customers;

    return customers.filter((c) =>
      String(c.name || "").toLowerCase().includes(key)
    );
  }, [keyword, customers]);

  if (!mounted) return null;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.badge}>TRAINING SEARCH</div>
          <h1 style={styles.title}>トレーニング履歴</h1>
          <p style={styles.text}>
            顧客を検索して、トレーニング履歴ページへ進みます。
          </p>

          <input
            placeholder="お客様名で検索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={styles.input}
          />

          {pageError ? (
            <div style={styles.errorBox}>{pageError}</div>
          ) : loading ? (
            <div style={styles.emptyBox}>読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyBox}>顧客がいません</div>
          ) : (
            <div style={styles.list}>
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/customer/${c.id}/training`}
                  style={styles.item}
                >
                  <div style={styles.itemName}>{c.name}</div>
                  <div style={styles.itemOpen}>開く</div>
                </Link>
              ))}
            </div>
          )}

          <div style={styles.bottomRow}>
            <Link href="/" style={styles.subButton}>
              ← ホームへ
            </Link>
            <Link href="/customer" style={styles.subButton}>
              顧客一覧へ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px 60px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f8fafc 32%, #eef2f7 62%, #e2e8f0 100%)",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  card: {
    borderRadius: "32px",
    padding: "30px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.72))",
    border: "1px solid rgba(203,213,225,0.5)",
    boxShadow:
      "0 24px 80px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.98)",
  },
  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    letterSpacing: "0.18em",
    fontWeight: 700,
    color: "#64748b",
    border: "1px solid rgba(203,213,225,0.5)",
    background: "rgba(255,255,255,0.75)",
    marginBottom: "14px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#0f172a",
  },
  text: {
    marginTop: "10px",
    marginBottom: "20px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.8,
  },
  input: {
    width: "100%",
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(203,213,225,0.8)",
    background: "rgba(255,255,255,0.95)",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "18px",
  },
  list: {
    display: "grid",
    gap: "12px",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "18px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(241,245,249,0.78))",
    border: "1px solid rgba(203,213,225,0.48)",
    textDecoration: "none",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)",
  },
  itemName: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
  },
  itemOpen: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#f59e0b",
    flexShrink: 0,
  },
  emptyBox: {
    borderRadius: "18px",
    padding: "22px",
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(203,213,225,0.6)",
    color: "#64748b",
    textAlign: "center",
    fontWeight: 700,
  },
  errorBox: {
    borderRadius: "18px",
    padding: "22px",
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    textAlign: "center",
    fontWeight: 700,
  },
  bottomRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "20px",
  },
  subButton: {
    textDecoration: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(203,213,225,0.85)",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "14px",
  },
};