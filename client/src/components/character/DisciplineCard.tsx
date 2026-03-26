import { cn, disciplineIcon, disciplineColor, rankBadgeClass, calculateLevelProgress, formatXP } from '../../lib/utils'
import type { DisciplineData } from '../../lib/api'

interface DisciplineCardProps {
  discipline: DisciplineData
}

const STAT_ABBREV: Record<string, string> = {
  strength: 'STR',
  endurance: 'END',
  power: 'PWR',
  speed: 'SPD',
  recovery: 'REC',
  flexibility: 'FLX',
}

export default function DisciplineCard({ discipline }: DisciplineCardProps) {
  const color = disciplineColor(discipline.name)
  const icon = disciplineIcon(discipline.name)
  const pct = calculateLevelProgress(discipline.xp, discipline.xpToNext)
  const rankClass = rankBadgeClass(discipline.rank)
  const statEntries = Object.entries(discipline.stats ?? {}).slice(0, 5)

  return (
    <div
      className="card-glow rounded-xl bg-background-card p-4 transition-all duration-300 hover:scale-[1.01] cursor-default"
      style={{
        borderColor: color + '30',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: color + '20', boxShadow: `0 0 8px ${color}30` }}
          >
            {icon}
          </div>
          <div>
            <p className="font-display font-semibold text-gray-100 text-sm leading-tight">
              {discipline.name}
            </p>
            <p className="text-xs text-gray-500">Level {discipline.level}</p>
          </div>
        </div>

        {/* Rank badge */}
        <span className={cn('rank-badge text-[10px]', rankClass)}>
          {discipline.rank}
        </span>
      </div>

      {/* XP bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{formatXP(discipline.xp)}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-background-secondary rounded-full overflow-hidden relative">
          <div
            className="h-full rounded-full xp-bar-fill"
            style={{
              '--xp-width': `${pct}%`,
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}cc, ${color})`,
              boxShadow: `0 0 8px ${color}60`,
            } as React.CSSProperties}
          />
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${color}30 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1 text-right">
          {formatXP(discipline.xpToNext - discipline.xp)} to next level
        </p>
      </div>

      {/* Stats mini-grid */}
      {statEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {statEntries.map(([key, val]) => {
            const label = STAT_ABBREV[key.toLowerCase()] ?? key.slice(0, 3).toUpperCase()
            const numVal = Number(val)
            return (
              <div key={key} className="flex items-center gap-2 p-1.5 rounded-lg bg-background-secondary">
                <span className="text-[10px] font-bold text-gray-500 w-8 shrink-0">{label}</span>
                <div className="flex-1 h-1 bg-background-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, numVal)}%`,
                      backgroundColor: color,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-300 font-semibold w-5 text-right">
                  {numVal}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
