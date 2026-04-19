"use client";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 400,
          padding: 40,
          borderRadius: 24,
          background: "#111827",
          textAlign: "center",
        }}
      >
        <img
          src="/gymup-logo.png"
          alt="GYMUP"
          style={{
            width: 240,
            height: "auto",
            display: "block",
            margin: "0 auto 30px",
          }}
        />

        <h1 style={{ color: "#fff", margin: 0 }}>ロゴ確認</h1>
      </div>
    </main>
  );
}