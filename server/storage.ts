import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { User, Service, Requirement, Bid, InsertUser, users, services, requirements, bids, profiles, Profile } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq } from 'drizzle-orm';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Profile operations
  getProfileByUserId(userId: number): Promise<Profile | undefined>;
  updateProfile(userId: number, profile: Partial<Profile>): Promise<Profile>;
  verifyProfile(userId: number, documents: any): Promise<Profile>;

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

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  sessionStore: session.Store;

  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.db = drizzle(pool);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getProfileByUserId(userId: number): Promise<Profile | undefined> {
    const result = await this.db.select().from(profiles).where(eq(profiles.userId, userId));
    return result[0];
  }

  async updateProfile(userId: number, profileData: Partial<Profile>): Promise<Profile> {
    const existingProfile = await this.getProfileByUserId(userId);

    if (existingProfile) {
      const result = await this.db
        .update(profiles)
        .set({
          ...profileData,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId))
        .returning();
      return result[0];
    } else {
      const result = await this.db
        .insert(profiles)
        .values({
          userId,
          ...profileData,
        })
        .returning();
      return result[0];
    }
  }

  async verifyProfile(userId: number, documents: any): Promise<Profile> {
    console.log('Processing verification documents for user:', userId);
    // For now, just update the verification status
    // In a production environment, this would involve document validation
    const result = await this.db
      .update(profiles)
      .set({
        isVerified: true,
        verificationDocuments: documents.documents || [],
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    if (!result[0]) {
      throw new Error('Profile not found');
    }
    return result[0];
  }

  async createService(service: Omit<Service, "id">): Promise<Service> {
    const result = await this.db.insert(services).values(service).returning();
    return result[0];
  }

  async getServices(): Promise<Service[]> {
    return await this.db.select().from(services);
  }

  async getServicesByProvider(providerId: number): Promise<Service[]> {
    return await this.db.select().from(services).where(eq(services.providerId, providerId));
  }

  async createRequirement(requirement: Omit<Requirement, "id">): Promise<Requirement> {
    const result = await this.db.insert(requirements).values(requirement).returning();
    return result[0];
  }

  async getRequirements(): Promise<Requirement[]> {
    return await this.db.select().from(requirements);
  }

  async getRequirementsByUser(userId: number): Promise<Requirement[]> {
    return await this.db.select().from(requirements).where(eq(requirements.userId, userId));
  }

  async updateRequirementStatus(id: number, status: string): Promise<Requirement> {
    const result = await this.db
      .update(requirements)
      .set({ status })
      .where(eq(requirements.id, id))
      .returning();
    return result[0];
  }

  async createBid(bid: Omit<Bid, "id">): Promise<Bid> {
    const result = await this.db.insert(bids).values(bid).returning();
    return result[0];
  }

  async getBidsForRequirement(requirementId: number): Promise<Bid[]> {
    return await this.db.select().from(bids).where(eq(bids.requirementId, requirementId));
  }

  async updateBidStatus(id: number, status: string): Promise<Bid> {
    const result = await this.db
      .update(bids)
      .set({ status })
      .where(eq(bids.id, id))
      .returning();
    return result[0];
  }
}

// Export an instance of PostgresStorage instead of MemStorage
export const storage = new PostgresStorage();