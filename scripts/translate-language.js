import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Get the language code from command line arguments
const langCode = process.argv[2];

if (!langCode) {
  console.error('Please provide a language code as argument');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const LOCALES_DIR = path.join(process.cwd(), 'client/src/locales');
const ENGLISH_FILE = path.join(LOCALES_DIR, 'en.json');
const LANG_FILE = path.join(LOCALES_DIR, `${langCode}.json`);
const EMAIL = 'api-translate@jobbazaar.app';

// Check if the language file exists
if (!fs.existsSync(LANG_FILE)) {
  console.error(`Language file for ${langCode} does not exist at ${LANG_FILE}`);
  process.exit(1);
}

// Read the English and target locale files
const englishLocale = JSON.parse(fs.readFileSync(ENGLISH_FILE, 'utf8'));
const targetLocale = JSON.parse(fs.readFileSync(LANG_FILE, 'utf8'));
const onboardingKeys = Object.keys(englishLocale.onboarding);

// Sleep function to respect API rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to translate text using MyMemory API
async function translateText(text, targetLang) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}&de=${EMAIL}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    } else {
      console.error(`Translation failed for: "${text}" to ${targetLang}`);
      return text; // Return original text if translation fails
    }
  } catch (error) {
    console.error(`Error translating "${text}" to ${targetLang}:`, error.message);
    return text; // Return original text if translation fails
  }
}

// Get language code mapping for MyMemory API
function getMyMemoryLangCode(langCode) {
  const mapping = {
    'as': 'as', // Assamese
    'bn': 'bn', // Bengali
    'brx': 'hi', // Bodo (fallback to Hindi as it's not directly supported)
    'gu': 'gu', // Gujarati
    'hi': 'hi', // Hindi
    'kn': 'kn', // Kannada
    'kok': 'hi', // Konkani (fallback to Hindi)
    'ks': 'ur', // Kashmiri (closest is Urdu)
    'ml': 'ml', // Malayalam
    'mni': 'bn', // Manipuri (closest is Bengali)
    'mr': 'mr', // Marathi
    'or': 'or', // Odia
    'pa': 'pa', // Punjabi
    'sd': 'sd', // Sindhi
    'ta': 'ta', // Tamil
    'te': 'te', // Telugu
    'hr': 'hr', // Croatian (included in locales)
  };
  
  return mapping[langCode] || langCode;
}

// Main function
async function translateOnboarding() {
  const myMemoryLangCode = getMyMemoryLangCode(langCode);
  
  console.log(`Processing ${langCode}.json (${langCode} -> ${myMemoryLangCode})...`);
  
  // Create onboarding section if it doesn't exist
  if (!targetLocale.onboarding) {
    targetLocale.onboarding = {};
  }
  
  // Translate each key in the onboarding section
  let translatedCount = 0;
  for (const key of onboardingKeys) {
    const englishText = englishLocale.onboarding[key];
    
    // Skip if already translated (not in English)
    if (targetLocale.onboarding[key] && 
        targetLocale.onboarding[key] !== englishText) {
      console.log(`- Key "${key}" already translated, skipping.`);
      continue;
    }
    
    console.log(`- Translating "${key}": "${englishText.substring(0, 40)}${englishText.length > 40 ? '...' : ''}"`);
    
    // Translate the text
    const translatedText = await translateText(englishText, myMemoryLangCode);
    targetLocale.onboarding[key] = translatedText;
    translatedCount++;
    
    // Sleep between translations to respect API rate limits
    await sleep(1000);
  }
  
  // Save the updated file if translations were made
  if (translatedCount > 0) {
    fs.writeFileSync(LANG_FILE, JSON.stringify(targetLocale, null, 2), 'utf8');
    console.log(`✓ Updated ${langCode}.json with ${translatedCount} translations`);
  } else {
    console.log(`- No new translations needed for ${langCode}.json`);
  }
}

// Run the translation
translateOnboarding().catch(console.error);