import React, { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedNumber from './AnimatedNumber'
import DisciplineSVGBadge from '../character/DisciplineSVGBadge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LevelUpScreenProps {
  discipline: string
  oldLevel: number
  newLevel: number
  rankBadge?: string
  onDismiss: () => void
  xpGained: number
}

interface Particle {
  id: number
  /** Percentage position on screen */
  x: number
  y: number
  /** CSS-variable trajectory offset in px */
  tx: number
  ty: number
  color: string
  size: number
  delay: number
  duration: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PARTICLE_COLORS = [
  '#7c3aed', // deep purple
  '#8b5cf6', // violet
  '#a78bfa', // soft purple
  '#f59e0b', // gold
  '#fbbf24', // bright gold
  '#fde68a', // pale gold
  '#ffffff', // white sparkle
  '#e879f9', // fuchsia accent
]

const PARTICLE_COUNT = 60
const AUTO_DISMISS_MS = 4000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const distance = rand(120, 380)
    return {
      id: i,
      x: rand(10, 90),
      y: rand(10, 90),
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: rand(3, 8),
      delay: rand(0, 0.8),
      duration: rand(0.8, 1.6),
    }
  })
}

// ─── Particle burst keyframe (injected once) ─────────────────────────────────

const PARTICLE_CSS = `
@keyframes particle-burst {
  0%   { transform: translate(0, 0) scale(1);   opacity: 1; }
  60%  { opacity: 0.8; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
}
`

let particleStyleInjected = false
function injectParticleStyle(): void {
  if (particleStyleInjected || typeof document === 'undefined') return
  const tag = document.createElement('style')
  tag.textContent = PARTICLE_CSS
  document.head.appendChild(tag)
  particleStyleInjected = true
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LevelUpScreen({
  discipline,
  oldLevel,
  newLevel,
  rankBadge,
  onDismiss,
  xpGained,
}: LevelUpScreenProps) {
  injectParticleStyle()

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onDismiss])

  // Generate particles once on mount; useMemo keyed to [] so they don't
  // re-randomise on every render but are stable for this overlay instance.
  const particles = useMemo<Particle[]>(buildParticles, [])

  return (
    <AnimatePresence>
      <motion.div
        key="levelup-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(109,40,217,0.4) 0%, rgba(10,10,15,0.97) 68%)',
          backgroundColor: '#0a0a0f',
        }}
        onClick={onDismiss}
      >
        {/* ── Particles ── */}
        {particles.map((p: Particle) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
                animation: `particle-burst ${p.duration}s ease-out ${p.delay}s both`,
              } as React.CSSProperties
            }
          />
        ))}

        {/* ── Inset edge glow burst (fades immediately) ── */}
        <motion.div
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              'inset 0 0 80px rgba(139,92,246,0.55), inset 0 0 180px rgba(245,158,11,0.18)',
          }}
        />

        {/* ── Center content ── */}
        <div
          className="relative z-10 flex flex-col items-center gap-5 px-8 text-center select-none"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* 1. Discipline SVG badge */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.08 }}
          >
            <DisciplineSVGBadge discipline={discipline} size={80} glow />
          </motion.div>

          {/* 2. LEVEL UP heading */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
          >
            <h1
              className="font-display font-black uppercase leading-none tracking-widest"
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                background:
                  'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 40%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 28px rgba(139,92,246,0.75))',
              }}
            >
              Level Up
            </h1>
          </motion.div>

          {/* 3. Level number: old → new */}
          <motion.div
            initial={{ opacity: 0, scale: 0.65 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.36 }}
            className="flex items-center gap-4"
          >
            {/* Old level (struck-through, dimmed) */}
            <span
              className="font-display font-bold text-gray-600 line-through"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {oldLevel}
            </span>

            {/* Arrow */}
            <span
              className="font-display text-3xl"
              style={{ color: '#8b5cf6' }}
            >
              →
            </span>

            {/* New level (gold, glowing) */}
            <span
              className="font-display font-black"
              style={{
                fontSize: 'clamp(3rem, 9vw, 6rem)',
                color: '#f59e0b',
                filter: 'drop-shadow(0 0 24px rgba(245,158,11,0.85))',
              }}
            >
              <AnimatedNumber value={newLevel} duration={600} />
            </span>
          </motion.div>

          {/* Discipline name label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.48, duration: 0.35 }}
            className="font-display uppercase tracking-[0.3em] text-purple-300 text-sm"
          >
            {discipline}
          </motion.p>

          {/* 4. Rank badge (only if provided) */}
          {rankBadge && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.35 }}
              className="px-5 py-2 rounded-full border text-xs font-display uppercase tracking-widest"
              style={{
                borderColor: 'rgba(139,92,246,0.55)',
                background: 'rgba(109,40,217,0.2)',
                color: '#c4b5fd',
                boxShadow: '0 0 18px rgba(139,92,246,0.4)',
              }}
            >
              {rankBadge}
            </motion.div>
          )}

          {/* 5. XP gained */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68, duration: 0.35 }}
            className="font-display font-bold text-2xl"
            style={{
              color: '#f59e0b',
              filter: 'drop-shadow(0 0 14px rgba(245,158,11,0.65))',
            }}
          >
            +<AnimatedNumber value={xpGained} duration={900} suffix=" XP" />
          </motion.div>

          {/* Dismiss hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.38 }}
            transition={{ delay: 1.3, duration: 0.55 }}
            className="text-xs text-gray-500 tracking-wider uppercase cursor-pointer pointer-events-auto"
            onClick={onDismiss}
          >
            Tap to continue
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
