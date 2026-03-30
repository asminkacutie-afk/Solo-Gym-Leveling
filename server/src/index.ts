import "dotenv/config";
import http from "http";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./config";
import prisma from "./lib/prisma";
import { errorHandler } from "./middleware/error";

// Route imports
import authRouter from "./routes/auth";
import workoutsRouter from "./routes/workouts";
import exercisesRouter from "./routes/exercises";
import profileRouter from "./routes/profile";
import bodyCompositionRouter from "./routes/body-composition";
import monstersRouter from "./routes/monsters";
import leaderboardRouter from "./routes/leaderboard";
import questsRouter from "./routes/quests";
import tournamentsRouter from "./routes/tournaments";

// WebSocket and cron
import { setupWebSocket } from "./websocket";
import { setupCronJobs } from "./cron";

const app = express();

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret"],
  })
);

app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TooManyRequests",
    message: "Too many requests, please try again later.",
    statusCode: 429,
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TooManyRequests",
    message: "Too many authentication attempts, please try again later.",
    statusCode: 429,
  },
});

app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
// Always returns HTTP 200 immediately so Railway's healthcheck never times out.
// DB connectivity is reported in the body but does NOT affect the status code.
app.get("/health", (_req: Request, res: Response): void => {
  prisma.$queryRaw`SELECT 1`
    .then(() => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        database: "connected",
      });
    })
    .catch(() => {
      // Still 200 — Railway only looks at the status code, not the body
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        database: "connecting",
      });
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/workouts", workoutsRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/profile", profileRouter);
app.use("/api/body-composition", bodyCompositionRouter);
app.use("/api/monsters", monstersRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/quests", questsRouter);
app.use("/api/tournaments", tournamentsRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    error: "NotFound",
    message: "The requested endpoint does not exist.",
    statusCode: 404,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(
  (err: Error, req: Request, res: Response, next: NextFunction): void => {
    errorHandler(err, req, res, next);
  }
);

// ─── HTTP + WebSocket Server ──────────────────────────────────────────────────
const server = http.createServer(app);
setupWebSocket(server);

// ─── Cron Jobs ────────────────────────────────────────────────────────────────
setupCronJobs(prisma);

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(config.PORT, "0.0.0.0", () => {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║           GymRPG Server Started            ║");
  console.log("╠════════════════════════════════════════════╣");
  console.log(`║  Port:        ${String(config.PORT).padEnd(29)}║`);
  console.log(`║  Environment: ${config.NODE_ENV.padEnd(29)}║`);
  console.log(`║  Client URL:  ${config.CLIENT_URL.padEnd(29)}║`);
  console.log("╚════════════════════════════════════════════╝");
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("[Server] Database disconnected. Goodbye.");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught exception:", err);
  void shutdown("uncaughtException");
});

export default app;
