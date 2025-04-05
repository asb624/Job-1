import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { connectWebSocket, subscribeToMessages } from "@/lib/websocket";
import { useAuth } from "@/hooks/use-auth";

type NotificationContextType = {
  connected: boolean;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const cleanupRef = useRef<(() => void) | null>(null);

  // First, set a flag after initial render is complete
  useEffect(() => {
    // Delay the initialization to ensure DOM is fully loaded
    const timeout = setTimeout(() => {
      setInitialized(true);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Then set up the WebSocket connection after initialization
  useEffect(() => {
    // Only proceed if initialized and user exists
    if (!initialized || !user) return;
    
    // Check if WebSocket features are enabled by the feature flag system
    const featureFlags = (window as any).__featureFlags || {};
    if (!featureFlags.enableWebSockets) {
      console.log('WebSocket features are currently disabled by feature flags');
      return;
    }
    
    try {
      console.log(`Setting up WebSocket notification system for user ${user.id}...`);
      
      // Connect WebSocket with user ID
      const socket = connectWebSocket(user.id);
      
      // Update connected state when the socket state changes
      const updateConnectionState = () => {
        if (socket) {
          const isConnected = socket.readyState === WebSocket.OPEN;
          setConnected(isConnected);
          console.log(`WebSocket connection state updated: ${isConnected ? 'connected' : 'disconnected'}`);
        } else {
          setConnected(false);
          console.log('WebSocket connection state updated: disconnected (no socket)');
        }
      };
      
      // Set initial connection state
      updateConnectionState();
      
      // Set up listeners for connection changes
      if (socket) {
        socket.addEventListener('open', updateConnectionState);
        socket.addEventListener('close', updateConnectionState);
        socket.addEventListener('error', (error) => {
          console.error('WebSocket connection error:', error);
          setConnected(false);
        });
      }

      // Set up notification handling
      const cleanup = subscribeToMessages((message) => {
        console.log("WebSocket notification received:", message);
        
        // Handle connection confirmation messages
        if (message.type === 'connection' && message.status === 'connected') {
          console.log('WebSocket connection confirmed by server');
          setConnected(true);
          return;
        }
        
        // Handle various notification types
        switch (message.type) {
          case 'bid':
            toast({
              title: "New Bid",
              description: `A new bid has been placed on your requirement`,
            });
            break;
          case 'service':
            toast({
              title: "Service Update",
              description: `A service you're following has been updated`,
            });
            break;
          case 'requirement':
            toast({
              title: "Requirement Update",
              description: `A requirement has been updated`,
            });
            break;
          case 'notification':
            if (message.payload && typeof message.payload === 'object') {
              toast({
                title: "New Notification",
                description: message.payload.message || "You have a new notification",
              });
            }
            break;
          case 'message':
            if (message.action === 'create') {
              toast({
                title: "New Message",
                description: `You have received a new message`,
              });
            }
            break;
          default:
            console.log(`Unhandled notification type: ${message.type}`);
        }
      }, user.id);
      
      cleanupRef.current = () => {
        console.log('Cleaning up WebSocket notification listeners');
        if (socket) {
          socket.removeEventListener('open', updateConnectionState);
          socket.removeEventListener('close', updateConnectionState);
        }
        cleanup();
      };
    } catch (error) {
      console.error('Error setting up WebSocket notifications:', error);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [initialized, toast, user]);

  return (
    <NotificationContext.Provider value={{ connected }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
