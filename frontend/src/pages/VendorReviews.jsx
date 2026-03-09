import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import CustomButton from "../components/common/CustomButton";
import Skeleton from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { getVendorReviews, replyToReview } from "../services/supplierService";
import { useToast } from "../components/common/ToastProvider";

export default function VendorReviews() {
  const { t } = useTranslation();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      const data = await getVendorReviews();
      setReviews(data || []);
      // Initialize reply text state with existing replies
      const initialReplies = {};
      data.forEach(r => {
          if (r.vendor_reply) initialReplies[r.id] = r.vendor_reply;
      });
      setReplyText(initialReplies);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(reviewId) {
    const text = replyText[reviewId];
    if (!text) return;
    
    setSubmitting(reviewId);
    try {
      await replyToReview(reviewId, text);
      toast.push({ message: t('common.save_success'), type: "success" });
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, vendor_reply: text } : r));
    } catch (e) {
      toast.push({ message: t('common.error'), type: "error" });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <PageContainer>
      <div className="reviews-page">
        <div className="page-header">
           <Link to="/supplier" className="back-link">&larr; {t('vendor.back_to_dashboard')}</Link>
           <h1>{t('vendor.manage_reviews') || "Customer Reviews"}</h1>
        </div>

        <div className="reviews-list">
          {loading ? (
             [1, 2, 3].map(i => (
               <div key={i} className="review-card-skeleton">
                 <Skeleton height="150px" />
               </div>
             ))
          ) : reviews.length === 0 ? (
             <EmptyState 
                icon="⭐"
                title={t('vendor.no_reviews') || "No Reviews Yet"}
                description={t('vendor.no_reviews_desc') || "When customers review your products, they will appear here."}
             />
          ) : (
             reviews.map((review, idx) => (
                <div key={review.id} className="review-card animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                   <div className="review-header">
                      <div className="stars">{"⭐".repeat(Math.round(review.rating))}</div>
                      <span className="date">{new Date(review.id * 1000).toLocaleDateString()}</span> {/* Mock date if missing */}
                   </div>
                   <h3 className="review-title">{review.title}</h3>
                   <p className="review-content">{review.content}</p>
                   <div className="product-ref">
                      {t('nav.products')} #{review.product_id}
                   </div>

                   <div className="reply-section">
                      <textarea 
                        placeholder={t('vendor.write_reply') || "Write your reply..."}
                        value={replyText[review.id] || ""}
                        onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                        disabled={submitting === review.id}
                      />
                      <div className="reply-actions">
                         <CustomButton 
                            size="sm" 
                            variant="primary"
                            loading={submitting === review.id}
                            onClick={() => handleReply(review.id)}
                         >
                            {review.vendor_reply ? (t('common.update') || "Update") : (t('common.send') || "Send")}
                         </CustomButton>
                      </div>
                   </div>
                </div>
             ))
          )}
        </div>
      </div>

      <style jsx>{`
        .page-header { margin-bottom: 32px; }
        .back-link { display: inline-block; margin-bottom: 12px; color: var(--primary); text-decoration: none; font-size: 0.9rem; }
        .page-header h1 { color: var(--text-main); margin: 0; }

        .reviews-list {
           display: flex;
           flex-direction: column;
           gap: 24px;
        }

        .review-card {
           background: var(--bg-card);
           border: 1px solid var(--border-light);
           border-radius: var(--radius-lg);
           padding: 24px;
           box-shadow: var(--shadow-sm);
        }

        .review-header {
           display: flex;
           justify-content: space-between;
           margin-bottom: 12px;
        }
        .stars { font-size: 1.1rem; }
        .date { font-size: 0.85rem; color: var(--text-tertiary); }

        .review-title { margin: 0 0 8px 0; font-size: 1.1rem; color: var(--text-main); }
        .review-content { color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; }

        .product-ref { font-size: 0.8rem; color: var(--accent); font-weight: 600; text-transform: uppercase; margin-bottom: 24px; }

        .reply-section {
           border-top: 1px solid var(--border-light);
           padding-top: 20px;
        }
        .reply-section textarea {
           width: 100%;
           height: 80px;
           padding: 12px;
           border-radius: var(--radius-md);
           border: 1px solid var(--border-light);
           background: var(--bg-page);
           font-family: inherit;
           resize: none;
           margin-bottom: 12px;
        }
        .reply-section textarea:focus {
           outline: none;
           border-color: var(--accent);
           box-shadow: 0 0 0 2px var(--accent-light);
        }

        .reply-actions { display: flex; justify-content: flex-end; }

        .review-card-skeleton { margin-bottom: 24px; }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </PageContainer>
  );
}
