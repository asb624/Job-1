/**
 * Script to translate the onboarding section in all locale files
 * This script uses the MyMemory translation API to translate the onboarding content
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../client/src/locales');
const ENGLISH_FILE = path.join(LOCALES_DIR, 'en.json');
const EMAIL = 'api-translate@jobbazaar.app'; // Using a generic email for MyMemory

// Read the English locale file as the reference
const englishLocale = JSON.parse(fs.readFileSync(ENGLISH_FILE, 'utf8'));
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
      console.error('API Response:', JSON.stringify(data));
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
    'hr': 'hr', // Croatian (included as it was in the locale files)
  };
  
  return mapping[langCode] || langCode;
}

// Main function to translate onboarding section for specified locales
async function translateOnboardingSection(targetLanguages = []) {
  // Get specified locale files or all locale files except English
  let localeFiles;
  
  if (targetLanguages.length > 0) {
    localeFiles = targetLanguages.map(lang => `${lang}.json`);
    // Filter out any files that don't exist
    localeFiles = localeFiles.filter(file => {
      const exists = fs.existsSync(path.join(LOCALES_DIR, file));
      if (!exists) {
        console.warn(`Warning: Locale file ${file} does not exist.`);
      }
      return exists;
    });
  } else {
    localeFiles = fs.readdirSync(LOCALES_DIR)
      .filter(file => file.endsWith('.json') && file !== 'en.json');
  }
  
  console.log(`Found ${localeFiles.length} locale files to translate`);
  
  // Process each locale file
  for (const file of localeFiles) {
    const langCode = file.split('.')[0];
    const myMemoryLangCode = getMyMemoryLangCode(langCode);
    const filePath = path.join(LOCALES_DIR, file);
    
    console.log(`\nProcessing ${file} (${langCode} -> ${myMemoryLangCode})...`);
    
    try {
      // Read the current locale file
      const localeContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Create onboarding section if it doesn't exist
      if (!localeContent.onboarding) {
        localeContent.onboarding = {};
      }
      
      // Translate each key in the onboarding section
      let translatedCount = 0;
      for (const key of onboardingKeys) {
        const englishText = englishLocale.onboarding[key];
        
        // Skip if already translated (not in English)
        if (localeContent.onboarding[key] && 
            localeContent.onboarding[key] !== englishText) {
          console.log(`- Key "${key}" already translated, skipping.`);
          continue;
        }
        
        console.log(`- Translating "${key}": "${englishText.substring(0, 40)}${englishText.length > 40 ? '...' : ''}"`);
        
        // Translate the text
        const translatedText = await translateText(englishText, myMemoryLangCode);
        localeContent.onboarding[key] = translatedText;
        translatedCount++;
        
        // Sleep between translations to respect API rate limits
        await sleep(300);
      }
      
      // Save the updated file if translations were made
      if (translatedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(localeContent, null, 2), 'utf8');
        console.log(`✓ Updated ${file} with ${translatedCount} translations`);
      } else {
        console.log(`- No new translations needed for ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log('\nTranslation process completed!');
}

// Run the translation process for specific languages
// Choose major Indian languages to translate first
translateOnboardingSection(['hi', 'bn', 'gu', 'ml', 'pa']).catch(console.error);