import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container">
      <h1>{t('auto_d26750', t('auto_d26750', 'لم يتم العثور على الصفحة'))}</h1>
      <p>{t('auto_d3ad41', t('auto_d3ad41', 'يبدو أن الرابط الذي زرته غير صحيح أو أن الصفحة غير موجودة.'))}</p>
      <p>
        <Link to="/">{t('auto_6f49ad', t('auto_6f49ad', 'العودة إلى الصفحة الرئيسية'))}</Link>
      </p>
    </div>
  );
}
