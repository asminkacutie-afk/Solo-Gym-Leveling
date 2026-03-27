import { useState, useCallback } from 'react'
import { Dumbbell } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { cn } from '../../lib/utils'

const HunterCharacterSVG = lazy(() => import('./HunterCharacterSVG'))

interface Props {
  currentBF?: number
  powerScore?: number
  gender?: 'male' | 'female'
  onSetMeasurement?: (bf: number) => void
  className?: string
}

interface Stage {
  min: number
  max: number
  label: string
  color: string
  description: string
}

const STAGES: Stage[] = [
  { min: 35, max: 45, label: 'Novice',    color: '#6b7280', description: 'Starting the journey' },
  { min: 30, max: 34.9, label: 'Initiate',  color: '#64748b', description: 'Body awakening' },
  { min: 25, max: 29.9, label: 'Awakening', color: '#38bdf8', description: 'Shape emerging' },
  { min: 20, max: 24.9, label: 'Athletic',  color: '#7c3aed', description: 'Athletic physique' },
  { min: 15, max: 19.9, label: 'Lean',      color: '#a78bfa', description: 'Lean and muscular' },
  { min: 12, max: 14.9, label: 'Shredded',  color: '#fbbf24', description: 'Elite physique' },
  { min: 0,  max: 11.9, label: 'Godlike',   color: '#f59e0b', description: 'Transcendent form' },
]

function getStageForBF(bf: number): Stage {
  return STAGES.find((s) => bf >= s.min && bf <= s.max) ?? STAGES[0]
}

export default function BFSlider({
  currentBF = 25,
  powerScore = 0,
  gender = 'male',
  onSetMeasurement,
  className,
}: Props) {
  const [previewBF, setPreviewBF] = useState(currentBF)
  const [isDragging, setIsDragging] = useState(false)

  const stage = getStageForBF(previewBF)
  const currentStage = getStageForBF(currentBF)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewBF(parseFloat(e.target.value))
  }, [])

  const sliderPercent = ((45 - previewBF) / (45 - 8)) * 100

  return (
    <div className={cn('card-glow rounded-2xl bg-background-card p-5 space-y-5', className)}>
      <div className="flex items-center gap-2">
        <Dumbbell size={16} className="text-purple-400" />
        <h3 className="font-display font-semibold text-gray-100 text-sm">
          Body Composition Preview
        </h3>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Current</p>
          <Suspense fallback={
            <div className="w-20 h-32 bg-background-secondary rounded-xl animate-pulse" />
          }>
            <HunterCharacterSVG
              bodyFat={currentBF}
              powerScore={powerScore}
              gender={gender}
              size={80}
              animated={false}
            />
          </Suspense>
          <div className="text-center">
            <p className="font-display font-bold text-base" style={{ color: currentStage.color }}>
              {currentBF.toFixed(1)}%
            </p>
            <p className="text-xs font-semibold" style={{ color: currentStage.color }}>
              {currentStage.label}
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Preview</p>
          <div className={cn('relative', isDragging && 'scale-105 transition-transform duration-150')}>
            <Suspense fallback={
              <div className="w-20 h-32 bg-background-secondary rounded-xl animate-pulse" />
            }>
              <HunterCharacterSVG
                bodyFat={previewBF}
                powerScore={powerScore}
                gender={gender}
                size={80}
                animated
              />
            </Suspense>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-base transition-colors duration-300"
              style={{ color: stage.color }}>
              {previewBF.toFixed(1)}%
            </p>
            <p className="text-xs font-semibold transition-colors duration-300"
              style={{ color: stage.color }}>
              {stage.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-3">
        <div className="relative">
          {/* Track background — gradient from gray (high BF) to gold (low BF) */}
          <div className="h-2 rounded-full overflow-hidden"
            style={{ background: 'linear-gradient(to right, #f59e0b, #a78bfa, #38bdf8, #6b7280)' }}
          />
          {/* Progress overlay (covers from right = high BF side) */}
          <div
            className="absolute top-0 right-0 h-2 rounded-r-full bg-background-card"
            style={{ width: `${100 - sliderPercent}%` }}
          />
          <input
            type="range"
            min="8"
            max="45"
            step="0.5"
            value={previewBF}
            onChange={handleChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
            style={{ touchAction: 'none' }}
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-background-card shadow-lg transition-all duration-75 pointer-events-none"
            style={{
              left: `calc(${sliderPercent}% - 10px)`,
              backgroundColor: stage.color,
              boxShadow: `0 0 12px ${stage.color}88`,
            }}
          />
        </div>

        {/* Stage labels */}
        <div className="flex justify-between text-xs text-gray-600">
          <span>8% (Godlike)</span>
          <span>45% (Novice)</span>
        </div>
      </div>

      {/* Stage milestones */}
      <div className="grid grid-cols-7 gap-1">
        {STAGES.slice().reverse().map((s) => {
          const isActive = previewBF >= s.min && previewBF <= s.max
          return (
            <button
              key={s.label}
              onClick={() => setPreviewBF((s.min + Math.min(s.max, s.max)) / 2)}
              className={cn(
                'py-1.5 rounded text-center transition-all text-xs font-semibold',
                isActive
                  ? 'border border-current'
                  : 'border border-background-border text-gray-600 hover:text-gray-400',
              )}
              style={isActive ? { color: s.color, borderColor: `${s.color}60`, backgroundColor: `${s.color}15` } : {}}
              title={`${s.min}–${s.max}% — ${s.label}`}
            >
              {s.label.charAt(0)}
            </button>
          )
        })}
      </div>

      {/* Set measurement button */}
      {onSetMeasurement && (
        <button
          onClick={() => onSetMeasurement(previewBF)}
          disabled={Math.abs(previewBF - currentBF) < 0.1}
          className={cn(
            'w-full py-3 rounded-xl font-display font-semibold text-sm transition-all',
            Math.abs(previewBF - currentBF) >= 0.1
              ? 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:shadow-purple-glow-sm'
              : 'bg-background-secondary border border-background-border text-gray-600 cursor-not-allowed',
          )}
        >
          {Math.abs(previewBF - currentBF) < 0.1
            ? 'Already at this value'
            : `Set as Today's Measurement (${previewBF.toFixed(1)}%)`}
        </button>
      )}
    </div>
  )
}
