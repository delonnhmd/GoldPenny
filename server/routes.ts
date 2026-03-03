
import type { Express } from "express";
import type { Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes"; // Only import api
import { z } from "zod";
import { createSmartPennyPostSchema, insertLeadSchema, smartPennyPageSchema, updateSmartPennyPostSchema, upsertSmartPennyUpdateSchema } from "@shared/schema"; // Import schema directly
import { decideLeadRoute } from "./leadRouting";

function validateAdminRequest(req: Request) {
  const configuredKey = process.env.ADMIN_DASHBOARD_KEY || process.env.ADMIN_KEY || "pennyfloat-admin";
  const requestKey = req.headers["x-admin-key"];

  if (!requestKey || Array.isArray(requestKey)) {
    return false;
  }

  return requestKey === configuredKey;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.leads.routeDecision.path, async (req, res) => {
    try {
      const payload = api.leads.routeDecision.input.parse(req.body);

      const decision = decideLeadRoute({
        businessLocation: payload.business_location,
        industry: payload.industry,
        loanAmount: payload.loan_amount,
        creditScore: payload.credit_score,
        annualSales: payload.annual_sales,
        timeInBusiness: payload.time_in_business,
        subId1: payload.sub_id_1,
        subId2: payload.sub_id_2,
      });

      return res.status(200).json(decision);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors,
        });
      }

      console.error("Error generating lead route decision:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.leads.create.path, async (req, res) => {
    try {
      // Validate inputs
      const leadData = insertLeadSchema.parse(req.body);

      // Save lead into database
      // Add IP address from request
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      
      const lead = await storage.createLead({
        ...leadData,
        ipAddress: String(ipAddress) // Ensure it's a string
      });

      const searchParams = new URLSearchParams({
        name: leadData.fullName,
        purpose: leadData.loanPurpose,
        amount: String(leadData.loanAmount),
        score: leadData.creditScoreRange,
      });

      const redirectUrl = `/offers?${searchParams.toString()}`;

      res.status(201).json({ redirectUrl });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors
        });
      }
      console.error("Error creating lead:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.smartPennyUpdates.getByPage.path, async (req, res) => {
    try {
      const parsed = z
        .object({ page: smartPennyPageSchema })
        .parse({ page: req.query.page });

      const update = await storage.getSmartPennyUpdate(parsed.page);

      if (!update) {
        return res.status(200).json({
          page: parsed.page,
          title: parsed.page === "rates" ? "Rates Update" : "Smart Penny Update",
          summary: "No update published yet.",
          bullets: [],
          tips: [],
          updatedAt: new Date().toISOString(),
        });
      }

      return res.status(200).json({
        page: update.page,
        title: update.title,
        summary: update.summary,
        bullets: update.bullets ?? [],
        tips: update.tips ?? [],
        updatedAt: update.updatedAt ? new Date(update.updatedAt).toISOString() : new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors,
        });
      }

      console.error("Error getting smart penny update:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.smartPennyPosts.listByPage.path, async (req, res) => {
    try {
      const parsed = z
        .object({
          page: smartPennyPageSchema,
          limit: z.coerce.number().min(1).max(200).optional(),
        })
        .parse(req.query);

      const posts = await storage.listSmartPennyPosts(parsed.page, parsed.limit ?? 50);
      return res.status(200).json(
        posts.map((post) => ({
          ...post,
          createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
        }))
      );
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors,
        });
      }

      console.error("Error listing smart penny posts:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.smartPennyPosts.create.path, async (req, res) => {
    try {
      if (!validateAdminRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payload = createSmartPennyPostSchema.parse(req.body);
      const post = await storage.createSmartPennyPost(payload);

      return res.status(201).json({
        ...post,
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors,
        });
      }

      console.error("Error creating smart penny post:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.smartPennyPosts.update.path, async (req, res) => {
    try {
      if (!validateAdminRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
      const payload = updateSmartPennyPostSchema.parse(req.body);
      const updated = await storage.updateSmartPennyPost(params.id, payload);

      if (!updated) {
        return res.status(404).json({ message: "Post not found" });
      }

      return res.status(200).json({
        ...updated,
        createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors,
        });
      }

      console.error("Error updating smart penny post:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.smartPennyPosts.delete.path, async (req, res) => {
    try {
      if (!validateAdminRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
      const removed = await storage.deleteSmartPennyPost(params.id);

      if (!removed) {
        return res.status(404).json({ message: "Post not found" });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors,
        });
      }

      console.error("Error deleting smart penny post:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.smartPennyUpdates.upsert.path, async (req, res) => {
    try {
      if (!validateAdminRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payload = upsertSmartPennyUpdateSchema.parse(req.body);
      await storage.upsertSmartPennyUpdate(payload);

      return res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors,
        });
      }

      console.error("Error upserting smart penny update:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.admin.leads.path, async (req, res) => {
    try {
      if (!validateAdminRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsed = z
        .object({
          limit: z.coerce.number().min(1).max(500).optional(),
        })
        .parse(req.query);

      const rows = await storage.listLeads(parsed.limit ?? 100);
      return res.status(200).json(
        rows.map((lead) => ({
          id: lead.id,
          fullName: lead.fullName,
          email: lead.email,
          loanPurpose: lead.loanPurpose,
          loanAmount: lead.loanAmount,
          creditScoreRange: lead.creditScoreRange,
          employmentStatus: lead.employmentStatus,
          zipCode: lead.zipCode,
          createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString() : new Date().toISOString(),
        }))
      );
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors,
        });
      }

      console.error("Error listing leads:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.admin.report.path, async (req, res) => {
    try {
      if (!validateAdminRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsed = z
        .object({ period: z.enum(["day", "week"]) })
        .parse({ period: req.query.period });

      const report = await storage.getLeadReport(parsed.period);
      return res.status(200).json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
          errors: err.errors,
        });
      }

      console.error("Error generating report:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
