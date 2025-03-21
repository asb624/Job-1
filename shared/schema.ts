import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isServiceProvider: boolean("is_service_provider").notNull().default(false),
  avatar: text("avatar"),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  providerId: integer("provider_id").notNull(),
  price: integer("price").notNull(),
});

export const requirements = pgTable("requirements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  userId: integer("user_id").notNull(),
  budget: integer("budget").notNull(),
  status: text("status").notNull().default("open"),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  requirementId: integer("requirement_id").notNull(),
  providerId: integer("provider_id").notNull(),
  amount: integer("amount").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isServiceProvider: true,
  avatar: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Requirement = typeof requirements.$inferSelect;
export type Bid = typeof bids.$inferSelect;

export const serviceCategories = [
  "Web Development",
  "Mobile Development",
  "Design",
  "Writing",
  "Marketing",
  "Business",
] as const;
