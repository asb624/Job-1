// WebSocket connection utility
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 2000;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let intentionalClose = false;

// Queue for messages when socket is not connected
const messageQueue: any[] = [];

// Setup socket event handlers
function setupSocketEventHandlers() {
  if (!socket) return;
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
    reconnectAttempts = 0;
    intentionalClose = false;
    
    // Send any queued messages
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      if (message) {
        sendToWebsocket(message);
      }
    }
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Dispatch a custom event that can be listened to elsewhere
      const customEvent = new CustomEvent('websocket-message', { detail: data });
      window.dispatchEvent(customEvent);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onclose = (event) => {
    console.log(`WebSocket closed - Code: ${event.code}, Reason: ${event.reason}`);
    
    // Don't reconnect if the closure was intentional
    if (intentionalClose) {
      console.log('WebSocket closed intentionally, not reconnecting');
      return;
    }
    
    // Clear any existing reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    // Attempt to reconnect if not at maximum attempts
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = reconnectDelay * Math.min(reconnectAttempts, 5); // Cap the delay growth
      console.log(`WebSocket reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
      
      reconnectTimeout = setTimeout(() => {
        console.log(`Executing reconnect attempt ${reconnectAttempts}`);
        initializeWebSocket();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached, giving up');
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Connect to WebSocket with userId
export function connectWebSocket(userId: number): WebSocket {
  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  // Mark as intentional close if we're closing an existing connection
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    intentionalClose = true;
    socket.close();
  }
  
  // Reset reconnect attempts since this is a user-initiated connection
  reconnectAttempts = 0;
  
  // Determine WebSocket URL based on window location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
  
  console.log(`Connecting to WebSocket with userId: ${userId}`);
  
  // Create new WebSocket connection
  socket = new WebSocket(wsUrl);
  
  // Set up event handlers
  setupSocketEventHandlers();
  
  return socket;
}

// Initialize WebSocket connection without userId
export function initializeWebSocket() {
  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  // Mark as intentional close if we're closing an existing connection
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    intentionalClose = true;
    socket.close();
  }
  
  // Determine WebSocket URL based on window location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  console.log('Initializing WebSocket connection');
  
  // Create new WebSocket connection
  socket = new WebSocket(wsUrl);
  
  // Set intentionalClose to false since we want to reconnect if this closes unexpectedly
  intentionalClose = false;
  
  // Set up event handlers
  setupSocketEventHandlers();
}

// Send a message through the WebSocket
export function sendToWebsocket(message: any) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    // Queue the message if socket isn't open
    messageQueue.push(message);
    
    // Initialize WebSocket if not connected
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      initializeWebSocket();
    }
    
    return;
  }
  
  // Send the message
  socket.send(JSON.stringify(message));
}

// Listen for specific message types
export function listenForWebSocketMessage<T = any>(
  messageType: string,
  callback: (data: T) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    const data = customEvent.detail;
    
    if (data && data.type === messageType) {
      callback(data as T);
    }
  };
  
  window.addEventListener('websocket-message', handler);
  
  // Return a function to remove the listener
  return () => {
    window.removeEventListener('websocket-message', handler);
  };
}

// Specifically subscribe to message events with authentication
export function subscribeToMessages(
  callback: (data: any) => void,
  userId: number
): () => void {
  // Function to send authentication message
  const sendAuthMessage = () => {
    console.log(`Sending WebSocket auth message for user ${userId}`);
    sendToWebsocket({
      type: 'auth',
      action: 'identify',
      payload: { userId }
    });
  };
  
  // Send authentication message immediately if already connected
  if (socket && socket.readyState === WebSocket.OPEN) {
    sendAuthMessage();
  }
  
  // Set up reconnect handler to re-authenticate
  const reconnectHandler = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Wait a small amount of time to ensure the connection is fully established
      setTimeout(sendAuthMessage, 100);
    }
  };
  
  socket?.addEventListener('open', reconnectHandler);
  
  // Listen for all message types, not just 'message' type
  const unsubscribe = (event: Event) => {
    const customEvent = event as CustomEvent;
    const data = customEvent.detail;
    
    // Pass all message types to the callback
    if (data) {
      callback(data);
    }
  };
  
  window.addEventListener('websocket-message', unsubscribe);
  
  // Return function to clean up both listeners
  return () => {
    window.removeEventListener('websocket-message', unsubscribe);
    socket?.removeEventListener('open', reconnectHandler);
  };
}

// Initialize WebSocket on page load
if (typeof window !== 'undefined') {
  initializeWebSocket();
  
  // Reconnect on visibilitychange (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && 
        (!socket || socket.readyState === WebSocket.CLOSED)) {
      initializeWebSocket();
    }
  });
}
