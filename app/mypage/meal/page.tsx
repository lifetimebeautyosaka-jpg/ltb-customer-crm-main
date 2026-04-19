"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Meal = {
  id: string;
  image_url?: string;
  comment?: string;
  created_at?: string;
};

export default function MealPage() {
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("mypage_meals");
    if (data) {
      setMeals(JSON.parse(data));
    }
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>食事管理</h1>

      <Link href="/mypage/meal/new">
        <button style={{ marginBottom: 20 }}>＋ 食事を追加</button>
      </Link>

      {meals.length === 0 && <p>まだ投稿がありません</p>}

      {meals.map((meal) => (
        <div key={meal.id} style={{ marginBottom: 20 }}>
          {meal.image_url && (
            <img src={meal.image_url} width="200" />
          )}
          <p>{meal.comment}</p>
          <small>{meal.created_at}</small>
        </div>
      ))}
    </main>
  );
}