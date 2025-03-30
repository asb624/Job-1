import { useState, useEffect } from "react";
import i18n from "i18next";

/**
 * Simple direct translation function using LibreTranslate API
 * No caching, just straight live translation
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
    
    // Direct LibreTranslate API call with no caching
    console.log(`Directly translating: "${text}" to ${language}`);
    
    // Try LibreTranslate API first
    fetch('https://libretranslate.de/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: language,
        format: 'text',
        api_key: '' // This instance doesn't require an API key
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('LibreTranslate API error');
      }
      return response.json();
    })
    .then(data => {
      console.log('LibreTranslate success:', data);
      const translatedText = data.translatedText;
      console.log(`Translation result: "${text}" → "${translatedText}"`);
      setTranslated(translatedText);
    })
    .catch(error => {
      console.error('LibreTranslate error:', error);
      
      // Fallback to Argos Translate API
      console.log(`Trying Argos API for: "${text}" to ${language}`);
      fetch('https://translate.argosopentech.com/translate', {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: language,
          format: 'text'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Argos API error');
        }
        return response.json();
      })
      .then(data => {
        console.log('Argos API success:', data);
        const translatedText = data.translatedText;
        console.log(`Argos translation: "${text}" → "${translatedText}"`);
        setTranslated(translatedText);
      })
      .catch(fallbackError => {
        console.error('All translation APIs failed:', fallbackError);
        // Just use the original text if both APIs fail
        setTranslated(text);
      });
    });
  }, [text, language]);
  
  return translated;
}