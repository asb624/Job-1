/**
 * Enhanced speech service using both Web Speech API and server-side Indic TTS
 * with specialized support for Indian languages
 */

import axios from 'axios';

// List of supported language codes for our custom TTS solution
const supportedLanguages = [
  'en', 'hi', 'ta', 'te', 'bn', 'gu', 'ml', 'mr', 'kn', 'pa', 'or', 'as',
  'brx', 'kok', 'ks', 'mni', 'sd', 'hr'
];

// Audio player for server-side TTS audio
type AudioPlayer = {
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
};

// Singleton class to manage text-to-speech functionality
class SpeechService {
  private static instance: SpeechService;
  private audioPlayer: AudioPlayer = {
    audio: null,
    isPlaying: false
  };
  
  private constructor() {
    // Constructor is now simpler with no Web Speech API
  }
  
  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }
  
  /**
   * Check if speech synthesis is supported in this browser via our custom TTS
   */
  public isSupported(): boolean {
    return true; // Always return true since server-side TTS is always available
  }
  
  /**
   * Stop any currently playing speech
   */
  public stop(): void {
    // Stop audio playback if active
    if (this.audioPlayer.audio && this.audioPlayer.isPlaying) {
      this.audioPlayer.audio.pause();
      this.audioPlayer.audio.currentTime = 0;
      this.audioPlayer.isPlaying = false;
    }
  }
  
  /**
   * Check if a language is supported by our TTS service
   */
  private isLanguageSupported(languageCode: string): boolean {
    return supportedLanguages.includes(languageCode);
  }
  
  /**
   * Play audio using ElevenLabs TTS service
   * @param text Text to convert to speech
   * @param languageCode Language code (e.g., 'hi', 'ta')
   */
  private async playTTS(text: string, languageCode: string): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();
      
      // Create a cachebusting parameter to prevent caching issues
      const cacheBuster = new Date().getTime();
      const url = `/api/tts?cacheBuster=${cacheBuster}`;
      
      console.log(`Using ElevenLabs TTS for language ${languageCode}`);
      
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
   * Speak text using ElevenLabs TTS service
   * @param text The text to speak
   * @param languageCode The i18next language code
   * @returns A promise that resolves when speech is completed or rejects on error
   */
  public async speak(text: string, languageCode: string = 'en'): Promise<void> {
    try {
      // Always use ElevenLabs TTS
      await this.playTTS(text, languageCode);
    } catch (error) {
      console.error('TTS failed:', error);
      throw new Error(`Speech synthesis failed: ${error}`);
    }
  }
  
  /**
   * Check if speech is currently in progress
   */
  public isSpeakingNow(): boolean {
    return this.audioPlayer.isPlaying;
  }
  
  /**
   * Check if a language is supported
   * @param languageCode The i18next language code
   */
  public isLanguageSupportedForTTS(languageCode: string): boolean {
    return supportedLanguages.includes(languageCode);
  }
}

// Export the singleton instance
export const speechService = SpeechService.getInstance();