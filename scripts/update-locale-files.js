/**
 * Script to update all locale files with missing "marketplace" and "location" sections
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../client/src/locales');
const ENGLISH_FILE = path.join(LOCALES_DIR, 'en.json');

// Read the English locale file as the reference
const englishLocale = JSON.parse(fs.readFileSync(ENGLISH_FILE, 'utf8'));

// Extract marketplace, location, and onboarding sections from the English file
const marketplace = englishLocale.marketplace;
const location = englishLocale.location;
const onboarding = englishLocale.onboarding;

// Get all locale files
const localeFiles = fs.readdirSync(LOCALES_DIR)
  .filter(file => file.endsWith('.json') && file !== 'en.json');

console.log(`Found ${localeFiles.length} locale files to update`);

// Process each locale file
let updatedFiles = 0;
for (const file of localeFiles) {
  const filePath = path.join(LOCALES_DIR, file);
  console.log(`Processing ${file}...`);
  
  try {
    // Read the current locale file
    const localeContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let updated = false;
    
    // Check if marketplace section is missing
    if (!localeContent.marketplace) {
      console.log(`- Adding "marketplace" section to ${file}`);
      localeContent.marketplace = marketplace;
      updated = true;
    }
    
    // Check if location section is missing
    if (!localeContent.location) {
      console.log(`- Adding "location" section to ${file}`);
      localeContent.location = location;
      updated = true;
    }
    
    // Check if onboarding section is missing
    if (!localeContent.onboarding) {
      console.log(`- Adding "onboarding" section to ${file}`);
      localeContent.onboarding = onboarding;
      updated = true;
    }
    
    // If any sections were added, write the updated file
    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(localeContent, null, 2), 'utf8');
      updatedFiles++;
      console.log(`✓ Updated ${file}`);
    } else {
      console.log(`- No updates needed for ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log(`\nComplete! Updated ${updatedFiles} files.`);