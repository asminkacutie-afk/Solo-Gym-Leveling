import { Crown, Shield, Swords, Zap } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { UserProfile } from '../../../../shared/types'

interface HunterCardProps {
  profile: UserProfile
  compact?: boolean
  className?: string
}

const LEAGUE_STYLES: Record<string, { border: string; glow: string; label: string; icon: string }> = {
  IRON:      { border: 'border-gray-600',   glow: 'shadow-gray-600/30',   label: 'Iron',    icon: '⚙️' },
  AWAKENING: { border: 'border-blue-500',   glow: 'shadow-blue-500/30',   label: 'Awakening', icon: '🌊' },
  BRONZE:    { border: 'border-amber-600',  glow: 'shadow-amber-600/30',  label: 'Bronze',  icon: '🔶' },
  SILVER:    { border: 'border-slate-400',  glow: 'shadow-slate-400/30',  label: 'Silver',  icon: '⚪' },
  GOLD:      { border: 'border-yellow-400', glow: 'shadow-yellow-400/40', label: 'Gold',    icon: '👑' },
  MYTHIC:    { border: 'border-purple-400', glow: 'shadow-purple-400/50', label: 'Mythic',  icon: '🔮' },
}

const RANK_LABELS: Record<string, string> = {
  IRON_BODY:          'Iron Body',
  BRONZE_WARRIOR:     'Bronze Warrior',
  SILVER_CHAMPION:    'Silver Champion',
  GOLD_TITAN:         'Gold Titan',
  PLATINUM_SOVEREIGN: 'Platinum Sovereign',
  MYTHIC_ARCHON:      'Mythic Archon',
}

export default function HunterCard({ profile, compact = false, className }: HunterCardProps) {
  const league = profile.leaderboardEntry?.league ?? 'IRON'
  const leagueStyle = LEAGUE_STYLES[league] ?? LEAGUE_STYLES.IRON
  const totalLevel = profile.leaderboardEntry?.totalLevel ?? 6
  const powerScore = Math.round(profile.leaderboardEntry?.totalPowerScore ?? 0)

  const slayerCount = profile.achievements?.filter(a =>
    a.achievement?.key.startsWith('slayer_')
  ).length ?? 0

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-background-card border', leagueStyle.border, className)}>
        <div className="relative">
          <img
            src={profile.avatarUrl ?? `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${profile.username}`}
            alt={profile.username}
            className="w-10 h-10 rounded-full border-2 border-purple-600 object-cover"
          />
          <span className="absolute -bottom-1 -right-1 text-xs bg-background-secondary rounded-full px-1 border border-purple-600/50 text-purple-400 font-bold leading-5">
            {totalLevel}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{profile.username}</p>
          <p className="text-xs text-gray-400">{leagueStyle.icon} {leagueStyle.label}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'relative rounded-xl border-2 p-6 bg-background-card overflow-hidden',
      leagueStyle.border,
      'shadow-lg', leagueStyle.glow,
      className
    )}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex items-start gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={profile.avatarUrl ?? `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${profile.username}`}
            alt={profile.username}
            className="w-20 h-20 rounded-xl border-2 border-purple-600 object-cover"
          />
          {/* Level badge */}
          <div className="absolute -bottom-2 -right-2 bg-purple-700 border border-purple-400 rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{totalLevel}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-wide">{profile.username}</h2>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-semibold border',
              leagueStyle.border,
              'text-gray-200'
            )}>
              {leagueStyle.icon} {leagueStyle.label} League
            </span>
          </div>

          <p className="text-purple-400 text-sm mt-0.5">Hunter · Level {totalLevel}</p>

          {/* Stats row */}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-gray-300">
                <span className="text-yellow-400 font-bold">{powerScore.toLocaleString()}</span>
                <span className="text-gray-500 ml-1">PWR</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Shield size={14} className="text-purple-400" />
              <span className="text-gray-300">
                <span className="text-purple-400 font-bold">{profile.leaderboardEntry?.league ?? 'IRON'}</span>
              </span>
            </div>
            {slayerCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Swords size={14} className="text-red-400" />
                <span className="text-red-400 font-bold">{slayerCount}× Slayer</span>
              </div>
            )}
          </div>

          {/* Slayer badges */}
          {profile.achievements && profile.achievements.filter(a => a.achievement?.key.startsWith('slayer_')).length > 0 && (
            <div className="flex gap-1 mt-3 flex-wrap">
              {profile.achievements
                .filter(a => a.achievement?.key.startsWith('slayer_'))
                .slice(0, 6)
                .map(a => (
                  <span key={a.id} title={a.achievement?.name}
                    className="text-lg cursor-help"
                  >
                    {a.achievement?.icon}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Rank badge strip */}
      <div className="mt-4 pt-4 border-t border-background-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown size={14} className="text-gold-500" />
          <span className="text-gray-400 text-xs">
            {profile.disciplines
              ? (() => {
                  const maxRank = profile.disciplines.reduce((best, d) => {
                    const rankOrder = ['IRON_BODY','BRONZE_WARRIOR','SILVER_CHAMPION','GOLD_TITAN','PLATINUM_SOVEREIGN','MYTHIC_ARCHON']
                    return rankOrder.indexOf(d.rankBadge) > rankOrder.indexOf(best) ? d.rankBadge : best
                  }, 'IRON_BODY')
                  return RANK_LABELS[maxRank] ?? 'Iron Body'
                })()
              : 'Iron Body'}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {profile.leaderboardEntry?.lastActive
            ? `Active ${new Date(profile.leaderboardEntry.lastActive).toLocaleDateString()}`
            : 'New Hunter'}
        </span>
      </div>
    </div>
  )
}
