
import { z } from 'zod';
import { insertLeadSchema, marketPageSchema, upsertMarketUpdateSchema } from './schema';

const reportPeriodSchema = z.enum(['day', 'week']);

const adminLeadSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  loanPurpose: z.string(),
  loanAmount: z.number(),
  creditScoreRange: z.string(),
  employmentStatus: z.string(),
  zipCode: z.string(),
  createdAt: z.string(),
});

const adminReportSchema = z.object({
  period: reportPeriodSchema,
  totalLeads: z.number(),
  avgLoanAmount: z.number(),
  topPurposes: z.array(
    z.object({
      purpose: z.string(),
      count: z.number(),
    })
  ),
});

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  leads: {
    create: {
      method: 'POST' as const,
      path: '/api/leads' as const,
      input: insertLeadSchema,
      responses: {
        201: z.object({
          redirectUrl: z.string()
        }),
        400: errorSchemas.validation,
      },
    },
  },
  marketUpdates: {
    getByPage: {
      method: 'GET' as const,
      path: '/api/market-updates' as const,
      input: z.object({ page: marketPageSchema }),
      responses: {
        200: z.object({
          page: marketPageSchema,
          title: z.string(),
          summary: z.string(),
          bullets: z.array(z.string()),
          tips: z.array(z.string()),
          updatedAt: z.string(),
        }),
      },
    },
    upsert: {
      method: 'PUT' as const,
      path: '/api/admin/market-updates' as const,
      input: upsertMarketUpdateSchema,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.validation,
        400: errorSchemas.validation,
      },
    },
  },
  admin: {
    leads: {
      method: 'GET' as const,
      path: '/api/admin/leads' as const,
      input: z.object({ limit: z.number().optional() }),
      responses: {
        200: z.array(adminLeadSchema),
        401: errorSchemas.validation,
      },
    },
    report: {
      method: 'GET' as const,
      path: '/api/admin/report' as const,
      input: z.object({ period: reportPeriodSchema }),
      responses: {
        200: adminReportSchema,
        401: errorSchemas.validation,
      },
    },
  },
};

export type LeadInput = z.infer<typeof api.leads.create.input>;
export type LeadResponse = z.infer<typeof api.leads.create.responses[201]>;
export type MarketUpdateResponse = z.infer<typeof api.marketUpdates.getByPage.responses[200]>;
export type UpsertMarketUpdateRequest = z.infer<typeof api.marketUpdates.upsert.input>;
export type AdminLeadResponse = z.infer<typeof api.admin.leads.responses[200]>;
export type AdminReportResponse = z.infer<typeof api.admin.report.responses[200]>;
