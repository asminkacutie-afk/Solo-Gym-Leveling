import { useEffect, useState, lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { User, Trophy, Skull, BarChart2, Weight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { profile, bodyComp } from '../lib/api'
import type { User as ApiUser, DisciplineData, PRRecord, UserMonsterKill, BodyCompEntry } from '../lib/api'
import DisciplineRadarChart from '../components/character/RadarChart'
import StatBar from '../components/ui/StatBar'
const HunterCharacterSVG = lazy(() => import('../components/character/HunterCharacterSVG'))
const BFSlider = lazy(() => import('../components/character/BFSlider'))
import {
  cn,
  leagueBadgeClass,
  leagueBadgeEmoji,
  formatDate,
  formatWeight,
  disciplineColor,
  tierColor,
  calculateLevelProgress,
  formatXP,
} from '../lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

const TABS = [
  { id: 'stats', label: 'Stats', Icon: BarChart2 },
  { id: 'records', label: 'Records', Icon: Trophy },
  { id: 'kills', label: 'Monster Kills', Icon: Skull },
  { id: 'bodycomp', label: 'Body Comp', Icon: Weight },
] as const
type Tab = (typeof TABS)[number]['id']

// ─── Hunter card ─────────────────────────────────────────────────────────
function HunterCard({ user }: { user: ApiUser | null }) {
  if (!user) return null
  return (
    <div className="card-glow rounded-2xl bg-background-card p-6">
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        {/* Character avatar — HunterCharacterSVG or fallback */}
        <div className="relative flex-shrink-0 flex flex-col items-center">
          <Suspense
            fallback={
              <div className="w-24 h-24 rounded-2xl bg-purple-700/30 border-2 border-purple-600/50 flex items-center justify-center shadow-purple-glow">
                <span className="font-display text-4xl font-bold text-purple-300">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            }
          >
            <HunterCharacterSVG
              bodyFat={user.bodyComp?.bodyFatPct ?? 25}
              powerScore={user.powerScore ?? 0}
              gender={(user.gender as 'male' | 'female') ?? 'male'}
              size={120}
              animated
            />
          </Suspense>
          <div
            className={cn(
              'mt-1 rank-badge text-[10px] px-2',
              leagueBadgeClass(user.league),
            )}
          >
            {leagueBadgeEmoji(user.league)} {user.league}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold text-gray-100">{user.username}</h1>
          <p className="text-gray-400 text-sm mt-1">{user.email}</p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
            <span className={cn('rank-badge', leagueBadgeClass(user.league))}>
              {leagueBadgeEmoji(user.league)} {user.league} League
            </span>
            <span className="rank-badge badge-iron">Lv. {user.totalLevel}</span>
            {user.powerScore > 0 && (
              <span className="rank-badge badge-mythic">⚡ {user.powerScore.toLocaleString()} PWR</span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 text-center sm:text-right">
          <div className="p-3 rounded-xl bg-background-secondary">
            <p className="text-xl font-bold text-gray-100">{user.totalLevel}</p>
            <p className="text-xs text-gray-500">Total Lvl</p>
          </div>
          <div className="p-3 rounded-xl bg-background-secondary">
            <p className="text-xl font-bold text-gold-400">{user.streak}d</p>
            <p className="text-xs text-gray-500">Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stats tab ────────────────────────────────────────────────────────────
function StatsTab({ user }: { user: ApiUser | null }) {
  if (!user) return null
  return (
    <div className="space-y-6">
      {/* Radar chart */}
      <div className="card-glow rounded-xl bg-background-card p-4">
        <h3 className="font-display text-base font-semibold text-gray-100 mb-4">
          Discipline Overview
        </h3>
        <DisciplineRadarChart disciplines={user.disciplines ?? []} />
      </div>

      {/* Per discipline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(user.disciplines ?? []).map((disc: DisciplineData) => {
          const pct = calculateLevelProgress(disc.xp, disc.xpToNext)
          const color = disciplineColor(disc.name)
          return (
            <div key={disc.id} className="card-glow rounded-xl bg-background-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <h4 className="font-display font-semibold text-gray-100">{disc.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('rank-badge text-[10px]', leagueBadgeClass(disc.rank))}>
                    {disc.rank}
                  </span>
                  <span className="text-sm font-bold text-gray-300">Lv. {disc.level}</span>
                </div>
              </div>

              {/* XP bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{formatXP(disc.xp)}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-background-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                {Object.entries(disc.stats).slice(0, 5).map(([key, val]) => (
                  <StatBar
                    key={key}
                    label={key.toUpperCase()}
                    value={val as number}
                    maxValue={100}
                    color={color}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Records tab ─────────────────────────────────────────────────────────
function RecordsTab() {
  const [records, setRecords] = useState<PRRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    profile.getRecords().then(setRecords).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center text-gray-500 py-12">Loading records...</div>
  if (!records.length)
    return (
      <div className="card-glow rounded-xl bg-background-card p-8 text-center text-gray-500">
        No personal records yet. Start training!
      </div>
    )

  return (
    <div className="card-glow rounded-xl bg-background-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-background-border">
              {['Exercise', 'Discipline', 'Weight', 'Reps', '1RM', 'Date'].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-gray-500 uppercase tracking-widest px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr
                key={i}
                className="border-b border-background-border/50 hover:bg-background-secondary transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-100">{r.exerciseName}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: disciplineColor(r.discipline),
                      backgroundColor: disciplineColor(r.discipline) + '20',
                    }}
                  >
                    {r.discipline}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-gold-400">{r.weight} kg</td>
                <td className="px-4 py-3 text-gray-300">{r.reps}</td>
                <td className="px-4 py-3 text-purple-300 font-semibold">
                  {r.oneRepMax.toFixed(1)} kg
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Monster kills tab ────────────────────────────────────────────────────
function KillsTab() {
  const [kills, setKills] = useState<UserMonsterKill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    profile.getMonsterKills().then(setKills).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center text-gray-500 py-12">Loading kills...</div>
  if (!kills.length)
    return (
      <div className="card-glow rounded-xl bg-background-card p-8 text-center text-gray-500">
        No monsters defeated yet. Train harder!
      </div>
    )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kills.map((k, i) => (
        <div
          key={i}
          className="card-glow rounded-xl bg-background-card p-4 border border-green-500/20"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-100">{k.monsterName}</p>
              <span
                className="text-xs font-bold uppercase"
                style={{ color: tierColor(k.tier) }}
              >
                {k.tier}
              </span>
            </div>
            <span className="text-green-400 text-lg font-black">✗</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
            <span>Victory margin: +{k.victoryMargin.toFixed(0)}</span>
            <span>{formatDate(k.defeatedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Body comp tab ────────────────────────────────────────────────────────
function BodyCompTab() {
  const { user } = useAuthStore()
  const [history, setHistory] = useState<BodyCompEntry[]>([])
  const [gates, setGates] = useState<{ league: string; maxBodyFat: number; met: boolean }[]>([])
  const [form, setForm] = useState({ weight: '', bodyFatPct: '', method: 'scale' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    Promise.all([
      bodyComp.getHistory().catch(() => []),
      bodyComp.getGates().catch(() => []),
    ]).then(([h, g]) => {
      setHistory(h)
      setGates(g)
      setLoading(false)
    })
  }, [])

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.weight) return
    setSubmitting(true)
    try {
      await bodyComp.log({
        weight: parseFloat(form.weight),
        bodyFatPct: form.bodyFatPct ? parseFloat(form.bodyFatPct) : undefined,
        method: form.method,
      })
      const updated = await bodyComp.getHistory()
      setHistory(updated)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const chartData = history
    .slice()
    .reverse()
    .map((h) => ({
      date: formatDate(h.recordedAt),
      weight: h.weight,
      bf: h.bodyFatPct,
    }))

  const currentBF = history[0]?.bodyFatPct

  if (loading) return <div className="text-center text-gray-500 py-12">Loading body comp...</div>

  const handleSetCurrent = async (bf: number) => {
    setSubmitting(true)
    try {
      await bodyComp.log({ weight: history[0]?.weight ?? 80, bodyFatPct: bf, method: 'manual' })
      const updated = await bodyComp.getHistory()
      setHistory(updated)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Interactive BF slider + character preview */}
      <Suspense fallback={<div className="h-96 skeleton rounded-2xl" />}>
        <BFSlider
          currentBodyFat={currentBF ?? null}
          currentWeight={history[0]?.weight ?? null}
          powerScore={user?.powerScore ?? 0}
          gender={(user?.gender as 'male' | 'female') ?? 'male'}
          onSetCurrent={handleSetCurrent}
        />
      </Suspense>

      {/* Composition lock warnings */}
      {gates.filter((g) => !g.met && currentBF && currentBF > g.maxBodyFat).length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25">
          <span className="text-red-400 text-lg">⚠</span>
          <div>
            <p className="font-semibold text-red-300">Composition Lock Active</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Your body fat percentage exceeds the threshold for promotion to higher leagues.
              Reduce body fat to unlock league advancement.
            </p>
          </div>
        </div>
      )}

      {/* Log form */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <h3 className="font-display font-semibold text-gray-100 mb-4">Log Measurement</h3>
        <form onSubmit={handleLog} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              className="dark-input"
              placeholder="75.0"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Body Fat %
            </label>
            <input
              type="number"
              step="0.1"
              className="dark-input"
              placeholder="18.0"
              value={form.bodyFatPct}
              onChange={(e) => setForm((f) => ({ ...f, bodyFatPct: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Method
            </label>
            <select
              className="dark-input"
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
            >
              <option value="scale">Scale</option>
              <option value="calipers">Calipers</option>
              <option value="dexa">DEXA</option>
              <option value="navy">Navy Method</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className={cn('btn-primary flex items-center gap-2', submitting && 'opacity-70')}
            >
              {submitted ? '✓ Logged!' : submitting ? 'Logging...' : 'Log Measurement'}
            </button>
          </div>
        </form>
      </div>

      {/* League gates */}
      {gates.length > 0 && (
        <div className="card-glow rounded-xl bg-background-card p-5">
          <h3 className="font-display font-semibold text-gray-100 mb-4">League Body Fat Gates</h3>
          <div className="space-y-2">
            {gates.map((g) => (
              <div key={g.league} className="flex items-center gap-3 p-3 rounded-lg bg-background-secondary">
                <span className={cn('rank-badge text-[10px]', leagueBadgeClass(g.league))}>
                  {leagueBadgeEmoji(g.league)} {g.league}
                </span>
                <span className="text-xs text-gray-400 flex-1">
                  Max body fat: {g.maxBodyFat}%
                </span>
                <span className={cn('text-xs font-bold', g.met ? 'text-green-400' : 'text-red-400')}>
                  {g.met ? '✓ Met' : '✗ Not met'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History chart */}
      {chartData.length > 1 && (
        <div className="card-glow rounded-xl bg-background-card p-5">
          <h3 className="font-display font-semibold text-gray-100 mb-4">Weight History</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(30,30,46,0.6)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 8 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#8b5cf6' }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 3 }}
                name="Weight (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── ProfilePage ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { username: paramUsername } = useParams<{ username?: string }>()
  const { user: selfUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('stats')

  // For now, always show self (could extend to fetch other user profiles)
  const user = selfUser

  if (!user) return null

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Hunter card */}
      <HunterCard user={user} />

      {/* Tabs */}
      <div className="flex gap-1 bg-background-secondary p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center',
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

      {/* Tab content */}
      <div>
        {activeTab === 'stats' && <StatsTab user={user} />}
        {activeTab === 'records' && <RecordsTab />}
        {activeTab === 'kills' && <KillsTab />}
        {activeTab === 'bodycomp' && <BodyCompTab />}
      </div>
    </div>
  )
}
