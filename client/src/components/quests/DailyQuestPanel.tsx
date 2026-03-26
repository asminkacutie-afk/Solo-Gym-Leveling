import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Flame, Star, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { api } from '../../lib/api'
import type { DailyQuest } from '../../../../shared/types'

interface QuestWithProgress extends DailyQuest {
  progress: number
  isComplete: boolean
}

export default function DailyQuestPanel() {
  const [quests, setQuests] = useState<QuestWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [allDone, setAllDone] = useState(false)

  useEffect(() => {
    api.quests.getToday()
      .then(res => {
        setQuests(res.data)
        setAllDone(res.data.every((q: QuestWithProgress) => q.isComplete))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const completedCount = quests.filter(q => q.isComplete).length

  if (loading) {
    return (
      <div className="rounded-xl border border-background-border bg-background-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-background-secondary rounded mb-4" />
        {[0,1,2].map(i => (
          <div key={i} className="h-14 bg-background-secondary rounded-lg mb-2" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-background-border bg-background-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-orange-400" />
          <h3 className="text-white font-semibold">Daily Quests</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-400">{completedCount}/3</span>
          {completedCount === 3 && (
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-background-secondary rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-gold-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / 3) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Quest list */}
      <div className="space-y-2">
        {quests.map(quest => (
          <QuestRow key={quest.id} quest={quest} />
        ))}
      </div>

      {/* All done bonus */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-900/50 to-gold-900/20 border border-gold-500/30 flex items-center gap-2"
          >
            <Zap size={16} className="text-yellow-400" />
            <span className="text-sm text-yellow-300 font-medium">All quests complete! Bonus XP awarded ✦</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function QuestRow({ quest }: { quest: QuestWithProgress }) {
  const req = quest.requirement as { type: string; count?: number; discipline?: string }
  const progressPct = req.count ? Math.min(100, (quest.progress / req.count) * 100) : (quest.isComplete ? 100 : 0)

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      quest.isComplete
        ? 'bg-purple-900/20 border-purple-600/40'
        : 'bg-background-secondary border-background-border'
    )}>
      {quest.isComplete
        ? <CheckCircle2 size={18} className="text-purple-400 flex-shrink-0" />
        : <Circle size={18} className="text-gray-600 flex-shrink-0" />
      }

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', quest.isComplete ? 'text-gray-400 line-through' : 'text-white')}>
          {quest.description}
        </p>
        {!quest.isComplete && req.count && req.count > 1 && (
          <div className="mt-1.5 w-full h-1 bg-background-border rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        <span className="text-xs text-yellow-500 font-semibold">+{quest.xpReward} XP</span>
        {req.count && req.count > 1 && !quest.isComplete && (
          <p className="text-xs text-gray-500">{quest.progress}/{req.count}</p>
        )}
      </div>
    </div>
  )
}
