import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(process.cwd(), 'client/src/locales');

// Additional Malayalam translations for remaining strings
const mlAdditionalTranslations = {
  "Showcase Your Services": "നിങ്ങളുടെ സേവനങ്ങൾ പ്രദർശിപ്പിക്കുക",
  "List your skills and services to attract potential clients in your area": "നിങ്ങളുടെ പ്രദേശത്തെ സാധ്യതയുള്ള ഉപഭോക്താക്കളെ ആകർഷിക്കാൻ നിങ്ങളുടെ കഴിവുകളും സേവനങ്ങളും ലിസ്റ്റ് ചെയ്യുക",
  "Apply for Requirements": "ആവശ്യങ്ങൾക്ക് അപേക്ഷിക്കുക",
  "Browse open requirements and offer your services to clients in need": "തുറന്ന ആവശ്യങ്ങൾ ബ്രൗസ് ചെയ്യുകയും ആവശ്യമുള്ള ഉപഭോക്താക്കൾക്ക് നിങ്ങളുടെ സേവനങ്ങൾ വാഗ്ദാനം ചെയ്യുകയും ചെയ്യുക",
  "Find Skilled Service Providers": "വിദഗ്ധ സേവന ദാതാക്കളെ കണ്ടെത്തുക"
};

// Update Malayalam translations with additional strings
async function updateAdditionalMalayalamTranslations() {
  const filePath = path.join(LOCALES_DIR, 'ml.json');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  try {
    console.log(`Processing ml.json with additional translations...`);
    
    // Read the current locale file
    const localeContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Update translations
    let updatedCount = 0;
    for (const key in mlAdditionalTranslations) {
      const translation = mlAdditionalTranslations[key];
      localeContent.onboarding[key] = translation;
      updatedCount++;
    }
    
    // Save the updated file
    fs.writeFileSync(filePath, JSON.stringify(localeContent, null, 2), 'utf8');
    console.log(`✓ Updated ml.json with ${updatedCount} remaining translations`);
  } catch (error) {
    console.error(`Error processing ml.json:`, error.message);
  }
  
  console.log('Additional Malayalam translation process completed!');
}

// Run the update
updateAdditionalMalayalamTranslations().catch(console.error);