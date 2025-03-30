import { useState, useEffect } from "react";
import i18n from "i18next";

// Simple translation dictionary for common terms to use as a backup
// This avoids network issues and ensures some translations are available
const quickTranslations: Record<string, Record<string, string>> = {
  'bn': {
    'Digital Marketing Strategy': 'ডিজিটাল মার্কেটিং কৌশল',
    'Professional Web Development': 'পেশাদার ওয়েব ডেভেলপমেন্ট',
    'Graphic Design Services': 'গ্রাফিক ডিজাইন সেবা',
    'Mobile App Development': 'মোবাইল অ্যাপ ডেভেলপমেন্ট',
    'Content Writing': 'কন্টেন্ট লেখা',
    'House painting service': 'বাড়ি রং করার সেবা',
    'Website redesign needed': 'ওয়েবসাইট পুনর্নির্মাণের প্রয়োজন',
    'Looking for an experienced tutor': 'একজন অভিজ্ঞ শিক্ষকের খোঁজ করছি'
  },
  'hi': {
    'Digital Marketing Strategy': 'डिजिटल मार्केटिंग रणनीति',
    'Professional Web Development': 'पेशेवर वेब विकास',
    'Graphic Design Services': 'ग्राफिक डिजाइन सेवाएं',
    'Mobile App Development': 'मोबाइल ऐप विकास',
    'Content Writing': 'सामग्री लेखन',
    'House painting service': 'घर पेंटिंग सेवा',
    'Website redesign needed': 'वेबसाइट पुनः डिज़ाइन की आवश्यकता है',
    'Looking for an experienced tutor': 'एक अनुभवी शिक्षक की तलाश है'
  },
  'ta': {
    'Digital Marketing Strategy': 'டிஜிட்டல் மார்க்கெட்டிங் உத்தி',
    'Professional Web Development': 'தொழில்முறை இணைய உருவாக்கம்',
    'Graphic Design Services': 'கிராபிக் டிசைன் சேவைகள்',
    'Mobile App Development': 'மொபைல் ஆப் உருவாக்கம்',
    'Content Writing': 'உள்ளடக்க எழுத்து',
    'House painting service': 'வீடு வர்ணம் பூசும் சேவை',
    'Website redesign needed': 'இணையதளம் மறுவடிவமைப்பு தேவை',
    'Looking for an experienced tutor': 'அனுபவம் வாய்ந்த ஆசிரியரை தேடுகிறேன்'
  }
};

/**
 * React hook for translating content with a combined approach
 * 1. First tries i18n system
 * 2. Then uses the simple direct translation list for key phrases
 * 3. Finally tries a live API if needed and available
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
    
    // Next check our quick translations dictionary
    if (quickTranslations[language]?.[text]) {
      console.log(`Using quick translation for "${text}" → "${quickTranslations[language][text]}"`);
      setTranslated(quickTranslations[language][text]);
      return;
    }
    
    // If we got here, we don't have a pre-made translation
    console.log(`No quick translation available for "${text}" in ${language}`);
    
    // Try MyMemory API which is reliable and doesn't require an API key
    // Use directly with simple GET request
    const encodedText = encodeURIComponent(text);
    fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${language}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.responseData && data.responseData.translatedText) {
          console.log(`MyMemory translation: "${text}" → "${data.responseData.translatedText}"`);
          setTranslated(data.responseData.translatedText);
        } else {
          console.log('MyMemory API returned invalid data:', data);
          // Use original if translation fails
          setTranslated(text);
        }
      })
      .catch(error => {
        console.error('MyMemory Translation API error:', error);
        // Use original if translation fails
        setTranslated(text);
      });
  }, [text, language]);
  
  return translated;
}