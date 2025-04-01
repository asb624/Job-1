import { useState, useEffect } from 'react';
import { Message } from '../../../shared/schema';
import { MessageTranslationButton } from './message-translation-button';
import { useMessageTranslation } from '../lib/message-translation-service';
import { Card } from '@/components/ui/card';
import { User, Bot } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { MessageReactionPicker } from './message-reaction-picker';

interface TranslatedMessageProps {
  message: Message;
  currentUserId: number;
  otherUser: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  shouldAutoTranslate?: boolean;
}

export function TranslatedMessage({ 
  message, 
  currentUserId, 
  otherUser,
  shouldAutoTranslate = false
}: TranslatedMessageProps) {
  const { translateSingleMessage } = useMessageTranslation();
  const [displayContent, setDisplayContent] = useState(message.content || '');
  const [isTranslated, setIsTranslated] = useState(false);
  const isOwnMessage = message.senderId === currentUserId;
  
  // Auto-translate if specified
  useEffect(() => {
    if (shouldAutoTranslate && message.content && !isTranslated) {
      translateSingleMessage(message).then(translated => {
        setDisplayContent(translated);
        setIsTranslated(translated !== message.content);
      });
    }
  }, [message, shouldAutoTranslate, translateSingleMessage]);
  
  // Reset display content when message changes
  useEffect(() => {
    setDisplayContent(message.content || '');
    setIsTranslated(false);
  }, [message.content]);
  
  const handleTranslated = (translatedText: string) => {
    setDisplayContent(translatedText);
    setIsTranslated(translatedText !== message.content);
  };
  
  // Format timestamp
  const timeAgo = message.createdAt 
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
    : '';
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
        {/* Avatar */}
        <Avatar className="h-8 w-8 mr-2">
          {isOwnMessage ? (
            <>
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              <AvatarImage src="/user-avatar.png" alt="Your avatar" />
            </>
          ) : (
            <>
              <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
              <AvatarImage 
                src={otherUser.avatarUrl || "/default-avatar.png"} 
                alt={`${otherUser.username}'s avatar`}
              />
            </>
          )}
        </Avatar>
        
        {/* Message content */}
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <Card className={`p-3 ${isOwnMessage ? 'bg-primary/10' : 'bg-muted'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="whitespace-pre-wrap break-words">
                {displayContent}
              </div>
              
              {/* Translation button - only show if not auto-translated */}
              {!shouldAutoTranslate && (
                <MessageTranslationButton
                  message={message}
                  onTranslated={handleTranslated}
                />
              )}
            </div>
            
            {/* Translation indicator */}
            {isTranslated && (
              <div className="text-xs text-muted-foreground mt-1 italic">
                Translated
              </div>
            )}
          </Card>
          
          <div className="flex items-center mt-1 text-xs text-muted-foreground">
            <span>{timeAgo}</span>
            {message.isRead && isOwnMessage && (
              <span className="ml-2">✓ Read</span>
            )}
          </div>
          
          {/* Message reactions */}
          <div className="mt-1">
            {/* Only render reaction picker if not testing or if the feature is enabled */}
            {typeof window !== 'undefined' && <MessageReactionPicker messageId={message.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for handling a list of messages with translation
export function TranslatedMessageList({ 
  messages, 
  currentUserId,
  otherUser,
  autoTranslate = false
}: {
  messages: Message[];
  currentUserId: number;
  otherUser: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  autoTranslate?: boolean;
}) {
  const { translateMessages } = useMessageTranslation();
  const [translatedContents, setTranslatedContents] = useState<Map<number, string>>(new Map());
  
  // Handle translating all messages at once
  const handleTranslateAll = async () => {
    const translations = await translateMessages(messages);
    setTranslatedContents(translations);
  };
  
  // Render each message with proper translation handling
  return (
    <div className="flex flex-col space-y-4">
      {messages.map(message => (
        <TranslatedMessage
          key={message.id}
          message={{
            ...message,
            // Use translated content if available
            content: translatedContents.get(message.id) || message.content
          }}
          currentUserId={currentUserId}
          otherUser={otherUser}
          shouldAutoTranslate={autoTranslate}
        />
      ))}
    </div>
  );
}