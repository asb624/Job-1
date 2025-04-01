import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { connectWebSocket, subscribeToMessages } from "@/lib/websocket";
import { useAuth } from "@/hooks/use-auth";

type NotificationContextType = {
  connected: boolean;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    // Connect WebSocket with user ID
    const socket = connectWebSocket(user.id);
    setConnected(socket.readyState === WebSocket.OPEN);

    console.log(`WebSocket connected for user ${user.id}`);

    const cleanup = subscribeToMessages((message) => {
      console.log("WebSocket notification received:", message);
      
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
          toast({
            title: "New Notification",
            description: message.payload.message,
          });
          break;
        case 'message':
          if (message.action === 'create') {
            toast({
              title: "New Message",
              description: `You have received a new message`,
            });
          }
          break;
      }
    }, user.id);

    return () => {
      cleanup();
    };
  }, [toast, user]);

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
