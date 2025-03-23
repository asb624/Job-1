import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { 
  User, Service, Requirement, Bid, InsertUser, 
  users, services, requirements, bids, profiles, Profile,
  conversations, messages, notifications,
  Conversation, Message, Notification
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, or, and, desc, sql, SQL } from 'drizzle-orm';

const PostgresSessionStore = connectPg(session);

// Utility function to calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Radius of the Earth in kilometers
  const R = 6371; 
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

// This function calculates the bounding box for location-based searches
// Utility function used for SQL queries
function calculateBoundingBox(
  lat: number,
  lng: number,
  radius: number
) {
  // This is a simplified approximation using a square boundary
  // For more precise calculations, consider using PostGIS with spatial indexes
  const latDiff = radius / 111; // 1 degree of latitude is approximately 111 km
  const lngDiff = radius / (111 * Math.cos(lat * Math.PI / 180));
  
  return {
    minLat: lat - latDiff,
    maxLat: lat + latDiff,
    minLng: lng - lngDiff,
    maxLng: lng + lngDiff
  };
}

export interface IStorage {
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastSeen(userId: number): Promise<User>;

  // Profile operations
  getProfileByUserId(userId: number): Promise<Profile | undefined>;
  updateProfile(userId: number, profile: Partial<Profile>): Promise<Profile>;
  verifyProfile(userId: number, documents: any): Promise<Profile>;

  // Service operations
  createService(service: Omit<Service, "id">): Promise<Service>;
  getServices(): Promise<Service[]>;
  getServicesByProvider(providerId: number): Promise<Service[]>;
  searchServicesByLocation(lat: number, lng: number, radius: number, isRemote?: boolean): Promise<Service[]>;
  searchServicesByCategory(category: string, lat?: number, lng?: number, radius?: number): Promise<Service[]>;

  // Requirement operations
  createRequirement(requirement: Omit<Requirement, "id">): Promise<Requirement>;
  getRequirement(id: number): Promise<Requirement | undefined>;
  getRequirements(): Promise<Requirement[]>;
  getRequirementsByUser(userId: number): Promise<Requirement[]>;
  updateRequirementStatus(id: number, status: string): Promise<Requirement>;
  searchRequirementsByLocation(lat: number, lng: number, radius: number, isRemote?: boolean): Promise<Requirement[]>;
  searchRequirementsByCategory(category: string, lat?: number, lng?: number, radius?: number): Promise<Requirement[]>;

  // Bid operations
  createBid(bid: Omit<Bid, "id">): Promise<Bid>;
  getBidsForRequirement(requirementId: number): Promise<Bid[]>;
  updateBidStatus(id: number, status: string): Promise<Bid>;
  
  // Conversation operations
  getOrCreateConversation(user1Id: number, user2Id: number): Promise<Conversation>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  
  // Message operations
  createMessage(message: Omit<Message, "id" | "isRead" | "createdAt"> & { senderId: number }): Promise<Message>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<Message>;
  
  // Notification operations
  createNotification(notification: Omit<Notification, "id" | "isRead" | "createdAt">): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
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
    // Only select columns that definitely exist until migration is complete
    const results = await this.db.select({
      id: services.id,
      title: services.title,
      description: services.description,
      category: services.category,
      providerId: services.providerId,
      price: services.price,
      createdAt: services.createdAt,
    }).from(services);
    
