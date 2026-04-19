"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MealItem = {
  id: string;
  image_url?: string;
  comment?: string;
  created_at?: string;
};

export default function MealNewPage() {
  const router = useRouter();

  const [image, setImage] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!image.trim() && !comment.trim()) {
      alert("画像URLかコメントを入力してください");
      return;
    }

    const newMeal: MealItem = {
      id: Date.now().toString(),
      image_url: image.trim(),
      comment: comment.trim(),
      created_at: new Date().toLocaleString(),
    };

    try {
      const existing = localStorage.getItem("mypage_meals");
      const meals: MealItem[] = existing ? JSON.parse(existing) : [];

      meals.unshift(newMeal);

      localStorage.setItem("mypage_meals", JSON.stringify(meals));

      alert("食事を登録しました");
      router.push("/mypage/meal");
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>食事を送る</h1>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 8 }}>画像URL（仮）</label>
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://〜"
          style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 8 }}>コメント</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="食事内容を入力"
          style={{ width: "100%", height: 120, padding: 10, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={() => router.push("/mypage/meal")}
          style={{ padding: "10px 16px", cursor: "pointer" }}
        >
          戻る
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          style={{ padding: "10px 16px", cursor: "pointer" }}
        >
          送信する
        </button>
      </div>
    </main>
  );
}