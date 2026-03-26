import { Router, Request, Response, NextFunction } from "express";
import { param, validationResult } from "express-validator";
import { PrismaClient, Discipline } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { createError } from "../middleware/error";
import { applyXPGain } from "../services/xp.service";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

interface QuestTemplate {
  key: string;
  description: string;
  requirement: Record<string, unknown>;
  xpReward: number;
}

const DISCIPLINE_VALUES = Object.values(Discipline);

function randomDiscipline(): Discipline {
  return DISCIPLINE_VALUES[
    Math.floor(Math.random() * DISCIPLINE_VALUES.length)
  ];
}

function generateQuestTemplates(): QuestTemplate[] {
  const discipline = randomDiscipline();
  const setCount = Math.floor(Math.random() * 5) + 8; // 8-12 sets
  const volumeTarget =
    Math.floor(Math.random() / 0.1 + 5) * 500 + 2000; // 2000-7000 kg

  const allTemplates: QuestTemplate[] = [
    {
      key: `log_sets_${discipline}`,
      description: `Log ${setCount} sets of ${discipline} exercises`,
      requirement: { type: "log_sets", discipline, count: setCount },
      xpReward: 75,
    },
    {
      key: "hit_rpe",
      description: "Log any set with RPE 9 or higher",
      requirement: { type: "hit_rpe", minRpe: 9, count: 1 },
      xpReward: 60,
    },
    {
      key: "morning_session",
      description: "Log a workout session before 10:00 AM",
      requirement: { type: "morning_session", beforeHour: 10 },
      xpReward: 80,
    },
    {
      key: "volume_target",
      description: `Log ${volumeTarget}kg total volume in a single session`,
      requirement: { type: "volume_target", targetKg: volumeTarget },
      xpReward: 90,
    },
    {
      key: "discipline_variety",
      description: "Log exercises from 3 or more different disciplines",
      requirement: { type: "discipline_variety", minDisciplines: 3 },
      xpReward: 100,
    },
    {
      key: "complete_session",
      description: "Complete and end a full workout session",
      requirement: { type: "complete_session", count: 1 },
      xpReward: 50,
    },
    {
      key: "pr_attempt",
      description: "Set a new personal record on any exercise",
      requirement: { type: "pr_attempt", count: 1 },
      xpReward: 120,
    },
  ];

  // Shuffle and pick 3
  const shuffled = allTemplates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

async function getOrCreateTodayQuests(
  userId: string,
  prisma: PrismaClient
): Promise<
  Array<{
    id: string;
    questId: string;
    progress: number;
    isComplete: boolean;
    completedAt: Date | null;
    quest: {
      id: string;
      date: Date;
      key: string;
      description: string;
      requirement: unknown;
      xpReward: number;
    };
  }>
> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find daily quests for today
  const todayQuests = await prisma.dailyQuest.findMany({
    where: { date: today },
  });

  // If quests already exist for today, find or create user quest assignments
  let quests;

  if (todayQuests.length < 3) {
    // Generate quests for today if they don't exist
    const templates = generateQuestTemplates();

    for (const template of templates) {
      await prisma.dailyQuest.upsert({
        where: { date_key: { date: today, key: template.key } },
        update: {},
        create: {
          date: today,
          key: template.key,
          description: template.description,
          requirement: template.requirement,
          xpReward: template.xpReward,
        },
      });
    }

    quests = await prisma.dailyQuest.findMany({
      where: { date: today },
    });
  } else {
    quests = todayQuests;
  }

  // Ensure user has quest assignments
  for (const quest of quests.slice(0, 3)) {
    await prisma.userDailyQuest.upsert({
      where: { userId_questId: { userId, questId: quest.id } },
      update: {},
      create: {
        userId,
        questId: quest.id,
        progress: 0,
        isComplete: false,
      },
    });
  }

  // Return user's quests with details
  const userQuests = await prisma.userDailyQuest.findMany({
    where: {
      userId,
      quest: { date: today },
    },
    include: {
      quest: true,
    },
    take: 3,
  });

  return userQuests;
}

// GET /api/quests/today — get or generate today's quests
router.get(
  "/today",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quests = await getOrCreateTodayQuests(req.user!.userId, prisma);
      res.json({
        quests,
        date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/quests/:questId/progress — update quest progress
router.put(
  "/:questId/progress",
  [param("questId").notEmpty().withMessage("Quest ID required")],
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
    const questId = req.params.questId;
    const { progress } = req.body as { progress: number };

    try {
      const userQuest = await prisma.userDailyQuest.findUnique({
        where: { userId_questId: { userId, questId } },
        include: { quest: true },
      });

      if (!userQuest) {
        next(createError("Quest not found.", 404, "NotFound"));
        return;
      }

      if (userQuest.isComplete) {
        res.json({
          userQuest,
          alreadyComplete: true,
          message: "Quest already completed.",
        });
        return;
      }

      const requirement = userQuest.quest.requirement as Record<string, unknown>;
      const targetCount =
        typeof requirement.count === "number"
          ? requirement.count
          : 1;

      const newProgress = Math.max(userQuest.progress, progress);
      const isComplete = newProgress >= targetCount;

      let xpAwarded = 0;
      const updated = await prisma.userDailyQuest.update({
        where: { userId_questId: { userId, questId } },
        data: {
          progress: newProgress,
          isComplete,
          completedAt: isComplete && !userQuest.isComplete ? new Date() : userQuest.completedAt,
        },
        include: { quest: true },
      });

      // Award XP on completion
      if (isComplete && !userQuest.isComplete) {
        xpAwarded = userQuest.quest.xpReward;
        // Award XP to the discipline most relevant (or SYNTHESIS as default)
        const discipline =
          (requirement.discipline as Discipline | undefined) ??
          Discipline.SYNTHESIS;
        await applyXPGain(userId, discipline, xpAwarded, prisma);
      }

      res.json({
        userQuest: updated,
        justCompleted: isComplete && !userQuest.isComplete,
        xpAwarded,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/quests/history — last 30 days of quest completion
router.get(
  "/history",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      const history = await prisma.userDailyQuest.findMany({
        where: {
          userId,
          quest: {
            date: { gte: thirtyDaysAgo },
          },
        },
        include: {
          quest: {
            select: {
              date: true,
              key: true,
              description: true,
              xpReward: true,
              requirement: true,
            },
          },
        },
        orderBy: [
          { quest: { date: "desc" } },
        ],
      });

      // Group by date
      const byDate: Record<
        string,
        {
          date: string;
          quests: typeof history;
          completedCount: number;
          totalXP: number;
        }
      > = {};

      for (const entry of history) {
        const dateKey = new Date(entry.quest.date)
          .toISOString()
          .split("T")[0];
        if (!byDate[dateKey]) {
          byDate[dateKey] = {
            date: dateKey,
            quests: [],
            completedCount: 0,
            totalXP: 0,
          };
        }
        byDate[dateKey].quests.push(entry);
        if (entry.isComplete) {
          byDate[dateKey].completedCount++;
          byDate[dateKey].totalXP += entry.quest.xpReward;
        }
      }

      const days = Object.values(byDate).sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      res.json({
        days,
        totalDays: days.length,
        totalCompleted: history.filter((q) => q.isComplete).length,
        totalXPEarned: days.reduce((sum, d) => sum + d.totalXP, 0),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
