import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X } from 'lucide-react';
import styles from './AdminProductEdit.module.css';

export default function AdminProductUpload({ uploading, uploadProgress, currentUploadFilename, onUpload, onAbort }) {
  const { t } = useTranslation();
  const fileRef = useRef(null);

  return (
    <div className={styles.uploadSection}>
      {uploading ? (
        <div className={styles.uploadProgress}>
          <div className={styles.uploadInfo}>
            <span>{currentUploadFilename || t('common.loading', 'Uploading...')}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
          </div>
          <button type="button" onClick={onAbort} className={styles.abortBtn}>
            <X size={14} /> {t('common.cancel', 'Cancel')}
          </button>
        </div>
      ) : (
        <div
          className={styles.dropZone}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={24} />
          <p>{t('product.upload_image', 'Click to upload an image')}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }}
          />
        </div>
      )}
    </div>
  );
}
