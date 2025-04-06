import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(process.cwd(), 'client/src/locales');

// Manual translations for additional strings in Malayalam
const mlTranslations = {
  // From the screenshots, these are the missing translations
  "Find Skilled Service Providers": "വിദഗ്ധ സേവന ദാതാക്കളെ കണ്ടെത്തുക",
  "Browse through profiles of skilled professionals ready to help with your requirements": "നിങ്ങളുടെ ആവശ്യങ്ങൾക്ക് സഹായിക്കാൻ തയ്യാറായ വിദഗ്ധ പ്രൊഫഷണലുകളുടെ പ്രൊഫൈലുകൾ പരിശോധിക്കുക",
  "Let service providers come to you by posting your specific service needs": "നിങ്ങളുടെ നിർദ്ദിഷ്ട സേവന ആവശ്യങ്ങൾ പോസ്റ്റ് ചെയ്യുന്നതിലൂടെ സേവന ദാതാക്കളെ നിങ്ങളിലേക്ക് എത്തിക്കുക",
  "Communicate in your preferred language with support for 18 Indian languages": "18 ഇന്ത്യൻ ഭാഷകൾക്കുള്ള പിന്തുണയോടെ നിങ്ങളുടെ ഇഷ്ടപ്പെട്ട ഭാഷയിൽ ആശയവിനിമയം നടത്തുക",
  "Find services and requirements in your vicinity easily with our map view": "ഞങ്ങളുടെ മാപ്പ് വ്യൂ ഉപയോഗിച്ച് നിങ്ങളുടെ സമീപത്തുള്ള സേവനങ്ങളും ആവശ്യങ്ങളും എളുപ്പം കണ്ടെത്തുക",
  "Connect and discuss details directly with service providers or clients": "സേവന ദാതാക്കളുമായോ ഉപഭോക്താക്കളുമായോ നേരിട്ട് ബന്ധപ്പെട്ട് വിശദാംശങ്ങൾ ചർച്ച ചെയ്യുക",
  "Make informed decisions based on genuine ratings and reviews from other users": "മറ്റ് ഉപയോക്താക്കളിൽ നിന്നുള്ള യഥാർത്ഥ റേറ്റിംഗുകളുടേയും അവലോകനങ്ങളുടേയും അടിസ്ഥാനത്തിൽ അറിവുള്ള തീരുമാനങ്ങൾ എടുക്കുക",
  "Thank you for taking the time to learn about Job Bazaar. We're excited to have you join our community.": "ജോബ് ബസാറിനെക്കുറിച്ച് അറിയാൻ സമയം എടുത്തതിന് നന്ദി. നിങ്ങൾ ഞങ്ങളുടെ കമ്മ്യൂണിറ്റിയിൽ ചേരുന്നതിൽ ഞങ്ങൾ സന്തോഷിക്കുന്നു.",
  "Explore available services in your area": "നിങ്ങളുടെ പ്രദേശത്തെ ലഭ്യമായ സേവനങ്ങൾ പര്യവേക്ഷണം ചെയ്യുക",
  "Share your needs and find the right help": "നിങ്ങളുടെ ആവശ്യങ്ങൾ പങ്കിടുകയും ശരിയായ സഹായം കണ്ടെത്തുകയും ചെയ്യുക",
  "You're All Set!": "നിങ്ങൾ തയ്യാറാണ്!",
  "Ready to Get Started": "ആരംഭിക്കാൻ തയ്യാറാണ്"
};

// Update Malayalam translations
async function updateMalayalamTranslations() {
  const filePath = path.join(LOCALES_DIR, 'ml.json');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  try {
    console.log(`Processing ml.json...`);
    
    // Read the current locale file
    const localeContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Update translations
    let updatedCount = 0;
    for (const key in mlTranslations) {
      const translation = mlTranslations[key];
      localeContent.onboarding[key] = translation;
      updatedCount++;
    }
    
    // Save the updated file
    fs.writeFileSync(filePath, JSON.stringify(localeContent, null, 2), 'utf8');
    console.log(`✓ Updated ml.json with ${updatedCount} additional manual translations`);
  } catch (error) {
    console.error(`Error processing ml.json:`, error.message);
  }
  
  console.log('Malayalam translation process completed!');
}

// Run the update
updateMalayalamTranslations().catch(console.error);