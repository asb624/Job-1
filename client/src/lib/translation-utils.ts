import { useState, useEffect } from "react";
import i18n from "i18next";

/**
 * Robust multi-API translation hook with fallback strategies
 * Primary: MyMemory Translation API (free, no API key)
 * Fallback 1: LibreTranslate (public endpoints)
 * Fallback 2: Original text if all else fails
 */
export function useTranslatedContent(text: string | null | undefined, language: string): string {
  const [translated, setTranslated] = useState<string>(text || '');
  const [apiAttemptsCount, setApiAttemptsCount] = useState<number>(0);
  
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
    // Add more as needed
  };

  // List of LibreTranslate public endpoints to try
  const libreTranslateEndpoints = [
    'https://libretranslate.de',
    'https://translate.argosopentech.com',
    'https://translate.terraprint.co',
  ];
  
  // Helper function to translate with LibreTranslate
  const translateWithLibreTranslate = async (text: string, targetLang: string, endpoint: string): Promise<string> => {
    try {
      console.log(`Trying LibreTranslate at ${endpoint}`);
      const response = await fetch(`${endpoint}/translate`, {
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
      
      const data = await response.json();
      if (data && data.translatedText) {
        console.log(`LibreTranslate: "${text}" → "${data.translatedText}"`);
        return data.translatedText;
      }
      throw new Error('No translation returned');
    } catch (error) {
      console.error(`LibreTranslate error with ${endpoint}:`, error);
      throw error;
    }
  };
  
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
    
    // Reset API attempts counter when text or language changes
    setApiAttemptsCount(0);
    
    // Try primary API first (MyMemory)
    console.log(`Translating via API: "${text}" to ${language}`);
    const encodedText = encodeURIComponent(text);
    
    fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${language}`)
      .then(response => response.json())
      .then(data => {
        // Check if we hit the MyMemory limit
        const limitReached = data?.responseStatus === 429 || 
                            (data?.responseData?.translatedText && 
                             data.responseData.translatedText.includes('MYMEMORY WARNING'));
        
        if (data?.responseData?.translatedText && !limitReached) {
          console.log(`MyMemory API: "${text}" → "${data.responseData.translatedText}"`);
          setTranslated(data.responseData.translatedText);
        } else {
          // MyMemory limit reached or error, try LibreTranslate
          console.log('MyMemory limit reached or error, falling back to LibreTranslate');
          setApiAttemptsCount(prev => prev + 1);
          throw new Error('MyMemory API limit reached');
        }
      })
      .catch(error => {
        console.error('Primary translation API error:', error);
        setApiAttemptsCount(prev => prev + 1);
      });
      
  }, [text, language]);
  
  // Effect for fallback APIs
  useEffect(() => {
    // Skip if we're not needing fallback yet
    if (apiAttemptsCount === 0 || !text || language === 'en') return;
    
    // First attempt was MyMemory, now try LibreTranslate
    if (apiAttemptsCount === 1) {
      // Map the language code for LibreTranslate
      const libreLang = languageMapping[language] || language;
      
      // Check if language is supported by LibreTranslate
      if (!libreLang) {
        console.warn(`Language ${language} not supported by LibreTranslate, using original text`);
        setTranslated(text);
        return;
      }
      
      // Try each LibreTranslate endpoint
      const tryEndpoints = async () => {
        for (const endpoint of libreTranslateEndpoints) {
          try {
            const result = await translateWithLibreTranslate(text, libreLang, endpoint);
            if (result) {
              setTranslated(result);
              return; // Success, exit the loop
            }
          } catch (err) {
            // Continue to next endpoint
            console.log(`Endpoint ${endpoint} failed, trying next one...`);
          }
        }
        
        // If we get here, all LibreTranslate endpoints failed
        console.warn('All LibreTranslate endpoints failed, using original text');
        setTranslated(text);
      };
      
      tryEndpoints();
    }
  }, [apiAttemptsCount, text, language, languageMapping]);
  
  return translated;
}