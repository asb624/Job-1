#!/bin/bash

# Script to manually translate key languages in batches
# This avoids API timeouts by focusing on specific language groups

# Function to translate a batch of languages
translate_batch() {
    echo "Translating batch of languages: $@"
    # Create a temporary script for this batch
    cat > temp_translate.js << EOF
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make sure we use the absolute path based on the current working directory
const LOCALES_DIR = path.join(process.cwd(), 'client/src/locales');
const ENGLISH_FILE = path.join(LOCALES_DIR, 'en.json');
const EMAIL = 'api-translate@jobbazaar.app';

// Read the English and Hindi locale files as references
const englishLocale = JSON.parse(fs.readFileSync(ENGLISH_FILE, 'utf8'));
const onboardingKeys = Object.keys(englishLocale.onboarding);

// Sleep function to respect API rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to translate text using MyMemory API
async function translateText(text, targetLang) {
  try {
    const url = \`https://api.mymemory.translated.net/get?q=\${encodeURIComponent(text)}&langpair=en|\${targetLang}&de=\${EMAIL}\`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    } else {
      console.error(\`Translation failed for: "\${text}" to \${targetLang}\`);
      return text; // Return original text if translation fails
    }
  } catch (error) {
    console.error(\`Error translating "\${text}" to \${targetLang}:\`, error.message);
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
async function translateLanguages(targetLanguages) {
  const localeFiles = targetLanguages.map(lang => \`\${lang}.json\`);
  
  // Filter out any files that don't exist
  const validFiles = localeFiles.filter(file => {
    const exists = fs.existsSync(path.join(LOCALES_DIR, file));
    if (!exists) {
      console.warn(\`Warning: Locale file \${file} does not exist.\`);
    }
    return exists;
  });
  
  console.log(\`Processing \${validFiles.length} locale files: \${validFiles.join(', ')}\`);
  
  // Process each locale file
  for (const file of validFiles) {
    const langCode = file.split('.')[0];
    const myMemoryLangCode = getMyMemoryLangCode(langCode);
    const filePath = path.join(LOCALES_DIR, file);
    
    console.log(\`\nProcessing \${file} (\${langCode} -> \${myMemoryLangCode})...\`);
    
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
          console.log(\`- Key "\${key}" already translated, skipping.\`);
          continue;
        }
        
        console.log(\`- Translating "\${key}"\`);
        
        // Translate the text
        const translatedText = await translateText(englishText, myMemoryLangCode);
        localeContent.onboarding[key] = translatedText;
        translatedCount++;
        
        // Sleep between translations to respect API rate limits
        await sleep(500);
      }
      
      // Save the updated file if translations were made
      if (translatedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(localeContent, null, 2), 'utf8');
        console.log(\`✓ Updated \${file} with \${translatedCount} translations\`);
      } else {
        console.log(\`- No new translations needed for \${file}\`);
      }
    } catch (error) {
      console.error(\`Error processing \${file}:\`, error.message);
    }
  }
}

// Run translation for these languages
translateLanguages(['${@}']).catch(console.error);
EOF

    # Execute the temporary script
    node temp_translate.js
    # Remove the temporary script
    rm temp_translate.js
}

# Wait between batches to avoid API limits
wait_between_batches() {
    echo "Waiting 30 seconds before processing next batch..."
    sleep 30
}

# Process the languages in manageable batches

# Batch 1: Major Indian languages (already done for Hindi and Tamil)
translate_batch bn gu

wait_between_batches

# Batch 2: More Indian languages
translate_batch pa ml

wait_between_batches

# Batch 3: More Indian languages
translate_batch te kn

wait_between_batches

# Batch 4: More Indian languages
translate_batch mr or

wait_between_batches

# Batch 5: Less common but important languages
translate_batch as kok

wait_between_batches

# Batch 6: Final batch
translate_batch ks sd mni brx

echo "All translation batches completed!"