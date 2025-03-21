let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // 1 second

export function connectWebSocket() {
  if (ws?.readyState === WebSocket.OPEN) return ws;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsPath = `${protocol}//${window.location.host}/ws`;

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
    ws = null;

    // Attempt to reconnect with backoff
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
      reconnectAttempts++;
      console.log(`Attempting to reconnect in ${delay}ms...`);
      setTimeout(connectWebSocket, delay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  };

  return ws;
}

export function sendMessage(type: string, data: any) {
  const socket = connectWebSocket();
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, data }));
  } else {
    console.warn("WebSocket not ready, message not sent");
  }
}

export function subscribeToMessages(callback: (message: any) => void) {
  const socket = connectWebSocket();

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