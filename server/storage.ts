
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "./db";
import {
  leads,
  marketPosts,
  marketUpdates,
  type CreateMarketPostInput,
  type InsertLead,
  type Lead,
  type MarketPage,
  type MarketPost,
  type MarketUpdate,
  type UpsertMarketUpdateInput,
} from "@shared/schema";

type InsertLeadWithIp = InsertLead & { ipAddress?: string | null };
type ReportPeriod = "day" | "week";

export type LeadReport = {
  period: ReportPeriod;
  totalLeads: number;
  avgLoanAmount: number;
  topPurposes: Array<{ purpose: string; count: number }>;
};

export interface IStorage {
  createLead(lead: InsertLeadWithIp): Promise<Lead>;
  getMarketUpdate(page: MarketPage): Promise<MarketUpdate | null>;
  upsertMarketUpdate(payload: UpsertMarketUpdateInput): Promise<MarketUpdate>;
  listLeads(limit?: number): Promise<Lead[]>;
  getLeadReport(period: ReportPeriod): Promise<LeadReport>;
  listMarketPosts(page: MarketPage, limit?: number): Promise<MarketPost[]>;
  createMarketPost(payload: CreateMarketPostInput): Promise<MarketPost>;
}

export class DatabaseStorage implements IStorage {
  async createLead(insertLead: InsertLeadWithIp): Promise<Lead> {
    const [lead] = await db!.insert(leads).values(insertLead).returning();
    return lead;
  }

  async getMarketUpdate(page: MarketPage): Promise<MarketUpdate | null> {
    const [item] = await db!
      .select()
      .from(marketUpdates)
      .where(eq(marketUpdates.page, page))
      .limit(1);

    return item ?? null;
  }

  async upsertMarketUpdate(payload: UpsertMarketUpdateInput): Promise<MarketUpdate> {
    const [item] = await db!
      .insert(marketUpdates)
      .values({
        page: payload.page,
        title: payload.title,
        summary: payload.summary,
        bullets: payload.bullets,
        tips: payload.tips,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: marketUpdates.page,
        set: {
          title: payload.title,
          summary: payload.summary,
          bullets: payload.bullets,
          tips: payload.tips,
          updatedAt: new Date(),
        },
      })
      .returning();

    return item;
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

  async listMarketPosts(page: MarketPage, limit = 50): Promise<MarketPost[]> {
    return db!
      .select()
      .from(marketPosts)
      .where(eq(marketPosts.page, page))
      .orderBy(desc(marketPosts.createdAt))
      .limit(limit);
  }

  async createMarketPost(payload: CreateMarketPostInput): Promise<MarketPost> {
    const [post] = await db!
      .insert(marketPosts)
      .values({
        page: payload.page,
        title: payload.title,
        content: payload.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return post;
  }
}

export class InMemoryStorage implements IStorage {
  private leads: Lead[] = [];
  private marketPosts: MarketPost[] = [
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
      page: "market",
      title: "Small Business Lending Pulse",
      content: "Working capital demand remains strong. Inventory and equipment use-cases are seeing solid lender interest, while risk reviews are slightly tighter in seasonal industries.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  private marketUpdates: MarketUpdate[] = [
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
      page: "market",
      title: "Small Business Lending Market Update",
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
  private nextMarketUpdateId = 3;

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

  async getMarketUpdate(page: MarketPage): Promise<MarketUpdate | null> {
    return this.marketUpdates.find((item) => item.page === page) ?? null;
  }

  async upsertMarketUpdate(payload: UpsertMarketUpdateInput): Promise<MarketUpdate> {
    const index = this.marketUpdates.findIndex((item) => item.page === payload.page);

    if (index >= 0) {
      const updated: MarketUpdate = {
        ...this.marketUpdates[index],
        title: payload.title,
        summary: payload.summary,
        bullets: payload.bullets,
        tips: payload.tips,
        updatedAt: new Date(),
      };
      this.marketUpdates[index] = updated;
      return updated;
    }

    const created: MarketUpdate = {
      id: this.nextMarketUpdateId++,
      page: payload.page,
      title: payload.title,
      summary: payload.summary,
      bullets: payload.bullets,
      tips: payload.tips,
      updatedAt: new Date(),
    };

    this.marketUpdates.push(created);
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

  async listMarketPosts(page: MarketPage, limit = 50): Promise<MarketPost[]> {
    return this.marketPosts
      .filter((post) => post.page === page)
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  async createMarketPost(payload: CreateMarketPostInput): Promise<MarketPost> {
    const post: MarketPost = {
      id: this.nextPostId++,
      page: payload.page,
      title: payload.title,
      content: payload.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.marketPosts.push(post);
    return post;
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new InMemoryStorage();
