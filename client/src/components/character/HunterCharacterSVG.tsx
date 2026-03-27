import { useMemo } from 'react'

interface Props {
  bodyFat: number
  powerScore: number
  gender?: 'male' | 'female'
  size?: number
  animated?: boolean
  className?: string
}

function getStage(bf: number): number {
  if (bf >= 35) return 1
  if (bf >= 30) return 2
  if (bf >= 25) return 3
  if (bf >= 20) return 4
  if (bf >= 15) return 5
  if (bf >= 12) return 6
  return 7
}

function getArmorTier(ps: number): number {
  if (ps >= 10000) return 4
  if (ps >= 6000) return 3
  if (ps >= 3000) return 2
  if (ps >= 1000) return 1
  return 0
}

const STAGE_NAMES = ['', 'Novice', 'Initiate', 'Awakening', 'Athletic', 'Lean', 'Shredded', 'Godlike']
const AURA_COLORS = ['', '#4b5563', '#6b7280', '#38bdf8', '#7c3aed', '#a78bfa', '#fbbf24', '#f59e0b']
const AURA_OPACITY = [0, 0.05, 0.08, 0.15, 0.25, 0.35, 0.5, 0.7]

export default function HunterCharacterSVG({
  bodyFat,
  powerScore,
  gender = 'male',
  size = 280,
  animated = true,
  className,
}: Props) {
  const stage = getStage(bodyFat)
  const armor = getArmorTier(powerScore)

  const svgContent = useMemo(() => {
    const auraColor = AURA_COLORS[stage]
    const auraOp = AURA_OPACITY[stage]

    // Body shape parameters by stage
    // torso width (belly): s1=68, s2=60, s3=52, s4=46, s5=42, s6=38, s7=36
    const torsoW = [0, 68, 60, 52, 46, 42, 38, 36][stage]
    const torsoH = [0, 90, 88, 85, 82, 80, 78, 76][stage]
    const shoulderW = [0, 48, 50, 52, 56, 60, 62, 64][stage]
    const waistW = [0, 62, 54, 46, 40, 36, 32, 30][stage]
    const hipW = [0, 58, 52, 48, 44, 42, 40, 38][stage]
    const legW = [0, 24, 22, 20, 19, 18, 17, 17][stage]
    const armW = [0, 16, 15, 14, 14, 15, 16, 17][stage]

    // Colors
    const skinLight = gender === 'female' ? '#f5cba7' : '#e8b78a'
    const skinMid   = gender === 'female' ? '#e8a87c' : '#d4956a'
    const skinDark  = gender === 'female' ? '#c98a5a' : '#b5784a'
    const hairColor = stage >= 6 ? '#fbbf24' : '#1f2937'

    // Clothing per stage
    const shirtColor = stage <= 2 ? '#374151' : stage <= 4 ? '#1e3a5f' : stage <= 5 ? '#1a1a2e' : '#0a0a1a'
    const pantsColor = stage <= 2 ? '#4b5563' : '#1f2937'

    // Glowing eyes at stage 5+
    const eyeGlow = stage >= 5
    const eyeColor = stage >= 7 ? '#f59e0b' : stage >= 5 ? '#7c3aed' : '#1f2937'

    // Armor colors
    const armorColor  = armor >= 3 ? '#7c3aed' : armor >= 2 ? '#475569' : '#374151'
    const armorTrim   = armor >= 4 ? '#f59e0b' : armor >= 3 ? '#a78bfa' : '#64748b'
    const armorGlowOp = armor >= 3 ? 0.6 : armor >= 2 ? 0.3 : 0

    return (
      <>
        <defs>
          {/* Aura gradient */}
          <radialGradient id="hc-aura" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor={auraColor} stopOpacity={auraOp * 1.2} />
            <stop offset="100%" stopColor={auraColor} stopOpacity={0} />
          </radialGradient>

          {/* Skin gradient */}
          <linearGradient id="hc-skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={skinLight} />
            <stop offset="100%" stopColor={skinMid} />
          </linearGradient>

          {/* Armor gradient */}
          <linearGradient id="hc-armor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={armorColor} />
            <stop offset="100%" stopColor={armorColor} stopOpacity={0.7} />
          </linearGradient>

          {/* Armor trim glow */}
          <filter id="hc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Eye glow */}
          <filter id="hc-eye-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gold particle glow */}
          <filter id="hc-gold-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Aura background */}
        <ellipse id="bg-aura" cx="100" cy="200" rx="90" ry="110" fill="url(#hc-aura)" />

        {/* Shadow on ground */}
        <ellipse cx="100" cy="305" rx={torsoW * 0.6} ry="8" fill="#000" fillOpacity={0.3} />

        {/* === LEGS === */}
        <g id="legs">
          {/* Left leg */}
          <path
            d={`M ${100 - hipW / 2} 220
                L ${100 - legW - 4} 290
                L ${100 - legW + 6} 290
                L ${100 - hipW / 2 + 12} 220 Z`}
            fill={pantsColor}
          />
          {/* Right leg */}
          <path
            d={`M ${100 + hipW / 2} 220
                L ${100 + legW + 4} 290
                L ${100 + legW - 6} 290
                L ${100 + hipW / 2 - 12} 220 Z`}
            fill={pantsColor}
          />
          {/* Left boot */}
          <ellipse cx={100 - legW + 1} cy="292" rx={legW - 2} ry="6" fill="#1a1a1a" />
          {/* Right boot */}
          <ellipse cx={100 + legW + 1} cy="292" rx={legW - 2} ry="6" fill="#1a1a1a" />
          {/* Leg muscle definition for stage 4+ */}
          {stage >= 4 && (
            <>
              <line x1={100 - legW + 4} y1="230" x2={100 - legW + 3} y2="280"
                stroke={skinDark} strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1={100 + legW - 4} y1="230" x2={100 + legW - 3} y2="280"
                stroke={skinDark} strokeWidth="1.5" strokeOpacity="0.4" />
            </>
          )}
        </g>

        {/* === ARMS === */}
        <g id="arms">
          {/* Left arm */}
          <path
            d={`M ${100 - shoulderW / 2 - 2} 145
                L ${100 - shoulderW / 2 - armW - 4} 200
                L ${100 - shoulderW / 2 - armW + 4} 205
                L ${100 - shoulderW / 2 + 4} 150 Z`}
            fill="url(#hc-skin)"
          />
          {/* Right arm */}
          <path
            d={`M ${100 + shoulderW / 2 + 2} 145
                L ${100 + shoulderW / 2 + armW + 4} 200
                L ${100 + shoulderW / 2 + armW - 4} 205
                L ${100 + shoulderW / 2 - 4} 150 Z`}
            fill="url(#hc-skin)"
          />
          {/* Left hand */}
          <ellipse cx={100 - shoulderW / 2 - armW - 1} cy="207" rx="6" ry="7" fill={skinMid} />
          {/* Right hand */}
          <ellipse cx={100 + shoulderW / 2 + armW + 1} cy="207" rx="6" ry="7" fill={skinMid} />
          {/* Bicep peak for stage 4+ */}
          {stage >= 4 && (
            <>
              <path
                d={`M ${100 - shoulderW / 2 - 2} 155 Q ${100 - shoulderW / 2 - armW - 8} 170 ${100 - shoulderW / 2 - armW - 4} 185`}
                fill="none" stroke={skinDark} strokeWidth={stage >= 6 ? 3 : 2} strokeOpacity="0.5"
              />
              <path
                d={`M ${100 + shoulderW / 2 + 2} 155 Q ${100 + shoulderW / 2 + armW + 8} 170 ${100 + shoulderW / 2 + armW + 4} 185`}
                fill="none" stroke={skinDark} strokeWidth={stage >= 6 ? 3 : 2} strokeOpacity="0.5"
              />
            </>
          )}
        </g>

        {/* === TORSO === */}
        <g id="torso">
          {/* Main body */}
          <path
            d={`M ${100 - shoulderW / 2} 140
                C ${100 - shoulderW / 2 - 10} 160, ${100 - waistW / 2 - 8} 190, ${100 - hipW / 2} 225
                L ${100 + hipW / 2} 225
                C ${100 + waistW / 2 + 8} 190, ${100 + shoulderW / 2 + 10} 160, ${100 + shoulderW / 2} 140 Z`}
            fill={shirtColor}
          />
          {/* Neck */}
          <rect x="92" y="128" width="16" height="16" rx="4" fill={skinMid} />

          {/* Abs for stage 5+ */}
          {stage >= 5 && (
            <g opacity="0.4">
              <ellipse cx="96" cy="172" rx="5" ry="4" fill={skinDark} />
              <ellipse cx="104" cy="172" rx="5" ry="4" fill={skinDark} />
              <ellipse cx="96" cy="184" rx="5" ry="4" fill={skinDark} />
              <ellipse cx="104" cy="184" rx="5" ry="4" fill={skinDark} />
              {stage >= 6 && (
                <>
                  <ellipse cx="96" cy="196" rx="5" ry="3" fill={skinDark} />
                  <ellipse cx="104" cy="196" rx="5" ry="3" fill={skinDark} />
                </>
              )}
            </g>
          )}

          {/* Chest lines for stage 4+ */}
          {stage >= 4 && (
            <path
              d={`M ${100 - shoulderW / 2 + 4} 148 Q 100 158 ${100 + shoulderW / 2 - 4} 148`}
              fill="none" stroke={skinDark} strokeWidth="1.5" strokeOpacity="0.3"
            />
          )}

          {/* Belt */}
          <rect x={100 - hipW / 2} y="214" width={hipW} height="10" rx="2" fill="#111827" />
          <rect x="94" y="215" width="12" height="8" rx="1" fill="#374151" />
        </g>

        {/* === ARMOR LAYERS === */}
        {armor >= 1 && (
          <g id="armor-basic" filter={armorGlowOp > 0 ? "url(#hc-glow)" : undefined}>
            {/* Left pauldron */}
            <path
              d={`M ${100 - shoulderW / 2 - 4} 140
                  C ${100 - shoulderW / 2 - 12} 132, ${100 - shoulderW / 2 - 16} 143, ${100 - shoulderW / 2 - 2} 152 Z`}
              fill="url(#hc-armor)"
              stroke={armorTrim} strokeWidth="1"
            />
            {/* Right pauldron */}
            <path
              d={`M ${100 + shoulderW / 2 + 4} 140
                  C ${100 + shoulderW / 2 + 12} 132, ${100 + shoulderW / 2 + 16} 143, ${100 + shoulderW / 2 + 2} 152 Z`}
              fill="url(#hc-armor)"
              stroke={armorTrim} strokeWidth="1"
            />
          </g>
        )}

        {armor >= 2 && (
          <g id="armor-mid">
            {/* Chest plate */}
            <path
              d={`M ${100 - shoulderW / 2 + 4} 143
                  L ${100 - 14} 170 L ${100 + 14} 170
                  L ${100 + shoulderW / 2 - 4} 143 Z`}
              fill="url(#hc-armor)"
              stroke={armorTrim} strokeWidth="1.5"
            />
            {/* Left bracer */}
            <rect
              x={100 - shoulderW / 2 - armW - 6} y="178"
              width={armW - 2} height="14" rx="3"
              fill={armorColor} stroke={armorTrim} strokeWidth="1"
            />
            {/* Right bracer */}
            <rect
              x={100 + shoulderW / 2 + 6} y="178"
              width={armW - 2} height="14" rx="3"
              fill={armorColor} stroke={armorTrim} strokeWidth="1"
            />
          </g>
        )}

        {armor >= 3 && (
          <g id="armor-full">
            {/* Full chest plate */}
            <path
              d={`M ${100 - shoulderW / 2 + 2} 140
                  L ${100 - 18} 200 L ${100 + 18} 200
                  L ${100 + shoulderW / 2 - 2} 140 Z`}
              fill="url(#hc-armor)"
              stroke={armorTrim} strokeWidth="2"
              opacity="0.9"
            />
            {/* Glowing trim lines */}
            <line x1="100" y1="142" x2="100" y2="198" stroke={armorTrim} strokeWidth="2" strokeOpacity={armorGlowOp} />
            <path
              d={`M ${100 - shoulderW / 2 + 6} 155 L ${100 - 16} 175 L ${100 + 16} 175 L ${100 + shoulderW / 2 - 6} 155`}
              fill="none" stroke={armorTrim} strokeWidth="1.5" strokeOpacity={armorGlowOp}
            />
            {/* Leg guards */}
            <rect x={100 - hipW / 2} y="222" width={hipW / 2 - 2} height="18" rx="2"
              fill={armorColor} stroke={armorTrim} strokeWidth="1" />
            <rect x={100 + 2} y="222" width={hipW / 2 - 2} height="18" rx="2"
              fill={armorColor} stroke={armorTrim} strokeWidth="1" />
          </g>
        )}

        {armor >= 4 && (
          <g id="armor-legendary" filter="url(#hc-gold-glow)">
            {/* Golden trim overlay */}
            <path
              d={`M ${100 - shoulderW / 2} 140 L 100 130 L ${100 + shoulderW / 2} 140`}
              fill="none" stroke="#f59e0b" strokeWidth="3"
            />
            {/* Rune marks */}
            {[155, 170, 185].map((y, i) => (
              <g key={i}>
                <line x1="88" y1={y} x2="96" y2={y} stroke="#f59e0b" strokeWidth="1.5" />
                <line x1="104" y1={y} x2="112" y2={y} stroke="#f59e0b" strokeWidth="1.5" />
              </g>
            ))}
            {/* Shoulder spikes */}
            <polygon
              points={`${100 - shoulderW / 2 - 8},148 ${100 - shoulderW / 2 - 16},134 ${100 - shoulderW / 2 - 2},144`}
              fill="#f59e0b"
            />
            <polygon
              points={`${100 + shoulderW / 2 + 8},148 ${100 + shoulderW / 2 + 16},134 ${100 + shoulderW / 2 + 2},144`}
              fill="#f59e0b"
            />
          </g>
        )}

        {/* === HEAD === */}
        <g id="head">
          {/* Head shape */}
          <ellipse cx="100" cy="108" rx="22" ry="26" fill="url(#hc-skin)" />

          {/* Hair */}
          {stage <= 5 ? (
            <path
              d="M 78 102 C 78 84 82 78 100 76 C 118 78 122 84 122 102 C 118 84 82 84 78 102 Z"
              fill={hairColor}
            />
          ) : (
            /* Wild hair for stage 6-7 */
            <path
              d={`M 78 102 C 78 82 84 74 100 72 C 116 74 122 82 122 102
                  C 118 82 112 70 108 66 C 112 58 100 52 100 52
                  C 100 52 88 58 92 66 C 88 70 82 82 78 102 Z`}
              fill={stage >= 7 ? '#f59e0b' : hairColor}
            />
          )}

          {/* Eyes */}
          <ellipse cx="91" cy="108" rx="5" ry="4" fill="white" />
          <ellipse cx="109" cy="108" rx="5" ry="4" fill="white" />
          <circle cx="92" cy="108" r="3" fill={eyeColor}
            filter={eyeGlow ? "url(#hc-eye-glow)" : undefined}
          />
          <circle cx="110" cy="108" r="3" fill={eyeColor}
            filter={eyeGlow ? "url(#hc-eye-glow)" : undefined}
          />
          {eyeGlow && (
            <>
              <circle cx="92" cy="108" r="1.5" fill="white" fillOpacity="0.8" />
              <circle cx="110" cy="108" r="1.5" fill="white" fillOpacity="0.8" />
            </>
          )}

          {/* Nose */}
          <path d="M 98 112 L 96 118 L 100 119 L 104 118 L 102 112" fill="none"
            stroke={skinDark} strokeWidth="1.5" strokeLinecap="round" />

          {/* Mouth */}
          {stage >= 5 ? (
            /* Determined expression for lean stages */
            <path d="M 92 123 L 100 124 L 108 123" fill="none"
              stroke={skinDark} strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M 92 123 Q 100 128 108 123" fill="none"
              stroke={skinDark} strokeWidth="2" strokeLinecap="round" />
          )}

          {/* Jawline definition for stage 5+ */}
          {stage >= 5 && (
            <path d="M 78 112 L 80 120 L 86 126 M 122 112 L 120 120 L 114 126"
              fill="none" stroke={skinDark} strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
          )}
        </g>

        {/* === GODLIKE PARTICLES (Stage 7) === */}
        {stage >= 7 && animated && (
          <g id="particles">
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2
              const r = 60 + (i % 3) * 20
              const px = 100 + Math.cos(angle) * r
              const py = 180 + Math.sin(angle) * r * 0.4
              return (
                <circle key={i} cx={px} cy={py} r={2 + (i % 3)}
                  fill="#f59e0b" opacity="0.8"
                  filter="url(#hc-gold-glow)">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 100 180`}
                    to={`360 100 180`}
                    dur={`${3 + i * 0.5}s`}
                    repeatCount="indefinite"
                  />
                  <animate attributeName="opacity"
                    values="0.8;0.2;0.8"
                    dur={`${1.5 + i * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )
            })}
          </g>
        )}

        {/* Breathing animation overlay */}
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -2; 0 0"
            dur="3s"
            repeatCount="indefinite"
            additive="sum"
          />
        )}
      </>
    )
  }, [stage, armor, gender, animated])

  return (
    <svg
      viewBox="0 0 200 320"
      width={size}
      height={size * 1.6}
      className={className}
      style={{ overflow: 'visible' }}
      aria-label={`Hunter character, stage ${stage}: ${STAGE_NAMES[stage]}`}
    >
      {svgContent}
    </svg>
  )
}

export { STAGE_NAMES }
