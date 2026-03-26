import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient, League } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { createError } from "../middleware/error";
import {
  resolveBattle,
  UserDisciplineStats,
} from "../services/battle.service";
import {
  getCompositionMultiplier,
  getLatestBodyComp,
} from "../services/composition.service";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/monsters — active monsters for user's league with kill status
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;

    try {
      const leaderboard = await prisma.leaderboardEntry.findUnique({
        where: { userId },
        select: { league: true },
      });

      const league = leaderboard?.league ?? League.IRON;
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const monsters = await prisma.monster.findMany({
        where: { league, month, year, isActive: true },
        orderBy: [{ tier: "desc" }, { name: "asc" }],
      });

      const kills = await prisma.userMonsterKill.findMany({
        where: {
          userId,
          monster: { month, year },
        },
        select: { monsterId: true, killedAt: true, roundsWon: true },
      });

      const killMap = new Map(kills.map((k) => [k.monsterId, k]));

      const monstersWithStatus = monsters.map((m) => ({
        ...m,
        killedByUser: killMap.has(m.id),
        killDetails: killMap.get(m.id) ?? null,
      }));

      res.json({
        monsters: monstersWithStatus,
        league,
        month,
        year,
        totalMonsters: monsters.length,
        killed: kills.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/monsters/all — all leagues monster roster
router.get(
  "/all",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const monsters = await prisma.monster.findMany({
        where: { month, year, isActive: true },
        orderBy: [{ league: "asc" }, { tier: "desc" }, { name: "asc" }],
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
          densityStat: true,
          difficultyMult: true,
          timesDefeated: true,
          totalEncounters: true,
          month: true,
          year: true,
        },
      });

      // Group by league
      const byLeague: Record<string, typeof monsters> = {};
      for (const m of monsters) {
        if (!byLeague[m.league]) byLeague[m.league] = [];
        byLeague[m.league].push(m);
      }

      res.json({ byLeague, month, year, total: monsters.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/monsters/kills — current user's kill log
router.get(
  "/kills",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;

    try {
      const kills = await prisma.userMonsterKill.findMany({
        where: { userId },
        include: {
          monster: {
            select: {
              id: true,
              name: true,
              tier: true,
              league: true,
              month: true,
              year: true,
              difficultyMult: true,
              svgData: true,
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

// GET /api/monsters/:id — single monster with defeat count
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const monster = await prisma.monster.findUnique({
        where: { id: req.params.id },
        include: {
          _count: {
            select: { kills: true },
          },
        },
      });

      if (!monster) {
        next(createError("Monster not found.", 404, "NotFound"));
        return;
      }

      res.json({
        monster: {
          ...monster,
          defeatedByCount: monster._count.kills,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/monsters/battle/:monsterId — manually trigger a battle
router.post(
  "/battle/:monsterId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    const monsterId = req.params.monsterId;

    try {
      const monster = await prisma.monster.findUnique({
        where: { id: monsterId },
      });

      if (!monster || !monster.isActive) {
        next(createError("Monster not found or inactive.", 404, "NotFound"));
        return;
      }

      // Check if already fought this monster
      const existingKill = await prisma.userMonsterKill.findUnique({
        where: {
          userId_monsterId: { userId, monsterId },
        },
      });

      if (existingKill) {
        res.status(409).json({
          error: "AlreadyFought",
          message: "You have already battled this monster this month.",
          statusCode: 409,
          existingResult: existingKill,
        });
        return;
      }

      // Check user's league matches monster league
      const leaderboard = await prisma.leaderboardEntry.findUnique({
        where: { userId },
        select: { league: true },
      });

      if (leaderboard?.league !== monster.league) {
        res.status(403).json({
          error: "WrongLeague",
          message: `This monster belongs to the ${monster.league} league. You are in the ${leaderboard?.league ?? "IRON"} league.`,
          statusCode: 403,
        });
        return;
      }

      // Get user's discipline stats
      const userDisciplines = await prisma.userDiscipline.findMany({
        where: { userId },
      });

      const statsMap: UserDisciplineStats = {
        power: 0,
        titan: 0,
        precision: 0,
        endurance: 0,
        vitality: 0,
        synthesis: 0,
      };

      for (const d of userDisciplines) {
        switch (d.discipline) {
          case "POWER":
            statsMap.power = d.pwr > 0 ? d.pwr : d.str;
            break;
          case "TITAN":
            statsMap.titan = d.pwr > 0 ? d.pwr : d.str;
            break;
          case "PRECISION":
            statsMap.precision = d.pwr > 0 ? d.pwr : d.str;
            break;
          case "ENDURANCE":
            statsMap.endurance = d.end;
            break;
          case "VITALITY":
            statsMap.vitality = d.pwr > 0 ? d.pwr : d.str;
            break;
          case "SYNTHESIS":
            statsMap.synthesis = d.pwr > 0 ? d.pwr : d.str;
            break;
        }
      }

      // Get composition multiplier
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { gender: true },
      });
      const latestComp = await getLatestBodyComp(userId, prisma);
      let compositionMultiplier = 1.0;
      if (latestComp && user) {
        compositionMultiplier = getCompositionMultiplier(
          latestComp.weight,
          latestComp.bodyFat,
          user.gender
        );
      }

      const battleResult = resolveBattle(
        statsMap,
        monster,
        compositionMultiplier
      );

      // Record encounter
      await prisma.monster.update({
        where: { id: monsterId },
        data: {
          totalEncounters: { increment: 1 },
          ...(battleResult.won ? { timesDefeated: { increment: 1 } } : {}),
        },
      });

      if (battleResult.won) {
        await prisma.userMonsterKill.create({
          data: {
            userId,
            monsterId,
            margin: battleResult.margins as object,
            roundsWon: battleResult.roundsWon,
          },
        });
      }

      res.json({
        ...battleResult,
        monster: {
          id: monster.id,
          name: monster.name,
          tier: monster.tier,
          league: monster.league,
        },
        compositionMultiplier,
        userStats: statsMap,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
