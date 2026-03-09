import React from "react";
import PageContainer from "../components/PageContainer";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import CustomButton from "../components/common/CustomButton";

export default function Addresses() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <div className="addresses-header">
        <Link to="/profile" className="back-link">← {t('vendor.back_to_dashboard')}</Link>
        <h1>{t('addresses.title')}</h1>
        <p className="subtitle">{t('profile.addresses_desc')}</p>
      </div>

      <div className="empty-state">
        <div className="icon">📍</div>
        <h2>{t('addresses.empty')}</h2>
        <p>لم تقم بإضافة أي عناوين شحن حتى الآن.</p>
        <CustomButton variant="primary">{t('addresses.add_new')}</CustomButton>
      </div>

      <style jsx>{`
        .addresses-header {
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
        .empty-state {
          background: var(--bg-card);
          border: 1px dashed var(--border-medium);
          border-radius: var(--radius-lg);
          padding: 60px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-top: 40px;
        }
        .empty-state .icon {
          font-size: 3rem;
          margin-bottom: 8px;
        }
        .empty-state h2 {
          color: var(--text-main);
          margin: 0;
        }
        .empty-state p {
          color: var(--text-tertiary);
          margin-bottom: 16px;
        }
      `}</style>
    </PageContainer>
  );
}
