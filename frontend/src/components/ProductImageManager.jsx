import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from './common/ToastProvider';
import CustomButton from './common/CustomButton';
import api from '../services/api';

/**
 * ProductImageManager
 * Allows uploading multiple images, setting one as primary, and deleting them.
 * Props:
 *  - images: Array of {url: string, is_primary: boolean}
 *  - onChange: callback(newImages)
 */
export default function ProductImageManager({ images = [], onChange }) {
  const { t } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    const newImages = [...images];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post('/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const url = response.data.url;
        // If this is the first image, make it primary
        const isPrimary = newImages.length === 0;
        newImages.push({ url, is_primary: isPrimary });
      } catch (error) {
        console.error("Upload failed", error);
        toast.push({ message: t('error.upload_failed') || "Failed to upload image", type: 'error' });
      }
    }

    setUploading(false);
    onChange(newImages);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    // If we removed the primary, pick a new one
    if (images[index]?.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    onChange(newImages);
  };

  const setPrimary = (index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    onChange(newImages);
  };

  return (
    <div className="image-manager-container">
      <div className="image-grid">
        {images.map((img, idx) => (
          <div key={idx} className={`image-card ${img.is_primary ? 'primary' : ''}`}>
            <img src={img.url} alt={`Product ${idx}`} />
            <div className="image-overlay">
              {!img.is_primary && (
                <button type="button" className="action-btn primary-btn" onClick={() => setPrimary(idx)}>
                  {t('product.set_primary') || "⭐"}
                </button>
              )}
              <button type="button" className="action-btn delete-btn" onClick={() => removeImage(idx)}>
                {t('common.delete') || "🗑️"}
              </button>
            </div>
            {img.is_primary && <div className="primary-badge">{t('product.main_image') || "Primary"}</div>}
          </div>
        ))}
        
        <div className="add-image-card" onClick={() => fileInputRef.current?.click()}>
          {uploading ? (
            <div className="spinner"></div>
          ) : (
            <>
              <span className="plus">+</span>
              <span className="label">{t('product.add_image') || "Add Image"}</span>
            </>
          )}
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        multiple 
        onChange={handleFileChange}
      />

      <style jsx>{`
        .image-manager-container { margin-top: 16px; }
        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 16px;
        }
        .image-card, .add-image-card {
          aspect-ratio: 1/1;
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        .image-card.primary { border-color: var(--primary); }
        .image-card img { width: 100%; height: 100%; object-fit: cover; }
        
        .image-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .image-card:hover .image-overlay { opacity: 1; }
        
        .action-btn {
          background: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.1s;
        }
        .action-btn:hover { transform: scale(1.1); }
        .delete-btn { color: var(--danger); }
        .primary-btn { color: #f59e0b; }
        
        .primary-badge {
          position: absolute;
          top: 8px; left: 8px;
          background: var(--primary);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .add-image-card {
          background: var(--bg-page);
          border: 2px dashed var(--border-medium);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-tertiary);
        }
        .add-image-card:hover { 
          border-color: var(--primary); 
          color: var(--primary);
          background: var(--bg-card);
        }
        .add-image-card .plus { font-size: 2rem; margin-bottom: 4px; }
        .add-image-card .label { font-size: 0.8rem; font-weight: 600; }

        .spinner {
          width: 24px; height: 24px;
          border: 3px solid var(--border-light);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
