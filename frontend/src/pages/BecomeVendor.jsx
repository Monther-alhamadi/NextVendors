import React, { useState } from "react";
import PageContainer from "../components/PageContainer";
import CustomButton from "../components/common/CustomButton";
import { useToast } from "../components/common/ToastProvider";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function BecomeVendor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
      name: "",
      description: "",
      logo_url: "",
      verification_document_url: ""
  });

  async function handleSubmit(e) {
      e.preventDefault();
      setLoading(true);
      try {
          await api.post("/vendors/register", formData);
          setSubmitted(true);
      } catch (err) {
          console.error(err);
          const detail = err.response?.data?.detail;
          if (detail === "User already has a vendor profile") {
            toast.push({ message: t('vendor.already_registered'), duration: 4000 });
          } else {
            toast.push({ 
              message: detail || t('common.error'), 
              duration: 4000 
            });
          }
      } finally {
          setLoading(false);
      }
  }

  // ── Success State ──
  if (submitted) {
    return (
      <PageContainer>
        <div className="bv-container">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h1>{t('vendor.application_submitted_title')}</h1>
            <p className="success-desc">{t('vendor.application_submitted_desc')}</p>
            <div className="timeline-badge">
              <span>⏱</span> {t('vendor.review_timeline')}
            </div>
            <Link to="/profile">
              <CustomButton variant="primary" className="back-btn">
                {t('vendor.back_to_profile')}
              </CustomButton>
            </Link>
          </div>
        </div>
        <style>{successStyles}</style>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="bv-container">
        {/* ── Benefits Section ── */}
        <div className="benefits-row">
          {[1, 2, 3].map(i => (
            <div className="benefit-card" key={i}>
              <div className="benefit-icon">{i === 1 ? '🌍' : i === 2 ? '🛠️' : '🤝'}</div>
              <h3>{t(`vendor.benefit_${i}_title`)}</h3>
              <p>{t(`vendor.benefit_${i}_desc`)}</p>
            </div>
          ))}
        </div>

        {/* ── Main Form Card ── */}
        <div className="form-card">
          <div className="form-header">
            <h1>{t('vendor.become_seller')}</h1>
            <p className="subtitle">{t('vendor.seller_intro')}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="vendor-form">
            {/* ── Section: Store Info ── */}
            <div className="section-label">
              <span className="section-num">1</span>
              <span>{t('vendor.form_section_store')}</span>
            </div>

            <div className="field-group">
              <label>{t('vendor.store_name')} <span className="req">*</span></label>
              <input 
                required
                className="field-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={t('vendor.store_name_placeholder')}
              />
              <span className="field-hint">{t('vendor.store_name_hint')}</span>
            </div>

            <div className="field-group">
              <label>{t('vendor.store_description')}</label>
              <textarea 
                className="field-input field-textarea"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder={t('vendor.store_description_placeholder')}
              />
              <span className="field-hint">{t('vendor.store_description_hint')}</span>
            </div>

            <div className="field-group">
              <label>{t('vendor.store_logo_url')} <span className="opt">({t('common.optional')})</span></label>
              <input 
                type="file"
                accept="image/*"
                className="field-input field-file"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const uploadData = new FormData();
                  uploadData.append("file", file);
                  try {
                    const res = await api.post("/upload-image", uploadData);
                    setFormData({...formData, logo_url: res.data.url});
                    toast.push({ message: t('common.upload_success'), type: "success" });
                  } catch {
                    toast.push({ message: t('common.upload_error'), type: "error" });
                  }
                }}
              />
              <span className="field-hint">{t('vendor.store_logo_hint')}</span>
              {formData.logo_url && <span className="upload-ok">✓ {t('common.file_selected')}</span>}
            </div>

            {/* ── Section: Verification ── */}
            <div className="section-label">
              <span className="section-num">2</span>
              <span>{t('vendor.form_section_docs')}</span>
            </div>

            <div className="field-group">
              <label>{t('vendor.verification_document')} <span className="req">*</span></label>
              <input 
                type="file"
                className="field-input field-file"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const uploadData = new FormData();
                  uploadData.append("file", file);
                  try {
                    const res = await api.post("/upload-image", uploadData);
                    setFormData({...formData, verification_document_url: res.data.url});
                    toast.push({ message: t('common.upload_success'), type: "success" });
                  } catch {
                    toast.push({ message: t('common.upload_error'), type: "error" });
                  }
                }}
              />
              <span className="field-hint">{t('vendor.verification_document_hint')}</span>
              {formData.verification_document_url && <span className="upload-ok">✓ {t('common.file_selected')}</span>}
            </div>

            <CustomButton type="submit" loading={loading} variant="primary" className="submit-btn">
              {t('vendor.submit_application')}
            </CustomButton>
          </form>
        </div>
      </div>

      <style>{formStyles}</style>
    </PageContainer>
  );
}

