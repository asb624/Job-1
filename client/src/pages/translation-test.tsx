import { useState, useEffect } from "react";
import { useTranslatedContent } from "@/lib/translation-utils";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function TranslationTestPage() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("Welcome to Job Bazaar, the marketplace for services across India.");
  const [targetLanguage, setTargetLanguage] = useState(i18n.language !== "en" ? i18n.language : "hi");
  const [manualTranslateText, setManualTranslateText] = useState("");
  const [translationResult, setTranslationResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("none");

  // Use our hook for automatic translation
  const automaticTranslation = useTranslatedContent(inputText, targetLanguage);

  // Available languages
  const languages = [
    { code: "hi", name: "Hindi" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "bn", name: "Bengali" },
    { code: "gu", name: "Gujarati" },
    { code: "ml", name: "Malayalam" },
    { code: "mr", name: "Marathi" },
    { code: "kn", name: "Kannada" },
    { code: "pa", name: "Punjabi" },
    { code: "or", name: "Odia" },
  ];

  // Manual translation function
  const translateManually = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: manualTranslateText,
          targetLang: targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      setTranslationResult(data.translatedText || "No translation returned");
      setSource(data.source || "unknown");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown translation error");
      setTranslationResult("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Translation Test Page</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Automatic Translation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Automatic Translation</CardTitle>
            <CardDescription>
              Uses the useTranslatedContent hook to automatically translate text.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="auto-input">Original Text (English)</Label>
                <Textarea
                  id="auto-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="auto-language">Target Language</Label>
                <Select
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                >
                  <SelectTrigger id="auto-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start">
            <Label className="mb-2">Translation Result:</Label>
            <div className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-md min-h-[100px]">
              {automaticTranslation}
            </div>
          </CardFooter>
        </Card>

        {/* Manual Translation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Translation</CardTitle>
            <CardDescription>
              Test direct API call to the server translation endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="manual-input">Text to Translate</Label>
                <Textarea
                  id="manual-input"
                  value={manualTranslateText}
                  onChange={(e) => setManualTranslateText(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="manual-language">Target Language</Label>
                <Select
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                >
                  <SelectTrigger id="manual-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={translateManually} 
                disabled={isLoading || !manualTranslateText}
                className="w-full"
              >
                {isLoading ? "Translating..." : "Translate"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start">
            <div className="flex justify-between w-full mb-2">
              <Label>Translation Result:</Label>
              {source !== "none" && (
                <span className="text-sm text-slate-500">
                  Source: {source}
                </span>
              )}
            </div>
            {error ? (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-md min-h-[100px]">
                {translationResult}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>LibreTranslate Information</CardTitle>
          <CardDescription>
            Details about the translation service being used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2">
            This application uses <a href="https://libretranslate.com/" className="text-blue-500 hover:underline" target="_blank">LibreTranslate</a>, 
            a free and open-source translation API. The service is being accessed through multiple public endpoints:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>libretranslate.de</li>
            <li>translate.argosopentech.com</li>
            <li>translate.terraprint.co</li>
          </ul>
          <p className="mt-4">
            If all LibreTranslate servers fail, the system falls back to MyMemory as a secondary service,
            and if that fails as well, it returns the original text.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}