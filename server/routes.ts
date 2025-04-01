import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket, broadcastToRelevantUsers, sendToUser, broadcast } from "./websocket";
import { storage } from "./storage";
import { z } from "zod";
import fetch from "node-fetch";
import axios from "axios";
import fileUpload from "express-fileupload";
import { 
  insertServiceSchema, insertRequirementSchema, insertBidSchema, 
  insertProfileSchema, insertMessageSchema, insertNotificationSchema,
  insertReviewSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);
  
  // Simple in-memory cache for translations to reduce API calls
  const translationCache: Record<string, { text: string, timestamp: number }> = {};
  
  // Function to get a value from the cache if it exists and is not expired
  const getCachedTranslation = (cacheKey: string): string | null => {
    const cached = translationCache[cacheKey];
    if (cached) {
      const now = Date.now();
      // Cache entries are valid for 1 day
      if (now - cached.timestamp < 24 * 60 * 60 * 1000) {
        return cached.text;
      }
    }
    return null;
  };
  
  // Add an item to the cache
  const cacheTranslation = (cacheKey: string, translatedText: string): void => {
    translationCache[cacheKey] = {
      text: translatedText,
      timestamp: Date.now()
    };
  };
  
  // Translation endpoint with improved caching and reliability
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      
      if (!text || !targetLang) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // Use a cache key combining the text and target language
      const cacheKey = `${text}:${targetLang}`;
      
      // Check if we have this translation cached
      const cachedResult = getCachedTranslation(cacheKey);
      if (cachedResult) {
        console.log(`Translation cache hit: "${text}" to ${targetLang}`);
        return res.json({
          translatedText: cachedResult,
          source: "cache"
        });
      }
      
      console.log(`Translating: "${text}" to ${targetLang}`);
      
      // Use only MyMemory for translations
      try {
        console.log("Using MyMemory for translation...");
        const encodedText = encodeURIComponent(text);
        const email = process.env.TRANSLATION_EMAIL || '';
        
        // Add timeout to avoid hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        // Add email for increased daily quota (from ~1000 to ~50000 words/day)
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}${email ? `&de=${email}` : ''}`;
        console.log(`Making API request to: ${apiUrl.replace(email, '[REDACTED_EMAIL]')}`);
        
        const myMemoryResponse = await fetch(
          apiUrl,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (myMemoryResponse.ok) {
          const myMemoryData = await myMemoryResponse.json();
          if (myMemoryData?.responseData?.translatedText) {
            const translatedText = myMemoryData.responseData.translatedText;
            
            if (!translatedText.includes("MYMEMORY WARNING")) {
              console.log(`MyMemory success: "${translatedText}"`);
              
              // Cache the successful translation
              cacheTranslation(cacheKey, translatedText);
              
              return res.json({ 
                translatedText: translatedText,
                source: "mymemory"
              });
            } else {
              console.log("MyMemory returned a warning message:", translatedText);
            }
          }
        }
        
        // If we get here, MyMemory translation failed
        throw new Error("MyMemory translation failed or limit reached");
      } catch (error: any) {
        console.log("MyMemory error:", error.message);
        
        // If translation service fails, return the original text
        return res.status(200).json({ 
          translatedText: text, // Return the original text as last resort
          source: "original"
        });
      }
    } catch (error: any) {
      console.error("Translation error:", error.message);
      // Even on error, return the original text to avoid breaking the UI
      return res.status(200).json({ 
        translatedText: req.body.text || "",
        source: "error_fallback" 
      });
    }
  });

  // Profile routes
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const profile = await storage.getProfileByUserId(req.user.id);
      res.json(profile || { userId: req.user.id });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const parsed = insertProfileSchema
      .extend({
        userId: z.number().optional(),
      })
      .safeParse({ ...req.body, userId: req.user.id });

    if (!parsed.success) return res.status(400).json(parsed.error);

    try {
      const profile = await storage.updateProfile(req.user.id, parsed.data);
      res.json(profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/profile/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    // Add verification logic here.  This is a placeholder.  The specific implementation
    // depends on how verification documents are handled (e.g., file uploads).
    try {
      await storage.verifyProfile(req.user.id, req.body); // Placeholder
      res.status(200).send("Verification document submitted");
    } catch (error) {
      console.error('Error verifying profile:', error);
      res.status(500).json({ message: "Failed to verify profile" });
    }
  });


  // Services
  app.post("/api/services", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("You must be logged in to create services");
    }

    const parsed = insertServiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const service = await storage.createService({
      ...parsed.data,
      providerId: req.user.id,
      createdAt: new Date(),
      // Safely add nullable location fields with default values
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      country: parsed.data.country || null,
      postalCode: parsed.data.postalCode || null,
      latitude: parsed.data.latitude || null,
      longitude: parsed.data.longitude || null,
      serviceRadius: parsed.data.serviceRadius || null,
      isRemote: parsed.data.isRemote || false,
    });
    
    // Broadcast service creation via WebSocket
    const wsMessage = {
      type: 'service',
      action: 'create',
      payload: service
    };
    
    req.app.emit('websocket', wsMessage);
    
    res.status(201).json(service);
  });

  app.get("/api/services", async (req, res) => {
    try {
      // Extract all possible query parameters
      const { 
        lat, lng, radius, isRemote, category, 
        minPrice, maxPrice, sortBy, sortOrder, query 
      } = req.query;
      
      // Build filters object
      const filters: any = {};
      
      if (minPrice) filters.minPrice = parseInt(minPrice as string);
      if (maxPrice) filters.maxPrice = parseInt(maxPrice as string);
      if (category) filters.category = category as string;
      if (query) filters.query = query as string;
      if (sortBy && ['price', 'date', 'distance'].includes(sortBy as string)) {
        filters.sortBy = sortBy as 'price' | 'date' | 'distance';
      }
      if (sortOrder && ['asc', 'desc'].includes(sortOrder as string)) {
        filters.sortOrder = sortOrder as 'asc' | 'desc';
      }
      
      // If location parameters are provided
      if (lat && lng && radius) {
        const parsedLat = parseFloat(lat as string);
        const parsedLng = parseFloat(lng as string);
        const parsedRadius = parseFloat(radius as string);
        
        // If category is also provided
        if (category) {
          const results = await storage.searchServicesByCategory(
            category as string,
            parsedLat,
            parsedLng,
            parsedRadius,
            filters
          );
          return res.json(results);
        }
        
        // Otherwise search by location only
        const results = await storage.searchServicesByLocation(
          parsedLat,
          parsedLng,
          parsedRadius,
          isRemote === 'true',
          filters
        );
        return res.json(results);
      }
      
      // If only category filter is provided
      if (category && !lat && !lng) {
        const results = await storage.searchServicesByCategory(category as string, undefined, undefined, undefined, filters);
        return res.json(results);
      }
      
      // No location/category filters, apply other filters
      const services = await storage.getServices(filters);
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Requirements
  app.post("/api/requirements", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const parsed = insertRequirementSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const requirement = await storage.createRequirement({
      ...parsed.data,
      userId: req.user.id,
      status: "open",
      createdAt: new Date(),
      // Safely add nullable location fields with default values
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      country: parsed.data.country || null,
      postalCode: parsed.data.postalCode || null,
      latitude: parsed.data.latitude || null,
      longitude: parsed.data.longitude || null,
      isRemote: parsed.data.isRemote || false,
    });
    
    // Broadcast requirement creation via WebSocket
    const wsMessage = {
      type: 'requirement',
      action: 'create',
      payload: requirement
    };
    
    req.app.emit('websocket', wsMessage);
    
    res.status(201).json(requirement);
  });

  app.get("/api/requirements", async (req, res) => {
    try {
      // Extract all possible query parameters
      const { 
        lat, lng, radius, isRemote, category, 
        minBudget, maxBudget, sortBy, sortOrder, query,
        status
      } = req.query;
      
      // Build filters object
      const filters: any = {};
      
      if (minBudget) filters.minBudget = parseInt(minBudget as string);
      if (maxBudget) filters.maxBudget = parseInt(maxBudget as string);
      if (category) filters.category = category as string;
      if (query) filters.query = query as string;
      if (status) filters.status = status as string;
      if (sortBy && ['budget', 'date', 'distance'].includes(sortBy as string)) {
        filters.sortBy = sortBy as 'budget' | 'date' | 'distance';
      }
      if (sortOrder && ['asc', 'desc'].includes(sortOrder as string)) {
        filters.sortOrder = sortOrder as 'asc' | 'desc';
      }
      
      // If location parameters are provided
      if (lat && lng && radius) {
        const parsedLat = parseFloat(lat as string);
        const parsedLng = parseFloat(lng as string);
        const parsedRadius = parseFloat(radius as string);
        
        // If category is also provided
        if (category) {
          const results = await storage.searchRequirementsByCategory(
            category as string,
            parsedLat,
            parsedLng,
            parsedRadius
          );
          return res.json(results);
        }
        
        // Otherwise search by location only
        const results = await storage.searchRequirementsByLocation(
          parsedLat,
          parsedLng,
          parsedRadius,
          isRemote === 'true'
        );
        return res.json(results);
      }
      
      // If only category filter is provided
      if (category && !lat && !lng) {
        const results = await storage.searchRequirementsByCategory(category as string);
        return res.json(results);
      }
      
      // No location/category filters, apply other filters
      const requirements = await storage.getRequirements();
      
      // Apply client-side filters since we haven't updated the getRequirements method yet
      let filteredRequirements = requirements;
      
      if (filters.minBudget) {
        filteredRequirements = filteredRequirements.filter(req => req.budget >= filters.minBudget);
      }
      
      if (filters.maxBudget) {
        filteredRequirements = filteredRequirements.filter(req => req.budget <= filters.maxBudget);
      }
      
      if (filters.status) {
        filteredRequirements = filteredRequirements.filter(req => req.status === filters.status);
      }
      
      if (filters.query) {
        const searchTermLower = filters.query.toLowerCase();
        filteredRequirements = filteredRequirements.filter(req => 
          req.title.toLowerCase().includes(searchTermLower) || 
          req.description.toLowerCase().includes(searchTermLower)
        );
      }
      
      // Apply sorting
      if (filters.sortBy) {
        filteredRequirements = filteredRequirements.sort((a, b) => {
          if (filters.sortBy === 'budget') {
            return filters.sortOrder === 'desc' ? b.budget - a.budget : a.budget - b.budget;
          } else if (filters.sortBy === 'date') {
            return filters.sortOrder === 'desc' 
              ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          return 0;
        });
      } else {
        // Default sort by newest first
        filteredRequirements = filteredRequirements.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      res.json(filteredRequirements);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      res.status(500).json({ message: "Failed to fetch requirements" });
    }
  });

  // Bids
  app.post("/api/bids", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("You must be logged in to create bids");
    }

    const parsed = insertBidSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const bid = await storage.createBid({
      ...parsed.data,
      providerId: req.user.id,
      status: "pending",
      createdAt: new Date(),
      message: parsed.data.message || null,
    });
    
    try {
      // Create a notification for the requirement owner
      const requirement = await storage.getRequirement(parsed.data.requirementId);
      if (requirement) {
        await storage.createNotification({
          userId: requirement.userId,
          title: "New Bid",
          content: `${req.user.username} has placed a bid on your requirement: ${requirement.title}`,
          type: "bid",
          referenceId: bid.id,
        });
  
        // Broadcast bid via WebSocket
        const wsMessage = {
          type: 'bid',
          action: 'create',
          payload: {
            ...bid,
            userId: requirement.userId, // Include the requirement owner's ID for targeting
          }
        };
        
        req.app.emit('websocket', wsMessage);
      }
    } catch (error) {
      console.error('Error processing bid notification:', error);
      // We still return the bid even if notification fails
    }
    
    res.status(201).json(bid);
  });

  app.get("/api/requirements/:id/bids", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const bids = await storage.getBidsForRequirement(parseInt(req.params.id));
    res.json(bids);
  });

  // Conversations & Messages
  app.post("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: "Recipient ID is required" });

    try {
      const conversation = await storage.getOrCreateConversation(req.user.id, parseInt(recipientId));
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      // Update user's last seen timestamp
      await storage.updateUserLastSeen(req.user.id);
      
      const conversations = await storage.getConversationsByUserId(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const messages = await storage.getMessagesByConversationId(parseInt(req.params.id));
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    try {
      const message = await storage.createMessage({
        ...parsed.data,
        conversationId: parseInt(req.params.id),
        senderId: req.user.id,
      });

      // Get the conversation details
      const conversations = await storage.getConversationsByUserId(req.user.id);
      const conversation = conversations.find(conv => conv.id === parseInt(req.params.id));

      if (!conversation) {
        throw new Error("Conversation not found");
      }
      
      // Determine the recipient ID (the other user in the conversation)
      const recipientId = conversation.user1Id === req.user.id ? conversation.user2Id : conversation.user1Id;
      
      await storage.createNotification({
        userId: recipientId,
        title: "New Message",
        content: `You have a new message from ${req.user.username}`,
        type: "message",
        referenceId: message.id,
      });

      // Broadcast message via WebSocket
      const wsMessage = {
        type: 'message',
        action: 'create',
        payload: {
          ...message,
          // Include user IDs from the conversation for targeted delivery
          user1Id: conversation.user1Id,
          user2Id: conversation.user2Id
        }
      };
      
      console.log(`Sending message WebSocket event to users ${conversation.user1Id} and ${conversation.user2Id}`);
      
      // The websocket will handle broadcasting to the right users
      req.app.emit('websocket', wsMessage);

      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const message = await storage.markMessageAsRead(parseInt(req.params.id));
      res.json(message);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Message reactions
  app.post("/api/messages/:id/reactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji is required" });
    
    try {
      const reaction = await storage.addMessageReaction({
        messageId: parseInt(req.params.id),
        userId: req.user.id,
        emoji,
      });
      
      res.json(reaction);
      
      // Broadcast the reaction to relevant users via WebSocket
      const messages = await storage.getMessagesByConversationId(reaction.messageId);
      if (messages && messages.length > 0) {
        const targetMessage = messages.find(m => m.id === parseInt(req.params.id));
        if (targetMessage) {
          // Get the conversation to find the users
          const conversations = await storage.getConversationsByUserId(req.user.id);
          const conversation = conversations.find(conv => conv.id === targetMessage.conversationId);
          
          if (conversation) {
            // Include both users in the payload for targeted delivery
            broadcastToRelevantUsers({
              type: 'message',
              action: 'update',
              payload: {
                messageId: targetMessage.id,
                reaction: reaction,
                user1Id: conversation.user1Id,
                user2Id: conversation.user2Id
              }
            });
            
            console.log(`Sent reaction WebSocket event to users ${conversation.user1Id} and ${conversation.user2Id}`);
          } else {
            console.warn(`Could not find conversation for message ${targetMessage.id}`);
            // Fallback to the normal broadcast mechanism
            broadcastToRelevantUsers({
              type: 'message',
              action: 'update',
              payload: {
                messageId: targetMessage.id,
                reaction: reaction
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });
  
  app.get("/api/messages/:id/reactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const reactions = await storage.getMessageReactions(parseInt(req.params.id));
      res.json(reactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });
  
  app.delete("/api/reactions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      await storage.removeMessageReaction(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });
  
  // Typing indicators
  app.post("/api/conversations/:id/typing", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { isTyping } = req.body;
    if (isTyping === undefined) return res.status(400).json({ message: "isTyping field is required" });
    
    try {
      await storage.setUserTyping(parseInt(req.params.id), req.user.id, isTyping);
      
      // Get who else is typing
      const typingUsers = await storage.getUserTypingStatus(parseInt(req.params.id));
      
      // Get the conversation to find the users
      const conversations = await storage.getConversationsByUserId(req.user.id);
      const conversation = conversations.find(conv => conv.id === parseInt(req.params.id));
      
      if (conversation) {
        // Broadcast to the conversation with specific user IDs
        broadcastToRelevantUsers({
          type: 'conversation',
          action: 'update',
          payload: {
            conversationId: parseInt(req.params.id),
            typingUsers: typingUsers,
            // Include both users for targeted delivery
            user1Id: conversation.user1Id,
            user2Id: conversation.user2Id
          }
        });
        
        console.log(`Sent typing indicator WebSocket event to users ${conversation.user1Id} and ${conversation.user2Id}`);
      } else {
        // Fallback if conversation not found
        broadcastToRelevantUsers({
          type: 'conversation',
          action: 'update',
          payload: {
            conversationId: parseInt(req.params.id),
            typingUsers: typingUsers
          }
        });
      }
      
      res.sendStatus(204);
    } catch (error) {
      console.error('Error updating typing status:', error);
      res.status(500).json({ message: "Failed to update typing status" });
    }
  });
  
  app.get("/api/conversations/:id/typing", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const typingUsers = await storage.getUserTypingStatus(parseInt(req.params.id));
      res.json(typingUsers);
    } catch (error) {
      console.error('Error fetching typing status:', error);
      res.status(500).json({ message: "Failed to fetch typing status" });
    }
  });

  // Reviews
  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const parsed = insertReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    try {
      const review = await storage.createReview({
        ...parsed.data,
        userId: req.user.id,
      });
      
      // Get the service to create a notification for its provider
      const service = await storage.getServices({ minPrice: parsed.data.serviceId, maxPrice: parsed.data.serviceId });
      if (service && service.length > 0) {
        // Create notification for the service provider
        await storage.createNotification({
          userId: service[0].providerId,
          title: "New Review",
          content: `${req.user.username} left a ${parsed.data.rating}-star review on your service`,
          type: "review",
          referenceId: review.id,
        });
        
        // Broadcast review via WebSocket
        const wsMessage = {
          type: 'review',
          action: 'create',
          payload: {
            ...review,
            providerId: service[0].providerId
          }
        };
        
        req.app.emit('websocket', wsMessage);
      }

      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/services/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByServiceId(parseInt(req.params.id));
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/services/:id/rating", async (req, res) => {
    try {
      const rating = await storage.getAverageRatingForService(parseInt(req.params.id));
      res.json({ rating });
    } catch (error) {
      console.error('Error fetching average rating:', error);
      res.status(500).json({ message: "Failed to fetch average rating" });
    }
  });
  
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const notification = await storage.markNotificationAsRead(parseInt(req.params.id));
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });
  
  // Dedicated location-based search endpoints
  app.get("/api/services/search/location", async (req, res) => {
    try {
      const { lat, lng, radius, isRemote } = req.query;
      
      if (!lat || !lng || !radius) {
        return res.status(400).json({ message: "Missing required parameters: lat, lng, and radius are required" });
      }
      
      const results = await storage.searchServicesByLocation(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string),
        isRemote === 'true'
      );
      
      res.json(results);
    } catch (error) {
      console.error("Error in location-based service search:", error);
      res.status(500).json({ message: "Error processing location-based search" });
    }
  });
  
  app.get("/api/requirements/search/location", async (req, res) => {
    try {
      const { lat, lng, radius, isRemote } = req.query;
      
      if (!lat || !lng || !radius) {
        return res.status(400).json({ message: "Missing required parameters: lat, lng, and radius are required" });
      }
      
      const results = await storage.searchRequirementsByLocation(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string),
        isRemote === 'true'
      );
      
      res.json(results);
    } catch (error) {
      console.error("Error in location-based requirement search:", error);
      res.status(500).json({ message: "Error processing location-based search" });
    }
  });
  
  app.get("/api/services/search/category", async (req, res) => {
    try {
      const { category, lat, lng, radius } = req.query;
      
      if (!category) {
        return res.status(400).json({ message: "Missing required parameter: category" });
      }
      
      let results;
      
      if (lat && lng && radius) {
        results = await storage.searchServicesByCategory(
          category as string,
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
      } else {
        results = await storage.searchServicesByCategory(category as string);
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error in category-based service search:", error);
      res.status(500).json({ message: "Error processing category-based search" });
    }
  });
  
  app.get("/api/requirements/search/category", async (req, res) => {
    try {
      const { category, lat, lng, radius } = req.query;
      
      if (!category) {
        return res.status(400).json({ message: "Missing required parameter: category" });
      }
      
      let results;
      
      if (lat && lng && radius) {
        results = await storage.searchRequirementsByCategory(
          category as string,
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
      } else {
        results = await storage.searchRequirementsByCategory(category as string);
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error in category-based requirement search:", error);
      res.status(500).json({ message: "Error processing category-based search" });
    }
  });

  // Initialize file upload middleware
  app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    abortOnLimit: true
  }));

  // TTS API endpoint using ElevenLabs
  app.post("/api/tts", async (req: Request, res: Response) => {
    try {
      const { text, language } = req.body;
      
      if (!text || !language) {
        return res.status(400).json({ 
          error: "Missing required parameters. Please provide 'text' and 'language'." 
        });
      }

      console.log(`TTS Request: "${text}" in language: ${language}`);
      
      try {
        // Select the correct API endpoint based on language
        let apiUrl = 'https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL';
        let apiHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        };
        let apiData: any = {
          text: text,
          model_id: "eleven_multilingual_v2"
        };
        
        // Check for ElevenLabs API key in environment variables
        const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
        if (elevenLabsApiKey) {
          apiHeaders['xi-api-key'] = elevenLabsApiKey;
        }
        
        console.log(`Making TTS request to ${apiUrl} for language: ${language}`);
        
        // Use Axios for better request handling
        const response = await axios({
          method: 'POST',
          url: apiUrl,
          headers: apiHeaders,
          data: apiData,
          responseType: 'arraybuffer',
          timeout: 30000 // 30 second timeout
        });
        
        // Send the audio file back to the client
        res.set('Content-Type', 'audio/mpeg');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.send(response.data);
      } catch (innerError: any) {
        console.error('TTS API failed:', innerError.message);
        
        // Fallback to a specially created mp3 message
        res.set('Content-Type', 'application/json');
        res.status(500).json({ 
          error: "Text-to-speech service is currently unavailable",
          details: "Please try again later"
        });
      }
    } catch (error: any) {
      console.error('TTS Error:', error.message);
      res.status(500).json({ 
        error: "Failed to generate speech", 
        details: error.message 
      });
    }
  });

  return httpServer;
}