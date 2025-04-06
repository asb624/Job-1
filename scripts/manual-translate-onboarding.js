import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(process.cwd(), 'client/src/locales');

// Manual translations for a few key strings in major Indian languages
const keyTranslations = {
  // Bengali (bn)
  bn: {
    "Welcome to Job Bazaar": "জব বাজারে আপনাকে স্বাগতম",
    "Let's get you started with our platform in just a few simple steps": "আসুন আপনাকে কয়েকটি সহজ ধাপে আমাদের প্ল্যাটফর্মে শুরু করি",
    "Step": "ধাপ",
    "of": "এর",
    "What brings you to Job Bazaar?": "আপনি কি কারণে জব বাজারে এসেছেন?",
    "Select your primary role to help us personalize your experience": "আপনার অভিজ্ঞতা ব্যক্তিগতকৃত করতে আমাদের সাহায্য করতে আপনার প্রাথমিক ভূমিকা নির্বাচন করুন",
    "Looking for Services": "পরিষেবা খুঁজছেন",
    "Offering Services": "পরিষেবা প্রদান করছেন",
    "Next": "পরবর্তী",
    "Back": "পিছনে",
    "Get Started": "শুরু করুন"
  },
  // Gujarati (gu)
  gu: {
    "Welcome to Job Bazaar": "જોબ બજારમાં આપનું સ્વાગત છે",
    "Let's get you started with our platform in just a few simple steps": "ચાલો તમને અમારા પ્લેટફોર્મ પર માત્ર થોડા સરળ પગલાંમાં શરૂ કરીએ",
    "Step": "પગલું",
    "of": "ના",
    "What brings you to Job Bazaar?": "તમને જોબ બજારમાં શું લાવે છે?",
    "Select your primary role to help us personalize your experience": "તમારા અનુભવને વ્યક્તિગત બનાવવામાં અમારી સહાય કરવા માટે તમારી પ્રાથમિક ભૂમિકા પસંદ કરો",
    "Looking for Services": "સેવાઓ શોધી રહ્યા છીએ",
    "Offering Services": "સેવાઓ આપી રહ્યા છીએ",
    "Next": "આગળ",
    "Back": "પાછળ",
    "Get Started": "શરૂ કરો"
  },
  // Punjabi (pa)
  pa: {
    "Welcome to Job Bazaar": "ਜੌਬ ਬਜ਼ਾਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",
    "Let's get you started with our platform in just a few simple steps": "ਆਓ ਤੁਹਾਨੂੰ ਸਾਡੇ ਪਲੇਟਫਾਰਮ ਦੇ ਨਾਲ ਕੁਝ ਸਧਾਰਨ ਕਦਮਾਂ ਵਿੱਚ ਸ਼ੁਰੂ ਕਰੀਏ",
    "Step": "ਕਦਮ",
    "of": "ਦਾ",
    "What brings you to Job Bazaar?": "ਤੁਹਾਨੂੰ ਜੌਬ ਬਜ਼ਾਰ 'ਤੇ ਕੀ ਲਿਆਉਂਦਾ ਹੈ?",
    "Select your primary role to help us personalize your experience": "ਤੁਹਾਡੇ ਅਨੁਭਵ ਨੂੰ ਨਿੱਜੀ ਬਣਾਉਣ ਵਿੱਚ ਸਾਡੀ ਮਦਦ ਕਰਨ ਲਈ ਆਪਣੀ ਮੁੱਖ ਭੂਮਿਕਾ ਚੁਣੋ",
    "Looking for Services": "ਸੇਵਾਵਾਂ ਦੀ ਭਾਲ ਕਰ ਰਿਹਾ ਹਾਂ",
    "Offering Services": "ਸੇਵਾਵਾਂ ਪੇਸ਼ ਕਰ ਰਿਹਾ ਹਾਂ",
    "Next": "ਅੱਗੇ",
    "Back": "ਪਿੱਛੇ",
    "Get Started": "ਸ਼ੁਰੂ ਕਰੋ"
  },
  // Malayalam (ml)
  ml: {
    "Welcome to Job Bazaar": "ജോബ് ബസാറിലേക്ക് സ്വാഗതം",
    "Let's get you started with our platform in just a few simple steps": "വളരെ ലളിതമായ ചില ഘട്ടങ്ങളിലൂടെ ഞങ്ങളുടെ പ്ലാറ്റ്ഫോമിൽ നിങ്ങൾക്ക് ആരംഭിക്കാം",
    "Step": "ഘട്ടം",
    "of": "ൽ നിന്ന്",
    "What brings you to Job Bazaar?": "ജോബ് ബസാറിലേക്ക് നിങ്ങളെ എന്താണ് കൊണ്ടുവന്നത്?",
    "Select your primary role to help us personalize your experience": "നിങ്ങളുടെ അനുഭവം വ്യക്തിഗതമാക്കുന്നതിന് ഞങ്ങളെ സഹായിക്കാൻ നിങ്ങളുടെ പ്രാഥമിക റോൾ തിരഞ്ഞെടുക്കുക",
    "Looking for Services": "സേവനങ്ങൾ തിരയുന്നു",
    "Offering Services": "സേവനങ്ങൾ വാഗ്ദാനം ചെയ്യുന്നു",
    "Next": "അടുത്തത്",
    "Back": "തിരികെ",
    "Get Started": "ആരംഭിക്കുക"
  },
  // Telugu (te)
  te: {
    "Welcome to Job Bazaar": "జాబ్ బజార్‌కి స్వాగతం",
    "Let's get you started with our platform in just a few simple steps": "కొన్ని సరళమైన దశలలో మా ప్లాట్‌ఫామ్‌తో మిమ్మల్ని ప్రారంభిద్దాం",
    "Step": "దశ",
    "of": "యొక్క",
    "What brings you to Job Bazaar?": "జాబ్ బజార్‌కి మిమ్మల్ని ఏమి తీసుకువచ్చింది?",
    "Select your primary role to help us personalize your experience": "మీ అనుభవాన్ని వ్యక్తిగతీకరించడంలో మాకు సహాయపడటానికి మీ ప్రాథమిక పాత్రను ఎంచుకోండి",
    "Looking for Services": "సేవలను వెతుకుతున్నారా",
    "Offering Services": "సేవలను అందిస్తున్నారా",
    "Next": "తదుపరి",
    "Back": "వెనుకకు",
    "Get Started": "ప్రారంభించండి"
  }
};

// Process each language
async function updateTranslations() {
  for (const langCode in keyTranslations) {
    const filePath = path.join(LOCALES_DIR, `${langCode}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    
    try {
      console.log(`Processing ${langCode}.json...`);
      
      // Read the current locale file
      const localeContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Create onboarding section if it doesn't exist
      if (!localeContent.onboarding) {
        localeContent.onboarding = {};
      }
      
      // Update translations
      let updatedCount = 0;
      for (const key in keyTranslations[langCode]) {
        const translation = keyTranslations[langCode][key];
        localeContent.onboarding[key] = translation;
        updatedCount++;
      }
      
      // Save the updated file
      fs.writeFileSync(filePath, JSON.stringify(localeContent, null, 2), 'utf8');
      console.log(`✓ Updated ${langCode}.json with ${updatedCount} manual translations`);
    } catch (error) {
      console.error(`Error processing ${langCode}.json:`, error.message);
    }
  }
  
  console.log('Manual translation process completed!');
}

// Run the update
updateTranslations().catch(console.error);