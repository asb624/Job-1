type ChatbotResponse = {
  text: string;
  suggestions?: string[];
};

// Free alternative to OpenAI - Rule-based responses
export class ChatbotService {
  private readonly greetings = ['hi', 'hello', 'hey', 'greetings', 'namaste', 'hola'];
  private readonly goodbyes = ['bye', 'goodbye', 'see you', 'cya', 'farewell', 'alvida'];
  private readonly thanks = ['thanks', 'thank you', 'thank', 'thanks a lot', 'dhanyavaad', 'shukriya'];
  private readonly questions = ['how', 'what', 'where', 'when', 'why', 'who', 'which', 'can', 'could', 'would', 'will', 'should'];
  private readonly jobRelatedKeywords = [
    'job', 'work', 'service', 'employment', 'hire', 'salary', 'wage', 'pay',
    'house', 'household', 'agriculture', 'farm', 'shop', 'salon', 'beauty', 'medical',
    'required', 'requirement', 'looking for', 'need', 'worker', 'staff', 'labor', 'labour',
    'helper', 'domestic', 'cook', 'maid', 'gardener', 'driver'
  ];
  
  private readonly language: string;

  constructor(language = 'en') {
    this.language = language;
  }

  public async getResponse(message: string): Promise<ChatbotResponse> {
    const lowerMessage = message.toLowerCase().trim();
    
    // Handle greetings
    if (this.greetings.some(g => lowerMessage.includes(g))) {
      return this.getGreetingResponse();
    }
    
    // Handle goodbyes
    if (this.goodbyes.some(g => lowerMessage.includes(g))) {
      return this.getGoodbyeResponse();
    }
    
    // Handle thanks
    if (this.thanks.some(t => lowerMessage.includes(t))) {
      return this.getThankYouResponse();
    }
    
    // Handle job-related queries
    if (this.jobRelatedKeywords.some(k => lowerMessage.includes(k))) {
      return this.getJobRelatedResponse(lowerMessage);
    }
    
    // Handle questions
    if (this.questions.some(q => lowerMessage.startsWith(q))) {
      return this.getQuestionResponse(lowerMessage);
    }
    
    // Default response
    return {
      text: this.getTranslation('I\'m not sure I understand. Can you rephrase or ask about jobs, services, or requirements?'),
      suggestions: [
        this.getTranslation('How do I post a service?'),
        this.getTranslation('How do I find workers?'),
        this.getTranslation('What jobs are available?')
      ]
    };
  }
  
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
  
  private getJobRelatedResponse(message: string): ChatbotResponse {
    // For hiring
    if (message.includes('hire') || message.includes('need worker') || message.includes('looking for worker') || message.includes('find staff')) {
      return {
        text: this.getTranslation('To hire workers, you can post a requirement by clicking the "Post Requirement" button in the navigation bar. Describe your needs, budget, and location, and service providers will contact you.'),
        suggestions: [
          this.getTranslation('How to write a good requirement'),
          this.getTranslation('What details should I include?'),
          this.getTranslation('How much should I pay?')
        ]
      };
    }
    
    // For finding work
    if (message.includes('find job') || message.includes('looking for job') || message.includes('need work') || message.includes('search job')) {
      return {
        text: this.getTranslation('To find work, you can register as a service provider and post your services or browse open requirements. You can also apply to requirements that match your skills.'),
        suggestions: [
          this.getTranslation('How to create a service listing'),
          this.getTranslation('How to make my profile attractive'),
          this.getTranslation('How do I get selected?')
        ]
      };
    }
    
    // For service categories
    if (message.includes('household') || message.includes('domestic') || message.includes('home')) {
      return {
        text: this.getTranslation('JobLo offers various household services including cooking, cleaning, gardening, and more. You can browse these under the "Household Work" category on the home page.'),
        suggestions: [
          this.getTranslation('What are typical rates?'),
          this.getTranslation('How to verify service providers'),
          this.getTranslation('Are background checks done?')
        ]
      };
    }
    
    if (message.includes('agriculture') || message.includes('farm') || message.includes('farming')) {
      return {
        text: this.getTranslation('For agricultural work, we have laborers, equipment operators, and seasonal workers. Check the "Agriculture" category to see available services or post your requirements.'),
        suggestions: [
          this.getTranslation('What seasonal workers are available?'),
          this.getTranslation('Equipment operators near me'),
          this.getTranslation('Average wages for farm labor')
        ]
      };
    }
    
    // Default job-related response
    return {
      text: this.getTranslation('JobLo connects you with workers across various categories including Household Work, Agriculture, Shop Staff, Salon Services, and Medical Staff. How can I help you find the right match?'),
      suggestions: [
        this.getTranslation('Show me available services'),
        this.getTranslation('How to post a requirement'),
        this.getTranslation('How payments work')
      ]
    };
  }
  
  private getQuestionResponse(message: string): ChatbotResponse {
    if (message.includes('post') && (message.includes('service') || message.includes('job'))) {
      return {
        text: this.getTranslation('To post a service, click on "Post Service" in the navigation bar. Fill out the form with your service details, including title, description, category, price, and location. This helps clients find you easily.'),
        suggestions: [
          this.getTranslation('What makes a good service post?'),
          this.getTranslation('How to set the right price'),
          this.getTranslation('Can I edit my service later?')
        ]
      };
    }
    
    if (message.includes('post') && message.includes('requirement')) {
      return {
        text: this.getTranslation('To post a requirement, click on "Post Requirement" in the navigation bar. Specify what service you need, your budget, location, and other details. Service providers can then contact you or apply directly.'),
        suggestions: [
          this.getTranslation('How detailed should my requirement be?'),
          this.getTranslation('How to set a reasonable budget'),
          this.getTranslation('How long until I get responses?')
        ]
      };
    }
    
    if (message.includes('how') && message.includes('work')) {
      return {
        text: this.getTranslation('JobLo works as a platform connecting service providers with clients. Providers list their services, and clients post requirements. You can browse services on a map or list view, communicate through our messaging system, and finalize your arrangements securely.'),
        suggestions: [
          this.getTranslation('How to get started'),
          this.getTranslation('Is it free to use?'),
          this.getTranslation('How secure is JobLo?')
        ]
      };
    }
    
    if (message.includes('payment') || message.includes('pay') || message.includes('money') || message.includes('salary')) {
      return {
        text: this.getTranslation('Payments on JobLo are currently arranged directly between providers and clients. When posting a service or requirement, you can specify your price or budget. We recommend discussing payment terms clearly in the messaging system before finalizing.'),
        suggestions: [
          this.getTranslation('What are typical rates?'),
          this.getTranslation('Is there payment protection?'),
          this.getTranslation('Can I pay through the app?')
        ]
      };
    }
    
    return {
      text: this.getTranslation('That\'s a good question! JobLo is designed to make finding and offering services simple. Is there something specific about the platform you\'d like to know?'),
      suggestions: [
        this.getTranslation('How do I register?'),
        this.getTranslation('What services are popular?'),
        this.getTranslation('How do I contact support?')
      ]
    };
  }
  
  private getRandomResponse(responses: string[]): string {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }
  
  // Use the i18next translation function
  private getTranslation(text: string): string {
    // Import the i18n instance at class level would create circular dependencies
    // So we access it via window as it's configured globally
    if ((window as any).i18n && (window as any).i18n.t) {
      return (window as any).i18n.t(text);
    }
    return text;
  }
}

// Function to check if Speech Recognition is available in the browser
export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

// Function to check if Speech Synthesis is available in the browser
export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}