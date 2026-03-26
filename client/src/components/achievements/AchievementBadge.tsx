import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface Achievement {
  key: string
  name: string
  description: string
  icon: string
  xpReward: number
  earnedAt?: string
}

interface AchievementBadgeProps {
  achievement: Achievement
  earned?: boolean
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export default function AchievementBadge({
  achievement,
  earned = true,
  showTooltip = true,
  size = 'md',
  animate = false,
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  }

  const badge = (
    <div className="group relative inline-block">
      <div className={cn(
        'rounded-xl flex items-center justify-center border-2 transition-all duration-200',
        sizeClasses[size],
        earned
          ? 'bg-gradient-to-br from-purple-900/80 to-background-card border-purple-600/60 shadow-purple-glow hover:border-purple-400'
          : 'bg-background-secondary border-background-border grayscale opacity-40'
      )}>
        <span className={cn(!earned && 'opacity-30')}>{achievement.icon}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 pointer-events-none z-50
                        opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="bg-background-secondary border border-background-border rounded-lg p-3 shadow-xl text-center">
            <p className="text-white text-xs font-semibold">{achievement.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">{achievement.description}</p>
            {earned ? (
              <p className="text-purple-400 text-xs mt-1">+{achievement.xpReward} XP earned</p>
            ) : (
              <p className="text-gray-600 text-xs mt-1">Locked</p>
            )}
          </div>
          {/* Arrow */}
          <div className="w-2 h-2 bg-background-secondary border-r border-b border-background-border
                          rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  )

  if (animate && earned) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {badge}
      </motion.div>
    )
  }

  return badge
}

export function AchievementGrid({ achievements, earned }: {
  achievements: Achievement[]
  earned?: Set<string>
}) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
      {achievements.map(a => (
        <AchievementBadge
          key={a.key}
          achievement={a}
          earned={earned ? earned.has(a.key) : true}
          showTooltip
          size="md"
        />
      ))}
    </div>
  )
}
