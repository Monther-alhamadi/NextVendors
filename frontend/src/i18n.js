import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

// Import translation files directly for bundling (simpler for now)
import translationAR from './locales/ar/translation.json';
import translationEN from './locales/en/translation.json';

const resources = {
  ar: {
    translation: translationAR,
  },
  en: {
    translation: translationEN,
  },
};

console.log('Loaded AR Resources:', translationAR);
console.log('Loaded Admin Block:', translationAR?.admin);


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
