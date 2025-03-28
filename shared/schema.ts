import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isServiceProvider: boolean("is_service_provider").notNull().default(false),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  lastSeen: timestamp("last_seen"),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  skills: text("skills").array(),
  portfolioLinks: text("portfolio_links").array(),
  isVerified: boolean("is_verified").default(false),
  verificationDocuments: text("verification_documents").array(),
  rating: integer("rating").default(0),
  // Location data
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  serviceRadius: integer("service_radius"), // in kilometers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  providerId: integer("provider_id").notNull().references(() => users.id),
  price: integer("price").notNull(),
  // Location data
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  serviceRadius: integer("service_radius"), // in kilometers
  isRemote: boolean("is_remote").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const requirements = pgTable("requirements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  budget: integer("budget").notNull(),
  status: text("status").notNull().default("open"),
  // Location data
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isRemote: boolean("is_remote").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  requirementId: integer("requirement_id")
    .notNull()
    .references(() => requirements.id),
  providerId: integer("provider_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // "message", "bid", "review", etc.
  referenceId: integer("reference_id"), // ID related to the notification type (messageId, bidId, etc.)
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isServiceProvider: true,
  avatar: true,
});

export const insertProfileSchema = createInsertSchema(profiles).pick({
  userId: true,
  bio: true,
  skills: true,
  portfolioLinks: true,
  // Location data
  address: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  serviceRadius: true,
});

export const insertServiceSchema = createInsertSchema(services).pick({
  title: true,
  description: true,
  category: true,
  price: true,
  // Location data
  address: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  serviceRadius: true,
  isRemote: true,
});

export const insertRequirementSchema = createInsertSchema(requirements).pick({
  title: true,
  description: true,
  category: true,
  budget: true,
  // Location data
  address: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  isRemote: true,
});

export const insertBidSchema = createInsertSchema(bids).pick({
  requirementId: true,
  amount: true,
  message: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  serviceId: true,
  userId: true,
  rating: true,
  comment: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  user1Id: true,
  user2Id: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  content: true,
  type: true,
  referenceId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Requirement = typeof requirements.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export const serviceCategories = [
  "Household Work",
  "Agriculture",
  "Shop Staff",
  "Salon Service",
  "Medical Staff",
] as const;