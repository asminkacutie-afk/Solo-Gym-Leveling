import { PrismaClient, League, MonsterTier } from "@prisma/client";

export const MONSTER_PREFIXES: string[] = [
  "Iron",
  "Shadow",
  "Cursed",
  "Ancient",
  "Vile",
  "Dread",
  "Forsaken",
  "Hollow",
  "Abyssal",
  "Corrupt",
  "Infernal",
  "Ruinous",
  "Blighted",
  "Savage",
  "Wrathful",
  "Undying",
  "Spectral",
  "Hellbound",
  "Ashen",
  "Obsidian",
];

export const MONSTER_NOUNS: string[] = [
  "Golem",
  "Wraith",
  "Behemoth",
  "Titan",
  "Colossus",
  "Specter",
  "Revenant",
  "Hydra",
  "Leviathan",
  "Chimera",
  "Basilisk",
  "Warlord",
  "Sentinel",
  "Overlord",
  "Juggernaut",
  "Devourer",
  "Phantom",
  "Executioner",
  "Warmonger",
  "Destroyer",
];

export const MONSTER_SUFFIXES: string[] = [
  "of the Void",
  "the Relentless",
  "of Eternal Darkness",
  "the Undying",
  "of Ruin",
  "the Unbroken",
  "of the Abyss",
  "the Merciless",
  "of Forgotten Realms",
  "the Condemned",
  "of Shadow's End",
  "the Inevitable",
  "of Shattered Worlds",
  "the Accursed",
  "of the Iron Throne",
  "the Unyielding",
  "of Chaos",
  "the Forsaken",
  "of Ancient Wrath",
  "the Unbroken Chain",
];

export function generateMonsterName(): string {
  const prefix =
    MONSTER_PREFIXES[Math.floor(Math.random() * MONSTER_PREFIXES.length)];
  const noun =
    MONSTER_NOUNS[Math.floor(Math.random() * MONSTER_NOUNS.length)];
  const suffix =
    MONSTER_SUFFIXES[Math.floor(Math.random() * MONSTER_SUFFIXES.length)];
  return `${prefix} ${noun} ${suffix}`;
}

export const TIER_MULTIPLIERS: Record<MonsterTier, number> = {
  COMMON: 0.8,
  RARE: 1.0,
  EPIC: 1.3,
  LEGENDARY: 1.7,
  ANCIENT: 2.2,
};

export const LEAGUE_BASE_STATS: Record<
  League,
  {
    power: number;
    titan: number;
    precision: number;
    endurance: number;
    vitality: number;
    synthesis: number;
  }
> = {
  IRON: {
    power: 40,
    titan: 35,
    precision: 30,
    endurance: 5000,
    vitality: 50,
    synthesis: 40,
  },
  AWAKENING: {
    power: 70,
    titan: 60,
    precision: 55,
    endurance: 12000,
    vitality: 80,
    synthesis: 70,
  },
  BRONZE: {
    power: 110,
    titan: 100,
    precision: 90,
    endurance: 25000,
    vitality: 120,
    synthesis: 110,
  },
  SILVER: {
    power: 160,
    titan: 150,
    precision: 140,
    endurance: 45000,
    vitality: 170,
    synthesis: 160,
  },
  GOLD: {
    power: 220,
    titan: 210,
    precision: 200,
    endurance: 70000,
    vitality: 230,
    synthesis: 220,
  },
  MYTHIC: {
    power: 300,
    titan: 290,
    precision: 280,
    endurance: 110000,
    vitality: 310,
    synthesis: 300,
  },
};

export interface MonsterData {
  name: string;
  tier: MonsterTier;
  league: League;
  powerStat: number;
  titanStat: number;
  precisionStat: number;
  enduranceStat: number;
  vitalityStat: number;
  synthesisStat: number;
  densityStat: number;
  difficultyMult: number;
  svgData: string;
  month: number;
  year: number;
}

function jitter(base: number, variance = 0.15): number {
  const factor = 1 + (Math.random() * 2 - 1) * variance;
  return Math.round(base * factor * 10) / 10;
}

