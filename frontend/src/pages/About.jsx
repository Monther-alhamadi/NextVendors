import React from "react";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="container">
      <h1>{t('about.title')}</h1>
      <p>{t('about.desc')}</p>
    </div>
  );
}
