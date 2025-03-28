type SpeechRecognitionCallback = (transcript: string) => void;

export class SpeechService {
  private synthesis: SpeechSynthesis;
  private recognition: any; // SpeechRecognition or webkitSpeechRecognition
  private isListening: boolean = false;
  private language: string;
  
  constructor(language = 'en-US') {
    this.synthesis = window.speechSynthesis;
    this.language = language;
    
    // Browser compatibility for Speech Recognition
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = language;
    }
  }
  
  // Set the language for both speech recognition and synthesis
  public setLanguage(language: string): void {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }
  
  // Start listening for speech
  public startListening(callback: SpeechRecognitionCallback): void {
    if (!this.recognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }
    
    if (this.isListening) {
      this.stopListening();
    }
    
    this.isListening = true;
    
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      callback(transcript);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      this.isListening = false;
    };
    
    this.recognition.start();
  }
  
  // Stop listening for speech
  public stopListening(): void {
    if (!this.recognition || !this.isListening) return;
    
    this.recognition.stop();
    this.isListening = false;
  }
  
  // Speak the provided text
  public speak(text: string): void {
    if (!this.synthesis) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.language;
    
    // Optional: adjust voice properties
    utterance.rate = 1.0; // Speed: 0.1 to 10
    utterance.pitch = 1.0; // Pitch: 0 to 2
    utterance.volume = 1.0; // Volume: 0 to 1
    
    // Get available voices and try to select a natural-sounding voice
    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      // Try to find a voice that matches the current language
      const langVoices = voices.filter(voice => voice.lang.startsWith(this.language.split('-')[0]));
      
      if (langVoices.length > 0) {
        // Prefer voices with "natural" or "premium" in the name if available
        const naturalVoice = langVoices.find(voice => 
          voice.name.toLowerCase().includes('natural') || 
          voice.name.toLowerCase().includes('premium') ||
          voice.name.toLowerCase().includes('enhanced')
        );
        
        utterance.voice = naturalVoice || langVoices[0];
      }
    }
    
    this.synthesis.speak(utterance);
  }
  
  // Check if currently speaking
  public isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }
  
  // Stop speaking
  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
  
  // Mapping of language codes to SpeechRecognition compatible codes
  public static getLanguageCode(langCode: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'bn': 'bn-IN',
      'te': 'te-IN',
      'pa': 'pa-IN',
      'hr': 'hr-HR', // Using Croatian code for Haryanvi as it's not standardized
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'ml': 'ml-IN',
      'kn': 'kn-IN',
      'or': 'or-IN',
      'as': 'as-IN',
      'kok': 'kok-IN',
      'ks': 'ks-IN',
      'sd': 'sd-IN',
      'mni': 'mni-IN',
      'brx': 'brx-IN' // May not be widely supported
    };
    
    return languageMap[langCode] || 'en-US';
  }
  
  // Get a list of supported language codes for the speech services
  public static getSupportedLanguages(): string[] {
    return [
      'en-US', 
      'hi-IN', 
      'ta-IN', 
      'bn-IN', 
      'te-IN', 
      'pa-IN',
      'mr-IN', 
      'gu-IN', 
      'ml-IN', 
      'kn-IN', 
      'or-IN'
      // Note: Some languages might not be supported by all browsers
    ];
  }
}