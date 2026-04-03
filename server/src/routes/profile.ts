import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import prisma from "../lib/prisma";
import { createError } from "../middleware/error";

const router = Router();

// GET /api/profile/me — full authenticated profile
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: {
          disciplines: {
            orderBy: { discipline: "asc" },
          },
          leaderboardEntry: true,
          streakData: true,
          achievements: {
            include: {
              achievement: {
                select: {
                  key: true,
                  name: true,
                  description: true,
                  icon: true,
                  xpReward: true,
                },
              },
            },
            orderBy: { earnedAt: "desc" },
          },
          monsterKills: {
            include: {
              monster: {
                select: {
                  id: true,
                  name: true,
                  tier: true,
                  league: true,
                  month: true,
                  year: true,
                },
              },
            },
            orderBy: { killedAt: "desc" },
            take: 20,
          },
          bodyComps: {
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: {
              weight: true,
              bodyFat: true,
              lbm: true,
              method: true,
              recordedAt: true,
            },
          },
        },
      });

      if (!user) {
        next(createError("User not found.", 404, "NotFound"));
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
        achievements: user.achievements,
        recentMonsterKills: user.monsterKills,
        latestBodyComp: user.bodyComps[0] ?? null,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/profile/:username — public profile
router.get(
  "/:username",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { username: req.params.username },
        include: {
          disciplines: {
            orderBy: { discipline: "asc" },
          },
          leaderboardEntry: true,
          streakData: true,
          achievements: {
            include: {
              achievement: {
                select: {
                  key: true,
                  name: true,
                  description: true,
                  icon: true,
                },
              },
            },
            orderBy: { earnedAt: "desc" },
          },
          monsterKills: {
            include: {
              monster: {
                select: {
                  id: true,
                  name: true,
                  tier: true,
                  league: true,
                  month: true,
                  year: true,
                },
              },
            },
            orderBy: { killedAt: "desc" },
            take: 10,
          },
        },
      });

      if (!user) {
        next(createError("User not found.", 404, "NotFound"));
        return;
      }

      if (!user.isPublic) {
        res.status(403).json({
          error: "ProfilePrivate",
          message: "This profile is private.",
          statusCode: 403,
        });
        return;
      }

      res.json({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        disciplines: user.disciplines,
        leaderboardEntry: user.leaderboardEntry,
        streakData: user.streakData,
        achievements: user.achievements,
        recentMonsterKills: user.monsterKills,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/profile/me — update profile
router.put(
  "/me",
  authenticate,
  [
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/),
    body("avatarUrl").optional().isURL(),
    body("isPublic").optional().isBoolean(),
    body("unitsPreference").optional().isIn(["kg", "lbs"]),
    body("gender").optional().isIn(["male", "female", "other"]),
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

    const { username, avatarUrl, isPublic, unitsPreference, gender } =
      req.body as {
        username?: string;
        avatarUrl?: string;
        isPublic?: boolean;
        unitsPreference?: string;
        gender?: string;
      };

    try {
      const updated = await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          ...(username !== undefined ? { username } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          ...(isPublic !== undefined ? { isPublic } : {}),
          ...(unitsPreference !== undefined ? { unitsPreference } : {}),
          ...(gender !== undefined ? { gender } : {}),
        },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          isPublic: true,
          unitsPreference: true,
          gender: true,
        },
      });

      // Sync public flag to leaderboard
      if (isPublic !== undefined) {
        await prisma.leaderboardEntry.updateMany({
          where: { userId: req.user!.userId },
          data: { isPublic },
        });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/profile/me/records — personal records
router.get(
  "/me/records",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const records = await prisma.personalRecord.findMany({
        where: { userId },
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
        orderBy: { recordedAt: "desc" },
      });

      // For each record, get rank among all users
      const enriched = await Promise.all(
        records.map(async (record) => {
          const rank =
            record.oneRepMax !== null
              ? await prisma.personalRecord.count({
                  where: {
                    exerciseId: record.exerciseId,
                    oneRepMax: { gt: record.oneRepMax },
                  },
                }).then((count) => count + 1)
              : null;

          const totalUsersForExercise = await prisma.personalRecord.count({
            where: { exerciseId: record.exerciseId },
          });

          return {
            ...record,
            rank,
            totalUsersForExercise,
          };
        })
      );

      res.json({ records: enriched });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/profile/me/volume-history — 12 weeks of volume per discipline
router.get(
  "/me/volume-history",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000);

    try {
      const sets = await prisma.workoutSet.findMany({
        where: {
          session: {
            userId,
            endedAt: { gte: twelveWeeksAgo },
          },
          weight: { not: null },
          reps: { not: null },
        },
        include: {
          exercise: { select: { discipline: true } },
          session: { select: { endedAt: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by week and discipline
      const weeklyData: Record<
        string,
        Record<string, number>
      > = {};

      for (const set of sets) {
        if (!set.session.endedAt) continue;
        const weekStart = getWeekStart(set.session.endedAt);
        const weekKey = weekStart.toISOString().split("T")[0];
        const discipline = set.exercise.discipline;
        const volume = (set.weight ?? 0) * (set.reps ?? 0);

        if (!weeklyData[weekKey]) weeklyData[weekKey] = {};
        weeklyData[weekKey][discipline] =
          (weeklyData[weekKey][discipline] ?? 0) + volume;
      }

      // Sort weeks and return array
      const weeks = Object.keys(weeklyData)
        .sort()
        .map((week) => ({
          weekStart: week,
          disciplines: weeklyData[week],
        }));

      res.json({ weeks });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/profile/me/monster-kills — all monster kills
router.get(
  "/me/monster-kills",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const kills = await prisma.userMonsterKill.findMany({
        where: { userId: req.user!.userId },
        include: {
          monster: {
            select: {
              id: true,
              name: true,
              tier: true,
              league: true,
              powerStat: true,
              titanStat: true,
              precisionStat: true,
              enduranceStat: true,
              vitalityStat: true,
              synthesisStat: true,
              month: true,
              year: true,
            },
          },
        },
        orderBy: { killedAt: "desc" },
      });

      res.json({ kills, total: kills.length });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/profile/me/data-export — CSV export
router.post(
  "/me/data-export",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const sessions = await prisma.workoutSession.findMany({
        where: { userId },
        include: {
          sets: {
            include: {
              exercise: {
                select: { name: true, discipline: true, category: true },
              },
            },
          },
        },
        orderBy: { startedAt: "asc" },
      });

      const rows: string[] = [
        "session_id,session_date,session_end,exercise,discipline,category,set_number,weight,reps,duration,distance,rpe,is_pr",
      ];

      for (const session of sessions) {
        for (const set of session.sets) {
          rows.push(
            [
              session.id,
              session.startedAt.toISOString(),
              session.endedAt?.toISOString() ?? "",
              `"${set.exercise.name.replace(/"/g, '""')}"`,
              set.exercise.discipline,
              set.exercise.category,
              set.setNumber,
              set.weight ?? "",
              set.reps ?? "",
              set.duration ?? "",
              set.distance ?? "",
              set.rpe ?? "",
              set.isPR ? "true" : "false",
            ].join(",")
          );
        }
      }

      const csv = rows.join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="gymrpg-export-${userId}.csv"`
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default router;
