import { Router, Request, Response, NextFunction } from "express";
import { query, param, validationResult } from "express-validator";
import { League } from "@prisma/client";
import { authenticate, optionalAuth } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/leaderboard/global — paginated global leaderboard
router.get(
  "/global",
  optionalAuth,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
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

    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const skip = (page - 1) * limit;

    try {
      const [entries, total] = await Promise.all([
        prisma.leaderboardEntry.findMany({
          where: { isPublic: true },
          orderBy: { totalPowerScore: "desc" },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                username: true,
                avatarUrl: true,
                gender: true,
                disciplines: {
                  orderBy: { level: "desc" },
                  take: 3,
                  select: {
                    discipline: true,
                    level: true,
                    rankBadge: true,
                  },
                },
              },
            },
          },
        }),
        prisma.leaderboardEntry.count({ where: { isPublic: true } }),
      ]);

      const authenticatedUserId = req.user?.userId;

      const enriched = entries.map((entry, idx) => {
        const rank = skip + idx + 1;
        return {
          rank,
          userId: entry.userId,
          username: entry.user.username,
          avatarUrl: entry.user.avatarUrl,
          league: entry.league,
          totalPowerScore: entry.totalPowerScore,
          rawPowerScore: entry.rawPowerScore,
          compositionMult: entry.compositionMult,
          totalLevel: entry.totalLevel,
          lastActive: entry.lastActive,
          weekRankDelta: entry.weekRankDelta,
          topDisciplines: entry.user.disciplines,
          isCurrentUser: entry.userId === authenticatedUserId,
        };
      });

      // If authenticated, find user's own entry even if not in current page
      let currentUserEntry = null;
      if (authenticatedUserId) {
        const userInPage = enriched.find((e) => e.isCurrentUser);
        if (!userInPage) {
          const userEntry = await prisma.leaderboardEntry.findUnique({
            where: { userId: authenticatedUserId },
            include: {
              user: {
                select: {
                  username: true,
                  avatarUrl: true,
                  disciplines: {
                    orderBy: { level: "desc" },
                    take: 3,
                    select: {
                      discipline: true,
                      level: true,
                      rankBadge: true,
                    },
                  },
                },
              },
            },
          });

          if (userEntry) {
            const userRank = await prisma.leaderboardEntry.count({
              where: {
                isPublic: true,
                totalPowerScore: { gt: userEntry.totalPowerScore },
              },
            });
            currentUserEntry = {
              rank: userRank + 1,
              userId: userEntry.userId,
              username: userEntry.user.username,
              avatarUrl: userEntry.user.avatarUrl,
              league: userEntry.league,
              totalPowerScore: userEntry.totalPowerScore,
              rawPowerScore: userEntry.rawPowerScore,
              compositionMult: userEntry.compositionMult,
              totalLevel: userEntry.totalLevel,
              lastActive: userEntry.lastActive,
              weekRankDelta: userEntry.weekRankDelta,
              topDisciplines: userEntry.user.disciplines,
              isCurrentUser: true,
            };
          }
        }
      }

      res.json({
        entries: enriched,
        currentUserEntry,
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

// GET /api/leaderboard/league/:league — leaderboard filtered by league
router.get(
  "/league/:league",
  optionalAuth,
  [
    param("league").isIn(Object.values(League)).withMessage("Invalid league"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
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

    const league = req.params.league as League;
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const skip = (page - 1) * limit;

    try {
      const [entries, total] = await Promise.all([
        prisma.leaderboardEntry.findMany({
          where: { isPublic: true, league },
          orderBy: { totalPowerScore: "desc" },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                username: true,
                avatarUrl: true,
                disciplines: {
                  orderBy: { level: "desc" },
                  take: 3,
                  select: {
                    discipline: true,
                    level: true,
                    rankBadge: true,
                  },
                },
              },
            },
          },
        }),
        prisma.leaderboardEntry.count({ where: { isPublic: true, league } }),
      ]);

      const enriched = entries.map((entry, idx) => ({
        rank: skip + idx + 1,
        userId: entry.userId,
        username: entry.user.username,
        avatarUrl: entry.user.avatarUrl,
        league: entry.league,
        totalPowerScore: entry.totalPowerScore,
        totalLevel: entry.totalLevel,
        lastActive: entry.lastActive,
        weekRankDelta: entry.weekRankDelta,
        topDisciplines: entry.user.disciplines,
        isCurrentUser: entry.userId === req.user?.userId,
      }));

      res.json({
        entries: enriched,
        league,
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

// GET /api/leaderboard/monsters — monster board sorted by combined stat total
router.get(
  "/monsters",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const skip = (page - 1) * limit;

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const monsters = await prisma.monster.findMany({
        where: { month, year, isActive: true },
        include: {
          _count: { select: { kills: true } },
        },
      });

      // Sort by combined stat total
      const sorted = monsters
        .map((m) => ({
          id: m.id,
          name: m.name,
          tier: m.tier,
          league: m.league,
          powerStat: m.powerStat,
          titanStat: m.titanStat,
          precisionStat: m.precisionStat,
          enduranceStat: m.enduranceStat,
          vitalityStat: m.vitalityStat,
          synthesisStat: m.synthesisStat,
          combinedStatTotal:
            m.powerStat +
            m.titanStat +
            m.precisionStat +
            m.vitalityStat +
            m.synthesisStat +
            m.enduranceStat / 100, // normalize endurance for comparison
          timesDefeated: m.timesDefeated,
          totalEncounters: m.totalEncounters,
          defeatRate:
            m.totalEncounters > 0
              ? Math.round((m.timesDefeated / m.totalEncounters) * 1000) / 10
              : null,
          defeatedByCount: m._count.kills,
          difficultyMult: m.difficultyMult,
        }))
        .sort((a, b) => b.combinedStatTotal - a.combinedStatTotal);

      const paged = sorted.slice(skip, skip + limit);

      res.json({
        monsters: paged.map((m, idx) => ({ rank: skip + idx + 1, ...m })),
        pagination: {
          page,
          limit,
          total: sorted.length,
          totalPages: Math.ceil(sorted.length / limit),
        },
        month,
        year,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/leaderboard/tournament-history — last 6 months of tournament results
router.get(
  "/tournament-history",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      const tournaments = await prisma.tournament.findMany({
        where: {
          isComplete: true,
          startedAt: { gte: sixMonthsAgo },
        },
        include: {
          results: {
            where: { rankInLeague: { lte: 10 } },
            include: {
              user: {
                select: { username: true, avatarUrl: true },
              },
            },
            orderBy: { rankInLeague: "asc" },
            take: 10,
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });

      res.json({ tournaments });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
