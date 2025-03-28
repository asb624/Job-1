import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";

// Define message types for type safety
type WebSocketMessage = {
  type: 'selection' | 'service' | 'requirement' | 'notification';
  action: 'create' | 'update' | 'delete';
  payload: any;
};

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws",
    // Add proper error handling
    verifyClient: (info, cb) => {
      // Accept all connections for now
      // In production, you might want to verify the user's session
      cb(true);
    }
  });

  // Store clients with their user IDs for targeted messages
  const clients = new Map<number, WebSocket>();

  wss.on("connection", (ws, request) => {
    console.log("WebSocket client connected");

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      // Remove client from the map
      for (const [userId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(userId);
          break;
        }
      }
      console.log("WebSocket client disconnected");
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;

        switch (message.type) {
          case 'selection':
            // Handle selection notifications
            broadcastToRelevantUsers(message);
            break;
          case 'service':
            // Handle service updates
            broadcast(message);
            break;
          case 'requirement':
            // Handle requirement updates
            broadcast(message);
            break;
          case 'notification':
            // Handle general notifications
            if (message.payload.userId) {
              sendToUser(message.payload.userId, message);
            } else {
              broadcast(message);
            }
            break;
          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    // Send initial connection success message
    ws.send(JSON.stringify({ 
      type: "connection", 
      status: "connected",
      timestamp: new Date().toISOString()
    }));
  });

  // Add error handling for the server
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  // Helper function to broadcast message to all connected clients
  function broadcast(message: WebSocketMessage) {
    for (const client of clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }

  // Helper function to send message to specific user
  function sendToUser(userId: number, message: WebSocketMessage) {
    const client = clients.get(userId);
    if (client?.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  // Helper function to broadcast to users involved in a selection
  function broadcastToRelevantUsers(message: WebSocketMessage) {
    const { providerId, userId } = message.payload;
    if (providerId) sendToUser(providerId, message);
    if (userId) sendToUser(userId, message);
  }

  // Export these functions so they can be used from routes
  return {
    broadcast,
    sendToUser,
    broadcastToRelevantUsers
  };
}