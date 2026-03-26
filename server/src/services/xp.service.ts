import { PrismaClient, Discipline, RankBadge } from "@prisma/client";

export const XP_PER_SET = 15;
export const XP_PR_BONUS = 50;
export const XP_RESTED_BONUS_MULTIPLIER = 2;

export interface LevelInfo {
  level: number;
  xpToNext: number;
  remainingXP: number;
}

export interface DisciplineStats {
  str: number;
  end: number;
  pwr: number;
  spd: number;
  rec: number;
}

export interface XPGainResult {
  leveled: boolean;
  oldLevel: number;
  newLevel: number;
}

// Cumulative XP thresholds per level
function getXPRequiredForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= 10) return level * 100;
  if (level <= 20) return 10 * 100 + (level - 10) * 200;
  if (level <= 30) return 10 * 100 + 10 * 200 + (level - 20) * 400;
  if (level <= 40)
    return 10 * 100 + 10 * 200 + 10 * 400 + (level - 30) * 750;
  if (level <= 50)
    return 10 * 100 + 10 * 200 + 10 * 400 + 10 * 750 + (level - 40) * 1500;
  // Level 50 cap
  return 10 * 100 + 10 * 200 + 10 * 400 + 10 * 750 + 10 * 1500;
}

function getXPForLevelBracket(level: number): number {
  if (level <= 10) return 100;
  if (level <= 20) return 200;
  if (level <= 30) return 400;
  if (level <= 40) return 750;
  return 1500;
}

export function calculateLevelFromXP(totalXP: number): LevelInfo {
  const MAX_LEVEL = 50;
  let level = 1;

  while (level < MAX_LEVEL) {
    const required = getXPRequiredForLevel(level);
    if (totalXP < required) break;
    level++;
  }

  if (level > MAX_LEVEL) level = MAX_LEVEL;

  const xpAtCurrentLevel = getXPRequiredForLevel(level - 1);
  const xpToNext =
    level < MAX_LEVEL ? getXPForLevelBracket(level) : 0;
  const remainingXP = totalXP - xpAtCurrentLevel;

  return { level, xpToNext, remainingXP };
}

export function calculateXPForSet(
  weight: number,
  reps: number,
  rpe: number
): number {
  const base = XP_PER_SET;
  const volumeBonus = Math.floor((weight * reps) / 500);
  const rpeBonus = rpe >= 9 ? 10 : rpe >= 8 ? 5 : 0;
  return base + volumeBonus + rpeBonus;
}

export function epleyOneRepMax(weight: number, reps: number): number {
  if (reps <= 0) return weight;
  return weight * (1 + reps / 30);
}

export function getRankBadge(level: number): RankBadge {
  if (level >= 50) return RankBadge.MYTHIC_ARCHON;
  if (level >= 41) return RankBadge.PLATINUM_SOVEREIGN;
  if (level >= 31) return RankBadge.GOLD_TITAN;
  if (level >= 21) return RankBadge.SILVER_CHAMPION;
  if (level >= 11) return RankBadge.BRONZE_WARRIOR;
  return RankBadge.IRON_BODY;
}

const DISCIPLINE_PRIMARY_CATEGORIES: Record<Discipline, string[]> = {
  [Discipline.POWER]: ["barbell", "powerlifting", "compound"],
  [Discipline.TITAN]: ["compound", "bodybuilding", "hypertrophy"],
  [Discipline.PRECISION]: ["isolation", "cable", "machine"],
  [Discipline.ENDURANCE]: ["cardio", "conditioning", "circuit"],
  [Discipline.VITALITY]: ["mobility", "flexibility", "recovery", "yoga"],
  [Discipline.SYNTHESIS]: ["functional", "crossfit", "sport", "athletic"],
};

