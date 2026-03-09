import { useTranslation } from "react-i18next";
import { useToast } from "../components/common/ToastProvider";
import api from "../services/api";
import { useState, useEffect } from "react";
import styles from "./AdminReviews.module.css";

export default function AdminReviews() {
  const { t } = useTranslation();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const res = await api.get("/reviews/all"); 
      setReviews(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if(!window.confirm(t('admin.delete_confirm'))) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(reviews.filter(r => r.id !== id));
      toast.push({ message: t('common.save_success'), type: "success" });
    } catch (e) {
      toast.push({ message: t('admin.delete_failed'), type: "error" });
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('admin.manage_reviews')}</h1>
        <p className={styles.pageSubtitle}>{t('admin.reviews_subtitle')}</p>
      </div>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}>⏳</div>
          <p className={styles.loadingText}>{t('common.loading')}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⭐</div>
          <p className={styles.emptyText}>{t('admin.no_reviews')}</p>
        </div>
      ) : (
        <div className={styles.reviewsGrid}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewInfo}>
                  <div className={styles.productName}>{review.product_name}</div>
                  <div className={styles.reviewMeta}>
                    <span>{review.user_name}</span>
                    <span>{new Date(review.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
                <div className={styles.stars}>
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              
              <p className={styles.reviewText}>{review.comment}</p>
              
              <div className={styles.reviewActions}>
                <button 
                  className={styles.deleteButton}
                  onClick={() => handleDelete(review.id)}
                >
                  {t('admin.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
