import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LeaderboardEntry } from '../../lib/api'
import { cn, leagueBadgeClass, leagueBadgeEmoji, disciplineColor, timeAgo } from '../../lib/utils'

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
  currentUserId?: string
  leagueTitle?: string
}

// ─── Rank badge ────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="font-display text-xl font-black text-gold-400">🥇</span>
  if (rank === 2)
    return <span className="font-display text-xl font-black text-gray-300">🥈</span>
  if (rank === 3)
    return <span className="font-display text-xl font-black" style={{ color: '#cd7f32' }}>🥉</span>
  return (
    <span className="font-mono text-sm font-semibold text-gray-500">#{rank}</span>
  )
}

// ─── Week delta ─────────────────────────────────────────────────────────────
function WeekDelta({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="flex items-center gap-0.5 text-green-400 text-xs font-semibold">
        <TrendingUp size={12} />+{delta}
      </span>
    )
  if (delta < 0)
    return (
      <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold">
        <TrendingDown size={12} />{delta}
      </span>
    )
  return (
    <span className="flex items-center gap-0.5 text-gray-600 text-xs">
      <Minus size={12} />0
    </span>
  )
}

// ─── LeaderboardTable ──────────────────────────────────────────────────────
export default function LeaderboardTable({
  data,
  currentUserId,
  leagueTitle,
}: LeaderboardTableProps) {
  if (!data?.length) {
    return (
      <div className="card-glow rounded-xl bg-background-card p-8 text-center text-gray-500">
        No leaderboard data available
      </div>
    )
  }

  return (
    <div className="card-glow rounded-xl bg-background-card overflow-hidden">
      {leagueTitle && (
        <div className="px-4 py-3 border-b border-background-border">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {leagueBadgeEmoji(leagueTitle)} {leagueTitle} League Rankings
          </p>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-background-border">
              {['Rank', 'Hunter', 'League', 'Power Score', 'Top Disciplines', 'Last Active', '7-Day'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-gray-500 uppercase tracking-widest px-4 py-3"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId
              return (
                <tr
                  key={entry.userId}
                  className={cn(
                    'border-b border-background-border/50 transition-colors',
                    isCurrentUser
                      ? 'bg-purple-500/10 shadow-purple-glow-sm'
                      : 'hover:bg-background-secondary',
                  )}
                >
                  {/* Rank */}
                  <td className="px-4 py-3 w-16">
                    <div className="flex items-center">
                      <RankBadge rank={entry.rank} />
                    </div>
                  </td>

                  {/* Hunter */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-700/30 border border-purple-600/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-purple-300">
                          {entry.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className={cn('font-semibold text-gray-100', isCurrentUser && 'text-purple-300')}>
                          {entry.username}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-xs text-purple-400">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">Lv. {entry.totalLevel}</p>
                      </div>
                    </div>
                  </td>

                  {/* League */}
                  <td className="px-4 py-3">
                    <span className={cn('rank-badge text-[10px]', leagueBadgeClass(entry.league))}>
                      {leagueBadgeEmoji(entry.league)} {entry.league}
                    </span>
                  </td>

                  {/* Power score */}
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-100">
                      {entry.powerScore.toLocaleString()}
                    </span>
                  </td>

                  {/* Top disciplines */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(entry.topDisciplines ?? []).slice(0, 3).map((d) => (
                        <span
                          key={d.name}
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{
                            color: disciplineColor(d.name),
                            backgroundColor: disciplineColor(d.name) + '20',
                          }}
                        >
                          {d.name.slice(0, 3).toUpperCase()} {d.level}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Last active */}
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {timeAgo(entry.lastActive)}
                  </td>

                  {/* Week delta */}
                  <td className="px-4 py-3">
                    <WeekDelta delta={entry.weekDelta} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-background-border">
        {data.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId
          return (
            <div
              key={entry.userId}
              className={cn(
                'px-4 py-3 flex items-center gap-3',
                isCurrentUser && 'bg-purple-500/10',
              )}
            >
              <div className="w-10 text-center shrink-0">
                <RankBadge rank={entry.rank} />
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-700/30 border border-purple-600/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-purple-300">
                  {entry.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-semibold text-gray-100 truncate', isCurrentUser && 'text-purple-300')}>
                  {entry.username}
                </p>
                <p className="text-xs text-gray-500">
                  {leagueBadgeEmoji(entry.league)} {entry.league} · Lv. {entry.totalLevel}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-100 text-sm">{entry.powerScore.toLocaleString()}</p>
                <WeekDelta delta={entry.weekDelta} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
