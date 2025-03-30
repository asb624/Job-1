import { useState, useEffect } from "react";
import i18n from "i18next";

/**
 * Client-side hardcoded translations for the most common phrases
 * This provides an immediate fallback if server translations fail
 */
const FALLBACK_TRANSLATIONS: Record<string, Record<string, string>> = {
  'hi': {
    'Carpentry and Furniture Repair': 'बढ़ईगीरी और फर्नीचर मरम्मत',
    'Digital Marketing Strategy': 'डिजिटल मार्केटिंग रणनीति',
    'Electrical Installation and Repair': 'विद्युत स्थापना और मरम्मत',
    'House Cleaning Service': 'घर की सफाई सेवा',
    'Custom carpentry and furniture repair services. From simple fixes to custom-built furniture.': 'कस्टम बढ़ईगीरी और फर्नीचर मरम्मत सेवाएं। सरल मरम्मत से लेकर कस्टम निर्मित फर्नीचर तक।',
    'Comprehensive digital marketing services including SEO, content marketing, social media, and PPC campaigns.': 'SEO, कंटेंट मार्केटिंग, सोशल मीडिया, और PPC अभियानों सहित व्यापक डिजिटल मार्केटिंग सेवाएं।',
    'Licensed electrician providing safe and reliable electrical services for residential and commercial properties.': 'आवासीय और वाणिज्यिक संपत्तियों के लिए सुरक्षित और विश्वसनीय विद्युत सेवाएं प्रदान करने वाला लाइसेंस प्राप्त इलेक्ट्रीशियन।',
    'Professional house cleaning services. Regular or one-time cleaning options available.': 'पेशेवर घर की सफाई सेवाएं। नियमित या एक बार की सफाई विकल्प उपलब्ध हैं।',
  },
  'pa': {
    'Carpentry and Furniture Repair': 'ਤਰਖਾਣ ਅਤੇ ਫਰਨੀਚਰ ਦੀ ਮੁਰੰਮਤ',
    'Digital Marketing Strategy': 'ਡਿਜੀਟਲ ਮਾਰਕੀਟਿੰਗ ਰਣਨੀਤੀ',
    'Electrical Installation and Repair': 'ਇਲੈਕਟ੍ਰੀਕਲ ਇੰਸਟਾਲੇਸ਼ਨ ਅਤੇ ਮੁਰੰਮਤ',
    'House Cleaning Service': 'ਘਰ ਦੀ ਸਫਾਈ ਸੇਵਾ',
    'Custom carpentry and furniture repair services. From simple fixes to custom-built furniture.': 'ਕਸਟਮ ਤਰਖਾਣ ਅਤੇ ਫਰਨੀਚਰ ਮੁਰੰਮਤ ਸੇਵਾਵਾਂ। ਸਧਾਰਨ ਮੁਰੰਮਤਾਂ ਤੋਂ ਲੈ ਕੇ ਕਸਟਮ-ਬਣਾਏ ਫਰਨੀਚਰ ਤੱਕ।',
    'Comprehensive digital marketing services including SEO, content marketing, social media, and PPC campaigns.': 'ਵਿਆਪਕ ਡਿਜੀਟਲ ਮਾਰਕੀਟਿੰਗ ਸੇਵਾਵਾਂ ਜਿਸ ਵਿੱਚ SEO, ਸਮੱਗਰੀ ਮਾਰਕੀਟਿੰਗ, ਸੋਸ਼ਲ ਮੀਡੀਆ, ਅਤੇ PPC ਮੁਹਿੰਮਾਂ ਸ਼ਾਮਲ ਹਨ।',
    'Licensed electrician providing safe and reliable electrical services for residential and commercial properties.': 'ਲਾਇਸੰਸਸ਼ੁਦਾ ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ ਜੋ ਰਿਹਾਇਸ਼ੀ ਅਤੇ ਵਪਾਰਕ ਜਾਇਦਾਦਾਂ ਲਈ ਸੁਰੱਖਿਅਤ ਅਤੇ ਭਰੋਸੇਯੋਗ ਇਲੈਕਟ੍ਰੀਕਲ ਸੇਵਾਵਾਂ ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ।',
    'Professional house cleaning services. Regular or one-time cleaning options available.': 'ਪੇਸ਼ੇਵਰ ਘਰ ਦੀ ਸਫਾਈ ਸੇਵਾਵਾਂ। ਨਿਯਮਤ ਜਾਂ ਇੱਕ-ਵਾਰ ਦੀ ਸਫਾਈ ਦੇ ਵਿਕਲਪ ਉਪਲਬਧ ਹਨ।',
  },
  'bn': {
    'Carpentry and Furniture Repair': 'কার্পেন্ট্রি এবং আসবাবপত্র মেরামত',
    'Digital Marketing Strategy': 'ডিজিটাল মার্কেটিং কৌশল',
    'Electrical Installation and Repair': 'বৈদ্যুতিক ইনস্টলেশন এবং মেরামত',
    'House Cleaning Service': 'বাড়ি পরিষ্কারের পরিষেবা',
    'Custom carpentry and furniture repair services. From simple fixes to custom-built furniture.': 'কাস্টম কার্পেন্ট্রি এবং আসবাবপত্র মেরামত পরিষেবা। সহজ মেরামত থেকে কাস্টম-নির্মিত আসবাবপত্র পর্যন্ত।',
    'Comprehensive digital marketing services including SEO, content marketing, social media, and PPC campaigns.': 'SEO, কন্টেন্ট মার্কেটিং, সোশ্যাল মিডিয়া এবং PPC ক্যাম্পেইন সহ ব্যাপক ডিজিটাল মার্কেটিং পরিষেবা।',
    'Licensed electrician providing safe and reliable electrical services for residential and commercial properties.': 'আবাসিক এবং বাণিজ্যিক সম্পত্তির জন্য নিরাপদ এবং নির্ভরযোগ্য বৈদ্যুতিক পরিষেবা প্রদানকারী লাইসেন্সপ্রাপ্ত ইলেক্ট্রিশিয়ান।',
    'Professional house cleaning services. Regular or one-time cleaning options available.': 'পেশাদার বাড়ি পরিষ্কারের পরিষেবা। নিয়মিত বা এক-বারের পরিষ্কারের বিকল্প উপলব্ধ।',
  }
};

/**
 * Improved server-side translation hook with client-side fallbacks
 * This version uses both server API and local fallbacks for maximum reliability
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
  
  // First check client-side hardcoded translations before calling server
  const getClientSideTranslation = (text: string, lang: string): string | null => {
    if (FALLBACK_TRANSLATIONS[lang] && FALLBACK_TRANSLATIONS[lang][text]) {
      const result = FALLBACK_TRANSLATIONS[lang][text];
      console.log(`Client-side translation found: "${text}" → "${result}"`);
      return result;
    }
    return null;
  };
  
  // Use our server-side translation API endpoint as primary translation source
  const translateText = async (text: string, targetLang: string): Promise<string> => {
    // First check for client-side hardcoded translations
    const clientSideTranslation = getClientSideTranslation(text, targetLang);
    if (clientSideTranslation) {
      return clientSideTranslation;
    }
    
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
      
      // Final fallback - check again for hardcoded translations for most common phrases
      const clientSideFallback = getClientSideTranslation(text, targetLang);
      if (clientSideFallback) {
        return clientSideFallback;
      }
      
      // Return original as absolute last resort
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
    
    // Check for client-side hardcoded translations first (immediate display)
    const clientTranslation = getClientSideTranslation(text, language);
    if (clientTranslation) {
      setTranslated(clientTranslation);
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