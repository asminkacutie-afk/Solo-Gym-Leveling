import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Zap, Minus, Plus } from 'lucide-react'
import { workouts } from '../../lib/api'
import type { WorkoutSession, WorkoutSet, Exercise } from '../../lib/api'
import { useWorkoutStore } from '../../store/workoutStore'
import ExerciseSearch from './ExerciseSearch'
import DisciplineSVGBadge from '../character/DisciplineSVGBadge'
import CombatFlash, { useCombatFlash } from '../ui/CombatFlash'
import AnimatedNumber from '../ui/AnimatedNumber'
import { cn, disciplineColor } from '../../lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────
interface SetRow {
  weight: string
  reps: string
  rpe: string
  isPR?: boolean
  id?: string
}

interface ExerciseBlock {
  exercise: Exercise
  sets: SetRow[]
}

interface WorkoutLoggerProps {
  session: WorkoutSession
  onPRDetected?: (set: WorkoutSet) => void
}

// ─── RPE options ────────────────────────────────────────────────────────────
const RPE_OPTIONS = ['6', '7', '7.5', '8', '8.5', '9', '9.5', '10']

// ─── Stepper button ─────────────────────────────────────────────────────────
function StepperButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all select-none',
        'active:scale-90',
        disabled
          ? 'opacity-30 cursor-not-allowed'
          : 'text-gray-200 hover:text-white hover:bg-white/10',
      )}
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {children}
    </button>
  )
}

