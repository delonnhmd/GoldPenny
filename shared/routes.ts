
import { z } from 'zod';
import { insertLeadSchema, leads } from './schema';

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
};

export type LeadInput = z.infer<typeof api.leads.create.input>;
export type LeadResponse = z.infer<typeof api.leads.create.responses[201]>;
