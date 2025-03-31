import { Message } from '../../../shared/schema';
import { preloadTranslations } from './translation-utils';
import i18n from 'i18next';

// Global translation cache specific for messages
interface MessageTranslationCache {
  [messageId: number]: {
    [language: string]: string;
  };
}

const messageTranslationCache: MessageTranslationCache = {};

/**
 * Translate a message to the specified language
 */
export async function translateMessage(
  messageId: number, 
  messageContent: string, 
  targetLanguage: string
): Promise<string> {
  // If target language is English or matches the current language, return original content
  if (targetLanguage === 'en') {
    return messageContent;
  }
  
  // Check if we have this translation cached already
  if (messageTranslationCache[messageId]?.[targetLanguage]) {
    console.log(`Using cached translation for message ${messageId}`);
    return messageTranslationCache[messageId][targetLanguage];
  }
  
  try {
    console.log(`Translating message ${messageId} to ${targetLanguage}`);
    
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: messageContent, targetLang: targetLanguage })
    });
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.translatedText) {
      console.log(`Message translation success: "${messageContent}" → "${data.translatedText}"`);
      
      // Cache the translation for this message
      if (!messageTranslationCache[messageId]) {
        messageTranslationCache[messageId] = {};
      }
      messageTranslationCache[messageId][targetLanguage] = data.translatedText;
      
      return data.translatedText;
    } else {
      throw new Error('No translation data returned from server');
    }
  } catch (error) {
    console.error('Message translation error:', error);
    return messageContent; // Return original text as fallback
  }
}

/**
 * Pre-translate multiple messages
 * Useful when loading a conversation history
 */
export async function preloadMessagesTranslation(messages: Message[], targetLanguage: string): Promise<void> {
  if (targetLanguage === 'en' || !messages || messages.length === 0) {
    return;
  }
  
  // Extract message contents
  const messageContents = messages.map(message => message.content).filter(Boolean);
  
  // Use the existing preload function
  await preloadTranslations(messageContents, targetLanguage);
  
  // Store in our message-specific cache for quicker access
  messages.forEach(message => {
    if (message.content) {
      // Check if this translation is now in the global cache
      const translatedText = globalTranslationCache[targetLanguage]?.[message.content];
      if (translatedText) {
        if (!messageTranslationCache[message.id]) {
          messageTranslationCache[message.id] = {};
        }
        messageTranslationCache[message.id][targetLanguage] = translatedText;
      }
    }
  });
}

// Access to global translation cache (imported from translation-utils)
// This is a bit of a workaround but makes the code simpler
const globalTranslationCache: {
  [language: string]: {
    [text: string]: string;
  };
} = (window as any).__translationCache || {};

/**
 * React hook for message translation with tracking
 */
export function useMessageTranslation() {
  const currentLanguage = i18n.language;
  
  /**
   * Translate a single message
   */
  const translateSingleMessage = async (message: Message): Promise<string> => {
    if (!message.content || currentLanguage === 'en') {
      return message.content || '';
    }
    
    return translateMessage(message.id, message.content, currentLanguage);
  };
  
  /**
   * Bulk translate multiple messages 
   */
  const translateMessages = async (messages: Message[]): Promise<Map<number, string>> => {
    const translations = new Map<number, string>();
    
    if (currentLanguage === 'en') {
      // For English, just return original messages
      messages.forEach(message => {
        translations.set(message.id, message.content || '');
      });
      return translations;
    }
    
    // Prepare by preloading translations
    await preloadMessagesTranslation(messages, currentLanguage);
    
    // Now process each message
    for (const message of messages) {
      if (!message.content) {
        translations.set(message.id, '');
        continue;
      }
      
      try {
        // Try to get from cache first
        if (messageTranslationCache[message.id]?.[currentLanguage]) {
          translations.set(
            message.id, 
            messageTranslationCache[message.id][currentLanguage]
          );
        } else {
          // Translate if not in cache
          const translatedText = await translateMessage(
            message.id,
            message.content,
            currentLanguage
          );
          translations.set(message.id, translatedText);
        }
      } catch (error) {
        console.error(`Error translating message ${message.id}:`, error);
        translations.set(message.id, message.content);
      }
    }
    
    return translations;
  };
  
  return {
    translateSingleMessage,
    translateMessages,
    currentLanguage
  };
}