import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketMessage } from "./websocket";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the public directory for uploads
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory using ES modules compatible approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const voiceUploadsDir = path.join(uploadsDir, 'voice');

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  log(`Created uploads directory: ${uploadsDir}`);
}

if (!fs.existsSync(voiceUploadsDir)) {
  fs.mkdirSync(voiceUploadsDir, { recursive: true });
  log(`Created voice uploads directory: ${voiceUploadsDir}`);
}

// Serve static files with improved caching, CORS, and MIME type support
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads'), {
  maxAge: '1d', // Cache for one day
  setHeaders: (res, filePath) => {
    // Enable CORS for audio files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    
    // Set proper content types for audio files
    if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'audio/webm');
    } else if (filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (filePath.endsWith('.ogg')) {
      res.setHeader('Content-Type', 'audio/ogg');
    } else if (filePath.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    }
    
    // Log detailed information about file access
    log(`Serving file: ${filePath}, Content-Type: ${res.getHeader('Content-Type')}`);
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // Set up WebSocket event listener on app
    app.on('websocket', function(message: any) {
      // Type assertion to handle the WebSocketMessage format
      const wsMessage = message as WebSocketMessage;
      // This event will be emitted from routes when they need to broadcast via WebSocket
      console.log('WebSocket broadcast event:', wsMessage.type, wsMessage.action);
      
      // The WebSocket server has already attached these methods to the server object
      if (server.hasOwnProperty('broadcast')) {
        if (wsMessage.type === 'notification' && wsMessage.payload && wsMessage.payload.userId) {
          // Direct notification to specific user
          console.log(`Sending notification to user ${wsMessage.payload.userId}`);
          (server as any).sendToUser(wsMessage.payload.userId, wsMessage);
        } else if (wsMessage.type && ['bid', 'requirement'].includes(wsMessage.type)) {
          // Broadcast to relevant users for bids and requirements
          console.log('Broadcasting to relevant users for bid/requirement');
          (server as any).broadcastToRelevantUsers(wsMessage);
        } else if (wsMessage.type === 'message') {
          // For messages, always send to both conversation participants
          if (wsMessage.payload && wsMessage.payload.user1Id && wsMessage.payload.user2Id) {
            console.log(`Sending message to users ${wsMessage.payload.user1Id} and ${wsMessage.payload.user2Id}`);
            (server as any).sendToUser(wsMessage.payload.user1Id, wsMessage);
            (server as any).sendToUser(wsMessage.payload.user2Id, wsMessage);
          } else {
            // Fallback if we don't have user IDs
            console.log('Broadcasting message to all users (fallback)');
            (server as any).broadcast(wsMessage);
          }
        } else {
          // Default broadcast for other message types
          console.log('Broadcasting message to all users');
          (server as any).broadcast(wsMessage);
        }
      }
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server running on http://0.0.0.0:${port}`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('Server error:', error);
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${port} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${port} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Let the process exit so it can be restarted
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Let the process exit so it can be restarted
  process.exit(1);
});