import {
  RadarChart as RechartsRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import type { DisciplineData } from '../../lib/api'
import { disciplineColor } from '../../lib/utils'

interface RadarChartProps {
  disciplines: DisciplineData[]
  showAdjusted?: boolean
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name: string; value: number }[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background-card border border-background-border rounded-xl px-4 py-3 shadow-card-glow text-sm">
      {payload.map((p) => (
        <p key={p.name} className="text-gray-200">
          <span className="font-semibold text-purple-400">{p.name}</span>: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function DisciplineRadarChart({ disciplines, showAdjusted = false }: RadarChartProps) {
  if (!disciplines?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        No discipline data
      </div>
    )
  }

  // Build radar data: each point is a discipline axis
  const data = disciplines.map((d) => {
    const totalStat = Object.values(d.stats ?? {}).reduce((a, b) => a + (b as number), 0)
    const avgStat = totalStat / Math.max(Object.keys(d.stats ?? {}).length, 1)
    return {
      discipline: d.name,
      level: d.level,
      powerIndex: Math.min(50, avgStat),
    }
  })

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar data={data} outerRadius="75%">
          <PolarGrid stroke="rgba(30,30,46,0.7)" />
          <PolarAngleAxis
            dataKey="discipline"
            tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'Cinzel, serif' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 50]}
            tick={{ fill: '#4b5563', fontSize: 9 }}
            tickCount={4}
          />
          <Radar
            name="Level"
            dataKey="level"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name="Power Index"
            dataKey="powerIndex"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.15}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 12 }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  )
}
