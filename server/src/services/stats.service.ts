import { PrismaClient } from "@prisma/client";
import { calculateTotalPowerScore } from "./xp.service";
import {
  getCompositionMultiplier,
  getLatestBodyComp,
  hasDataDecayPenalty,
} from "./composition.service";
import { getLeagueForScore } from "./battle.service";

export async function updateGlobalAverages(prisma: PrismaClient): Promise<void> {
  // Get all active users (those with at least one session in the last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activeUserIds = await prisma.workoutSession
    .findMany({
      where: { endedAt: { gte: thirtyDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    })
    .then((sessions) => sessions.map((s) => s.userId));

  if (activeUserIds.length === 0) return;

  // Gather discipline stats for all active users
  const statAccumulator: Record<string, number[]> = {};

  for (const userId of activeUserIds) {
    const userDisciplines = await prisma.userDiscipline.findMany({
      where: { userId },
    });

    for (const d of userDisciplines) {
      const disc = d.discipline.toLowerCase();
      const keys = [
        { key: `avg_${disc}_str`, value: d.str },
        { key: `avg_${disc}_end`, value: d.end },
        { key: `avg_${disc}_pwr`, value: d.pwr },
        { key: `avg_${disc}_spd`, value: d.spd },
        { key: `avg_${disc}_rec`, value: d.rec },
        { key: `avg_${disc}_level`, value: d.level },
      ];

      for (const { key, value } of keys) {
        if (!statAccumulator[key]) statAccumulator[key] = [];
        statAccumulator[key].push(value);
      }
    }
  }

  // Compute averages and upsert into GlobalStats
  for (const [key, values] of Object.entries(statAccumulator)) {
    if (values.length === 0) continue;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    await prisma.globalStats.upsert({
      where: { key },
      update: { value: Math.round(avg * 100) / 100 },
      create: { key, value: Math.round(avg * 100) / 100 },
    });
  }

  // Store active user count
  await prisma.globalStats.upsert({
    where: { key: "active_users_30d" },
    update: { value: activeUserIds.length },
    create: { key: "active_users_30d", value: activeUserIds.length },
  });
}

export async function getGlobalAverages(
  prisma: PrismaClient
): Promise<Record<string, number>> {
  const stats = await prisma.globalStats.findMany();
  const result: Record<string, number> = {};
  for (const s of stats) {
    result[s.key] = s.value;
  }
  return result;
}

export async function updateLeaderboard(
  userId: string,
  prisma: PrismaClient
): Promise<void> {
  // Calculate total power score
  const rawPowerScore = await calculateTotalPowerScore(userId, prisma);

  // Get user's disciplines for total level
  const userDisciplines = await prisma.userDiscipline.findMany({
    where: { userId },
    select: { level: true },
  });
  const totalLevel = userDisciplines.reduce((sum, d) => sum + d.level, 0);

  // Get composition multiplier
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gender: true, isPublic: true },
  });

  let compositionMult = 1.0;
  const latestComp = await getLatestBodyComp(userId, prisma);
  const decayPenalty = await hasDataDecayPenalty(userId, prisma);

  if (latestComp && user) {
    compositionMult = getCompositionMultiplier(
      latestComp.weight,
      latestComp.bodyFat,
      user.gender
    );
    // Apply decay penalty — multiplier drops to 0.9 of current if no recent data
    if (decayPenalty) {
      compositionMult = Math.max(0.5, compositionMult * 0.9);
    }
  }

  const totalPowerScore =
    Math.round(rawPowerScore * compositionMult * 100) / 100;

  // Determine league based on score
  const league = getLeagueForScore(totalPowerScore);

  // Upsert leaderboard entry
  await prisma.leaderboardEntry.upsert({
    where: { userId },
    update: {
      totalPowerScore,
      rawPowerScore,
      compositionMult,
      league,
      totalLevel,
      lastActive: new Date(),
      isPublic: user?.isPublic ?? false,
    },
    create: {
      userId,
      totalPowerScore,
      rawPowerScore,
      compositionMult,
      league,
      totalLevel,
      lastActive: new Date(),
      isPublic: user?.isPublic ?? false,
    },
  });
}
