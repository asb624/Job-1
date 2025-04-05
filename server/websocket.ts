import { WebSocket, WebSocketServer } from "ws";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

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

// Socket.IO for WebRTC signaling
let io: SocketIOServer;

export function setupWebSocket(server: HttpServer) {
  // Set up Socket.IO first for WebRTC signaling
  console.log("Setting up Socket.IO for WebRTC signaling");
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: '/socket.io/', // Explicit path to avoid confusion
    connectTimeout: 30000, // Increase connection timeout
    pingTimeout: 30000, // Prevent timeouts
    pingInterval: 25000, // More frequent ping
    transports: ['websocket', 'polling'] // Enable all transports
  });

  // Map to keep track of user socket connections for calls
  const userSockets = new Map<number, string>();

  io.on("connection", (socket) => {
    console.log("Socket.IO client connected:", socket.id);

    // Get the user ID from query parameter
    const userId = socket.handshake.query.userId;
    if (userId && !isNaN(Number(userId))) {
      const userIdNum = Number(userId);
      userSockets.set(userIdNum, socket.id);
      console.log(`Socket.IO client registered with user ID: ${userIdNum}`);
      
      // Send confirmation to client
      socket.emit('connection-established', {
        socketId: socket.id,
        userId: userIdNum,
        timestamp: new Date().toISOString()
      });
    }

    // Handle WebRTC signaling
    socket.on("call-user", (data) => {
      console.log(`Call request from user ${data.from?.userId} to user ${data.to}`);
      const { to, signal, from, callType } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        console.log(`Forwarding call request to socket ${toSocketId}`);
        io.to(toSocketId).emit("call-incoming", {
          from,
          callType
        });
      } else {
        console.log(`Target user ${to} not connected, call cannot be placed`);
        // Optional: Notify caller that callee is not available
        socket.emit('call-failed', { reason: 'user-unavailable' });
      }
    });

    socket.on("call-answer", (data) => {
      console.log(`Call answer from user ${data.from} to user ${data.to}`);
      const { to, signal, from } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        console.log(`Forwarding call acceptance to socket ${toSocketId}`);
        io.to(toSocketId).emit("call-accepted", {
          signal,
          from
        });
      }
    });

    socket.on("peer-signal", (data) => {
      const { to, signal } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit("peer-signal", {
          signal
        });
      }
    });

    socket.on("call-reject", (data) => {
      console.log(`Call rejected by user, notifying caller ${data.to}`);
      const { to } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit("call-rejected");
      }
    });

    socket.on("call-end", (data) => {
      console.log(`Call ended, notifying participant ${data.to}`);
      const { to } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit("call-ended");
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket.IO error:", error);
    });

    socket.on("disconnect", (reason) => {
      // Remove socket from the map
      userSockets.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`Socket.IO client with userId ${userId} disconnected: ${reason}`);
        }
      });
      console.log(`Socket.IO client disconnected: ${reason}`);
    });
  });

  // Now set up regular WebSocket for general messaging
  console.log("Setting up WebSocket server for general messaging");
  const wss = new WebSocketServer({ 
    server,
    path: "/ws",
    // More explicit error handling
    verifyClient: (info, cb) => {
      try {
        // For debugging connection issues, log the request details
        console.log("WebSocket connection attempt:", info.req.url);
        // Accept all connections for now
        cb(true);
      } catch (error) {
        console.error("Error in WebSocket verifyClient:", error);
        cb(false, 500, "Internal server error");
      }
    }
  });

  // Store clients with their user IDs for targeted messages
  const clients = new Map<number, WebSocket>();

  wss.on("connection", (ws, request) => {
    console.log("WebSocket client connected:", request.url);
    
    // Parse the URL to extract query parameters
    try {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const userId = url.searchParams.get('userId');
      
      // Store the user ID in the client map if provided
      if (userId && !isNaN(parseInt(userId))) {
        const userIdNum = parseInt(userId);
        clients.set(userIdNum, ws);
        console.log(`WebSocket client registered with user ID: ${userIdNum}`);
      }

      // Send immediate confirmation that connection is established
      ws.send(JSON.stringify({ 
        type: "connection", 
        status: "connected",
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error parsing WebSocket URL:", error);
    }

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", (code, reason) => {
      console.log(`WebSocket client disconnected with code ${code} and reason: ${reason || 'No reason provided'}`);
      
      // Remove client from the map
      clients.forEach((client, userId) => {
        if (client === ws) {
          clients.delete(userId);
          console.log(`WebSocket client with userId ${userId} disconnected`);
        }
      });
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        console.log(`Received WebSocket message type: ${message.type}, action: ${message.action}`);

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
        console.error("Error processing WebSocket message:", error);
      }
    });
  });

  // Add error handling for the server
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  // Helper function to broadcast message to all connected clients
  function broadcast(message: WebSocketMessage) {
    const stringMessage = JSON.stringify(message);
    let sentCount = 0;
    
    clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(stringMessage);
        sentCount++;
      } else if (client.readyState !== WebSocket.CONNECTING) {
        // Clean up stale connections
        console.log(`Removing stale WebSocket connection for user ${userId}`);
        clients.delete(userId);
      }
    });
    
    console.log(`Broadcast message sent to ${sentCount} clients`);
  }

  // Helper function to send message to specific user
  function sendToUser(userId: number, message: WebSocketMessage) {
    const client = clients.get(userId);
    if (client?.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      console.log(`Message sent to user ${userId}`);
      return true;
    } else {
      console.log(`User ${userId} not connected or socket not ready, message not sent`);
      return false;
    }
  }

  // Helper function to broadcast to users involved in a selection or conversation
  function broadcastToRelevantUsers(message: WebSocketMessage) {
    const { providerId, userId, user1Id, user2Id } = message.payload;
    let sentToSomeone = false;
    
    // Check for conversation participants first
    if (user1Id) sentToSomeone = sendToUser(user1Id, message) || sentToSomeone;
    if (user2Id) sentToSomeone = sendToUser(user2Id, message) || sentToSomeone;
    
    // If no conversation participants found, try provider/user
    if (!sentToSomeone) {
      if (providerId) sentToSomeone = sendToUser(providerId, message) || sentToSomeone;
      if (userId) sentToSomeone = sendToUser(userId, message) || sentToSomeone;
    }
    
    // If we couldn't send to any specific user, broadcast to everyone
    if (!sentToSomeone) {
      console.log('No specific recipients available, broadcasting to all users');
      broadcast(message);
    }
  }

  // Log active connections for diagnostics
  setInterval(() => {
    console.log(`Active WebSocket connections: ${clients.size}, Socket.IO connections: ${userSockets.size}`);
  }, 60000); // Log every minute

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