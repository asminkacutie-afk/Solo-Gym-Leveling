// ============================================================
// Enums
// ============================================================

export enum Discipline {
  POWER = "POWER",
  TITAN = "TITAN",
  PRECISION = "PRECISION",
  ENDURANCE = "ENDURANCE",
  VITALITY = "VITALITY",
  SYNTHESIS = "SYNTHESIS",
}

export enum League {
  IRON = "IRON",
  AWAKENING = "AWAKENING",
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  MYTHIC = "MYTHIC",
}

export enum MonsterTier {
  COMMON = "COMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY",
  ANCIENT = "ANCIENT",
}

export enum RankBadge {
  IRON_BODY = "IRON_BODY",
  BRONZE_WARRIOR = "BRONZE_WARRIOR",
  SILVER_CHAMPION = "SILVER_CHAMPION",
  GOLD_TITAN = "GOLD_TITAN",
  PLATINUM_SOVEREIGN = "PLATINUM_SOVEREIGN",
  MYTHIC_ARCHON = "MYTHIC_ARCHON",
}

// ============================================================
// Stat Interfaces
// ============================================================

export interface DisciplineStats {
  str: number; // Strength
  end: number; // Endurance
  pwr: number; // Power
  spd: number; // Speed
  rec: number; // Recovery
}

// ============================================================
// User Interfaces
// ============================================================

export interface UserDiscipline {
  id: string;
  userId: string;
  discipline: Discipline;
  level: number;
  xp: number;
  xpToNext: number;
  str: number;
  end: number;
  pwr: number;
  spd: number;
  rec: number;
  rankBadge: RankBadge;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  isPublic: boolean;
  unitsPreference: "kg" | "lbs";
  gender: string;
  emailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  disciplines?: UserDiscipline[];
  leaderboardEntry?: LeaderboardEntry | null;
  streakData?: UserStreak | null;
}

export interface UserStreak {
  id: string;
  userId: string;
  currentWeekSessions: number;
  weeklyStreak: number;
  lastSessionDate: Date | string | null;
  restedBonusActive: boolean;
  lastWeekReset: Date | string;
}

// ============================================================
// Exercise Interfaces
// ============================================================

export interface Exercise {
  id: string;
  name: string;
  discipline: Discipline;
  category: string;
  muscleGroups: string[];
  description: string | null;
  isBuiltIn: boolean;
}

// ============================================================
// Workout Interfaces
// ============================================================

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  duration: number | null;   // seconds
  distance: number | null;   // metres
  rpe: number | null;        // 1–10
  isPR: boolean;
  createdAt: Date | string;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  startedAt: Date | string;
  endedAt: Date | string | null;
  notes: string | null;
  xpGained: Record<string, number> | null;  // discipline -> xp
  levelUps: Record<string, number> | null;  // discipline -> new level
  createdAt: Date | string;
  updatedAt: Date | string;
  sets?: WorkoutSet[];
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  weight: number | null;
  reps: number | null;
  oneRepMax: number | null;
  recordedAt: Date | string;
  exercise?: Exercise;
}

// ============================================================
// Body Composition
// ============================================================

export interface BodyComposition {
  id: string;
  userId: string;
  weight: number;       // kg
  bodyFat: number;      // percentage 0–100
  lbm: number;          // lean body mass in kg
  method: string;       // "manual" | "dexa" | "navy" | etc.
  recordedAt: Date | string;
  createdAt: Date | string;
}

// ============================================================
// Monster Interfaces
// ============================================================

