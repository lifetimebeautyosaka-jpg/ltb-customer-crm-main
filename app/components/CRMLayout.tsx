"use client";

import React from "react";
import Link from "next/link";

export default function CRMLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "rgba(0,0,0,0.88)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#fff",
              }}
            >
              GYMUP CRM
            </div>
            {title ? (
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: "4px",
                  letterSpacing: "0.06em",
                }}
              >
                {title}
              </div>
            ) : null}
          </div>

          <nav
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/" style={navLinkStyle}>
              管理メニュー
            </Link>
            <Link href="/customer" style={navLinkStyle}>
              顧客管理
            </Link>
            <Link href="/sales" style={navLinkStyle}>
              売上管理
            </Link>
            <Link href="/accounting" style={navLinkStyle}>
              会計管理
            </Link>
            <Link href="/attendance" style={navLinkStyle}>
              勤怠
            </Link>
          </nav>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "28px 24px 40px",
        }}
      >
        {children}
      </main>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "12px",
  color: "#fff",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 600,
  background: "#0d0d0d",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
};

export const card: React.CSSProperties = {
  padding: "22px",
  borderRadius: "20px",
  background: "#0b0b0b",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
};

export const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#050505",
  color: "#fff",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box",
};

export const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 700,
  background: "#111",
  border: "1px solid rgba(255,255,255,0.12)",
  cursor: "pointer",
  textDecoration: "none",
  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
};

export const label: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.72)",
  letterSpacing: "0.03em",
};

export const ghostLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "12px",
  color: "#fff",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 600,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.14)",
};