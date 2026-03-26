import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Zap } from 'lucide-react'
import { workouts } from '../../lib/api'
import type { WorkoutSession, WorkoutSet, Exercise } from '../../lib/api'
import { useWorkoutStore } from '../../store/workoutStore'
import ExerciseSearch from './ExerciseSearch'
import { cn, disciplineColor, disciplineIcon } from '../../lib/utils'

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

// ─── Set input row ─────────────────────────────────────────────────────────
function SetInputRow({
  setIndex,
  row,
  color,
  onChange,
  onRemove,
  onEnter,
  isPR,
}: {
  setIndex: number
  row: SetRow
  color: string
  onChange: (field: keyof SetRow, value: string) => void
  onRemove: () => void
  onEnter: () => void
  isPR?: boolean
}) {
  const weightRef = useRef<HTMLInputElement>(null)
  const repsRef = useRef<HTMLInputElement>(null)
  const rpeRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef?.current) {
        nextRef.current.focus()
      } else {
        onEnter()
      }
    }
  }

  return (
    <tr
      className={cn(
        'border-b border-background-border/50 transition-all',
        isPR && 'bg-gold-500/8',
      )}
    >
      {/* Set # */}
      <td className="px-3 py-2 text-xs text-gray-500 font-mono w-8">
        {setIndex + 1}
      </td>

      {/* Weight */}
      <td className="px-2 py-2 w-28">
        <div className="relative">
          <input
            ref={weightRef}
            type="number"
            min="0"
            step="0.5"
            className="w-full bg-background-secondary border border-background-border rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-purple-500/60 transition-colors text-center"
            placeholder="kg"
            value={row.weight}
            onChange={(e) => onChange('weight', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, repsRef)}
          />
        </div>
      </td>

      {/* Reps */}
      <td className="px-2 py-2 w-24">
        <input
          ref={repsRef}
          type="number"
          min="0"
          className="w-full bg-background-secondary border border-background-border rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-purple-500/60 transition-colors text-center"
          placeholder="reps"
          value={row.reps}
          onChange={(e) => onChange('reps', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, rpeRef)}
        />
      </td>

      {/* RPE */}
      <td className="px-2 py-2 w-20">
        <input
          ref={rpeRef}
          type="number"
          min="6"
          max="10"
          step="0.5"
          className="w-full bg-background-secondary border border-background-border rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-purple-500/60 transition-colors text-center"
          placeholder="RPE"
          value={row.rpe}
          onChange={(e) => onChange('rpe', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
        />
      </td>

      {/* PR badge */}
      <td className="px-2 py-2 w-12 text-center">
        {isPR && (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-gold-400 bg-gold-500/15 border border-gold-500/30 rounded px-1.5 py-0.5">
            <Zap size={8} /> PR
          </span>
        )}
      </td>

      {/* Remove */}
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

// ─── Exercise block ────────────────────────────────────────────────────────
function ExerciseBlockView({
  block,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onPRDetected,
  onRemoveExercise,
}: {
  block: ExerciseBlock
  onUpdateSet: (setIdx: number, field: keyof SetRow, value: string) => void
  onAddSet: () => void
  onRemoveSet: (setIdx: number) => void
  onPRDetected?: (setIdx: number) => void
  onRemoveExercise: () => void
}) {
  const color = disciplineColor(block.exercise.discipline)
  const icon = disciplineIcon(block.exercise.discipline)

  return (
    <div className="card-glow rounded-xl bg-background-card overflow-hidden mb-4">
      {/* Exercise header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-background-border"
        style={{ borderLeftColor: color, borderLeftWidth: 3 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ backgroundColor: color + '25' }}
          >
            {icon}
          </div>
          <div>
            <p className="font-semibold text-gray-100 text-sm">{block.exercise.name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {block.exercise.discipline} · {block.exercise.primaryMuscles?.join(', ')}
            </p>
          </div>
        </div>

        <button
          onClick={onRemoveExercise}
          className="text-gray-600 hover:text-red-400 transition-colors text-xs"
        >
          Remove
        </button>
      </div>

      {/* Sets table */}
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
              <SetInputRow
                key={i}
                setIndex={i}
                row={row}
                color={color}
                isPR={row.isPR}
                onChange={(field, value) => onUpdateSet(i, field, value)}
                onRemove={() => onRemoveSet(i)}
                onEnter={onAddSet}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add set button */}
      <div className="px-4 py-3 border-t border-background-border">
        <button
          onClick={onAddSet}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors font-semibold"
        >
          <Plus size={14} />
          Add Set
        </button>
      </div>
    </div>
  )
}

// ─── WorkoutLogger ─────────────────────────────────────────────────────────
export default function WorkoutLogger({ session, onPRDetected }: WorkoutLoggerProps) {
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([])
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([])
  const { addSet, removeSet } = useWorkoutStore()

  // Pre-populate from existing session sets
  // (grouped by exercise)
  const addExercise = useCallback((ex: Exercise) => {
    setBlocks((prev) => {
      if (prev.some((b) => b.exercise.id === ex.id)) {
        // Already in the block list — just add a set
        return prev.map((b) =>
          b.exercise.id === ex.id
            ? { ...b, sets: [...b.sets, { weight: '', reps: '', rpe: '' }] }
            : b,
        )
      }
      return [
        ...prev,
        { exercise: ex, sets: [{ weight: '', reps: '', rpe: '' }] },
      ]
    })
    setRecentExercises((prev) => {
      const without = prev.filter((r) => r.id !== ex.id)
      return [ex, ...without].slice(0, 5)
    })
  }, [])

  const updateSet = useCallback(
    async (
      blockIdx: number,
      setIdx: number,
      field: keyof SetRow,
      value: string,
    ) => {
      setBlocks((prev) => {
        const updated = prev.map((b, bi) => {
          if (bi !== blockIdx) return b
          const sets = b.sets.map((s, si) =>
            si === setIdx ? { ...s, [field]: value } : s,
          )
          return { ...b, sets }
        })
        return updated
      })

      // Auto-save complete sets to API
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
            setBlocks((prev) =>
              prev.map((b, bi) =>
                bi !== blockIdx
                  ? b
                  : {
                      ...b,
                      sets: b.sets.map((s, si) =>
                        si === setIdx ? { ...s, isPR: true, id: saved.id } : s,
                      ),
                    },
              ),
            )
          }
        } catch {
          // silent — user can retry
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
          ? { ...b, sets: b.sets.filter((_, si) => si !== setIdx) }
          : b,
      ),
    )
  }, [])

  const removeBlock = useCallback((blockIdx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== blockIdx))
  }, [])

  return (
    <div className="space-y-4">
      {/* Exercise search */}
      <div className="card-glow rounded-xl bg-background-card p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Add Exercise
        </p>
        <ExerciseSearch
          onSelect={addExercise}
          recentExercises={recentExercises}
        />
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-base font-display mb-1">No exercises added yet</p>
          <p className="text-sm">Search for an exercise above to start logging</p>
        </div>
      )}

      {/* Exercise blocks */}
      {blocks.map((block, bi) => (
        <ExerciseBlockView
          key={block.exercise.id}
          block={block}
          onUpdateSet={(si, field, value) => updateSet(bi, si, field, value)}
          onAddSet={() => addSetToBlock(bi)}
          onRemoveSet={(si) => removeSetFromBlock(bi, si)}
          onRemoveExercise={() => removeBlock(bi)}
        />
      ))}
    </div>
  )
}
