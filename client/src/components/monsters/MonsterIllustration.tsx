import React, { useMemo } from 'react';

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function strToSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ANCIENT';

interface MonsterIllustrationProps {
  monsterId: string;
  tier: Tier;
  league: string;
  difficultyMult: number;
  size?: number;
  animated?: boolean;
  showArena?: boolean;
}

// ─── Tier Palettes ────────────────────────────────────────────────────────────

const TIER_PALETTES: Record<Tier, {
  primary: string;
  secondary: string;
  glow: string;
  accent: string;
  particle: string;
}> = {
  COMMON:    { primary: '#6b7280', secondary: '#4b5563', glow: 'none',    accent: '#9ca3af', particle: 'none' },
  RARE:      { primary: '#1d4ed8', secondary: '#1e3a5f', glow: '#3b82f6', accent: '#93c5fd', particle: '#60a5fa' },
  EPIC:      { primary: '#6d28d9', secondary: '#2e1065', glow: '#8b5cf6', accent: '#c4b5fd', particle: '#a78bfa' },
  LEGENDARY: { primary: '#92400e', secondary: '#1a0a00', glow: '#f59e0b', accent: '#fcd34d', particle: '#fbbf24' },
  ANCIENT:   { primary: '#7f1d1d', secondary: '#0a0000', glow: '#dc2626', accent: '#fca5a5', particle: '#ef4444' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const MonsterIllustration: React.FC<MonsterIllustrationProps> = ({
  monsterId,
  tier,
  league,
  difficultyMult,
  size = 200,
  animated = true,
  showArena = false,
}) => {
  const palette = TIER_PALETTES[tier];
  const hasGlow = palette.glow !== 'none';
  const hasParticles = palette.particle !== 'none';

  const svgContent = useMemo(() => {
    const rng = mulberry32(strToSeed(monsterId + league));
    const archetype = Math.floor(rng() * 5); // 0–4
    const scale = Math.min(1.4, 0.8 + difficultyMult * 0.3);
    const cx = 100;
    const cy = 100;

    // ── helpers ──────────────────────────────────────────────────────────────
    const s = (v: number) => v * scale;
    const sx = (v: number) => cx + (v - cx) * scale;
    const sy = (v: number) => cy + (v - cy) * scale;

    const rand = () => rng();
    const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
    const randChoice = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

    // ── Archetype builders ────────────────────────────────────────────────────

    // 0: HUMANOID
    const buildHumanoid = () => {
      const hasHelmet = rand() > 0.4;
      const helmetType = randChoice(['spike', 'crown', 'horned'] as const);
      const weaponType = randChoice(['sword', 'axe', 'staff'] as const);
      const hasCape = rand() > 0.5;
      const hasBattleDamage = difficultyMult > 1.5;

      const torsoX = sx(85);
      const torsoY = sy(72);
      const torsoW = s(30);
      const torsoH = s(40);
      const headCX = sx(100);
      const headCY = sy(62);
      const headR = s(13);
      const legW = s(11);
      const legH = s(30);

      const bodyParts: React.ReactNode[] = [];

      // Cape
      if (hasCape) {
        bodyParts.push(
          <polygon
            key="cape"
            points={`${sx(100)},${sy(72)} ${sx(75)},${sy(125)} ${sx(125)},${sy(125)}`}
            fill={palette.secondary}
            opacity="0.9"
          />
        );
      }

      // Legs
      bodyParts.push(
        <rect key="leg-l" x={sx(82)} y={sy(108)} width={legW} height={legH} rx={s(4)} fill={palette.primary} />,
        <rect key="leg-r" x={sx(107)} y={sy(108)} width={legW} height={legH} rx={s(4)} fill={palette.primary} />
      );

      // Arms
      bodyParts.push(
        <rect
          key="arm-l"
          x={sx(68)}
          y={sy(74)}
          width={s(12)}
          height={s(32)}
          rx={s(5)}
          fill={palette.primary}
          transform={`rotate(-8, ${sx(74)}, ${sy(74)})`}
        />,
        <rect
          key="arm-r"
          x={sx(120)}
          y={sy(74)}
          width={s(12)}
          height={s(32)}
          rx={s(5)}
          fill={palette.primary}
          transform={`rotate(8, ${sx(126)}, ${sy(74)})`}
        />
      );

      // Torso
      bodyParts.push(
        <rect
          key="torso"
          x={torsoX}
          y={torsoY}
          width={torsoW}
          height={torsoH}
          rx={s(6)}
          fill={palette.primary}
        />
      );

      // Battle damage scars
      if (hasBattleDamage) {
        bodyParts.push(
          <line key="scar1" x1={sx(90)} y1={sy(78)} x2={sx(102)} y2={sy(92)} stroke={palette.accent} strokeWidth={s(1.5)} opacity="0.6" />,
          <line key="scar2" x1={sx(96)} y1={sy(85)} x2={sx(108)} y2={sy(100)} stroke={palette.accent} strokeWidth={s(1)} opacity="0.5" />
        );
      }

      // Head
      bodyParts.push(
        <ellipse key="head" cx={headCX} cy={headCY} rx={headR} ry={s(12)} fill={palette.primary} />
      );

      // Helmet
      if (hasHelmet) {
        if (helmetType === 'spike') {
          bodyParts.push(
            <polygon
              key="helmet"
              points={`${sx(92)},${sy(52)} ${sx(100)},${sy(38)} ${sx(108)},${sy(52)}`}
              fill={palette.secondary}
            />
          );
        } else if (helmetType === 'crown') {
          bodyParts.push(
            <polygon
              key="crown"
              points={`${sx(88)},${sy(53)} ${sx(91)},${sy(43)} ${sx(95)},${sy(50)} ${sx(100)},${sy(40)} ${sx(105)},${sy(50)} ${sx(109)},${sy(43)} ${sx(112)},${sy(53)}`}
              fill={palette.accent}
            />
          );
        } else {
          // horned
          bodyParts.push(
            <polygon key="horn-l" points={`${sx(89)},${sy(54)} ${sx(81)},${sy(40)} ${sx(93)},${sy(52)}`} fill={palette.secondary} />,
            <polygon key="horn-r" points={`${sx(111)},${sy(54)} ${sx(119)},${sy(40)} ${sx(107)},${sy(52)}`} fill={palette.secondary} />
          );
        }
      }

      // Weapon
      const weaponEls: React.ReactNode[] = [];
      if (weaponType === 'sword') {
        weaponEls.push(
          <rect key="sword-blade" x={sx(126)} y={sy(68)} width={s(5)} height={s(38)} rx={s(1)} fill={palette.accent} />,
          <rect key="sword-guard" x={sx(122)} y={sy(84)} width={s(13)} height={s(4)} rx={s(1)} fill={palette.secondary} />
        );
      } else if (weaponType === 'axe') {
        weaponEls.push(
          <rect key="axe-haft" x={sx(127)} y={sy(68)} width={s(4)} height={s(38)} rx={s(1)} fill={palette.secondary} />,
          <polygon
            key="axe-head"
            points={`${sx(129)},${sy(68)} ${sx(142)},${sy(72)} ${sx(138)},${sy(88)} ${sx(129)},${sy(88)}`}
            fill={palette.accent}
          />
        );
      } else {
        // staff
        weaponEls.push(
          <rect key="staff" x={sx(129)} y={sy(60)} width={s(4)} height={s(52)} rx={s(2)} fill={palette.secondary} />,
          <circle key="orb" cx={sx(131)} cy={sy(56)} r={s(7)} fill={hasGlow ? palette.glow : palette.accent} opacity="0.85" />
        );
      }

      const eyeEls = [
        <ellipse key="eye-l" cx={sx(95)} cy={sy(61)} rx={s(2.5)} ry={s(2)} fill={palette.accent} />,
        <ellipse key="eye-r" cx={sx(105)} cy={sy(61)} rx={s(2.5)} ry={s(2)} fill={palette.accent} />,
      ];

      return { bodyParts, weaponEls, eyeEls };
    };

    // 1: BEAST
    const buildBeast = () => {
      const tailType = randChoice(['long', 'spiked', 'club'] as const);
      const hasSpines = rand() > 0.5;
      const fangCount = randInt(2, 6);
      const hornType = randChoice(['straight', 'curved', 'spiral'] as const);
      const hornCount = randInt(1, 2);
      const hasBigTeeth = difficultyMult > 1.5;

      const bodyParts: React.ReactNode[] = [];

      // Tail
      if (tailType === 'long') {
        bodyParts.push(
          <path
            key="tail"
            d={`M${sx(138)},${sy(100)} Q${sx(158)},${sy(90)} ${sx(162)},${sy(110)}`}
            stroke={palette.primary}
            strokeWidth={s(8)}
            fill="none"
            strokeLinecap="round"
          />
        );
      } else if (tailType === 'spiked') {
        bodyParts.push(
          <path
            key="tail"
            d={`M${sx(138)},${sy(100)} Q${sx(158)},${sy(88)} ${sx(160)},${sy(108)}`}
            stroke={palette.primary}
            strokeWidth={s(7)}
            fill="none"
            strokeLinecap="round"
          />,
          <polygon key="tail-spike" points={`${sx(158)},${sy(96)} ${sx(168)},${sy(88)} ${sx(162)},${sy(106)}`} fill={palette.secondary} />
        );
      } else {
        bodyParts.push(
          <path
            key="tail"
            d={`M${sx(138)},${sy(100)} Q${sx(155)},${sy(90)} ${sx(158)},${sy(107)}`}
            stroke={palette.primary}
            strokeWidth={s(6)}
            fill="none"
          />,
          <ellipse key="tail-club" cx={sx(160)} cy={sy(106)} rx={s(9)} ry={s(7)} fill={palette.secondary} />
        );
      }

      // Body
      bodyParts.push(
        <ellipse key="body-main" cx={sx(105)} cy={sy(102)} rx={s(36)} ry={s(22)} fill={palette.primary} />
      );

      // Spine ridges
      if (hasSpines) {
        for (let i = 0; i < 5; i++) {
          const rx2 = sx(82 + i * 12);
          const ry2 = sy(84);
          bodyParts.push(
            <polygon
              key={`spine-${i}`}
              points={`${rx2 - s(3)},${ry2} ${rx2},${ry2 - s(10 + i * 2)} ${rx2 + s(3)},${ry2}`}
              fill={palette.secondary}
            />
          );
        }
      }

      // Legs
      for (let i = 0; i < 4; i++) {
        const lx = sx(76 + i * 20);
        const isBack = i >= 2;
        bodyParts.push(
          <rect key={`leg-${i}`} x={lx} y={sy(116)} width={s(10)} height={s(20)} rx={s(3)} fill={palette.primary} />,
          <ellipse key={`paw-${i}`} cx={lx + s(5)} cy={sy(138)} rx={s(7)} ry={s(4)} fill={isBack ? palette.secondary : palette.primary} />
        );
      }

      // Head
      bodyParts.push(
        <polygon
          key="head"
          points={`${sx(58)},${sy(88)} ${sx(78)},${sy(82)} ${sx(78)},${sy(110)} ${sx(58)},${sy(110)}`}
          fill={palette.primary}
        />,
        // Snout
        <ellipse key="snout" cx={sx(56)} cy={sy(105)} rx={s(8)} ry={s(5)} fill={palette.secondary} />
      );

      // Fangs
      const fangEls: React.ReactNode[] = [];
      for (let i = 0; i < Math.min(fangCount, hasBigTeeth ? 6 : 4); i++) {
        const fx = sx(50 + i * 5);
        const fh = s(hasBigTeeth ? 10 + (i % 2) * 4 : 6 + (i % 2) * 3);
        fangEls.push(
          <polygon
            key={`fang-${i}`}
            points={`${fx},${sy(108)} ${fx + s(3)},${sy(108)} ${fx + s(1.5)},${sy(108) + fh}`}
            fill={palette.accent}
          />
        );
      }

      // Horns
      const hornEls: React.ReactNode[] = [];
      for (let h = 0; h < hornCount; h++) {
        const hox = sx(64 + h * 10);
        const hoy = sy(84);
        if (hornType === 'straight') {
          hornEls.push(
            <polygon
              key={`horn-${h}`}
              points={`${hox - s(3)},${hoy} ${hox},${hoy - s(16)} ${hox + s(3)},${hoy}`}
              fill={palette.secondary}
            />
          );
        } else if (hornType === 'curved') {
          hornEls.push(
            <path
              key={`horn-${h}`}
              d={`M${hox},${hoy} Q${hox - s(8)},${hoy - s(12)} ${hox + s(2)},${hoy - s(18)}`}
              stroke={palette.secondary}
              strokeWidth={s(4)}
              fill="none"
              strokeLinecap="round"
            />
          );
        } else {
          hornEls.push(
            <path
              key={`horn-${h}`}
              d={`M${hox},${hoy} Q${hox - s(10)},${hoy - s(8)} ${hox + s(4)},${hoy - s(14)} Q${hox + s(12)},${hoy - s(18)} ${hox},${hoy - s(24)}`}
              stroke={palette.secondary}
              strokeWidth={s(4)}
              fill="none"
              strokeLinecap="round"
            />
          );
        }
      }

      const eyeEls = [
        <ellipse key="eye-l" cx={sx(67)} cy={sy(92)} rx={s(3)} ry={s(3)} fill={palette.accent} />,
        <ellipse key="eye-r" cx={sx(72)} cy={sy(91)} rx={s(3)} ry={s(3)} fill={palette.accent} />,
      ];

      return { bodyParts: [...bodyParts, ...fangEls], weaponEls: hornEls, eyeEls };
    };

    // 2: ELEMENTAL
    const buildElemental = () => {
      const wispCount = randInt(4, 8);
      const eyeCount = randInt(1, 3);
      const corePoints = randInt(6, 10);

      const bodyParts: React.ReactNode[] = [];

      // Core blob (irregular polygon)
      const coreVertices: string[] = [];
      for (let i = 0; i < corePoints; i++) {
        const angle = (i / corePoints) * Math.PI * 2;
        const r = s(28 + rand() * 12);
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r * 0.9;
        coreVertices.push(`${px},${py}`);
      }
      bodyParts.push(
        <polygon key="core" points={coreVertices.join(' ')} fill={palette.primary} opacity="0.9" />
      );

      // Inner void / fire
      if (difficultyMult > 1.3) {
        const innerVerts: string[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const r = s(12 + rand() * 6);
          innerVerts.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
        }
        bodyParts.push(
          <polygon key="inner" points={innerVerts.join(' ')} fill={palette.secondary} opacity="0.7" />
        );
      }

      // Tendrils
      for (let t = 0; t < 4; t++) {
        const angle = (t / 4) * Math.PI * 2 + rand() * 0.4;
        const x1 = cx + Math.cos(angle) * s(28);
        const y1 = cy + Math.sin(angle) * s(28);
        const x2 = cx + Math.cos(angle) * s(46);
        const y2 = cy + Math.sin(angle) * s(46);
        bodyParts.push(
          <line
            key={`tendril-${t}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={palette.primary}
            strokeWidth={s(4 + rand() * 4)}
            strokeLinecap="round"
            opacity="0.7"
          />
        );
      }

      // Wisps
      const wispEls: React.ReactNode[] = [];
      for (let w = 0; w < wispCount; w++) {
        const wx = sx(55 + rand() * 90);
        const wy = sy(52 + rand() * 96);
        wispEls.push(
          <circle key={`wisp-${w}`} cx={wx} cy={wy} r={s(3 + rand() * 4)} fill={palette.accent} opacity={0.4 + rand() * 0.3} />
        );
      }

      const eyeEls: React.ReactNode[] = [];
      for (let e = 0; e < eyeCount; e++) {
        const angle = ((e / eyeCount) * Math.PI * 1.2) - 0.3;
        const er = s(10);
        eyeEls.push(
          <ellipse
            key={`eye-${e}`}
            cx={cx + Math.cos(angle) * er}
            cy={cy + Math.sin(angle) * er - s(4)}
            rx={s(4)}
            ry={s(4)}
            fill={palette.accent}
          />
        );
      }

      return { bodyParts: [...bodyParts, ...wispEls], weaponEls: [], eyeEls };
    };

    // 3: ARMORED COLOSSUS
    const buildArmoredColossus = () => {
      const hasSpikes = rand() > 0.4;
      const extraArmor = difficultyMult > 1.5;

      const bodyParts: React.ReactNode[] = [];

      // Legs — thick and wide
      bodyParts.push(
        <rect key="leg-l" x={sx(77)} y={sy(112)} width={s(18)} height={s(28)} rx={s(3)} fill={palette.secondary} />,
        <rect key="leg-r" x={sx(105)} y={sy(112)} width={s(18)} height={s(28)} rx={s(3)} fill={palette.secondary} />,
        // Leg armor
        <rect key="armor-leg-l" x={sx(75)} y={sy(116)} width={s(22)} height={s(14)} rx={s(2)} fill={palette.primary} opacity="0.85" />,
        <rect key="armor-leg-r" x={sx(103)} y={sy(116)} width={s(22)} height={s(14)} rx={s(2)} fill={palette.primary} opacity="0.85" />
      );

      // Torso — very wide
      bodyParts.push(
        <rect key="torso" x={sx(73)} y={sy(72)} width={s(54)} height={s(42)} rx={s(8)} fill={palette.secondary} />,
        // Chest plate
        <rect key="chest" x={sx(78)} y={sy(76)} width={s(44)} height={s(34)} rx={s(6)} fill={palette.primary} />
      );

      if (extraArmor) {
        bodyParts.push(
          <rect key="chest2" x={sx(84)} y={sy(80)} width={s(32)} height={s(26)} rx={s(4)} fill={palette.secondary} opacity="0.7" />
        );
      }

      // Shoulder armor
      bodyParts.push(
        <ellipse key="shoulder-l" cx={sx(76)} cy={sy(80)} rx={s(12)} ry={s(10)} fill={palette.primary} transform={`rotate(-15, ${sx(76)}, ${sy(80)})`} />,
        <ellipse key="shoulder-r" cx={sx(124)} cy={sy(80)} rx={s(12)} ry={s(10)} fill={palette.primary} transform={`rotate(15, ${sx(124)}, ${sy(80)})`} />
      );

      if (hasSpikes) {
        for (let i = 0; i < 3; i++) {
          bodyParts.push(
            <polygon
              key={`spike-l-${i}`}
              points={`${sx(67 - i * 3)},${sy(74 + i * 5)} ${sx(72 - i * 3)},${sy(62 + i * 5)} ${sx(77 - i * 3)},${sy(74 + i * 5)}`}
              fill={palette.accent}
            />,
            <polygon
              key={`spike-r-${i}`}
              points={`${sx(123 + i * 3)},${sy(74 + i * 5)} ${sx(128 + i * 3)},${sy(62 + i * 5)} ${sx(133 + i * 3)},${sy(74 + i * 5)}`}
              fill={palette.accent}
            />
          );
        }
      }

      // Arms
      bodyParts.push(
        <rect key="arm-l" x={sx(58)} y={sy(78)} width={s(16)} height={s(30)} rx={s(6)} fill={palette.secondary} />,
        <rect key="arm-r" x={sx(126)} y={sy(78)} width={s(16)} height={s(30)} rx={s(6)} fill={palette.secondary} />
      );

      // Helmet / head
      bodyParts.push(
        <rect key="helmet-base" x={sx(83)} y={sy(54)} width={s(34)} height={s(20)} rx={s(10)} fill={palette.secondary} />,
        // Visor
        <rect key="visor" x={sx(87)} y={sy(62)} width={s(26)} height={s(6)} rx={s(2)} fill="#0a0a0a" />
      );

      // Chains/bolts
      bodyParts.push(
        <circle key="bolt-l" cx={sx(82)} cy={sy(80)} r={s(2.5)} fill={palette.accent} />,
        <circle key="bolt-r" cx={sx(118)} cy={sy(80)} r={s(2.5)} fill={palette.accent} />,
        <circle key="bolt-c" cx={sx(100)} cy={sy(88)} r={s(2.5)} fill={palette.accent} />
      );

      const eyeEls = [
        <rect key="eye-l" x={sx(89)} y={sy(61)} width={s(8)} height={s(4)} rx={s(2)} fill={palette.accent} />,
        <rect key="eye-r" x={sx(103)} y={sy(61)} width={s(8)} height={s(4)} rx={s(2)} fill={palette.accent} />,
      ];

      return { bodyParts, weaponEls: [], eyeEls };
    };

    // 4: WRAITH
    const buildWraith = () => {
      const tatteredCount = randInt(4, 7);

      const bodyParts: React.ReactNode[] = [];

      // Fade-out trail (gradient will be defined inline via stop)
      bodyParts.push(
        <defs key="wraith-grad">
          <linearGradient id="wraith-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={palette.primary} stopOpacity="0" />
          </linearGradient>
        </defs>,
        <ellipse key="body-fade" cx={sx(100)} cy={sy(108)} rx={s(22)} ry={s(40)} fill="url(#wraith-fade)" />
      );

      // Torso
      bodyParts.push(
        <ellipse key="torso" cx={sx(100)} cy={sy(90)} rx={s(20)} ry={s(18)} fill={palette.primary} opacity="0.95" />
      );

      // Tattered appendages
      for (let t = 0; t < tatteredCount; t++) {
        const side = t % 2 === 0 ? -1 : 1;
        const tx = sx(100 + side * (20 + rand() * 20));
        const ty1 = sy(95 + rand() * 20);
        const ty2 = sy(115 + rand() * 20);
        bodyParts.push(
          <polygon
            key={`tatter-${t}`}
            points={`${tx},${ty1} ${tx + s(side * 10)},${ty2} ${tx + s(side * 6)},${ty1 + s(4)}`}
            fill={palette.secondary}
            opacity={0.5 + rand() * 0.3}
          />
        );
      }

      // Claw arms
      bodyParts.push(
        <path key="arm-l"
          d={`M${sx(82)},${sy(90)} Q${sx(68)},${sy(95)} ${sx(62)},${sy(108)} M${sx(64)},${sy(107)} L${sx(58)},${sy(113)} M${sx(64)},${sy(107)} L${sx(62)},${sy(116)}`}
          stroke={palette.secondary} strokeWidth={s(3)} fill="none" strokeLinecap="round"
        />,
        <path key="arm-r"
          d={`M${sx(118)},${sy(90)} Q${sx(132)},${sy(95)} ${sx(138)},${sy(108)} M${sx(136)},${sy(107)} L${sx(142)},${sy(113)} M${sx(136)},${sy(107)} L${sx(138)},${sy(116)}`}
          stroke={palette.secondary} strokeWidth={s(3)} fill="none" strokeLinecap="round"
        />
      );

      // Head
      bodyParts.push(
        <ellipse key="head" cx={sx(100)} cy={sy(68)} rx={s(14)} ry={s(16)} fill={palette.primary} />,
        // Hollow eye sockets
        <ellipse key="socket-l" cx={sx(94)} cy={sy(66)} rx={s(4)} ry={s(4.5)} fill="#050505" />,
        <ellipse key="socket-r" cx={sx(106)} cy={sy(66)} rx={s(4)} ry={s(4.5)} fill="#050505" />
      );

      if (difficultyMult > 1.3) {
        // More tattered
        bodyParts.push(
          <ellipse key="void" cx={sx(100)} cy={sy(90)} rx={s(8)} ry={s(10)} fill={palette.secondary} opacity="0.5" />
        );
      }

      const eyeEls = [
        <ellipse key="eye-inner-l" cx={sx(94)} cy={sy(66)} rx={s(2)} ry={s(2.5)} fill={palette.accent} opacity="0.9" />,
        <ellipse key="eye-inner-r" cx={sx(106)} cy={sy(66)} rx={s(2)} ry={s(2.5)} fill={palette.accent} opacity="0.9" />,
      ];

      return { bodyParts, weaponEls: [], eyeEls };
    };

    // ── Select archetype ──────────────────────────────────────────────────────
    let built: { bodyParts: React.ReactNode[]; weaponEls: React.ReactNode[]; eyeEls: React.ReactNode[] };
    switch (archetype) {
      case 0: built = buildHumanoid(); break;
      case 1: built = buildBeast(); break;
      case 2: built = buildElemental(); break;
      case 3: built = buildArmoredColossus(); break;
      default: built = buildWraith(); break;
    }

    // ── Particles ─────────────────────────────────────────────────────────────
    const particleEls: React.ReactNode[] = [];
    if (hasParticles) {
      const particleCount = randInt(6, 10);
      for (let p = 0; p < particleCount; p++) {
        const px = sx(60 + rand() * 80);
        const py = sy(80 + rand() * 60);
        const delay = rand() * 2;
        const dur = 1.5 + rand() * 1.5;
        particleEls.push(
          <circle
            key={`particle-${p}`}
            cx={px}
            cy={py}
            r={s(2 + rand() * 2)}
            fill={palette.particle}
            opacity="0.8"
            style={animated ? { animation: `particle-float-${tier} ${dur}s ${delay}s infinite ease-out` } : {}}
          />
        );
      }
    }

    return { built, particleEls };
  }, [monsterId, tier, league, difficultyMult, hasParticles, palette]);

  const { built, particleEls } = svgContent;

  // ── CSS animations ──────────────────────────────────────────────────────────
  const cssAnimations = animated ? `
    @keyframes body-breathe {
      0%, 100% { transform: scaleY(1); }
      50%       { transform: scaleY(1.025); }
    }
    @keyframes eye-flicker {
      0%, 100% { opacity: 0.8; }
      50%       { opacity: 1.0; }
    }
    @keyframes particle-float-${tier} {
      0%   { transform: translateY(0px);  opacity: 0.8; }
      100% { transform: translateY(-40px); opacity: 0;   }
    }
    #monster-body {
      animation: body-breathe 3s ease-in-out infinite;
      transform-origin: 100px 100px;
    }
    #monster-eyes {
      animation: eye-flicker 1.5s ease-in-out infinite;
    }
  ` : '';

  // ── Glow filter ──────────────────────────────────────────────────────────────
  const glowFilter = hasGlow ? (
    <filter id={`glow-${tier}`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feColorMatrix
        in="blur"
        type="matrix"
        values={
          tier === 'RARE'      ? '0 0 0 0 0.231  0 0 0 0 0.510  0 0 0 0 0.965  0 0 0 1 0' :
          tier === 'EPIC'      ? '0 0 0 0 0.545  0 0 0 0 0.361  0 0 0 0 0.851  0 0 0 1 0' :
          tier === 'LEGENDARY' ? '0 0 0 0 0.961  0 0 0 0 0.620  0 0 0 0 0.043  0 0 0 1 0' :
                                 '0 0 0 0 0.863  0 0 0 0 0.149  0 0 0 0 0.149  0 0 0 1 0'
        }
        result="coloredBlur"
      />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  ) : null;

  // ── Arena frame ──────────────────────────────────────────────────────────────
  const arenaFrame = showArena ? (
    <>
      {/* Background shadow oval */}
      <ellipse cx="100" cy="165" rx="65" ry="18" fill="rgba(0,0,0,0.55)" />
      {/* Left pillar */}
      <rect x="8" y="20" width="18" height="160" rx="4" fill="#0d0d0f" opacity="0.6" />
      {/* Right pillar */}
      <rect x="174" y="20" width="18" height="160" rx="4" fill="#0d0d0f" opacity="0.6" />
      {/* Vignette overlay */}
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
          <stop offset="50%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.75)" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="200" height="200" fill="url(#vignette)" />
    </>
  ) : null;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <style>{cssAnimations}</style>

      <defs>
        {glowFilter}
        {/* Ambient radial glow for aura */}
        {hasGlow && (
          <radialGradient id={`aura-grad-${tier}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.glow} stopOpacity="0.18" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>

      {/* Arena frame (background layer) */}
      {showArena && (
        <>
          <ellipse cx="100" cy="165" rx="65" ry="18" fill="rgba(0,0,0,0.55)" />
          <rect x="8" y="20" width="18" height="160" rx="4" fill="#0d0d0f" opacity="0.6" />
          <rect x="174" y="20" width="18" height="160" rx="4" fill="#0d0d0f" opacity="0.6" />
        </>
      )}

      {/* Aura */}
      <g id="monster-aura">
        {hasGlow && (
          <ellipse
            cx="100"
            cy="105"
            rx="72"
            ry="60"
            fill={`url(#aura-grad-${tier})`}
          />
        )}
      </g>

      {/* Ground shadow */}
      <ellipse cx="100" cy="155" rx="45" ry="10" fill="rgba(0,0,0,0.35)" />

      {/* Monster body */}
      <g id="monster-body">
        {built.bodyParts}
      </g>

      {/* Features / weapon */}
      <g id="monster-features">
        {built.weaponEls}
      </g>

      {/* Eyes */}
      <g
        id="monster-eyes"
        filter={hasGlow ? `url(#glow-${tier})` : undefined}
      >
        {built.eyeEls}
      </g>

      {/* Particles */}
      <g id="monster-particles">
        {particleEls}
      </g>

      {/* Arena vignette (foreground) */}
      {showArena && (
        <>
          <defs>
            <radialGradient id="arena-vignette" cx="50%" cy="50%" r="50%">
              <stop offset="50%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.72)" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="200" height="200" fill="url(#arena-vignette)" pointerEvents="none" />
        </>
      )}
    </svg>
  );
};

export default MonsterIllustration;
