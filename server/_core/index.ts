import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupWebSocket } from "../websocket";
import { handleStripeWebhook } from "../stripe-webhook";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook MUST be registered BEFORE json body parser for signature verification
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Scheduled endpoints (Heartbeat cron callbacks)
  app.post('/api/scheduled/weekly-revenue-report', async (req, res) => {
    try {
      const taskUid = req.headers['x-manus-cron-task-uid'] as string;
      if (!taskUid) return res.status(403).json({ error: 'cron-only' });
      const { generateWeeklyRevenueReport } = await import('../revenue-engine');
      await generateWeeklyRevenueReport();
      res.json({ ok: true, taskUid });
    } catch (err: any) {
      console.error('[Cron] weekly-revenue-report error:', err.message);
      res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
    }
  });

  app.post('/api/scheduled/daily-email-sequences', async (req, res) => {
    try {
      const taskUid = req.headers['x-manus-cron-task-uid'] as string;
      if (!taskUid) return res.status(403).json({ error: 'cron-only' });
      const { runDailyEmailSequences } = await import('../revenue-engine');
      const result = await runDailyEmailSequences();
      res.json({ ok: true, ...result, taskUid });
    } catch (err: any) {
      console.error('[Cron] daily-email-sequences error:', err.message);
      res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
    }
  });

  // WebSocket setup for real-time forum chat
  setupWebSocket(server);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server, port);
  } else {
    serveStatic(app);
  }

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