const formStyles = `
.bv-container {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 20px;
}

/* ── Benefits ── */
.benefits-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.benefit-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg, 12px);
  padding: 24px 20px;
  text-align: center;
  transition: all 0.2s;
}
.benefit-card:hover {
  border-color: var(--primary, #4f46e5);
  box-shadow: 0 8px 24px -8px rgba(79, 70, 229, 0.15);
  transform: translateY(-2px);
}
.benefit-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}
.benefit-card h3 {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  margin: 0 0 6px;
  color: var(--text-main);
}
.benefit-card p {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* ── Form Card ── */
.form-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl, 16px);
  padding: 40px;
  box-shadow: 0 4px 20px -4px rgba(0,0,0,0.08);
}
.form-header {
  text-align: center;
  margin-bottom: 36px;
}
.form-header h1 {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  color: var(--primary, #4f46e5);
  margin: 0 0 10px;
}
.form-header .subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 500px;
  margin: 0 auto;
}

/* ── Section Label ── */
.section-label {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 32px 0 20px;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-main);
  font-family: var(--font-heading);
}
.section-label:first-of-type { margin-top: 0; }
.section-num {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: var(--primary, #4f46e5);
  color: white;
  border-radius: 50%;
  font-size: 0.82rem;
  font-weight: 800;
  flex-shrink: 0;
}

/* ── Fields ── */
.vendor-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}
.field-group label {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--text-main);
}
.field-group .req { color: #ef4444; }
.field-group .opt { color: var(--text-tertiary, #9ca3af); font-weight: 400; font-size: 0.82rem; }
.field-input {
  padding: 12px 16px;
  border: 1.5px solid var(--border-light, #e5e7eb);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-page, #f9fafb);
  color: var(--text-main);
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
.field-input:focus {
  outline: none;
  border-color: var(--primary, #4f46e5);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}
.field-textarea {
  height: 110px;
  resize: vertical;
}
.field-file {
  padding: 10px;
  cursor: pointer;
}
.field-hint {
  font-size: 0.78rem;
  color: var(--text-tertiary, #9ca3af);
  line-height: 1.4;
}
.upload-ok {
  font-size: 0.82rem;
  color: #10b981;
  font-weight: 600;
}

/* ── Submit ── */
:global(.submit-btn) {
  margin-top: 24px;
  width: 100%;
  height: 50px;
  font-size: 1.05rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .benefits-row { grid-template-columns: 1fr; }
  .form-card { padding: 24px; }
  .form-header h1 { font-size: 1.4rem; }
}
`;

const successStyles = `
.bv-container {
  max-width: 560px;
  margin: 80px auto;
  padding: 0 20px;
}
.success-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl, 16px);
  padding: 48px 40px;
  text-align: center;
  box-shadow: 0 4px 20px -4px rgba(0,0,0,0.08);
}
.success-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
}
.success-card h1 {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  color: var(--primary, #4f46e5);
  margin: 0 0 16px;
}
.success-desc {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.7;
  margin: 0 0 24px;
}
.timeline-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ecfdf5;
  color: #065f46;
  padding: 10px 20px;
  border-radius: var(--radius-full, 100px);
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 32px;
}
:global(.back-btn) {
  min-width: 200px;
}
@media (max-width: 480px) {
  .success-card { padding: 32px 24px; }
  .success-card h1 { font-size: 1.3rem; }
}
`;
