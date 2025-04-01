let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // 1 second

export function connectWebSocket(userId?: number) {
  if (ws?.readyState === WebSocket.OPEN) return ws;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  // Add userId as a query parameter if provided
  const userParam = userId ? `?userId=${userId}` : '';
  const wsPath = `${protocol}//${window.location.host}/ws${userParam}`;

  ws = new WebSocket(wsPath);

  ws.onopen = () => {
    console.log("WebSocket connected");
    reconnectAttempts = 0; // Reset attempts on successful connection
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
    const currentUserId = userId; // Capture userId before clearing ws
    ws = null;

    // Attempt to reconnect with backoff
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
      reconnectAttempts++;
      console.log(`Attempting to reconnect in ${delay}ms... (userId: ${currentUserId || 'none'})`);
      
      // Pass the userId to the reconnection
      setTimeout(() => connectWebSocket(currentUserId), delay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  };

  return ws;
}

export function sendMessage(type: string, data: any, userId?: number) {
  const socket = connectWebSocket(userId);
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, data }));
  } else {
    console.warn("WebSocket not ready, message not sent");
  }
}

export function subscribeToMessages(callback: (message: any) => void, userId?: number) {
  const socket = connectWebSocket(userId);

  const messageHandler = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      callback(message);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  socket.addEventListener("message", messageHandler);

  // Return cleanup function
  return () => {
    socket.removeEventListener("message", messageHandler);
  };
}