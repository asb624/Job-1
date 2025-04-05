let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // 1 second

// Helper to check if websockets are enabled
function areWebSocketsEnabled(): boolean {
  const featureFlags = (window as any).__featureFlags || {};
  return !!featureFlags.enableWebSockets;
}

export function connectWebSocket(userId?: number) {
  // First check if WebSockets are enabled by feature flags
  if (!areWebSocketsEnabled()) {
    console.log("WebSocket connections are currently disabled by feature flags");
    return null;
  }

  // Check if we already have an active connection
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("Using existing WebSocket connection");
    return ws;
  }
  
  // Close any existing socket that's in a weird state
  if (ws && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CONNECTING)) {
    console.log("Closing existing socket in transition state");
    try {
      ws.close();
    } catch (err) {
      console.error("Error closing existing socket:", err);
    }
    ws = null;
  }

  // Create a new connection
  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Add userId as a query parameter if provided
    const userParam = userId ? `?userId=${userId}` : '';
    const wsPath = `${protocol}//${window.location.host}/ws${userParam}`;
    
    console.log(`Connecting WebSocket to ${wsPath}`);
    ws = new WebSocket(wsPath);

    ws.onopen = () => {
      console.log("✅ WebSocket connected successfully");
      reconnectAttempts = 0; // Reset attempts on successful connection
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed with code ${event.code} and reason: ${event.reason || 'No reason provided'}`);
      const currentUserId = userId; // Capture userId before clearing ws
      ws = null;

      // Only attempt to reconnect if WebSockets are still enabled
      if (!areWebSocketsEnabled()) {
        console.log("WebSocket reconnection aborted: feature is currently disabled");
        return;
      }

      // Attempt to reconnect with backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
        reconnectAttempts++;
        console.log(`Attempting to reconnect in ${delay}ms... (userId: ${currentUserId || 'none'})`);
        
        // Pass the userId to the reconnection
        setTimeout(() => {
          // Check again at reconnect time if WebSockets are still enabled
          if (areWebSocketsEnabled()) {
            connectWebSocket(currentUserId);
          } else {
            console.log("WebSocket reconnection canceled: feature is disabled");
          }
        }, delay);
      } else {
        console.error("Max reconnection attempts reached");
        // Reset attempts to allow future reconnections if the user triggers them
        setTimeout(() => {
          reconnectAttempts = 0;
        }, 30000); // Wait 30 seconds before allowing reconnections
      }
    };

    return ws;
  } catch (error) {
    console.error("Failed to create WebSocket connection:", error);
    return null;
  }
}

export function sendMessage(type: string, data: any, userId?: number) {
  let socket = ws;
  
  // If no socket exists or it's not open, try to connect
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    socket = connectWebSocket(userId);
  }
  
  if (socket?.readyState === WebSocket.OPEN) {
    const message = { type, data };
    console.log("📤 Sending WebSocket message:", message);
    socket.send(JSON.stringify(message));
  } else {
    console.warn("⚠️ WebSocket not ready, message not sent. Will retry when connection is established.");
    // Could implement a message queue here for retry logic
  }
}

export function subscribeToMessages(callback: (message: any) => void, userId?: number) {
  console.log(`Setting up WebSocket subscription for userId: ${userId || 'anonymous'}`);
  
  // Always get a fresh socket or create one
  let socket = connectWebSocket(userId);
  
  const messageHandler = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      console.log("📥 WebSocket received message:", message);
      callback(message);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  // Set up initial listener if we have a socket
  if (socket) {
    socket.addEventListener("message", messageHandler);
  }

  // Handle socket reconnections and ensure the handler is always attached
  const checkAndReconnect = setInterval(() => {
    // First check if WebSockets are still enabled
    if (!areWebSocketsEnabled()) {
      console.log("WebSocket feature disabled, skipping reconnection check");
      return;
    }
    
    // If we don't have a socket or it's not in OPEN state
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log("WebSocket reconnecting from subscription...");
      
      // Get current socket (might be null or in a bad state)
      const oldSocket = socket;
      
      // Try to get a new socket
      const newSocket = connectWebSocket(userId);
      
      // Clean up old socket listener if needed
      if (oldSocket && oldSocket !== newSocket) {
        try {
          oldSocket.removeEventListener("message", messageHandler);
        } catch (err) {
          console.error("Error removing event listener:", err);
        }
      }
      
      // Add listener to new socket if we got one
      if (newSocket) {
        newSocket.addEventListener("message", messageHandler);
        socket = newSocket;
      }
    }
  }, 5000); // Check every 5 seconds

  // Return cleanup function
  return () => {
    console.log("Cleaning up WebSocket subscription");
    clearInterval(checkAndReconnect);
    
    if (socket) {
      try {
        socket.removeEventListener("message", messageHandler);
      } catch (err) {
        console.error("Error removing event listener during cleanup:", err);
      }
    }
  };
}