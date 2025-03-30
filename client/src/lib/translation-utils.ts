import { useState, useEffect } from "react";
import i18n from "i18next";

// Simple translation cache to store translations we've already fetched
interface TranslationCache {
  [key: string]: {
    [key: string]: string;
  };
}

const translationCache: TranslationCache = {};

// Language code mapping for LibreTranslate
const languageCodeMap: Record<string, string> = {
  'en': 'en',
  'hi': 'hi',
  'bn': 'bn',
  'gu': 'gu',
  'kn': 'kn',
  'ml': 'ml',
  'mr': 'mr',
  'ta': 'ta',
  'te': 'te',
  'pa': 'pa',
  'hr': 'hr',
};

/**
 * Simple translation function that returns the original text
 * For dynamic content that isn't in the i18n system
 */
export function translateContent(text: string | null | undefined, language: string): string {
  if (!text) return '';
  
  // If we're requesting English or there's no text, just return as-is
  if (language === 'en') {
    return text;
  }
  
  // Check if we have a cached translation
  if (translationCache[language]?.[text]) {
    return translationCache[language][text];
  }
  
  // Otherwise return the original (translations happen asynchronously)
  return text;
}

/**
 * React hook for translating content with proper handling of async translations
 * and ensuring components re-render when translations become available
 */
export function useTranslatedContent(text: string | null | undefined, language: string): string {
  const [translated, setTranslated] = useState<string>(text || '');
  
  useEffect(() => {
    // If this is English or there's no text, just return the original
    if (!text || language === 'en') {
      setTranslated(text || '');
      return;
    }
    
    // First try to use i18next directly (for static texts that are in our translation files)
    const i18nResult = i18n.exists(text, { lng: language });
    if (i18nResult) {
      setTranslated(i18n.t(text, { lng: language }));
      return;
    }
    
    // Use any cached translation if available
    const cachedTranslation = translationCache[language]?.[text];
    if (cachedTranslation) {
      setTranslated(cachedTranslation);
      return;
    }
    
    // Skip LibreTranslate and go directly to Argos which is more reliable
    // Map our language code to what the API expects
    const targetLang = languageCodeMap[language] || language;
    
    console.log(`Translating text: "${text}" from English to ${targetLang}`);
    
    // Use this API directly - more reliable and fewer CORS issues
    fetch('https://translate.argosopentech.com/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        console.error('Translation API error status:', response.status);
        throw new Error('Translation API error');
      }
      return response.json();
    })
    .then(data => {
      console.log('Translation API success response:', data);
      const translatedText = data.translatedText;
      
      // Store in cache for future use
      if (!translationCache[language]) {
        translationCache[language] = {};
      }
      translationCache[language][text] = translatedText;
      
      console.log(`Translation result: "${text}" → "${translatedText}"`);
      setTranslated(translatedText);
    })
    .catch(error => {
      console.error('Translation API error:', error);
      // If API call fails, just use the original text
      setTranslated(text);
    });
    
  }, [text, language]);
  
  return translated;
}