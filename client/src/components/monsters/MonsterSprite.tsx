interface MonsterSpriteProps {
  tier: 'common' | 'rare' | 'epic' | 'legendary' | 'ancient'
  league?: string
  size?: number
}

// ─── Common: simple humanoid silhouette in gray ────────────────────────────
function CommonSprite({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="cg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6b7280" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="36" fill="url(#cg-glow)" />
      {/* head */}
      <ellipse cx="40" cy="22" rx="9" ry="10" fill="#4b5563" />
      {/* body */}
      <rect x="30" y="31" width="20" height="22" rx="3" fill="#374151" />
      {/* arms */}
      <rect x="17" y="32" width="14" height="6" rx="3" fill="#4b5563" transform="rotate(-10 17 32)" />
      <rect x="49" y="32" width="14" height="6" rx="3" fill="#4b5563" transform="rotate(10 63 32)" />
      {/* legs */}
      <rect x="31" y="51" width="7" height="16" rx="3" fill="#374151" />
      <rect x="42" y="51" width="7" height="16" rx="3" fill="#374151" />
      {/* eyes */}
      <circle cx="36.5" cy="21" r="2" fill="#9ca3af" />
      <circle cx="43.5" cy="21" r="2" fill="#9ca3af" />
    </svg>
  )
}

// ─── Rare: slightly larger, green glow eyes ────────────────────────────────
function RareSprite({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="rg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <filter id="rg-eye-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="40" cy="40" r="36" fill="url(#rg-glow)" />
      {/* Body */}
      <ellipse cx="40" cy="21" rx="10" ry="11" fill="#166534" />
      <rect x="28" y="30" width="24" height="24" rx="4" fill="#15803d" />
      {/* Spikes on shoulders */}
      <polygon points="28,30 20,20 25,32" fill="#16a34a" />
      <polygon points="52,30 60,20 55,32" fill="#16a34a" />
      {/* Arms */}
      <rect x="14" y="31" width="16" height="7" rx="3" fill="#166534" transform="rotate(-15 14 31)" />
      <rect x="50" y="31" width="16" height="7" rx="3" fill="#166534" transform="rotate(15 66 31)" />
      {/* Legs */}
      <rect x="30" y="52" width="8" height="17" rx="3" fill="#15803d" />
      <rect x="42" y="52" width="8" height="17" rx="3" fill="#15803d" />
      {/* Green glowing eyes */}
      <circle cx="36" cy="20" r="3" fill="#4ade80" filter="url(#rg-eye-glow)" />
      <circle cx="44" cy="20" r="3" fill="#4ade80" filter="url(#rg-eye-glow)" />
      <circle cx="36" cy="20" r="1.5" fill="#ffffff" opacity="0.9" />
      <circle cx="44" cy="20" r="1.5" fill="#ffffff" opacity="0.9" />
    </svg>
  )
}

// ─── Epic: angular creature with purple energy ─────────────────────────────
function EpicSprite({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="eg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <filter id="eg-purple-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="40" cy="40" r="36" fill="url(#eg-glow)" />
      {/* Angular head */}
      <polygon points="40,8 52,18 50,28 30,28 28,18" fill="#4c1d95" />
      {/* Angular horns */}
      <polygon points="30,16 22,6 28,20" fill="#7c3aed" />
      <polygon points="50,16 58,6 52,20" fill="#7c3aed" />
      {/* Body */}
      <polygon points="28,28 52,28 56,50 24,50" fill="#5b21b6" />
      {/* Energy crackling lines */}
      <path d="M28 34 L22 38 L27 41 L21 46" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52 34 L58 38 L53 41 L59 46" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
      {/* Legs */}
      <polygon points="30,50 24,68 33,68 36,50" fill="#4c1d95" />
      <polygon points="50,50 56,68 47,68 44,50" fill="#4c1d95" />
      {/* Eyes — purple energy */}
      <ellipse cx="36" cy="20" rx="3.5" ry="3" fill="#8b5cf6" filter="url(#eg-purple-glow)" />
      <ellipse cx="44" cy="20" rx="3.5" ry="3" fill="#8b5cf6" filter="url(#eg-purple-glow)" />
      <ellipse cx="36" cy="20" rx="1.5" ry="1.2" fill="#e9d5ff" />
      <ellipse cx="44" cy="20" rx="1.5" ry="1.2" fill="#e9d5ff" />
    </svg>
  )
}

