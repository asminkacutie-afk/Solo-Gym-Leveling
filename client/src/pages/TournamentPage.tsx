import { useEffect, useState, lazy, Suspense } from 'react'
import { ChevronDown, ChevronUp, Swords, Trophy, Crown, TrendingUp, TrendingDown } from 'lucide-react'
import { tournaments } from '../lib/api'
import type { Tournament, TournamentResult } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import MonsterCard from '../components/monsters/MonsterCard'
import { cn, leagueBadgeClass, leagueBadgeEmoji, formatDate } from '../lib/utils'
const ArenaBg = lazy(() => import('../components/arena/ArenaBg'))
const MonsterIllustration = lazy(() => import('../components/monsters/MonsterIllustration'))

// ─── Tournament status card ────────────────────────────────────────────────
function TournamentStatusCard({ t }: { t: Tournament }) {
  const now = new Date()
  const start = new Date(t.startsAt)
  const end = new Date(t.endsAt)
  const isActive = t.status === 'active'
  const isUpcoming = t.status === 'upcoming'
  const isCompleted = t.status === 'completed'

  const daysLeft = isActive
    ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000))
    : 0
  const daysUntil = isUpcoming
    ? Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 86400000))
    : 0

  return (
    <div
      className={cn(
        'card-glow rounded-2xl bg-background-card overflow-hidden',
        isActive && 'border border-gold-500/30 shadow-gold-glow-sm',
      )}
    >
      {/* Arena background banner */}
      <div className="relative h-28 overflow-hidden">
        <Suspense fallback={<div className="h-full bg-background-secondary" />}>
          <ArenaBg
            league={t.league as any}
            width={800}
            height={112}
            animated={isActive}
            intensity={isActive ? 'combat' : 'calm'}
            className="w-full h-full"
          />
        </Suspense>
        {/* Overlay gradient so content below is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-card" />
        {/* Active LIVE badge floating over arena */}
        {isActive && (
          <div className="absolute top-3 left-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-ping-slow" />
            <span className="text-xs font-bold text-green-400 tracking-widest font-display">LIVE</span>
          </div>
        )}
      </div>
      <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('rank-badge', leagueBadgeClass(t.league))}>
              {leagueBadgeEmoji(t.league)} {t.league} League
            </span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-semibold',
                isActive && 'bg-green-500/20 text-green-400 border border-green-500/30',
                isUpcoming && 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                isCompleted && 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
              )}
            >
              {isActive ? '● LIVE' : isUpcoming ? 'Upcoming' : 'Completed'}
            </span>
          </div>
          <h3 className="font-display text-xl font-bold text-gray-100">
            {t.league} League Tournament
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {formatDate(t.startsAt)} — {formatDate(t.endsAt)}
          </p>
        </div>

        <div className="text-right">
          {isActive && (
            <div className="text-center">
              <p className="font-display text-4xl font-black text-gold-400">{daysLeft}</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest">days left</p>
            </div>
          )}
          {isUpcoming && (
            <div className="text-center">
              <p className="font-display text-4xl font-black text-blue-400">{daysUntil}</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest">days until</p>
            </div>
          )}
          {isCompleted && (
            <div className="text-center">
              <Trophy size={32} className="text-gold-400 mx-auto" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-background-secondary rounded-xl p-3 text-center">
          <p className="font-bold text-gray-100 text-lg">{t.participants}</p>
          <p className="text-xs text-gray-500">Participants</p>
        </div>
        <div className="bg-background-secondary rounded-xl p-3 text-center">
          <p className="font-bold text-gold-400 text-lg">{t.bossMonster?.name ?? '—'}</p>
          <p className="text-xs text-gray-500">Boss Monster</p>
        </div>
      </div>

      {/* Boss monster with illustration */}
      {t.bossMonster && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Tournament Boss
          </p>
          <div className="flex gap-4 items-center bg-background-secondary rounded-xl p-3 border border-blood-600/20">
            <Suspense fallback={<div className="w-16 h-16 skeleton rounded-xl flex-shrink-0" />}>
              <MonsterIllustration
                monsterId={t.bossMonster.id}
                tier={t.bossMonster.tier as any}
                league={t.league}
                difficultyMult={t.bossMonster.difficultyMult ?? 2.2}
                size={72}
                animated
              />
            </Suspense>
            <div className="flex-1 min-w-0">
              <MonsterCard monster={t.bossMonster} isDefeated={false} compact />
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

// ─── Results table ─────────────────────────────────────────────────────────
function ResultsTable({
  results,
  currentUserId,
}: {
  results: TournamentResult[]
  currentUserId?: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-background-border">
            {['Rank', 'Hunter', 'Score', 'Status'].map((h) => (
              <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-widest px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr
              key={r.userId}
              className={cn(
                'border-b border-background-border/50 transition-colors',
                r.userId === currentUserId
                  ? 'bg-purple-500/10'
                  : 'hover:bg-background-secondary',
              )}
            >
              <td className="px-4 py-3">
                <span className={cn('font-display font-bold', r.rank <= 3 && 'text-gold-400')}>
                  {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-gray-100">
                {r.username}
                {r.userId === currentUserId && (
                  <span className="ml-2 text-xs text-purple-400">(you)</span>
                )}
              </td>
              <td className="px-4 py-3 font-bold text-gray-300">{r.score.toLocaleString()}</td>
              <td className="px-4 py-3">
                {r.promoted && (
                  <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                    <TrendingUp size={12} /> Promoted
                  </span>
                )}
                {r.relegated && (
                  <span className="flex items-center gap-1 text-red-400 text-xs font-semibold">
                    <TrendingDown size={12} /> Relegated
                  </span>
                )}
                {!r.promoted && !r.relegated && (
                  <span className="text-gray-500 text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── History accordion item ────────────────────────────────────────────────
function HistoryItem({
  t,
  currentUserId,
}: {
  t: Tournament
  currentUserId?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card-glow rounded-xl bg-background-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-background-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn('rank-badge', leagueBadgeClass(t.league))}>
            {leagueBadgeEmoji(t.league)} {t.league}
          </span>
          <span className="text-sm text-gray-300">{formatDate(t.startsAt)}</span>
          <span className="text-xs text-gray-500">{t.participants} participants</span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {open && t.results && t.results.length > 0 && (
        <div className="border-t border-background-border">
          <ResultsTable results={t.results} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  )
}

// ─── TournamentPage ────────────────────────────────────────────────────────
export default function TournamentPage() {
  const { user } = useAuthStore()
  const [current, setCurrent] = useState<Tournament[]>([])
  const [history, setHistory] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      tournaments.getCurrent().catch(() => []),
      tournaments.getHistory(6).catch(() => []),
    ]).then(([c, h]) => {
      setCurrent(c)
      setHistory(h)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-background-card animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">Tournament</h1>
        <p className="text-gray-400 text-sm mt-1">Compete monthly for league promotion</p>
      </div>

      {/* Current tournaments */}
      {current.length > 0 ? (
        <section>
          <h2 className="font-display text-lg font-semibold text-gray-100 flex items-center gap-2 mb-4">
            <Crown size={16} className="text-gold-400" />
            Active Tournaments
          </h2>
          <div className="space-y-4">
            {current.map((t) => (
              <TournamentStatusCard key={t.id} t={t} />
            ))}
          </div>
        </section>
      ) : (
        <div className="card-glow rounded-2xl bg-background-card p-8 text-center">
          <Swords size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-display">No active tournaments</p>
          <p className="text-gray-500 text-sm mt-1">Check back at the start of next month</p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-gray-100 flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-gray-400" />
            Tournament History
          </h2>
          <div className="space-y-2">
            {history.map((t) => (
              <HistoryItem key={t.id} t={t} currentUserId={user?.id} />
            ))}
          </div>
        </section>
      )}

      {/* Promotion rules */}
      <section className="card-glow rounded-xl bg-background-card p-5">
        <h3 className="font-display font-semibold text-gray-100 mb-4">Promotion Rules</h3>
        <div className="space-y-3 text-sm">
          {[
            {
              icon: '🥇',
              rule: 'Top 20% of league finishers earn promotion to the next league',
            },
            {
              icon: '⬇',
              rule: 'Bottom 20% of league finishers are relegated to the league below',
            },
            {
              icon: '💠',
              rule: 'Body composition gates must be met to be eligible for promotion',
            },
            {
              icon: '🏆',
              rule: 'Tournament score is calculated from total power score growth over the month',
            },
          ].map(({ icon, rule }) => (
            <div key={rule} className="flex items-start gap-3">
              <span className="text-base mt-0.5">{icon}</span>
              <p className="text-gray-400">{rule}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
