import { Router, Request, Response, NextFunction } from "express";
import { param, query, validationResult } from "express-validator";
import { PrismaClient, League } from "@prisma/client";
import { authenticate, optionalAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();
const prisma = new PrismaClient();

// GET /api/tournaments/current — current month's tournament status per league
router.get(
  "/current",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const tournaments = await prisma.tournament.findMany({
        where: { month, year },
        include: {
          _count: { select: { results: true } },
          results: {
            where: { rankInLeague: { lte: 3 } },
            include: {
              user: {
                select: { username: true, avatarUrl: true },
              },
            },
            orderBy: { rankInLeague: "asc" },
            take: 3,
          },
        },
        orderBy: { league: "asc" },
      });

      // Create placeholder tournament status for leagues not yet started
      const leagueStatus = Object.values(League).map((league) => {
        const existing = tournaments.find((t) => t.league === league);

        if (existing) {
          return {
            league,
            tournament: existing,
            top3: existing.results,
            participantCount: existing._count.results,
            isComplete: existing.isComplete,
            startedAt: existing.startedAt,
            endedAt: existing.endedAt,
          };
        }

        // Calculate tournament end date (last day of month)
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        return {
          league,
          tournament: null,
          top3: [],
          participantCount: 0,
          isComplete: false,
          startedAt: new Date(year, month - 1, 1),
          endedAt: endOfMonth,
        };
      });

      res.json({
        month,
        year,
        leagueStatus,
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (new Date(year, month, 0).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/tournaments/history — last 6 months, filterable by league
router.get(
  "/history",
  optionalAuth,
  [
    query("league")
      .optional()
      .isIn(Object.values(League))
      .withMessage("Invalid league"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
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

    const leagueFilter = req.query.league as League | undefined;
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "20", 10);
    const skip = (page - 1) * limit;

    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      const [tournaments, total] = await Promise.all([
        prisma.tournament.findMany({
          where: {
            isComplete: true,
            startedAt: { gte: sixMonthsAgo },
            ...(leagueFilter ? { league: leagueFilter } : {}),
          },
          include: {
            results: {
              where: { rankInLeague: { lte: 3 } },
              include: {
                user: {
                  select: { username: true, avatarUrl: true },
                },
              },
              orderBy: { rankInLeague: "asc" },
            },
            _count: { select: { results: true } },
          },
          orderBy: [{ year: "desc" }, { month: "desc" }, { league: "asc" }],
          skip,
          take: limit,
        }),
        prisma.tournament.count({
          where: {
            isComplete: true,
            startedAt: { gte: sixMonthsAgo },
            ...(leagueFilter ? { league: leagueFilter } : {}),
          },
        }),
      ]);

      res.json({
        tournaments: tournaments.map((t) => ({
          id: t.id,
          month: t.month,
          year: t.year,
          league: t.league,
          startedAt: t.startedAt,
          endedAt: t.endedAt,
          participantCount: t._count.results,
          top3: t.results,
        })),
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

// GET /api/tournaments/leaderboard/:tournamentId — rankings for a specific tournament
router.get(
  "/leaderboard/:tournamentId",
  optionalAuth,
  [param("tournamentId").notEmpty()],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const skip = (page - 1) * limit;

    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id: req.params.tournamentId },
      });

      if (!tournament) {
        next(createError("Tournament not found.", 404, "NotFound"));
        return;
      }

      const [results, total] = await Promise.all([
        prisma.tournamentResult.findMany({
          where: { tournamentId: req.params.tournamentId },
          include: {
            user: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { rankInLeague: "asc" },
          skip,
          take: limit,
        }),
        prisma.tournamentResult.count({
          where: { tournamentId: req.params.tournamentId },
        }),
      ]);

      const authenticatedUserId = req.user?.userId;

      res.json({
        tournament: {
          id: tournament.id,
          month: tournament.month,
          year: tournament.year,
          league: tournament.league,
          isComplete: tournament.isComplete,
          startedAt: tournament.startedAt,
          endedAt: tournament.endedAt,
        },
        results: results.map((r) => ({
          rank: r.rankInLeague,
          userId: r.userId,
          username: r.user.username,
          avatarUrl: r.user.avatarUrl,
          powerScoreAtTime: r.powerScoreAtTime,
          monstersDefeated: r.monstersDefeated,
          bossDefeated: r.bossDefeated,
          wasPromoted: r.wasPromoted,
          wasRelegated: r.wasRelegated,
          slayerBadge: r.slayerBadge,
          previousLeague: r.previousLeague,
          newLeague: r.newLeague,
          isCurrentUser: r.userId === authenticatedUserId,
        })),
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

// POST /api/tournaments/run — admin-only manual trigger
router.post(
  "/run",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Simple admin check: only allow a hardcoded admin user or check role
    // For testing: accept an admin secret header
    const adminSecret = req.headers["x-admin-secret"];
    const expectedSecret = process.env.ADMIN_SECRET ?? "gymrpg-admin-secret";

    if (adminSecret !== expectedSecret) {
      res.status(403).json({
        error: "Forbidden",
        message: "Admin access required.",
        statusCode: 403,
      });
      return;
    }

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const targetLeague = (req.body as { league?: string }).league as League | undefined;

      const leagues = targetLeague
        ? [targetLeague]
        : Object.values(League);

      const results: Array<{
        league: League;
        tournamentId: string;
        participantsProcessed: number;
        promotions: number;
        relegations: number;
      }> = [];

      for (const league of leagues) {
        // Get or create tournament
        const tournament = await prisma.tournament.upsert({
          where: { month_year_league: { month, year, league } },
          update: { isComplete: true, endedAt: new Date() },
          create: {
            month,
            year,
            league,
            startedAt: new Date(year, month - 1, 1),
            endedAt: new Date(),
            isComplete: true,
          },
        });

        // Get all leaderboard entries for this league
        const entries = await prisma.leaderboardEntry.findMany({
          where: { league },
          orderBy: { totalPowerScore: "desc" },
        });

        // Get monster kill counts
        const monsterKillCounts = await prisma.userMonsterKill.groupBy({
          by: ["userId"],
          where: { monster: { month, year, league } },
          _count: { monsterId: true },
        });
        const killCountMap = new Map(
          monsterKillCounts.map((k) => [k.userId, k._count.monsterId])
        );

        let promotions = 0;
        let relegations = 0;
        const topPercent = Math.ceil(entries.length * 0.2);
        const bottomPercent = Math.ceil(entries.length * 0.2);

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const rank = i + 1;
          const monstersKilled = killCountMap.get(entry.userId) ?? 0;

          // Promotion: top 20% of league (except MYTHIC)
          const promoted =
            rank <= topPercent && league !== League.MYTHIC;
          // Relegation: bottom 20% of league (except IRON)
          const relegated =
            rank > entries.length - bottomPercent && league !== League.IRON;

          const leagueValues = Object.values(League);
          const leagueIdx = leagueValues.indexOf(league);

          const newLeague = promoted
            ? (leagueValues[leagueIdx + 1] as League) ?? league
            : relegated
            ? (leagueValues[leagueIdx - 1] as League) ?? league
            : league;

          if (promoted) promotions++;
          if (relegated) relegations++;

          // Slayer badge: most monsters killed
          const maxKills = Math.max(...Array.from(killCountMap.values()), 0);
          const slayerBadge = monstersKilled > 0 && monstersKilled === maxKills;

          await prisma.tournamentResult.upsert({
            where: {
              id: `${tournament.id}_${entry.userId}`,
            },
            update: {
              rankInLeague: rank,
              monstersDefeated: monstersKilled,
              wasPromoted: promoted,
              wasRelegated: relegated,
              newLeague,
              slayerBadge,
            },
            create: {
              id: `${tournament.id}_${entry.userId}`,
              tournamentId: tournament.id,
              userId: entry.userId,
              powerScoreAtTime: entry.totalPowerScore,
              rankInLeague: rank,
              monstersDefeated: monstersKilled,
              previousLeague: league,
              newLeague,
              wasPromoted: promoted,
              wasRelegated: relegated,
              slayerBadge,
            },
          });

          // Update user's league
          if (promoted || relegated) {
            await prisma.leaderboardEntry.update({
              where: { userId: entry.userId },
              data: { league: newLeague },
            });
          }
        }

        results.push({
          league,
          tournamentId: tournament.id,
          participantsProcessed: entries.length,
          promotions,
          relegations,
        });
      }

      res.json({
        success: true,
        month,
        year,
        results,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
