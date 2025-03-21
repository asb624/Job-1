import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws",
    // Add proper error handling
    verifyClient: (info, cb) => {
      // Accept all connections
      cb(true);
    }
  });

  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("WebSocket client connected");

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("WebSocket client disconnected");
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Broadcast updates to all connected clients
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    // Send initial connection success message
    ws.send(JSON.stringify({ type: "connection", status: "connected" }));
  });

  // Add error handling for the server
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  return wss;
}