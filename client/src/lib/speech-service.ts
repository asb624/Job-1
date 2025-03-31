/**
 * Speech service using Web Speech API for browser-based text-to-speech
 * with support for multiple languages
 */

// Map i18next language codes to BCP 47 language tags used by the speech API
const languageMapping: Record<string, string> = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'bn': 'bn-IN',
  'gu': 'gu-IN',
  'ml': 'ml-IN',
  'mr': 'mr-IN',
  'kn': 'kn-IN',
  'pa': 'pa-IN',
  'or': 'or-IN',
  'as': 'as-IN',
  'hr': 'hr-HR',
};

// Singleton class to manage the speech synthesis
class SpeechService {
  private static instance: SpeechService;
  private synthesis: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  private constructor() {
    // Initialize the speech synthesis if available in the browser
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }
  
  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }
  
  /**
   * Check if speech synthesis is supported in this browser
   */
  public isSupported(): boolean {
    return this.synthesis !== null;
  }
  
  /**
   * Stop any currently playing speech
   */
  public stop(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }
  
  /**
   * Speak the provided text in the specified language
   * @param text The text to speak
   * @param languageCode The i18next language code (will be mapped to BCP 47)
   * @returns A promise that resolves when speech is completed or rejects on error
   */
  public speak(text: string, languageCode: string = 'en'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Speech synthesis not supported in this browser'));
        return;
      }
      
      // Stop any current speech
      this.stop();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Map the language code to BCP 47
      const speechLang = languageMapping[languageCode] || 'en-US';
      utterance.lang = speechLang;
      
      // Handle completion
      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };
      
      // Handle errors
      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      // Start speaking
      this.currentUtterance = utterance;
      this.isSpeaking = true;
      this.synthesis!.speak(utterance);
    });
  }
  
  /**
   * Check if speech is currently in progress
   */
  public isSpeakingNow(): boolean {
    return this.isSpeaking;
  }
  
  /**
   * Get an array of available voices for a given language
   * @param languageCode The i18next language code
   */
  public getVoicesForLanguage(languageCode: string): SpeechSynthesisVoice[] {
    if (!this.isSupported()) {
      return [];
    }
    
    const speechLang = languageMapping[languageCode] || 'en-US';
    const allVoices = this.synthesis!.getVoices();
    
    // Filter voices for the specific language
    return allVoices.filter(voice => voice.lang.startsWith(speechLang.split('-')[0]));
  }
}

// Export the singleton instance
export const speechService = SpeechService.getInstance();