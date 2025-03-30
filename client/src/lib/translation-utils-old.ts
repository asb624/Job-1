import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// Language code mapping for translation API
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

// Translation cache to minimize API calls
interface TranslationCache {
  [key: string]: {
    [key: string]: string;
  };
}

const translationCache: TranslationCache = {
  // We'll keep all the existing translations here
};

/**
 * Translates content based on the current language using a combination of caching and API calls
 */
export function translateContent(text: string | null | undefined, language: string): string {
  if (!text) return '';
  
  // Only try to translate for non-English languages
  if (language === 'en') {
    return text;
  }
  
  // Check if we have a cached translation
  if (translationCache[language]?.[text]) {
    return translationCache[language][text];
  }
  
  // If this language doesn't have a cache object yet, create one
  if (!translationCache[language]) {
    translationCache[language] = {};
  }
  
  // Check if we can find a translation in another language we might have
  // This is just a fallback strategy for critical UI elements
  if (text.length < 50) { // Only try this for short strings like titles, categories, etc.
    const availableLanguages = Object.keys(translationCache);
    for (const lang of availableLanguages) {
      if (lang !== 'en' && lang !== language && translationCache[lang][text]) {
        // We found this text translated in another language, might be better than nothing
        console.log(`Using ${lang} translation for ${text} as fallback for ${language}`);
        return translationCache[lang][text];
      }
    }
  }
  
  // For now, return the original text if no translation is found in cache
  // The async version translateTextAsync will fetch from the API
  return text;
}

/**
 * React hook for translating content with proper handling of async translations
 * and ensuring components re-render when translations become available
 */
export function useTranslatedContent(text: string | null | undefined, language: string): string {
  const [translated, setTranslated] = useState<string>(text || '');
  
  useEffect(() => {
    // Use the immediate cache translation if available
    const immediateResult = translateContent(text, language);
    setTranslated(immediateResult);
    
    // Only make async request if needed
    if (text && language !== 'en' && immediateResult === text) {
      // If the synchronous function returned the original text, we need to fetch the translation
      translateTextAsync(text, language)
        .then(result => {
          if (result !== text) {
            setTranslated(result);
          }
        })
        .catch(err => {
          console.error('Error translating text:', err);
        });
    }
  }, [text, language]);
  
  return translated;
}

/**
 * Function to translate text asynchronously using a translation API
 */
