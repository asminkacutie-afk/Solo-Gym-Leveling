import { useEffect, useRef } from 'react'

interface PRCelebrationProps {
  exerciseName: string
  weight: number
  reps: number
  onDismiss: () => void
}

// ─── Particle ──────────────────────────────────────────────────────────────
function Particle({ index }: { index: number }) {
  const angle = (index / 24) * 360
  const distance = 80 + Math.random() * 120
  const tx = Math.cos((angle * Math.PI) / 180) * distance
  const ty = Math.sin((angle * Math.PI) / 180) * distance
  const size = 4 + Math.random() * 6
  const delay = Math.random() * 0.3
  const colors = ['#f59e0b', '#fbbf24', '#d97706', '#8b5cf6', '#a78bfa', '#ffffff']
  const color = colors[Math.floor(Math.random() * colors.length)]

  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        ['--px' as string]: `${tx}px`,
        ['--py' as string]: `${ty}px`,
        animation: `particle-fly 1s ease-out ${delay}s forwards`,
      }}
    />
  )
}

export default function PRCelebration({
  exerciseName,
  weight,
  reps,
  onDismiss,
}: PRCelebrationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 3000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onDismiss])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
      onClick={onDismiss}
    >
      {/* Particles */}
      <div className="relative">
        {Array.from({ length: 24 }).map((_, i) => (
          <Particle key={i} index={i} />
        ))}

        {/* Card */}
        <div
          className="relative z-10 bg-background-card border border-gold-500/40 rounded-2xl px-10 py-8 text-center shadow-gold-glow animate-level-up pointer-events-none"
          style={{ minWidth: 280 }}
        >
          {/* PR badge */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-400 font-display font-black text-lg tracking-wider">
              ⚡ PERSONAL RECORD
            </span>
          </div>

          {/* Exercise name */}
          <p className="font-display text-2xl font-bold text-gray-100 mb-4">
            {exerciseName}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <p className="font-display text-4xl font-black gradient-text-gold">{weight}</p>
              <p className="text-xs text-gray-400 uppercase tracking-widest">kg</p>
            </div>
            <div className="text-gray-600 text-2xl font-thin">×</div>
            <div className="text-center">
              <p className="font-display text-4xl font-black text-purple-400">{reps}</p>
              <p className="text-xs text-gray-400 uppercase tracking-widest">reps</p>
            </div>
          </div>

          {/* New record line */}
          <p className="text-sm text-gray-400 mt-4">
            New personal best — keep pushing!
          </p>

          <p className="text-xs text-gray-600 mt-3">Click to dismiss</p>
        </div>
      </div>
    </div>
  )
}
