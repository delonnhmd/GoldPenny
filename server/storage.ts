
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "./db";
import {
  leads,
  mediaUploads,
  smartPennyPosts,
  smartPennyUpdates,
  type CreateSmartPennyPostInput,
  type InsertLead,
  type Lead,
  type MediaUpload,
  type SmartPennyPage,
  type SmartPennyPost,
  type SmartPennyUpdate,
  type UpdateSmartPennyPostInput,
  type UpsertSmartPennyUpdateInput,
} from "@shared/schema";

type InsertLeadWithIp = InsertLead & { ipAddress?: string | null };
type ReportPeriod = "day" | "week";
type DbSmartPennyPage = "rates" | "market" | "shopping-guide";

const toDbSmartPennyPage = (page: SmartPennyPage): DbSmartPennyPage => {
  if (page === "smart-penny") return "market";
  if (page === "shopping-guide") return "shopping-guide";
  return "rates";
};
const fromDbSmartPennyPage = (page: string): SmartPennyPage => {
  if (page === "market") return "smart-penny";
  if (page === "shopping-guide") return "shopping-guide";
  return "rates";
};

export type LeadReport = {
  period: ReportPeriod;
  totalLeads: number;
  avgLoanAmount: number;
  topPurposes: Array<{ purpose: string; count: number }>;
};

