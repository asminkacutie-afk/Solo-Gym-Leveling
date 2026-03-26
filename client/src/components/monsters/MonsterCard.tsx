import MonsterSprite from './MonsterSprite'
import StatBar from '../ui/StatBar'
import type { Monster } from '../../lib/api'
import { cn, tierColor, leagueBadgeClass, leagueBadgeEmoji } from '../../lib/utils'

interface MonsterCardProps {
  monster: Monster
  isDefeated: boolean
  statGap?: Record<string, number>
  compact?: boolean
}

const TIER_BG: Record<string, string> = {
  common: 'rgba(107,114,128,0.08)',
  rare: 'rgba(34,197,94,0.08)',
  epic: 'rgba(124,58,237,0.08)',
  legendary: 'rgba(249,115,22,0.1)',
  ancient: 'rgba(220,38,38,0.1)',
}

const TIER_BORDER: Record<string, string> = {
  common: 'rgba(107,114,128,0.2)',
  rare: 'rgba(34,197,94,0.3)',
  epic: 'rgba(139,92,246,0.3)',
  legendary: 'rgba(249,115,22,0.35)',
  ancient: 'rgba(220,38,38,0.4)',
}

const TIER_SHADOW: Record<string, string> = {
  common: 'none',
  rare: '0 0 20px rgba(34,197,94,0.15)',
  epic: '0 0 20px rgba(139,92,246,0.2)',
  legendary: '0 0 24px rgba(249,115,22,0.2)',
  ancient: '0 0 28px rgba(220,38,38,0.25)',
}

export default function MonsterCard({
  monster,
  isDefeated,
  statGap,
  compact = false,
}: MonsterCardProps) {
  const color = tierColor(monster.tier)
  const bg = TIER_BG[monster.tier] ?? TIER_BG.common
  const border = TIER_BORDER[monster.tier] ?? TIER_BORDER.common
  const shadow = TIER_SHADOW[monster.tier] ?? 'none'
  const statEntries = Object.entries(monster.stats ?? {}).slice(0, 6)

  if (compact) {
    return (
      <div
        className="rounded-xl p-3 flex items-center gap-3 transition-all"
        style={{ background: bg, border: `1px solid ${border}`, boxShadow: shadow }}
      >
        <MonsterSprite tier={monster.tier} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-100 text-sm truncate">{monster.name}</p>
            {isDefeated && (
              <span className="text-green-400 text-xs font-bold shrink-0">✗ SLAIN</span>
            )}
          </div>
          <span className="text-xs font-bold uppercase" style={{ color }}>
            {monster.tier}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-300">{monster.totalPower.toLocaleString()}</p>
          <p className="text-xs text-gray-500">power</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01]"
      style={{ background: bg, border: `1px solid ${border}`, boxShadow: shadow }}
    >
      {/* Header */}
      <div className="relative p-5 pb-0">
        {/* Defeated stamp */}
        {isDefeated && (
          <div
            className="absolute top-3 right-3 rotate-[-15deg] border-2 border-green-500 rounded px-2 py-0.5 z-10"
            style={{ boxShadow: '0 0 10px rgba(34,197,94,0.3)' }}
          >
            <p className="font-display text-sm font-black text-green-400 tracking-widest">
              SLAIN
            </p>
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* Sprite */}
          <div className="flex-shrink-0 animate-float">
            <MonsterSprite tier={monster.tier} size={72} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-black uppercase tracking-widest"
                style={{ color }}
              >
                {monster.tier}
              </span>
              <span className={cn('rank-badge text-[10px]', leagueBadgeClass(monster.league))}>
                {leagueBadgeEmoji(monster.league)} {monster.league}
              </span>
            </div>
            <h3 className="font-display text-lg font-bold text-gray-100">{monster.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">
                Total Power:
              </span>
              <span className="text-sm font-bold" style={{ color }}>
                {monster.totalPower.toLocaleString()}
              </span>
            </div>
            {monster.loreText && (
              <p className="text-xs text-gray-500 italic mt-2 line-clamp-2">
                "{monster.loreText}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {statEntries.length > 0 && (
        <div className="p-5 pt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Monster Stats
          </p>
          {statEntries.map(([key, val]) => {
            const gap = statGap?.[key]
            return (
              <div key={key}>
                <StatBar
                  label={key.toUpperCase()}
                  value={val as number}
                  maxValue={100}
                  color={color}
                />
                {gap !== undefined && gap > 0 && !isDefeated && (
                  <p className="text-xs text-red-400 text-right mt-0.5">
                    -{gap.toFixed(0)} to close
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Defeat count */}
      {monster.defeatCount !== undefined && (
        <div className="px-5 pb-4 text-xs text-gray-500">
          Defeated by {monster.defeatCount} hunters
        </div>
      )}
    </div>
  )
}
