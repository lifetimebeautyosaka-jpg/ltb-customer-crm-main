"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "staff" | "admin";

function normalizeLoginId(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

function buildAuthEmail(id: string, mode: Mode) {
  const normalized = normalizeLoginId(id);

  if (!normalized) return "";

  if (normalized.includes("@")) {
    return normalized;
  }

  return mode === "admin"
    ? `${normalized}@admin.gymup.local`
    : `${normalized}@staff.gymup.local`;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<Mode>("staff");

  const [staffId, setStaffId] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearStatus = () => {
    setMessage("");
    setError("");
  };

  const handleStaffLogin = async () => {
    clearStatus();

    if (!staffId.trim()) {
      setError("スタッフIDを入力してください。");
      return;
    }

    if (!staffPassword.trim()) {
      setError("スタッフパスワードを入力してください。");
      return;
    }

    try {
      setLoading(true);

      const email = buildAuthEmail(staffId, "staff");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: staffPassword,
      });

      if (error) {
        throw error;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "スタッフログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    clearStatus();

    if (!adminId.trim()) {
      setError("管理者IDを入力してください。");
      return;
    }

    if (!adminPassword.trim()) {
      setError("管理者パスワードを入力してください。");
      return;
    }

    try {
      setLoading(true);

      const email = buildAuthEmail(adminId, "admin");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: adminPassword,
      });

      if (error) {
        throw error;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "管理者ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 26%), linear-gradient(135deg, #050816 0%, #0b1120 38%, #111827 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 14px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 32,
          padding: "32px 24px",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(17,24,39,0.82) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.05)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "7px 12px",
            borderRadius: 999,
            background: "rgba(249,115,22,0.12)",
            color: "#fdba74",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            marginBottom: 16,
          }}
        >
          GYMUP LOGIN
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 900,
            color: "#ffffff",
          }}
        >
          ログイン
        </h1>

        <p
          style={{
            marginTop: 10,
            marginBottom: 24,
            fontSize: 14,
            lineHeight: 1.8,
            color: "rgba(226,232,240,0.72)",
          }}
        >
          スタッフも管理者も
          <br />
          IDとパスワードでログインします
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("staff");
              clearStatus();
            }}
            style={{
              height: 46,
              borderRadius: 16,
              border:
                mode === "staff"
                  ? "none"
                  : "1px solid rgba(255,255,255,0.10)",
              background:
                mode === "staff"
                  ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            スタッフ
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("admin");
              clearStatus();
            }}
            style={{
              height: 46,
              borderRadius: 16,
              border:
                mode === "admin"
                  ? "none"
                  : "1px solid rgba(255,255,255,0.10)",
              background:
                mode === "admin"
                  ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            管理者
          </button>
        </div>

        {mode === "staff" ? (
          <section
            style={{
              textAlign: "left",
              padding: "20px 18px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#fdba74",
                marginBottom: 12,
              }}
            >
              STAFF LOGIN
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "rgba(226,232,240,0.72)",
                marginBottom: 14,
              }}
            >
              スタッフIDとパスワードでログインします。
            </div>

            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="スタッフID"
              autoComplete="username"
              style={{
                width: "100%",
                height: 50,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
                color: "#ffffff",
                fontSize: 14,
                padding: "0 14px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />

            <input
              type="password"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              placeholder="スタッフパスワード"
              autoComplete="current-password"
              style={{
                width: "100%",
                height: 50,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
                color: "#ffffff",
                fontSize: 14,
                padding: "0 14px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />

            <button
              type="button"
              onClick={handleStaffLogin}
              disabled={loading}
              style={{
                width: "100%",
                height: 54,
                border: "none",
                borderRadius: 18,
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 18px 36px rgba(249,115,22,0.28)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "ログイン中..." : "スタッフでログイン"}
            </button>
          </section>
        ) : (
          <section
            style={{
              textAlign: "left",
              padding: "20px 18px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#fdba74",
                marginBottom: 12,
              }}
            >
              ADMIN LOGIN
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "rgba(226,232,240,0.72)",
                marginBottom: 14,
              }}
            >
              管理者IDとパスワードでログインします。
            </div>

            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="管理者ID"
              autoComplete="username"
              style={{
                width: "100%",
                height: 50,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
                color: "#ffffff",
                fontSize: 14,
                padding: "0 14px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />

            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="管理者パスワード"
              autoComplete="current-password"
              style={{
                width: "100%",
                height: 50,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
                color: "#ffffff",
                fontSize: 14,
                padding: "0 14px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />

            <button
              type="button"
              onClick={handleAdminLogin}
              disabled={loading}
              style={{
                width: "100%",
                height: 54,
                border: "none",
                borderRadius: 18,
                background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 18px 36px rgba(17,24,39,0.28)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "ログイン中..." : "管理者でログイン"}
            </button>
          </section>
        )}

        {message ? (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 14,
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.22)",
              color: "#86efac",
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            {message}
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 14,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.22)",
              color: "#fca5a5",
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 18,
            fontSize: 12,
            lineHeight: 1.8,
            color: "rgba(226,232,240,0.56)",
          }}
        >
          例:
          <br />
          スタッフID → yamaguchi
          <br />
          管理者ID → admin
        </div>

        <Link
          href="/"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 18,
            color: "rgba(226,232,240,0.66)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          TOPへ戻る
        </Link>
      </div>
    </main>
  );
}