export async function calculateDisciplineStats(
  userId: string,
  discipline: Discipline,
  prisma: PrismaClient
): Promise<DisciplineStats> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const categories = DISCIPLINE_PRIMARY_CATEGORIES[discipline];

  // STR: max weight lifted in last 90 days for this discipline's exercises
  const maxWeightSets = await prisma.workoutSet.findMany({
    where: {
      session: {
        userId,
        endedAt: { not: null, gte: ninetyDaysAgo },
      },
      exercise: {
        discipline,
      },
      weight: { not: null },
    },
    select: { weight: true },
    orderBy: { weight: "desc" },
    take: 1,
  });
  const str = maxWeightSets.length > 0 ? (maxWeightSets[0].weight ?? 0) : 0;

  // END: total volume (sets × reps × weight) in rolling 30 days
  const volumeSets = await prisma.workoutSet.findMany({
    where: {
      session: {
        userId,
        endedAt: { not: null, gte: thirtyDaysAgo },
      },
      exercise: {
        discipline,
      },
      weight: { not: null },
      reps: { not: null },
    },
    select: { weight: true, reps: true },
  });
  const end = volumeSets.reduce((sum, s) => {
    return sum + (s.weight ?? 0) * (s.reps ?? 0);
  }, 0);

  // PWR: estimated 1RM using Epley formula on best set from last 90 days
  const bestSets = await prisma.workoutSet.findMany({
    where: {
      session: {
        userId,
        endedAt: { not: null, gte: ninetyDaysAgo },
      },
      exercise: {
        discipline,
      },
      weight: { not: null },
      reps: { not: null },
    },
    select: { weight: true, reps: true },
  });
  const pwr = bestSets.reduce((best, s) => {
    const orm = epleyOneRepMax(s.weight ?? 0, s.reps ?? 0);
    return orm > best ? orm : best;
  }, 0);

  // SPD: average sessions per week over last 4 weeks
  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      endedAt: { not: null, gte: fourWeeksAgo },
      sets: {
        some: {
          exercise: {
            discipline,
          },
        },
      },
    },
    select: { endedAt: true },
    orderBy: { endedAt: "asc" },
  });
  const spd = sessions.length / 4;

  // REC: recovery score based on rest days between sessions in last 4 weeks
  let rec = 100;
  if (sessions.length >= 2) {
    const dates = sessions
      .map((s) => s.endedAt!)
      .sort((a, b) => a.getTime() - b.getTime());
    let totalRestDays = 0;
    for (let i = 1; i < dates.length; i++) {
      const diff =
        (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      totalRestDays += diff;
    }
    const avgRest = totalRestDays / (dates.length - 1);
    // Ideal rest is 1-2 days between sessions
    if (avgRest < 1) {
      rec = 50;
    } else if (avgRest <= 2) {
      rec = 100;
    } else if (avgRest <= 3) {
      rec = 85;
    } else if (avgRest <= 5) {
      rec = 70;
    } else {
      rec = 55;
    }
  } else if (sessions.length === 0) {
    rec = 100; // Fully recovered if no recent sessions
  }

  void categories; // suppress unused warning — used conceptually

  return {
    str: Math.round(str * 10) / 10,
    end: Math.round(end),
    pwr: Math.round(pwr * 10) / 10,
    spd: Math.round(spd * 100) / 100,
    rec: Math.round(rec),
  };
}

export async function applyXPGain(
  userId: string,
  discipline: Discipline,
  xpAmount: number,
  prisma: PrismaClient
): Promise<XPGainResult> {
  const userDiscipline = await prisma.userDiscipline.findUnique({
    where: { userId_discipline: { userId, discipline } },
  });

  if (!userDiscipline) {
    throw new Error(
      `UserDiscipline not found for userId=${userId}, discipline=${discipline}`
    );
  }

  const oldXP = userDiscipline.xp;
  const newXP = oldXP + xpAmount;
  const oldLevelInfo = calculateLevelFromXP(oldXP);
  const newLevelInfo = calculateLevelFromXP(newXP);

  const leveled = newLevelInfo.level > oldLevelInfo.level;
  const newBadge = getRankBadge(newLevelInfo.level);

  await prisma.userDiscipline.update({
    where: { userId_discipline: { userId, discipline } },
    data: {
      xp: newXP,
      level: newLevelInfo.level,
      xpToNext: newLevelInfo.xpToNext,
      rankBadge: newBadge,
    },
  });

  return {
    leveled,
    oldLevel: oldLevelInfo.level,
    newLevel: newLevelInfo.level,
  };
}

const DISCIPLINE_MODIFIERS: Record<Discipline, number> = {
  [Discipline.POWER]: 1.2,
  [Discipline.TITAN]: 1.1,
  [Discipline.PRECISION]: 1.0,
  [Discipline.ENDURANCE]: 1.0,
  [Discipline.VITALITY]: 0.9,
  [Discipline.SYNTHESIS]: 1.1,
};

export async function calculateTotalPowerScore(
  userId: string,
  prisma: PrismaClient
): Promise<number> {
  const disciplines = await prisma.userDiscipline.findMany({
    where: { userId },
  });

  const total = disciplines.reduce((sum, d) => {
    const modifier = DISCIPLINE_MODIFIERS[d.discipline] ?? 1.0;
    return sum + d.level * 10 * modifier;
  }, 0);

  return Math.round(total * 100) / 100;
}
