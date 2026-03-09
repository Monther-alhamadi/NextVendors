import React, { useState } from "react";
import PageContainer from "../components/PageContainer";
import CustomButton from "../components/common/CustomButton";
import { useToast } from "../components/common/ToastProvider";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function BecomeVendor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
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
          toast.push({ 
            message: t('vendor.registration_success') || "Application submitted successfully! Waiting for approval.", 
            duration: 5000 
          });
          navigate("/profile");
      } catch (err) {
          console.error(err);
          toast.push({ 
            message: err.response?.data?.detail || t('common.error'), 
            duration: 4000 
          });
      } finally {
          setLoading(false);
      }
  }

  return (
    <PageContainer>
      <div className="become-vendor-container">
        <div className="premium-card">
          <h1>{t('vendor.become_seller') || "Become a Seller"}</h1>
          <p className="subtitle">
              {t('vendor.seller_intro') || "Join our marketplace and start selling your products today."}
          </p>
          
          <form onSubmit={handleSubmit} className="become-vendor-form">
              <div className="input-group">
                  <label>{t('vendor.store_name')} *</label>
                  <input 
                      required
                      className="premium-input"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={t('vendor.store_name_placeholder') || "e.g. Best Tech Store"}
                  />
              </div>
              
              <div className="input-group">
                  <label>{t('vendor.store_description')}</label>
                  <textarea 
                      className="premium-input textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder={t('vendor.store_description_placeholder') || "Tell us about your store..."}
                  />
              </div>

              <div className="input-group">
                  <label>{t('vendor.store_logo_url')} ({t('common.optional') || "Optional"})</label>
                  <input 
                      className="premium-input"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                      placeholder="https://example.com/logo.png"
                  />
              </div>

              <div className="input-group">
                  <label>{t('vendor.verification_document')} ({t('common.required') || "Required"})</label>
                  <input 
                      type="file"
                      className="premium-input"
                      onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const uploadData = new FormData();
                          uploadData.append("file", file);
                          try {
                              const res = await api.post("/upload-image", uploadData);
                              setFormData({...formData, verification_document_url: res.data.url});
                              toast.push({ message: t('common.upload_success') || "Uploaded!", type: "success" });
                          } catch (err) {
                              toast.push({ message: t('common.upload_error') || "Upload failed", type: "error" });
                          }
                      }}
                  />
                  {formData.verification_document_url && <p className="text-xs text-green-600 mt-1">✓ {t('common.file_selected') || "File selected"}</p>}
              </div>

              <CustomButton type="submit" loading={loading} variant="primary" className="submit-btn">
                  {t('vendor.submit_application') || "Submit Application"}
              </CustomButton>
          </form>
        </div>
      </div>

      <style jsx>{`
        .become-vendor-container {
          max-width: 600px;
          margin: 60px auto;
          padding: 0 20px;
        }
        .premium-card {
           background: var(--bg-card);
           border: 1px solid var(--border-light);
           border-radius: var(--radius-lg);
           padding: 40px;
           box-shadow: var(--shadow-md);
        }
        h1 {
           font-family: var(--font-heading);
           font-size: 2rem;
           margin-bottom: 12px;
           color: var(--text-main);
           text-align: center;
        }
        .subtitle {
           color: var(--text-secondary);
           text-align: center;
           margin-bottom: 40px;
           font-size: 1.1rem;
        }
        .become-vendor-form {
           display: flex;
           flex-direction: column;
           gap: 24px;
        }
        .input-group {
           display: flex;
           flex-direction: column;
           gap: 8px;
        }
        .input-group label {
           font-weight: 600;
           font-size: 0.9rem;
           color: var(--text-secondary);
        }
        .premium-input {
           padding: 12px 16px;
           border: 1px solid var(--border-light);
           border-radius: var(--radius-md);
           background: var(--bg-page);
           color: var(--text-main);
           font-size: 1rem;
           transition: border-color 0.2s;
        }
        .premium-input:focus {
           outline: none;
           border-color: var(--primary);
        }
        .textarea {
           height: 120px;
           resize: vertical;
        }
        :global(.submit-btn) {
           margin-top: 12px;
           width: 100%;
           height: 48px;
           font-size: 1.1rem;
        }

        @media (max-width: 480px) {
           .premium-card { padding: 24px; }
           h1 { font-size: 1.5rem; }
        }
      `}</style>
    </PageContainer>
  );
}
