import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import { storage } from "./storage";

// Define message types for type safety
export type WebSocketMessage = {
  type: 'selection' | 'service' | 'requirement' | 'notification' | 'message' | 'conversation' | 'call-signal' | 'auth' | 'connection';
  action?: 'create' | 'update' | 'delete' | 'offer' | 'answer' | 'icecandidate' | 'call-request' | 'call-accept' | 'call-reject' | 'call-end' | 'identify' | 'authenticate';
  status?: 'connected' | 'ping' | 'pong';
  payload?: any;
  timestamp?: string;
};

// Global references for exported functions
let globalBroadcast: (message: WebSocketMessage) => void;
let globalSendToUser: (userId: number, message: WebSocketMessage) => void;
let globalBroadcastToRelevantUsers: (message: WebSocketMessage) => void;

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws",
    // Add proper error handling with session validation
    verifyClient: (info, cb) => {
      try {
        // Always accept the initial connection but log cookie status
        const cookies = info.req.headers.cookie;
        
        if (!cookies) {
          console.log("[websocket] No cookie found in connection request");
          // Accept connection even without cookie - will require auth via message
          return cb(true);
        }
        
        console.log("[websocket] Connection request with cookie received");
        
        // Extract userId from URL if present (used as fallback)
        const url = new URL(info.req.url || '', `http://${info.req.headers.host}`);
        const userId = url.searchParams.get('userId');
        if (userId) {
          console.log(`[websocket] UserId from URL: ${userId}`);
        }
        
        // We accept all initial connections and require authentication
        // either via session cookie or via auth message
        return cb(true);
      } catch (error) {
        console.error("[websocket] Error verifying WebSocket client:", error);
        // Accept connection but it will be unauthenticated until proper auth message
        return cb(true);
      }
    }
  });

  // Store clients with their user IDs for targeted messages
  const clients = new Map<number, WebSocket>();

  // Implement a heartbeat mechanism to keep connections alive
  function heartbeat(this: WebSocket & { isAlive?: boolean }) {
    this.isAlive = true;
  }
  
  // Check for dead connections every 30 seconds
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        // Client didn't respond to ping, terminate connection
        console.log("Terminating inactive WebSocket connection");
        return ws.terminate();
      }
      
      // Mark as inactive for next ping cycle
      ws.isAlive = false;
      // Send ping (client should respond with pong)
      try {
        ws.ping();
      } catch (e) {
        console.error("Error sending ping:", e);
      }
    });
  }, 30000);
  
  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  wss.on("connection", (ws: WebSocket & { isAlive?: boolean }, request) => {
    console.log("WebSocket client connected");
    
    // Initialize connection as alive
    ws.isAlive = true;
    
    // Parse the URL to extract query parameters
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    // Parse cookies for session information
    const cookies = request.headers.cookie;
    if (cookies) {
      console.log("[websocket] Processing cookies for WebSocket authentication");
      
      // In a production environment, you would parse the session cookie
      // and validate it against the session store to get the user ID
      // For now, we'll use the userId query parameter
    }
    
    // Store the user ID in the client map if provided
    if (userId && !isNaN(parseInt(userId))) {
      const userIdNum = parseInt(userId);
      
      // Validate user exists before adding to client map (async)
      storage.getUser(userIdNum).then(user => {
        if (user) {
          // Remove any existing connection for this user ID
          const existingConnection = clients.get(userIdNum);
          if (existingConnection && existingConnection !== ws) {
            console.log(`Replacing existing connection for user ${userIdNum}`);
            try {
              existingConnection.close();
            } catch (e) {
              console.error(`Error closing existing connection for user ${userIdNum}:`, e);
            }
          }
          
          clients.set(userIdNum, ws);
          console.log(`Client registered with user ID: ${userIdNum}`);
          
          // Send auth confirmation
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'auth',
              action: 'authenticate',
              payload: { 
                success: true,
                userId: userIdNum,
                timestamp: new Date().toISOString()
              }
            }));
          }
        } else {
          console.log(`User ID from URL parameter not found: ${userIdNum}`);
        }
      }).catch(error => {
        console.error(`Error validating user ${userId}:`, error);
      });
    }
    
    // Handle pong messages (response to our ping)
    ws.on('pong', heartbeat);

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", (code, reason) => {
      // Log close code and reason for debugging
      console.log(`WebSocket closed with code ${code}${reason ? ` and reason: ${reason}` : ''}`);
      
      // Remove client from the map
      clients.forEach((client, clientUserId) => {
        if (client === ws) {
          clients.delete(clientUserId);
          console.log(`Client with userId ${clientUserId} disconnected`);
        }
      });
      console.log("WebSocket client disconnected");
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;

        switch (message.type) {
          case 'connection':
            // Handle ping/pong for custom heartbeat
            if (message.status === 'ping') {
              // Respond with a pong message
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                  type: "connection", 
                  status: "pong",
                  timestamp: new Date().toISOString()
                }));
              }
            }
            break;
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
          case 'call-signal':
            // Handle WebRTC signaling
            if (message.payload.to) {
              // Direct the signal to the specific recipient
              console.log(`WebRTC Signaling: ${message.action} from ${message.payload.from} to ${message.payload.to}`);
              sendToUser(message.payload.to, message);
            } else {
              console.warn('WebRTC signal missing recipient (to) field');
            }
            break;
          case 'auth':
            // Handle authentication messages
            if (message.action === 'identify' && message.payload.userId) {
              const userId = message.payload.userId;
              console.log(`User identified via WebSocket: ${userId}`);
              
              // Validate user exists (can be enhanced to validate against session)
              storage.getUser(userId).then((user) => {
                if (user) {
                  // Store the connection with the user ID if valid user
                  clients.set(userId, ws);
                  
                  // Acknowledge the auth message with success
                  ws.send(JSON.stringify({
                    type: 'auth',
                    action: 'authenticate',
                    payload: { 
                      success: true,
                      userId,
                      timestamp: new Date().toISOString()
                    }
                  }));
                  
                  console.log(`WebSocket authentication successful for user ${userId}`);
                } else {
                  // Send failure if user doesn't exist
                  ws.send(JSON.stringify({
                    type: 'auth',
                    action: 'authenticate',
                    payload: { 
                      success: false,
                      error: 'User not found',
                      timestamp: new Date().toISOString()
                    }
                  }));
                  
                  console.log(`WebSocket authentication failed - user ${userId} not found`);
                }
              }).catch((error: Error) => {
                console.error(`WebSocket authentication error for user ${userId}:`, error);
                
                // Send error message on authentication failure
                ws.send(JSON.stringify({
                  type: 'auth',
                  action: 'authenticate',
                  payload: { 
                    success: false,
                    error: 'Authentication error',
                    timestamp: new Date().toISOString()
                  }
                }));
              });
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