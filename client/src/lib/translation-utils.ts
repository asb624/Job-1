import { useState, useEffect } from "react";
import i18n from "i18next";

/**
 * Pure API-based translation hook
 * This uses MyMemory Translation API for all dynamic content translations
 * No caching, no dictionaries, just direct API calls
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
    
    // Use MyMemory API for all other translations - simple GET request with no API key required
    console.log(`Translating via API: "${text}" to ${language}`);
    const encodedText = encodeURIComponent(text);
    fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${language}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.responseData && data.responseData.translatedText) {
          console.log(`API translation: "${text}" → "${data.responseData.translatedText}"`);
          setTranslated(data.responseData.translatedText);
        } else {
          console.error('Translation API returned invalid data:', data);
          // Use original if translation fails
          setTranslated(text);
        }
      })
      .catch(error => {
        console.error('Translation API error:', error);
        // Use original if API call fails
        setTranslated(text);
      });
  }, [text, language]);
  
  return translated;
}