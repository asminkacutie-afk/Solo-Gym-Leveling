import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisciplineSVGBadgeProps {
  discipline: string
  size?: number
  color?: string
  glow?: boolean
  className?: string
}

// ─── Default discipline colors ────────────────────────────────────────────────

const DISCIPLINE_COLORS: Record<string, string> = {
  power:      '#ef4444',
  strength:   '#ef4444',
  titan:      '#f59e0b',
  precision:  '#38bdf8',
  endurance:  '#10b981',
  vitality:   '#ec4899',
  flexibility:'#ec4899',
  synthesis:  '#8b5cf6',
  recovery:   '#8b5cf6',
}

function defaultColor(discipline?: string | null): string {
  return DISCIPLINE_COLORS[(discipline ?? '').toLowerCase()] ?? '#8b5cf6'
}

// ─── SVG icon paths for each discipline ──────────────────────────────────────

// POWER (Chest/Back): shield outline with two crossed swords behind it.
// The shield is a rounded-bottom pentagon; swords are diagonal lines with cross-guard.
function PowerIcon({ color }: { color: string }) {
  return (
    <>
      {/* Sword 1: top-left → bottom-right */}
      <line x1="7"  y1="5"  x2="25" y2="27" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Sword 1 cross-guard */}
      <line x1="5"  y1="10" x2="11" y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Sword 1 pommel */}
      <circle cx="7" cy="5" r="1.2" fill={color} />

      {/* Sword 2: top-right → bottom-left */}
      <line x1="25" y1="5"  x2="7"  y2="27" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Sword 2 cross-guard */}
      <line x1="27" y1="10" x2="21" y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Sword 2 pommel */}
      <circle cx="25" cy="5" r="1.2" fill={color} />

      {/* Shield front — rounded-bottom pentagon */}
      <path
        d="M16 4 L26 9 L26 18 Q26 25 16 29 Q6 25 6 18 L6 9 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Shield inner emboss line */}
      <path
        d="M16 8 L22 11 L22 17 Q22 22 16 25 Q10 22 10 17 L10 11 Z"
        stroke={color}
        strokeWidth="0.8"
        fill="none"
        opacity="0.45"
        strokeLinejoin="round"
      />
    </>
  )
}

// TITAN (Legs): two tall stone pillars with a heavy lintel atop — suggesting
// immovable load-bearing strength.
function TitanIcon({ color }: { color: string }) {
  return (
    <>
      {/* Left pillar */}
      <rect x="5"  y="8" width="7" height="18" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Right pillar */}
      <rect x="20" y="8" width="7" height="18" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Lintel (horizontal beam across top) */}
      <rect x="3"  y="5" width="26" height="4" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Lintel inner weight lines */}
      <line x1="5"  y1="7" x2="5"  y2="9" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="27" y1="7" x2="27" y2="9" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Ground baseline */}
      <line x1="3" y1="27" x2="29" y2="27" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Column base caps */}
      <rect x="4"  y="25" width="9"  height="2" rx="0.5" stroke={color} strokeWidth="1" fill="none" />
      <rect x="19" y="25" width="9"  height="2" rx="0.5" stroke={color} strokeWidth="1" fill="none" />
    </>
  )
}

// PRECISION (Shoulders/Arms): classic target crosshair — outer ring, inner ring,
// four crosshair arms with gaps, centre dot.
function PrecisionIcon({ color }: { color: string }) {
  return (
    <>
      {/* Outer ring */}
      <circle cx="16" cy="16" r="11" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Middle ring */}
      <circle cx="16" cy="16" r="6"  stroke={color} strokeWidth="1.5" fill="none" />
      {/* Centre dot */}
      <circle cx="16" cy="16" r="1.5" fill={color} />
      {/* Crosshair arms — gaps between rings */}
      {/* Top */}
      <line x1="16" y1="3"  x2="16" y2="9"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Bottom */}
      <line x1="16" y1="23" x2="16" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Left */}
      <line x1="3"  y1="16" x2="9"  y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Right */}
      <line x1="23" y1="16" x2="29" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </>
  )
}

