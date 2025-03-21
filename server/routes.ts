import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { storage } from "./storage";
import { z } from "zod";
import { insertServiceSchema, insertRequirementSchema, insertBidSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

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
