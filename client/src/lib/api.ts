import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

// ─── Axios instance ────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ─── Request interceptor: attach access token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: handle 401 + token refresh ─────────────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token as string)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true },
        )
        const newToken: string = data.accessToken
        localStorage.setItem('accessToken', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// ─── Types ─────────────────────────────────────────────────────────────────
export interface RegisterPayload {
  username: string
  email: string
  password: string
  gender: 'male' | 'female' | 'other'
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface User {
  id: string
  username: string
  email: string
  gender: string
  totalLevel: number
  powerScore: number
  league: string
  streak: number
  createdAt: string
  disciplines: DisciplineData[]
  bodyComp?: BodyCompEntry | null
}

export interface DisciplineData {
  id: string
  name: string
  level: number
  xp: number
  xpToNext: number
  rank: string
  stats: Record<string, number>
}

export interface LevelUp {
  discipline: string
  oldLevel: number
  newLevel: number
}

export interface WorkoutSession {
  id: string
  userId: string
  startedAt: string
  endedAt?: string
  notes?: string
  sets: WorkoutSet[]
  xpGained?: Record<string, number>
  levelUps?: LevelUp[]
  prs?: PRRecord[]
}

export interface WorkoutSet {
  id?: string
  exerciseId: string
  exerciseName: string
  discipline: string
  weight: number
  reps: number
  rpe?: number
  isPR?: boolean
  sessionId?: string
}

export interface Exercise {
  id: string
  name: string
  discipline: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string
}

export interface PRRecord {
  exerciseId: string
  exerciseName: string
  weight: number
  reps: number
  oneRepMax: number
  date: string
  discipline: string
}

export interface BodyCompEntry {
  id: string
  userId: string
  weight: number
  bodyFat?: number
  method?: string
  recordedAt: string
}

export interface Monster {
  id: string
  name: string
  tier: 'common' | 'rare' | 'epic' | 'legendary' | 'ancient'
  league: string
  stats: Record<string, number>
  totalPower: number
  difficultyMult: number
  loreText?: string
  defeatCount?: number
}

export interface UserMonsterKill {
  monsterId: string
  monsterName: string
  tier: string
  defeatedAt: string
  victoryMargin: number
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  totalLevel: number
  powerScore: number
  league: string
  weekDelta: number
  topDisciplines: { name: string; level: number }[]
  lastActive: string
}

export interface Quest {
  id: string
  title: string
  description: string
  type: string
  target: number
  progress: number
  xpReward: number
  discipline?: string
  expiresAt: string
  completed: boolean
}

export interface Tournament {
  id: string
  league: string
  startsAt: string
  endsAt: string
  status: 'upcoming' | 'active' | 'completed'
  participants: number
  bossMonster?: Monster
  results?: TournamentResult[]
}

export interface TournamentResult {
  rank: number
  userId: string
  username: string
  score: number
  promoted?: boolean
  relegated?: boolean
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => {
    const d = r.data as Record<string, unknown> & {
      leaderboardEntry?: { totalPowerScore?: number; league?: string; totalLevel?: number }
      streakData?: { weeklyStreak?: number }
      disciplines?: Array<{
        id: string; discipline: string; level: number; xp: number; xpToNext: number
        rankBadge: string; str: number; end: number; pwr: number; spd: number; rec: number
      }>
    }
    const disciplines: DisciplineData[] = (d.disciplines ?? []).map((disc) => ({
      id: disc.id,
      name: disc.discipline,
      level: disc.level,
      xp: disc.xp,
      xpToNext: disc.xpToNext,
      rank: disc.rankBadge,
      stats: { str: disc.str, end: disc.end, pwr: disc.pwr, spd: disc.spd, rec: disc.rec },
    }))
    return {
      ...d,
      disciplines,
      totalLevel: d.leaderboardEntry?.totalLevel ?? 6,
      powerScore: d.leaderboardEntry?.totalPowerScore ?? 0,
      league: (d.leaderboardEntry?.league ?? 'IRON') as User['league'],
      streak: d.streakData?.weeklyStreak ?? 0,
    } as User
  }),

  logout: () => api.post<void>('/auth/logout').then((r) => r.data),
}

// ─── Workouts ──────────────────────────────────────────────────────────────
export const workouts = {
  createSession: (notes?: string) =>
    api.post<WorkoutSession>('/workouts/sessions', { notes }).then((r) => r.data),

  endSession: (sessionId: string) =>
    api
      .post<WorkoutSession>(`/workouts/sessions/${sessionId}/end`)
      .then((r) => r.data),

  addSet: (sessionId: string, set: Omit<WorkoutSet, 'id' | 'sessionId'>) =>
    api
      .post<WorkoutSet>(`/workouts/sessions/${sessionId}/sets`, set)
      .then((r) => r.data),

  getSessions: (limit = 20, page = 1) =>
    api
      .get<{ sessions: WorkoutSession[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        '/workouts/sessions',
        { params: { limit, page } },
      )
      .then((r) => r.data.sessions),

  getSession: (sessionId: string) =>
    api.get<WorkoutSession>(`/workouts/sessions/${sessionId}`).then((r) => r.data),
}

// ─── Exercises ─────────────────────────────────────────────────────────────
export const exercises = {
  search: (q: string, limit = 20) =>
    api
      .get<Exercise[]>('/exercises', { params: { q, limit } })
      .then((r) => r.data),

  getByDiscipline: (discipline: string) =>
    api
      .get<Exercise[]>('/exercises', { params: { discipline } })
      .then((r) => r.data),
}

// ─── Profile ───────────────────────────────────────────────────────────────
export const profile = {
  getMe: () => api.get<User>('/profile/me').then((r) => r.data),

  updateMe: (data: Partial<User>) =>
    api.patch<User>('/profile/me', data).then((r) => r.data),

  getRecords: (userId?: string) =>
    api
      .get<PRRecord[]>(`/profile/${userId ?? 'me'}/records`)
      .then((r) => r.data),

  getVolumeHistory: (userId?: string, days = 30) =>
    api
      .get<{ date: string; volume: number }[]>(
        `/profile/${userId ?? 'me'}/volume-history`,
        { params: { days } },
      )
      .then((r) => r.data),

  getMonsterKills: (userId?: string) =>
    api
      .get<UserMonsterKill[]>(`/profile/${userId ?? 'me'}/monster-kills`)
      .then((r) => r.data),
}

// ─── Leaderboard ───────────────────────────────────────────────────────────
export const leaderboard = {
  getGlobal: (limit = 50) =>
    api
      .get<LeaderboardEntry[]>('/leaderboard/global', { params: { limit } })
      .then((r) => r.data),

  getByLeague: (league: string, limit = 50) =>
    api
      .get<LeaderboardEntry[]>(`/leaderboard/league/${league}`, {
        params: { limit },
      })
      .then((r) => r.data),

  getMonsters: () =>
    api.get<Monster[]>('/leaderboard/monsters').then((r) => r.data),
}

// ─── Monsters ──────────────────────────────────────────────────────────────
export const monsters = {
  getForLeague: (league: string) =>
    api.get<Monster[]>(`/monsters`, { params: { league } }).then((r) => r.data),

  getAll: () => api.get<Monster[]>('/monsters/all').then((r) => r.data),

  battle: (monsterId: string) =>
    api
      .post<{ victory: boolean; margin: number; xpGained: number }>(
        `/monsters/${monsterId}/battle`,
      )
      .then((r) => r.data),
}

// ─── Quests ────────────────────────────────────────────────────────────────
export const quests = {
  getToday: () => api.get<Quest[]>('/quests/today').then((r) => r.data),

  updateProgress: (questId: string, progress: number) =>
    api
      .patch<Quest>(`/quests/${questId}/progress`, { progress })
      .then((r) => r.data),
}

// ─── Body Composition ──────────────────────────────────────────────────────
export const bodyComp = {
  log: (data: { weight: number; bodyFat?: number; method?: string }) =>
    api.post<BodyCompEntry>('/body-comp', data).then((r) => r.data),

  getHistory: (days = 90) =>
    api
      .get<BodyCompEntry[]>('/body-comp/history', { params: { days } })
      .then((r) => r.data),

  getGates: () =>
    api
      .get<{ league: string; maxBodyFat: number; met: boolean }[]>(
        '/body-comp/gates',
      )
      .then((r) => r.data),

  navyCalc: (measurements: {
    neck: number
    waist: number
    hip?: number
    height: number
    gender: string
  }) =>
    api
      .post<{ bodyFatPct: number }>('/body-comp/navy-calc', measurements)
      .then((r) => r.data),
}

// ─── Tournaments ───────────────────────────────────────────────────────────
export const tournaments = {
  getCurrent: () =>
    api.get<Tournament[]>('/tournaments/current').then((r) => r.data),

  getHistory: (limit = 6) =>
    api
      .get<Tournament[]>('/tournaments/history', { params: { limit } })
      .then((r) => r.data),
}

export default api