    // Add default null values for location fields
    return results.map(service => ({
      ...service,
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      serviceRadius: null,
      isRemote: null
    }));
  }

  async getServicesByProvider(providerId: number): Promise<Service[]> {
    // Only select columns that definitely exist until migration is complete
    const results = await this.db.select({
      id: services.id,
      title: services.title,
      description: services.description,
      category: services.category,
      providerId: services.providerId,
      price: services.price,
      createdAt: services.createdAt,
    }).from(services).where(eq(services.providerId, providerId));
    
    // Add default null values for location fields
    return results.map(service => ({
      ...service,
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      serviceRadius: null,
      isRemote: null
    }));
  }

  async createRequirement(requirement: Omit<Requirement, "id">): Promise<Requirement> {
    const result = await this.db.insert(requirements).values(requirement).returning();
    return result[0];
  }
  
  async getRequirement(id: number): Promise<Requirement | undefined> {
    // Only select columns that definitely exist until migration is complete
    const result = await this.db.select({
      id: requirements.id,
      title: requirements.title,
      description: requirements.description,
      category: requirements.category,
      userId: requirements.userId,
      budget: requirements.budget,
      status: requirements.status,
      createdAt: requirements.createdAt,
    }).from(requirements).where(eq(requirements.id, id));
    
    if (!result.length) return undefined;
    
    // Add default null values for location fields
    return {
      ...result[0],
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      isRemote: null
    };
  }

  async getRequirements(): Promise<Requirement[]> {
    // Only select columns that definitely exist until migration is complete
    const results = await this.db.select({
      id: requirements.id,
      title: requirements.title,
      description: requirements.description,
      category: requirements.category,
      userId: requirements.userId,
      budget: requirements.budget,
      status: requirements.status,
      createdAt: requirements.createdAt,
    }).from(requirements);
    
    // Add default null values for location fields
    return results.map(requirement => ({
      ...requirement,
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      isRemote: null
    }));
  }

  async getRequirementsByUser(userId: number): Promise<Requirement[]> {
    // Only select columns that definitely exist until migration is complete
    const results = await this.db.select({
      id: requirements.id,
      title: requirements.title,
      description: requirements.description,
      category: requirements.category,
      userId: requirements.userId,
      budget: requirements.budget,
      status: requirements.status,
      createdAt: requirements.createdAt,
    }).from(requirements).where(eq(requirements.userId, userId));
    
    // Add default null values for location fields
    return results.map(requirement => ({
      ...requirement,
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      isRemote: null
    }));
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

  async updateUserLastSeen(userId: number): Promise<User> {
    const result = await this.db
      .update(users)
      .set({ lastSeen: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getOrCreateConversation(user1Id: number, user2Id: number): Promise<Conversation> {
    // Check if conversation already exists
    const existingConversation = await this.db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, user1Id), eq(conversations.user2Id, user2Id)),
          and(eq(conversations.user1Id, user2Id), eq(conversations.user2Id, user1Id))
        )
      );

    if (existingConversation.length > 0) {
      return existingConversation[0];
    }

    // Create new conversation
    const result = await this.db
      .insert(conversations)
      .values({
        user1Id: user1Id,
        user2Id: user2Id,
      })
      .returning();
    return result[0];
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return await this.db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      );
  }

  async createMessage(message: Omit<Message, "id" | "isRead" | "createdAt"> & { senderId: number }): Promise<Message> {
    // Update the conversation's lastMessageAt timestamp
    await this.db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    // Insert the new message
    const result = await this.db
      .insert(messages)
      .values(message)
      .returning();
    return result[0];
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async markMessageAsRead(messageId: number): Promise<Message> {
    const result = await this.db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId))
      .returning();
    return result[0];
  }

  async createNotification(notification: Omit<Notification, "id" | "isRead" | "createdAt">): Promise<Notification> {
    const result = await this.db
      .insert(notifications)
      .values(notification)
      .returning();
    return result[0];
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    const result = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Location-based search methods
  async searchServicesByLocation(lat: number, lng: number, radius: number, isRemote: boolean = false): Promise<Service[]> {
    // Calculate boundary deltas
    const latDiff = radius / 111; // 1 degree of latitude is approximately 111 km
    const lngDiff = radius / (111 * Math.cos(lat * Math.PI / 180));
    
    // Create query conditions for location
    const locationCondition = sql`
      latitude IS NOT NULL AND
      longitude IS NOT NULL AND
      latitude BETWEEN ${lat - latDiff} AND ${lat + latDiff} AND
      longitude BETWEEN ${lng - lngDiff} AND ${lng + lngDiff}
    `;
    
    let results;
    
    // Include remote services if requested
    if (isRemote) {
      results = await this.db
        .select()
        .from(services)
        .where(
          sql`(${services.isRemote} = true OR (${locationCondition}))`
        );
    } else {
      // Only in-person services within radius
      results = await this.db
        .select()
        .from(services)
        .where(
          sql`(${services.isRemote} = false OR ${services.isRemote} IS NULL) AND (${locationCondition})`
        );
    }
    
    // For accurate distance calculations, post-process the results
    return results
      .filter(service => 
        // Skip null coordinates (old records without location data)
        service.latitude !== null && 
        service.longitude !== null
      )
      .map(service => ({
        ...service,
        // Calculate exact distance using Haversine formula
        distance: calculateDistance(lat, lng, service.latitude!, service.longitude!)
      }))
      // Sort by distance
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }

  async searchServicesByCategory(category: string, lat?: number, lng?: number, radius?: number): Promise<Service[]> {
    // Base query for category
    let results;
    
    // If location parameters are provided, include proximity filtering
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      // Calculate boundary deltas
      const latDiff = radius / 111; // 1 degree of latitude is approximately 111 km
      const lngDiff = radius / (111 * Math.cos(lat * Math.PI / 180));
      
      // Create query with location filtering
      results = await this.db
        .select()
        .from(services)
        .where(
          sql`
            ${services.category} = ${category} AND
            ${services.latitude} IS NOT NULL AND
            ${services.longitude} IS NOT NULL AND
            ${services.latitude} BETWEEN ${lat - latDiff} AND ${lat + latDiff} AND
            ${services.longitude} BETWEEN ${lng - lngDiff} AND ${lng + lngDiff}
          `
        );
    } else {
      // Simple category search without location
      results = await this.db
        .select()
        .from(services)
        .where(eq(services.category, category));
    }
    
    // If location parameters are provided, calculate and sort by distance
    if (lat !== undefined && lng !== undefined) {
      return results
        .filter((service: any) => 
          // Skip null coordinates (old records without location data)
          service.latitude !== null && 
          service.longitude !== null
        )
        .map((service: any) => ({
          ...service,
          // Calculate exact distance using Haversine formula
          distance: calculateDistance(lat, lng, service.latitude!, service.longitude!)
        }))
        // Sort by distance
        .sort((a: any, b: any) => (a.distance || Infinity) - (b.distance || Infinity));
    }
    
    // Otherwise, return unsorted results
    return results;
  }

  async searchRequirementsByLocation(lat: number, lng: number, radius: number, isRemote: boolean = false): Promise<Requirement[]> {
    // Calculate boundary deltas
    const latDiff = radius / 111; // 1 degree of latitude is approximately 111 km
    const lngDiff = radius / (111 * Math.cos(lat * Math.PI / 180));
    
    // Create query conditions for location
    const locationCondition = sql`
      latitude IS NOT NULL AND
      longitude IS NOT NULL AND
      latitude BETWEEN ${lat - latDiff} AND ${lat + latDiff} AND
      longitude BETWEEN ${lng - lngDiff} AND ${lng + lngDiff}
    `;
    
    let results;
    
    // Include remote requirements if requested
    if (isRemote) {
      results = await this.db
        .select()
        .from(requirements)
        .where(
          sql`
            ${requirements.status} = 'open' AND
            (${requirements.isRemote} = true OR (${locationCondition}))
          `
        );
    } else {
      // Only in-person requirements within radius
      results = await this.db
        .select()
        .from(requirements)
        .where(
          sql`
            ${requirements.status} = 'open' AND
            (${requirements.isRemote} = false OR ${requirements.isRemote} IS NULL) AND
            (${locationCondition})
          `
        );
    }
    
    // For accurate distance calculations, post-process the results
    return results
      .filter((requirement: any) => 
        // Skip null coordinates (old records without location data)
        requirement.latitude !== null && 
        requirement.longitude !== null
      )
      .map((requirement: any) => ({
        ...requirement,
        // Calculate exact distance using Haversine formula
        distance: calculateDistance(lat, lng, requirement.latitude!, requirement.longitude!)
      }))
      // Sort by distance
      .sort((a: any, b: any) => (a.distance || Infinity) - (b.distance || Infinity));
  }

  async searchRequirementsByCategory(category: string, lat?: number, lng?: number, radius?: number): Promise<Requirement[]> {
    // Base query for category
    let results;
    
    // If location parameters are provided, include proximity filtering
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      // Calculate boundary deltas
      const latDiff = radius / 111; // 1 degree of latitude is approximately 111 km
      const lngDiff = radius / (111 * Math.cos(lat * Math.PI / 180));
      
      // Create query with location filtering
      results = await this.db
        .select()
        .from(requirements)
        .where(
          sql`
            ${requirements.category} = ${category} AND
            ${requirements.status} = 'open' AND
            ${requirements.latitude} IS NOT NULL AND
            ${requirements.longitude} IS NOT NULL AND
            ${requirements.latitude} BETWEEN ${lat - latDiff} AND ${lat + latDiff} AND
            ${requirements.longitude} BETWEEN ${lng - lngDiff} AND ${lng + lngDiff}
          `
        );
    } else {
      // Simple category search without location
      results = await this.db
        .select()
        .from(requirements)
        .where(
          sql`
            ${requirements.category} = ${category} AND
            ${requirements.status} = 'open'
          `
        );
    }
    
    // If location parameters are provided, calculate and sort by distance
    if (lat !== undefined && lng !== undefined) {
      return results
        .filter((requirement: any) => 
          // Skip null coordinates (old records without location data)
          requirement.latitude !== null && 
          requirement.longitude !== null
        )
        .map((requirement: any) => ({
          ...requirement,
          // Calculate exact distance using Haversine formula
          distance: calculateDistance(lat, lng, requirement.latitude!, requirement.longitude!)
        }))
        // Sort by distance
        .sort((a: any, b: any) => (a.distance || Infinity) - (b.distance || Infinity));
    }
    
    // Otherwise, return unsorted results
    return results;
  }
}

// Export an instance of PostgresStorage instead of MemStorage
export const storage = new PostgresStorage();