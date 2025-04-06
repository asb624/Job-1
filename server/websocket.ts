import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";

// Define message types for type safety
export type WebSocketMessage = {
  type: 'selection' | 'service' | 'requirement' | 'notification' | 'message' | 'conversation';
  action: 'create' | 'update' | 'delete';
  payload: any;
};

// Global references for exported functions
let globalBroadcast: (message: WebSocketMessage) => void;
let globalSendToUser: (userId: number, message: WebSocketMessage) => void;
let globalBroadcastToRelevantUsers: (message: WebSocketMessage) => void;

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
    
    // Parse the URL to extract query parameters
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    // Store the user ID in the client map if provided
    if (userId && !isNaN(parseInt(userId))) {
      const userIdNum = parseInt(userId);
      clients.set(userIdNum, ws);
      console.log(`Client registered with user ID: ${userIdNum}`);
    }

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      // Remove client from the map
      clients.forEach((client, userId) => {
        if (client === ws) {
          clients.delete(userId);
          console.log(`Client with userId ${userId} disconnected`);
        }
      });
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
          case 'message':
            // Handle message updates - send to users in conversation
            if (message.payload.senderId && message.payload.conversationId) {
              const senderId = message.payload.senderId;
              const conversationId = message.payload.conversationId;
              
              // If we have user1Id and user2Id in the payload, target them directly
              if (message.payload.user1Id && message.payload.user2Id) {
                console.log(`Sending message to users: ${message.payload.user1Id}, ${message.payload.user2Id}`);
                sendToUser(message.payload.user1Id, message);
                sendToUser(message.payload.user2Id, message);
              } else {
                // If we don't have user IDs, broadcast for now
                // This should be improved to query the database for conversation users
                console.log(`Broadcasting message ${message.type} action ${message.action}`);
                broadcast(message);
              }
            }
            break;
          case 'conversation':
            // Handle conversation updates
            if (message.payload.user1Id && message.payload.user2Id) {
              // Send to specific users in the conversation
              console.log(`Sending conversation update to users ${message.payload.user1Id} and ${message.payload.user2Id}`);
              sendToUser(message.payload.user1Id, message);
              sendToUser(message.payload.user2Id, message);
            } else if (message.payload.conversationId) {
              // Without specific user IDs, broadcast to everyone
              // In a production app, this should query for conversation participants
              console.log(`Broadcasting conversation update for conversation ${message.payload.conversationId}`);
              broadcast(message);
            } else {
              broadcast(message);
            }
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
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Helper function to send message to specific user
  function sendToUser(userId: number, message: WebSocketMessage) {
    const client = clients.get(userId);
    if (client?.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  // Helper function to broadcast to users involved in a selection or conversation
  function broadcastToRelevantUsers(message: WebSocketMessage) {
    const { providerId, userId, user1Id, user2Id } = message.payload;
    
    // Check for conversation participants first
    if (user1Id) sendToUser(user1Id, message);
    if (user2Id) sendToUser(user2Id, message);
    
    // If no conversation participants found, try provider/user
    if (!user1Id && !user2Id) {
      if (providerId) sendToUser(providerId, message);
      if (userId) sendToUser(userId, message);
    }
  }

  // Assign globals for direct export
  globalBroadcast = broadcast;
  globalSendToUser = sendToUser;
  globalBroadcastToRelevantUsers = broadcastToRelevantUsers;
  
  // Export these functions so they can be used from routes
  return {
    broadcast,
    sendToUser,
    broadcastToRelevantUsers
  };
}

// Export the global functions for direct use in other files
export const broadcast = (message: WebSocketMessage) => {
  if (globalBroadcast) {
    globalBroadcast(message);
  } else {
    console.warn('WebSocket not initialized. Message not sent.');
  }
};

export const sendToUser = (userId: number, message: WebSocketMessage) => {
  if (globalSendToUser) {
    globalSendToUser(userId, message);
  } else {
    console.warn('WebSocket not initialized. Message not sent to user.');
  }
};

export const broadcastToRelevantUsers = (message: WebSocketMessage) => {
  if (globalBroadcastToRelevantUsers) {
    globalBroadcastToRelevantUsers(message);
  } else {
    console.warn('WebSocket not initialized. Message not broadcast to relevant users.');
  }
};