import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

// Arabic namespaces
import commonAR from './locales/ar/common.json';
import authAR from './locales/ar/auth.json';
import productAR from './locales/ar/product.json';
import adminAR from './locales/ar/admin.json';
import vendorAR from './locales/ar/vendor.json';

// English namespaces
import commonEN from './locales/en/common.json';
import authEN from './locales/en/auth.json';
import productEN from './locales/en/product.json';
import adminEN from './locales/en/admin.json';
import vendorEN from './locales/en/vendor.json';

const resources = {
  ar: {
    translation: {
      ...commonAR,
      ...authAR,
      ...productAR,
      ...adminAR,
      ...vendorAR
    },
  },
  en: {
    translation: {
      ...commonEN,
      ...authEN,
      ...productEN,
      ...adminEN,
      ...vendorEN
    },
  },
};


 i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // Default language
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false // To avoid flicker/loading states for now if bundled
    }
  });

export default i18n;
