import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

interface StatBarProps {
  label: string
  value: number
  maxValue?: number
  color?: string
  showValue?: boolean
  className?: string
}

export default function StatBar({
  label,
  value,
  maxValue = 100,
  color = '#8b5cf6',
  showValue = true,
  className,
}: StatBarProps) {
  const [animated, setAnimated] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100))

  useEffect(() => {
    // Trigger animation after mount
    const frame = requestAnimationFrame(() => {
      setAnimated(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Label */}
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-8 shrink-0">
        {label}
      </span>

      {/* Bar container */}
      <div className="flex-1 h-1.5 bg-background-border rounded-full overflow-hidden relative">
        {/* Fill */}
        <div
          ref={barRef}
          className="h-full rounded-full stat-bar-fill transition-all"
          style={{
            '--stat-width': `${pct}%`,
            width: animated ? `${pct}%` : '0%',
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}60`,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          } as React.CSSProperties}
        />
      </div>

      {/* Value */}
      {showValue && (
        <span className="text-[10px] font-semibold text-gray-300 w-7 text-right shrink-0">
          {value}
        </span>
      )}
    </div>
  )
}
