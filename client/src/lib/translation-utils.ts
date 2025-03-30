import { useState, useEffect } from "react";
import i18n from "i18next";

/**
 * Direct LibreTranslate implementation for card translations
 * Uses direct integration with LibreTranslate API for reliable translations
 * Provides fallback to MyMemory Translation API if needed
 */
export function useTranslatedContent(text: string | null | undefined, language: string): string {
  const [translated, setTranslated] = useState<string>(text || '');
  
  // Map i18next language codes to LibreTranslate codes
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

  // Most reliable LibreTranslate endpoint
  const PRIMARY_ENDPOINT = 'https://translate.argosopentech.com';
  
  // Create a direct translation function
  const directTranslate = async (text: string, targetLang: string) => {
    try {
      const response = await fetch(`${PRIMARY_ENDPOINT}/translate`, {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLang,
          format: 'text',
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Check if response is valid
      if (!response.ok) {
        throw new Error(`LibreTranslate HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.translatedText) {
        console.log(`LibreTranslate success: "${text}" → "${data.translatedText}"`);
        return data.translatedText;
      } else {
        throw new Error('No translation data returned');
      }
    } catch (error) {
      console.error('LibreTranslate error:', error);
      // If LibreTranslate fails, try MyMemory as fallback
      return fetchMyMemoryTranslation(text, targetLang);
    }
  };
  
  // Fallback to MyMemory if LibreTranslate fails
  const fetchMyMemoryTranslation = async (text: string, targetLang: string) => {
    try {
      console.log(`Falling back to MyMemory for "${text}" to ${targetLang}`);
      const encodedText = encodeURIComponent(text);
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`);
      
      if (!response.ok) {
        throw new Error(`MyMemory HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      // Check if we hit the MyMemory limit
      const limitReached = data?.responseStatus === 429 || 
                         (data?.responseData?.translatedText && 
                          data.responseData.translatedText.includes('MYMEMORY WARNING'));
      
      if (data?.responseData?.translatedText && !limitReached) {
        console.log(`MyMemory success: "${text}" → "${data.responseData.translatedText}"`);
        return data.responseData.translatedText;
      } else {
        throw new Error('MyMemory limit reached or no translation returned');
      }
    } catch (error) {
      console.error('MyMemory error:', error);
      return text; // Return original as last resort
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
    
    // Map language code for LibreTranslate
    const targetLang = languageMapping[language] || language;
    
    // If language is not supported by LibreTranslate
    if (!targetLang) {
      console.warn(`Language ${language} not supported by LibreTranslate`);
      setTranslated(text); // Use original text
      return;
    }
    
    // Perform the translation with LibreTranslate
    // Use a flag to prevent state updates after component unmount
    let isActive = true;
    
    directTranslate(text, targetLang).then(result => {
      if (isActive && result) {
        setTranslated(result);
      }
    }).catch(() => {
      // If all translation attempts fail, use original text
      if (isActive) {
        console.warn('All translation attempts failed, using original text');
        setTranslated(text);
      }
    });
    
    // Clean up
    return () => {
      isActive = false;
    };
  }, [text, language]);
  
  return translated;
}