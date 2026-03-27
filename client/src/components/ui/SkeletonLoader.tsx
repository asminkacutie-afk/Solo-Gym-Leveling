import React from 'react'
import { cn } from '../../lib/utils'

// ─── Shimmer keyframe (injected once into <head>) ─────────────────────────────

const SHIMMER_CSS = `
@keyframes skeleton-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
`

let shimmerInjected = false
function injectShimmer(): void {
  if (shimmerInjected || typeof document === 'undefined') return
  const tag = document.createElement('style')
  tag.textContent = SHIMMER_CSS
  document.head.appendChild(tag)
  shimmerInjected = true
}

// ─── Skeleton (base block) ───────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
  rounded?: boolean
  style?: React.CSSProperties
}

export function Skeleton({ className, rounded = false, style }: SkeletonProps) {
  injectShimmer()

  return (
    <div
      className={cn(
        'overflow-hidden',
        rounded ? 'rounded-full' : 'rounded-md',
        className,
      )}
      style={{
        background: 'linear-gradient(90deg, #13131f 25%, #1a1a2e 50%, #13131f 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.6s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

// ─── SkeletonText ────────────────────────────────────────────────────────────

interface SkeletonTextProps {
  width?: string | number
  height?: string | number
  className?: string
}

export function SkeletonText({
  width = '100%',
  height = '1em',
  className,
}: SkeletonTextProps) {
  return (
    <Skeleton
      className={cn('rounded-sm', className)}
      style={{ width, height }}
    />
  )
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/5 bg-[#13131f] p-5 space-y-3',
        className,
      )}
    >
      {/* Title line */}
      <Skeleton className="h-5 w-2/5" />
      {/* Body lines */}
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3.5 w-3/5" />
    </div>
  )
}

// ─── SkeletonDisciplineCard ───────────────────────────────────────────────────

interface SkeletonDisciplineCardProps {
  className?: string
}

export function SkeletonDisciplineCard({ className }: SkeletonDisciplineCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/5 bg-[#13131f] p-4',
        className,
      )}
    >
      {/* Header row: icon circle + discipline name + level badge */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton rounded className="w-9 h-9 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      {/* XP bar block */}
      <div className="mb-4 space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-24" style={{ marginLeft: 'auto' }} />
      </div>

      {/* 4 stat rows in a 2-column grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <Skeleton className="h-3 w-8 shrink-0" />
            <Skeleton className="h-1 flex-1 rounded-full" />
            <Skeleton className="h-3 w-5 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SkeletonTableRow ────────────────────────────────────────────────────────

interface SkeletonTableRowProps {
  cells?: number
  className?: string
}

export function SkeletonTableRow({ cells = 5, className }: SkeletonTableRowProps) {
  // Width pattern: narrow for rank/ID, wider for name/data
  const widths: Record<number, string> = { 0: '2rem', 1: '60%' }

  return (
    <tr className={className}>
      {Array.from({ length: cells }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton
            className="h-4"
            style={{ width: widths[i] ?? '80%' }}
          />
        </td>
      ))}
    </tr>
  )
}

// ─── SkeletonLeaderboardRow ───────────────────────────────────────────────────

interface SkeletonLeaderboardRowProps {
  className?: string
}

export function SkeletonLeaderboardRow({ className }: SkeletonLeaderboardRowProps) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', className)}>
      {/* Rank number */}
      <Skeleton className="h-5 w-6 shrink-0" />
      {/* Avatar circle */}
      <Skeleton rounded className="w-8 h-8 shrink-0" />
      {/* Hunter name + sub-label */}
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      {/* Score */}
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  )
}
