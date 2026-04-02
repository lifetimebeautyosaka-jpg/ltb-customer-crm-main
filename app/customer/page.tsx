"use client";

export default function CustomerPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>顧客管理_CHECK</h1>
      <button
        onClick={() => {
          alert("ボタン動いてる");
          console.log("button clicked");
        }}
      >
        追加
      </button>
    </div>
  );
}