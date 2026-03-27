import { useState, useEffect, useCallback } from 'react'
import {
  RadarChart as RechartsRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { motion } from 'framer-motion'
import type { DisciplineData } from '../../lib/api'

interface RadarChartProps {
  disciplines: DisciplineData[]
  showAdjusted?: boolean
}

// ─── Per-discipline label colors ───────────────────────────────────────────
const DISCIPLINE_LABEL_COLOR: Record<string, string> = {
  power:     '#ef4444',
  strength:  '#ef4444',
  titan:     '#f59e0b',
  precision: '#38bdf8',
  endurance: '#10b981',
  speed:     '#10b981',
  vitality:  '#ec4899',
  flexibility: '#ec4899',
  synthesis: '#8b5cf6',
  recovery:  '#8b5cf6',
}

function getLabelColor(name: string): string {
  return DISCIPLINE_LABEL_COLOR[name.toLowerCase()] ?? '#9ca3af'
}

// ─── Custom angle axis tick ────────────────────────────────────────────────
interface CustomTickProps {
  x?: number
  y?: number
  payload?: { value: string }
  cx?: number
  cy?: number
  textAnchor?: string
}

function CustomAngleTick({ x = 0, y = 0, payload, cx = 0, cy = 0, textAnchor }: CustomTickProps) {
  if (!payload) return null
  const name = payload.value
  const color = getLabelColor(name)

  // Nudge label outward from center
  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const nudge = 8
  const nx = dist > 0 ? x + (dx / dist) * nudge : x
  const ny = dist > 0 ? y + (dy / dist) * nudge : y

  return (
    <text
      x={nx}
      y={ny}
      textAnchor={textAnchor ?? 'middle'}
      dominantBaseline="central"
      style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 11,
        fontWeight: 700,
        fill: color,
        filter: `drop-shadow(0 0 4px ${color}80)`,
      }}
    >
      {name.toUpperCase().slice(0, 3)}
    </text>
  )
}

// ─── Custom tooltip ────────────────────────────────────────────────────────
interface TooltipPayloadItem {
  payload?: {
    discipline: string
    level: number
    powerIndex: number
    stats?: Record<string, number>
  }
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null
  const color = getLabelColor(data.discipline)

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm min-w-[160px]"
      style={{
        background: 'rgba(10,10,20,0.95)',
        border: `1px solid ${color}50`,
        boxShadow: `0 0 20px ${color}30`,
      }}
    >
      <p
        className="font-black uppercase tracking-widest mb-2 text-xs"
        style={{ color, fontFamily: 'Cinzel, serif' }}
      >
        {data.discipline}
      </p>
      <p className="text-gray-300 text-xs">
        Level: <span className="font-bold text-white">{data.level}</span>
      </p>
      <p className="text-gray-300 text-xs">
        Power Index: <span className="font-bold" style={{ color: '#8b5cf6' }}>{data.powerIndex.toFixed(1)}</span>
      </p>
      {data.stats && (
        <div className="mt-2 space-y-0.5 border-t border-white/10 pt-2">
          {Object.entries(data.stats).slice(0, 5).map(([k, v]) => (
            <p key={k} className="text-gray-400 text-[10px]">
              {k.slice(0, 3).toUpperCase()}: <span style={{ color: '#38bdf8' }}>{v}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pulse animation controller ────────────────────────────────────────────
function usePulse(intervalMs = 3000): boolean {
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    const cycle = () => {
      setPulsing(true)
      const off = setTimeout(() => setPulsing(false), 600)
      return off
    }

    // Small delay before first pulse
    const initial = setTimeout(() => {
      cycle()
      const interval = setInterval(() => cycle(), intervalMs)
      return () => clearInterval(interval)
    }, 1200)

    return () => clearTimeout(initial)
  }, [intervalMs])

  return pulsing
}

// ─── Main chart ────────────────────────────────────────────────────────────
export default function DisciplineRadarChart({ disciplines, showAdjusted = false }: RadarChartProps) {
  const [hovered, setHovered] = useState(false)
  const pulsing = usePulse(3000)

  const fillOpacity = hovered ? 0.5 : pulsing ? 0.45 : 0.3
  const strokeWidth = hovered ? 2.5 : 2

  if (!disciplines?.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">
        No discipline data
      </div>
    )
  }

  const data = disciplines.map((d) => {
    const statVals = Object.values(d.stats ?? {})
    const total = statVals.reduce((a, b) => a + (b as number), 0)
    const avg = total / Math.max(statVals.length, 1)
    return {
      discipline: d.name,
      level: d.level,
      powerIndex: Math.min(50, avg),
      adjustedIndex: Math.min(50, avg * 1.1),
      stats: d.stats,
    }
  })

  return (
    <motion.div
      className="w-full relative"
      style={{ height: 300 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Outer glow wrapper that pulses */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          boxShadow: pulsing || hovered
            ? '0 0 40px rgba(139,92,246,0.2)'
            : '0 0 0px rgba(139,92,246,0)',
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />

      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar data={data} outerRadius="68%">
          {/* Dark concentric grid */}
          <PolarGrid
            stroke="rgba(30,30,46,0.7)"
            strokeDasharray="0"
            gridType="polygon"
          />

          {/* Axis labels with per-discipline color */}
          <PolarAngleAxis
            dataKey="discipline"
            tick={(props: CustomTickProps) => <CustomAngleTick {...props} />}
          />

          {/* Minimal radius ticks */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 50]}
            tick={{ fill: '#374151', fontSize: 8 }}
            tickCount={4}
            axisLine={false}
          />

          {/* Main radar — purple */}
          <Radar
            name="Level"
            dataKey="level"
            stroke="#8b5cf6"
            strokeWidth={strokeWidth}
            fill="#8b5cf6"
            fillOpacity={fillOpacity}
            style={{ filter: hovered ? 'drop-shadow(0 0 8px rgba(139,92,246,0.7))' : undefined, transition: 'filter 0.25s ease' }}
          />

          {/* Adjusted radar — gold, dashed, only when showAdjusted */}
          {showAdjusted && (
            <Radar
              name="Adjusted"
              dataKey="adjustedIndex"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="#f59e0b"
              fillOpacity={0.12}
            />
          )}

          <Tooltip content={<CustomTooltip />} />
        </RechartsRadar>
      </ResponsiveContainer>
    </motion.div>
  )
}
