// WebSocket connection utility
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 15;  // Increased max attempts
const baseReconnectDelay = 2000;  // Base delay in ms
let isReconnecting = false;  // Track when actively reconnecting
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let intentionalClose = false;
let lastUserId: number | null = null;
let connectionStable = false;  // Track if connection is stable
const connectionStabilityTimeout = 5000;  // Time to consider connection stable

// Heartbeat for connection tracking
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
const heartbeatIntervalTime = 30000; // 30 seconds
let lastPongReceived = Date.now();
const heartbeatTimeout = 45000; // 45 seconds

// Queue for messages when socket is not connected
const messageQueue: any[] = [];

// Heartbeat functions for keeping the connection alive
function startHeartbeat() {
  // Clear any existing heartbeat
  stopHeartbeat();
  
  // Set up new heartbeat interval
  heartbeatInterval = setInterval(() => {
    // Only send heartbeat if socket is open
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Send a ping message
      sendToWebsocket({
        type: 'connection',
        status: 'ping',
        timestamp: new Date().toISOString()
      });
      
      // Check if we've received a pong recently
      const now = Date.now();
      const timeSinceLastPong = now - lastPongReceived;
      
      if (timeSinceLastPong > heartbeatTimeout) {
        console.warn(`No server response for ${timeSinceLastPong}ms, reconnecting...`);
        
        // Close the connection (will trigger reconnect)
        if (socket) {
          intentionalClose = false;
          try {
            socket.close();
          } catch (error) {
            console.error('Error closing stale connection:', error);
          }
          
          // Force reconnection
          if (lastUserId !== null && !isReconnecting) {
            const userId = lastUserId; // local copy for closure
            setTimeout(() => connectWebSocket(userId), 1000);
          } else if (!isReconnecting) {
            setTimeout(initializeWebSocket, 1000);
          }
        }
      }
    }
  }, heartbeatIntervalTime);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Setup socket event handlers
