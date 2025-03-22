import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { connectWebSocket, subscribeToMessages } from "@/lib/websocket";

type NotificationContextType = {
  connected: boolean;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const socket = connectWebSocket();
    setConnected(socket.readyState === WebSocket.OPEN);

    const cleanup = subscribeToMessages((message) => {
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
      }
    });

    return () => {
      cleanup();
    };
  }, [toast]);

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
