import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import DisciplineSVGBadge from './DisciplineSVGBadge'
import AnimatedNumber from '../ui/AnimatedNumber'
import { cn, disciplineColor, rankBadgeClass, calculateLevelProgress, formatXP } from '../../lib/utils'
import type { DisciplineData } from '../../lib/api'

interface DisciplineCardProps {
  discipline: DisciplineData
}

// ─── Discipline glow colors ────────────────────────────────────────────────
const DISCIPLINE_GLOW: Record<string, string> = {
  power: 'rgba(239,68,68,0.4)',
  strength: 'rgba(239,68,68,0.4)',
  titan: 'rgba(245,158,11,0.4)',
  precision: 'rgba(56,189,248,0.4)',
  endurance: 'rgba(16,185,129,0.4)',
  speed: 'rgba(16,185,129,0.4)',
  vitality: 'rgba(236,72,153,0.4)',
  flexibility: 'rgba(236,72,153,0.4)',
  synthesis: 'rgba(139,92,246,0.4)',
  recovery: 'rgba(139,92,246,0.4)',
}

function getDisciplineGlow(name?: string | null): string {
  return DISCIPLINE_GLOW[(name ?? '').toLowerCase()] ?? 'rgba(139,92,246,0.4)'
}

// ─── Rank badge styles ─────────────────────────────────────────────────────
const RANK_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  iron:     { bg: 'rgba(107,114,128,0.2)', border: '#6b7280', text: '#9ca3af' },
  bronze:   { bg: 'rgba(180,83,9,0.2)',   border: '#d97706', text: '#fbbf24' },
  silver:   { bg: 'rgba(100,116,139,0.2)',border: '#94a3b8', text: '#cbd5e1' },
  gold:     { bg: 'rgba(161,98,7,0.2)',   border: '#ca8a04', text: '#facc15' },
  platinum: { bg: 'rgba(8,145,178,0.2)',  border: '#22d3ee', text: '#67e8f9' },
  mythic:   { bg: 'rgba(109,40,217,0.2)', border: '#a78bfa', text: '#c4b5fd' },
}

function getRankStyle(rank?: string | null) {
  return RANK_STYLES[(rank ?? '').toLowerCase()] ?? RANK_STYLES.iron
}

const STAT_ABBREV: Record<string, string> = {
  strength: 'STR',
  endurance: 'END',
  power: 'PWR',
  speed: 'SPD',
  recovery: 'REC',
  flexibility: 'FLX',
}

// ─── Animated stat bar ─────────────────────────────────────────────────────
function AnimatedStatBar({
  label,
  value,
  color,
  delay = 0,
}: {
  label: string
  value: number
  color: string
  delay?: number
}) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay + 80)
    return () => clearTimeout(t)
  }, [delay])

  const pct = Math.min(100, Math.max(0, value))

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <span
        className="text-[10px] font-bold w-7 shrink-0 uppercase tracking-wider"
        style={{ color: '#38bdf8' }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: animated ? `${pct}%` : '0%',
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}60`,
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      <AnimatedNumber
        value={value}
        duration={600}
        decimals={0}
        className="text-[10px] font-semibold w-6 text-right shrink-0"
      />
    </div>
  )
}

// ─── DisciplineCard ────────────────────────────────────────────────────────
export default function DisciplineCard({ discipline }: DisciplineCardProps) {
  const [hovered, setHovered] = useState(false)
  const color = disciplineColor(discipline.name)
  const glow = getDisciplineGlow(discipline.name)
  const pct = calculateLevelProgress(discipline.xp, discipline.xpToNext)
  const rankStyle = getRankStyle(discipline.rank)
  const rankClass = rankBadgeClass(discipline.rank)
  const statEntries = Object.entries(discipline.stats ?? {}).slice(0, 5)
  const xpRemaining = Math.max(0, discipline.xpToNext - discipline.xp)

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ scale: hovered ? 1.02 : 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="rounded-xl overflow-hidden cursor-default relative"
      style={{
        background: 'rgba(10,10,20,0.85)',
        borderLeft: `3px solid ${color}`,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: hovered
          ? `0 0 32px ${glow}, -4px 0 16px ${color}40`
          : `0 0 12px ${glow}80, -2px 0 8px ${color}20`,
        transition: 'box-shadow 0.25s ease',
      }}
    >
      {/* Left border glow line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] pointer-events-none"
        style={{
          background: color,
          boxShadow: hovered ? `0 0 12px 2px ${color}` : `0 0 6px 1px ${color}80`,
          transition: 'box-shadow 0.25s ease',
        }}
      />

      <div className="p-4 pl-5">
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* SVG badge with glow */}
            <div
              className="rounded-lg p-1.5 flex items-center justify-center"
              style={{
                background: `${color}18`,
                boxShadow: `0 0 10px ${color}30`,
              }}
            >
              <DisciplineSVGBadge discipline={discipline.name} size={36} glow={true} />
            </div>

            <div>
              <p
                className="font-bold text-gray-100 leading-tight"
                style={{ fontFamily: 'Cinzel, serif', fontSize: '0.95rem' }}
              >
                {discipline.name}
              </p>
              <p className="text-xs text-gray-500">Level {discipline.level}</p>
            </div>
          </div>

          {/* Rank badge */}
          <div
            className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest"
            style={{
              background: rankStyle.bg,
              border: `1px solid ${rankStyle.border}`,
              color: rankStyle.text,
              fontFamily: 'Cinzel, serif',
            }}
          >
            {discipline.rank}
          </div>
        </div>

        {/* ── XP bar ──────────────────────────────────── */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400 font-semibold">
              {formatXP(discipline.xp)} / {formatXP(discipline.xpToNext)}
            </span>
            <span className="font-bold" style={{ color }}>
              {pct}%
            </span>
          </div>

          {/* Bar */}
          <div
            className="h-2.5 rounded-full overflow-hidden relative"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.0, ease: 'easeOut', delay: 0.15 }}
              className="h-full rounded-full relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, ${color}cc, ${color})`,
                boxShadow: `0 0 10px ${color}60`,
              }}
            >
              {/* Shimmer */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2.2s linear infinite',
                }}
              />
            </motion.div>
          </div>

          <p className="text-[11px] text-gray-600 mt-1 text-right">
            {formatXP(xpRemaining)} to next level
          </p>
        </div>

        {/* ── Stats grid ──────────────────────────────── */}
        {statEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {statEntries.map(([key, val], idx) => {
              const label = STAT_ABBREV[key.toLowerCase()] ?? key.slice(0, 3).toUpperCase()
              return (
                <AnimatedStatBar
                  key={key}
                  label={label}
                  value={Number(val)}
                  color={color}
                  delay={idx * 60}
                />
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
