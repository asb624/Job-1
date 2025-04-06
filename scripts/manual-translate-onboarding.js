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
    "Get Started": "শুরু করুন",
    "Key Platform Features": "মূল প্ল্যাটফর্ম বৈশিষ্ট্য",
    "Discover what makes Job Bazaar special": "জব বাজারকে বিশেষ করে তোলে এমন বিষয় আবিষ্কার করুন",
    "Multilingual Support": "বহুভাষিক সমর্থন",
    "Location-Based Matching": "লোকেশন-ভিত্তিক মিলকরণ",
    "Direct Messaging": "সরাসরি বার্তা",
    "Ratings & Reviews": "রেটিং এবং পর্যালোচনা",
    "Ready to Get Started": "শুরু করতে প্রস্তুত",
    "You're all set to begin your Job Bazaar journey": "আপনি জব বাজার যাত্রা শুরু করার জন্য প্রস্তুত",
    "You're All Set!": "আপনি সব সেট করেছেন!",
    "Browse Services": "পরিষেবাগুলি ব্রাউজ করুন",
    "Post Requirement": "প্রয়োজনীয়তা পোস্ট করুন",
    "Find Skilled Service Providers": "দক্ষ পরিষেবা প্রদানকারী খুঁজুন",
    "Post Your Requirements": "আপনার প্রয়োজনীয়তা পোস্ট করুন"
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
    "Get Started": "શરૂ કરો",
    "Key Platform Features": "મુખ્ય પ્લેટફોર્મ સુવિધાઓ",
    "Discover what makes Job Bazaar special": "શોધો કે જોબ બજારને શું ખાસ બનાવે છે",
    "Multilingual Support": "બહુભાષી સપોર્ટ",
    "Location-Based Matching": "લોકેશન-આધારિત મેચિંગ",
    "Direct Messaging": "ડાયરેક્ટ મેસેજિંગ",
    "Ratings & Reviews": "રેટિંગ્સ અને રિવ્યુઝ",
    "Ready to Get Started": "શરૂ કરવા માટે તૈયાર",
    "You're all set to begin your Job Bazaar journey": "તમે તમારી જોબ બજાર યાત્રા શરૂ કરવા માટે તૈયાર છો",
    "You're All Set!": "તમે તૈયાર છો!",
    "Browse Services": "સેવાઓ બ્રાઉઝ કરો",
    "Post Requirement": "જરૂરિયાત પોસ્ટ કરો",
    "Find Skilled Service Providers": "કુશળ સેવા પ્રદાતાઓ શોધો",
    "Post Your Requirements": "તમારી જરૂરિયાતો પોસ્ટ કરો"
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
    "Get Started": "ਸ਼ੁਰੂ ਕਰੋ",
    "Key Platform Features": "ਮੁੱਖ ਪਲੇਟਫਾਰਮ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ",
    "Discover what makes Job Bazaar special": "ਖੋਜੋ ਕਿ ਜੌਬ ਬਜ਼ਾਰ ਨੂੰ ਖਾਸ ਕੀ ਬਣਾਉਂਦਾ ਹੈ",
    "Multilingual Support": "ਬਹੁਭਾਸ਼ੀ ਸਹਾਇਤਾ",
    "Location-Based Matching": "ਸਥਾਨ-ਆਧਾਰਿਤ ਮੇਲ",
    "Direct Messaging": "ਸਿੱਧਾ ਸੰਦੇਸ਼",
    "Ratings & Reviews": "ਰੇਟਿੰਗ ਅਤੇ ਸਮੀਖਿਆਵਾਂ",
    "Ready to Get Started": "ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਤਿਆਰ",
    "You're all set to begin your Job Bazaar journey": "ਤੁਸੀਂ ਆਪਣੀ ਜੌਬ ਬਜ਼ਾਰ ਯਾਤਰਾ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਤਿਆਰ ਹੋ",
    "You're All Set!": "ਤੁਸੀਂ ਸਭ ਤਿਆਰ ਹੋ!",
    "Browse Services": "ਸੇਵਾਵਾਂ ਬ੍ਰਾਊਜ਼ ਕਰੋ",
    "Post Requirement": "ਲੋੜ ਪੋਸਟ ਕਰੋ",
    "Find Skilled Service Providers": "ਕੁਸ਼ਲ ਸੇਵਾ ਪ੍ਰਦਾਤਾਵਾਂ ਲੱਭੋ",
    "Post Your Requirements": "ਆਪਣੀਆਂ ਲੋੜਾਂ ਪੋਸਟ ਕਰੋ",
    "Thank you for taking the time to learn about Job Bazaar. We're excited to have you join our community.": "ਜੌਬ ਬਜ਼ਾਰ ਬਾਰੇ ਜਾਣਨ ਲਈ ਸਮਾਂ ਕੱਢਣ ਲਈ ਤੁਹਾਡਾ ਧੰਨਵਾਦ। ਸਾਨੂੰ ਤੁਹਾਡੇ ਸਾਡੇ ਭਾਈਚਾਰੇ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਣ 'ਤੇ ਖੁਸ਼ੀ ਹੈ।",
    "Explore available services in your area": "ਆਪਣੇ ਖੇਤਰ ਵਿੱਚ ਉਪਲਬਧ ਸੇਵਾਵਾਂ ਦੀ ਪੜਚੋਲ ਕਰੋ",
    "Share your needs and find the right help": "ਆਪਣੀਆਂ ਜ਼ਰੂਰਤਾਂ ਸਾਂਝੀਆਂ ਕਰੋ ਅਤੇ ਸਹੀ ਮਦਦ ਲੱਭੋ"
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
    "Get Started": "ആരംഭിക്കുക",
    "Key Platform Features": "പ്രധാന പ്ലാറ്റ്‌ഫോം സവിശേഷതകൾ",
    "Discover what makes Job Bazaar special": "ജോബ് ബസാർ പ്രത്യേകമാക്കുന്നതെന്താണെന്ന് കണ്ടെത്തുക",
    "Multilingual Support": "ബഹുഭാഷാ പിന്തുണ",
    "Location-Based Matching": "ലൊക്കേഷൻ അടിസ്ഥാനമാക്കിയുള്ള മാച്ചിംഗ്",
    "Direct Messaging": "നേരിട്ടുള്ള സന്ദേശമയയ്ക്കൽ",
    "Ratings & Reviews": "റേറ്റിംഗുകളും അവലോകനങ്ങളും",
    "Ready to Get Started": "ആരംഭിക്കാൻ തയ്യാറാണ്",
    "You're all set to begin your Job Bazaar journey": "നിങ്ങളുടെ ജോബ് ബസാർ യാത്ര ആരംഭിക്കാൻ നിങ്ങൾ തയ്യാറാണ്",
    "You're All Set!": "നിങ്ങൾ തയ്യാറാണ്!",
    "Browse Services": "സേവനങ്ങൾ ബ്രൗസ് ചെയ്യുക",
    "Post Requirement": "ആവശ്യകത പോസ്റ്റ് ചെയ്യുക",
    "Find Skilled Service Providers": "വിദഗ്ധ സേവന ദാതാക്കളെ കണ്ടെത്തുക",
    "Post Your Requirements": "നിങ്ങളുടെ ആവശ്യങ്ങൾ പോസ്റ്റ് ചെയ്യുക"
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
    "Get Started": "ప్రారంభించండి",
    "Key Platform Features": "ముఖ్య ప్లాట్‌ఫారమ్ ఫీచర్లు",
    "Discover what makes Job Bazaar special": "జాబ్ బజార్‌ను ప్రత్యేకంగా చేసేది ఏమిటో కనుగొనండి",
    "Multilingual Support": "బహుభాషా మద్దతు",
    "Location-Based Matching": "లొకేషన్ ఆధారిత మ్యాచింగ్",
    "Direct Messaging": "డైరెక్ట్ మెసేజింగ్",
    "Ratings & Reviews": "రేటింగ్‌లు & సమీక్షలు",
    "Ready to Get Started": "ప్రారంభించడానికి సిద్ధంగా ఉన్నారు",
    "You're all set to begin your Job Bazaar journey": "మీరు మీ జాబ్ బజార్ ప్రయాణాన్ని ప్రారంభించడానికి సిద్ధంగా ఉన్నారు",
    "You're All Set!": "మీరు అన్నీ సిద్ధంగా ఉన్నారు!",
    "Browse Services": "సేవలను బ్రౌజ్ చేయండి",
    "Post Requirement": "అవసరాన్ని పోస్ట్ చేయండి",
    "Find Skilled Service Providers": "నైపుణ్యం ఉన్న సేవా ప్రదాతలను కనుగొనండి",
    "Post Your Requirements": "మీ అవసరాలను పోస్ట్ చేయండి"
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