import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'purple' | 'gold' | 'green' | 'red' | 'gray' | 'iron' | 'bronze' | 'silver' | 'mythic'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-background-secondary text-gray-300 border-background-border',
  purple:   'bg-purple-900/50 text-purple-300 border-purple-600/50',
  gold:     'bg-yellow-900/40 text-yellow-300 border-yellow-600/50',
  green:    'bg-green-900/40 text-green-300 border-green-600/50',
  red:      'bg-red-900/40 text-red-300 border-red-600/50',
  gray:     'bg-gray-800/60 text-gray-400 border-gray-700/50',
  iron:     'bg-gray-800/60 text-gray-300 border-gray-600/50',
  bronze:   'bg-amber-900/40 text-amber-300 border-amber-700/50',
  silver:   'bg-slate-800/60 text-slate-300 border-slate-500/50',
  mythic:   'bg-purple-900/60 text-purple-200 border-purple-500/60 shadow-purple-glow',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  purple:  'bg-purple-400',
  gold:    'bg-yellow-400',
  green:   'bg-green-400',
  red:     'bg-red-400',
  gray:    'bg-gray-500',
  iron:    'bg-gray-500',
  bronze:  'bg-amber-500',
  silver:  'bg-slate-400',
  mythic:  'bg-purple-400',
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}

export function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, BadgeVariant> = {
    COMMON: 'gray', RARE: 'green', EPIC: 'purple', LEGENDARY: 'gold', ANCIENT: 'red'
  }
  return <Badge variant={map[tier] ?? 'default'}>{tier}</Badge>
}

export function LeagueBadge({ league }: { league?: string | null }) {
  const safe = league ?? ''
  const map: Record<string, BadgeVariant> = {
    IRON: 'iron', AWAKENING: 'purple', BRONZE: 'bronze', SILVER: 'silver', GOLD: 'gold', MYTHIC: 'mythic'
  }
  const icons: Record<string, string> = {
    IRON: '⚙️', AWAKENING: '🌊', BRONZE: '🔶', SILVER: '⚪', GOLD: '👑', MYTHIC: '🔮'
  }
  return (
    <Badge variant={map[safe] ?? 'default'}>
      {icons[safe]} {safe ? safe.charAt(0) + safe.slice(1).toLowerCase() : '—'}
    </Badge>
  )
}
