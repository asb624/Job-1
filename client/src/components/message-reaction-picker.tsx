import { useState, useEffect } from 'react';
import { MessageReaction } from '../../../shared/schema';
import { addMessageReaction, getMessageReactions, removeMessageReaction } from '../lib/message-reaction-service';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SmilePlus } from 'lucide-react';

// Common emoji reactions
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🙏', '🔥', '✅', '💯'];

interface ReactionPickerProps {
  messageId: number;
  onReactionAdded?: (reaction: MessageReaction) => void;
  onReactionRemoved?: (reactionId: number) => void;
}

export function MessageReactionPicker({ messageId, onReactionAdded, onReactionRemoved }: ReactionPickerProps) {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth() || {};
  
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const data = await getMessageReactions(messageId);
        setReactions(data);
      } catch (error) {
        console.error('Failed to fetch reactions:', error);
      }
    };
    
    fetchReactions();
  }, [messageId]);
  
  const handleAddReaction = async (emoji: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check if user already has this reaction
      const existingReaction = reactions.find(r => r.emoji === emoji && r.userId === user.id);
      
      if (existingReaction) {
        // Remove the reaction
        await removeMessageReaction(existingReaction.id);
        setReactions(reactions.filter(r => r.id !== existingReaction.id));
        if (onReactionRemoved) onReactionRemoved(existingReaction.id);
      } else {
        // Add new reaction
        const newReaction = await addMessageReaction(messageId, emoji);
        setReactions([...reactions, newReaction]);
        if (onReactionAdded) onReactionAdded(newReaction);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive"
      });
      console.error('Failed to add reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((groups, reaction) => {
    const { emoji } = reaction;
    if (!groups[emoji]) {
      groups[emoji] = [];
    }
    groups[emoji].push(reaction);
    return groups;
  }, {} as Record<string, MessageReaction[]>);
  
  return (
    <div className="flex items-center space-x-2">
      {/* Display existing reaction groups */}
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => {
        const userHasReacted = user && emojiReactions.some(r => r.userId === user.id);
        
        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={userHasReacted ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-full px-2 py-1 text-xs ${userHasReacted ? 'bg-primary/20' : ''}`}
                  onClick={() => handleAddReaction(emoji)}
                  disabled={isLoading}
                >
                  <span className="mr-1">{emoji}</span>
                  <span>{emojiReactions.length}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{emojiReactions.map(r => `User ${r.userId}`).join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      
      {/* Emoji Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full h-8 w-8 p-0"
            disabled={isLoading}
          >
            <SmilePlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="grid grid-cols-5 gap-2">
            {COMMON_EMOJIS.map(emoji => (
              <button
                key={emoji}
                className="text-xl hover:bg-muted p-2 rounded-md"
                onClick={() => {
                  handleAddReaction(emoji);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}