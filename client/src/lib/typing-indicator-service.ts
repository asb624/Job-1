/**
 * Set the user's typing status in a conversation
 */
export async function setTypingStatus(conversationId: number, isTyping: boolean): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}/typing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isTyping })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update typing status');
  }
}

/**
 * Get users who are currently typing in a conversation
 */
export async function getTypingUsers(conversationId: number): Promise<{userId: number, isTyping: boolean}[]> {
  const response = await fetch(`/api/conversations/${conversationId}/typing`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch typing status');
  }
  
  return response.json();
}

/**
 * Debounce helper for typing indicators
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}