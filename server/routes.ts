import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertServiceSchema, insertRequirementSchema, insertBidSchema, 
  insertProfileSchema, insertMessageSchema, insertNotificationSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

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
    if (!req.isAuthenticated() || !req.user.isServiceProvider) {
      return res.status(403).send("Only service providers can create services");
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
      // Check if location-based query parameters are provided
      const { lat, lng, radius, isRemote, category } = req.query;
      
      // If both location and category parameters are provided
      if (lat && lng && radius && category) {
        const results = await storage.searchServicesByCategory(
          category as string,
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
        return res.json(results);
      }
      
      // If only location parameters are provided
      if (lat && lng && radius) {
        const results = await storage.searchServicesByLocation(
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string),
          isRemote === 'true'
        );
        return res.json(results);
      }
      
      // If only category parameter is provided
      if (category) {
        const results = await storage.searchServicesByCategory(category as string);
        return res.json(results);
      }
      
      // Default: get all services
      const services = await storage.getServices();
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
      // Check if location-based query parameters are provided
      const { lat, lng, radius, isRemote, category } = req.query;
      
      // If both location and category parameters are provided
      if (lat && lng && radius && category) {
        const results = await storage.searchRequirementsByCategory(
          category as string,
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
        return res.json(results);
      }
      
      // If only location parameters are provided
      if (lat && lng && radius) {
        const results = await storage.searchRequirementsByLocation(
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string),
          isRemote === 'true'
        );
        return res.json(results);
      }
      
      // If only category parameter is provided
      if (category) {
        const results = await storage.searchRequirementsByCategory(category as string);
        return res.json(results);
      }
      
      // Default: get all requirements
      const requirements = await storage.getRequirements();
      res.json(requirements);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      res.status(500).json({ message: "Failed to fetch requirements" });
    }
  });

  // Bids
  app.post("/api/bids", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isServiceProvider) {
      return res.status(403).send("Only service providers can create bids");
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
          content: `A service provider has placed a bid on your requirement: ${requirement.title}`,
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
        payload: message
      };
      
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

  // Notifications
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

  return httpServer;
}