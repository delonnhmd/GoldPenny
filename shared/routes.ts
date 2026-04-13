
import { z } from 'zod';
import { createSmartPennyPostSchema, insertLeadSchema, smartPennyPageSchema, updateSmartPennyPostSchema, upsertSmartPennyUpdateSchema } from './schema';

const reportPeriodSchema = z.enum(['day', 'week']);

const adminLeadSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  email: z.string(),
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

const smartPennyPostSchema = z.object({
  id: z.number(),
  page: smartPennyPageSchema,
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
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
    routeDecision: {
      method: 'POST' as const,
      path: '/api/leads/route-decision' as const,
      input: z.object({
        business_location: z.string().optional(),
        industry: z.string().optional(),
        loan_amount: z.union([z.number(), z.string()]).optional(),
        credit_score: z.string().optional(),
        annual_sales: z.string().optional(),
        time_in_business: z.string().optional(),
        sub_id_1: z.string().optional(),
        sub_id_2: z.string().optional(),
      }),
      responses: {
        200: z.object({
          partner: z.enum(['AFN', 'ROK']),
          reason: z.string(),
          targetUrl: z.string().url(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  smartPennyUpdates: {
    getByPage: {
      method: 'GET' as const,
      path: '/api/smart-penny-updates' as const,
      input: z.object({ page: smartPennyPageSchema }),
      responses: {
        200: z.object({
          page: smartPennyPageSchema,
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
      path: '/api/admin/smart-penny-updates' as const,
      input: upsertSmartPennyUpdateSchema,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.validation,
        400: errorSchemas.validation,
      },
    },
  },
  smartPennyPosts: {
    listByPage: {
      method: 'GET' as const,
      path: '/api/smart-penny-posts' as const,
      input: z.object({ page: smartPennyPageSchema, limit: z.number().optional() }),
      responses: {
        200: z.array(smartPennyPostSchema),
      },
    },
    getBySlug: {
      method: 'GET' as const,
      path: '/api/smart-penny-posts/slug/:slug' as const,
      input: z.object({ slug: z.string() }),
      responses: {
        200: smartPennyPostSchema,
        404: errorSchemas.internal,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/admin/smart-penny-posts' as const,
      input: createSmartPennyPostSchema,
      responses: {
        201: smartPennyPostSchema,
        401: errorSchemas.validation,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/admin/smart-penny-posts/:id' as const,
      input: z.object({ id: z.number().int().positive() }).merge(updateSmartPennyPostSchema),
      responses: {
        200: smartPennyPostSchema,
        401: errorSchemas.validation,
        400: errorSchemas.validation,
        404: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/admin/smart-penny-posts/:id' as const,
      input: z.object({ id: z.number().int().positive() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.validation,
        400: errorSchemas.validation,
        404: errorSchemas.validation,
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
export type LeadRouteDecisionInput = z.infer<typeof api.leads.routeDecision.input>;
export type LeadRouteDecisionResponse = z.infer<typeof api.leads.routeDecision.responses[200]>;
export type SmartPennyUpdateResponse = z.infer<typeof api.smartPennyUpdates.getByPage.responses[200]>;
export type UpsertSmartPennyUpdateRequest = z.infer<typeof api.smartPennyUpdates.upsert.input>;
export type SmartPennyPostResponse = z.infer<typeof api.smartPennyPosts.listByPage.responses[200]>;
export type CreateSmartPennyPostRequest = z.infer<typeof api.smartPennyPosts.create.input>;
export type UpdateSmartPennyPostRequest = z.infer<typeof api.smartPennyPosts.update.input>;
export type AdminLeadResponse = z.infer<typeof api.admin.leads.responses[200]>;
export type AdminReportResponse = z.infer<typeof api.admin.report.responses[200]>;
