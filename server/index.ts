import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { db } from "./db";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}

const app = express();
const httpServer = createServer(app);

app.disable("x-powered-by");

// If you're behind Render/Proxy, trust proxy so rate-limit uses real IP
app.set("trust proxy", 1);

// Basic security headers
app.use(helmet());

// Block common secret-probing paths (they should NEVER exist)
const blocked = [
  "/api/.env",
  "/api/env",
  "/api/actuator/env",
  "/api/config",
  "/api/settings",
  "/api/keys",
  "/api/v1/config",
  "/api/stripe/config",
  "/api/payment/config",
  "/api/v1/namespaces/default/secrets",
];

app.use((req, res, next) => {
  if (blocked.includes(req.path)) return res.status(404).send("Not found");
  next();
});

// Rate limit ALL /api calls
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200, // 200 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// Extra tight limit for lead submissions (prevents spam)
const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 20, // 20 submits per IP per 10 min
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/api", submitLimiter);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const key = String(req.query.key ?? "");
  if (!process.env.ADMIN_KEY) return res.status(500).send("ADMIN_KEY not set");
  if (key !== process.env.ADMIN_KEY) return res.status(401).send("Unauthorized");
  next();
}

app.get("/admin/leads", requireAdminKey, async (req: Request, res: Response) => {
  if (!db) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const result: any = await db.execute(
      `select * from leads order by created_at desc limit 100`
    );
    const rows = result?.rows ?? result;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get(
  "/admin/leads.csv",
  requireAdminKey,
  async (req: Request, res: Response) => {
    if (!db) {
      return res.status(503).json({ error: "Database not configured" });
    }

    try {
      const result: any = await db.execute(
        `select * from leads order by created_at desc limit 100`
      );
      const rows: any[] = result?.rows ?? result ?? [];

      const headers = rows.length
        ? Object.keys(rows[0])
        : [
            "id",
            "loan_amount",
            "loan_purpose",
            "credit_score_range",
            "employment_status",
            "full_name",
            "zip_code",
            "email",
            "phone",
            "ip_address",
            "created_at",
          ];

      const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
      res.send(csv);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  }
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
