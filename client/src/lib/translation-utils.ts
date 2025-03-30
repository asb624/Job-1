import { useState, useEffect } from "react";
import i18n from "i18next";

// Global translation cache to reduce API calls across components
interface TranslationCache {
  [language: string]: {
    [text: string]: string;
  };
}

const globalTranslationCache: TranslationCache = {};

// In-progress translations queue to prevent duplicate API calls
const pendingTranslations: Record<string, Promise<string>> = {};

/**
 * Translation hook that uses our server-side API with improved caching
 * and request deduplication to handle high volume
 */
export function useTranslatedContent(text: string | null | undefined, language: string): string {
  const [translated, setTranslated] = useState<string>(text || '');
  
  // Map i18next language codes to translation service codes
  const languageMapping: Record<string, string> = {
    'pa': 'pa', // Punjabi
    'hi': 'hi', // Hindi
    'ta': 'ta', // Tamil
    'te': 'te', // Telugu
    'bn': 'bn', // Bengali
    'gu': 'gu', // Gujarati
    'ml': 'ml', // Malayalam
    'mr': 'mr', // Marathi
    'kn': 'kn', // Kannada
    'or': 'or', // Odia
    // Add more as needed
  };
  
  // Get a cached translation if available
  const getCachedTranslation = (text: string, language: string): string | null => {
    return globalTranslationCache[language]?.[text] || null;
  };
  
  // Store a translation in the cache
  const cacheTranslation = (text: string, language: string, translatedText: string): void => {
    if (!globalTranslationCache[language]) {
      globalTranslationCache[language] = {};
    }
    globalTranslationCache[language][text] = translatedText;
  };
  
  // Use our server-side translation API endpoint with deduplication
  const translateText = async (text: string, targetLang: string): Promise<string> => {
    // Generate a unique key for this translation request
    const requestKey = `${text}:${targetLang}`;
    
    // If this exact translation is already in progress, reuse the promise
    if (pendingTranslations[requestKey]) {
      return pendingTranslations[requestKey];
    }
    
    // Start a new translation request
    const translationPromise = (async () => {
      try {
        console.log(`Requesting server-side translation for "${text}" to ${targetLang}`);
        
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLang })
        });
        
        if (!response.ok) {
          throw new Error(`Translation API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.translatedText) {
          console.log(`Translation success (via ${data.source}): "${text}" → "${data.translatedText}"`);
          
          // Cache the successful translation
          cacheTranslation(text, targetLang, data.translatedText);
          
          return data.translatedText;
        } else {
          throw new Error('No translation data returned from server');
        }
      } catch (error) {
        console.error('Server-side translation error:', error);
        
        // Return original as last resort
        return text;
      } finally {
        // Remove from pending translations once complete
        delete pendingTranslations[requestKey];
      }
    })();
    
    // Store in pending translations
    pendingTranslations[requestKey] = translationPromise;
    
    return translationPromise;
  };
  
  useEffect(() => {
    // If this is English or there's no text, just use the original
    if (!text || language === 'en') {
      setTranslated(text || '');
      return;
    }
    
    // First try to use i18next directly (for static texts in translation files)
    const i18nResult = i18n.exists(text, { lng: language });
    if (i18nResult) {
      setTranslated(i18n.t(text, { lng: language }));
      return;
    }
    
    // Check the global cache first
    const cachedTranslation = getCachedTranslation(text, language);
    if (cachedTranslation) {
      setTranslated(cachedTranslation);
      return;
    }
    
    // Map language code for translation API
    const targetLang = languageMapping[language] || language;
    
    // If language is not supported, use original text
    if (!targetLang) {
      console.warn(`Language ${language} not supported by translation services`);
      setTranslated(text);
      return;
    }
    
    // Prevent state updates after component unmount
    let isActive = true;
    
    // Use the server-side translation API
    translateText(text, targetLang)
      .then(result => {
        if (isActive && result) {
          setTranslated(result);
        }
      })
      .catch(() => {
        // Final fallback
        if (isActive) {
          console.warn('All translation attempts failed, using original text');
          setTranslated(text);
        }
      });
    
    // Cleanup function
    return () => {
      isActive = false;
    };
  }, [text, language]);
  
  return translated;
}

// Utility function to pre-load translations in batches
export async function preloadTranslations(texts: string[], language: string): Promise<void> {
  if (language === 'en' || !texts || texts.length === 0) return;
  
  // Filter out texts that are already cached
  const textsToTranslate = texts.filter(text => 
    text && !globalTranslationCache[language]?.[text]
  );
  
  if (textsToTranslate.length === 0) return;
  
  console.log(`Preloading ${textsToTranslate.length} translations for ${language}`);
  
  // Process in small batches to not overwhelm the translation API
  const batchSize = 3;
  for (let i = 0; i < textsToTranslate.length; i += batchSize) {
    const batch = textsToTranslate.slice(i, i + batchSize);
    
    // Process each batch in parallel
    await Promise.all(batch.map(async (text) => {
      if (!text) return;
      
      // Only translate if not already in the cache
      if (!globalTranslationCache[language]?.[text]) {
        try {
          const translated = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLang: language })
          }).then(res => res.json());
          
          if (translated?.translatedText) {
            // Store in cache
            if (!globalTranslationCache[language]) {
              globalTranslationCache[language] = {};
            }
            globalTranslationCache[language][text] = translated.translatedText;
          }
        } catch (error) {
          console.error('Batch translation error:', error);
        }
      }
    }));
    
    // Add a small delay between batches to be nice to the API
    if (i + batchSize < textsToTranslate.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}