
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

      // Determine redirect URL based on credit score
      let redirectUrl = "";
      switch (leadData.creditScoreRange) {
        case "Below 580":
          redirectUrl = "https://subprime-affiliate-link.com";
          break;
        case "580-649":
          redirectUrl = "https://midprime-affiliate-link.com";
          break;
        case "650-719":
        case "720+":
          redirectUrl = "https://prime-affiliate-link.com";
          break;
        default:
          redirectUrl = "/"; // Fallback
      }

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
