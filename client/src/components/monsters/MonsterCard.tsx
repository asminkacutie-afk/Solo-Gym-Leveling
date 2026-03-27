import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MonsterSprite from './MonsterSprite'
import StatBar from '../ui/StatBar'
import type { Monster } from '../../lib/api'
import { cn, leagueBadgeClass, leagueBadgeEmoji } from '../../lib/utils'

interface MonsterCardProps {
  monster: Monster
  isDefeated: boolean
  statGap?: Record<string, number>
  compact?: boolean
  userStats?: Record<string, number>
}

// ─── Tier palette definitions ──────────────────────────────────────────────
interface TierPalette {
  bg: string
  border: string
  glow: string
  text: string
  accent: string
  shadowBase: string
  shadowHover: string
}

const TIER_PALETTES: Record<string, TierPalette> = {
  common: {
    bg: 'rgba(30,30,30,0.6)',
    border: '#374151',
    glow: 'transparent',
    text: '#9ca3af',
    accent: '#6b7280',
    shadowBase: 'none',
    shadowHover: '0 8px 24px rgba(55,65,81,0.3)',
  },
  rare: {
    bg: 'rgba(14,28,54,0.7)',
    border: '#1d4ed8',
    glow: 'rgba(29,78,216,0.3)',
    text: '#93c5fd',
    accent: '#3b82f6',
    shadowBase: '0 0 16px rgba(29,78,216,0.2)',
    shadowHover: '0 8px 32px rgba(29,78,216,0.4)',
  },
  epic: {
    bg: 'rgba(30,14,54,0.7)',
    border: '#7c3aed',
    glow: 'rgba(124,58,237,0.35)',
    text: '#c4b5fd',
    accent: '#8b5cf6',
    shadowBase: '0 0 20px rgba(124,58,237,0.25)',
    shadowHover: '0 8px 36px rgba(124,58,237,0.5)',
  },
  legendary: {
    bg: 'rgba(45,28,0,0.7)',
    border: '#d97706',
    glow: 'rgba(217,119,6,0.4)',
    text: '#fcd34d',
    accent: '#f59e0b',
    shadowBase: '0 0 22px rgba(217,119,6,0.25)',
    shadowHover: '0 8px 40px rgba(217,119,6,0.55)',
  },
  ancient: {
    bg: 'rgba(40,0,0,0.8)',
    border: '#dc2626',
    glow: 'rgba(220,38,38,0.5)',
    text: '#fca5a5',
    accent: '#ef4444',
    shadowBase: '0 0 28px rgba(220,38,38,0.35)',
    shadowHover: '0 8px 48px rgba(220,38,38,0.65)',
  },
}

function getPalette(tier: string): TierPalette {
  return TIER_PALETTES[tier.toLowerCase()] ?? TIER_PALETTES.common
}

// ─── Tier radial glow behind sprite ────────────────────────────────────────
function SpriteGlow({ color, tier }: { color: string; tier: string }) {
  if (tier === 'common') return null
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)`,
        opacity: 0.45,
        filter: 'blur(10px)',
      }}
    />
  )
}

// ─── Stat comparison row ────────────────────────────────────────────────────
function StatCompareRow({
  label,
  monsterVal,
  userVal,
  accent,
}: {
  label: string
  monsterVal: number
  userVal: number
  accent: string
}) {
  const userWins = userVal >= monsterVal
  const max = Math.max(monsterVal, userVal, 1)
  const monsterPct = Math.min(100, (monsterVal / max) * 100)
  const userPct = Math.min(100, (userVal / max) * 100)

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[9px] font-bold uppercase tracking-wider w-7 shrink-0"
        style={{ color: '#38bdf8' }}
      >
        {label.slice(0, 3)}
      </span>

      {/* Monster bar */}
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${monsterPct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 5px ${accent}80` }}
        />
      </div>

      {/* Indicator */}
      <span
        className="text-[10px] font-black w-4 text-center shrink-0"
        style={{ color: userWins ? '#22c55e' : '#dc2626' }}
      >
        {userWins ? '✓' : '✗'}
      </span>

      {/* User bar */}
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${userPct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: '#38bdf8', boxShadow: '0 0 5px rgba(56,189,248,0.6)' }}
        />
      </div>
    </div>
  )
}

// ─── Compact mode ──────────────────────────────────────────────────────────
function MonsterCardCompact({ monster, isDefeated }: { monster: Monster; isDefeated: boolean }) {
  const palette = getPalette(monster.tier)
  return (
    <motion.div
      whileHover={{ translateY: -2, boxShadow: palette.shadowHover }}
      className="rounded-xl p-3 flex items-center gap-3 transition-colors cursor-default"
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        boxShadow: palette.shadowBase,
      }}
    >
      <div className="relative shrink-0">
        <SpriteGlow color={palette.glow} tier={monster.tier} />
        <MonsterSprite tier={monster.tier} size={44} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="font-semibold text-sm truncate"
            style={{ fontFamily: 'Cinzel, serif', color: palette.text }}
          >
            {monster.name}
          </p>
          {isDefeated && (
            <span className="text-green-400 text-[10px] font-black shrink-0 tracking-wider">SLAIN</span>
          )}
        </div>
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: palette.accent, fontFamily: 'Cinzel, serif' }}
        >
          {monster.tier}
        </span>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold" style={{ color: palette.text }}>
          {monster.totalPower.toLocaleString()}
        </p>
        <p className="text-[10px]" style={{ color: palette.accent }}>power</p>
      </div>
    </motion.div>
  )
}

