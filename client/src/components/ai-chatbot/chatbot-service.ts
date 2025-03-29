/**
 * Definition of ChatbotResponse type
 */
type ChatbotResponse = {
  text: string;
  suggestions?: string[];
};

/**
 * ChatbotService provides functionality to understand user queries and generate helpful responses
 * about the JobLo platform.
 */
export class ChatbotService {
  // Multilingual keyword arrays for detecting user intent
  private readonly greetings = [
    'hi', 'hello', 'hey', 'greetings', 'namaste', 'hola', 
    'नमस्ते', 'नमस्कार', 'हैलो', 'हाय'
  ];
  
  private readonly goodbyes = [
    'bye', 'goodbye', 'see you', 'cya', 'farewell', 'alvida', 
    'अलविदा', 'बाय', 'फिर मिलेंगे'
  ];
  
  private readonly thanks = [
    'thanks', 'thank you', 'thank', 'thanks a lot', 'dhanyavaad', 'shukriya', 
    'धन्यवाद', 'शुक्रिया'
  ];
  
  private readonly questions = [
    'how', 'what', 'where', 'when', 'why', 'who', 'which', 'can', 'could', 'would', 'will', 'should', 
    'कैसे', 'क्या', 'कहां', 'कब', 'क्यों', 'कौन', 'कौनसा'
  ];
  
  private readonly jobRelatedKeywords = [
    'job', 'work', 'employment', 'career', 'occupation', 'profession', 'hire', 'hiring', 'worker', 'service',
    'नौकरी', 'काम', 'रोज़गार', 'करियर', 'व्यवसाय', 'पेशा', 'भर्ती', 'कामगार', 'सेवा'
  ];
  
  private readonly language: string;
  
  /**
   * Constructor - initializes the service with the specified language
   */
  constructor(language = 'en') {
    this.language = language;
  }

