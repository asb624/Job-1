import { useState } from 'react';
import { Message } from '../../../shared/schema';
import { Button } from '@/components/ui/button';
import { Languages, Loader2 } from 'lucide-react';
import { translateMessage } from '../lib/message-translation-service';
import { useToast } from '@/hooks/use-toast';
import i18n from 'i18next';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface MessageTranslationButtonProps {
  message: Message;
  onTranslated?: (translatedText: string) => void;
}

export function MessageTranslationButton({ message, onTranslated }: MessageTranslationButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const { toast } = useToast();
  const currentLanguage = i18n.language;
  
  const handleTranslate = async () => {
    if (!message.content) return;
    
    // If already translated, switch back to original
    if (isTranslated) {
      if (onTranslated) {
        onTranslated(message.content);
      }
      setIsTranslated(false);
      return;
    }
    
    setIsTranslating(true);
    
    try {
      const translatedText = await translateMessage(
        message.id,
        message.content,
        currentLanguage
      );
      
      if (onTranslated) {
        onTranslated(translatedText);
      }
      
      setIsTranslated(true);
      
      // Show toast only if translation was successful and different from original
      if (translatedText !== message.content) {
        toast({
          title: "Message Translated",
          description: `Translated to ${getLanguageName(currentLanguage)}`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Translation failed:', error);
      toast({
        title: "Translation Failed",
        description: "Could not translate the message",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };
  
  // Don't show for empty messages or messages in English when the UI is in English
  if (!message.content || (isMessageInEnglish(message.content) && currentLanguage === 'en')) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full"
            onClick={handleTranslate}
            disabled={isTranslating}
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isTranslated ? "Show original" : "Translate message"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isTranslated 
            ? "Show original message" 
            : `Translate to ${getLanguageName(currentLanguage)}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getLanguageName(languageCode: string): string {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali',
    'pa': 'Punjabi',
    'gu': 'Gujarati',
    'ml': 'Malayalam',
    'mr': 'Marathi',
    'kn': 'Kannada',
    'or': 'Odia',
    'as': 'Assamese',
    'brx': 'Bodo',
    'kok': 'Konkani',
    'ks': 'Kashmiri',
    'mni': 'Manipuri',
    'sd': 'Sindhi',
    'hr': 'Croatian',
    // Add more languages as needed
  };
  
  return languageNames[languageCode] || languageCode;
}

// Simple heuristic to detect if a message is likely in English
// This is just a basic implementation - for production, you might want to use
// language detection libraries or APIs for more accuracy
function isMessageInEnglish(text: string): boolean {
  // Count non-Latin characters
  const nonLatinCharCount = (text.match(/[^\u0000-\u007F]/g) || []).length;
  
  // If more than 10% of characters are non-Latin, assume it's not English
  return nonLatinCharCount / text.length < 0.1;
}

// For conversations with multiple messages, we might want a component to translate all messages
export function TranslateAllMessagesButton({ 
  onTranslateAll 
}: { 
  onTranslateAll: () => void 
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onTranslateAll}
      className="flex items-center gap-1"
    >
      <Languages className="h-4 w-4 mr-1" />
      Translate all messages
    </Button>
  );
}