// ENDURANCE (Core): upward helix — three elliptical arc segments stacked and
// offset to suggest a twisting spiral climbing upward.
function EnduranceIcon({ color }: { color: string }) {
  return (
    <>
      {/* Helix is drawn as pairs of arcs: one facing left, one facing right,
          progressively rising. The vertical guide lines connect the ends. */}

      {/* Bottom arc — curving right */}
      <path
        d="M10 26 Q6 22 16 20 Q26 18 22 14"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"
      />
      {/* Bottom arc — back curve (behind) */}
      <path
        d="M22 14 Q26 10 16 8 Q6 6 10 2"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"
        opacity="0.45"
        strokeDasharray="2 2"
      />
      {/* Front strand */}
      <path
        d="M22 26 Q18 22 16 20 Q14 18 10 14"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"
      />
      <path
        d="M10 14 Q6 10 8 6 Q10 2 16 2"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"
      />
      {/* Bottom foot dots */}
      <circle cx="10" cy="26" r="1.2" fill={color} />
      <circle cx="22" cy="26" r="1.2" fill={color} />
      {/* Top tip dot */}
      <circle cx="16" cy="2" r="1.2" fill={color} />
      <circle cx="10" cy="2" r="1.2" fill={color} opacity="0.45" />
    </>
  )
}

// VITALITY (Cardio): heart shape from cubic bezier paths + a diagonal
// lightning bolt striking through the centre.
function VitalityIcon({ color }: { color: string }) {
  return (
    <>
      {/* Heart outline — two cubic bezier arcs meeting at bottom point */}
      <path
        d="M16 27
           C 16 27, 5 20, 5 13
           C 5 8.5, 8.5 6, 11 6
           C 13 6, 15 7.5, 16 9
           C 17 7.5, 19 6, 21 6
           C 23.5 6, 27 8.5, 27 13
           C 27 20, 16 27, 16 27 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Lightning bolt through the heart — top-right to bottom-left */}
      <polyline
        points="19,7 14,15 18,15 13,25"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}

// SYNTHESIS (Full Body): infinity symbol (lemniscate) drawn with two circular
// loops, plus small orbiting dot at each loop extremity.
function SynthesisIcon({ color }: { color: string }) {
  return (
    <>
      {/* Infinity / lemniscate: two circles connected at centre crossing point.
          Drawn as two cubic bezier loops.                                     */}
      {/* Left loop */}
      <path
        d="M16 16
           C 16 12, 11 8, 7 8
           C 3 8, 3 24, 7 24
           C 11 24, 16 20, 16 16 Z"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"
      />
      {/* Right loop */}
      <path
        d="M16 16
           C 16 12, 21 8, 25 8
           C 29 8, 29 24, 25 24
           C 21 24, 16 20, 16 16 Z"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"
      />
      {/* Left loop extremity orbit dot */}
      <circle cx="5"  cy="14" r="1.5" fill={color} opacity="0.8" />
      {/* Right loop extremity orbit dot */}
      <circle cx="27" cy="18" r="1.5" fill={color} opacity="0.8" />
      {/* Centre crossing dot */}
      <circle cx="16" cy="16" r="1.2" fill={color} />
      {/* Top/bottom accent dots on each loop */}
      <circle cx="7"  cy="8"  r="1"   fill={color} opacity="0.5" />
      <circle cx="25" cy="24" r="1"   fill={color} opacity="0.5" />
    </>
  )
}

// ─── Icon registry ────────────────────────────────────────────────────────────

type IconRenderer = (props: { color: string }) => React.ReactElement

const ICON_MAP: Record<string, IconRenderer> = {
  power:       PowerIcon,
  strength:    PowerIcon,
  titan:       TitanIcon,
  precision:   PrecisionIcon,
  endurance:   EnduranceIcon,
  vitality:    VitalityIcon,
  flexibility: VitalityIcon,
  synthesis:   SynthesisIcon,
  recovery:    SynthesisIcon,
}

function getIcon(discipline?: string | null): IconRenderer {
  return ICON_MAP[(discipline ?? '').toLowerCase()] ?? SynthesisIcon
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DisciplineSVGBadge({
  discipline,
  size = 32,
  color,
  glow = false,
  className,
}: DisciplineSVGBadgeProps) {
  const resolvedColor = color ?? defaultColor(discipline)
  const filterId = `disc-glow-${(discipline ?? '').toLowerCase().replace(/\s+/g, '-')}`
  const Icon = getIcon(discipline)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      style={{ overflow: 'visible' }}
      aria-label={`${discipline} discipline icon`}
    >
      {glow && (
        <defs>
          <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <g
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? `url(#${filterId})` : undefined}
      >
        <Icon color={resolvedColor} />
      </g>
    </svg>
  )
}
