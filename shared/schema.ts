
import { pgTable, text, serial, integer, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  loanAmount: integer("loan_amount").notNull(),
  loanPurpose: text("loan_purpose").notNull(),
  creditScoreRange: text("credit_score_range").notNull(),
  employmentStatus: text("employment_status").notNull(),
  fullName: text("full_name").notNull(),
  zipCode: varchar("zip_code", { length: 10 }).notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketUpdates = pgTable("market_updates", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 32 }).notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  bullets: jsonb("bullets").$type<string[]>().notNull().default([]),
  tips: jsonb("tips").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketPosts = pgTable("market_posts", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 32 }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ 
  id: true, 
  createdAt: true,
  ipAddress: true // server-side only
});

export const marketPageSchema = z.enum(["rates", "market"]);

export const upsertMarketUpdateSchema = z.object({
  page: marketPageSchema,
  title: z.string().min(3, "Headline is required"),
  summary: z.string().min(10, "Weekly summary is required"),
  bullets: z.array(z.string().min(1)).default([]),
  tips: z.array(z.string().min(1)).default([]),
});

export const createMarketPostSchema = z.object({
  page: marketPageSchema,
  title: z.string().min(3, "Post title is required"),
  content: z.string().min(20, "Post content is required"),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type MarketPage = z.infer<typeof marketPageSchema>;
export type UpsertMarketUpdateInput = z.infer<typeof upsertMarketUpdateSchema>;
export type MarketUpdate = typeof marketUpdates.$inferSelect;
export type CreateMarketPostInput = z.infer<typeof createMarketPostSchema>;
export type MarketPost = typeof marketPosts.$inferSelect;

export const creditScoreRanges = [
  "Below 580",
  "580-649",
  "650-719",
  "720+"
] as const;

export const employmentStatuses = [
  "Employed",
  "Self-Employed",
  "Unemployed"
] as const;

export const loanPurposes = [
  "Debt Consolidation",
  "Emergency",
  "Medical",
  "Other",
  "Car Buying",
  "Car Refinance",
  "Buy Inventory",
  "Buy Equipment",
  "Expansion",
  "Cover Payroll",
  "Real Estate",
  "Acquire a Business",
  "Working Capital",
  "Start a Business"
] as const;