// ─── Weight preset chips ─────────────────────────────────────────────────────
function WeightPresets({
  baseWeight,
  onSelect,
  color,
}: {
  baseWeight: number
  onSelect: (w: string) => void
  color: string
}) {
  if (baseWeight <= 0) return null
  const presets = [
    { label: '-10%', value: Math.max(0, baseWeight * 0.9) },
    { label: '-5%',  value: Math.max(0, baseWeight * 0.95) },
    { label: 'Same', value: baseWeight },
    { label: '+5%',  value: baseWeight * 1.05 },
    { label: '+10%', value: baseWeight * 1.1 },
  ]

  return (
    <div className="flex gap-1.5 flex-wrap justify-center mt-1">
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => onSelect(p.value.toFixed(1))}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}40`,
            color,
          }}
        >
          {p.label} ({p.value.toFixed(1)})
        </button>
      ))}
    </div>
  )
}

// ─── Mobile combat set logger ────────────────────────────────────────────────
function MobileCombatSetLogger({
  block,
  blockIdx,
  onCommitSet,
  onRemoveExercise,
}: {
  block: ExerciseBlock
  blockIdx: number
  onCommitSet: (blockIdx: number, row: SetRow) => Promise<boolean>
  onRemoveExercise: () => void
}) {
  const color = disciplineColor(block.exercise.discipline)
  const lastSet = block.sets.length > 0 ? block.sets[block.sets.length - 1] : null
  const lastWeight = lastSet ? parseFloat(lastSet.weight || '0') || 0 : 0

  const [weight, setWeight] = useState(lastWeight > 0 ? lastWeight.toString() : '')
  const [reps, setReps] = useState('10')
  const [rpe, setRpe] = useState('8')
  const [logging, setLogging] = useState(false)
  const [prFlash, setPrFlash] = useState(false)
  const [damageFlash, setDamageFlash] = useState(false)

  // Flash text overlay state
  const [flashMsg, setFlashMsg] = useState('')
  const flashMsgRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { flash: triggerDamageFlash, FlashWrapper } = useCombatFlash('#7c3aed')

  const weightNum = parseFloat(weight) || 0
  const repsNum = parseInt(reps, 10) || 0

  const incrementWeight = (delta: number) => {
    const curr = parseFloat(weight) || 0
    const next = Math.max(0, curr + delta)
    setWeight(next % 1 === 0 ? next.toString() : next.toFixed(1))
  }

  const incrementReps = (delta: number) => {
    const curr = parseInt(reps, 10) || 0
    setReps(String(Math.max(1, curr + delta)))
  }

  const showFlashMessage = (msg: string) => {
    setFlashMsg(msg)
    if (flashMsgRef.current) clearTimeout(flashMsgRef.current)
    flashMsgRef.current = setTimeout(() => setFlashMsg(''), 1000)
  }

  const handleLogSet = async () => {
    if (!weight || !reps || logging) return
    setLogging(true)
    try {
      const isPR = await onCommitSet(blockIdx, { weight, reps, rpe })
      triggerDamageFlash()
      if (isPR) {
        showFlashMessage('⚡ NEW RECORD')
      } else {
        showFlashMessage('DAMAGE DEALT')
      }
    } catch {
      // silent
    } finally {
      setLogging(false)
    }
  }

  // Scroll sets history to bottom
  const setsEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [block.sets.length])

  useEffect(() => {
    return () => { if (flashMsgRef.current) clearTimeout(flashMsgRef.current) }
  }, [])

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{
        background: 'rgba(10,10,20,0.9)',
        border: `1px solid ${color}40`,
        boxShadow: `0 0 20px ${color}20`,
      }}
    >
      {/* Exercise header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderLeft: `3px solid ${color}`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: `${color}0a`,
        }}
      >
        <div className="flex items-center gap-3">
          <DisciplineSVGBadge discipline={block.exercise.discipline} size={28} glow={true} />
          <div>
            <p
              className="font-bold text-gray-100 text-sm leading-tight"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {block.exercise.name}
            </p>
            <p className="text-[11px] text-gray-500 capitalize">
              {block.exercise.discipline}
              {block.exercise.primaryMuscles?.length > 0 && (
                <> · {block.exercise.primaryMuscles.slice(0, 2).join(', ')}</>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onRemoveExercise}
          className="text-gray-600 hover:text-red-400 transition-colors p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Logged sets history (scrollable) */}
      {block.sets.length > 0 && (
        <div
          className="max-h-36 overflow-y-auto px-4 py-2 space-y-1"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {block.sets.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <span className="text-gray-600 w-5 font-mono text-center shrink-0">{i + 1}</span>
              <span className="font-semibold text-gray-300">{s.weight}kg</span>
              <span className="text-gray-500">×</span>
              <span className="font-semibold text-gray-300">{s.reps}</span>
              {s.rpe && (
                <span className="text-gray-600 ml-1">RPE {s.rpe}</span>
              )}
              {s.isPR && (
                <span
                  className="ml-auto flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded"
                  style={{
                    color: '#f59e0b',
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}
                >
                  <Zap size={8} /> PR
                </span>
              )}
            </motion.div>
          ))}
          <div ref={setsEndRef} />
        </div>
      )}

      {/* Active input area */}
      <div className="p-4 space-y-4">
        {/* Weight stepper */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block text-center">
            Weight (kg)
          </label>
          <div className="flex items-center justify-between gap-2">
            <StepperButton onClick={() => incrementWeight(-5)}>
              <span className="text-base">−5</span>
            </StepperButton>
            <StepperButton onClick={() => incrementWeight(-2.5)}>
              <Minus size={18} />
            </StepperButton>
            <div className="flex-1 text-center">
              <input
                type="number"
                min="0"
                step="0.5"
                value={weight}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)}
                className="w-full text-center text-2xl font-black bg-transparent outline-none text-gray-100"
                style={{ fontFamily: 'Cinzel, serif' }}
                placeholder="0"
              />
            </div>
            <StepperButton onClick={() => incrementWeight(2.5)}>
              <Plus size={18} />
            </StepperButton>
            <StepperButton onClick={() => incrementWeight(5)}>
              <span className="text-base">+5</span>
            </StepperButton>
          </div>

          {/* Quick weight presets based on last set */}
          {lastWeight > 0 && (
            <WeightPresets
              baseWeight={lastWeight}
              onSelect={setWeight}
              color={color}
            />
          )}
        </div>

        {/* Reps stepper */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block text-center">
            Reps
          </label>
          <div className="flex items-center justify-between gap-3">
            <StepperButton onClick={() => incrementReps(-1)}>
              <Minus size={18} />
            </StepperButton>
            <div className="flex-1 text-center">
              <span
                className="text-4xl font-black text-gray-100"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                <AnimatedNumber value={repsNum} duration={150} decimals={0} />
              </span>
            </div>
            <StepperButton onClick={() => incrementReps(1)}>
              <Plus size={18} />
            </StepperButton>
          </div>
        </div>

        {/* RPE selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block text-center">
            RPE
          </label>
          <div className="flex gap-1 justify-center flex-wrap">
            {RPE_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRpe(r)}
                className="min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold transition-all active:scale-90"
                style={{
                  background: rpe === r ? color : 'rgba(255,255,255,0.05)',
                  color: rpe === r ? '#fff' : '#6b7280',
                  border: `1px solid ${rpe === r ? color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: rpe === r ? `0 0 10px ${color}60` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* LOG SET button with CombatFlash wrapper */}
        <FlashWrapper>
          <div className="relative">
            {/* Flash message overlay */}
            <AnimatePresence>
              {flashMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.85 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                >
                  <span
                    className="font-black tracking-[0.2em] text-lg"
                    style={{
                      fontFamily: 'Cinzel, serif',
                      color: flashMsg.includes('RECORD') ? '#f59e0b' : '#8b5cf6',
                      textShadow: flashMsg.includes('RECORD')
                        ? '0 0 20px #f59e0b, 0 0 40px #f59e0b80'
                        : '0 0 20px #8b5cf6, 0 0 40px #8b5cf680',
                    }}
                  >
                    {flashMsg}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={handleLogSet}
              disabled={!weight || !reps || logging}
              whileTap={{ scale: 0.97 }}
              className="w-full font-black tracking-[0.2em] uppercase text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: '1.05rem',
                minHeight: 52,
                borderRadius: 14,
                background: (!weight || !reps || logging)
                  ? 'rgba(100,60,180,0.3)'
                  : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 60%, #4c1d95 100%)',
                boxShadow: (!weight || !reps || logging)
                  ? 'none'
                  : '0 4px 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2)',
                border: '1px solid rgba(139,92,246,0.4)',
              }}
            >
              {logging ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging...
                </span>
              ) : (
                'LOG SET'
              )}
            </motion.button>
          </div>
        </FlashWrapper>
      </div>
    </div>
  )
}