  /**
   * Main method to process user input and return a response
   */
  public async getResponse(message: string): Promise<ChatbotResponse> {
    try {
      console.log("ChatbotService: Processing message:", message);
      
      // Handle empty messages
      if (!message || message.trim() === '') {
        return this.getDefaultResponse();
      }
      
      const lowerMessage = message.toLowerCase().trim();
      
      // First check specific keyword patterns
      
      // 1. Post service related queries
      if ((lowerMessage.includes('post') && lowerMessage.includes('service')) || 
          (lowerMessage.includes('how') && lowerMessage.includes('service')) || 
          (lowerMessage.includes('create') && lowerMessage.includes('service')) ||
          (lowerMessage.includes('सेवा') && (lowerMessage.includes('पोस्ट') || lowerMessage.includes('कैसे')))) {
        
        return {
          text: this.getTranslation('To post a service, click on the "Post Service" button in the navigation bar. Fill out the form with your service details including title, description, category, price, and location information. This helps clients find your services easily.'),
          suggestions: [
            this.getTranslation('What makes a good service post?'),
            this.getTranslation('How to set the right price'),
            this.getTranslation('Can I edit my service later?')
          ]
        };
      }
      
      // 2. Post requirement related queries
      if ((lowerMessage.includes('post') && lowerMessage.includes('requirement')) || 
          (lowerMessage.includes('how') && lowerMessage.includes('requirement')) ||
          (lowerMessage.includes('hire') && lowerMessage.includes('worker')) || 
          (lowerMessage.includes('आवश्यकता') && (lowerMessage.includes('पोस्ट') || lowerMessage.includes('कैसे'))) ||
          (lowerMessage.includes('भर्ती') && lowerMessage.includes('कर्मचारी'))) {
        
        return {
          text: this.getTranslation('To hire workers, click on the "Post Requirement" button in the navigation bar. Specify what service you need, your budget, location, and other details. Service providers can then see your requirement and contact you if they can help.'),
          suggestions: [
            this.getTranslation('How to write a good requirement'),
            this.getTranslation('What details should I include?'),
            this.getTranslation('How to set a reasonable budget')
          ]
        };
      }
      
      // 3. Find jobs/work related queries
      if ((lowerMessage.includes('find') && (lowerMessage.includes('job') || lowerMessage.includes('work'))) || 
          (lowerMessage.includes('looking') && lowerMessage.includes('job')) || 
          (lowerMessage.includes('need') && lowerMessage.includes('work')) ||
          (lowerMessage.includes('नौकरी') && (lowerMessage.includes('खोज') || lowerMessage.includes('ढूंढ'))) ||
          (lowerMessage.includes('काम') && lowerMessage.includes('चाहिए'))) {
        
        return {
          text: this.getTranslation('You can find work opportunities in the "Available Requirements" section on the home page. Browse through requirements that match your skills, or create your own service listing by clicking "Post Service" in the navigation bar.'),
          suggestions: [
            this.getTranslation('How to create a service listing'),
            this.getTranslation('How to apply for requirements'),
            this.getTranslation('How to make my profile attractive')
          ]
        };
      }
      
      // 4. Payment related queries
      if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || 
          lowerMessage.includes('money') || lowerMessage.includes('salary') ||
          lowerMessage.includes('भुगतान') || lowerMessage.includes('पैसा') || 
          lowerMessage.includes('वेतन') || lowerMessage.includes('तनख्वाह')) {
        
        return {
          text: this.getTranslation('Payments on JobLo are arranged directly between service providers and clients. When posting a service or requirement, you can specify your price or budget. We recommend discussing payment terms clearly in the messaging system before finalizing any agreement.'),
          suggestions: [
            this.getTranslation('What are typical rates?'),
            this.getTranslation('Is there payment protection?'),
            this.getTranslation('Can I pay through the app?')
          ]
        };
      }
      
      // 5. Check general categories
      
      // Greetings
      if (this.greetings.some(g => lowerMessage.includes(g))) {
        return this.getGreetingResponse();
      }
      
      // Goodbyes
      if (this.goodbyes.some(g => lowerMessage.includes(g))) {
        return this.getGoodbyeResponse();
      }
      
      // Thanks
      if (this.thanks.some(t => lowerMessage.includes(t))) {
        return this.getThankYouResponse();
      }
      
      // General job related keywords
      if (this.jobRelatedKeywords.some(k => lowerMessage.includes(k))) {
        return this.getJobRelatedResponse(lowerMessage);
      }
      
      // Question words
      if (this.questions.some(q => lowerMessage.startsWith(q))) {
        return this.getQuestionResponse(lowerMessage);
      }
      
      // If we get here, we didn't understand the query
      return this.getDefaultResponse();
      
    } catch (error) {
      console.error("ChatbotService error:", error);
      return {
        text: this.getTranslation('Sorry, I encountered an error. Please try again.'),
        suggestions: [
          this.getTranslation('How does JobLo work?'),
          this.getTranslation('Show me available services'),
          this.getTranslation('How to post a requirement')
        ]
      };
    }
  }
  
  /**
   * Default response for when we don't understand the user's query
   */
  private getDefaultResponse(): ChatbotResponse {
    return {
      text: this.getTranslation('I\'m not sure I understand. You can ask me about using JobLo, finding services, or posting your requirements.'),
      suggestions: [
        this.getTranslation('How do I post a service?'),
        this.getTranslation('How do I find workers?'),
        this.getTranslation('What jobs are available?')
      ]
    };
  }
  
  /**
   * Generate a greeting response
   */
  private getGreetingResponse(): ChatbotResponse {
    const responses = [
      'Hello! How can I help you with JobLo today?',
      'Hi there! Looking for services or workers?',
      'Greetings! How may I assist you with your job needs?',
      'Hello! I\'m JobLo\'s assistant. What can I help you with?'
    ];
    
    return {
      text: this.getTranslation(this.getRandomResponse(responses)),
      suggestions: [
        this.getTranslation('I need to hire someone'),
        this.getTranslation('I\'m looking for work'),
        this.getTranslation('How does JobLo work?')
      ]
    };
  }
  
  /**
   * Generate a goodbye response
   */
  private getGoodbyeResponse(): ChatbotResponse {
    const responses = [
      'Goodbye! Have a great day!',
      'Thank you for chatting. Feel free to return if you need help!',
      'Bye for now. Hope to assist you again soon!',
      'See you later. Remember JobLo is here when you need help!'
    ];
    
    return {
      text: this.getTranslation(this.getRandomResponse(responses))
    };
  }
  
  /**
   * Generate a thank you response
   */
  private getThankYouResponse(): ChatbotResponse {
    const responses = [
      'You\'re welcome! Is there anything else I can help with?',
      'Happy to help! Do you have any other questions?',
      'No problem at all. Need assistance with anything else?',
      'Glad I could help. What else would you like to know about JobLo?'
    ];
    
    return {
      text: this.getTranslation(this.getRandomResponse(responses)),
      suggestions: [
        this.getTranslation('Yes, another question'),
        this.getTranslation('No, that\'s all')
      ]
    };
  }
  
  /**
   * Generate responses for job-related queries
   */
  private getJobRelatedResponse(message: string): ChatbotResponse {
    // For service categories
    if (message.includes('household') || message.includes('domestic') || message.includes('home') ||
        message.includes('घरेलू') || message.includes('घर का')) {
      return {
        text: this.getTranslation('JobLo offers various household services including cooking, cleaning, gardening, and more. You can browse these in the "Available Services" section on the home page.'),
        suggestions: [
          this.getTranslation('What are typical rates?'),
          this.getTranslation('How to verify service providers'),
          this.getTranslation('Are background checks done?')
        ]
      };
    }
    
    if (message.includes('agriculture') || message.includes('farm') || message.includes('farming') ||
        message.includes('कृषि') || message.includes('खेती')) {
      return {
        text: this.getTranslation('For agricultural work, we have laborers, equipment operators, and seasonal workers. Check the "Available Services" section to find agricultural workers, or post a requirement for specific farm labor needs.'),
        suggestions: [
          this.getTranslation('What seasonal workers are available?'),
          this.getTranslation('Finding equipment operators'),
          this.getTranslation('Average wages for farm labor')
        ]
      };
    }
    
    if (message.includes('education') || message.includes('tutor') || message.includes('teach') || message.includes('teacher') || 
        message.includes('शिक्षा') || message.includes('टीचर') || message.includes('पढ़ाई')) {
      return {
        text: this.getTranslation('JobLo offers various education services including tutoring, language teaching, skills training, and career counseling. Browse the "Available Services" section to find qualified educators and trainers in your area.'),
        suggestions: [
          this.getTranslation('What subjects are covered?'),
          this.getTranslation('Are online classes available?'),
          this.getTranslation('How to choose a good tutor')
        ]
      };
    }
    
    // Default job-related response
    return {
      text: this.getTranslation('JobLo connects you with workers and jobs across various categories. You can browse "Available Services" and "Available Requirements" on the home page to see what\'s currently offered.'),
      suggestions: [
        this.getTranslation('Show me available services'),
        this.getTranslation('How to post a requirement'),
        this.getTranslation('How payments work')
      ]
    };
  }
  
  /**
   * Generate responses for questions
   */
  private getQuestionResponse(message: string): ChatbotResponse {
    // How JobLo works
    if ((message.includes('how') && message.includes('work')) || 
        (message.includes('कैसे') && message.includes('काम')) || 
        (message.includes('जॉबलो') && message.includes('कैसे'))) {
      return {
        text: this.getTranslation('JobLo is a platform that connects service providers with people who need their services. On the home page, you can browse "Available Services" offered by providers and "Available Requirements" posted by people looking for help. You can also post your own service or requirement using the buttons in the navigation bar.'),
        suggestions: [
          this.getTranslation('How to get started'),
          this.getTranslation('Is it free to use?'),
          this.getTranslation('How secure is JobLo?')
        ]
      };
    }
    
    // What services are available
    if ((message.includes('what') && message.includes('service')) || 
        (message.includes('available') && message.includes('service')) ||
        (message.includes('क्या') && message.includes('सेवाएं')) ||
        (message.includes('कौन') && message.includes('सेवा'))) {
      return {
        text: this.getTranslation('JobLo offers various services including household help, agricultural labor, shop staff, salon services, medical assistance, and education services. You can browse all available services on the home page under the "Available Services" section.'),
        suggestions: [
          this.getTranslation('Most popular services'),
          this.getTranslation('How to contact a service provider'),
          this.getTranslation('Check service ratings')
        ]
      };
    }
    
    // General question fallback
    return {
      text: this.getTranslation('That\'s a good question! JobLo makes it easy to find services and post requirements. You can explore the platform by checking out the "Available Services" and "Available Requirements" sections on the home page.'),
      suggestions: [
        this.getTranslation('How do I register?'),
        this.getTranslation('What services are popular?'),
        this.getTranslation('How do I contact support?')
      ]
    };
  }
  
  /**
   * Randomly select one response from an array of options
   */
  private getRandomResponse(responses: string[]): string {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }
  
  /**
   * Translate a message using i18next
   */
  private getTranslation(text: string): string {
    if (!text) return '';
    
    // Map common responses to their translation keys
    const commonTranslations: Record<string, string> = {
      // Default / Error responses
      "I'm not sure I understand. You can ask me about using JobLo, finding services, or posting your requirements.": "chatbot.responses.dontUnderstand",
      "Sorry, I encountered an error. Please try again.": "chatbot.error",
      
      // Frequently used suggestions
      "How do I post a service?": "chatbot.suggestion.postService",
      "How do I find workers?": "chatbot.suggestion.findWorkers",
      "What jobs are available?": "chatbot.suggestion.viewJobs",
      
      // Greeting responses
      "Hello! How can I help you with JobLo today?": "chatbot.responses.greeting1",
      "Hi there! Looking for services or workers?": "chatbot.responses.greeting2",
      "Greetings! How may I assist you with your job needs?": "chatbot.responses.greeting3",
      "Hello! I'm JobLo's assistant. What can I help you with?": "chatbot.responses.greeting4",
      
      // Goodbye responses
      "Goodbye! Have a great day!": "chatbot.responses.goodbye1",
      "Thank you for chatting. Feel free to return if you need help!": "chatbot.responses.goodbye2",
      "Bye for now. Hope to assist you again soon!": "chatbot.responses.goodbye3",
      "See you later. Remember JobLo is here when you need help!": "chatbot.responses.goodbye4",
      
      // Common suggestions
      "I need to hire someone": "chatbot.suggestions.hire",
      "I'm looking for work": "chatbot.suggestions.findWork",
      "How does JobLo work?": "chatbot.suggestions.howItWorks",
      "Yes, another question": "chatbot.suggestions.yesQuestion",
      "No, that's all": "chatbot.suggestions.noMore",
      "How to write a good requirement": "chatbot.suggestions.writeRequirement",
      "What details should I include?": "chatbot.suggestions.details",
      "How much should I pay?": "chatbot.suggestions.payment",
      "How to create a service listing": "chatbot.suggestions.createListing",
      "How to make my profile attractive": "chatbot.suggestions.attractiveProfile",
      "How do I get selected?": "chatbot.suggestions.getSelected"
    };
    
    // If we have a defined translation key for this exact text, use it
    if (commonTranslations[text]) {
      if ((window as any).i18n && (window as any).i18n.t) {
        return (window as any).i18n.t(commonTranslations[text], { defaultValue: text });
      }
    }
    
    // If no direct mapping exists, try to look up a direct translation by using the text as a key
    if ((window as any).i18n && (window as any).i18n.t) {
      const directResult = (window as any).i18n.t(text, { defaultValue: null });
      if (directResult !== null && directResult !== text) {
        return directResult;
      }
      
      // Otherwise return the original text
      return text;
    }
    
    return text;
  }
}

/**
 * Check if speech recognition is supported by the browser
 */
export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Check if speech synthesis is supported by the browser
 */
export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}