// ─── Main card ─────────────────────────────────────────────────────────────
export default function MonsterCard({
  monster,
  isDefeated,
  statGap,
  compact = false,
  userStats,
}: MonsterCardProps) {
  const [hovered, setHovered] = useState(false)
  const palette = getPalette(monster.tier)
  const tier = monster.tier.toLowerCase()
  const statEntries = Object.entries(monster.stats ?? {}).slice(0, 6)
  const isAncient = tier === 'ancient'
  const density = monster.stats?.density ?? monster.stats?.mass ?? null

  if (compact) {
    return <MonsterCardCompact monster={monster} isDefeated={isDefeated} />
  }

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        translateY: hovered ? -4 : 0,
        boxShadow: hovered ? palette.shadowHover : palette.shadowBase,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="rounded-2xl overflow-hidden cursor-default relative"
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
      }}
    >
      {/* Tier glow overlay on border */}
      {tier !== 'common' && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: `inset 0 0 20px ${palette.glow}`,
            transition: 'box-shadow 0.3s ease',
          }}
        />
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3">
        {/* Top badges row */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-[11px] font-black uppercase tracking-[0.2em]"
            style={{ color: palette.accent, fontFamily: 'Cinzel, serif' }}
          >
            {monster.tier}
          </span>
          <span className={cn('rank-badge text-[10px]', leagueBadgeClass(monster.league))}>
            {leagueBadgeEmoji(monster.league)} {monster.league}
          </span>
          {monster.defeatCount !== undefined && (
            <span
              className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: palette.text,
                border: `1px solid ${palette.border}`,
              }}
            >
              {monster.defeatCount} slain
            </span>
          )}
        </div>

        {/* Sprite + name row */}
        <div className="flex items-center gap-4">
          {/* Sprite with glow */}
          <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
            <SpriteGlow color={palette.glow} tier={tier} />
            <motion.div
              animate={{ scale: hovered && isAncient ? 1.07 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <MonsterSprite tier={monster.tier} size={80} />
            </motion.div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-xl font-bold leading-tight mb-1"
              style={{ color: palette.text, fontFamily: 'Cinzel, serif' }}
            >
              {monster.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Total Power</span>
              <span className="text-sm font-bold" style={{ color: palette.accent }}>
                {monster.totalPower.toLocaleString()}
              </span>
            </div>

            {/* ANCIENT DENSITY intimidation stat */}
            {isAncient && density !== null && (
              <div className="mt-1">
                <span
                  className="text-xs font-black tracking-widest"
                  style={{ color: '#dc2626', fontFamily: 'Cinzel, serif' }}
                >
                  DENSITY: {Number(density).toFixed(2)}
                </span>
              </div>
            )}

            {monster.loreText && (
              <p className="text-[11px] text-gray-500 italic mt-1.5 line-clamp-2">
                "{monster.loreText}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats section ───────────────────────────────────── */}
      {statEntries.length > 0 && (
        <div className="px-5 pb-4">
          {/* Divider */}
          <div
            className="h-px mb-3"
            style={{ background: `linear-gradient(90deg, ${palette.border}, transparent)` }}
          />

          {userStats ? (
            // Comparison bars
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Monster</span>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#38bdf8' }}>You</span>
              </div>
              {statEntries.map(([key, val]) => (
                <StatCompareRow
                  key={key}
                  label={key}
                  monsterVal={val as number}
                  userVal={userStats[key] ?? 0}
                  accent={palette.accent}
                />
              ))}
            </div>
          ) : (
            // Solo stat bars
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">
                Stats
              </p>
              {statEntries.map(([key, val]) => {
                const gap = statGap?.[key]
                return (
                  <div key={key}>
                    <StatBar
                      label={key.toUpperCase().slice(0, 3)}
                      value={val as number}
                      maxValue={100}
                      color={palette.accent}
                    />
                    {gap !== undefined && gap > 0 && !isDefeated && (
                      <p className="text-[9px] text-red-400 text-right mt-0.5">
                        -{gap.toFixed(0)} to close
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom banner ────────────────────────────────────── */}
      <AnimatePresence>
        {isDefeated ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-5 py-2.5 flex items-center justify-center gap-3"
            style={{
              background: 'linear-gradient(90deg, rgba(22,163,74,0.25), rgba(34,197,94,0.15), rgba(22,163,74,0.25))',
              borderTop: '1px solid rgba(34,197,94,0.3)',
            }}
          >
            <span
              className="text-sm font-black tracking-[0.25em]"
              style={{ color: '#4ade80', fontFamily: 'Cinzel, serif' }}
            >
              ✦ SLAIN ✦
            </span>
          </motion.div>
        ) : (
          <div
            className="w-full px-5 py-2.5"
            style={{ borderTop: `1px solid ${palette.border}30` }}
          >
            <p
              className="text-[11px] italic text-center"
              style={{ color: palette.text, opacity: 0.5 }}
            >
              Defeat this monster to prove your strength
            </p>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