// ─── Desktop table set row ──────────────────────────────────────────────────
function DesktopSetRow({
  setIndex,
  row,
  color,
  onChange,
  onRemove,
  onEnter,
}: {
  setIndex: number
  row: SetRow
  color: string
  onChange: (field: keyof SetRow, value: string) => void
  onRemove: () => void
  onEnter: () => void
}) {
  const weightRef = useRef<HTMLInputElement>(null)
  const repsRef = useRef<HTMLInputElement>(null)
  const rpeRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef?: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef?.current) {
        nextRef.current.focus()
      } else {
        onEnter()
      }
    }
  }

  const inputClass =
    'w-full bg-background-secondary border border-background-border rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-purple-500/60 transition-colors text-center'

  return (
    <tr className={cn('border-b border-background-border/50 transition-all', row.isPR ? 'bg-yellow-500/5' : '')}>
      <td className="px-3 py-2 text-xs text-gray-500 font-mono w-8">{setIndex + 1}</td>
      <td className="px-2 py-2 w-28">
        <input
          ref={weightRef}
          type="number"
          min="0"
          step="0.5"
          className={inputClass}
          placeholder="kg"
          value={row.weight}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('weight', e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, repsRef)}
        />
      </td>
      <td className="px-2 py-2 w-24">
        <input
          ref={repsRef}
          type="number"
          min="0"
          className={inputClass}
          placeholder="reps"
          value={row.reps}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('reps', e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, rpeRef)}
        />
      </td>
      <td className="px-2 py-2 w-20">
        <input
          ref={rpeRef}
          type="number"
          min="6"
          max="10"
          step="0.5"
          className={inputClass}
          placeholder="RPE"
          value={row.rpe}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('rpe', e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e)}
        />
      </td>
      <td className="px-2 py-2 w-12 text-center">
        {row.isPR && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded"
            style={{
              color: '#f59e0b',
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            <Zap size={8} /> PR
          </span>
        )}
      </td>
      <td className="px-2 py-2 w-10">
        <button
          onClick={onRemove}
          className="text-gray-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}

// ─── Desktop exercise block ──────────────────────────────────────────────────
function DesktopExerciseBlock({
  block,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
}: {
  block: ExerciseBlock
  onUpdateSet: (setIdx: number, field: keyof SetRow, value: string) => void
  onAddSet: () => void
  onRemoveSet: (setIdx: number) => void
  onRemoveExercise: () => void
}) {
  const color = disciplineColor(block.exercise.discipline)

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{
        background: 'rgba(10,10,20,0.85)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: `0 0 16px ${color}15`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderLeft: `3px solid ${color}`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: `${color}0a`,
        }}
      >
        <div className="flex items-center gap-3">
          <DisciplineSVGBadge discipline={block.exercise.discipline} size={28} glow={true} />
          <div>
            <p
              className="font-semibold text-gray-100 text-sm"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {block.exercise.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {block.exercise.discipline} · {block.exercise.primaryMuscles?.join(', ')}
            </p>
          </div>
        </div>
        <button
          onClick={onRemoveExercise}
          className="text-gray-600 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded"
        >
          Remove
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-background-border">
              <th className="px-3 py-2 text-xs text-gray-600 text-left w-8">#</th>
              <th className="px-2 py-2 text-xs text-gray-500 text-center w-28">Weight (kg)</th>
              <th className="px-2 py-2 text-xs text-gray-500 text-center w-24">Reps</th>
              <th className="px-2 py-2 text-xs text-gray-500 text-center w-20">RPE</th>
              <th className="px-2 py-2 text-xs text-gray-500 text-center w-12"></th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {block.sets.map((row, i) => (
              <DesktopSetRow
                key={i}
                setIndex={i}
                row={row}
                color={color}
                onChange={(field, value) => onUpdateSet(i, field, value)}
                onRemove={() => onRemoveSet(i)}
                onEnter={onAddSet}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add set */}
      <div className="px-4 py-3 border-t border-background-border">
        <button
          onClick={onAddSet}
          className="flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ color }}
        >
          <Plus size={14} />
          Add Set
        </button>
      </div>
    </div>
  )
}

// ─── WorkoutLogger ───────────────────────────────────────────────────────────
export default function WorkoutLogger({ session, onPRDetected }: WorkoutLoggerProps) {
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([])
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([])
  const { addSet } = useWorkoutStore()

  const addExercise = useCallback((ex: Exercise) => {
    setBlocks((prev) => {
      if (prev.some((b) => b.exercise.id === ex.id)) {
        return prev.map((b) =>
          b.exercise.id === ex.id
            ? { ...b, sets: [...b.sets, { weight: '', reps: '', rpe: '' }] }
            : b,
        )
      }
      return [...prev, { exercise: ex, sets: [{ weight: '', reps: '', rpe: '' }] }]
    })
    setRecentExercises((prev) => {
      const without = prev.filter((r) => r.id !== ex.id)
      return [ex, ...without].slice(0, 6)
    })
  }, [])

  // For mobile: commit a set via the LOG SET button
  const commitMobileSet = useCallback(
    async (blockIdx: number, row: SetRow): Promise<boolean> => {
      const block = blocks[blockIdx]
      if (!block) return false

      // Add to UI immediately
      setBlocks((prev) =>
        prev.map((b, bi) =>
          bi !== blockIdx ? b : { ...b, sets: [...b.sets, { ...row }] },
        ),
      )

      let isPR = false
      if (row.weight && row.reps) {
        try {
          const saved = await workouts.addSet(session.id, {
            exerciseId: block.exercise.id,
            exerciseName: block.exercise.name,
            discipline: block.exercise.discipline,
            weight: parseFloat(row.weight),
            reps: parseInt(row.reps, 10),
            rpe: row.rpe ? parseFloat(row.rpe) : undefined,
          })
          isPR = !!saved.isPR
          if (saved.isPR && onPRDetected) {
            onPRDetected(saved)
            setBlocks((prev) =>
              prev.map((b, bi) => {
                if (bi !== blockIdx) return b
                const sets = [...b.sets]
                const lastIdx = sets.length - 1
                sets[lastIdx] = { ...sets[lastIdx], isPR: true, id: saved.id }
                return { ...b, sets }
              }),
            )
          }
          addSet(saved)
        } catch {
          // silent
        }
      }
      return isPR
    },
    [blocks, session.id, onPRDetected, addSet],
  )

  // For desktop: field-level update
  const updateDesktopSet = useCallback(
    async (blockIdx: number, setIdx: number, field: keyof SetRow, value: string) => {
      setBlocks((prev: ExerciseBlock[]) =>
        prev.map((b: ExerciseBlock, bi: number) => {
          if (bi !== blockIdx) return b
          const sets = b.sets.map((s: SetRow, si: number) =>
            si === setIdx ? { ...s, [field]: value } : s,
          )
          return { ...b, sets }
        }),
      )

      const block = blocks[blockIdx]
      if (!block) return
      const set = { ...blocks[blockIdx].sets[setIdx], [field]: value }
      if (set.weight && set.reps) {
        try {
          const saved = await workouts.addSet(session.id, {
            exerciseId: block.exercise.id,
            exerciseName: block.exercise.name,
            discipline: block.exercise.discipline,
            weight: parseFloat(set.weight),
            reps: parseInt(set.reps, 10),
            rpe: set.rpe ? parseFloat(set.rpe) : undefined,
          })
          if (saved.isPR && onPRDetected) {
            onPRDetected(saved)
            setBlocks((prev: ExerciseBlock[]) =>
              prev.map((b: ExerciseBlock, bi: number) =>
                bi !== blockIdx
                  ? b
                  : {
                      ...b,
                      sets: b.sets.map((s: SetRow, si: number) =>
                        si === setIdx ? { ...s, isPR: true, id: saved.id } : s,
                      ),
                    },
              ),
            )
          }
        } catch {
          // silent
        }
      }
    },
    [blocks, session.id, onPRDetected],
  )

  const addSetToBlock = useCallback((blockIdx: number) => {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === blockIdx
          ? { ...b, sets: [...b.sets, { weight: '', reps: '', rpe: '' }] }
          : b,
      ),
    )
  }, [])

  const removeSetFromBlock = useCallback((blockIdx: number, setIdx: number) => {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === blockIdx
          ? { ...b, sets: b.sets.filter((_: SetRow, si: number) => si !== setIdx) }
          : b,
      ),
    )
  }, [])

  const removeBlock = useCallback((blockIdx: number) => {
    setBlocks((prev) => prev.filter((_: ExerciseBlock, i: number) => i !== blockIdx))
  }, [])

  return (
    <div className="space-y-4">
      {/* ── Exercise search ─────────────────────────── */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(10,10,20,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 0 20px rgba(124,58,237,0.08)',
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
          style={{ color: '#7c3aed', fontFamily: 'Cinzel, serif' }}
        >
          Add Exercise
        </p>
        <ExerciseSearch onSelect={addExercise} recentExercises={recentExercises} />

        {/* Recent exercise quick-tap grid (mobile only) */}
        {recentExercises.length > 0 && (
          <div className="mt-3 md:hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
              Recent
            </p>
            <div className="grid grid-cols-2 gap-2">
              {recentExercises.slice(0, 4).map((ex) => {
                const color = disciplineColor(ex.discipline)
                return (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex)}
                    className="flex items-center gap-2 p-3 rounded-xl text-left transition-all active:scale-95 min-h-[56px]"
                    style={{
                      background: `${color}0d`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <DisciplineSVGBadge discipline={ex.discipline} size={20} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate leading-tight">
                        {ex.name}
                      </p>
                      <p className="text-[10px] capitalize" style={{ color }}>
                        {ex.discipline}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Empty state ────────────────────────────── */}
      <AnimatePresence>
        {blocks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 text-gray-500"
          >
            <div
              className="text-5xl mb-4 select-none"
              style={{ filter: 'grayscale(0.4) opacity(0.5)' }}
            >
              ⚔
            </div>
            <p
              className="text-base text-gray-400 mb-1"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              No Exercises Added
            </p>
            <p className="text-sm text-gray-600">
              Search for an exercise above to begin your battle
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exercise blocks (mobile) ───────────────── */}
      <div className="md:hidden space-y-0">
        <AnimatePresence initial={false}>
          {blocks.map((block, bi) => (
            <motion.div
              key={block.exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              <MobileCombatSetLogger
                block={block}
                blockIdx={bi}
                onCommitSet={commitMobileSet}
                onRemoveExercise={() => removeBlock(bi)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Exercise blocks (desktop) ──────────────── */}
      <div className="hidden md:block space-y-0">
        <AnimatePresence initial={false}>
          {blocks.map((block, bi) => (
            <motion.div
              key={block.exercise.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <DesktopExerciseBlock
                block={block}
                onUpdateSet={(si, field, value) =>
                  updateDesktopSet(bi, si, field, value)
                }
                onAddSet={() => addSetToBlock(bi)}
                onRemoveSet={(si) => removeSetFromBlock(bi, si)}
                onRemoveExercise={() => removeBlock(bi)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