export async function translateTextAsync(text: string, targetLanguage: string): Promise<string> {
  // Return original text for English or if text is empty
  if (targetLanguage === 'en' || !text) {
    return text;
  }
  
  // Check cache first
  if (translationCache[targetLanguage]?.[text]) {
    return translationCache[targetLanguage][text];
  }
  
  // We'll use Google Translate API as it has better support for Indian languages
  // First, we'll try the alternative API that has better support for Indian languages
  try {
    // For certain languages that have issues with LibreTranslate, let's try a different approach
    // This will help with Gujarati, Telugu, Malayalam, Kannada, Odia, etc.
    if (['gu', 'te', 'ml', 'kn', 'or', 'as', 'kok', 'ks', 'sd', 'mni', 'brx'].includes(targetLanguage)) {
      // We'll use a more reliable API for these languages
      const API_URL = 'https://libretranslate.de/translate';
      
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLanguage,
          format: 'text',
          api_key: ''  // Free API tier
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          // Store result in cache
          if (!translationCache[targetLanguage]) {
            translationCache[targetLanguage] = {};
          }
          translationCache[targetLanguage][text] = data.translatedText;
          return data.translatedText;
        }
      }
      
      // If that fails, we'll fall through to the original API
      console.log(`Alternative API failed for ${targetLanguage}, trying original API...`);
    }
    
    // Primary API - LibreTranslate
    const API_URL = 'https://translate.argosopentech.com/translate';
    
    // Check if this language is supported by the API
    const apiLanguageCode = languageCodeMap[targetLanguage];
    
    // Some languages might not be supported by the API
    if (!apiLanguageCode) {
      console.warn(`Language ${targetLanguage} not found in supported API languages, using fallback mechanism`);
      
      // Try to find a similar language that is supported
      // For example, for Odia (or) we might use Hindi (hi)
      const fallbackMap: Record<string, string> = {
        'or': 'hi',  // Odia -> Hindi
        'kok': 'mr', // Konkani -> Marathi
        'as': 'bn',  // Assamese -> Bengali
        'brx': 'hi', // Bodo -> Hindi
        'ks': 'hi',  // Kashmiri -> Hindi
        'sd': 'hi',  // Sindhi -> Hindi
        'mni': 'hi'  // Manipuri -> Hindi
      };
      
      const fallbackLanguage = fallbackMap[targetLanguage];
      if (fallbackLanguage) {
        console.log(`Using ${fallbackLanguage} as fallback translation for ${targetLanguage}`);
        // Recursive call with fallback language
        const fallbackResult = await translateTextAsync(text, fallbackLanguage);
        
        // Store in original language cache too
        if (!translationCache[targetLanguage]) {
          translationCache[targetLanguage] = {};
        }
        translationCache[targetLanguage][text] = fallbackResult;
        return fallbackResult;
      }
      
      return text; // If no fallback, return original
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: apiLanguageCode,
        format: 'text'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Translation API error');
    }
    
    const data = await response.json();
    const translatedText = data.translatedText;
    
    // Store the result in cache for future use
    if (!translationCache[targetLanguage]) {
      translationCache[targetLanguage] = {};
    }
    translationCache[targetLanguage][text] = translatedText;
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    
    // Try more aggressive fallback mechanisms
    // See if we have this text in any other Indian language, as cross-language similarities might help
    const indianLanguages = ['hi', 'bn', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'mr', 'or'];
    for (const lang of indianLanguages) {
      if (lang !== targetLanguage && translationCache[lang]?.[text]) {
        console.log(`Using ${lang} translation as fallback for ${targetLanguage}`);
        // Store in cache for next time
        if (!translationCache[targetLanguage]) {
          translationCache[targetLanguage] = {};
        }
        translationCache[targetLanguage][text] = translationCache[lang][text];
        return translationCache[lang][text];
      }
    }
    
    // If API call fails and no cache found, return the original text
    return text;
  }
}

/**
 * React hook for translating content
 * Caches translations for better performance
 */
export function useTranslation() {
  const { toast } = useToast();
  const [hasShownError, setHasShownError] = useState<boolean>(false);
  
  useEffect(() => {
    // Reset error flag when component remounts
    return () => setHasShownError(false);
  }, []);
  
  const translate = async (text: string | null | undefined, language: string): Promise<string> => {
    if (!text) return '';
    
    try {
      return await translateTextAsync(text, language);
    } catch (error) {
      // Only show toast once per session to avoid spamming user
      if (!hasShownError) {
        toast({
          title: "Translation Service Notice",
          description: "Using cached translations. Some content may appear in English.",
          variant: "default",
          duration: 5000
        });
        setHasShownError(true);
      }
      
      // Log the error but don't disrupt user experience
      console.error('Translation error:', error);
      
      // Return original text when translation fails
      return text || '';
    }
  };
  
  // Add helper to pre-warm the cache with bulk translations
  const preloadTranslations = async (texts: string[], language: string): Promise<void> => {
    if (language === 'en') return;
    
    // Filter only texts that aren't in the cache already
    const textsToTranslate = texts.filter(text => 
      text && text.length > 0 && !translationCache[language]?.[text]
    );
    
    if (textsToTranslate.length === 0) return;
    
    // Translate in small batches to avoid API limitations
    // This is done silently in the background
    const batchSize = 5;
    for (let i = 0; i < textsToTranslate.length; i += batchSize) {
      const batch = textsToTranslate.slice(i, i + batchSize);
      await Promise.all(batch.map(text => translateTextAsync(text, language).catch(err => {
        console.error('Batch translation error:', err);
        return text;
      })));
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < textsToTranslate.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  };
  
  return { 
    translate,
    preloadTranslations
  };
}