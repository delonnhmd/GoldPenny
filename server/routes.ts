
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes"; // Only import api
import { z } from "zod";
import { insertLeadSchema } from "@shared/schema"; // Import schema directly

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

  return httpServer;
}
