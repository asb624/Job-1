/**
 * Enhanced speech service using both Web Speech API and server-side Indic TTS
 * with specialized support for Indian languages
 */

import axios from 'axios';

// Map i18next language codes to BCP 47 language tags used by the speech API
const webSpeechLanguageMapping: Record<string, string> = {
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

// List of Indian language codes for which we prefer server-side TTS over Web Speech API
const indicLanguages = [
  'hi', 'ta', 'te', 'bn', 'gu', 'ml', 'mr', 'kn', 'pa', 'or', 'as',
  'brx', 'kok', 'ks', 'mni', 'sd'
];

// Audio player for server-side TTS audio
type AudioPlayer = {
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
};

// Singleton class to manage text-to-speech functionality
class SpeechService {
  private static instance: SpeechService;
  private synthesis: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioPlayer: AudioPlayer = {
    audio: null,
    isPlaying: false
  };
  
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
   * Check if speech synthesis is supported in this browser or via fallbacks
   */
  public isSupported(): boolean {
    // We consider the service supported if either Web Speech API is available 
    // or our server-side TTS fallback can be used
    return this.synthesis !== null || true; // Always return true since server-side is always available
  }
  
  /**
   * Stop any currently playing speech (both Web Speech and audio playback)
   */
  public stop(): void {
    // Stop Web Speech API if active
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
    
    // Stop audio playback if active
    if (this.audioPlayer.audio && this.audioPlayer.isPlaying) {
      this.audioPlayer.audio.pause();
      this.audioPlayer.audio.currentTime = 0;
      this.audioPlayer.isPlaying = false;
    }
  }
  
  /**
   * Check if a language is better supported by server-side TTS
   */
  private shouldUseServerSideTTS(languageCode: string): boolean {
    return indicLanguages.includes(languageCode);
  }
  
  /**
   * Play audio using server-side TTS (specialized for Indian languages)
   * @param text Text to convert to speech
   * @param languageCode Language code (e.g., 'hi', 'ta')
   */
  private async playServerSideTTS(text: string, languageCode: string): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();
      
      // Create a cachebusting parameter to prevent caching issues
      const cacheBuster = new Date().getTime();
      const url = `/api/tts?cacheBuster=${cacheBuster}`;
      
      console.log(`Using server-side TTS for language ${languageCode}`);
      
      // Request TTS audio from server
      const response = await axios({
        method: 'POST',
        url,
        data: {
          text,
          language: languageCode
        },
        responseType: 'blob'
      });
      
      // Create a blob URL for the audio data
      const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and configure audio element
      const audio = new Audio(audioUrl);
      
      // Set up audio event handlers
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          this.audioPlayer.isPlaying = false;
          this.audioPlayer.audio = null;
          // Release the blob URL to free memory
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = (error) => {
          this.audioPlayer.isPlaying = false;
          this.audioPlayer.audio = null;
          URL.revokeObjectURL(audioUrl);
          reject(new Error(`Audio playback error: ${error}`));
        };
        
        // Start playback
        this.audioPlayer.audio = audio;
        this.audioPlayer.isPlaying = true;
        audio.play().catch(error => {
          reject(new Error(`Failed to play audio: ${error.message}`));
        });
      });
    } catch (error: any) {
      console.error('Server-side TTS error:', error);
      throw new Error(`Failed to get TTS audio: ${error.message}`);
    }
  }
  
  /**
   * Speak text using Web Speech API
   * @param text Text to speak
   * @param languageCode Language code
   */
  private speakWithWebSpeech(text: string, languageCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Web Speech API not supported in this browser'));
        return;
      }
      
      // Stop any current speech
      this.stop();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Map the language code to BCP 47
      const speechLang = webSpeechLanguageMapping[languageCode] || 'en-US';
      utterance.lang = speechLang;
      
      console.log(`Using Web Speech API for language ${languageCode} (${speechLang})`);
      
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
      this.synthesis.speak(utterance);
    });
  }
  
  /**
   * Speak text using the most appropriate TTS method for the language
   * Falls back gracefully based on language and available methods
   * @param text The text to speak
   * @param languageCode The i18next language code
   * @returns A promise that resolves when speech is completed or rejects on error
   */
  public async speak(text: string, languageCode: string = 'en'): Promise<void> {
    try {
      // Try Web Speech API first for all languages (more reliable)
      if (this.synthesis) {
        try {
          return await this.speakWithWebSpeech(text, languageCode);
        } catch (error) {
          console.warn('Web Speech API failed, falling back to server-side TTS:', error);
          
          // Only if Web Speech API fails and language is supported by server-side TTS
          if (this.shouldUseServerSideTTS(languageCode)) {
            return this.playServerSideTTS(text, languageCode);
          } else {
            throw error; // Re-throw if language isn't supported by server-side
          }
        }
      } else {
        // If Web Speech API isn't available at all, try server-side
        return this.playServerSideTTS(text, languageCode);
      }
    } catch (error) {
      console.error('All TTS methods failed:', error);
      throw new Error(`Speech synthesis failed: ${error}`);
    }
  }
  
  /**
   * Check if speech is currently in progress (either Web Speech or audio playback)
   */
  public isSpeakingNow(): boolean {
    return this.isSpeaking || this.audioPlayer.isPlaying;
  }
  
  /**
   * Get an array of available voices for a given language from Web Speech API
   * @param languageCode The i18next language code
   */
  public getVoicesForLanguage(languageCode: string): SpeechSynthesisVoice[] {
    if (!this.synthesis) {
      return [];
    }
    
    const speechLang = webSpeechLanguageMapping[languageCode] || 'en-US';
    const allVoices = this.synthesis.getVoices();
    
    // Filter voices for the specific language
    return allVoices.filter(voice => voice.lang.startsWith(speechLang.split('-')[0]));
  }
}

// Export the singleton instance
export const speechService = SpeechService.getInstance();