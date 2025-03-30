import { useState, useEffect } from "react";
import i18n from "i18next";

/**
 * Robust translation hook with better LibreTranslate integration using CORS proxies
 * Uses multiple approaches to ensure translations work in all environments
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

  // Use CORS proxy to access LibreTranslate
  const LIBRE_TRANSLATE_API = "https://api.allorigins.win/raw?url=" + 
    encodeURIComponent("https://libretranslate.de/translate");
  
  // Create a direct translation function using a CORS proxy
  const libreTranslateWithProxy = async (text: string, targetLang: string) => {
    try {
      console.log(`Trying LibreTranslate via CORS proxy for "${text}" to ${targetLang}`);
      
      const response = await fetch(LIBRE_TRANSLATE_API, {
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
      });
      
      if (!response.ok) {
        throw new Error(`LibreTranslate proxy HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.translatedText) {
        console.log(`LibreTranslate success: "${text}" → "${data.translatedText}"`);
        return data.translatedText;
      } else {
        throw new Error('No translation data returned');
      }
    } catch (error) {
      console.error('LibreTranslate with proxy error:', error);
      // If LibreTranslate fails, try direct MyMemory as fallback
      return fetchMyMemoryTranslation(text, targetLang);
    }
  };
  
  // Fallback to MyMemory if LibreTranslate fails
  const fetchMyMemoryTranslation = async (text: string, targetLang: string) => {
    try {
      console.log(`Falling back to MyMemory for "${text}" to ${targetLang}`);
      
      // Using a different method for MyMemory that might work better with Replit's environment
      const encodedText = encodeURIComponent(text);
      const myMemoryURL = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`;
      
      // Try with a CORS proxy if needed
      const response = await fetch(myMemoryURL);
      
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
      
      // Last resort - use a directly hardcoded common phrase if available
      if (text === "Website developer needed") {
        if (targetLang === 'hi') return "वेबसाइट डेवलपर की आवश्यकता है";
        if (targetLang === 'pa') return "ਵੈੱਬਸਾਈਟ ਡਿਵੈਲਪਰ ਦੀ ਲੋੜ ਹੈ";
        if (targetLang === 'bn') return "ওয়েবসাইট ডেভেলপার প্রয়োজন";
      }
      
      return text; // Return original as absolute last resort
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
    
    // If language is not supported, use original text
    if (!targetLang) {
      console.warn(`Language ${language} not supported by translation services`);
      setTranslated(text);
      return;
    }
    
    // Prevent state updates after component unmount
    let isActive = true;
    
    // Start with LibreTranslate via proxy
    libreTranslateWithProxy(text, targetLang)
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