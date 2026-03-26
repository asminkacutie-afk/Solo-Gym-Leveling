import { PrismaClient, League, Monster } from "@prisma/client";
import { getCompositionMultiplier, getLatestBodyComp } from "./composition.service";

export interface UserDisciplineStats {
  power: number;
  titan: number;
  precision: number;
  endurance: number;
  vitality: number;
  synthesis: number;
}

export interface RoundMargin {
  discipline: string;
  userStat: number;
  monsterStat: number;
  userWon: boolean;
  margin: number;
}

export interface BattleResult {
  won: boolean;
  roundsWon: number;
  roundsLost: number;
  margins: RoundMargin[];
  totalMargin: number;
}

export function resolveBattle(
  userDisciplines: UserDisciplineStats,
  monster: Monster,
  compositionMultiplier = 1.0
): BattleResult {
  const applied = {
    power: userDisciplines.power * compositionMultiplier,
    titan: userDisciplines.titan * compositionMultiplier,
    precision: userDisciplines.precision * compositionMultiplier,
    endurance: userDisciplines.endurance * compositionMultiplier,
    vitality: userDisciplines.vitality * compositionMultiplier,
    synthesis: userDisciplines.synthesis * compositionMultiplier,
  };

  const matchups: Array<{
    discipline: string;
    userStat: number;
    monsterStat: number;
  }> = [
    {
      discipline: "POWER",
      userStat: applied.power,
      monsterStat: monster.powerStat,
    },
    {
      discipline: "TITAN",
      userStat: applied.titan,
      monsterStat: monster.titanStat,
    },
    {
      discipline: "PRECISION",
      userStat: applied.precision,
      monsterStat: monster.precisionStat,
    },
    {
      discipline: "ENDURANCE",
      userStat: applied.endurance,
      monsterStat: monster.enduranceStat,
    },
    {
      discipline: "VITALITY",
      userStat: applied.vitality,
      monsterStat: monster.vitalityStat,
    },
    {
      discipline: "SYNTHESIS",
      userStat: applied.synthesis,
      monsterStat: monster.synthesisStat,
    },
  ];

  let roundsWon = 0;
  let totalMargin = 0;
  const margins: RoundMargin[] = [];

  for (const m of matchups) {
    const userWon = m.userStat >= m.monsterStat;
    const margin = m.userStat - m.monsterStat;
    if (userWon) roundsWon++;
    totalMargin += margin;
    margins.push({
      discipline: m.discipline,
      userStat: Math.round(m.userStat * 10) / 10,
      monsterStat: Math.round(m.monsterStat * 10) / 10,
      userWon,
      margin: Math.round(margin * 10) / 10,
    });
  }

  const roundsLost = 6 - roundsWon;
  const won = roundsWon > roundsLost;

  return {
    won,
    roundsWon,
    roundsLost,
    margins,
    totalMargin: Math.round(totalMargin * 10) / 10,
  };
}

export async function checkAndResolvePendingBattles(
  userId: string,
  prisma: PrismaClient
): Promise<void> {
  // Get the user's league
  const leaderboard = await prisma.leaderboardEntry.findUnique({
    where: { userId },
    select: { league: true },
  });

  if (!leaderboard) return;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Get active monsters for the user's league this month
  const monsters = await prisma.monster.findMany({
    where: {
      league: leaderboard.league,
      month,
      year,
      isActive: true,
    },
  });

  // Get all battles this user has already had this month
  const existingKills = await prisma.userMonsterKill.findMany({
    where: {
      userId,
      monster: { month, year },
    },
    select: { monsterId: true },
  });
  const killedIds = new Set(existingKills.map((k) => k.monsterId));

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
        statsMap.power = d.pwr || d.str;
        break;
      case "TITAN":
        statsMap.titan = d.pwr || d.str;
        break;
      case "PRECISION":
        statsMap.precision = d.pwr || d.str;
        break;
      case "ENDURANCE":
        statsMap.endurance = d.end;
        break;
      case "VITALITY":
        statsMap.vitality = d.pwr || d.str;
        break;
      case "SYNTHESIS":
        statsMap.synthesis = d.pwr || d.str;
        break;
    }
  }

  // Apply composition multiplier
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

  for (const monster of monsters) {
    if (killedIds.has(monster.id)) continue;

    const result = resolveBattle(statsMap, monster, compositionMultiplier);

    // Record encounter
    await prisma.monster.update({
      where: { id: monster.id },
      data: {
        totalEncounters: { increment: 1 },
        ...(result.won ? { timesDefeated: { increment: 1 } } : {}),
      },
    });

    if (result.won) {
      await prisma.userMonsterKill.create({
        data: {
          userId,
          monsterId: monster.id,
          margin: result.margins as object,
          roundsWon: result.roundsWon,
        },
      });
    }
  }
}

const LEAGUE_SCORE_THRESHOLDS: Record<League, number> = {
  IRON: 0,
  AWAKENING: 120,
  BRONZE: 250,
  SILVER: 450,
  GOLD: 700,
  MYTHIC: 1000,
};

export function getLeagueForScore(score: number): League {
  const leagues = Object.values(League) as League[];
  let currentLeague: League = League.IRON;

  for (const league of leagues) {
    if (score >= LEAGUE_SCORE_THRESHOLDS[league]) {
      currentLeague = league;
    } else {
      break;
    }
  }

  return currentLeague;
}
