import { PrismaClient, BodyComposition, League } from "@prisma/client";

export interface LeagueGateCheck {
  passes: boolean;
  deficit: number;
}

export interface GatesStatus {
  bronzeToSilver: LeagueGateCheck;
  silverToGold: LeagueGateCheck;
  goldToMythic: LeagueGateCheck;
}

// Body fat thresholds beyond which "excess fat" is calculated
export function getExcessFatThreshold(gender: string): number {
  return gender.toLowerCase() === "female" ? 22 : 15;
}

export function getCompositionMultiplier(
  weight: number,
  bodyFat: number,
  gender: string
): number {
  const threshold = getExcessFatThreshold(gender);
  const fatMass = weight * (bodyFat / 100);
  const lbm = weight - fatMass;
  const thresholdFatMass = weight * (threshold / 100);
  const excessFat = Math.max(0, fatMass - thresholdFatMass);
  const multiplier = lbm / (lbm + excessFat);
  // Clamp between 0.5 and 1.0
  return Math.min(1.0, Math.max(0.5, multiplier));
}

// Body fat thresholds for league promotions: [male, female]
const LEAGUE_BF_GATES: Record<string, [number, number]> = {
  bronzeToSilver: [28, 35],
  silverToGold: [22, 30],
  goldToMythic: [18, 26],
};

export function checkBFLeagueGate(
  bodyFat: number,
  targetLeague: League,
  gender: string
): LeagueGateCheck {
  const isFemale = gender.toLowerCase() === "female";

  let gateKey: string | null = null;
  if (targetLeague === League.SILVER) gateKey = "bronzeToSilver";
  else if (targetLeague === League.GOLD) gateKey = "silverToGold";
  else if (targetLeague === League.MYTHIC) gateKey = "goldToMythic";

  if (!gateKey) {
    return { passes: true, deficit: 0 };
  }

  const [maleThreshold, femaleThreshold] = LEAGUE_BF_GATES[gateKey];
  const threshold = isFemale ? femaleThreshold : maleThreshold;
  const deficit = Math.max(0, bodyFat - threshold);

  return {
    passes: bodyFat <= threshold,
    deficit: Math.round(deficit * 10) / 10,
  };
}

export async function getLatestBodyComp(
  userId: string,
  prisma: PrismaClient
): Promise<BodyComposition | null> {
  const entry = await prisma.bodyComposition.findFirst({
    where: { userId },
    orderBy: { recordedAt: "desc" },
  });
  return entry;
}

export async function hasDataDecayPenalty(
  userId: string,
  prisma: PrismaClient
): Promise<boolean> {
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000
  );
  const recent = await prisma.bodyComposition.findFirst({
    where: {
      userId,
      recordedAt: { gte: fourteenDaysAgo },
    },
  });
  return recent === null;
}