export interface IStorage {
  createLead(lead: InsertLeadWithIp): Promise<Lead>;
  getSmartPennyUpdate(page: SmartPennyPage): Promise<SmartPennyUpdate | null>;
  upsertSmartPennyUpdate(payload: UpsertSmartPennyUpdateInput): Promise<SmartPennyUpdate>;
  listLeads(limit?: number): Promise<Lead[]>;
  getLeadReport(period: ReportPeriod): Promise<LeadReport>;
  listSmartPennyPosts(page: SmartPennyPage, limit?: number): Promise<SmartPennyPost[]>;
  getSmartPennyPostBySlug(slug: string): Promise<SmartPennyPost | null>;
  createSmartPennyPost(payload: CreateSmartPennyPostInput): Promise<SmartPennyPost>;
  updateSmartPennyPost(id: number, payload: UpdateSmartPennyPostInput): Promise<SmartPennyPost | null>;
  deleteSmartPennyPost(id: number): Promise<boolean>;
  saveMediaUpload(payload: { filename: string; mimeType: string; data: string; sizeBytes: number }): Promise<MediaUpload>;
  getMediaUpload(id: number): Promise<MediaUpload | null>;
  listMediaUploads(limit?: number): Promise<Omit<MediaUpload, "data">[]>;
  deleteMediaUpload(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private async ensureSmartPennyPostsTable(): Promise<void> {
    await db!.execute(sql`
      CREATE TABLE IF NOT EXISTS market_posts (
        id serial PRIMARY KEY,
        page varchar(32) NOT NULL,
        title text NOT NULL,
        content text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
  }

  private async ensureMediaUploadsTable(): Promise<void> {
    await db!.execute(sql`
      CREATE TABLE IF NOT EXISTS media_uploads (
        id serial PRIMARY KEY,
        filename text NOT NULL,
        mime_type text NOT NULL,
        data text NOT NULL,
        size_bytes integer NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
  }

  async createLead(insertLead: InsertLeadWithIp): Promise<Lead> {
    const [lead] = await db!.insert(leads).values(insertLead).returning();
    return lead;
  }

  async getSmartPennyUpdate(page: SmartPennyPage): Promise<SmartPennyUpdate | null> {
    const dbPage = toDbSmartPennyPage(page);
    const [item] = await db!
      .select()
      .from(smartPennyUpdates)
      .where(eq(smartPennyUpdates.page, dbPage))
      .limit(1);

    if (!item) {
      return null;
    }

    return {
      ...item,
      page: fromDbSmartPennyPage(item.page),
    };
  }

  async upsertSmartPennyUpdate(payload: UpsertSmartPennyUpdateInput): Promise<SmartPennyUpdate> {
    const dbPage = toDbSmartPennyPage(payload.page);
    const [item] = await db!
      .insert(smartPennyUpdates)
      .values({
        page: dbPage,
        title: payload.title,
        summary: payload.summary,
        bullets: payload.bullets,
        tips: payload.tips,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: smartPennyUpdates.page,
        set: {
          title: payload.title,
          summary: payload.summary,
          bullets: payload.bullets,
          tips: payload.tips,
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      ...item,
      page: fromDbSmartPennyPage(item.page),
    };
  }

  async listLeads(limit = 100): Promise<Lead[]> {
    return db!
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(limit);
  }

  async getLeadReport(period: ReportPeriod): Promise<LeadReport> {
    const now = new Date();
    const rangeStart = new Date(now);

    if (period === "day") {
      rangeStart.setHours(0, 0, 0, 0);
    } else {
      rangeStart.setDate(rangeStart.getDate() - 7);
    }

    const rows = await db!
      .select({
        loanAmount: leads.loanAmount,
        loanPurpose: leads.loanPurpose,
      })
      .from(leads)
      .where(and(gte(leads.createdAt, rangeStart), lt(leads.createdAt, now)));

    const totalLeads = rows.length;
    const totalAmount = rows.reduce((sum, row) => sum + row.loanAmount, 0);
    const avgLoanAmount = totalLeads > 0 ? Math.round(totalAmount / totalLeads) : 0;

    const purposeCounts = new Map<string, number>();
    rows.forEach((row) => {
      purposeCounts.set(row.loanPurpose, (purposeCounts.get(row.loanPurpose) ?? 0) + 1);
    });

    const topPurposes = Array.from(purposeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([purpose, count]) => ({ purpose, count }));

    return {
      period,
      totalLeads,
      avgLoanAmount,
      topPurposes,
    };
  }

  async listSmartPennyPosts(page: SmartPennyPage, limit = 50): Promise<SmartPennyPost[]> {
    await this.ensureSmartPennyPostsTable();
    const dbPage = toDbSmartPennyPage(page);

    const rows = await db!
      .select()
      .from(smartPennyPosts)
      .where(eq(smartPennyPosts.page, dbPage))
      .orderBy(desc(smartPennyPosts.createdAt))
      .limit(limit);

    return rows.map((post) => ({
      ...post,
      page: fromDbSmartPennyPage(post.page),
    }));
  }

  async getSmartPennyPostBySlug(slug: string): Promise<SmartPennyPost | null> {
    await this.ensureSmartPennyPostsTable();
    const rows = await db!
      .select()
      .from(smartPennyPosts)
      .where(eq(smartPennyPosts.slug, slug))
      .limit(1);
    if (!rows[0]) return null;
    return { ...rows[0], page: fromDbSmartPennyPage(rows[0].page) };
  }

  async createSmartPennyPost(payload: CreateSmartPennyPostInput): Promise<SmartPennyPost> {
    await this.ensureSmartPennyPostsTable();
    const dbPage = toDbSmartPennyPage(payload.page);

    const [post] = await db!
      .insert(smartPennyPosts)
      .values({
        page: dbPage,
        title: payload.title,
        content: payload.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      ...post,
      page: fromDbSmartPennyPage(post.page),
    };
  }

  async updateSmartPennyPost(id: number, payload: UpdateSmartPennyPostInput): Promise<SmartPennyPost | null> {
    await this.ensureSmartPennyPostsTable();

    const [updated] = await db!
      .update(smartPennyPosts)
      .set({
        title: payload.title,
        content: payload.content,
        updatedAt: new Date(),
      })
      .where(eq(smartPennyPosts.id, id))
      .returning();

    if (!updated) {
      return null;
    }

    return {
      ...updated,
      page: fromDbSmartPennyPage(updated.page),
    };
  }

  async deleteSmartPennyPost(id: number): Promise<boolean> {
    await this.ensureSmartPennyPostsTable();

    const result = await db!.delete(smartPennyPosts).where(eq(smartPennyPosts.id, id)).returning({ id: smartPennyPosts.id });
    return result.length > 0;
  }

  async saveMediaUpload(payload: { filename: string; mimeType: string; data: string; sizeBytes: number }): Promise<MediaUpload> {
    await this.ensureMediaUploadsTable();
    const [item] = await db!
      .insert(mediaUploads)
      .values({ filename: payload.filename, mimeType: payload.mimeType, data: payload.data, sizeBytes: payload.sizeBytes })
      .returning();
    return item;
  }

  async getMediaUpload(id: number): Promise<MediaUpload | null> {
    await this.ensureMediaUploadsTable();
    const [item] = await db!.select().from(mediaUploads).where(eq(mediaUploads.id, id)).limit(1);
    return item ?? null;
  }

  async listMediaUploads(limit = 50): Promise<Omit<MediaUpload, "data">[]> {
    await this.ensureMediaUploadsTable();
    return db!
      .select({ id: mediaUploads.id, filename: mediaUploads.filename, mimeType: mediaUploads.mimeType, sizeBytes: mediaUploads.sizeBytes, createdAt: mediaUploads.createdAt })
      .from(mediaUploads)
      .orderBy(desc(mediaUploads.createdAt))
      .limit(limit);
  }

  async deleteMediaUpload(id: number): Promise<boolean> {
    await this.ensureMediaUploadsTable();
    const result = await db!.delete(mediaUploads).where(eq(mediaUploads.id, id)).returning({ id: mediaUploads.id });
    return result.length > 0;
  }
}

export class InMemoryStorage implements IStorage {
  private leads: Lead[] = [];
  private smartPennyPosts: SmartPennyPost[] = [
    {
      id: 1,
      page: "rates",
      title: "Weekly Rates Outlook",
      content: "Rates were mostly stable this week. Lenders are still prioritizing cash-flow strength and operating history. Review total repayment cost before selecting a term.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      page: "smart-penny",
      title: "Small Business Lending Pulse",
      content: "Working capital demand remains strong. Inventory and equipment use-cases are seeing solid lender interest, while risk reviews are slightly tighter in seasonal industries.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  private smartPennyUpdates: SmartPennyUpdate[] = [
    {
      id: 1,
      page: "rates",
      title: "Weekly Rates Snapshot",
      summary: "Rates held mostly steady this week as lenders balance demand and inflation signals.",
      bullets: [
        "Prime-linked offers are stable for qualified borrowers",
        "Shorter terms continue to price better than longer terms",
        "Borrowers with stronger cash flow are seeing faster approvals",
      ],
      tips: [
        "Compare total repayment, not only APR",
        "Prepare recent bank statements before applying",
      ],
      updatedAt: new Date(),
    },
    {
      id: 2,
      page: "smart-penny",
      title: "Small Business Lending Smart Penny Update",
      summary: "Lender appetite remains healthy in core sectors, with tighter underwriting in higher-risk categories.",
      bullets: [
        "Working capital demand is trending up",
        "Equipment and inventory financing remain active",
        "Seasonality is influencing approval speed",
      ],
      tips: [
        "Show 3-6 months of consistent revenue where possible",
        "Apply for the amount you can document confidently",
      ],
      updatedAt: new Date(),
    },
  ];
  private nextId = 1;
  private nextPostId = 3;
  private nextSmartPennyUpdateId = 3;

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
      phone: null,
      ipAddress: insertLead.ipAddress ?? null,
      createdAt: new Date(),
    };

    this.leads.push(lead);
    return lead;
  }

  async getSmartPennyUpdate(page: SmartPennyPage): Promise<SmartPennyUpdate | null> {
    return this.smartPennyUpdates.find((item) => item.page === page) ?? null;
  }

  async upsertSmartPennyUpdate(payload: UpsertSmartPennyUpdateInput): Promise<SmartPennyUpdate> {
    const index = this.smartPennyUpdates.findIndex((item) => item.page === payload.page);

    if (index >= 0) {
      const updated: SmartPennyUpdate = {
        ...this.smartPennyUpdates[index],
        title: payload.title,
        summary: payload.summary,
        bullets: payload.bullets,
        tips: payload.tips,
        updatedAt: new Date(),
      };
      this.smartPennyUpdates[index] = updated;
      return updated;
    }

    const created: SmartPennyUpdate = {
      id: this.nextSmartPennyUpdateId++,
      page: payload.page,
      title: payload.title,
      summary: payload.summary,
      bullets: payload.bullets,
      tips: payload.tips,
      updatedAt: new Date(),
    };

    this.smartPennyUpdates.push(created);
    return created;
  }

  async listLeads(limit = 100): Promise<Lead[]> {
    return [...this.leads]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  async getLeadReport(period: ReportPeriod): Promise<LeadReport> {
    const now = new Date();
    const rangeStart = new Date(now);

    if (period === "day") {
      rangeStart.setHours(0, 0, 0, 0);
    } else {
      rangeStart.setDate(rangeStart.getDate() - 7);
    }

    const rows = this.leads.filter((lead) => {
      const created = lead.createdAt ? new Date(lead.createdAt) : new Date(0);
      return created >= rangeStart && created < now;
    });

    const totalLeads = rows.length;
    const totalAmount = rows.reduce((sum, row) => sum + row.loanAmount, 0);
    const avgLoanAmount = totalLeads > 0 ? Math.round(totalAmount / totalLeads) : 0;

    const purposeCounts = new Map<string, number>();
    rows.forEach((row) => {
      purposeCounts.set(row.loanPurpose, (purposeCounts.get(row.loanPurpose) ?? 0) + 1);
    });

    const topPurposes = Array.from(purposeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([purpose, count]) => ({ purpose, count }));

    return {
      period,
      totalLeads,
      avgLoanAmount,
      topPurposes,
    };
  }

  async listSmartPennyPosts(page: SmartPennyPage, limit = 50): Promise<SmartPennyPost[]> {
    return this.smartPennyPosts
      .filter((post) => post.page === page)
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  async getSmartPennyPostBySlug(slug: string): Promise<SmartPennyPost | null> {
    return this.smartPennyPosts.find((p) => p.slug === slug) ?? null;
  }

  async createSmartPennyPost(payload: CreateSmartPennyPostInput): Promise<SmartPennyPost> {
    const post: SmartPennyPost = {
      id: this.nextPostId++,
      page: payload.page,
      title: payload.title,
      content: payload.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.smartPennyPosts.push(post);
    return post;
  }

  async updateSmartPennyPost(id: number, payload: UpdateSmartPennyPostInput): Promise<SmartPennyPost | null> {
    const index = this.smartPennyPosts.findIndex((post) => post.id === id);
    if (index < 0) {
      return null;
    }

    const updated: SmartPennyPost = {
      ...this.smartPennyPosts[index],
      title: payload.title,
      content: payload.content,
      updatedAt: new Date(),
    };

    this.smartPennyPosts[index] = updated;
    return updated;
  }

  async deleteSmartPennyPost(id: number): Promise<boolean> {
    const before = this.smartPennyPosts.length;
    this.smartPennyPosts = this.smartPennyPosts.filter((post) => post.id !== id);
    return this.smartPennyPosts.length < before;
  }

  private mediaUploadsStore: MediaUpload[] = [];
  private nextMediaId = 1;

  async saveMediaUpload(payload: { filename: string; mimeType: string; data: string; sizeBytes: number }): Promise<MediaUpload> {
    const item: MediaUpload = { id: this.nextMediaId++, filename: payload.filename, mimeType: payload.mimeType, data: payload.data, sizeBytes: payload.sizeBytes, createdAt: new Date() };
    this.mediaUploadsStore.push(item);
    return item;
  }

  async getMediaUpload(id: number): Promise<MediaUpload | null> {
    return this.mediaUploadsStore.find((item) => item.id === id) ?? null;
  }

  async listMediaUploads(limit = 50): Promise<Omit<MediaUpload, "data">[]> {
    return [...this.mediaUploadsStore]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map(({ data: _data, ...rest }) => rest);
  }

  async deleteMediaUpload(id: number): Promise<boolean> {
    const before = this.mediaUploadsStore.length;
    this.mediaUploadsStore = this.mediaUploadsStore.filter((item) => item.id !== id);
    return this.mediaUploadsStore.length < before;
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new InMemoryStorage();
