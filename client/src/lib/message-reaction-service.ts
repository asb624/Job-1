import { MessageReaction } from '../../../shared/schema';

/**
 * Adds a reaction to a message
 */
export async function addMessageReaction(messageId: number, emoji: string): Promise<MessageReaction> {
  const response = await fetch(`/api/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ emoji })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add reaction');
  }
  
  return response.json();
}

/**
 * Fetches all reactions for a message
 */
export async function getMessageReactions(messageId: number): Promise<MessageReaction[]> {
  const response = await fetch(`/api/messages/${messageId}/reactions`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reactions');
  }
  
  return response.json();
}

/**
 * Removes a reaction from a message
 */
export async function removeMessageReaction(reactionId: number): Promise<void> {
  const response = await fetch(`/api/reactions/${reactionId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove reaction');
  }
}