
import { db } from "./db";
import { leads, type InsertLead, type Lead } from "@shared/schema";

type InsertLeadWithIp = InsertLead & { ipAddress?: string | null };

export interface IStorage {
  createLead(lead: InsertLeadWithIp): Promise<Lead>;
}

export class DatabaseStorage implements IStorage {
  async createLead(insertLead: InsertLeadWithIp): Promise<Lead> {
    const [lead] = await db!.insert(leads).values(insertLead).returning();
    return lead;
  }
}

export class InMemoryStorage implements IStorage {
  private leads: Lead[] = [];
  private nextId = 1;

  async createLead(insertLead: InsertLeadWithIp): Promise<Lead> {
    const lead: Lead = {
      id: this.nextId++,
      loanAmount: insertLead.loanAmount,
      loanPurpose: insertLead.loanPurpose,
      creditScoreRange: insertLead.creditScoreRange,
      employmentStatus: insertLead.employmentStatus,
      fullName: insertLead.fullName,
      zipCode: insertLead.zipCode,
      email: insertLead.email,
      phone: insertLead.phone,
      ipAddress: insertLead.ipAddress ?? null,
      createdAt: new Date(),
    };

    this.leads.push(lead);
    return lead;
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new InMemoryStorage();