// ─── Legendary: imposing figure with orange flames ─────────────────────────
function LegendarySprite({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="lg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <filter id="lg-fire-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="40" cy="40" r="36" fill="url(#lg-glow)" />
      {/* Flame aura */}
      <path d="M40 3 Q36 10 40 14 Q44 10 40 3Z" fill="#f97316" opacity="0.8" />
      <path d="M22 10 Q20 16 24 18 Q26 13 22 10Z" fill="#fb923c" opacity="0.7" />
      <path d="M58 10 Q60 16 56 18 Q54 13 58 10Z" fill="#fb923c" opacity="0.7" />
      {/* Crown / great horns */}
      <polygon points="28,14 20,3 25,16" fill="#c2410c" />
      <polygon points="52,14 60,3 55,16" fill="#c2410c" />
      <polygon points="40,8 40,1 38,10 42,10" fill="#ea580c" />
      {/* Head */}
      <ellipse cx="40" cy="22" rx="13" ry="12" fill="#7c2d12" />
      {/* Body — wide and imposing */}
      <rect x="24" y="32" width="32" height="22" rx="4" fill="#9a3412" />
      {/* Shoulder plates */}
      <ellipse cx="26" cy="34" rx="9" ry="6" fill="#c2410c" />
      <ellipse cx="54" cy="34" rx="9" ry="6" fill="#c2410c" />
      {/* Arms */}
      <rect x="12" y="34" width="16" height="8" rx="4" fill="#7c2d12" />
      <rect x="52" y="34" width="16" height="8" rx="4" fill="#7c2d12" />
      {/* Legs */}
      <rect x="28" y="52" width="9" height="18" rx="3" fill="#9a3412" />
      <rect x="43" y="52" width="9" height="18" rx="3" fill="#9a3412" />
      {/* Flame eyes */}
      <ellipse cx="35.5" cy="21" rx="4" ry="3.5" fill="#f97316" filter="url(#lg-fire-glow)" />
      <ellipse cx="44.5" cy="21" rx="4" ry="3.5" fill="#f97316" filter="url(#lg-fire-glow)" />
      <ellipse cx="35.5" cy="21" rx="2" ry="1.8" fill="#fef3c7" />
      <ellipse cx="44.5" cy="21" rx="2" ry="1.8" fill="#fef3c7" />
    </svg>
  )
}

// ─── Ancient: massive dark form with red cracks ────────────────────────────
function AncientSprite({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="ag-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
        </radialGradient>
        <filter id="ag-crack-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="40" cy="40" r="36" fill="url(#ag-glow)" />
      {/* Massive head */}
      <ellipse cx="40" cy="19" rx="18" ry="16" fill="#1c1c1c" />
      {/* Giant jagged horns */}
      <polygon points="22,8 10,0 18,14 22,8" fill="#450a0a" />
      <polygon points="58,8 70,0 62,14 58,8" fill="#450a0a" />
      <polygon points="32,5 28,0 33,10" fill="#7f1d1d" />
      <polygon points="48,5 52,0 47,10" fill="#7f1d1d" />
      {/* Red cracks on face */}
      <path d="M30 14 L34 18 L31 22" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" filter="url(#ag-crack-glow)" />
      <path d="M50 14 L46 18 L49 22" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" filter="url(#ag-crack-glow)" />
      <path d="M36 25 L40 28 L44 25" stroke="#ef4444" strokeWidth="0.8" filter="url(#ag-crack-glow)" />
      {/* Massive body */}
      <rect x="18" y="33" width="44" height="26" rx="2" fill="#111111" />
      {/* Rune lines on body */}
      <path d="M24 40 L30 43 L24 46" stroke="#dc2626" strokeWidth="1" strokeLinecap="round" filter="url(#ag-crack-glow)" />
      <path d="M50 40 L56 43 L50 46" stroke="#dc2626" strokeWidth="1" strokeLinecap="round" filter="url(#ag-crack-glow)" />
      <path d="M36 38 L40 42 L44 38" stroke="#dc2626" strokeWidth="1" filter="url(#ag-crack-glow)" />
      {/* Arms */}
      <rect x="4" y="34" width="16" height="9" rx="2" fill="#1c1c1c" />
      <rect x="60" y="34" width="16" height="9" rx="2" fill="#1c1c1c" />
      {/* Crack on arms */}
      <path d="M8 37 L12 40 L8 43" stroke="#dc2626" strokeWidth="0.8" filter="url(#ag-crack-glow)" />
      <path d="M72 37 L68 40 L72 43" stroke="#dc2626" strokeWidth="0.8" filter="url(#ag-crack-glow)" />
      {/* Legs */}
      <rect x="23" y="57" width="12" height="18" rx="2" fill="#1c1c1c" />
      <rect x="45" y="57" width="12" height="18" rx="2" fill="#1c1c1c" />
      {/* Glowing red eyes */}
      <ellipse cx="34" cy="18" rx="5" ry="4.5" fill="#dc2626" filter="url(#ag-crack-glow)" />
      <ellipse cx="46" cy="18" rx="5" ry="4.5" fill="#dc2626" filter="url(#ag-crack-glow)" />
      <ellipse cx="34" cy="18" rx="2.5" ry="2" fill="#fca5a5" />
      <ellipse cx="46" cy="18" rx="2.5" ry="2" fill="#fca5a5" />
    </svg>
  )
}

// ─── MonsterSprite ─────────────────────────────────────────────────────────
export default function MonsterSprite({ tier, size = 80 }: MonsterSpriteProps) {
  switch (tier) {
    case 'common':
      return <CommonSprite size={size} />
    case 'rare':
      return <RareSprite size={size} />
    case 'epic':
      return <EpicSprite size={size} />
    case 'legendary':
      return <LegendarySprite size={size} />
    case 'ancient':
      return <AncientSprite size={size} />
    default:
      return <CommonSprite size={size} />
  }
}
