import { useEffect, useState, lazy, Suspense } from 'react'
import { Skull, Filter } from 'lucide-react'
import { monsters, profile } from '../lib/api'
import type { Monster, UserMonsterKill } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import MonsterCard from '../components/monsters/MonsterCard'
import { cn } from '../lib/utils'
const MonsterIllustration = lazy(() => import('../components/monsters/MonsterIllustration'))

const TIERS = ['all', 'common', 'rare', 'epic', 'legendary', 'ancient'] as const
type TierFilter = (typeof TIERS)[number]

export default function MonstersPage() {
  const { user } = useAuthStore()
  const [allMonsters, setAllMonsters] = useState<Monster[]>([])
  const [kills, setKills] = useState<UserMonsterKill[]>([])
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      monsters.getAll().catch(() => []),
      profile.getMonsterKills().catch(() => []),
    ]).then(([m, k]) => {
      setAllMonsters(m)
      setKills(k)
      setLoading(false)
    })
  }, [])

  const defeatedIds = new Set(kills.map((k) => k.monsterId))

  const filtered = allMonsters.filter(
    (m) => tierFilter === 'all' || m.tier === tierFilter,
  )

  const leagueMonsters = filtered.filter(
    (m) => !user || m.league === user.league,
  )
  const otherMonsters = filtered.filter(
    (m) => user && m.league !== user.league,
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text flex items-center gap-3">
            <Skull size={28} className="text-red-400" />
            Monster Hunter
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Defeat monsters by surpassing their stat requirements
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-400 font-bold">{kills.length}</span>
          <span className="text-gray-500">defeated /</span>
          <span className="text-gray-300 font-bold">{allMonsters.length}</span>
          <span className="text-gray-500">total</span>
        </div>
      </div>

      {/* Tier filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-500" />
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all border',
              tierFilter === t
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                : 'bg-background-secondary border-background-border text-gray-400 hover:text-gray-200',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-background-card animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* League monsters */}
          {leagueMonsters.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-red-400">⚔</span>
                Your League Monsters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leagueMonsters.map((m) => (
                  <div key={m.id} className="relative">
                    <Suspense fallback={null}>
                      <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <MonsterIllustration
                          monsterId={m.id}
                          tier={m.tier as any}
                          league={m.league}
                          difficultyMult={m.difficultyMult ?? 1}
                          size={64}
                          animated
                        />
                      </div>
                    </Suspense>
                    <MonsterCard monster={m} isDefeated={defeatedIds.has(m.id)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other league monsters */}
          {otherMonsters.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <span className="text-gray-500">👁</span>
                <span className="text-gray-400">Other Leagues</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                {otherMonsters.map((m) => (
                  <MonsterCard
                    key={m.id}
                    monster={m}
                    isDefeated={defeatedIds.has(m.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="card-glow rounded-xl bg-background-card p-8 text-center text-gray-500">
              No monsters found for this filter
            </div>
          )}
        </>
      )}
    </div>
  )
}
