
import { db } from "./db";
import { leads, type InsertLead, type Lead } from "@shared/schema";
import { eq } from "drizzle-orm";

type InsertLeadWithIp = InsertLead & { ipAddress?: string | null };

export interface IStorage {
  createLead(lead: InsertLeadWithIp): Promise<Lead>;
}

export class DatabaseStorage implements IStorage {
  async createLead(insertLead: InsertLeadWithIp): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
    return lead;
  }
}

export const storage = new DatabaseStorage();
