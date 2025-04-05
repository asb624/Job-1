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
import { CallButtons } from "@/components/call/call-buttons";

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
import { Separator } from "@/components/ui/separator";

import { MessageCircle, Send, Menu, UserPlus, Languages, Mic, Phone, Video } from "lucide-react";
import { VoiceRecorder } from "@/components/voice-recorder";

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
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      try {
        // Get messages from API
        const apiMessages = await apiRequest<Message[]>(`/api/conversations/${selectedConversation.id}/messages`);
        console.log("📥 Fetched messages from API:", apiMessages);
        
        // Check if we have any backup messages in session storage for this conversation
        const backupMessages: Message[] = [];
        
        try {
          // Look through session storage for message backups
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('msg_backup_')) {
              const item = sessionStorage.getItem(key);
              if (item) {
                const backupMsg = JSON.parse(item) as Message;
                // Only include if it's for this conversation
                if (backupMsg.conversationId === selectedConversation.id) {
                  // Check if this message already exists in the API response
                  const exists = apiMessages.some(msg => msg.id === backupMsg.id);
                  if (!exists) {
                    console.log("📥 Found backup message in storage:", backupMsg);
                    backupMessages.push(backupMsg);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Error retrieving backup messages:", err);
        }
        
        // Combine API messages with any valid backup messages
        if (backupMessages.length > 0) {
          console.log("📥 Adding backup messages to results:", backupMessages);
          return [...apiMessages, ...backupMessages];
        }
        
        return apiMessages;
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
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
    mutationFn: async (message: { content: string, attachments?: string[] }) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      
      // Log what we're sending for debugging
      console.log("Sending message:", {
        content: message.content,
        conversationId: selectedConversation.id,
        attachments: message.attachments || []
      });
      
      return apiRequest<Message>(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: message.content,
          conversationId: selectedConversation.id,
          attachments: message.attachments || [] // Use provided attachments or empty array
        }),
      });
    },
    onSuccess: (data) => {
      console.log("Message sent successfully:", data);
      
      // Replace optimistic message with real one from server
      try {
        queryClient.setQueryData(
          ["/api/conversations", selectedConversation?.id, "messages"],
          (oldData: Message[] | undefined) => {
            if (!oldData) return [data];
            
            // Check if the message already exists in the cache (has same ID)
            const messageExists = oldData.some(msg => msg.id === data.id);
            
            // If message exists (already handled by WebSocket), don't add it again
            if (messageExists) {
              return oldData;
            }
            
            // Create new array with optimistic message replaced
            const newData = oldData.filter(msg => !(msg.id < 0 && msg.content === data.content));
            return [...newData, data];
          }
        );
        
        // Also update the conversations list to show the latest message
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations"]
        });
      } catch (error) {
        console.error("Error updating cache:", error);
      }
    },
    onError: (error: Error) => {
      console.error("Message sending error:", error);
      
      // Remove any optimistic messages on error to clean up the UI
      try {
        queryClient.setQueryData(
          ["/api/conversations", selectedConversation?.id, "messages"],
          (oldData: Message[] | undefined) => {
            if (!oldData) return [];
            // Remove any messages with negative IDs (optimistic ones)
            return oldData.filter(msg => msg.id > 0);
          }
        );
      } catch (err) {
        console.error("Error cleaning up optimistic messages:", err);
      }
      
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

  // Handle conversation selection from URL query parameters
  useEffect(() => {
    if (!user || !conversations) return;
    
    // Check for conversation parameter in URL
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('conversation');
    
    if (conversationId) {
      const conversationIdNum = parseInt(conversationId);
      
      // Find and select the conversation if it exists
      const foundConversation = conversations.find(c => c.id === conversationIdNum);
      if (foundConversation) {
        setSelectedConversation(foundConversation);
        
        // On mobile, close the sidebar when a conversation is selected from URL
        if (isMobile) {
          setSidebarOpen(false);
        }
        
        // Clean URL to prevent reselection on page refresh
        const url = new URL(window.location.href);
        url.searchParams.delete('conversation');
        window.history.replaceState({}, '', url);
      }
    }
  }, [user, conversations, isMobile]);

  // Subscribe to realtime message updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToMessages((message) => {
      console.log('🔵 WS RECEIVED: WebSocket message:', message);
      
      if (message.type === 'message' && message.action === 'create') {
        console.log('🔵 WS RECEIVED: New message payload:', message.payload);
        
        // Save real message to session storage as a backup
        try {
          // First check if we already have a backup
          const existingBackup = sessionStorage.getItem(`msg_backup_${message.payload.id}`);
          if (!existingBackup) {
            sessionStorage.setItem(`msg_backup_${message.payload.id}`, JSON.stringify(message.payload));
            console.log(`🔵 WS RECEIVED: Backed up message ${message.payload.id} to session storage`);
          }
        } catch (err) {
          console.error('Error backing up message to session storage:', err);
        }
        
        // If this message is for the currently selected conversation
        if (selectedConversation && message.payload.conversationId === selectedConversation.id) {
          console.log('🔵 WS RECEIVED: Updating messages for current conversation');
          
          // Special handling for our own messages that we've already handled with optimistic updates
          const isOwnMessage = message.payload.senderId === user.id;
          console.log('🔵 WS RECEIVED: Is own message?', isOwnMessage);
          
          // Get current messages
          const currentMessages = queryClient.getQueryData(["/api/conversations", selectedConversation.id, "messages"]) as Message[] | undefined;
          console.log('🔵 WS RECEIVED: Current messages in cache:', currentMessages);
          
          if (currentMessages) {
            // 1. Check if the exact message already exists
            const exactMessageExists = currentMessages.some(msg => msg.id === message.payload.id);
            
            // 2. Check if we have an optimistic version to replace (for our messages)
            const hasOptimisticVersion = isOwnMessage && currentMessages.some(msg => 
              msg.id < 0 && 
              msg.content === message.payload.content && 
              msg.senderId === user.id
            );
            
            console.log('🔵 WS RECEIVED: Exact message exists?', exactMessageExists);
            console.log('🔵 WS RECEIVED: Has optimistic version?', hasOptimisticVersion);
            
            // 3. Determine what to do
            if (exactMessageExists) {
              // Message already in cache, no need to do anything
              console.log('🔵 WS RECEIVED: Message already in cache, not updating');
            } else if (hasOptimisticVersion) {
              // Replace optimistic message with real one
              console.log('🔵 WS RECEIVED: Replacing optimistic message with real one');
              queryClient.setQueryData(
                ["/api/conversations", selectedConversation.id, "messages"],
                currentMessages.map(msg => {
                  if (msg.id < 0 && msg.content === message.payload.content && msg.senderId === user.id) {
                    console.log('🔵 WS RECEIVED: Found optimistic message to replace:', msg);
                    return message.payload;
                  }
                  return msg;
                })
              );
            } else {
              // Just add the new message
              console.log('🔵 WS RECEIVED: Adding new message to cache');
              queryClient.setQueryData(
                ["/api/conversations", selectedConversation.id, "messages"],
                [...currentMessages, message.payload]
              );
            }
          } else {
            // No messages in cache yet, just set this one
            console.log('🔵 WS RECEIVED: No messages in cache, setting just this one');
            queryClient.setQueryData(
              ["/api/conversations", selectedConversation.id, "messages"],
              [message.payload]
            );
          }
          
          // Double check after our update that the message is actually in the cache
          const afterUpdateMessages = queryClient.getQueryData(["/api/conversations", selectedConversation.id, "messages"]) as Message[] | undefined;
          const messageInCache = afterUpdateMessages?.some(msg => msg.id === message.payload.id);
          console.log('🔵 WS RECEIVED: Message in cache after update?', messageInCache);
          
          // If somehow our message still didn't make it to the cache, force add it
          if (!messageInCache && afterUpdateMessages) {
            console.log('🔵 WS RECEIVED: Message STILL not in cache, force adding it');
            queryClient.setQueryData(
              ["/api/conversations", selectedConversation.id, "messages"],
              [...afterUpdateMessages, message.payload]
            );
          }
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

    const conversationId = selectedConversation.id;
    
    // Filter and validate messages before marking them as read
    const unreadMessages = messages.filter((message: Message) => {
      return (
        // Only mark messages from other users as read
        message.senderId !== user.id &&
        // Check that isRead is false
        !message.isRead &&
        // Make sure we have a valid message ID
        message.id && 
        message.id > 0 &&
        // Check that the message belongs to the current conversation
        message.conversationId === conversationId &&
        // Double-check we're not using the conversation ID as a message ID
        message.id !== conversationId
      );
    });
    
    // Mark filtered messages as read one by one
    if (unreadMessages.length > 0) {
      console.log(`Found ${unreadMessages.length} unread messages to mark as read`);
      
      unreadMessages.forEach((message: Message) => {
        console.log(`Marking message ${message.id} as read`);
        markAsReadMutation.mutate(message.id);
      });
    }
  }, [messages, selectedConversation, user]);

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !user) return;

    console.log("🚀 SEND MESSAGE: Starting to send message:", messageText);

    // Store message text to avoid race conditions with input clearing
    const messageToSend = messageText;
    
    // Create optimistic message with unique ID
    const optimisticId = -(Date.now());
    const optimisticMessage: Message = {
      id: optimisticId, // Temporary negative ID to distinguish from real messages
      conversationId: selectedConversation.id,
      senderId: user.id,
      content: messageToSend,
      isRead: false,
      attachments: [],
      createdAt: new Date()
    };

    console.log("🚀 SEND MESSAGE: Created optimistic message:", optimisticMessage);

    // Add optimistic message to the cache immediately
    queryClient.setQueryData(
      ["/api/conversations", selectedConversation.id, "messages"],
      (oldData: Message[] | undefined) => {
        console.log("🚀 SEND MESSAGE: Current messages in cache:", oldData);
        const newData = oldData ? [...oldData, optimisticMessage] : [optimisticMessage];
        console.log("🚀 SEND MESSAGE: New messages with optimistic:", newData);
        return newData;
      }
    );

    // Clear input before network request to improve UX responsiveness
    setMessageText('');

    // Debug - Log the current message cache
    const currentCache = queryClient.getQueryData(["/api/conversations", selectedConversation.id, "messages"]);
    console.log("🚀 SEND MESSAGE: Current message cache after optimistic update:", currentCache);

    // Send message to server
    sendMessageMutation.mutate(
      { content: messageToSend },
      {
        onSuccess: (data) => {
          console.log("🚀 SEND SUCCESS: Message successfully sent to server:", data);
          
          // Manually check if our message is still in the cache
          const cacheAfterSuccess = queryClient.getQueryData(["/api/conversations", selectedConversation.id, "messages"]) as Message[] | undefined;
          console.log("🚀 SEND SUCCESS: Messages in cache after success:", cacheAfterSuccess);
          
          const optimisticStillExists = cacheAfterSuccess?.some(msg => msg.id === optimisticId);
          console.log("🚀 SEND SUCCESS: Optimistic message still in cache:", optimisticStillExists);
          
          // If the optimistic message disappeared, put it back but with the real ID
          if (!optimisticStillExists && cacheAfterSuccess) {
            console.log("🚀 SEND SUCCESS: Optimistic message disappeared, adding real message back to cache");
            queryClient.setQueryData(
              ["/api/conversations", selectedConversation.id, "messages"],
              [...cacheAfterSuccess, data]
            );
          }
        },
        onError: (error) => {
          console.log("🚀 SEND ERROR: Message sending failed:", error);
          // Restore the message text on error so user can try again
          setMessageText(messageToSend);
        }
      }
    );
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
    
    // Search for the user in our loaded users data
    const foundUser = allUsers?.find((u: User) => u.id === otherUserId);
    
    if (foundUser) {
      return foundUser;
    }
    
    // If we can't find the user in our loaded data, load and cache them
    console.log(`User ${otherUserId} not found in loaded users, loading separately`);
    
    // Return a temporary placeholder but trigger a fetch for this user
    const placeholderUser = { 
      id: otherUserId, 
      username: `Loading...`,
      createdAt: new Date(),
      lastSeen: new Date(),
      onboardingCompleted: false
    } as User;
    
    // Fetch this specific user if not already loading
    const userQueryKey = [`/api/users/${otherUserId}`];
    const queryState = queryClient.getQueryState(userQueryKey);
    const isUserLoading = queryState?.fetchStatus === 'fetching';
    
    if (!isUserLoading) {
      queryClient.fetchQuery({
        queryKey: userQueryKey,
        queryFn: async () => {
          try {
            const userData = await apiRequest<User>(`/api/users/${otherUserId}`);
            console.log(`Loaded user data for ${otherUserId}:`, userData);
            
            // Update both specific user cache and all users cache with this data
            queryClient.setQueryData(userQueryKey, userData);
            
            // Add this user to the allUsers cache if not already there
            queryClient.setQueryData(["/api/users"], (oldData: User[] | undefined) => {
              if (!oldData) return [userData];
              if (oldData.some(u => u.id === userData.id)) return oldData;
              return [...oldData, userData];
            });
            
            return userData;
          } catch (error) {
            console.error(`Failed to load user ${otherUserId}:`, error);
            return null;
          }
        }
      });
    }
    
    return placeholderUser;
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
                  <div className="flex items-center gap-3">
                    {/* Call Buttons */}
                    {getOtherUser(selectedConversation) && (
                      <CallButtons 
                        recipientId={getOtherUser(selectedConversation)?.id || 0} 
                        recipientUsername={getOtherUser(selectedConversation)?.username || ""}
                        variant="icon-only"
                        size="sm"
                      />
                    )}
                    <Separator orientation="vertical" className="h-6" />
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
                <form onSubmit={handleSendMessage} className="flex w-full gap-2 flex-col">
                  <div className="flex gap-2 w-full">
                    <Input
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={sendMessageMutation.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2">
                    <VoiceRecorder 
                      onRecordingComplete={(audioUrl) => {
                        // Send the voice message with the uploaded audio URL
                        if (selectedConversation && user) {
                          // Create optimistic message with unique ID for voice message
                          const optimisticId = -(Date.now());
                          const optimisticMessage: Message = {
                            id: optimisticId,
                            conversationId: selectedConversation.id,
                            senderId: user.id,
                            content: "",  // Empty content for voice messages
                            isRead: false,
                            attachments: [audioUrl],
                            createdAt: new Date()
                          };
                          
                          // Add optimistic voice message to cache
                          queryClient.setQueryData(
                            ["/api/conversations", selectedConversation.id, "messages"],
                            (oldData: Message[] | undefined) => {
                              console.log("🎤 VOICE MESSAGE: Adding optimistic voice message to cache");
                              const newData = oldData ? [...oldData, optimisticMessage] : [optimisticMessage];
                              return newData;
                            }
                          );
                          
                          // Send to server
                          sendMessageMutation.mutate(
                            { 
                              content: "", 
                              attachments: [audioUrl]
                            },
                            {
                              onSuccess: (data) => {
                                toast({
                                  title: "Voice message sent",
                                  description: "Your voice message has been sent successfully"
                                });
                                
                                // Replace the optimistic message with the real one
                                queryClient.setQueryData(
                                  ["/api/conversations", selectedConversation.id, "messages"],
                                  (oldData: Message[] | undefined) => {
                                    if (!oldData) return [data];
                                    return oldData.map(msg => 
                                      msg.id === optimisticId ? data : msg
                                    );
                                  }
                                );
                              },
                              onError: (error) => {
                                toast({
                                  title: "Failed to send voice message",
                                  description: error.message,
                                  variant: "destructive"
                                });
                                
                                // Remove the optimistic message on failure
                                queryClient.setQueryData(
                                  ["/api/conversations", selectedConversation.id, "messages"],
                                  (oldData: Message[] | undefined) => {
                                    if (!oldData) return [];
                                    return oldData.filter(msg => msg.id !== optimisticId);
                                  }
                                );
                              }
                            }
                          );
                        }
                      }}
                      maxDuration={60}
                    />
                  </div>
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