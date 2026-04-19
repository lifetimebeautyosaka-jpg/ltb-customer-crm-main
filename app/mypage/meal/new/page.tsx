"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MealNewPage() {
  const router = useRouter();

  const [image, setImage] = useState<string>("");
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!image && !comment) {
      alert("画像かコメントを入力してください");
      return;
    }

    const newMeal = {
      id: Date.now().toString(),
      image_url: image,
      comment: comment,
      created_at: new Date().toLocaleString(),
    };

    const existing = localStorage.getItem("mypage_meals");
    const meals = existing ? JSON.parse(existing) : [];

    meals.unshift(newMeal);

    localStorage.setItem("mypage_meals", JSON.stringify(meals));

    alert("食事を登録しました");

    // 🔥 一覧へ戻る
    router.push("/mypage/meal");
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>食事を送る</h1>

      <div style={{ marginBottom: 20 }}>
        <label>画像URL（今は仮）</label>
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://〜"
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>コメント</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ width: "100%", height: 100 }}
        />
      </div>

      <button onClick={handleSubmit}>
        送信する
      </button>
    </main>
  );
}