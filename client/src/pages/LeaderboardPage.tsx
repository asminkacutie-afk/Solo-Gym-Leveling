import { useEffect, useState, useRef, useCallback } from 'react'
import { Trophy, Globe, Skull, RefreshCw } from 'lucide-react'
import { leaderboard, monsters } from '../lib/api'
import type { LeaderboardEntry, Monster } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import LeaderboardTable from '../components/leaderboard/LeaderboardTable'
import MonsterCard from '../components/monsters/MonsterCard'
import { cn, leagueBadgeClass, leagueBadgeEmoji, tierColor } from '../lib/utils'

const TABS = [
  { id: 'global', label: 'Global', Icon: Globe },
  { id: 'league', label: 'My League', Icon: Trophy },
  { id: 'monsters', label: 'Monster Board', Icon: Skull },
] as const
type Tab = (typeof TABS)[number]['id']

// ─── Live pulse indicator ─────────────────────────────────────────────────
function LiveIndicator({ lastRefresh }: { lastRefresh: Date }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])
  const secs = Math.floor((Date.now() - lastRefresh.getTime()) / 1000)
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      <span>
        Live · refreshed {secs < 10 ? 'just now' : `${secs}s ago`}
      </span>
    </div>
  )
}

// ─── Monster board ───────────────────────────────────────────────────────
function MonsterBoard({ data }: { data: Monster[] }) {
  const maxPower = Math.max(...data.map((m) => m.totalPower), 1)

  return (
    <div className="space-y-4">
      {data.map((m, i) => (
        <div key={m.id} className="card-glow rounded-xl bg-background-card p-4">
          <div className="flex items-start gap-4">
            {/* Rank */}
            <div className="w-8 text-center">
              <span className="font-display font-bold text-gray-400 text-lg">#{i + 1}</span>
            </div>

            {/* Monster info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-100">{m.name}</span>
                <span
                  className="text-xs font-bold uppercase"
                  style={{ color: tierColor(m.tier) }}
                >
                  {m.tier}
                </span>
                <span className={cn('rank-badge text-[10px]', leagueBadgeClass(m.league))}>
                  {leagueBadgeEmoji(m.league)} {m.league}
                </span>
              </div>

              {/* Power bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(m.totalPower / maxPower) * 100}%`,
                      backgroundColor: tierColor(m.tier),
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-300 w-20 text-right">
                  {m.totalPower.toLocaleString()} PWR
                </span>
              </div>

              {m.defeatCount !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Defeated by {m.defeatCount} hunters
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── LeaderboardPage ─────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('global')
  const [globalData, setGlobalData] = useState<LeaderboardEntry[]>([])
  const [leagueData, setLeagueData] = useState<LeaderboardEntry[]>([])
  const [monsterData, setMonsterData] = useState<Monster[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const wsRef = useRef<WebSocket | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [g, l, m] = await Promise.all([
        leaderboard.getGlobal().catch(() => []),
        user ? leaderboard.getByLeague(user.league).catch(() => []) : Promise.resolve([]),
        leaderboard.getMonsters().catch(() => []),
      ])
      setGlobalData(g)
      setLeagueData(l)
      setMonsterData(m)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial fetch + 60s auto-refresh
  useEffect(() => {
    fetchData()
    refreshTimerRef.current = setInterval(fetchData, 60_000)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [fetchData])

  // WebSocket for live updates
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/leaderboard`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'leaderboard_update') {
          if (msg.data?.global) setGlobalData(msg.data.global)
          if (msg.data?.league) setLeagueData(msg.data.league)
          setLastRefresh(new Date())
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => {
      // Silently fail — auto-refresh still runs
    }

    return () => {
      ws.close()
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text">Leaderboard</h1>
          <p className="text-gray-400 text-sm mt-1">Hunter rankings across all leagues</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator lastRefresh={lastRefresh} />
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-card border border-background-border text-gray-400 hover:text-white text-xs transition-all"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-background-secondary p-1 rounded-xl">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 justify-center',
              activeTab === id
                ? 'bg-background-card text-gray-100 shadow-card-glow border border-background-border'
                : 'text-gray-400 hover:text-gray-200',
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-background-card animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'global' && (
            <LeaderboardTable
              data={globalData}
              currentUserId={user?.id}
            />
          )}
          {activeTab === 'league' && (
            <LeaderboardTable
              data={leagueData}
              currentUserId={user?.id}
              leagueTitle={user?.league}
            />
          )}
          {activeTab === 'monsters' && (
            monsterData.length === 0 ? (
              <div className="card-glow rounded-xl bg-background-card p-8 text-center text-gray-500">
                No monster data available
              </div>
            ) : (
              <MonsterBoard data={monsterData} />
            )
          )}
        </>
      )}
    </div>
  )
}
