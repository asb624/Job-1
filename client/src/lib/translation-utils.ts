import { useToast } from "@/hooks/use-toast";

// Translation cache to minimize API calls
interface TranslationCache {
  [key: string]: {
    [key: string]: string;
  };
}

const translationCache: TranslationCache = {
  'bn': {
    // Pre-filled common translations for Bengali
    'Cook': 'রাঁধুনি',
    'Housemaid': 'গৃহপরিচারিকা',
    'Career Counseling Services': 'ক্যারিয়ার কাউন্সেলিং সেবা',
    'Science Tutor for School Students': 'স্কুল ছাত্রদের জন্য বিজ্ঞান শিক্ষক',
    'Computer Programming Coach': 'কম্পিউটার প্রোগ্রামিং কোচ',
    'English Language Teacher': 'ইংরেজি ভাষা শিক্ষক',
    'Education Services': 'শিক্ষা সেবা',
    'Household Work': 'গৃহস্থালি কাজ'
  },
  'pa': {
    // Pre-filled common translations for Punjabi
    'Cook': 'ਰਸੋਈਆ',
    'Housemaid': 'ਘਰੇਲੂ ਨੌਕਰਾਨੀ',
    'Career Counseling Services': 'ਕਰੀਅਰ ਕਾਉਂਸਲਿੰਗ ਸੇਵਾਵਾਂ',
    'Science Tutor for School Students': 'ਸਕੂਲ ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਵਿਗਿਆਨ ਅਧਿਆਪਕ',
    'Computer Programming Coach': 'ਕੰਪਿਊਟਰ ਪ੍ਰੋਗਰਾਮਿੰਗ ਕੋਚ',
    'English Language Teacher': 'ਅੰਗਰੇਜ਼ੀ ਭਾਸ਼ਾ ਅਧਿਆਪਕ',
    'Education Services': 'ਸਿੱਖਿਆ ਸੇਵਾਵਾਂ',
    'Household Work': 'ਘਰੇਲੂ ਕੰਮ'
  },
  'hi': {
    // Pre-filled common translations for Hindi
    'Cook': 'रसोइया',
    'Housemaid': 'घरेलू नौकरानी',
    'Career Counseling Services': 'करियर परामर्श सेवाएं',
    'Science Tutor for School Students': 'स्कूली छात्रों के लिए विज्ञान शिक्षक',
    'Computer Programming Coach': 'कंप्यूटर प्रोग्रामिंग कोच',
    'English Language Teacher': 'अंग्रेजी भाषा शिक्षक',
    'Education Services': 'शिक्षा सेवाएं',
    'Household Work': 'घरेलू काम'
  },
  'ta': {
    // Pre-filled common translations for Tamil
    'Cook': 'சமையல்காரர்',
    'Housemaid': 'வீட்டு வேலைக்காரி',
    'Career Counseling Services': 'தொழில் ஆலோசனை சேவைகள்',
    'Science Tutor for School Students': 'பள்ளி மாணவர்களுக்கான அறிவியல் ஆசிரியர்',
    'Computer Programming Coach': 'கணினி நிரலாக்க பயிற்சியாளர்',
    'English Language Teacher': 'ஆங்கில மொழி ஆசிரியர்',
    'Education Services': 'கல்வி சேவைகள்',
    'Household Work': 'வீட்டு வேலை'
  }
};

// Language codes map for LibreTranslate
const languageCodeMap: Record<string, string> = {
  'en': 'en',
  'hi': 'hi',
  'ta': 'ta',
  'bn': 'bn',
  'pa': 'pa'
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
  
  // For now, return the original text if no translation is found in cache
  // In a production app, this would make an API call to translate the text
  return text;
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
  
  try {
    // In a production app, this would call an actual translation API
    // For now, we're simulating a successful API response using our pre-filled cache
    
    // If we had an API, the code would look something like this:
    /*
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: languageCodeMap[targetLanguage] || 'en',
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
    */
    
    // For demonstration, just return the original text
    // and store it in cache for future use
    if (!translationCache[targetLanguage]) {
      translationCache[targetLanguage] = {};
    }
    
    // In a real implementation, store the API result in cache
    translationCache[targetLanguage][text] = text;
    
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;  // Return original text on error
  }
}

/**
 * React hook for translating content
 * Caches translations for better performance
 */
export function useTranslation() {
  const { toast } = useToast();
  
  const translate = async (text: string | null | undefined, language: string): Promise<string> => {
    if (!text) return '';
    
    try {
      return await translateTextAsync(text, language);
    } catch (error) {
      toast({
        title: "Translation Error",
        description: "Unable to translate content",
        variant: "destructive"
      });
      return text || '';
    }
  };
  
  return { translate };
}