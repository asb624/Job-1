import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from '../locales/en.json';
import hiTranslation from '../locales/hi.json';
import taTranslation from '../locales/ta.json';
import bnTranslation from '../locales/bn.json';
import teTranslation from '../locales/te.json';
import paTranslation from '../locales/pa.json';
import hrTranslation from '../locales/hr.json';
import mrTranslation from '../locales/mr.json';

// Determine the initial language
const getSavedLanguage = () => {
  const savedLanguage = localStorage.getItem('preferredLanguage');
  if (savedLanguage) {
    return savedLanguage;
  }
  return null;
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      hi: {
        translation: hiTranslation
      },
      ta: {
        translation: taTranslation
      },
      bn: {
        translation: bnTranslation
      },
      te: {
        translation: teTranslation
      },
      pa: {
        translation: paTranslation
      },
      hr: {
        translation: hrTranslation
      },
      mr: {
        translation: mrTranslation
      }
    },
    lng: getSavedLanguage() || 'en', // Use saved language or default to English
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;