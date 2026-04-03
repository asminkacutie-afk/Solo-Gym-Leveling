import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeagueSVGIconProps {
  league: string
  size?: number
  animated?: boolean
  className?: string
}

// ─── League colors ────────────────────────────────────────────────────────────

const LEAGUE_COLORS: Record<string, string> = {
  iron:      '#6b7280',
  awakening: '#38bdf8',
  bronze:    '#d97706',
  silver:    '#94a3b8',
  gold:      '#fbbf24',
  mythic:    '#a78bfa',
}

function leagueColor(league?: string | null): string {
  return LEAGUE_COLORS[(league ?? '').toLowerCase()] ?? '#8b5cf6'
}

// ─── CSS animation injection ──────────────────────────────────────────────────

const LEAGUE_ANIM_CSS = `
@keyframes league-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes league-pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 3px currentColor); }
  50%       { filter: drop-shadow(0 0 9px currentColor) drop-shadow(0 0 18px currentColor); }
}
`

let leagueAnimInjected = false
function injectLeagueAnim(): void {
  if (leagueAnimInjected || typeof document === 'undefined') return
  const tag = document.createElement('style')
  tag.textContent = LEAGUE_ANIM_CSS
  document.head.appendChild(tag)
  leagueAnimInjected = true
}

// ─── Icon renderers ───────────────────────────────────────────────────────────

// IRON: jagged lightning bolt — raw, unrefined power just beginning to spark.
function IronIcon({ color }: { color: string }) {
  return (
    <path
      d="M19 3 L11 14 L17 14 L13 29 L21 16 L15 16 Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.15"
    />
  )
}

// AWAKENING: flowing wave / sinusoidal ribbon — the surge of potential.
function AwakeningIcon({ color }: { color: string }) {
  return (
    <>
      {/* Primary wave */}
      <path
        d="M3 16 C 5 10, 9 10, 11 16 C 13 22, 17 22, 19 16 C 21 10, 25 10, 27 16"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Echo wave above */}
      <path
        d="M3 12 C 5 7, 9 7, 11 12 C 13 17, 17 17, 19 12 C 21 7, 25 7, 27 12"
        stroke={color}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Echo wave below */}
      <path
        d="M3 20 C 5 14, 9 14, 11 20 C 13 26, 17 26, 19 20 C 21 14, 25 14, 27 20"
        stroke={color}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
    </>
  )
}

// BRONZE: pentagon shield with a horizontal bar — earned rank, solid defence.
function BronzeIcon({ color }: { color: string }) {
  return (
    <>
      {/* Shield outline: pentagon with rounded bottom */}
      <path
        d="M16 3 L27 8 L27 18 Q27 25 16 29 Q5 25 5 18 L5 8 Z"
        stroke={color}
        strokeWidth="1.8"
        fill={color}
        fillOpacity="0.1"
        strokeLinejoin="round"
      />
      {/* Centre horizontal bar — rank marker */}
      <line
        x1="9" y1="16" x2="23" y2="16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  )
}

// SILVER: clean 4-point diamond — faceted, sharp, precise clarity.
function SilverIcon({ color }: { color: string }) {
  return (
    <>
      {/* Outer diamond */}
      <path
        d="M16 3 L29 16 L16 29 L3 16 Z"
        stroke={color}
        strokeWidth="1.5"
        fill={color}
        fillOpacity="0.08"
        strokeLinejoin="round"
      />
      {/* Inner diamond facet lines */}
      <line x1="16" y1="3"  x2="16" y2="29" stroke={color} strokeWidth="0.7" opacity="0.35" />
      <line x1="3"  y1="16" x2="29" y2="16" stroke={color} strokeWidth="0.7" opacity="0.35" />
      {/* Corner highlight dots */}
      <circle cx="16" cy="3"  r="1.2" fill={color} />
      <circle cx="16" cy="29" r="1.2" fill={color} />
      <circle cx="3"  cy="16" r="1.2" fill={color} />
      <circle cx="29" cy="16" r="1.2" fill={color} />
    </>
  )
}

// GOLD: 5-point crown with spherical jewels at each tip.
function GoldIcon({ color, animated }: { color: string; animated: boolean }) {
  return (
    <g style={animated ? { animation: 'league-pulse-glow 2s ease-in-out infinite', color } : {}}>
      {/* Crown body — flat bottom bar with 3 rising points and 2 mid valleys */}
      <path
        d="M4 24 L4 17 L9 10 L16 18 L23 10 L28 17 L28 24 Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.12"
      />
      {/* Crown bottom band */}
      <rect x="4" y="22" width="24" height="3" rx="1" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2" />
      {/* Jewel at left tip */}
      <circle cx="9"  cy="10" r="2" fill={color} opacity="0.9" />
      {/* Jewel at centre tip */}
      <circle cx="16" cy="6"  r="2.5" fill={color} />
      {/* Jewel at right tip */}
      <circle cx="23" cy="10" r="2" fill={color} opacity="0.9" />
    </g>
  )
}

// MYTHIC: arcane eye with iris/pupil surrounded by 6 orbiting rune dots.
// When animated, the dot ring rotates slowly.
function MythicIcon({ color, animated }: { color: string; animated: boolean }) {
  // 6 dots evenly spread in a circle of radius 11, centred at 16,16
  const DOT_R = 11
  const dotAngles = Array.from({ length: 6 }, (_, i) => (i * 60 * Math.PI) / 180)
  const dots = dotAngles.map((a) => ({
    cx: 16 + DOT_R * Math.cos(a),
    cy: 16 + DOT_R * Math.sin(a),
  }))

  return (
    <>
      {/* Outer eye outline */}
      <path
        d="M3 16 Q16 4 29 16 Q16 28 3 16 Z"
        stroke={color}
        strokeWidth="1.5"
        fill={color}
        fillOpacity="0.06"
        strokeLinejoin="round"
      />
      {/* Iris */}
      <circle cx="16" cy="16" r="5.5" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.12" />
      {/* Pupil */}
      <circle cx="16" cy="16" r="2.5" fill={color} opacity="0.9" />
      {/* Highlight */}
      <circle cx="17.5" cy="14.5" r="0.8" fill="white" opacity="0.55" />

      {/* Orbiting rune dots — group rotates if animated */}
      <g
        style={
          animated
            ? {
                transformOrigin: '16px 16px',
                animation: 'league-spin 6s linear infinite',
              }
            : {}
        }
      >
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r="1.4"
            fill={color}
            opacity={i % 2 === 0 ? 0.9 : 0.5}
          />
        ))}
      </g>
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeagueSVGIcon({
  league,
  size = 24,
  animated = false,
  className,
}: LeagueSVGIconProps) {
  injectLeagueAnim()

  const key = (league ?? '').toLowerCase()
  const color = leagueColor(key)
  const filterId = `league-glow-${key}`

  function renderIcon() {
    switch (key) {
      case 'iron':      return <IronIcon color={color} />
      case 'awakening': return <AwakeningIcon color={color} />
      case 'bronze':    return <BronzeIcon color={color} />
      case 'silver':    return <SilverIcon color={color} />
      case 'gold':      return <GoldIcon color={color} animated={animated} />
      case 'mythic':    return <MythicIcon color={color} animated={animated} />
      default:          return <IronIcon color={color} />
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      style={{ overflow: 'visible' }}
      aria-label={`${league} league icon`}
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {renderIcon()}
      </g>
    </svg>
  )
}