export interface Monster {
  id: string;
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
  svgData: string | null;
  month: number;
  year: number;
  timesDefeated: number;
  totalEncounters: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserMonsterKill {
  id: string;
  userId: string;
  monsterId: string;
  killedAt: Date | string;
  margin: BattleMargin;
  roundsWon: number;
  monster?: Monster;
}

// ============================================================
// Battle Interfaces
// ============================================================

export interface BattleMargin {
  power: number;
  titan: number;
  precision: number;
  endurance: number;
  vitality: number;
  synthesis: number;
  overall: number;
}

export interface BattleRound {
  discipline: Discipline;
  playerScore: number;
  monsterScore: number;
  playerWon: boolean;
  margin: number;
}

export interface BattleResult {
  monsterId: string;
  monsterName: string;
  playerWon: boolean;
  roundsWon: number;
  roundsLost: number;
  rounds: BattleRound[];
  margin: BattleMargin;
  xpGained: Record<Discipline, number>;
  newKill: boolean;
}

// ============================================================
// Leaderboard Interfaces
// ============================================================

export interface LeaderboardEntry {
  id: string;
  userId: string;
  totalPowerScore: number;
  league: League;
  totalLevel: number;
  lastActive: Date | string;
  weekRankDelta: number;
  prevWeekRank: number | null;
  isPublic: boolean;
  compositionMult: number;
  rawPowerScore: number;
  updatedAt: Date | string;
  user?: Pick<UserProfile, "id" | "username" | "avatarUrl">;
}

export interface LeaderboardRow extends LeaderboardEntry {
  rank: number;
  username: string;
  avatarUrl: string | null;
}

// ============================================================
// Tournament Interfaces
// ============================================================

export interface Tournament {
  id: string;
  month: number;
  year: number;
  league: League;
  startedAt: Date | string;
  endedAt: Date | string | null;
  isComplete: boolean;
  results?: TournamentResult[];
}

export interface TournamentResult {
  id: string;
  tournamentId: string;
  userId: string;
  powerScoreAtTime: number;
  monstersDefeated: number;
  bossDefeated: boolean;
  rankInLeague: number | null;
  previousLeague: League;
  newLeague: League;
  wasPromoted: boolean;
  wasRelegated: boolean;
  slayerBadge: boolean;
  createdAt: Date | string;
}

// ============================================================
// Achievement Interfaces
// ============================================================

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Date | string;
  achievement?: Achievement;
}

// ============================================================
// Daily Quest Interfaces
// ============================================================

export interface QuestRequirement {
  type: "sets" | "reps" | "weight" | "duration" | "sessions" | "discipline";
  discipline?: Discipline;
  value: number;
  unit?: string;
}

export interface DailyQuest {
  id: string;
  date: Date | string;
  key: string;
  description: string;
  requirement: QuestRequirement;
  xpReward: number;
}

export interface UserDailyQuest {
  id: string;
  userId: string;
  questId: string;
  progress: number;
  isComplete: boolean;
  completedAt: Date | string | null;
  quest?: DailyQuest;
}

// ============================================================
// XP & Levelling
// ============================================================

export interface XPGainResult {
  discipline: Discipline;
  xpBefore: number;
  xpAfter: number;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  didLevelUp: boolean;
  newRankBadge?: RankBadge;
}

export interface SessionXPSummary {
  results: XPGainResult[];
  totalXPGained: number;
  levelUps: Array<{ discipline: Discipline; newLevel: number }>;
}

// ============================================================
// API Response Wrappers
// ============================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================
// Auth
// ============================================================

export interface AuthTokenPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  gender?: string;
  unitsPreference?: "kg" | "lbs";
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

// ============================================================
// Global Stats
// ============================================================

export interface GlobalStats {
  id: string;
  key: string;
  value: number;
  updatedAt: Date | string;
}

// ============================================================
// Utility Types
// ============================================================

export type DisciplineMap<T> = Record<Discipline, T>;

export type LeagueConfig = {
  league: League;
  minPowerScore: number;
  maxPowerScore: number;
  color: string;
  label: string;
};

export const LEAGUE_ORDER: League[] = [
  League.IRON,
  League.AWAKENING,
  League.BRONZE,
  League.SILVER,
  League.GOLD,
  League.MYTHIC,
];

export const DISCIPLINE_LABELS: DisciplineMap<string> = {
  [Discipline.POWER]: "Power",
  [Discipline.TITAN]: "Titan",
  [Discipline.PRECISION]: "Precision",
  [Discipline.ENDURANCE]: "Endurance",
  [Discipline.VITALITY]: "Vitality",
  [Discipline.SYNTHESIS]: "Synthesis",
};

export const RANK_BADGE_LABELS: Record<RankBadge, string> = {
  [RankBadge.IRON_BODY]: "Iron Body",
  [RankBadge.BRONZE_WARRIOR]: "Bronze Warrior",
  [RankBadge.SILVER_CHAMPION]: "Silver Champion",
  [RankBadge.GOLD_TITAN]: "Gold Titan",
  [RankBadge.PLATINUM_SOVEREIGN]: "Platinum Sovereign",
  [RankBadge.MYTHIC_ARCHON]: "Mythic Archon",
};
