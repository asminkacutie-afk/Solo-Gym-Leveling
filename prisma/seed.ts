import { PrismaClient, Discipline, MonsterTier, League, RankBadge } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Exercise Library ────────────────────────────────────────────────────────

const EXERCISES = [
  // POWER — Chest
  { name: 'Barbell Bench Press',       discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['chest', 'triceps', 'front-delts'] },
  { name: 'Incline Bench Press',        discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['upper-chest', 'triceps'] },
  { name: 'Decline Bench Press',        discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['lower-chest', 'triceps'] },
  { name: 'Dumbbell Bench Press',       discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['chest', 'triceps'] },
  { name: 'Dumbbell Flyes',             discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['chest'] },
  { name: 'Cable Crossover',            discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['chest'] },
  { name: 'Chest Dips',                 discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['chest', 'triceps'] },
  { name: 'Push-ups',                   discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['chest', 'triceps'] },
  { name: 'Incline Dumbbell Flyes',     discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['upper-chest'] },
  { name: 'Pec Deck',                   discipline: Discipline.POWER,     category: 'Chest',    muscleGroups: ['chest'] },
  // POWER — Back
  { name: 'Barbell Row',                discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lats', 'traps', 'biceps'] },
  { name: 'Dumbbell Row',               discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lats', 'rhomboids'] },
  { name: 'Seated Cable Row',           discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lats', 'mid-back'] },
  { name: 'T-Bar Row',                  discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lats', 'traps'] },
  { name: 'Lat Pulldown',               discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lats', 'biceps'] },
  { name: 'Pull-ups',                   discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lats', 'biceps'] },
  { name: 'Chin-ups',                   discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lats', 'biceps'] },
  { name: 'Face Pulls',                 discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['rear-delts', 'traps'] },
  { name: 'Deadlift',                   discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lower-back', 'glutes', 'hamstrings', 'traps'] },
  { name: 'Romanian Deadlift',          discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['hamstrings', 'lower-back', 'glutes'] },
  { name: 'Sumo Deadlift',              discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['glutes', 'inner-thighs', 'lower-back'] },
  { name: 'Rack Pull',                  discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['traps', 'lower-back'] },
  { name: 'Hyperextensions',            discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lower-back', 'glutes'] },
  { name: 'Meadows Row',                discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lats', 'rhomboids'] },
  { name: 'Wide-Grip Pulldown',         discipline: Discipline.POWER,     category: 'Back',     muscleGroups: ['lats'] },

  // TITAN — Legs/Glutes
  { name: 'Barbell Back Squat',         discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['quads', 'glutes', 'hamstrings'] },
  { name: 'Front Squat',                discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['quads', 'core'] },
  { name: 'Hack Squat',                 discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['quads', 'glutes'] },
  { name: 'Leg Press',                  discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['quads', 'glutes', 'hamstrings'] },
  { name: 'Bulgarian Split Squat',      discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['quads', 'glutes'] },
  { name: 'Walking Lunges',             discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['quads', 'glutes'] },
  { name: 'Reverse Lunges',             discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['glutes', 'quads'] },
  { name: 'Step-ups',                   discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['quads', 'glutes'] },
  { name: 'Leg Extension',              discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['quads'] },
  { name: 'Leg Curl',                   discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['hamstrings'] },
  { name: 'Seated Leg Curl',            discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['hamstrings'] },
  { name: 'Nordic Curl',                discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['hamstrings'] },
  { name: 'Glute Bridge',               discipline: Discipline.TITAN,     category: 'Glutes',   muscleGroups: ['glutes'] },
  { name: 'Barbell Hip Thrust',         discipline: Discipline.TITAN,     category: 'Glutes',   muscleGroups: ['glutes', 'hamstrings'] },
  { name: 'Cable Kickback',             discipline: Discipline.TITAN,     category: 'Glutes',   muscleGroups: ['glutes'] },
  { name: 'Donkey Kicks',               discipline: Discipline.TITAN,     category: 'Glutes',   muscleGroups: ['glutes'] },
  { name: 'Calf Raises',                discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['calves'] },
  { name: 'Seated Calf Raises',         discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['soleus', 'calves'] },
  { name: 'Goblet Squat',               discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['quads', 'core'] },
  { name: 'Sumo Squat',                 discipline: Discipline.TITAN,     category: 'Legs',     muscleGroups: ['inner-thighs', 'glutes'] },

  // PRECISION — Shoulders/Arms
  { name: 'Overhead Press',             discipline: Discipline.PRECISION, category: 'Shoulders', muscleGroups: ['front-delts', 'triceps'] },
  { name: 'Arnold Press',               discipline: Discipline.PRECISION, category: 'Shoulders', muscleGroups: ['all-delts', 'triceps'] },
  { name: 'Dumbbell Shoulder Press',    discipline: Discipline.PRECISION, category: 'Shoulders', muscleGroups: ['front-delts', 'triceps'] },
  { name: 'Lateral Raises',             discipline: Discipline.PRECISION, category: 'Shoulders', muscleGroups: ['side-delts'] },
  { name: 'Front Raises',               discipline: Discipline.PRECISION, category: 'Shoulders', muscleGroups: ['front-delts'] },
  { name: 'Rear Delt Flyes',            discipline: Discipline.PRECISION, category: 'Shoulders', muscleGroups: ['rear-delts'] },
  { name: 'Cable Lateral Raise',        discipline: Discipline.PRECISION, category: 'Shoulders', muscleGroups: ['side-delts'] },
  { name: 'Shrugs',                     discipline: Discipline.PRECISION, category: 'Shoulders', muscleGroups: ['traps'] },
  { name: 'Upright Row',                discipline: Discipline.PRECISION, category: 'Shoulders', muscleGroups: ['side-delts', 'traps'] },
  { name: 'Barbell Curl',               discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['biceps'] },
  { name: 'Dumbbell Curl',              discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['biceps'] },
  { name: 'Hammer Curl',                discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['biceps', 'brachialis'] },
  { name: 'Preacher Curl',              discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['biceps'] },
  { name: 'Cable Curl',                 discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['biceps'] },
  { name: 'Incline Dumbbell Curl',      discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['biceps'] },
  { name: 'Concentration Curl',         discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['biceps'] },
  { name: 'Tricep Pushdown',            discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['triceps'] },
  { name: 'Skull Crushers',             discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['triceps'] },
  { name: 'Overhead Tricep Extension',  discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['triceps'] },
  { name: 'Close-Grip Bench Press',     discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['triceps', 'chest'] },
  { name: 'Tricep Kickback',            discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['triceps'] },
  { name: 'Diamond Push-ups',           discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['triceps', 'chest'] },
  { name: 'Cable Rope Pushdown',        discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['triceps'] },
  { name: 'EZ-Bar Curl',                discipline: Discipline.PRECISION, category: 'Arms',      muscleGroups: ['biceps'] },

  // ENDURANCE — Core
  { name: 'Plank',                      discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['core', 'abs'] },
  { name: 'Side Plank',                 discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['obliques', 'core'] },
  { name: 'Ab Wheel Rollout',           discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['abs', 'core'] },
  { name: 'Hanging Leg Raise',          discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['lower-abs', 'hip-flexors'] },
  { name: 'Cable Crunch',               discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['abs'] },
  { name: 'Decline Sit-ups',            discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['abs'] },
  { name: 'Russian Twists',             discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['obliques'] },
  { name: 'Pallof Press',               discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['core', 'obliques'] },
  { name: "Farmer's Walk",              discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['core', 'traps', 'grip'] },
  { name: 'Suitcase Carry',             discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['obliques', 'core'] },
  { name: 'Hollow Body Hold',           discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['abs', 'core'] },
  { name: 'Dragon Flag',                discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['abs', 'core'] },
  { name: 'L-Sit',                      discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['abs', 'hip-flexors'] },
  { name: 'V-ups',                      discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['abs'] },
  { name: 'Bicycle Crunch',             discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['obliques', 'abs'] },
  { name: 'Dead Bug',                   discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['core', 'abs'] },
  { name: 'Copenhagen Plank',           discipline: Discipline.ENDURANCE, category: 'Core',     muscleGroups: ['adductors', 'core'] },

  // VITALITY — Cardio
  { name: 'Running',                    discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['legs', 'cardiovascular'] },
  { name: 'Treadmill Walk',             discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['legs', 'cardiovascular'] },
  { name: 'Cycling',                    discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['quads', 'cardiovascular'] },
  { name: 'Stationary Bike',            discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['quads', 'cardiovascular'] },
  { name: 'Rowing Machine',             discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['back', 'legs', 'cardiovascular'] },
  { name: 'Elliptical',                 discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['legs', 'cardiovascular'] },
  { name: 'Jump Rope',                  discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['calves', 'cardiovascular'] },
  { name: 'Swimming',                   discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['full-body', 'cardiovascular'] },
  { name: 'Stair Climber',              discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['quads', 'glutes', 'cardiovascular'] },
  { name: 'HIIT Intervals',             discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['full-body', 'cardiovascular'] },
  { name: 'Sprint Intervals',           discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['legs', 'cardiovascular'] },
  { name: 'Assault Bike',               discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['full-body', 'cardiovascular'] },
  { name: 'Ski Erg',                    discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['back', 'arms', 'cardiovascular'] },
  { name: 'Incline Treadmill Walk',     discipline: Discipline.VITALITY,  category: 'Cardio',   muscleGroups: ['glutes', 'calves', 'cardiovascular'] },

  // SYNTHESIS — Full Body / Compound
  { name: 'Clean and Jerk',             discipline: Discipline.SYNTHESIS, category: 'Olympic',  muscleGroups: ['full-body'] },
  { name: 'Snatch',                     discipline: Discipline.SYNTHESIS, category: 'Olympic',  muscleGroups: ['full-body'] },
  { name: 'Power Clean',                discipline: Discipline.SYNTHESIS, category: 'Olympic',  muscleGroups: ['full-body', 'posterior-chain'] },
  { name: 'Push Press',                 discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['shoulders', 'legs'] },
  { name: 'Thruster',                   discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['quads', 'shoulders'] },
  { name: 'Kettlebell Swing',           discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['glutes', 'hamstrings', 'core'] },
  { name: 'Turkish Get-up',             discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['full-body', 'core'] },
  { name: 'Burpees',                    discipline: Discipline.SYNTHESIS, category: 'HIIT',     muscleGroups: ['full-body'] },
  { name: 'Box Jumps',                  discipline: Discipline.SYNTHESIS, category: 'Plyometric', muscleGroups: ['quads', 'glutes', 'calves'] },
  { name: 'Wall Balls',                 discipline: Discipline.SYNTHESIS, category: 'HIIT',     muscleGroups: ['quads', 'shoulders', 'core'] },
  { name: 'Double Unders',              discipline: Discipline.SYNTHESIS, category: 'HIIT',     muscleGroups: ['calves', 'cardiovascular'] },
  { name: 'Battle Ropes',               discipline: Discipline.SYNTHESIS, category: 'HIIT',     muscleGroups: ['arms', 'shoulders', 'core'] },
  { name: 'Bear Crawl',                 discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['core', 'shoulders', 'quads'] },
  { name: 'Sandbag Carry',              discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['full-body', 'core'] },
  { name: 'Sled Push',                  discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['quads', 'glutes', 'calves'] },
  { name: 'Sled Pull',                  discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['hamstrings', 'glutes'] },
  { name: 'Tire Flip',                  discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['full-body', 'posterior-chain'] },
  { name: 'Atlas Stone',                discipline: Discipline.SYNTHESIS, category: 'Strongman', muscleGroups: ['full-body'] },
  { name: "Farmer's Walk Heavy",        discipline: Discipline.SYNTHESIS, category: 'Strongman', muscleGroups: ['traps', 'core', 'grip'] },
  { name: 'Zercher Squat',              discipline: Discipline.SYNTHESIS, category: 'Compound', muscleGroups: ['quads', 'core', 'biceps'] },
  { name: 'Man Maker',                  discipline: Discipline.SYNTHESIS, category: 'HIIT',     muscleGroups: ['full-body'] },
  { name: 'Devil Press',                discipline: Discipline.SYNTHESIS, category: 'HIIT',     muscleGroups: ['full-body'] },
]

// ─── Achievements ────────────────────────────────────────────────────────────

const ACHIEVEMENTS = [
  // First steps
  { key: 'first_session',       name: 'First Blood',           description: 'Complete your first workout session',         icon: '⚔️',  xpReward: 50  },
  { key: 'first_pr',            name: 'Awakened Potential',    description: 'Set your first personal record',              icon: '💥',  xpReward: 100 },
  { key: 'first_monster_kill',  name: 'Monster Slayer',        description: 'Defeat your first monster',                   icon: '🗡️',  xpReward: 150 },
  { key: 'profile_complete',    name: 'Identity Forged',       description: 'Complete your hunter profile',                icon: '🪪',  xpReward: 50  },

  // Session milestones
  { key: 'sessions_10',         name: 'Consistent',            description: 'Complete 10 workout sessions',                icon: '📅',  xpReward: 100 },
  { key: 'sessions_50',         name: 'Hardened',              description: 'Complete 50 workout sessions',                icon: '🔥',  xpReward: 300 },
  { key: 'sessions_100',        name: 'Century Hunter',        description: 'Complete 100 workout sessions',               icon: '💯',  xpReward: 500 },
  { key: 'sessions_250',        name: 'Iron Will',             description: 'Complete 250 workout sessions',               icon: '🏆',  xpReward: 1000},
  { key: 'sessions_500',        name: 'Ascendant',             description: 'Complete 500 workout sessions',               icon: '🌟',  xpReward: 2000},

  // Streak achievements
  { key: 'streak_4_weeks',      name: 'Consistency Gate',      description: 'Maintain a 4-week training streak',           icon: '📊',  xpReward: 200 },
  { key: 'streak_8_weeks',      name: 'Unbroken Chain',        description: 'Maintain an 8-week training streak',          icon: '⛓️',  xpReward: 400 },
  { key: 'streak_12_weeks',     name: 'Unstoppable',           description: 'Maintain a 12-week training streak',          icon: '🔱',  xpReward: 750 },
  { key: 'streak_26_weeks',     name: 'Half-Year Warrior',     description: 'Maintain a 26-week training streak',          icon: '🌊',  xpReward: 1500},

  // Discipline level milestones
  { key: 'any_disc_10',         name: 'Awakening',             description: 'Reach level 10 in any discipline',            icon: '💫',  xpReward: 200 },
  { key: 'any_disc_20',         name: 'Rising Power',          description: 'Reach level 20 in any discipline',            icon: '⚡',  xpReward: 400 },
  { key: 'any_disc_30',         name: 'Champion\'s Road',      description: 'Reach level 30 in any discipline',            icon: '🏅',  xpReward: 750 },
  { key: 'any_disc_40',         name: 'Titan\'s Path',         description: 'Reach level 40 in any discipline',            icon: '👑',  xpReward: 1500},
  { key: 'any_disc_50',         name: 'Mythic Archon',         description: 'Max out a discipline to level 50',            icon: '🔮',  xpReward: 5000},
  { key: 'all_disc_10',         name: 'Balanced Hunter',       description: 'Reach level 10 in all 6 disciplines',         icon: '⚖️',  xpReward: 500 },
  { key: 'all_disc_20',         name: 'Complete Warrior',      description: 'Reach level 20 in all 6 disciplines',         icon: '🛡️',  xpReward: 1000},

  // PR milestones
  { key: 'prs_5',               name: 'On a Roll',             description: 'Set 5 personal records',                      icon: '🎯',  xpReward: 100 },
  { key: 'prs_25',              name: 'Record Breaker',        description: 'Set 25 personal records',                     icon: '💪',  xpReward: 300 },
  { key: 'prs_100',             name: 'Limitless',             description: 'Set 100 personal records',                    icon: '🚀',  xpReward: 1000},

  // Monster milestones
  { key: 'monsters_5',          name: 'Predator',              description: 'Defeat 5 monsters',                           icon: '🐺',  xpReward: 200 },
  { key: 'monsters_20',         name: 'Hunter S-Rank',         description: 'Defeat 20 monsters',                          icon: '💀',  xpReward: 500 },
  { key: 'monsters_50',         name: 'Apex Hunter',           description: 'Defeat 50 monsters',                          icon: '👹',  xpReward: 1500},
  { key: 'beat_rare_monster',   name: 'Rare Slayer',           description: 'Defeat a Rare-tier monster',                  icon: '🟢',  xpReward: 200 },
  { key: 'beat_epic_monster',   name: 'Epic Slayer',           description: 'Defeat an Epic-tier monster',                 icon: '🟣',  xpReward: 500 },
  { key: 'beat_legendary_monster', name: 'Legendary Slayer',  description: 'Defeat a Legendary-tier monster',             icon: '🟠',  xpReward: 1000},
  { key: 'beat_ancient_monster', name: 'Ancient Slayer',       description: 'Defeat an Ancient-tier monster',              icon: '🔴',  xpReward: 3000},
  { key: 'beat_boss',           name: 'Boss Slayer',           description: 'Defeat a tournament Boss Monster',            icon: '💎',  xpReward: 2000},

  // League progression
  { key: 'reach_bronze',        name: 'Bronze Awakening',      description: 'Advance to Bronze League',                    icon: '🔶',  xpReward: 300 },
  { key: 'reach_silver',        name: 'Silver Ascent',         description: 'Advance to Silver League',                    icon: '⚪',  xpReward: 600 },
  { key: 'reach_gold',          name: 'Golden Gate',           description: 'Advance to Gold League',                      icon: '👑',  xpReward: 1500},
  { key: 'reach_mythic',        name: 'Mythic Sovereign',      description: 'Advance to Mythic League',                    icon: '🔮',  xpReward: 5000},

  // Slayer badges (monthly)
  { key: 'slayer_2026_01',      name: 'Slayer: Jan 2026',      description: 'Defeated the Boss Monster in January 2026',   icon: '🗡️',  xpReward: 500 },
  { key: 'slayer_2026_02',      name: 'Slayer: Feb 2026',      description: 'Defeated the Boss Monster in February 2026',  icon: '🗡️',  xpReward: 500 },
  { key: 'slayer_2026_03',      name: 'Slayer: Mar 2026',      description: 'Defeated the Boss Monster in March 2026',     icon: '🗡️',  xpReward: 500 },

  // Body composition
  { key: 'first_body_comp',     name: 'Know Thyself',          description: 'Log your first body composition measurement',  icon: '📏',  xpReward: 75  },
  { key: 'recomposition_1mo',   name: 'Recomposition',         description: 'Lose 1%+ BF while maintaining strength',      icon: '⚗️',  xpReward: 300 },
  { key: 'bf_gate_silver',      name: 'Lean Silver',           description: 'Meet the Silver League body fat requirement',  icon: '💧',  xpReward: 500 },
  { key: 'bf_gate_gold',        name: 'Lean Gold',             description: 'Meet the Gold League body fat requirement',    icon: '✨',  xpReward: 1000},
  { key: 'bf_gate_mythic',      name: 'Olympian Form',         description: 'Meet the Mythic League body fat requirement',  icon: '🏛️',  xpReward: 2000},

  // Daily quests
  { key: 'quests_7_days',       name: 'Quest Streak',          description: 'Complete all daily quests 7 days in a row',   icon: '📋',  xpReward: 300 },
  { key: 'quests_30_days',      name: 'Disciplined Mind',      description: 'Complete all daily quests 30 days in a row',  icon: '🧠',  xpReward: 1000},

  // Social
  { key: 'leaderboard_top10',   name: 'Top 10',                description: 'Reach the global top 10 leaderboard',         icon: '🎖️',  xpReward: 1000},
  { key: 'leaderboard_top1',    name: '#1 Hunter',             description: 'Reach #1 on the global leaderboard',          icon: '🥇',  xpReward: 5000},

  // Rested bonus
  { key: 'comeback',            name: 'Comeback',              description: 'Return after 7+ days and claim Rested Bonus',  icon: '😴',  xpReward: 100 },
]

// ─── Monster Generation ──────────────────────────────────────────────────────

const PREFIXES = ['Iron', 'Shadow', 'Cursed', 'Void', 'Ancient', 'Corrupted', 'Infernal', 'Abyssal', 'Spectral', 'Forsaken']
const NOUNS    = ['Golem', 'Wraith', 'Behemoth', 'Titan', 'Colossus', 'Devourer', 'Sentinel', 'Reaper', 'Leviathan', 'Juggernaut']
const SUFFIXES = ['of the Void', 'the Relentless', 'of Eternal Darkness', 'the Unyielding', 'of the Cursed Plateau',
                  'the Indomitable', 'of Shadow Realm', 'the Unbroken', 'of Forbidden Depths', 'the Eternal']

function monsterName(): string {
  const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
  return `${p} ${n} ${s}`
}

const LEAGUE_BASE: Record<League, number> = {
  [League.IRON]:      15,
  [League.AWAKENING]: 22,
  [League.BRONZE]:    35,
  [League.SILVER]:    55,
  [League.GOLD]:      80,
  [League.MYTHIC]:    120,
}

const TIER_MULT: Record<MonsterTier, number> = {
  [MonsterTier.COMMON]:    0.8,
  [MonsterTier.RARE]:      1.0,
  [MonsterTier.EPIC]:      1.3,
  [MonsterTier.LEGENDARY]: 1.7,
  [MonsterTier.ANCIENT]:   2.2,
}

// League → which tiers to spawn (4 monsters per league)
const LEAGUE_TIERS: Record<League, MonsterTier[]> = {
  [League.IRON]:      [MonsterTier.COMMON, MonsterTier.COMMON, MonsterTier.COMMON, MonsterTier.RARE],
  [League.AWAKENING]: [MonsterTier.COMMON, MonsterTier.RARE, MonsterTier.RARE, MonsterTier.RARE],
  [League.BRONZE]:    [MonsterTier.RARE, MonsterTier.RARE, MonsterTier.RARE, MonsterTier.EPIC],
  [League.SILVER]:    [MonsterTier.EPIC, MonsterTier.EPIC, MonsterTier.EPIC, MonsterTier.LEGENDARY],
  [League.GOLD]:      [MonsterTier.LEGENDARY, MonsterTier.LEGENDARY, MonsterTier.LEGENDARY, MonsterTier.ANCIENT],
  [League.MYTHIC]:    [MonsterTier.ANCIENT, MonsterTier.ANCIENT, MonsterTier.ANCIENT, MonsterTier.ANCIENT],
}

function makeMonster(league: League, tier: MonsterTier, month: number, year: number) {
  const base = LEAGUE_BASE[league]
  const mult = TIER_MULT[tier]
  const jitter = () => base * mult * (0.9 + Math.random() * 0.2)
  return {
    name:          monsterName(),
    tier,
    league,
    powerStat:     jitter(),
    titanStat:     jitter(),
    precisionStat: jitter(),
    enduranceStat: jitter(),
    vitalityStat:  jitter(),
    synthesisStat: jitter(),
    densityStat:   tier === MonsterTier.ANCIENT ? 0.95 : 0.85 + Math.random() * 0.1,
    difficultyMult: mult,
    month,
    year,
    isActive: true,
  }
}

// ─── Main Seed ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting GymRPG seed...')
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // 1. Exercises
  console.log(`  📚 Seeding ${EXERCISES.length} exercises...`)
  for (const ex of EXERCISES) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: { ...ex, isBuiltIn: true },
    })
  }
  console.log('  ✅ Exercises done')

  // 2. Achievements
  console.log(`  🏆 Seeding ${ACHIEVEMENTS.length} achievements...`)
  for (const ach of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: {},
      create: ach,
    })
  }
  console.log('  ✅ Achievements done')

  // 3. Monsters (4 per league = 24 total)
  console.log('  👹 Seeding monthly monsters...')
  // Deactivate old monsters
  await prisma.monster.updateMany({ where: { isActive: true }, data: { isActive: false } })
  const leagues = Object.values(League)
  for (const league of leagues) {
    const tiers = LEAGUE_TIERS[league]
    for (const tier of tiers) {
      await prisma.monster.create({ data: makeMonster(league, tier, month, year) })
    }
  }
  console.log('  ✅ Monsters done')

  // 4. Demo user
  console.log('  👤 Seeding demo user...')
  const passwordHash = await bcrypt.hash('Demo1234!', 12)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@gymrpg.com' },
    update: {},
    create: {
      email: 'demo@gymrpg.com',
      username: 'ShadowHunter',
      passwordHash,
      isPublic: true,
      gender: 'male',
      emailVerified: true,
    },
  })

  // All 6 disciplines at level 5
  const disciplines = Object.values(Discipline)
  for (const discipline of disciplines) {
    await prisma.userDiscipline.upsert({
      where: { userId_discipline: { userId: demoUser.id, discipline } },
      update: {},
      create: {
        userId: demoUser.id,
        discipline,
        level: 5,
        xp: 350,
        xpToNext: 100,
        str: 60 + Math.random() * 40,
        end: 2000 + Math.random() * 3000,
        pwr: 70 + Math.random() * 30,
        spd: 2 + Math.random() * 2,
        rec: 70 + Math.random() * 25,
        rankBadge: RankBadge.IRON_BODY,
      },
    })
  }

  // Leaderboard entry
  await prisma.leaderboardEntry.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      totalPowerScore: 320,
      rawPowerScore: 320,
      league: League.IRON,
      totalLevel: 30,
      isPublic: true,
      compositionMult: 1.0,
    },
  })

  // Streak
  await prisma.userStreak.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      currentWeekSessions: 2,
      weeklyStreak: 3,
    },
  })

  // First-steps achievements
  const firstAchs = ['first_session', 'first_pr', 'sessions_10', 'any_disc_10', 'first_body_comp']
  for (const key of firstAchs) {
    const ach = await prisma.achievement.findUnique({ where: { key } })
    if (ach) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId: demoUser.id, achievementId: ach.id } },
        update: {},
        create: { userId: demoUser.id, achievementId: ach.id },
      })
    }
  }

  console.log('  ✅ Demo user done — demo@gymrpg.com / Demo1234!')
  console.log('\n🎮 Seed complete!')
  console.log(`   ${EXERCISES.length} exercises | ${ACHIEVEMENTS.length} achievements | ${leagues.length * 4} monsters | 1 demo user`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
