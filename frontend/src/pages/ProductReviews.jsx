import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get(`/products/${productId}/reviews`);
        setReviews(resp.data);
      } catch (e) {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  if (loading) return <div>{t('reviews.loading')}</div>;
  if (reviews.length === 0) return <div>{t('reviews.empty')}</div>;

  return (
    <div>
      <h3>{t('reviews.title')}</h3>
      {reviews.map((r) => (
        <div
          key={r.id}
          style={{
            borderBottom: "1px solid rgba(15,23,42,0.04)",
            marginBottom: 8,
          }}
        >
          <div className="review-author">
            <b>{r.user_name}</b> - {r.rating} {t('reviews.stars')}
            {r.is_verified && (
              <span className="verified-badge" title={t('reviews.verified_purchase')}>
                ✓ {t('reviews.verified_purchase')}
              </span>
            )}
          </div>
          <div className="review-content">{r.comment}</div>
        </div>
      ))}
      <style jsx>{`
        .review-author {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }
        .verified-badge {
          font-size: 0.75rem;
          color: #10B981;
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 8px;
          border-radius: 99px;
          font-weight: 600;
        }
        .review-content {
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
