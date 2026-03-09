import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './AdminProductEdit.module.css';

export default function AdminProductImageList({ images, product, onMoveLeft, onMoveRight, onSetPrimary, onRemove }) {
  const { t } = useTranslation();

  if (!images || images.length === 0) {
    return (
      <div className={styles.emptyImages}>
        <p>{t('product.no_images', 'No images yet. Upload one below.')}</p>
      </div>
    );
  }

  return (
    <div className={styles.imageGrid}>
      {images.map((url, idx) => (
        <div key={idx} className={styles.imageCard}>
          <img src={url} alt={`${product?.name || 'Product'} ${idx + 1}`} className={styles.imageThumb} />
          <div className={styles.imageOverlay}>
            {idx > 0 && (
              <button type="button" onClick={() => onSetPrimary(idx)} title={t('product.set_primary', 'Set as primary')} className={styles.imageActionBtn}>
                <Star size={14} />
              </button>
            )}
            {idx > 0 && (
              <button type="button" onClick={() => onMoveLeft(idx)} className={styles.imageActionBtn}>
                <ChevronLeft size={14} />
              </button>
            )}
            {idx < images.length - 1 && (
              <button type="button" onClick={() => onMoveRight(idx)} className={styles.imageActionBtn}>
                <ChevronRight size={14} />
              </button>
            )}
            <button type="button" onClick={() => onRemove(idx)} className={`${styles.imageActionBtn} ${styles.imageRemoveBtn}`}>
              <X size={14} />
            </button>
          </div>
          {idx === 0 && <div className={styles.primaryBadge}>{t('product.primary', 'Primary')}</div>}
        </div>
      ))}
    </div>
  );
}
