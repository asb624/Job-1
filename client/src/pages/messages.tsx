import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Conversation, Message, User } from "@shared/schema";
import { subscribeToMessages } from "@/lib/websocket";
import { useLocation } from "wouter";
import { TranslatedMessage, TranslatedMessageList } from "@/components/translated-message";
import { TranslateAllMessagesButton } from "@/components/message-translation-button";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { MessageCircle, Send, Menu, UserPlus, Languages } from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [autoTranslate, setAutoTranslate] = useState(false);

  // Fetch conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation && !!user,
  });

  // Get all users for potential new conversations
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (recipientId: number) => {
      return apiRequest<Conversation>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ recipientId }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(data);
      toast({
        title: "Conversation created",
        description: "You can now start messaging this user",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: { content: string }) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      
      // Log what we're sending for debugging
      console.log("Sending message:", {
        content: message.content,
        conversationId: selectedConversation.id
      });
      
      return apiRequest<Message>(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: message.content,
          conversationId: selectedConversation.id,
          attachments: [] // Always send an empty array for attachments
        }),
      });
    },
    onSuccess: (data) => {
      console.log("Message sent successfully:", data);
      setMessageText("");
      
      // Invalidate both conversations list and messages for this conversation
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations"]
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", selectedConversation?.id, "messages"] 
      });
      
      // Directly add new message to cache to ensure immediate display
      queryClient.setQueryData(
        ["/api/conversations", selectedConversation?.id, "messages"],
        (oldData: Message[] | undefined) => {
          if (!oldData) return [data];
          return [...oldData, data];
        }
      );
    },
    onError: (error: Error) => {
      console.error("Message sending error:", error);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest<Message>(`/api/messages/${messageId}/read`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", selectedConversation?.id, "messages"] 
      });
    },
  });

  // Subscribe to realtime message updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToMessages((message) => {
      if (message.type === 'message' && message.action === 'create') {
        console.log('Received message via WebSocket:', message);
        
        // If this message is for the currently selected conversation
        if (selectedConversation && message.payload.conversationId === selectedConversation.id) {
          console.log('Updating messages for current conversation');
          queryClient.invalidateQueries({ 
            queryKey: ["/api/conversations", selectedConversation.id, "messages"] 
          });
        }
        
        // Always update the conversation list to show latest messages
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      }
    }, user.id); // Pass user ID to WebSocket connection

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, selectedConversation]);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (!selectedConversation || !messages || !user) return;

    messages.forEach((message: Message) => {
      // Only mark messages from other users as read and ensure the message has a valid ID
      if (!message.isRead && message.senderId !== user.id && message.id && message.id > 0) {
        console.log(`Marking message ${message.id} as read`);
        markAsReadMutation.mutate(message.id);
      }
    });
  }, [messages, selectedConversation, user]);

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({ content: messageText });
  };

  // Create a new conversation with a user
  const startConversation = (userId: number) => {
    createConversationMutation.mutate(userId);
  };

  // Return to previous page if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  // Get the other user's info in a conversation
  const getOtherUser = (conversation: Conversation): User => {
    const otherUserId = conversation.user1Id === user?.id ? conversation.user2Id : conversation.user1Id;
    // This is a placeholder, you would typically fetch this from your users data
    const foundUser = allUsers?.find((u: User) => u.id === otherUserId);
    return foundUser || { 
      id: otherUserId, 
      username: `User ${otherUserId}`,
      createdAt: new Date(),
      lastSeen: new Date(),
      onboardingCompleted: false
    } as User;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-144px)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        {isMobile && (
          <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-1 overflow-hidden gap-4">
        {/* Conversation List - Show as sidebar on desktop, sheet on mobile */}
        {isMobile ? (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-[300px]">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Conversations</SheetTitle>
              </SheetHeader>
              {renderConversationList()}
            </SheetContent>
          </Sheet>
        ) : (
          <Card className="w-1/3 min-w-[250px] max-w-[350px] overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-xl">Conversations</CardTitle>
            </CardHeader>
            {renderConversationList()}
          </Card>
        )}

        {/* Messages Panel */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              <CardHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={getOtherUser(selectedConversation)?.avatar || ""} />
                      <AvatarFallback>{getOtherUser(selectedConversation)?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{getOtherUser(selectedConversation)?.username}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-muted-foreground" />
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="auto-translate" className="text-sm">Auto-translate</Label>
                      <Switch
                        id="auto-translate"
                        checked={autoTranslate}
                        onCheckedChange={setAutoTranslate}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {isLoadingMessages ? (
                    <div className="space-y-4 p-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-8 w-[300px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages?.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center p-4">
                      <div>
                        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm text-muted-foreground">
                          Start the conversation by sending a message below.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      {messages && messages.length > 0 ? (
                        <>
                          <div className="mb-4 flex justify-end">
                            <TranslateAllMessagesButton 
                              onTranslateAll={() => setAutoTranslate(!autoTranslate)} 
                            />
                          </div>
                          <TranslatedMessageList
                            messages={messages}
                            currentUserId={user?.id || 0}
                            otherUser={{
                              id: getOtherUser(selectedConversation)?.id || 0,
                              username: getOtherUser(selectedConversation)?.username || "",
                              avatarUrl: getOtherUser(selectedConversation)?.avatar || ""
                            }}
                            autoTranslate={autoTranslate}
                          />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-center">
                          <div>
                            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-lg font-medium">No messages yet</p>
                            <p className="text-sm text-muted-foreground">
                              Start the conversation by sending a message below.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={sendMessageMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                <p className="text-muted-foreground mb-6">
                  Select a conversation from the list or start a new one.
                </p>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      New Conversation
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Start a New Conversation</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                      {isLoadingUsers ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-2 pr-3">
                            {allUsers && user ? (
                              allUsers
                                .filter((u: User) => u.id !== user.id)
                                .map((otherUser: User) => (
                                  <Card key={otherUser.id} className="p-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <Avatar>
                                          <AvatarImage src={otherUser.avatar || ""} />
                                          <AvatarFallback>
                                            {otherUser.username.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">{otherUser.username}</p>
                                          {otherUser.isServiceProvider && (
                                            <Badge variant="secondary" className="mt-1">
                                              Service Provider
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        onClick={() => startConversation(otherUser.id)}
                                      >
                                        Message
                                      </Button>
                                    </div>
                                  </Card>
                                ))
                            ) : null}
                          </div>
                          <ScrollBar />
                        </ScrollArea>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  // Helper function to render conversation list
  function renderConversationList() {
    return (
      <div className="flex-1 overflow-hidden">
        {isLoadingConversations ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[60px] w-full" />
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-lg font-medium mb-2">No conversations yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Start a new conversation with another user
            </p>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Start a New Conversation</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  {isLoadingUsers ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 pr-3">
                        {allUsers && user ? (
                          allUsers
                            .filter((u: User) => u.id !== user.id)
                            .map((otherUser: User) => (
                              <Card key={otherUser.id} className="p-3">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <Avatar>
                                      <AvatarImage src={otherUser.avatar || ""} />
                                      <AvatarFallback>
                                        {otherUser.username.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{otherUser.username}</p>
                                      {otherUser.isServiceProvider && (
                                        <Badge variant="secondary" className="mt-1">
                                          Service Provider
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => startConversation(otherUser.id)}
                                  >
                                    Message
                                  </Button>
                                </div>
                              </Card>
                            ))
                        ) : null}
                      </div>
                      <ScrollBar />
                    </ScrollArea>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-2">
              {conversations?.map((conversation: Conversation) => {
                const otherUser = getOtherUser(conversation);
                const isSelected = selectedConversation?.id === conversation.id;
                
                return (
                  <div
                    key={conversation.id}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-colors
                      ${
                        isSelected
                          ? "bg-primary/10"
                          : "hover:bg-accent"
                      }
                    `}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      if (isMobile) setSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={otherUser?.avatar || ""} />
                        <AvatarFallback>
                          {otherUser?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium truncate">{otherUser?.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {conversation.lastMessageAt ? 
                              (typeof conversation.lastMessageAt === 'string' 
                                ? new Date(conversation.lastMessageAt).toLocaleDateString() 
                                : conversation.lastMessageAt.toLocaleDateString())
                              : "N/A"}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Last message content would go here...
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar />
          </ScrollArea>
        )}
      </div>
    );
  }
}