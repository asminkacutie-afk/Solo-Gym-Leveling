import React, { useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type League = 'IRON' | 'AWAKENING' | 'BRONZE' | 'SILVER' | 'GOLD' | 'MYTHIC';
type Intensity = 'calm' | 'combat' | 'result';

interface ArenaBgProps {
  league: League;
  width?: number;
  height?: number;
  animated?: boolean;
  intensity?: Intensity;
  className?: string;
  flashResult?: boolean;
}

// ─── League color schemes ─────────────────────────────────────────────────────

const LEAGUE_SCHEMES: Record<League, {
  fogColor: string;
  torchColor: string;
  skyColor: string;
  groundColor: string;
  ambientColor: string;
}> = {
  IRON:      { fogColor: '#374151', torchColor: '#6b7280', skyColor: '#111827', groundColor: '#1f2937', ambientColor: 'rgba(107,114,128,0.15)' },
  AWAKENING: { fogColor: '#1e3a5f', torchColor: '#38bdf8', skyColor: '#0c1a2e', groundColor: '#0f2030', ambientColor: 'rgba(56,189,248,0.12)' },
  BRONZE:    { fogColor: '#451a03', torchColor: '#d97706', skyColor: '#1c0a00', groundColor: '#2d1206', ambientColor: 'rgba(217,119,6,0.18)' },
  SILVER:    { fogColor: '#1e293b', torchColor: '#94a3b8', skyColor: '#0f172a', groundColor: '#1e293b', ambientColor: 'rgba(148,163,184,0.12)' },
  GOLD:      { fogColor: '#451a03', torchColor: '#f59e0b', skyColor: '#1a0a00', groundColor: '#2d1000', ambientColor: 'rgba(245,158,11,0.2)' },
  MYTHIC:    { fogColor: '#2e1065', torchColor: '#a78bfa', skyColor: '#0a0014', groundColor: '#14002a', ambientColor: 'rgba(167,139,250,0.2)' },
};

// ─── Small deterministic pseudo-random helper (no seed needed, just offsets) ──

function seqRand(index: number, offset = 0): number {
  const x = Math.sin(index * 127.1 + offset * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

// ─── Component ────────────────────────────────────────────────────────────────

const ArenaBg: React.FC<ArenaBgProps> = ({
  league,
  width = 800,
  height = 400,
  animated = true,
  intensity = 'calm',
  className,
  flashResult = false,
}) => {
  const scheme = LEAGUE_SCHEMES[league];

  const intensityMult = intensity === 'combat' ? 1.5 : intensity === 'result' ? 2.0 : 1.0;
  const torchFlickerDur = animated ? `${(0.4 / intensityMult).toFixed(2)}s` : '0s';
  const crowdSwayDur    = animated ? `${(3.0 / intensityMult).toFixed(2)}s` : '0s';
  const fogAnimDur      = animated ? `${(8.0 / intensityMult).toFixed(2)}s` : '0s';

  // ── Sky & floor geometry ──────────────────────────────────────────────────

  // Floor as trapezoid: wider at bottom, narrower at top
  const floorTopLeft     = { x: width * 0.22, y: height * 0.60 };
  const floorTopRight    = { x: width * 0.78, y: height * 0.60 };
  const floorBottomLeft  = { x: -width * 0.05, y: height };
  const floorBottomRight = { x: width * 1.05, y: height };

  const floorPoints = `${floorBottomLeft.x},${floorBottomLeft.y} ${floorTopLeft.x},${floorTopLeft.y} ${floorTopRight.x},${floorTopRight.y} ${floorBottomRight.x},${floorBottomRight.y}`;

  // Vanishing point for perspective lines (center top of floor)
  const vpx = width * 0.5;
  const vpy = height * 0.58;

  // ── Colosseum back wall ───────────────────────────────────────────────────

  const wallData = useMemo(() => {
    const archCount = Math.round(7 + seqRand(0) * 2); // 7–9
    const wallTop = height * 0.10;
    const wallBottom = height * 0.62;
    const wallH = wallBottom - wallTop;
    const archW = width / archCount;
    const archRadius = archW * 0.33;

    const paths: React.ReactNode[] = [];

    for (let i = 0; i < archCount; i++) {
      const ax = i * archW;
      const archLeft  = ax + archW * 0.12;
      const archRight = ax + archW * 0.88;
      const archMid   = ax + archW * 0.5;
      const archBase  = wallBottom;
      const archOpenTop = wallTop + wallH * 0.25;

      // Arch opening path (rect + semicircle top carved out)
      const d = [
        `M${archLeft},${archBase}`,
        `L${archLeft},${archOpenTop + archRadius}`,
        `Q${archLeft},${archOpenTop} ${archMid},${archOpenTop}`,
        `Q${archRight},${archOpenTop} ${archRight},${archOpenTop + archRadius}`,
        `L${archRight},${archBase}`,
        'Z',
      ].join(' ');

      paths.push(
        <path
          key={`arch-opening-${i}`}
          d={d}
          fill="#04040a"
          opacity="0.9"
        />
      );
    }

    return { paths, archCount, archW, wallTop, wallBottom };
  }, [width, height]);

  // ── Crowd silhouettes ─────────────────────────────────────────────────────

  const crowdData = useMemo(() => {
    const { archCount, archW, wallTop, wallBottom } = wallData;
    const archOpenTop = wallTop + (wallBottom - wallTop) * 0.25;
    const personCount = Math.round(15 + seqRand(1) * 10);
    const persons: React.ReactNode[] = [];

    for (let p = 0; p < personCount; p++) {
      const archIdx  = Math.floor(seqRand(p, 1) * archCount);
      const localX   = archW * (0.18 + seqRand(p, 2) * 0.64);
      const px = archIdx * archW + localX;
      const py = archOpenTop + (wallBottom - archOpenTop) * (0.15 + seqRand(p, 3) * 0.55);
      const personH  = 10 + seqRand(p, 4) * 8;
      const personW  = personH * 0.45;
      const sway = p % 3 === 0 && animated;

      persons.push(
        <g
          key={`person-${p}`}
          style={sway ? { animation: `crowd-sway ${crowdSwayDur} ${(seqRand(p, 5) * 1.5).toFixed(2)}s infinite ease-in-out alternate` } : {}}
        >
          {/* Body */}
          <rect
            x={px - personW / 2}
            y={py}
            width={personW}
            height={personH * 0.65}
            rx={personW * 0.3}
            fill="#0c0c14"
            opacity="0.75"
          />
          {/* Head */}
          <ellipse
            cx={px}
            cy={py - personH * 0.08}
            rx={personW * 0.38}
            ry={personH * 0.2}
            fill="#0c0c14"
            opacity="0.75"
          />
        </g>
      );
    }

    return persons;
  }, [wallData, animated, crowdSwayDur]);

  // ── Torch positions ───────────────────────────────────────────────────────

  const torchData = useMemo(() => {
    const count = Math.round(4 + seqRand(2) * 2); // 4–6
    const torches: React.ReactNode[] = [];
    const torchY = height * 0.35;

    for (let t = 0; t < count; t++) {
      const tx = (width / (count + 1)) * (t + 1);

      // Torch handle
      torches.push(
        <rect key={`torch-handle-${t}`} x={tx - 2} y={torchY + 10} width={4} height={14} rx={1} fill="#3d2a10" />
      );

      // Flame shape (teardrop)
      const flameId = `torch-flame-${t}`;
      torches.push(
        <g
          key={flameId}
          id={flameId}
          style={animated ? { animation: `torch-flicker ${torchFlickerDur} ${(seqRand(t, 3) * 0.2).toFixed(2)}s infinite ease-in-out alternate`, transformOrigin: `${tx}px ${torchY}px` } : {}}
        >
          <path
            d={`M${tx},${torchY + 10} Q${tx - 6},${torchY + 3} ${tx},${torchY - 6} Q${tx + 6},${torchY + 3} ${tx},${torchY + 10}`}
            fill={scheme.torchColor}
            opacity="0.9"
          />
          <ellipse cx={tx} cy={torchY + 2} rx={4} ry={3} fill="white" opacity="0.55" />
        </g>
      );

      // Light cone
      torches.push(
        <defs key={`torch-grad-${t}`}>
          <radialGradient id={`torch-light-${t}`} cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor={scheme.torchColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={scheme.torchColor} stopOpacity="0" />
          </radialGradient>
        </defs>,
        <polygon
          key={`light-cone-${t}`}
          points={`${tx},${torchY + 10} ${tx - 40},${torchY + 90} ${tx + 40},${torchY + 90}`}
          fill={`url(#torch-light-${t})`}
          opacity="0.2"
        />
      );
    }

    return torches;
  }, [width, height, scheme, animated, torchFlickerDur]);

  // ── Floor perspective lines ───────────────────────────────────────────────

  const floorLines = useMemo(() => {
    const lineCount = 6;
    const lines: React.ReactNode[] = [];
    for (let i = 1; i < lineCount; i++) {
      const t = i / lineCount;
      const lx1 = floorBottomLeft.x  + (floorTopLeft.x  - floorBottomLeft.x)  * t;
      const lx2 = floorBottomRight.x + (floorTopRight.x - floorBottomRight.x) * t;
      const ly  = floorBottomLeft.y  + (floorTopLeft.y  - floorBottomLeft.y)  * t;
      lines.push(
        <line
          key={`floor-line-${i}`}
          x1={lx1} y1={ly}
          x2={lx2} y2={ly}
          stroke={scheme.groundColor}
          strokeWidth="1"
          opacity="0.35"
        />,
        // Converging lines to vanishing point
        <line
          key={`vp-line-${i}`}
          x1={floorBottomLeft.x + (floorBottomRight.x - floorBottomLeft.x) * (i / lineCount)}
          y1={floorBottomLeft.y}
          x2={vpx}
          y2={vpy}
          stroke={scheme.groundColor}
          strokeWidth="0.7"
          opacity="0.25"
        />
      );
    }
    return lines;
  }, [width, height, scheme, floorTopLeft, floorTopRight, floorBottomLeft, floorBottomRight, vpx, vpy]);

  // ── Stars (MYTHIC + SILVER) ───────────────────────────────────────────────

  const stars = useMemo(() => {
    if (league !== 'MYTHIC' && league !== 'SILVER') return null;
    const starEls: React.ReactNode[] = [];
    const count = Math.round(30 + seqRand(3) * 10);
    for (let i = 0; i < count; i++) {
      const sx2 = seqRand(i, 6) * width;
      const sy2 = seqRand(i, 7) * height * 0.5;
      const sr  = 0.8 + seqRand(i, 8) * 1.2;
      const delay = (seqRand(i, 9) * 3).toFixed(2);
      const dur   = (2 + seqRand(i, 10) * 2).toFixed(2);
      starEls.push(
        <circle
          key={`star-${i}`}
          cx={sx2}
          cy={sy2}
          r={sr}
          fill="white"
          opacity={0.6 + seqRand(i, 11) * 0.4}
          style={animated ? { animation: `star-twinkle ${dur}s ${delay}s infinite ease-in-out alternate` } : {}}
        />
      );
    }
    return starEls;
  }, [league, width, height, animated]);

  // ── League-specific effects ────────────────────────────────────────────────

  const leagueEffects = useMemo(() => {
    const effects: React.ReactNode[] = [];

    if (league === 'MYTHIC') {
      // Floating ember particles
      for (let e = 0; e < 15; e++) {
        const ex = seqRand(e, 12) * width;
        const ey = height * 0.5 + seqRand(e, 13) * height * 0.5;
        const er = 1.5 + seqRand(e, 14) * 2.5;
        const dur = (3 + seqRand(e, 15) * 3).toFixed(2);
        const delay = (seqRand(e, 16) * 4).toFixed(2);
        effects.push(
          <circle
            key={`ember-${e}`}
            cx={ex}
            cy={ey}
            r={er}
            fill={e % 2 === 0 ? '#f97316' : '#a78bfa'}
            opacity="0.7"
            style={animated ? { animation: `ember-rise ${dur}s ${delay}s infinite ease-in-out` } : {}}
          />
        );
      }
    }

    if (league === 'GOLD') {
      // Light shafts from above
      for (let ls = 0; ls < 4; ls++) {
        const lsx = width * (0.15 + ls * 0.22);
        effects.push(
          <rect
            key={`shaft-${ls}`}
            x={lsx}
            y={0}
            width={width * 0.08}
            height={height * 0.7}
            fill="url(#gold-shaft-grad)"
            opacity="0.07"
            transform={`rotate(${-8 + ls * 4}, ${lsx + width * 0.04}, 0)`}
          />
        );
      }
      effects.unshift(
        <defs key="gold-shaft-defs">
          <linearGradient id="gold-shaft-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
      );
    }

    if (league === 'SILVER') {
      // Ice mist at ground level
      effects.push(
        <rect
          key="ice-mist"
          x={0}
          y={height * 0.80}
          width={width}
          height={height * 0.25}
          fill="#94a3b8"
          opacity="0.07"
          filter="url(#silver-blur)"
        />,
        <defs key="silver-blur-def">
          <filter id="silver-blur">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>
      );
    }

    if (league === 'BRONZE') {
      // Warm dust particles
      for (let d = 0; d < 12; d++) {
        const dx = seqRand(d, 17) * width;
        const dy = height * 0.55 + seqRand(d, 18) * height * 0.45;
        const dur = (4 + seqRand(d, 19) * 3).toFixed(2);
        const delay = (seqRand(d, 20) * 3).toFixed(2);
        effects.push(
          <circle
            key={`dust-${d}`}
            cx={dx}
            cy={dy}
            r={1 + seqRand(d, 21) * 2}
            fill="#d97706"
            opacity="0.35"
            style={animated ? { animation: `dust-drift ${dur}s ${delay}s infinite ease-in-out` } : {}}
          />
        );
      }
    }

    if (league === 'AWAKENING') {
      // Lightning flash
      const lx = width * 0.45;
      const ly1 = 0;
      const ly2 = height * 0.55;
      effects.push(
        <path
          key="lightning"
          d={`M${lx},${ly1} L${lx + 10},${height * 0.25} L${lx - 8},${height * 0.38} L${lx + 14},${ly2}`}
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          opacity="0"
          style={animated ? { animation: `lightning-flash 4s 1s infinite` } : {}}
        />
      );
    }

    return effects;
  }, [league, width, height, animated]);

  // ── CSS Keyframes ─────────────────────────────────────────────────────────

  const css = animated ? `
    @keyframes torch-flicker {
      0%   { transform: scaleY(1)    rotate(0deg);   }
      50%  { transform: scaleY(1.12) rotate(-3deg);  }
      100% { transform: scaleY(0.88) rotate(2deg);   }
    }
    @keyframes crowd-sway {
      from { transform: translateX(-2px); }
      to   { transform: translateX(2px);  }
    }
    @keyframes star-twinkle {
      from { opacity: 0.3; }
      to   { opacity: 1.0; }
    }
    @keyframes ember-rise {
      0%   { transform: translateY(0px)   translateX(0px);  opacity: 0.7; }
      50%  { transform: translateY(-40px) translateX(8px);  opacity: 0.4; }
      100% { transform: translateY(-80px) translateX(-5px); opacity: 0;   }
    }
    @keyframes dust-drift {
      0%   { transform: translateX(0px)   translateY(0px);  opacity: 0.35; }
      50%  { transform: translateX(20px)  translateY(-15px);opacity: 0.2;  }
      100% { transform: translateX(-10px) translateY(-30px);opacity: 0;    }
    }
    @keyframes lightning-flash {
      0%, 88%, 92%, 96%, 100% { opacity: 0; }
      90%, 94%                { opacity: 0.7; }
    }
    @keyframes ambient-pulse {
      0%, 100% { opacity: ${intensityMult > 1 ? 0.9 : 1.0}; }
      50%      { opacity: 1.0; }
    }
    ${flashResult ? `
    @keyframes result-flash {
      0%, 100% { opacity: 0; }
      10%, 90% { opacity: 0.35; }
    }
    ` : ''}
  ` : '';

  // ── Stone texture pattern ─────────────────────────────────────────────────

  const stonePatternId = `stone-${league}`;
  const sandPatternId  = `sand-${league}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <style>{css}</style>

      <defs>
        {/* Stone cross-hatch pattern for wall */}
        <pattern id={stonePatternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="transparent" />
          <line x1="0" y1="10" x2="20" y2="10" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <line x1="10" y1="0" x2="10" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        </pattern>

        {/* Sand dot texture for floor */}
        <pattern id={sandPatternId} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="transparent" />
          <circle cx="2" cy="2" r="0.6" fill="rgba(255,255,255,0.05)" />
          <circle cx="6" cy="5" r="0.5" fill="rgba(255,255,255,0.04)" />
        </pattern>

        {/* Vignette gradient */}
        <radialGradient id={`vignette-${league}`} cx="50%" cy="50%" r="70%">
          <stop offset="40%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.82)" />
        </radialGradient>

        {/* Fog turbulence filter */}
        <filter id={`fog-filter-${league}`} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.008"
            numOctaves="3"
            seed="42"
            result="noise"
          >
            {animated && (
              <animate
                attributeName="baseFrequency"
                values="0.012 0.008;0.018 0.012;0.012 0.008"
                dur={fogAnimDur}
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* 1. Sky background */}
      <rect x="0" y="0" width={width} height={height} fill={scheme.skyColor} />

      {/* 2. Stars */}
      {stars}

      {/* 3. Colosseum back wall base */}
      <rect
        x="0"
        y={height * 0.08}
        width={width}
        height={height * 0.55}
        fill={scheme.skyColor}
        opacity="0.6"
      />
      {/* Stone texture over wall */}
      <rect
        x="0"
        y={height * 0.08}
        width={width}
        height={height * 0.55}
        fill={`url(#${stonePatternId})`}
      />

      {/* Wall slightly lighter band */}
      <rect
        x="0"
        y={height * 0.08}
        width={width}
        height={height * 0.55}
        fill="rgba(255,255,255,0.025)"
      />

      {/* 3. Arch openings */}
      {wallData.paths}

      {/* 4. Crowd silhouettes */}
      {crowdData}

      {/* 5. Fog layer */}
      <rect
        x="0"
        y={height * 0.25}
        width={width}
        height={height * 0.45}
        fill={scheme.fogColor}
        opacity={0.15 * intensityMult}
        filter={animated ? `url(#fog-filter-${league})` : undefined}
      />

      {/* League-specific effects (behind floor) */}
      {leagueEffects}

      {/* 6. Arena floor */}
      <polygon
        points={floorPoints}
        fill={scheme.groundColor}
      />
      {/* Sand texture on floor */}
      <polygon
        points={floorPoints}
        fill={`url(#${sandPatternId})`}
        opacity="0.8"
      />

      {/* Floor perspective lines */}
      {floorLines}

      {/* 7. Torches */}
      {torchData}

      {/* Ambient color wash (intensity pulse in combat/result) */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill={scheme.ambientColor}
        style={animated && intensity !== 'calm' ? { animation: `ambient-pulse 1.2s ease-in-out infinite` } : {}}
      />

      {/* 9. Vignette overlay */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill={`url(#vignette-${league})`}
        pointerEvents="none"
      />

      {/* Result flash overlay */}
      {flashResult && animated && (
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="white"
          opacity="0"
          style={{ animation: 'result-flash 0.6s ease-out forwards' }}
          pointerEvents="none"
        />
      )}
    </svg>
  );
};

export default ArenaBg;
