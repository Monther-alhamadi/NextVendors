import React from "react";
import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();
  return (
    <div className="container">
      <h1>{t('legal.terms_title')}</h1>
      <p>{t('legal.terms_desc')}</p>
    </div>
  );
}
