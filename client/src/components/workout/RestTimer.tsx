import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '../../lib/utils'

const PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
]

const RING_RADIUS = 46
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS // ≈ 289

// ─── Web Audio beep ────────────────────────────────────────────────────────
function playCompletionBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const gainNode = ctx.createGain()
    gainNode.connect(ctx.destination)
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime)

    // Three-note ding
    const freqs = [880, 1100, 1320]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.connect(gainNode)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.22)
    })

    gainNode.gain.setValueAtTime(0.4, ctx.currentTime + freqs.length * 0.18)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
  } catch {
    // AudioContext not available
  }
}

export default function RestTimer() {
  const [duration, setDuration] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setRemaining(duration)
    setCompleted(false)
    completedRef.current = false
  }, [duration, stop])

  const start = useCallback(() => {
    if (remaining <= 0) return
    setRunning(true)
    setCompleted(false)
    completedRef.current = false
  }, [remaining])

  const pause = useCallback(() => {
    stop()
  }, [stop])

  // Tick
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          setRunning(false)
          if (!completedRef.current) {
            completedRef.current = true
            setCompleted(true)
            playCompletionBeep()
          }
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  // Sync remaining when duration changes (only if not running)
  const handlePreset = (secs: number) => {
    if (running) return
    setDuration(secs)
    setRemaining(secs)
    setCompleted(false)
    completedRef.current = false
  }

  const progress = duration > 0 ? remaining / duration : 0
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const fmt = (n: number) => String(n).padStart(2, '0')

  const ringColor = completed ? '#f59e0b' : running ? '#8b5cf6' : '#4b5563'
  const glowColor = completed ? '0 0 20px rgba(245,158,11,0.5)' : running ? '0 0 20px rgba(139,92,246,0.4)' : 'none'

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Circular ring */}
      <div className="relative" style={{ filter: running || completed ? `drop-shadow(${glowColor})` : 'none' }}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          {/* Background ring */}
          <circle
            cx={60}
            cy={60}
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(30,30,46,0.8)"
            strokeWidth={8}
          />
          {/* Progress ring */}
          <circle
            cx={60}
            cy={60}
            r={RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s ease' }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-xl font-bold"
            style={{ color: completed ? '#f59e0b' : running ? '#a78bfa' : '#9ca3af' }}
          >
            {fmt(minutes)}:{fmt(seconds)}
          </span>
          {completed && (
            <span className="text-[9px] font-bold text-gold-400 uppercase tracking-widest mt-0.5 animate-pulse">
              Done!
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="w-9 h-9 rounded-full bg-background-secondary border border-background-border flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>

        <button
          onClick={running ? pause : start}
          disabled={remaining === 0 && !completed}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all',
            running
              ? 'bg-purple-600/30 border border-purple-500/50 text-purple-300 hover:bg-purple-600/40'
              : completed
                ? 'bg-gold-500/20 border border-gold-500/40 text-gold-400 hover:bg-gold-500/30'
                : 'bg-purple-700/40 border border-purple-600/50 text-white hover:bg-purple-700/60 shadow-purple-glow-sm',
          )}
        >
          {running ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2">
        {PRESETS.map(({ label, seconds: secs }) => (
          <button
            key={label}
            onClick={() => handlePreset(secs)}
            disabled={running}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border',
              duration === secs && !running
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                : 'bg-background-secondary border-background-border text-gray-400 hover:text-gray-200 disabled:opacity-40',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
