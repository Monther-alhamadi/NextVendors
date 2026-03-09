import React from "react";
import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <div className="container">
      <h1>{t('legal.privacy_title')}</h1>
      <p>{t('legal.privacy_desc')}</p>
    </div>
  );
}
