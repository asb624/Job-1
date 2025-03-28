import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { 
  User, Service, Requirement, Bid, InsertUser, Review,
  users, services, requirements, bids, profiles, Profile,
  conversations, messages, notifications, reviews,
  Conversation, Message, Notification
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, or, gte, lte, desc, ilike, sql, SQL } from "drizzle-orm";

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
  getServices(filters?: {
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'date' | 'distance';
    sortOrder?: 'asc' | 'desc';
    category?: string;
    query?: string;
  }): Promise<Service[]>;
  getServicesByProvider(providerId: number): Promise<Service[]>;
  searchServicesByLocation(lat: number, lng: number, radius: number, isRemote?: boolean, filters?: {
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'date' | 'distance';
    sortOrder?: 'asc' | 'desc';
    category?: string;
    query?: string;
  }): Promise<Service[]>;
  searchServicesByCategory(category: string, lat?: number, lng?: number, radius?: number, filters?: {
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'date' | 'distance';
    sortOrder?: 'asc' | 'desc';
    query?: string;
  }): Promise<Service[]>;

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
  
  // Review operations
  createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review>;
  getReviewsByServiceId(serviceId: number): Promise<Review[]>;
  getReviewsByUserId(userId: number): Promise<Review[]>;
  getAverageRatingForService(serviceId: number): Promise<number>;
  
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

  async getServices(filters?: {
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'date' | 'distance';
    sortOrder?: 'asc' | 'desc';
    category?: string;
    query?: string;
  }): Promise<Service[]> {
    // Build query with optional filters
    let query = this.db.select().from(services);
    
    // Apply filters if provided
    if (filters) {
      // Price range filter
      if (filters.minPrice !== undefined) {
        query = query.where(gte(services.price, filters.minPrice));
      }
      
      if (filters.maxPrice !== undefined) {
        query = query.where(lte(services.price, filters.maxPrice));
      }
      
      // Category filter
      if (filters.category) {
        query = query.where(eq(services.category, filters.category));
      }
      
      // Text search in title and description
      if (filters.query) {
        const searchTerm = `%${filters.query}%`;
        query = query.where(
          or(
            ilike(services.title, searchTerm),
            ilike(services.description, searchTerm)
          )
        );
      }
      
      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price':
            query = filters.sortOrder === 'desc' 
              ? query.orderBy(desc(services.price))
              : query.orderBy(services.price);
            break;
          case 'date':
            query = filters.sortOrder === 'desc' 
              ? query.orderBy(desc(services.createdAt))
              : query.orderBy(services.createdAt);
            break;
          // 'distance' sorting is handled after query
        }
      } else {
        // Default sort by newest first
        query = query.orderBy(desc(services.createdAt));
      }
    } else {
      // Default sort by newest first
      query = query.orderBy(desc(services.createdAt));
    }
    
    // Execute query
    const results = await query;
    
    // Normalize results to ensure all fields are present
    const normalizedResults = results.map(service => ({
      ...service,
      address: service.address || null,
      city: service.city || null,
      state: service.state || null,
      country: service.country || null,
      postalCode: service.postalCode || null,
      latitude: service.latitude || null,
      longitude: service.longitude || null,
      serviceRadius: service.serviceRadius || null,
      isRemote: service.isRemote || false
    }));
    
    return normalizedResults;
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
  
  // Review operations implementation
  async createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const result = await this.db.insert(reviews).values(review).returning();
    return result[0];
  }
  
  async getReviewsByServiceId(serviceId: number): Promise<Review[]> {
    return await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.serviceId, serviceId))
      .orderBy(desc(reviews.createdAt));
  }
  
  async getReviewsByUserId(userId: number): Promise<Review[]> {
    return await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }
  
  async getAverageRatingForService(serviceId: number): Promise<number> {
    const result = await this.db
      .select({ avgRating: sql`AVG(${reviews.rating})` })
      .from(reviews)
      .where(eq(reviews.serviceId, serviceId));
    
    return result[0]?.avgRating || 0;
  }

  // Location-based search methods
  async searchServicesByLocation(
    lat: number, 
    lng: number, 
    radius: number, 
    isRemote: boolean = false,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      sortBy?: 'price' | 'date' | 'distance';
      sortOrder?: 'asc' | 'desc';
      category?: string;
      query?: string;
    }
  ): Promise<Service[]> {
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
    
    // Build the base query
    let query = this.db.select().from(services);
    
    // Apply location conditions
    if (isRemote) {
      query = query.where(
        sql`(${services.isRemote} = true OR (${locationCondition}))`
      );
    } else {
      query = query.where(
        sql`(${services.isRemote} = false OR ${services.isRemote} IS NULL) AND (${locationCondition})`
      );
    }
    
    // Apply additional filters if provided
    if (filters) {
      // Price range filter
      if (filters.minPrice !== undefined) {
        query = query.where(gte(services.price, filters.minPrice));
      }
      
      if (filters.maxPrice !== undefined) {
        query = query.where(lte(services.price, filters.maxPrice));
      }
      
      // Category filter
      if (filters.category) {
        query = query.where(eq(services.category, filters.category));
      }
      
      // Text search in title and description
      if (filters.query) {
        const searchTerm = `%${filters.query}%`;
        query = query.where(
          or(
            ilike(services.title, searchTerm),
            ilike(services.description, searchTerm)
          )
        );
      }
    }
    
    // Execute query
    const results = await query;
    
    // For accurate distance calculations, post-process the results
    let processedResults = results
      .filter(service => 
        // Skip null coordinates (old records without location data)
        service.latitude !== null && 
        service.longitude !== null
      )
      .map(service => ({
        ...service,
        // Calculate exact distance using Haversine formula
        distance: calculateDistance(lat, lng, service.latitude!, service.longitude!)
      }));
    
    // Apply sorting
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price':
          processedResults = processedResults.sort((a, b) => {
            return filters.sortOrder === 'desc' ? b.price - a.price : a.price - b.price;
          });
          break;
        case 'date':
          processedResults = processedResults.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
          break;
        case 'distance':
          // Default is already sorted by distance ascending
          if (filters.sortOrder === 'desc') {
            processedResults = processedResults.sort((a, b) => 
              (b.distance || Infinity) - (a.distance || Infinity)
            );
          } else {
            processedResults = processedResults.sort((a, b) => 
              (a.distance || Infinity) - (b.distance || Infinity)
            );
          }
          break;
      }
    } else {
      // Default sort by distance
      processedResults = processedResults.sort((a, b) => 
        (a.distance || Infinity) - (b.distance || Infinity)
      );
    }
    
    return processedResults;
  }

  async searchServicesByCategory(
    category: string, 
    lat?: number, 
    lng?: number, 
    radius?: number,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      sortBy?: 'price' | 'date' | 'distance';
      sortOrder?: 'asc' | 'desc';
      query?: string;
    }
  ): Promise<Service[]> {
    // Build the base query
    let query = this.db.select().from(services).where(eq(services.category, category));
    
    // If location parameters are provided, include proximity filtering
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      // Calculate boundary deltas
      const latDiff = radius / 111; // 1 degree of latitude is approximately 111 km
      const lngDiff = radius / (111 * Math.cos(lat * Math.PI / 180));
      
      // Add location conditions
      query = query.where(
        sql`
          ${services.latitude} IS NOT NULL AND
          ${services.longitude} IS NOT NULL AND
          ${services.latitude} BETWEEN ${lat - latDiff} AND ${lat + latDiff} AND
          ${services.longitude} BETWEEN ${lng - lngDiff} AND ${lng + lngDiff}
        `
      );
    }
    
    // Apply additional filters
    if (filters) {
      // Price range filter
      if (filters.minPrice !== undefined) {
        query = query.where(gte(services.price, filters.minPrice));
      }
      
      if (filters.maxPrice !== undefined) {
        query = query.where(lte(services.price, filters.maxPrice));
      }
      
      // Text search in title and description
      if (filters.query) {
        const searchTerm = `%${filters.query}%`;
        query = query.where(
          or(
            ilike(services.title, searchTerm),
            ilike(services.description, searchTerm)
          )
        );
      }
    }
    
    // Execute the query
    const results = await query;
    
    // Post-processing for location-based results
    if (lat !== undefined && lng !== undefined) {
      let processedResults = results
        .filter(service => 
          // Skip null coordinates (old records without location data)
          service.latitude !== null && 
          service.longitude !== null
        )
        .map(service => ({
          ...service,
          // Calculate exact distance using Haversine formula
          distance: calculateDistance(lat, lng, service.latitude!, service.longitude!)
        }));
      
      // Apply sorting if filters provided
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'price':
            processedResults = processedResults.sort((a, b) => {
              return filters.sortOrder === 'desc' ? b.price - a.price : a.price - b.price;
            });
            break;
          case 'date':
            processedResults = processedResults.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            });
            break;
          case 'distance':
            // Default is already sorted by distance ascending
            if (filters.sortOrder === 'desc') {
              processedResults = processedResults.sort((a, b) => 
                (b.distance || Infinity) - (a.distance || Infinity)
              );
            } else {
              processedResults = processedResults.sort((a, b) => 
                (a.distance || Infinity) - (b.distance || Infinity)
              );
            }
            break;
        }
      } else {
        // Default sort by distance
        processedResults = processedResults.sort((a, b) => 
          (a.distance || Infinity) - (b.distance || Infinity)
        );
      }
      
      return processedResults;
    }
    
    // For non-location results, apply sort
    if (filters?.sortBy && filters.sortBy !== 'distance') {
      let processedResults = [...results];
      
      switch (filters.sortBy) {
        case 'price':
          return processedResults.sort((a, b) => {
            return filters.sortOrder === 'desc' ? b.price - a.price : a.price - b.price;
          });
        case 'date':
          return processedResults.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
      }
    }
    
    // Otherwise, return results sorted by newest
    return results.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async searchRequirementsByLocation(
    lat: number, 
    lng: number, 
    radius: number, 
    isRemote: boolean = false,
    filters?: {
      minBudget?: number;
      maxBudget?: number;
      sortBy?: 'budget' | 'date' | 'distance';
      sortOrder?: 'asc' | 'desc';
      category?: string;
      query?: string;
      status?: string;
    }
  ): Promise<Requirement[]> {
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
    
    // Build the base query
    let query = this.db.select().from(requirements);
    
    // Apply location conditions
    if (isRemote) {
      query = query.where(
        sql`
          ${requirements.status} = ${filters?.status || 'open'} AND
          (${requirements.isRemote} = true OR (${locationCondition}))
        `
      );
    } else {
      query = query.where(
        sql`
          ${requirements.status} = ${filters?.status || 'open'} AND
          (${requirements.isRemote} = false OR ${requirements.isRemote} IS NULL) AND
          (${locationCondition})
        `
      );
    }
    
    // Apply additional filters if provided
    if (filters) {
      // Budget range filter
      if (filters.minBudget !== undefined) {
        query = query.where(gte(requirements.budget, filters.minBudget));
      }
      
      if (filters.maxBudget !== undefined) {
        query = query.where(lte(requirements.budget, filters.maxBudget));
      }
      
      // Category filter
      if (filters.category) {
        query = query.where(eq(requirements.category, filters.category));
      }
      
      // Text search in title and description
      if (filters.query) {
        const searchTerm = `%${filters.query}%`;
        query = query.where(
          or(
            ilike(requirements.title, searchTerm),
            ilike(requirements.description, searchTerm)
          )
        );
      }
    }
    
    // Execute the query
    const results = await query;
    
    // For accurate distance calculations, post-process the results
    let processedResults = results
      .filter(requirement => 
        // Skip null coordinates (old records without location data)
        requirement.latitude !== null && 
        requirement.longitude !== null
      )
      .map(requirement => ({
        ...requirement,
        // Calculate exact distance using Haversine formula
        distance: calculateDistance(lat, lng, requirement.latitude!, requirement.longitude!)
      }));
    
    // Apply sorting
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'budget':
          processedResults = processedResults.sort((a, b) => {
            return filters.sortOrder === 'desc' ? b.budget - a.budget : a.budget - b.budget;
          });
          break;
        case 'date':
          processedResults = processedResults.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
          break;
        case 'distance':
          // Default is already sorted by distance ascending
          if (filters.sortOrder === 'desc') {
            processedResults = processedResults.sort((a, b) => 
              (b.distance || Infinity) - (a.distance || Infinity)
            );
          } else {
            processedResults = processedResults.sort((a, b) => 
              (a.distance || Infinity) - (b.distance || Infinity)
            );
          }
          break;
      }
    } else {
      // Default sort by distance
      processedResults = processedResults.sort((a, b) => 
        (a.distance || Infinity) - (b.distance || Infinity)
      );
    }
    
    return processedResults;
  }

  async searchRequirementsByCategory(
    category: string, 
    lat?: number, 
    lng?: number, 
    radius?: number,
    filters?: {
      minBudget?: number;
      maxBudget?: number;
      sortBy?: 'budget' | 'date' | 'distance';
      sortOrder?: 'asc' | 'desc';
      query?: string;
      status?: string;
    }
  ): Promise<Requirement[]> {
    // Build the base query
    let query = this.db.select().from(requirements).where(eq(requirements.category, category));
    
    // Add status filter (default to 'open')
    query = query.where(eq(requirements.status, filters?.status || 'open'));
    
    // If location parameters are provided, include proximity filtering
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      // Calculate boundary deltas
      const latDiff = radius / 111; // 1 degree of latitude is approximately 111 km
      const lngDiff = radius / (111 * Math.cos(lat * Math.PI / 180));
      
      // Add location conditions
      query = query.where(
        sql`
          ${requirements.latitude} IS NOT NULL AND
          ${requirements.longitude} IS NOT NULL AND
          ${requirements.latitude} BETWEEN ${lat - latDiff} AND ${lat + latDiff} AND
          ${requirements.longitude} BETWEEN ${lng - lngDiff} AND ${lng + lngDiff}
        `
      );
    }
    
    // Apply additional filters
    if (filters) {
      // Budget range filter
      if (filters.minBudget !== undefined) {
        query = query.where(gte(requirements.budget, filters.minBudget));
      }
      
      if (filters.maxBudget !== undefined) {
        query = query.where(lte(requirements.budget, filters.maxBudget));
      }
      
      // Text search in title and description
      if (filters.query) {
        const searchTerm = `%${filters.query}%`;
        query = query.where(
          or(
            ilike(requirements.title, searchTerm),
            ilike(requirements.description, searchTerm)
          )
        );
      }
    }
    
    // Execute the query
    const results = await query;
    
    // Post-processing for location-based results
    if (lat !== undefined && lng !== undefined) {
      let processedResults = results
        .filter(requirement => 
          // Skip null coordinates (old records without location data)
          requirement.latitude !== null && 
          requirement.longitude !== null
        )
        .map(requirement => ({
          ...requirement,
          // Calculate exact distance using Haversine formula
          distance: calculateDistance(lat, lng, requirement.latitude!, requirement.longitude!)
        }));
      
      // Apply sorting if filters provided
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'budget':
            processedResults = processedResults.sort((a, b) => {
              return filters.sortOrder === 'desc' ? b.budget - a.budget : a.budget - b.budget;
            });
            break;
          case 'date':
            processedResults = processedResults.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            });
            break;
          case 'distance':
            // Default is already sorted by distance ascending
            if (filters.sortOrder === 'desc') {
              processedResults = processedResults.sort((a, b) => 
                (b.distance || Infinity) - (a.distance || Infinity)
              );
            } else {
              processedResults = processedResults.sort((a, b) => 
                (a.distance || Infinity) - (b.distance || Infinity)
              );
            }
            break;
        }
      } else {
        // Default sort by distance
        processedResults = processedResults.sort((a, b) => 
          (a.distance || Infinity) - (b.distance || Infinity)
        );
      }
      
      return processedResults;
    }
    
    // For non-location results, apply sort
    if (filters?.sortBy && filters.sortBy !== 'distance') {
      let processedResults = [...results];
      
      switch (filters.sortBy) {
        case 'budget':
          return processedResults.sort((a, b) => {
            return filters.sortOrder === 'desc' ? b.budget - a.budget : a.budget - b.budget;
          });
        case 'date':
          return processedResults.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
      }
    }
    
    // Otherwise, return results sorted by newest
    return results.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

// Export an instance of PostgresStorage instead of MemStorage
export const storage = new PostgresStorage();