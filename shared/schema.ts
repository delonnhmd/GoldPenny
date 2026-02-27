
import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
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

export const insertLeadSchema = createInsertSchema(leads).omit({ 
  id: true, 
  createdAt: true,
  ipAddress: true // server-side only
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

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
  "Car Refinance"
] as const;
