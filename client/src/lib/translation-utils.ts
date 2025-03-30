import { useState, useEffect } from "react";
import i18n from "i18next";

/**
 * Translation hook that uses our server-side API
 * This pure version doesn't rely on hardcoded translations
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
  
  // Use our server-side translation API endpoint
  const translateText = async (text: string, targetLang: string): Promise<string> => {
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
        return data.translatedText;
      } else {
        throw new Error('No translation data returned from server');
      }
    } catch (error) {
      console.error('Server-side translation error:', error);
      
      // Return original as last resort
      return text;
    }
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