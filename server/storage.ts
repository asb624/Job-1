import { User, Service, Requirement, Bid, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Service operations
  createService(service: Omit<Service, "id">): Promise<Service>;
  getServices(): Promise<Service[]>;
  getServicesByProvider(providerId: number): Promise<Service[]>;
  
  // Requirement operations
  createRequirement(requirement: Omit<Requirement, "id">): Promise<Requirement>;
  getRequirements(): Promise<Requirement[]>;
  getRequirementsByUser(userId: number): Promise<Requirement[]>;
  updateRequirementStatus(id: number, status: string): Promise<Requirement>;
  
  // Bid operations
  createBid(bid: Omit<Bid, "id">): Promise<Bid>;
  getBidsForRequirement(requirementId: number): Promise<Bid[]>;
  updateBidStatus(id: number, status: string): Promise<Bid>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private requirements: Map<number, Requirement>;
  private bids: Map<number, Bid>;
  sessionStore: session.Store;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.requirements = new Map();
    this.bids = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createService(service: Omit<Service, "id">): Promise<Service> {
    const id = this.currentId++;
    const newService = { ...service, id };
    this.services.set(id, newService);
    return newService;
  }

  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getServicesByProvider(providerId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.providerId === providerId,
    );
  }

  async createRequirement(requirement: Omit<Requirement, "id">): Promise<Requirement> {
    const id = this.currentId++;
    const newRequirement = { ...requirement, id };
    this.requirements.set(id, newRequirement);
    return newRequirement;
  }

  async getRequirements(): Promise<Requirement[]> {
    return Array.from(this.requirements.values());
  }

  async getRequirementsByUser(userId: number): Promise<Requirement[]> {
    return Array.from(this.requirements.values()).filter(
      (req) => req.userId === userId,
    );
  }

  async updateRequirementStatus(id: number, status: string): Promise<Requirement> {
    const requirement = this.requirements.get(id);
    if (!requirement) throw new Error("Requirement not found");
    const updated = { ...requirement, status };
    this.requirements.set(id, updated);
    return updated;
  }

  async createBid(bid: Omit<Bid, "id">): Promise<Bid> {
    const id = this.currentId++;
    const newBid = { ...bid, id };
    this.bids.set(id, newBid);
    return newBid;
  }

  async getBidsForRequirement(requirementId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.requirementId === requirementId,
    );
  }

  async updateBidStatus(id: number, status: string): Promise<Bid> {
    const bid = this.bids.get(id);
    if (!bid) throw new Error("Bid not found");
    const updated = { ...bid, status };
    this.bids.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
