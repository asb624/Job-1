import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Check } from "lucide-react";
import { Notification } from "@shared/schema";
import { subscribeToMessages } from "@/lib/websocket";
import { useLocation } from "wouter";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark notification as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/notifications/read-all", {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "All notifications marked as read",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark all notifications as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Subscribe to realtime notification updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToMessages((message) => {
      if (message.type === 'notification' && message.action === 'create') {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        
        toast({
          title: message.payload.title,
          description: message.payload.content,
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, toast]);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsReadMutation.mutate(notification.id);
    
    // Navigate based on notification type
    if (notification.type === "message") {
      navigate("/messages");
    } else if (notification.type === "bid") {
      navigate(`/requirements/${notification.referenceId}`);
    } else if (notification.type === "review") {
      navigate(`/services/${notification.referenceId}`);
    }
    
    setOpen(false);
  };

  // Count unread notifications
  const unreadCount = notifications?.filter((n: Notification) => !n.isRead).length || 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px]">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-2 space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : notifications?.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <p>No notifications</p>
            </div>
          ) : (
            <div>
              {notifications?.map((notification: Notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-3 cursor-pointer ${
                    !notification.isRead ? "bg-accent" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="font-medium mb-1">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">{notification.content}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}