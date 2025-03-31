import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getTypingUsers, setTypingStatus, debounce } from '../lib/typing-indicator-service';

interface TypingIndicatorProps {
  conversationId: number;
  otherUserName: string;
}

export function TypingIndicator({ conversationId, otherUserName }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<{userId: number, isTyping: boolean}[]>([]);
  const { user } = useAuth() || {};
  
  // Set up polling for typing status
  useEffect(() => {
    if (!conversationId) return;
    
    const fetchTypingStatus = async () => {
      try {
        const users = await getTypingUsers(conversationId);
        setTypingUsers(users);
      } catch (error) {
        console.error('Failed to fetch typing status:', error);
      }
    };
    
    // Initialize
    fetchTypingStatus();
    
    // Poll for updates every 3 seconds
    const intervalId = setInterval(fetchTypingStatus, 3000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [conversationId]);
  
  // Filter out current user and get only typing users
  const otherUsersTyping = typingUsers.filter(
    u => u.userId !== user?.id && u.isTyping
  );
  
  if (otherUsersTyping.length === 0) {
    return null;
  }
  
  return (
    <div className="py-1 px-2 text-xs text-muted-foreground italic flex items-center">
      <div className="typing-indicator mr-2">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span>{otherUserName} is typing...</span>
    </div>
  );
}

interface TypingMonitorProps {
  conversationId: number;
  isActive?: boolean;
}

export function useTypingMonitor({ conversationId, isActive = true }: TypingMonitorProps) {
  const { user } = useAuth() || {};
  
  // Create debounced version of setTypingStatus
  const debouncedStopTyping = debounce(async () => {
    if (!user || !conversationId) return;
    try {
      await setTypingStatus(conversationId, false);
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }
  }, 2000);
  
  const handleTyping = async () => {
    if (!user || !conversationId || !isActive) return;
    
    try {
      await setTypingStatus(conversationId, true);
      // Schedule to turn off typing indicator after delay
      debouncedStopTyping();
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }
  };
  
  // Clean up typing status when component unmounts
  useEffect(() => {
    if (!user || !conversationId) return;
    
    // Set typing to false when unmounting
    return () => {
      setTypingStatus(conversationId, false).catch(error => {
        console.error('Failed to clear typing status:', error);
      });
    };
  }, [user, conversationId]);
  
  return { handleTyping };
}