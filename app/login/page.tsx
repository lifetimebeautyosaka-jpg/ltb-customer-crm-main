"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");

  const goStaff = () => {
    localStorage.setItem("gymup_logged_in", "true");
    localStorage.setItem("gymup_user_role", "staff");
    localStorage.setItem("gymup_staff_logged_in", "true");

    localStorage.removeItem("gymup_member_logged_in");
    localStorage.removeItem("gymup_member_id");

    router.push("/dashboard");
  };

  const goAdmin = () => {
    setError("");

    if (adminId !== "admin" || adminPassword !== "1234") {
      setError("管理者IDまたはパスワードが違います。");
      return;
    }

    localStorage.setItem("gymup_logged_in", "true");
    localStorage.setItem("gymup_user_role", "admin");

    localStorage.removeItem("gymup_staff_logged_in");
    localStorage.removeItem("gymup_member_logged_in");
    localStorage.removeItem("gymup_member_id");

    router.push("/dashboard");
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
          maxWidth: 460,
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
          ログイン選択
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
          スタッフはワンタップ、管理者はIDとパスワードでログインします
        </p>

        <section
          style={{
            textAlign: "left",
            padding: "20px 18px",
            borderRadius: 24,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#fdba74",
              marginBottom: 10,
            }}
          >
            STAFF
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.8,
              color: "rgba(226,232,240,0.72)",
              marginBottom: 14,
            }}
          >
            スタッフはパスワードなしでそのまま入れます
          </div>

          <button
            type="button"
            onClick={goStaff}
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
            }}
          >
            スタッフで入る
          </button>
        </section>

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
            ADMIN
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            <input
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="管理者ID"
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
              }}
            />

            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="パスワード"
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
              }}
            />

            {error ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.22)",
                  color: "#fca5a5",
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={goAdmin}
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
              }}
            >
              管理者で入る
            </button>
          </div>
        </section>

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