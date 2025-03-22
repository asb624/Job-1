import { pgTable, text, serial, integer, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isServiceProvider: boolean("is_service_provider").notNull().default(false),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
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
});

export const insertServiceSchema = createInsertSchema(services).pick({
  title: true,
  description: true,
  category: true,
  price: true,
});

export const insertRequirementSchema = createInsertSchema(requirements).pick({
  title: true,
  description: true,
  category: true,
  budget: true,
});

export const insertBidSchema = createInsertSchema(bids).pick({
  requirementId: true,
  amount: true,
  message: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  serviceId: true,
  rating: true,
  comment: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Requirement = typeof requirements.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Review = typeof reviews.$inferSelect;

export const serviceCategories = [
  "Web Development",
  "Mobile Development",
  "Design",
  "Writing",
  "Marketing",
  "Business",
] as const;