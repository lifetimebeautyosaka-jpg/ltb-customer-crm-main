"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MealItem = {
  id: string;
  image_url?: string;
  comment?: string;
  created_at?: string;
  feedback?: string;
};

function formatDateTime(value?: string) {
  if (!value) return "未設定";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function MyPageMealPage() {
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = localStorage.getItem("mypage_meals");
      const parsed: MealItem[] = data ? JSON.parse(data) : [];
      setMeals(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error(error);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const feedbackCount = useMemo(() => {
    return meals.filter((item) => item.feedback && item.feedback.trim()).length;
  }, [meals]);

  return (
    <>
      <style>{`
        .meal-page {
          min-height: 100vh;
          background: #f7f7f5;
          color: #1f2937;
          padding: 24px 14px 48px;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .meal-page__container {
          max-width: 960px;
          margin: 0 auto;
        }

        .meal-page__hero,
        .meal-page__stats,
        .meal-page__list-wrap {
          background: #ffffff;
          border: 1px solid #ece7df;
          border-radius: 28px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .meal-page__hero {
          padding: 28px;
        }

        .meal-page__eyebrow {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #b7791f;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .meal-page__title {
          margin: 0;
          font-size: clamp(30px, 5vw, 42px);
          line-height: 1.15;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.03em;
        }

        .meal-page__desc {
          margin: 14px 0 0;
          font-size: 15px;
          line-height: 1.9;
          color: #6b7280;
          max-width: 680px;
        }

        .meal-page__actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .meal-page__primary,
        .meal-page__secondary {
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .meal-page__primary {
          background: linear-gradient(135deg, #f08a27 0%, #ff6a00 100%);
          color: #ffffff;
          border: 1px solid rgba(240,138,39,0.35);
          box-shadow: 0 10px 24px rgba(240,138,39,0.25);
        }

        .meal-page__secondary {
          background: #ffffff;
          color: #1f2937;
          border: 1px solid #e5dfd5;
        }

        .meal-page__primary:hover,
        .meal-page__secondary:hover {
          transform: translateY(-1px);
        }

        .meal-page__stats {
          margin-top: 16px;
          padding: 20px;
        }

        .meal-page__stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .meal-page__stat {
          background: #faf8f4;
          border: 1px solid #eee8df;
          border-radius: 20px;
          padding: 16px;
        }

        .meal-page__stat-label {
          font-size: 12px;
          font-weight: 700;
          color: #8a8175;
          margin-bottom: 8px;
        }

        .meal-page__stat-value {
          font-size: 28px;
          font-weight: 900;
          color: #111827;
          line-height: 1.2;
        }

        .meal-page__list-wrap {
          margin-top: 16px;
          padding: 22px;
        }

        .meal-page__section-title {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .meal-page__section-desc {
          margin: 0 0 18px;
          font-size: 14px;
          line-height: 1.8;
          color: #6b7280;
        }

        .meal-page__empty {
          border-radius: 20px;
          padding: 24px;
          background: #faf8f4;
          border: 1px solid #eee8df;
          color: #8a8175;
          text-align: center;
          font-size: 15px;
        }

        .meal-page__list {
          display: grid;
          gap: 16px;
        }

        .meal-page__card {
          background: #fcfbf9;
          border: 1px solid #ece7df;
          border-radius: 24px;
          padding: 18px;
        }

        .meal-page__card-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px;
          gap: 18px;
          align-items: start;
        }

        .meal-page__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .meal-page__pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .meal-page__pill--date {
          background: #fff4e8;
          border: 1px solid #f5d2ae;
          color: #b45f06;
        }

        .meal-page__pill--done {
          background: #eaf8ef;
          border: 1px solid #bde3c9;
          color: #1f7a3d;
        }

        .meal-page__pill--pending {
          background: #fff5f5;
          border: 1px solid #f2c6c6;
          color: #b42318;
        }

        .meal-page__comment {
          font-size: 15px;
          line-height: 1.9;
          color: #1f2937;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .meal-page__feedback {
          margin-top: 14px;
          border-radius: 18px;
          padding: 14px 16px;
          background: #fff8ef;
          border: 1px solid #f1dcc0;
        }

        .meal-page__feedback-label {
          font-size: 12px;
          font-weight: 800;
          color: #b45f06;
          margin-bottom: 6px;
        }

        .meal-page__feedback-text {
          font-size: 14px;
          line-height: 1.8;
          color: #374151;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .meal-page__created {
          margin-top: 12px;
          font-size: 12px;
          color: #8a8175;
        }

        .meal-page__image-wrap {
          width: 100%;
        }

        .meal-page__image {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 18px;
          display: block;
          border: 1px solid #ece7df;
          background: #f3f4f6;
        }

        .meal-page__noimage {
          width: 100%;
          height: 180px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f4ee;
          border: 1px dashed #d7cfc3;
          color: #9a8f81;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .meal-page {
            padding: 18px 12px 38px;
          }

          .meal-page__hero,
          .meal-page__stats,
          .meal-page__list-wrap {
            border-radius: 22px;
            padding: 18px;
          }

          .meal-page__card {
            border-radius: 20px;
            padding: 14px;
          }

          .meal-page__card-grid {
            grid-template-columns: 1fr;
          }

          .meal-page__actions,
          .meal-page__stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="meal-page">
        <div className="meal-page__container">
          <section className="meal-page__hero">
            <div className="meal-page__eyebrow">Meal Management</div>
            <h1 className="meal-page__title">食事管理</h1>
            <p className="meal-page__desc">
              投稿した食事内容と、スタッフからのフィードバックを確認できます。
              毎日の積み重ねを見返しやすいよう、シンプルで見やすい画面にしています。
            </p>

            <div className="meal-page__actions">
              <Link href="/mypage/meal/new" className="meal-page__primary">
                食事を送る
              </Link>
              <Link href="/mypage" className="meal-page__secondary">
                マイページへ戻る
              </Link>
            </div>
          </section>

          <section className="meal-page__stats">
            <div className="meal-page__stats-grid">
              <div className="meal-page__stat">
                <div className="meal-page__stat-label">投稿数</div>
                <div className="meal-page__stat-value">{meals.length}</div>
              </div>

              <div className="meal-page__stat">
                <div className="meal-page__stat-label">返信済み</div>
                <div className="meal-page__stat-value">{feedbackCount}</div>
              </div>

              <div className="meal-page__stat">
                <div className="meal-page__stat-label">未返信</div>
                <div className="meal-page__stat-value">
                  {Math.max(meals.length - feedbackCount, 0)}
                </div>
              </div>
            </div>
          </section>

          <section className="meal-page__list-wrap">
            <h2 className="meal-page__section-title">投稿一覧</h2>
            <p className="meal-page__section-desc">
              新しい投稿が上に表示されます。
            </p>

            {loading ? (
              <div className="meal-page__empty">読み込み中...</div>
            ) : meals.length === 0 ? (
              <div className="meal-page__empty">
                まだ食事投稿がありません。<br />
                最初の1件を送ってみましょう。
              </div>
            ) : (
              <div className="meal-page__list">
                {meals.map((meal) => {
                  const hasFeedback = !!meal.feedback?.trim();

                  return (
                    <article key={meal.id} className="meal-page__card">
                      <div className="meal-page__card-grid">
                        <div>
                          <div className="meal-page__meta">
                            <span className="meal-page__pill meal-page__pill--date">
                              {formatDateTime(meal.created_at)}
                            </span>
                            <span
                              className={`meal-page__pill ${
                                hasFeedback
                                  ? "meal-page__pill--done"
                                  : "meal-page__pill--pending"
                              }`}
                            >
                              {hasFeedback ? "返信あり" : "未返信"}
                            </span>
                          </div>

                          <div className="meal-page__comment">
                            {meal.comment?.trim() || "コメントなし"}
                          </div>

                          {hasFeedback ? (
                            <div className="meal-page__feedback">
                              <div className="meal-page__feedback-label">
                                スタッフからのフィードバック
                              </div>
                              <div className="meal-page__feedback-text">
                                {meal.feedback}
                              </div>
                            </div>
                          ) : null}

                          <div className="meal-page__created">
                            登録日時: {formatDateTime(meal.created_at)}
                          </div>
                        </div>

                        <div className="meal-page__image-wrap">
                          {meal.image_url ? (
                            <img
                              src={meal.image_url}
                              alt="meal"
                              className="meal-page__image"
                            />
                          ) : (
                            <div className="meal-page__noimage">画像なし</div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}