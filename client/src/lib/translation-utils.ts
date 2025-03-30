import { useState, useEffect } from "react";
import i18n from "i18next";

/**
 * Bhashini API Translation Service for Indian languages
 * Based on AI4Bharat IndicTrans Translation models
 */

// Map of language codes to their Bhashini model IDs
const bhashiniModelMap: Record<string, string> = {
  'hi': '6110f7f7014fa35d5e767c3f', // English-Hindi
  'ta': '610cfe8b014fa35d5e767c35', // English-Tamil
  'te': '6110f89b014fa35d5e767c46', // English-Telugu
  'bn': '6110f7da014fa35d5e767c3d', // English-Bengali
  'gu': '6110f7e9014fa35d5e767c3e', // English-Gujarati
  'ml': '6110f857014fa35d5e767c42', // English-Malayalam
  'mr': '6110f864014fa35d5e767c43', // English-Marathi
  'kn': '6110f814014fa35d5e767c41', // English-Kannada
  'or': '6110f871014fa35d5e767c44', // English-Odia
  'pa': '6110f87d014fa35d5e767c45', // English-Punjabi
  'as': '6110f7ce014fa35d5e767c3c', // English-Assamese
};

// Bhashini base URL
const BHASHINI_API_URL = 'https://meity-dev.ulcacontrib.org/aai4b-nmt-inference/v0/translate';

/**
 * React hook for using Bhashini translation service
 */
export function useTranslatedContent(text: string | null | undefined, language: string): string {
  const [translated, setTranslated] = useState<string>(text || '');
  
  // Language mapping for all translation services
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
    'as': 'as', // Assamese
  };

  // LibreTranslate endpoint as fallback
  const LIBRE_ENDPOINT = 'https://translate.terraprint.co';
  
  useEffect(() => {
    // If text is empty or language is English, just use the original text
    if (!text || language === 'en') {
      setTranslated(text || '');
      return;
    }
    
    // Check if the text is in our i18n files first
    if (i18n.exists(text, { lng: language })) {
      setTranslated(i18n.t(text, { lng: language }));
      return;
    }
    
    // Map the language code
    const targetLang = languageMapping[language] || language;
    if (!targetLang) {
      console.warn(`Language ${language} not supported, using original text`);
      setTranslated(text);
      return;
    }
    
    // Get the Bhashini model ID for this language
    const modelId = bhashiniModelMap[targetLang];
    if (!modelId) {
      console.warn(`No Bhashini model ID for language ${targetLang}, falling back to LibreTranslate`);
      translateWithLibreTranslate(text, targetLang);
      return;
    }
    
    console.log(`Translating via Bhashini: "${text}" to ${targetLang} (model: ${modelId})`);
    
    // Check if we have a Bhashini API key
    const bhashiniApiKey = import.meta.env.VITE_BHASHINI_API_KEY || '';
    if (!bhashiniApiKey) {
      console.warn('No Bhashini API key found, falling back to LibreTranslate');
      translateWithLibreTranslate(text, targetLang);
      return;
    }
    
    // Call Bhashini API
    fetch(BHASHINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bhashiniApiKey}`
      },
      body: JSON.stringify({
        modelId: modelId,
        task: 'translation',
        input: [{
          source: text
        }]
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Bhashini API HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.output && data.output[0] && data.output[0].target) {
        const translatedText = data.output[0].target;
        console.log(`Bhashini: "${text}" → "${translatedText}"`);
        setTranslated(translatedText);
      } else {
        console.warn('No translation returned from Bhashini, falling back to LibreTranslate');
        translateWithLibreTranslate(text, targetLang);
      }
    })
    .catch(error => {
      console.error('Bhashini translation error:', error);
      translateWithLibreTranslate(text, targetLang);
    });
    
  }, [text, language]);
  
  // Fallback to LibreTranslate
  const translateWithLibreTranslate = (text: string, targetLang: string) => {
    console.log(`Falling back to LibreTranslate for "${text}" to ${targetLang}`);
    
    fetch(`${LIBRE_ENDPOINT}/translate`, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text',
        api_key: ''
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`LibreTranslate HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.translatedText) {
        console.log(`LibreTranslate: "${text}" → "${data.translatedText}"`);
        setTranslated(data.translatedText);
      } else {
        console.warn('No translation returned from LibreTranslate, falling back to MyMemory');
        fallbackToMyMemory(text, targetLang);
      }
    })
    .catch(error => {
      console.error('LibreTranslate error:', error);
      fallbackToMyMemory(text, targetLang);
    });
  };
  
  // Final fallback to MyMemory
  const fallbackToMyMemory = (text: string, language: string) => {
    console.log(`Final fallback to MyMemory for "${text}" to ${language}`);
    const encodedText = encodeURIComponent(text);
    
    fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${language}`)
      .then(response => response.json())
      .then(data => {
        const limitReached = data?.responseStatus === 429 || 
                           (data?.responseData?.translatedText && 
                            data.responseData.translatedText.includes('MYMEMORY WARNING'));
        
        if (data?.responseData?.translatedText && !limitReached) {
          console.log(`MyMemory: "${text}" → "${data.responseData.translatedText}"`);
          setTranslated(data.responseData.translatedText);
        } else {
          console.warn('MyMemory limit reached or error, using original text');
          setTranslated(text);
        }
      })
      .catch(error => {
        console.error('MyMemory error:', error);
        setTranslated(text);
      });
  };
  
  return translated;
}