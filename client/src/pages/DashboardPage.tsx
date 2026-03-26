import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Flame, Trophy, Zap, ChevronRight, Skull, Calendar } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { quests, monsters, workouts } from '../lib/api'
import type { Quest, Monster, WorkoutSession } from '../lib/api'
import DisciplineCard from '../components/character/DisciplineCard'
import MonsterCard from '../components/monsters/MonsterCard'
import {
  cn,
  leagueBadgeClass,
  leagueBadgeEmoji,
  calculateLevelProgress,
  formatXP,
  timeAgo,
} from '../lib/utils'

// ─── Stat tile ─────────────────────────────────────────────────────────────
function StatTile({
  icon,
  label,
  value,
  sub,
  color = 'purple',
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: 'purple' | 'gold' | 'green' | 'cyan'
}) {
  const colorMap = {
    purple: 'text-purple-400 bg-purple-500/10',
    gold: 'text-gold-400 bg-gold-500/10',
    green: 'text-green-400 bg-green-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  }
  return (
    <div className="card-glow rounded-xl bg-background-card p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colorMap[color])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-gray-100 font-display">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Quest card ─────────────────────────────────────────────────────────────
function QuestCard({ quest }: { quest: Quest }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100))
  return (
    <div className={cn('card-glow rounded-xl bg-background-card p-4', quest.completed && 'opacity-60')}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-100">{quest.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{quest.description}</p>
        </div>
        {quest.completed && (
          <span className="text-green-400 text-xs font-bold shrink-0">✓ DONE</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-background-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {quest.progress}/{quest.target}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{quest.discipline ?? 'Any'}</span>
        <span className="text-xs text-gold-400 font-semibold">+{formatXP(quest.xpReward)}</span>
      </div>
    </div>
  )
}

// ─── Session row ────────────────────────────────────────────────────────────
function SessionRow({ session }: { session: WorkoutSession }) {
  const totalSets = session.sets?.length ?? 0
  const totalVolume = session.sets?.reduce((acc, s) => acc + s.weight * s.reps, 0) ?? 0
  const disciplines = [...new Set(session.sets?.map((s) => s.discipline) ?? [])]

  return (
    <div className="flex items-center gap-4 py-3 border-b border-background-border last:border-0">
      <div className="w-9 h-9 rounded-lg bg-purple-700/20 border border-purple-600/30 flex items-center justify-center flex-shrink-0">
        <Dumbbell size={16} className="text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100">
          {session.endedAt
            ? timeAgo(session.startedAt)
            : <span className="text-green-400">Active now</span>}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {totalSets} sets · {totalVolume.toFixed(0)} kg volume
        </p>
      </div>
      <div className="flex gap-1">
        {disciplines.slice(0, 2).map((d) => (
          <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-background-secondary text-gray-400 border border-background-border capitalize">
            {d}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── DashboardPage ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [dailyQuests, setDailyQuests] = useState<Quest[]>([])
  const [activeMonsters, setActiveMonsters] = useState<Monster[]>([])
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      quests.getToday().catch(() => []),
      monsters.getForLeague(user.league).catch(() => []),
      workouts.getSessions(3).catch(() => []),
    ]).then(([q, m, s]) => {
      setDailyQuests(q)
      setActiveMonsters(m.slice(0, 3))
      setRecentSessions(s)
      setLoading(false)
    })
  }, [user])

  if (!user) return null

  const totalXP = user.disciplines?.reduce((acc, d) => acc + d.xp, 0) ?? 0
  const totalXPNext = user.disciplines?.reduce((acc, d) => acc + d.xpToNext, 0) ?? 1

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-gray-500 text-sm uppercase tracking-widest font-display">
            Welcome back, Hunter
          </p>
          <h1 className="font-display text-3xl font-bold text-gray-100 mt-1">
            <span className="gradient-text">{user.username}</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={cn('rank-badge', leagueBadgeClass(user.league))}>
              {leagueBadgeEmoji(user.league)} {user.league} League
            </span>
            {user.streak > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-400">
                <Flame size={12} />
                {user.streak} day streak
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/workout')}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto animate-glow-pulse"
        >
          <Dumbbell size={16} />
          Begin Training
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={<Trophy size={18} />}
          label="Total Level"
          value={user.totalLevel}
          sub={`${formatXP(totalXP)} / ${formatXP(totalXPNext)}`}
          color="gold"
        />
        <StatTile
          icon={<Zap size={18} />}
          label="Power Score"
          value={user.powerScore.toLocaleString()}
          color="purple"
        />
        <StatTile
          icon={<Flame size={18} />}
          label="Active Streak"
          value={`${user.streak}d`}
          sub={user.streak >= 7 ? 'On fire!' : 'Keep going'}
          color="green"
        />
        <StatTile
          icon={<Calendar size={18} />}
          label="Sessions"
          value={recentSessions.length}
          sub="recent"
          color="cyan"
        />
      </div>

      {/* Disciplines grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-gray-100">Disciplines</h2>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(user.disciplines ?? []).map((disc) => (
            <DisciplineCard key={disc.id} discipline={disc} />
          ))}
        </div>
      </section>

      {/* Daily quests + Monsters row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily quests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Zap size={16} className="text-gold-400" />
              Daily Quests
            </h2>
            <span className="text-xs text-gray-500">
              {dailyQuests.filter((q) => q.completed).length}/{dailyQuests.length} done
            </span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-background-card animate-pulse" />
              ))}
            </div>
          ) : dailyQuests.length === 0 ? (
            <div className="card-glow rounded-xl bg-background-card p-6 text-center text-gray-500">
              No quests available today
            </div>
          ) : (
            <div className="space-y-3">
              {dailyQuests.slice(0, 3).map((q) => (
                <QuestCard key={q.id} quest={q} />
              ))}
            </div>
          )}
        </section>

        {/* Active monsters */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Skull size={16} className="text-red-400" />
              League Monsters
            </h2>
            <button
              onClick={() => navigate('/monsters')}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-background-card animate-pulse" />
              ))}
            </div>
          ) : activeMonsters.length === 0 ? (
            <div className="card-glow rounded-xl bg-background-card p-6 text-center text-gray-500">
              No monsters in your league
            </div>
          ) : (
            <div className="space-y-3">
              {activeMonsters.map((m) => (
                <MonsterCard key={m.id} monster={m} isDefeated={false} compact />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent sessions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-gray-100">
            Recent Sessions
          </h2>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            History <ChevronRight size={14} />
          </button>
        </div>
        <div className="card-glow rounded-xl bg-background-card px-4">
          {loading ? (
            <div className="py-8 text-center text-gray-500 text-sm">Loading sessions...</div>
          ) : recentSessions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">No sessions yet.</p>
              <button
                onClick={() => navigate('/workout')}
                className="mt-3 btn-primary text-sm py-2"
              >
                Start your first workout
              </button>
            </div>
          ) : (
            recentSessions.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </div>
      </section>
    </div>
  )
}
