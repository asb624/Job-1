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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NotificationsDropdownProps {
  isMobile?: boolean;
}

export function NotificationsDropdown({ isMobile = false }: NotificationsDropdownProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setDialogOpen(false);
  };

  // Count unread notifications
  const unreadCount = notifications?.filter((n: Notification) => !n.isRead).length || 0;

  // Render notifications list
  const renderNotificationsList = () => (
    <>
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
        <div className="py-8 text-center text-teal-600">
          <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>No notifications</p>
        </div>
      ) : (
        <div>
          {notifications?.map((notification: Notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-4 cursor-pointer border-b border-teal-50 hover:bg-teal-50 transition-colors duration-200 ${
                !notification.isRead ? "bg-teal-50/70 border-l-4 border-l-teal-500" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="font-medium mb-1 text-teal-800">{notification.title}</div>
              <div className="text-sm text-gray-600">{notification.content}</div>
              <div className="text-xs text-teal-500 mt-2 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${!notification.isRead ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
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
    </>
  );

  // Render header with mark all as read button
  const renderHeader = () => (
    <div className="flex justify-between items-center bg-gradient-to-r from-teal-600 to-emerald-500 text-white py-3 px-4">
      <span className="font-semibold text-base">Notifications</span>
      {unreadCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-300"
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending}
        >
          <Check className="mr-1 h-3 w-3" />
          Mark all as read
        </Button>
      )}
    </div>
  );

  // Mobile version using Dialog
  if (isMobile) {
    return (
      <>
        <Button 
          variant="ghost" 
          className="w-full flex flex-col items-center justify-center gap-1 text-white hover:bg-teal-500/50 rounded-lg"
          onClick={() => setDialogOpen(true)}
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-emerald-400 hover:bg-emerald-300 border border-white text-white font-bold"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          <span className="text-xs">Notifications</span>
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="p-0 overflow-hidden max-w-[95vw] w-[400px] rounded-xl">
            <DialogHeader className="p-0">
              {renderHeader()}
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              {renderNotificationsList()}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop version using DropdownMenu
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-white hover:bg-teal-500/50 rounded-full transition-all duration-300"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-emerald-400 hover:bg-emerald-300 border-2 border-white text-white font-bold"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] border-teal-100 shadow-lg rounded-xl overflow-hidden">
        <DropdownMenuLabel className="p-0">
          {renderHeader()}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-teal-100" />
        
        <ScrollArea className="h-[300px]">
          {renderNotificationsList()}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}