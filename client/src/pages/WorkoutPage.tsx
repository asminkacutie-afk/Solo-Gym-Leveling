import { useEffect, useState, useRef } from 'react'
import { Dumbbell, Play, Square, Clock, Zap, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { useWorkoutStore } from '../store/workoutStore'
import { workouts } from '../lib/api'
import type { WorkoutSet, WorkoutSession, LevelUp } from '../lib/api'
import WorkoutLogger from '../components/workout/WorkoutLogger'
import RestTimer from '../components/workout/RestTimer'
import PRCelebration from '../components/workout/PRCelebration'
import { cn, disciplineColor, formatXP } from '../lib/utils'

const DISCIPLINES = ['Strength', 'Endurance', 'Power', 'Speed', 'Recovery', 'Flexibility']

// ─── Session timer display ─────────────────────────────────────────────────
function SessionTimer({ seconds }: { seconds: number }) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const fmt = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="font-mono text-2xl font-bold text-purple-300">
      {h > 0 ? `${fmt(h)}:` : ''}{fmt(m)}:{fmt(s)}
    </span>
  )
}

// ─── Post-session summary modal ────────────────────────────────────────────
function SessionSummaryModal({
  session,
  onClose,
}: {
  session: WorkoutSession
  onClose: () => void
}) {
  const xpGained = session.xpGained ?? {}
  const levelUps = session.levelUps ?? []
  const prs = session.prs ?? []
  const totalVolume = (session.sets ?? []).reduce(
    (acc, s) => acc + s.weight * s.reps,
    0,
  )
  const totalSets = session.sets?.length ?? 0
  const [showLevelUp, setShowLevelUp] = useState(levelUps.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Level-up celebration */}
      {showLevelUp && levelUps.length > 0 && (
        <div className="fixed inset-0 z-60 flex items-center justify-center"
          onClick={() => setShowLevelUp(false)}>
          <div className="text-center animate-level-up pointer-events-none">
            <p className="font-display text-6xl font-black gradient-text-mythic mb-4">
              LEVEL UP!
            </p>
            {levelUps.map((d: LevelUp) => (
              <p key={d.discipline} className="text-2xl text-gold-400 font-bold animate-float">
                {d.discipline} Lv.{d.oldLevel} → {d.newLevel}!
              </p>
            ))}
            <p className="text-gray-400 mt-4 text-sm">Tap to continue</p>
          </div>
          {/* Particle decorations */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gold-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                ['--px' as string]: `${(Math.random() - 0.5) * 200}px`,
                ['--py' as string]: `${(Math.random() - 0.5) * 200}px`,
                animation: `particle-fly 1.5s ease-out ${Math.random()}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Summary card */}
      <div className="card-glow rounded-2xl bg-background-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 mb-3">
              <Star size={24} className="text-green-400" />
            </div>
            <h2 className="font-display text-2xl font-bold gradient-text">Session Complete!</h2>
            <p className="text-gray-400 text-sm mt-1">
              {totalSets} sets · {totalVolume.toFixed(0)} kg total volume
            </p>
          </div>

          {/* XP gained */}
          {Object.keys(xpGained).length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                XP Gained
              </h3>
              <div className="space-y-2">
                {Object.entries(xpGained).map(([disc, xp]) => (
                  <div key={disc} className="flex items-center gap-3">
                    <span
                      className="text-xs font-semibold w-20 capitalize"
                      style={{ color: disciplineColor(disc) }}
                    >
                      {disc}
                    </span>
                    <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: '100%',
                          backgroundColor: disciplineColor(disc),
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gold-400 font-bold w-16 text-right">
                      +{formatXP(xp as number)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRs */}
          {prs.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Personal Records
              </h3>
              <div className="space-y-2">
                {prs.map((pr, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gold-500/10 border border-gold-500/20"
                  >
                    <Zap size={14} className="text-gold-400" />
                    <span className="text-sm text-gray-100 flex-1">{pr.exerciseName}</span>
                    <span className="text-sm font-bold text-gold-400">
                      {pr.weight} kg × {pr.reps}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={onClose} className="btn-primary w-full py-3">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Begin training screen ─────────────────────────────────────────────────
function BeginScreen({ onStart }: { onStart: (discipline: string) => void }) {
  const [selected, setSelected] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const session = await workouts.createSession(`${selected} training`)
      useWorkoutStore.getState().startSession(session)
      onStart(selected)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-700/30 border border-purple-600/40 shadow-purple-glow mb-6 animate-float">
          <Dumbbell size={32} className="text-purple-300" />
        </div>
        <h1 className="font-display text-3xl font-bold gradient-text mb-2">
          Begin Training
        </h1>
        <p className="text-gray-400">Choose your primary discipline for this session</p>
      </div>

      {/* Discipline grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {DISCIPLINES.map((d) => {
          const color = disciplineColor(d)
          return (
            <button
              key={d}
              onClick={() => setSelected(d)}
              className={cn(
                'relative p-4 rounded-xl border text-left transition-all duration-200',
                selected === d
                  ? 'border-purple-500/60 bg-purple-500/15 shadow-purple-glow-sm'
                  : 'border-background-border bg-background-card hover:border-background-border hover:bg-background-secondary',
              )}
              style={selected === d ? { borderColor: color + '80', backgroundColor: color + '15' } : {}}
            >
              <div
                className="w-3 h-3 rounded-full mb-2"
                style={{ backgroundColor: color }}
              />
              <p className="text-sm font-semibold text-gray-100">{d}</p>
              {selected === d && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={!selected || loading}
        className={cn(
          'btn-primary w-full flex items-center justify-center gap-2 py-4 text-base animate-glow-pulse',
          (!selected || loading) && 'opacity-50 cursor-not-allowed',
        )}
      >
        {loading ? (
          'Starting...'
        ) : (
          <>
            <Play size={18} />
            Start Session
          </>
        )}
      </button>
    </div>
  )
}

// ─── WorkoutPage ────────────────────────────────────────────────────────────
export default function WorkoutPage() {
  const { activeSession, isLogging, clearSession, sessionElapsedSeconds } =
    useWorkoutStore()
  const [summary, setSummary] = useState<WorkoutSession | null>(null)
  const [prSet, setPrSet] = useState<WorkoutSet | null>(null)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [ending, setEnding] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tick session timer
  useEffect(() => {
    if (isLogging) {
      timerRef.current = setInterval(() => {
        useWorkoutStore.getState().tickTimer()
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isLogging])

  const handleEnd = async () => {
    if (!activeSession) return
    setEnding(true)
    try {
      const finished = await workouts.endSession(activeSession.id)
      setSummary(finished)
      useWorkoutStore.getState().endSession(finished)
    } catch {
      // fallback
      setSummary({ ...activeSession, endedAt: new Date().toISOString() })
      useWorkoutStore.getState().endSession()
    } finally {
      setEnding(false)
    }
  }

  const handlePRDetected = (set: WorkoutSet) => {
    setPrSet(set)
  }

  const handleCloseSummary = () => {
    setSummary(null)
    clearSession()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Summary modal */}
      {summary && (
        <SessionSummaryModal session={summary} onClose={handleCloseSummary} />
      )}

      {/* PR celebration overlay */}
      {prSet && (
        <PRCelebration
          exerciseName={prSet.exerciseName}
          weight={prSet.weight}
          reps={prSet.reps}
          onDismiss={() => setPrSet(null)}
        />
      )}

      {/* No active session */}
      {!isLogging && !activeSession ? (
        <BeginScreen onStart={() => {}} />
      ) : (
        /* Active session */
        <div className="space-y-6 animate-fade-in-up">
          {/* Session header */}
          <div className="card-glow rounded-xl bg-background-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Active Session</p>
                  <SessionTimer seconds={sessionElapsedSeconds} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRestTimer((v) => !v)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all',
                    showRestTimer
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-background-secondary border-background-border text-gray-400 hover:text-gray-200',
                  )}
                >
                  <Clock size={14} />
                  Rest Timer
                  {showRestTimer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                <button
                  onClick={handleEnd}
                  disabled={ending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-semibold"
                >
                  <Square size={14} />
                  {ending ? 'Ending...' : 'End Session'}
                </button>
              </div>
            </div>

            {/* Rest timer inline */}
            {showRestTimer && (
              <div className="mt-4 pt-4 border-t border-background-border">
                <RestTimer />
              </div>
            )}
          </div>

          {/* Workout logger */}
          {activeSession && (
            <WorkoutLogger
              session={activeSession}
              onPRDetected={handlePRDetected}
            />
          )}
        </div>
      )}
    </div>
  )
}