export function generateMonster(
  league: League,
  tier: MonsterTier,
  globalAverages?: Record<string, number>
): MonsterData {
  const base = LEAGUE_BASE_STATS[league];
  const mult = TIER_MULTIPLIERS[tier];
  const now = new Date();

  // Use global averages to tune if available
  const avgPower = globalAverages?.["avg_power_str"] ?? base.power;
  const avgTitan = globalAverages?.["avg_titan_str"] ?? base.titan;
  const avgPrecision = globalAverages?.["avg_precision_str"] ?? base.precision;
  const avgEndurance =
    globalAverages?.["avg_endurance_end"] ?? base.endurance;
  const avgVitality = globalAverages?.["avg_vitality_str"] ?? base.vitality;
  const avgSynthesis =
    globalAverages?.["avg_synthesis_str"] ?? base.synthesis;

  return {
    name: generateMonsterName(),
    tier,
    league,
    powerStat: jitter(Math.max(base.power, avgPower) * mult),
    titanStat: jitter(Math.max(base.titan, avgTitan) * mult),
    precisionStat: jitter(Math.max(base.precision, avgPrecision) * mult),
    enduranceStat: jitter(Math.max(base.endurance, avgEndurance) * mult),
    vitalityStat: jitter(Math.max(base.vitality, avgVitality) * mult),
    synthesisStat: jitter(Math.max(base.synthesis, avgSynthesis) * mult),
    densityStat: mult,
    difficultyMult: mult,
    svgData: generateMonsterSVG(tier, league),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

const TIER_COLORS: Record<MonsterTier, string> = {
  COMMON: "#8b9dc3",
  RARE: "#4a90d9",
  EPIC: "#a855f7",
  LEGENDARY: "#f59e0b",
  ANCIENT: "#ef4444",
};

const TIER_SIZES: Record<MonsterTier, number> = {
  COMMON: 40,
  RARE: 50,
  EPIC: 60,
  LEGENDARY: 70,
  ANCIENT: 85,
};

export function generateMonsterSVG(tier: MonsterTier, league: League): string {
  const color = TIER_COLORS[tier];
  const size = TIER_SIZES[tier];
  const center = 100;
  const glowRadius = size + 10;
  const leagueIndex = Object.keys(League).indexOf(league);
  const eyeCount = Math.min(leagueIndex + 1, 4);
  const eyeSpacing = 12;
  const eyeStartX = center - ((eyeCount - 1) * eyeSpacing) / 2;

  let eyes = "";
  for (let i = 0; i < eyeCount; i++) {
    eyes += `<circle cx="${eyeStartX + i * eyeSpacing}" cy="${center - 8}" r="4" fill="#ffffff" opacity="0.9"/>`;
    eyes += `<circle cx="${eyeStartX + i * eyeSpacing}" cy="${center - 8}" r="2" fill="#ff0000" opacity="0.8"/>`;
  }

  const spikes =
    tier === "ANCIENT" || tier === "LEGENDARY"
      ? `<polygon points="${center},${center - size - 15} ${center - 8},${center - size} ${center + 8},${center - size}" fill="${color}" opacity="0.7"/>
         <polygon points="${center - size - 10},${center} ${center - size},${center - 8} ${center - size},${center + 8}" fill="${color}" opacity="0.7"/>
         <polygon points="${center + size + 10},${center} ${center + size},${center - 8} ${center + size},${center + 8}" fill="${color}" opacity="0.7"/>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="glow_${tier}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="body_${tier}" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.6"/>
    </radialGradient>
  </defs>
  <circle cx="${center}" cy="${center}" r="${glowRadius}" fill="url(#glow_${tier})"/>
  ${spikes}
  <circle cx="${center}" cy="${center}" r="${size}" fill="url(#body_${tier})" stroke="${color}" stroke-width="2" opacity="0.95"/>
  ${eyes}
  <path d="M ${center - 15} ${center + 12} Q ${center} ${center + 22} ${center + 15} ${center + 12}" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.7"/>
</svg>`;
}

const TIER_ORDER: MonsterTier[] = [
  MonsterTier.COMMON,
  MonsterTier.RARE,
  MonsterTier.EPIC,
  MonsterTier.LEGENDARY,
  MonsterTier.ANCIENT,
];

const MONSTERS_PER_LEAGUE = 20;
const TIERS_DISTRIBUTION = [
  MonsterTier.COMMON,
  MonsterTier.COMMON,
  MonsterTier.COMMON,
  MonsterTier.COMMON,
  MonsterTier.COMMON,
  MonsterTier.COMMON,
  MonsterTier.RARE,
  MonsterTier.RARE,
  MonsterTier.RARE,
  MonsterTier.RARE,
  MonsterTier.RARE,
  MonsterTier.EPIC,
  MonsterTier.EPIC,
  MonsterTier.EPIC,
  MonsterTier.EPIC,
  MonsterTier.LEGENDARY,
  MonsterTier.LEGENDARY,
  MonsterTier.LEGENDARY,
  MonsterTier.ANCIENT,
  MonsterTier.ANCIENT,
];

void TIER_ORDER; // suppress unused

export async function getOrCreateMonthlyMonsters(
  prisma: PrismaClient
): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const leagues = Object.values(League);

  // Get global averages for monster tuning
  const globalStats = await prisma.globalStats.findMany();
  const globalAverages: Record<string, number> = {};
  globalStats.forEach((s) => {
    globalAverages[s.key] = s.value;
  });

  for (const league of leagues) {
    const existing = await prisma.monster.count({
      where: { league, month, year, isActive: true },
    });

    if (existing >= MONSTERS_PER_LEAGUE) continue;

    const toCreate = MONSTERS_PER_LEAGUE - existing;

    for (let i = 0; i < toCreate; i++) {
      const tier =
        TIERS_DISTRIBUTION[
          (existing + i) % TIERS_DISTRIBUTION.length
        ];
      const monsterData = generateMonster(league, tier, globalAverages);
      await prisma.monster.create({ data: monsterData });
    }
  }
}

export async function refreshMonsterStats(prisma: PrismaClient): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Find monsters that have been encountered but not defeated (defeated users)
  const monsters = await prisma.monster.findMany({
    where: {
      month,
      year,
      isActive: true,
      totalEncounters: { gt: 0 },
    },
  });

  for (const monster of monsters) {
    const defeatRate =
      monster.totalEncounters > 0
        ? monster.timesDefeated / monster.totalEncounters
        : 0;

    // Boost monsters that defeat users more (low defeat rate = strong monster)
    if (defeatRate < 0.5) {
      const boostFactor =
        1 + (Math.random() * 0.05 + 0.03); // 3-8% boost

      await prisma.monster.update({
        where: { id: monster.id },
        data: {
          powerStat: monster.powerStat * boostFactor,
          titanStat: monster.titanStat * boostFactor,
          precisionStat: monster.precisionStat * boostFactor,
          enduranceStat: monster.enduranceStat * boostFactor,
          vitalityStat: monster.vitalityStat * boostFactor,
          synthesisStat: monster.synthesisStat * boostFactor,
        },
      });
    }
  }
}
