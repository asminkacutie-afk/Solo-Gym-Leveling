import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Discipline } from "@prisma/client";
import { config } from "../config";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

function generateAccessToken(payload: {
  userId: string;
  email: string;
  username: string;
}): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, username: payload.username },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function generateRefreshToken(payload: {
  userId: string;
  email: string;
  username: string;
}): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, username: payload.username },
    config.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
}

// POST /api/auth/register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("username")
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username must be 3-30 characters, alphanumeric or underscore"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: "ValidationError",
        message: errors.array()[0].msg,
        statusCode: 400,
      });
      return;
    }

    const { email, username, password } = req.body as {
      email: string;
      username: string;
      password: string;
    };

    try {
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          disciplines: {
            create: Object.values(Discipline).map((discipline) => ({
              discipline,
              level: 1,
              xp: 0,
              xpToNext: 100,
            })),
          },
          leaderboardEntry: {
            create: {
              totalPowerScore: 0,
              league: "IRON",
              totalLevel: 6,
              isPublic: false,
            },
          },
          streakData: {
            create: {
              currentWeekSessions: 0,
              weeklyStreak: 0,
            },
          },
        },
        include: {
          disciplines: true,
          leaderboardEntry: true,
        },
      });

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          isPublic: user.isPublic,
          unitsPreference: user.unitsPreference,
          gender: user.gender,
          createdAt: user.createdAt,
          disciplines: user.disciplines,
          leaderboardEntry: user.leaderboardEntry,
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: "ValidationError",
        message: errors.array()[0].msg,
        statusCode: 400,
      });
      return;
    }

    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          disciplines: true,
          leaderboardEntry: true,
        },
      });

      if (!user || !user.passwordHash) {
        res.status(401).json({
          error: "InvalidCredentials",
          message: "Invalid email or password.",
          statusCode: 401,
        });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({
          error: "InvalidCredentials",
          message: "Invalid email or password.",
          statusCode: 401,
        });
        return;
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          isPublic: user.isPublic,
          unitsPreference: user.unitsPreference,
          gender: user.gender,
          createdAt: user.createdAt,
          disciplines: user.disciplines,
          leaderboardEntry: user.leaderboardEntry,
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh
router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({
        error: "MissingToken",
        message: "Refresh token is required.",
        statusCode: 400,
      });
      return;
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        config.JWT_REFRESH_SECRET
      ) as { userId: string; email: string; username: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, username: true },
      });

      if (!user) {
        res.status(401).json({
          error: "UserNotFound",
          message: "User no longer exists.",
          statusCode: 401,
        });
        return;
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      res.json({ accessToken });
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: "InvalidRefreshToken",
          message: "Refresh token is invalid or expired.",
          statusCode: 401,
        });
        return;
      }
      next(err);
    }
  }
);

// GET /api/auth/me
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: {
          disciplines: true,
          leaderboardEntry: true,
          streakData: true,
        },
      });

      if (!user) {
        next(createError("User not found.", 404, "UserNotFound"));
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        isPublic: user.isPublic,
        unitsPreference: user.unitsPreference,
        gender: user.gender,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        disciplines: user.disciplines,
        leaderboardEntry: user.leaderboardEntry,
        streakData: user.streakData,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post("/logout", authenticate, (_req: Request, res: Response): void => {
  // Stateless JWT — just acknowledge logout
  res.json({ success: true, message: "Logged out successfully." });
});

export default router;
