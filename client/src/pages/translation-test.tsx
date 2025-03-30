import { useState } from "react";
import { useTranslatedContent } from "@/lib/translation-utils";

// Supported languages based on Bhashini models
const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'or', name: 'Odia' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'as', name: 'Assamese' },
];

export function TranslationTest() {
  const [inputText, setInputText] = useState<string>("Welcome to Job Bazaar, the marketplace for services across India.");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("hi");
  
  // Use our translation hook
  const translatedText = useTranslatedContent(inputText, selectedLanguage);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bhashini Translation Test</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Input Text (English)</label>
        <textarea 
          className="w-full h-32 p-2 border rounded-md"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Target Language</label>
        <select 
          className="w-full p-2 border rounded-md"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {supportedLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name} ({lang.code})
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Translated Text ({selectedLanguage})</h2>
        <div className="p-4 border rounded-md bg-gray-50 min-h-32">
          {translatedText || "Translation will appear here..."}
        </div>
      </div>
      
      <div className="rounded-md bg-blue-50 p-4">
        <h3 className="text-md font-medium text-blue-800">Translation Information</h3>
        <p className="text-sm text-blue-700 mt-1">
          This test page uses the Bhashini API (Indian government's translation framework) for Indian languages.
          If Bhashini fails, it will fall back to LibreTranslate and then MyMemory.
        </p>
      </div>
    </div>
  );
}

export default TranslationTest;