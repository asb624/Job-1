import { useState, useEffect } from "react";
import i18n from "i18next";

/**
 * Robust multi-API translation hook with fallback strategies
 * Uses a chain of free translation APIs with fallback options
 * Primary: LibreTranslate (prioritized for card translations)
 * Fallback: MyMemory Translation API
 * Final Fallback: Original text if all else fails
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
    'or': 'or', // Odia
    // Add more as needed
  };

  // List of LibreTranslate public endpoints to try (expanded with more options)
  const libreTranslateEndpoints = [
    'https://libretranslate.de',
    'https://translate.argosopentech.com',
    'https://translate.terraprint.co',
    'https://lt.vern.cc',
    'https://translate.fedilab.app',
    'https://translate.mentality.rip',
    'https://translate.astian.org',
    'https://translate.api.skitzen.com',
    'https://libretranslate.eownerdead.dedyn.io',
  ];
  
  // Helper function to translate with LibreTranslate with improved error handling
  const translateWithLibreTranslate = async (text: string, targetLang: string, endpoint: string): Promise<string> => {
    try {
      console.log(`Trying LibreTranslate at ${endpoint}`);
      
      // Use a timeout promise to abort if it takes too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${endpoint}/translate`, {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLang,
          format: 'text',
          api_key: '' // Some endpoints might require an empty key
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
    
    // Now try LibreTranslate FIRST (per user request)
    // Map the language code for LibreTranslate
    const libreLang = languageMapping[language] || language;
    
    // Check if language is supported by LibreTranslate
    if (!libreLang) {
      console.warn(`Language ${language} not supported by LibreTranslate, falling back to MyMemory`);
      setApiAttemptsCount(2); // Skip to MyMemory
    } else {
      console.log(`Translating via LibreTranslate: "${text}" to ${language} (mapped to ${libreLang})`);
      setApiAttemptsCount(1); // Trigger LibreTranslate in the fallback effect
    }
  }, [text, language]);
  
  // Effect for API translation chain
  useEffect(() => {
    // Skip if no fallback needed yet
    if (apiAttemptsCount === 0 || !text || language === 'en') return;
    
    // LibreTranslate as primary option now
    if (apiAttemptsCount === 1) {
      const libreLang = languageMapping[language] || language;
      
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
        
        // If we get here, all LibreTranslate endpoints failed, try MyMemory as fallback
        console.warn('All LibreTranslate endpoints failed, falling back to MyMemory API');
        setApiAttemptsCount(2);
      };
      
      tryEndpoints();
    }
    // Fallback to MyMemory if LibreTranslate failed
    else if (apiAttemptsCount === 2) {
      console.log(`Falling back to MyMemory API: "${text}" to ${language}`);
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
            // MyMemory limit reached or error, use original text
            console.warn('MyMemory API limit reached or error, using original text');
            setTranslated(text);
          }
        })
        .catch(error => {
          console.error('MyMemory API error:', error);
          setTranslated(text);
        });
    }
  }, [apiAttemptsCount, text, language, languageMapping]);
  
  return translated;
}