"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MealItem = {
  id: string;
  image?: string;
  image_url?: string;
  comment?: string;
  created_at?: string;
  date?: string;
  feedback?: string;
};

function getCustomerIdFromStorage() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("gymup_mypage_customer_id") ||
    localStorage.getItem("gymup_current_customer_id") ||
    localStorage.getItem("gymup_customer_id") ||
    ""
  );
}

function getMealStorageKey(customerId: string) {
  return `gymup_meals_${customerId}`;
}

export default function MyPageMealNewPage() {
  const router = useRouter();

  const [image, setImage] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = () => {
    const customerId = getCustomerIdFromStorage();

    if (!customerId) {
      alert("顧客情報が見つかりません");
      return;
    }

    if (!image.trim() && !comment.trim()) {
      alert("画像URLかコメントを入力してください");
      return;
    }

    const newMeal: MealItem = {
      id: Date.now().toString(),
      image_url: image.trim(),
      image: image.trim(),
      comment: comment.trim(),
      created_at: new Date().toISOString(),
      date: new Date().toISOString(),
      feedback: "",
    };

    try {
      setSaving(true);

      const storageKey = getMealStorageKey(customerId);
      const existing = localStorage.getItem(storageKey);
      const meals: MealItem[] = existing ? JSON.parse(existing) : [];

      const safeMeals = Array.isArray(meals) ? meals : [];
      safeMeals.unshift(newMeal);

      localStorage.setItem(storageKey, JSON.stringify(safeMeals));

      alert("食事を登録しました");
      router.push("/mypage/meal");
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .meal-new-page {
          min-height: 100vh;
          background: #f7f7f5;
          color: #1f2937;
          padding: 24px 14px 48px;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .meal-new-page__container {
          max-width: 860px;
          margin: 0 auto;
        }

        .meal-new-page__hero,
        .meal-new-page__form-wrap,
        .meal-new-page__preview-wrap {
          background: #ffffff;
          border: 1px solid #ece7df;
          border-radius: 28px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .meal-new-page__hero {
          padding: 28px;
        }

        .meal-new-page__eyebrow {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #b7791f;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .meal-new-page__title {
          margin: 0;
          font-size: clamp(30px, 5vw, 42px);
          line-height: 1.15;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.03em;
        }

        .meal-new-page__desc {
          margin: 14px 0 0;
          font-size: 15px;
          line-height: 1.9;
          color: #6b7280;
          max-width: 680px;
        }

        .meal-new-page__hero-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .meal-new-page__primary,
        .meal-new-page__secondary,
        .meal-new-page__button,
        .meal-new-page__button-sub {
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

        .meal-new-page__primary,
        .meal-new-page__button {
          background: linear-gradient(135deg, #f08a27 0%, #ff6a00 100%);
          color: #ffffff;
          border: 1px solid rgba(240,138,39,0.35);
          box-shadow: 0 10px 24px rgba(240,138,39,0.25);
        }

        .meal-new-page__secondary,
        .meal-new-page__button-sub {
          background: #ffffff;
          color: #1f2937;
          border: 1px solid #e5dfd5;
        }

        .meal-new-page__primary:hover,
        .meal-new-page__secondary:hover,
        .meal-new-page__button:hover,
        .meal-new-page__button-sub:hover {
          transform: translateY(-1px);
        }

        .meal-new-page__form-wrap,
        .meal-new-page__preview-wrap {
          margin-top: 16px;
          padding: 22px;
        }

        .meal-new-page__section-title {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .meal-new-page__section-desc {
          margin: 0 0 18px;
          font-size: 14px;
          line-height: 1.8;
          color: #6b7280;
        }

        .meal-new-page__field {
          margin-bottom: 18px;
        }

        .meal-new-page__label {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #5b6472;
          margin-bottom: 8px;
        }

        .meal-new-page__input,
        .meal-new-page__textarea {
          width: 100%;
          box-sizing: border-box;
          border-radius: 18px;
          border: 1px solid #e7e0d6;
          background: #fcfbf9;
          color: #111827;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .meal-new-page__input {
          min-height: 52px;
          padding: 0 16px;
        }

        .meal-new-page__textarea {
          min-height: 160px;
          padding: 14px 16px;
          resize: vertical;
          line-height: 1.85;
        }

        .meal-new-page__input:focus,
        .meal-new-page__textarea:focus {
          border-color: #f0b36f;
          box-shadow: 0 0 0 3px rgba(240,138,39,0.10);
        }

        .meal-new-page__help {
          margin-top: 8px;
          font-size: 12px;
          color: #8a8175;
          line-height: 1.7;
        }

        .meal-new-page__actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 6px;
        }

        .meal-new-page__button,
        .meal-new-page__button-sub {
          cursor: pointer;
        }

        .meal-new-page__button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .meal-new-page__preview-box {
          border-radius: 22px;
          border: 1px solid #ece7df;
          background: #fcfbf9;
          padding: 16px;
        }

        .meal-new-page__preview-image {
          width: 100%;
          max-height: 360px;
          object-fit: cover;
          border-radius: 18px;
          display: block;
          border: 1px solid #ece7df;
          background: #f3f4f6;
          margin-bottom: 14px;
        }

        .meal-new-page__preview-empty {
          width: 100%;
          height: 220px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f4ee;
          border: 1px dashed #d7cfc3;
          color: #9a8f81;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .meal-new-page__preview-comment {
          font-size: 15px;
          line-height: 1.9;
          color: #1f2937;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .meal-new-page__preview-placeholder {
          color: #9a8f81;
        }

        @media (max-width: 768px) {
          .meal-new-page {
            padding: 18px 12px 38px;
          }

          .meal-new-page__hero,
          .meal-new-page__form-wrap,
          .meal-new-page__preview-wrap {
            border-radius: 22px;
            padding: 18px;
          }

          .meal-new-page__hero-actions,
          .meal-new-page__actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="meal-new-page">
        <div className="meal-new-page__container">
          <section className="meal-new-page__hero">
            <div className="meal-new-page__eyebrow">New Meal Post</div>
            <h1 className="meal-new-page__title">食事を送る</h1>
            <p className="meal-new-page__desc">
              食事内容を送信して、スタッフからのフィードバックを受け取れます。
              投稿内容はスタッフ側の食事管理と連動します。
            </p>

            <div className="meal-new-page__hero-actions">
              <Link href="/mypage/meal" className="meal-new-page__secondary">
                食事一覧へ戻る
              </Link>
              <Link href="/mypage" className="meal-new-page__primary">
                マイページへ戻る
              </Link>
            </div>
          </section>

          <section className="meal-new-page__form-wrap">
            <h2 className="meal-new-page__section-title">投稿フォーム</h2>
            <p className="meal-new-page__section-desc">
              できるだけ気軽に送れるように、入力項目はシンプルにしています。
            </p>

            <div className="meal-new-page__field">
              <label className="meal-new-page__label">画像URL</label>
              <input
                type="text"
                className="meal-new-page__input"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://〜"
              />
              <div className="meal-new-page__help">
                今は画像URL入力です。あとで画像アップロードにも変えられます。
              </div>
            </div>

            <div className="meal-new-page__field">
              <label className="meal-new-page__label">コメント</label>
              <textarea
                className="meal-new-page__textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="例：朝食でオートミール、卵、ヨーグルトを食べました。"
              />
            </div>

            <div className="meal-new-page__actions">
              <button
                type="button"
                className="meal-new-page__button-sub"
                onClick={() => {
                  setImage("");
                  setComment("");
                }}
              >
                リセット
              </button>

              <button
                type="button"
                className="meal-new-page__button"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "送信中..." : "送信する"}
              </button>
            </div>
          </section>

          <section className="meal-new-page__preview-wrap">
            <h2 className="meal-new-page__section-title">プレビュー</h2>
            <p className="meal-new-page__section-desc">
              送信前に見た目を確認できます。
            </p>

            <div className="meal-new-page__preview-box">
              {image.trim() ? (
                <img
                  src={image}
                  alt="preview"
                  className="meal-new-page__preview-image"
                />
              ) : (
                <div className="meal-new-page__preview-empty">画像プレビューなし</div>
              )}

              <div
                className={`meal-new-page__preview-comment ${
                  !comment.trim() ? "meal-new-page__preview-placeholder" : ""
                }`}
              >
                {comment.trim() || "コメントを入力するとここに表示されます。"}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}