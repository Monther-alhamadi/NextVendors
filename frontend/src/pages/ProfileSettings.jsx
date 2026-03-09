import React from "react";
import PageContainer from "../components/PageContainer";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../store/authStore";
import CustomButton from "../components/common/CustomButton";

export default function ProfileSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <PageContainer>
      <div className="settings-header">
        <Link to="/profile" className="back-link">← {t('vendor.back_to_dashboard')}</Link>
        <h1>{t('profile.settings')}</h1>
        <p className="subtitle">{t('profile.settings_desc')}</p>
      </div>

      <div className="settings-form">
        <div className="form-section">
          <h2>{t('profile.welcome_sub')}</h2>
          <div className="field">
             <label>{t('profile.member')} الاسم</label>
             <input type="text" value={user?.username || ""} readOnly />
          </div>
          <div className="field">
             <label>{t('admin.contact_email')}</label>
             <input type="email" value={user?.email || ""} readOnly />
          </div>
        </div>

        <div className="actions">
           <CustomButton variant="primary">{t('common.save')}</CustomButton>
        </div>
      </div>

      <style jsx>{`
        .settings-header {
          margin-bottom: 40px;
        }
        .back-link {
          display: block;
          margin-bottom: 16px;
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }
        h1 {
          font-family: var(--font-heading);
          color: var(--primary);
          margin-bottom: 8px;
        }
        .subtitle {
          color: var(--text-secondary);
        }
        .settings-form {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 32px;
          max-width: 600px;
          box-shadow: var(--shadow-sm);
        }
        .form-section h2 {
          font-size: 1.2rem;
          margin-bottom: 24px;
          color: var(--text-main);
        }
        .field {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .field label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        .field input {
          padding: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-medium);
          background: var(--bg-page);
          color: var(--text-tertiary);
        }
        .actions {
          margin-top: 32px;
          border-top: 1px solid var(--border-light);
          padding-top: 24px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </PageContainer>
  );
}
