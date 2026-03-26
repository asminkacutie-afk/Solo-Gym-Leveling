import { Router, Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { PrismaClient, Discipline } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { createError } from "../middleware/error";
import {
  calculateXPForSet,
  applyXPGain,
  epleyOneRepMax,
  XP_PR_BONUS,
} from "../services/xp.service";
import { updateLeaderboard } from "../services/stats.service";
import { calculateDisciplineStats } from "../services/xp.service";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// POST /api/workouts/sessions
router.post(
  "/sessions",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await prisma.workoutSession.create({
        data: {
          userId: req.user!.userId,
          notes: (req.body as { notes?: string }).notes ?? null,
        },
      });
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/workouts/sessions
router.get(
  "/sessions",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "20", 10);
    const skip = (page - 1) * limit;

    try {
      const [sessions, total] = await Promise.all([
        prisma.workoutSession.findMany({
          where: { userId: req.user!.userId },
          orderBy: { startedAt: "desc" },
          skip,
          take: limit,
          include: {
            _count: { select: { sets: true } },
          },
        }),
        prisma.workoutSession.count({
          where: { userId: req.user!.userId },
        }),
      ]);

      res.json({
        sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/workouts/sessions/:id
router.get(
  "/sessions/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await prisma.workoutSession.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
        },
        include: {
          sets: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  discipline: true,
                  category: true,
                  muscleGroups: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!session) {
        next(createError("Session not found.", 404, "NotFound"));
        return;
      }

      res.json(session);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/workouts/sessions/:id/end
router.put(
  "/sessions/:id/end",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    const sessionId = req.params.id;

    try {
      const session = await prisma.workoutSession.findFirst({
        where: { id: sessionId, userId },
        include: {
          sets: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  discipline: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        next(createError("Session not found.", 404, "NotFound"));
        return;
      }

      if (session.endedAt) {
        res.status(400).json({
          error: "SessionAlreadyEnded",
          message: "Session has already been ended.",
          statusCode: 400,
        });
        return;
      }

      // Check for rested bonus (no session in last 48 hours)
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const recentSession = await prisma.workoutSession.findFirst({
        where: {
          userId,
          endedAt: { gte: fortyEightHoursAgo },
          id: { not: sessionId },
        },
      });
      const restedBonus = !recentSession;

      // Group sets by discipline and calculate XP
      const xpByDiscipline: Record<string, number> = {};
      const prsFound: Array<{
        exerciseId: string;
        exerciseName: string;
        weight: number;
        reps: number;
        oneRepMax: number;
      }> = [];

      for (const set of session.sets) {
        const discipline = set.exercise.discipline;
        const weight = set.weight ?? 0;
        const reps = set.reps ?? 0;
        const rpe = set.rpe ?? 7;

        let xp = calculateXPForSet(weight, reps, rpe);
        if (set.isPR) xp += XP_PR_BONUS;
        if (restedBonus) xp *= 2;

        if (!xpByDiscipline[discipline]) xpByDiscipline[discipline] = 0;
        xpByDiscipline[discipline] += Math.round(xp);
      }

      // Apply XP gains and detect level ups
      const levelUps: Array<{
        discipline: string;
        oldLevel: number;
        newLevel: number;
      }> = [];

      for (const [discipline, xpAmount] of Object.entries(xpByDiscipline)) {
        const result = await applyXPGain(
          userId,
          discipline as Discipline,
          xpAmount,
          prisma
        );

        // Update discipline stats
        const stats = await calculateDisciplineStats(
          userId,
          discipline as Discipline,
          prisma
        );
        await prisma.userDiscipline.update({
          where: { userId_discipline: { userId, discipline: discipline as Discipline } },
          data: {
            str: stats.str,
            end: stats.end,
            pwr: stats.pwr,
            spd: stats.spd,
            rec: stats.rec,
          },
        });

        if (result.leveled) {
          levelUps.push({
            discipline,
            oldLevel: result.oldLevel,
            newLevel: result.newLevel,
          });
        }
      }

      // Update leaderboard
      await updateLeaderboard(userId, prisma);

      // Update streak
      const streak = await prisma.userStreak.findUnique({ where: { userId } });
      if (streak) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastSessionDate = streak.lastSessionDate;
        const isToday =
          lastSessionDate !== null &&
          new Date(lastSessionDate).setHours(0, 0, 0, 0) ===
            today.getTime();

        await prisma.userStreak.update({
          where: { userId },
          data: {
            lastSessionDate: new Date(),
            currentWeekSessions: isToday
              ? streak.currentWeekSessions
              : streak.currentWeekSessions + 1,
            restedBonusActive: restedBonus,
          },
        });
      }

      // End the session
      const endedSession = await prisma.workoutSession.update({
        where: { id: sessionId },
        data: {
          endedAt: new Date(),
          xpGained: xpByDiscipline as object,
          levelUps: levelUps as object,
        },
      });

      const totalXP = Object.values(xpByDiscipline).reduce(
        (a, b) => a + b,
        0
      );

      res.json({
        xpGained: xpByDiscipline,
        totalXPGained: totalXP,
        levelUps,
        prs: prsFound,
        restedBonus,
        sessionSummary: {
          sessionId: endedSession.id,
          setsCompleted: session.sets.length,
          duration:
            endedSession.endedAt && session.startedAt
              ? Math.round(
                  (endedSession.endedAt.getTime() -
                    session.startedAt.getTime()) /
                    60000
                )
              : 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/workouts/sessions/:id/sets
router.post(
  "/sessions/:id/sets",
  [
    body("exerciseId").notEmpty().withMessage("exerciseId is required"),
    body("setNumber").isInt({ min: 1 }).withMessage("setNumber must be a positive integer"),
    body("weight").optional().isFloat({ min: 0 }),
    body("reps").optional().isInt({ min: 0 }),
    body("duration").optional().isInt({ min: 0 }),
    body("distance").optional().isFloat({ min: 0 }),
    body("rpe").optional().isFloat({ min: 1, max: 10 }),
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

    const userId = req.user!.userId;
    const sessionId = req.params.id;

    try {
      const session = await prisma.workoutSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        next(createError("Session not found.", 404, "NotFound"));
        return;
      }

      if (session.endedAt) {
        res.status(400).json({
          error: "SessionEnded",
          message: "Cannot add sets to an ended session.",
          statusCode: 400,
        });
        return;
      }

      const { exerciseId, setNumber, weight, reps, duration, distance, rpe } =
        req.body as {
          exerciseId: string;
          setNumber: number;
          weight?: number;
          reps?: number;
          duration?: number;
          distance?: number;
          rpe?: number;
        };

      // Check for personal record
      let isPR = false;
      let previousRecord: {
        weight: number | null;
        reps: number | null;
        oneRepMax: number | null;
      } | null = null;

      const existingPR = await prisma.personalRecord.findUnique({
        where: { userId_exerciseId: { userId, exerciseId } },
      });

      const newOneRepMax =
        weight && reps ? epleyOneRepMax(weight, reps) : null;

      if (weight && reps) {
        if (!existingPR || (existingPR.oneRepMax !== null && newOneRepMax !== null && newOneRepMax > existingPR.oneRepMax)) {
          isPR = true;
          previousRecord = existingPR
            ? {
                weight: existingPR.weight,
                reps: existingPR.reps,
                oneRepMax: existingPR.oneRepMax,
              }
            : null;

          await prisma.personalRecord.upsert({
            where: { userId_exerciseId: { userId, exerciseId } },
            update: {
              weight: weight ?? null,
              reps: reps ?? null,
              oneRepMax: newOneRepMax,
              recordedAt: new Date(),
            },
            create: {
              userId,
              exerciseId,
              weight: weight ?? null,
              reps: reps ?? null,
              oneRepMax: newOneRepMax,
            },
          });
        }
      }

      const set = await prisma.workoutSet.create({
        data: {
          sessionId,
          exerciseId,
          setNumber,
          weight: weight ?? null,
          reps: reps ?? null,
          duration: duration ?? null,
          distance: distance ?? null,
          rpe: rpe ?? null,
          isPR,
        },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              discipline: true,
              category: true,
            },
          },
        },
      });

      res.status(201).json({
        set,
        isPR,
        previousRecord,
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/workouts/sessions/:id/sets/:setId
router.delete(
  "/sessions/:id/sets/:setId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    const { id: sessionId, setId } = req.params;

    try {
      const session = await prisma.workoutSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        next(createError("Session not found.", 404, "NotFound"));
        return;
      }

      if (session.endedAt) {
        res.status(400).json({
          error: "SessionEnded",
          message: "Cannot remove sets from an ended session.",
          statusCode: 400,
        });
        return;
      }

      const workoutSet = await prisma.workoutSet.findFirst({
        where: { id: setId, sessionId },
      });

      if (!workoutSet) {
        next(createError("Set not found.", 404, "NotFound"));
        return;
      }

      await prisma.workoutSet.delete({ where: { id: setId } });
      res.json({ success: true, deletedSetId: setId });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/workouts/sessions/:id/summary
router.get(
  "/sessions/:id/summary",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    const sessionId = req.params.id;

    try {
      const session = await prisma.workoutSession.findFirst({
        where: { id: sessionId, userId },
        include: {
          sets: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  discipline: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        next(createError("Session not found.", 404, "NotFound"));
        return;
      }

      // Volume per discipline
      const disciplineVolume: Record<string, number> = {};
      const disciplineSets: Record<string, number> = {};
      let totalVolume = 0;
      let prsInSession = 0;

      for (const set of session.sets) {
        const discipline = set.exercise.discipline;
        const volume = (set.weight ?? 0) * (set.reps ?? 0);
        disciplineVolume[discipline] =
          (disciplineVolume[discipline] ?? 0) + volume;
        disciplineSets[discipline] = (disciplineSets[discipline] ?? 0) + 1;
        totalVolume += volume;
        if (set.isPR) prsInSession++;
      }

      const duration =
        session.endedAt && session.startedAt
          ? Math.round(
              (session.endedAt.getTime() - session.startedAt.getTime()) / 60000
            )
          : null;

      res.json({
        sessionId: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration,
        totalSets: session.sets.length,
        totalVolume: Math.round(totalVolume),
        prsSet: prsInSession,
        xpGained: session.xpGained,
        levelUps: session.levelUps,
        disciplineBreakdown: Object.keys(disciplineVolume).map((d) => ({
          discipline: d,
          sets: disciplineSets[d],
          volume: Math.round(disciplineVolume[d]),
        })),
        notes: session.notes,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
