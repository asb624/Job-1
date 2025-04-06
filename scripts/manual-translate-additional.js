import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(process.cwd(), 'client/src/locales');

// Manual translations for additional strings in Punjabi
const paTranslations = {
  // These are the missing strings from the screenshots
  "Browse through profiles of skilled professionals ready to help with your requirements": "ਹੁਨਰਮੰਦ ਪੇਸ਼ੇਵਰਾਂ ਦੇ ਪ੍ਰੋਫਾਈਲਾਂ ਨੂੰ ਬ੍ਰਾਊਜ਼ ਕਰੋ ਜੋ ਤੁਹਾਡੀਆਂ ਜ਼ਰੂਰਤਾਂ ਦੇ ਨਾਲ ਮਦਦ ਕਰਨ ਲਈ ਤਿਆਰ ਹਨ",
  "Let service providers come to you by posting your specific service needs": "ਆਪਣੀਆਂ ਵਿਸ਼ੇਸ਼ ਸੇਵਾ ਜ਼ਰੂਰਤਾਂ ਨੂੰ ਪੋਸਟ ਕਰਕੇ ਸੇਵਾ ਪ੍ਰਦਾਤਾਵਾਂ ਨੂੰ ਤੁਹਾਡੇ ਕੋਲ ਆਉਣ ਦਿਓ",
  "Showcase Your Services": "ਆਪਣੀਆਂ ਸੇਵਾਵਾਂ ਦਿਖਾਓ",
  "List your skills and services to attract potential clients in your area": "ਆਪਣੇ ਖੇਤਰ ਵਿੱਚ ਸੰਭਾਵੀ ਗਾਹਕਾਂ ਨੂੰ ਆਕਰਸ਼ਿਤ ਕਰਨ ਲਈ ਆਪਣੇ ਹੁਨਰ ਅਤੇ ਸੇਵਾਵਾਂ ਦੀ ਸੂਚੀ ਬਣਾਓ",
  "Apply for Requirements": "ਲੋੜਾਂ ਲਈ ਅਪਲਾਈ ਕਰੋ",
  "Browse open requirements and offer your services to clients in need": "ਖੁੱਲੀਆਂ ਜ਼ਰੂਰਤਾਂ ਨੂੰ ਬ੍ਰਾਊਜ਼ ਕਰੋ ਅਤੇ ਲੋੜਵੰਦ ਗਾਹਕਾਂ ਨੂੰ ਆਪਣੀਆਂ ਸੇਵਾਵਾਂ ਦੀ ਪੇਸ਼ਕਸ਼ ਕਰੋ",
  "Communicate in your preferred language with support for 18 Indian languages": "ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਵਿੱਚ 18 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਲਈ ਸਹਾਇਤਾ ਦੇ ਨਾਲ ਗੱਲਬਾਤ ਕਰੋ",
  "Find services and requirements in your vicinity easily with our map view": "ਸਾਡੇ ਨਕਸ਼ੇ ਦੇ ਦ੍ਰਿਸ਼ ਨਾਲ ਆਪਣੇ ਆਸਪਾਸ ਦੀਆਂ ਸੇਵਾਵਾਂ ਅਤੇ ਜ਼ਰੂਰਤਾਂ ਨੂੰ ਆਸਾਨੀ ਨਾਲ ਲੱਭੋ",
  "Connect and discuss details directly with service providers or clients": "ਸੇਵਾ ਪ੍ਰਦਾਤਾਵਾਂ ਜਾਂ ਗਾਹਕਾਂ ਨਾਲ ਸਿੱਧੇ ਤੌਰ 'ਤੇ ਜੁੜੋ ਅਤੇ ਵੇਰਵਿਆਂ ਬਾਰੇ ਵਿਚਾਰ-ਵਟਾਂਦਰੇ ਕਰੋ",
  "Make informed decisions based on genuine ratings and reviews from other users": "ਹੋਰ ਉਪਭੋਗਤਾਵਾਂ ਤੋਂ ਅਸਲੀ ਰੇਟਿੰਗਾਂ ਅਤੇ ਸਮੀਖਿਆਵਾਂ ਦੇ ਆਧਾਰ 'ਤੇ ਸੂਚਿਤ ਫੈਸਲੇ ਲਓ",
  "Ready to Get Started": "ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਤਿਆਰ"
};

// Update Punjabi translations
async function updatePunjabiTranslations() {
  const filePath = path.join(LOCALES_DIR, 'pa.json');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  try {
    console.log(`Processing pa.json...`);
    
    // Read the current locale file
    const localeContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Update translations
    let updatedCount = 0;
    for (const key in paTranslations) {
      const translation = paTranslations[key];
      localeContent.onboarding[key] = translation;
      updatedCount++;
    }
    
    // Save the updated file
    fs.writeFileSync(filePath, JSON.stringify(localeContent, null, 2), 'utf8');
    console.log(`✓ Updated pa.json with ${updatedCount} additional manual translations`);
  } catch (error) {
    console.error(`Error processing pa.json:`, error.message);
  }
  
  console.log('Additional translation process completed!');
}

// Run the update
updatePunjabiTranslations().catch(console.error);