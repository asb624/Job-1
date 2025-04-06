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
import guTranslation from '../locales/gu.json';
import mlTranslation from '../locales/ml.json';
import knTranslation from '../locales/kn.json';
import orTranslation from '../locales/or.json';
import asTranslation from '../locales/as.json';
import kokTranslation from '../locales/kok.json';
import ksTranslation from '../locales/ks.json';
import sdTranslation from '../locales/sd.json';
import mniTranslation from '../locales/mni.json';
import brxTranslation from '../locales/brx.json';

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
      gu: {
        translation: guTranslation
      },
      ml: {
        translation: mlTranslation
      },
      kn: {
        translation: knTranslation
      },
      or: {
        translation: orTranslation
      },
      as: {
        translation: asTranslation
      },
      kok: {
        translation: kokTranslation
      },
      ks: {
        translation: ksTranslation
      },
      sd: {
        translation: sdTranslation
      },
      mni: {
        translation: mniTranslation
      },
      brx: {
        translation: brxTranslation
      }
    },
    lng: getSavedLanguage() || 'en', // Use saved language or default to English
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      // Explicitly prioritize localStorage over navigator
      order: ['localStorage', 'navigator'],
      // Cache the detected language preference
      caches: ['localStorage'],
      // Look for preferredLanguage in localStorage
      lookupLocalStorage: 'preferredLanguage',
    },
    // Ensure language loads synchronously to prevent flashing content
    initImmediate: false,
  });

/**
 * Helper function to forcefully switch languages
 * This ensures all parts of the app get the memo
 */
export function forceLanguageChange(languageCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Force language change started: ${languageCode}`);
      
      // First store preference in localStorage
      localStorage.setItem("preferredLanguage", languageCode);
      
      // Update HTML document language attribute
      document.documentElement.lang = languageCode;
      
      // Make sure the change sticks
      const ensureLanguageChange = () => {
        if (i18n.language !== languageCode) {
          console.log(`Language not yet changed, forcing again (current: ${i18n.language}, desired: ${languageCode})`);
          i18n.changeLanguage(languageCode);
        }
      };
      
      // Force reload resources for this language
      i18n.reloadResources(languageCode)
        .then(() => {
          // Change language after resources are reloaded
          i18n.changeLanguage(languageCode)
            .then(() => {
              console.log("Language forcefully changed to:", i18n.language);
              
              // Extra verification to make sure the change sticks
              setTimeout(ensureLanguageChange, 100);
              setTimeout(ensureLanguageChange, 300);
              
              // Force HTML lang attribute again
              document.documentElement.lang = languageCode;
              
              resolve();
            })
            .catch(reject);
        })
        .catch((err) => {
          console.error("Error reloading resources:", err);
          // Try to change language even if resource reload fails
          i18n.changeLanguage(languageCode)
            .then(() => {
              console.log("Language changed (fallback) to:", i18n.language);
              resolve();
            })
            .catch(reject);
        });
    } catch (error) {
      console.error("Failed to force language change:", error);
      reject(error);
    }
  });
}

export default i18n;