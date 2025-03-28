import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatbotService, isSpeechRecognitionSupported, isSpeechSynthesisSupported } from './chatbot-service';
import { SpeechService } from './speech-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, X, Volume2, VolumeX, MessageSquare } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export function ChatbotUI() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const chatbotService = useRef<ChatbotService>(new ChatbotService(i18n.language));
  const speechService = useRef<SpeechService | null>(null);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const speechSupported = useRef<boolean>(false);
  const synthesisSupported = useRef<boolean>(false);
  
  // Initialize services and check capabilities
  useEffect(() => {
    speechSupported.current = isSpeechRecognitionSupported();
    synthesisSupported.current = isSpeechSynthesisSupported();
    
    if (speechSupported.current || synthesisSupported.current) {
      speechService.current = new SpeechService(SpeechService.getLanguageCode(i18n.language));
    }
    
    // Add initial greeting message from the bot
    const initialMessage: Message = {
      id: generateId(),
      text: t('chatbot.greeting', 'Hello! I\'m JobLo\'s assistant. How can I help you today?'),
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    setSuggestions([
      t('chatbot.suggestion.findWorkers', 'How do I find workers?'),
      t('chatbot.suggestion.postService', 'How do I post a service?'),
      t('chatbot.suggestion.viewJobs', 'What jobs are available?')
    ]);
    
    return () => {
      if (speechService.current) {
        speechService.current.stopListening();
        speechService.current.stopSpeaking();
      }
    };
  }, [t, i18n.language]);
  
  // Update language when it changes
  useEffect(() => {
    chatbotService.current = new ChatbotService(i18n.language);
    if (speechService.current) {
      speechService.current.setLanguage(SpeechService.getLanguageCode(i18n.language));
    }
  }, [i18n.language]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Function to process input and get response
  const processInput = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSuggestions([]);
    
    try {
      // Get response from chatbot service
      const response = await chatbotService.current.getResponse(text);
      
      // Add bot message
      const botMessage: Message = {
        id: generateId(),
        text: response.text,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Update suggestions
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
      
      // Speak the response if speech synthesis is available and enabled
      if (synthesisSupported.current && isSpeaking && speechService.current) {
        speechService.current.speak(response.text);
      }
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        text: t('chatbot.error', 'Sorry, I encountered an error. Please try again.'),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processInput(inputText);
  };
  
  // Handle voice input
  const toggleListening = () => {
    if (!speechSupported.current || !speechService.current) return;
    
    if (isListening) {
      speechService.current.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechService.current.startListening((transcript) => {
        setInputText(transcript);
        setIsListening(false);
        // Auto-submit after a short delay
        setTimeout(() => processInput(transcript), 500);
      });
    }
  };
  
  // Toggle speech output
  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    
    if (speechService.current && isSpeaking) {
      speechService.current.stopSpeaking();
    }
  };
  
  // Generate unique message ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  // Click a suggestion to use it as input
  const handleSuggestionClick = (suggestion: string) => {
    processInput(suggestion);
  };
  
  // Toggle chatbot visibility
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    
    // If opening, focus on input field
    if (!isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };
  
  return (
    <>
      {/* Floating action button to open chatbot */}
      {!isOpen && (
        <Button
          onClick={toggleChatbot}
          className="fixed right-4 bottom-4 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
          aria-label={t('chatbot.open', 'Open AI Assistant')}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      )}
      
      {/* Chatbot dialog */}
      {isOpen && (
        <Card className="fixed right-4 bottom-4 w-[350px] md:w-[400px] max-w-[95vw] h-[500px] max-h-[80vh] shadow-xl overflow-hidden flex flex-col z-50 border-blue-100">
          <CardHeader className="py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-white">
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </Avatar>
              <div>
                <h3 className="text-sm font-semibold">{t('chatbot.title', 'JobLo Assistant')}</h3>
                <p className="text-xs opacity-80">{t('chatbot.subtitle', 'Ask me anything about JobLo')}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-blue-500"
              onClick={toggleChatbot}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50 to-white">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-none'
                      : 'bg-white border border-blue-100 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <span className="text-xs opacity-70 block mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Suggested responses */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestions.map((suggestion, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 transition-colors duration-200 bg-white border border-blue-100"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            )}
            
            <div ref={messageEndRef} />
          </CardContent>
          
          <CardFooter className="p-2 border-t bg-white">
            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
              <Input
                type="text"
                placeholder={t('chatbot.inputPlaceholder', 'Type your message...')}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1"
                ref={inputRef}
              />
              
              {speechSupported.current && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  className={`rounded-full ${isListening ? 'text-red-500' : ''}`}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}
              
              {synthesisSupported.current && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleSpeaking}
                  className="rounded-full"
                >
                  {isSpeaking ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
              )}
              
              <Button 
                type="submit" 
                size="icon"
                disabled={!inputText.trim()}
                className="rounded-full bg-blue-500 hover:bg-blue-600"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}