import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { storage } from "./storage";
import { z } from "zod";
import { insertServiceSchema, insertRequirementSchema, insertBidSchema, insertProfileSchema } from "@shared/schema";

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
    });
    res.status(201).json(service);
  });

  app.get("/api/services", async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
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
    });
    res.status(201).json(requirement);
  });

  app.get("/api/requirements", async (req, res) => {
    const requirements = await storage.getRequirements();
    res.json(requirements);
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
    });
    res.status(201).json(bid);
  });

  app.get("/api/requirements/:id/bids", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const bids = await storage.getBidsForRequirement(parseInt(req.params.id));
    res.json(bids);
  });

  return httpServer;
}