function setupSocketEventHandlers() {
  if (!socket) return;
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
    reconnectAttempts = 0;
    intentionalClose = false;
    isReconnecting = false;
    lastPongReceived = Date.now(); // Initialize pong timestamp
    
    // Mark connection as stable after a short period to ensure it's not quickly closing
    setTimeout(() => {
      connectionStable = true;
      console.log('WebSocket connection marked as stable');
    }, connectionStabilityTimeout);
    
    // Send any queued messages
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      if (message) {
        sendToWebsocket(message);
      }
    }
    
    // Start heartbeat to keep connection alive
    startHeartbeat();
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Update pong timestamp on any received message as implicit heartbeat response
      lastPongReceived = Date.now();
      
      // If this is a ping/pong message specifically, handle it
      if (data.type === 'connection' && data.status === 'pong') {
        console.log('Received pong from server');
        return; // Don't propagate ping/pong messages to listeners
      }
      
      // Dispatch a custom event that can be listened to elsewhere
      const customEvent = new CustomEvent('websocket-message', { detail: data });
      window.dispatchEvent(customEvent);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onclose = (event) => {
    console.log(`WebSocket closed - Code: ${event.code}, Reason: ${event.reason}`);
    
    // Reset connection stable flag
    connectionStable = false;
    
    // Stop heartbeats
    stopHeartbeat();
    
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
    
    // Only attempt to reconnect if not already reconnecting
    if (!isReconnecting && reconnectAttempts < maxReconnectAttempts) {
      isReconnecting = true;
      reconnectAttempts++;
      
      // Calculate backoff delay with jitter to prevent all clients reconnecting at once
      // Use exponential backoff but with a maximum cap
      const jitter = Math.random() * 1000;
      const exponentialBackoff = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts - 1), 30000);
      const delay = exponentialBackoff + jitter;
      
      console.log(`WebSocket reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
      
      reconnectTimeout = setTimeout(() => {
        console.log(`Executing reconnect attempt ${reconnectAttempts}`);
        isReconnecting = false;
        
        if (lastUserId !== null) {
          console.log(`Reconnecting with userId ${lastUserId}`);
          const userId = lastUserId; // Local copy to avoid null issues
          connectWebSocket(userId);
        } else {
          initializeWebSocket();
        }
      }, delay);
    } else if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached, giving up');
      isReconnecting = false;
      
      // Reset attempts after a longer timeout to allow future reconnections
      setTimeout(() => {
        console.log('Resetting reconnection attempts counter after timeout');
        reconnectAttempts = 0;
      }, 60000);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    
    // WebSocket errors often precede a close event
    // Mark connection as unstable so we're ready to handle a potential close
    connectionStable = false;
    
    // If no close event follows within 1 second, we might need to force cleanup
    setTimeout(() => {
      if (socket && socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
        console.log('WebSocket error did not trigger close, manually cleaning up');
        
        // Try to close gracefully
        try {
          intentionalClose = false; // We want reconnection to occur
          socket.close();
        } catch (err) {
          console.error('Error closing socket after error:', err);
        }
        
        // If we have a lastUserId, use it to reconnect
        if (lastUserId !== null && !isReconnecting) {
          console.log('Attempting reconnection after error');
          const userId = lastUserId; // Local copy to avoid null issues
          connectWebSocket(userId);
        }
      }
    }, 1000);
  };
}

// Connect to WebSocket with userId
export function connectWebSocket(userId: number): WebSocket {
  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  // Save userId for reconnection logic
  lastUserId = userId;
  
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
  
  // Create new WebSocket connection with credentials option
  socket = new WebSocket(wsUrl);
  
  // Set up event handlers
  setupSocketEventHandlers();
  
  // Send authentication message when connected
  const onOpen = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log(`WebSocket connected, sending authentication for user ${userId}`);
      sendToWebsocket({
        type: 'auth',
        action: 'identify',
        payload: { userId }
      });
      
      // Remove this one-time handler after execution
      socket.removeEventListener('open', onOpen);
    }
  };
  
  socket.addEventListener('open', onOpen);
  
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
  
  // If we have a lastUserId stored, use it in the URL for immediate authentication
  const wsUrl = lastUserId !== null 
    ? `${protocol}//${window.location.host}/ws?userId=${lastUserId}`
    : `${protocol}//${window.location.host}/ws`;
  
  console.log('Initializing WebSocket connection');
  if (lastUserId !== null) {
    console.log(`Using saved userId: ${lastUserId} in WebSocket URL`);
  }
  
  // Create new WebSocket connection
  socket = new WebSocket(wsUrl);
  
  // Set intentionalClose to false since we want to reconnect if this closes unexpectedly
  intentionalClose = false;
  
  // Set up event handlers
  setupSocketEventHandlers();
  
  // If we have a stored userId, send auth message when connected
  if (lastUserId !== null) {
    const onOpen = () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log(`WebSocket connected, sending authentication for saved user ${lastUserId}`);
        const userId = lastUserId; // Local copy to avoid null issues
        if (userId !== null) {
          sendToWebsocket({
            type: 'auth',
            action: 'identify',
            payload: { userId }
          });
        }
        
        // Remove this one-time handler after execution
        socket.removeEventListener('open', onOpen);
      }
    };
    
    socket.addEventListener('open', onOpen);
  }
}

// Send a message through the WebSocket
export function sendToWebsocket(message: any) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    // Queue the message if socket isn't open
    messageQueue.push(message);
    
    // Initialize WebSocket if not connected
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      // If we have a lastUserId, use that to connect
      if (lastUserId !== null) {
        const userId = lastUserId; // Local copy to avoid null issues
        connectWebSocket(userId);
      } else {
        initializeWebSocket();
      }
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
  // Store the userId for reconnections
  lastUserId = userId;
  
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
      // If we have a lastUserId, we should use connectWebSocket instead
      if (lastUserId !== null) {
        const userId = lastUserId; // Local copy to avoid null issues
        connectWebSocket(userId);
      } else {
        initializeWebSocket();
      }
    }
  });
}