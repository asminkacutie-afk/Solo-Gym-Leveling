/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT:   '#0a0a0f',
          secondary: '#0f0f1a',
          card:      '#13131f',
          elevated:  '#17172a',
          border:    '#1e1e2e',
        },
        purple: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          glow: 'rgba(124,58,237,0.4)',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          glow: 'rgba(245,158,11,0.4)',
        },
        // Blood red — danger / loss / combat
        blood: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          glow: 'rgba(220,38,38,0.4)',
        },
        // Ice blue — stats display
        ice: {
          300: '#bae6fd',
          400: '#7dd3fc',
          500: '#38bdf8',
          600: '#0ea5e9',
          glow: 'rgba(56,189,248,0.35)',
        },
        // Per-discipline accent
        discipline: {
          power:     '#ef4444',
          titan:     '#f59e0b',
          precision: '#38bdf8',
          endurance: '#10b981',
          vitality:  '#ec4899',
          synthesis: '#8b5cf6',
        },
        // League tiers
        league: {
          iron:      '#6b7280',
          awakening: '#38bdf8',
          bronze:    '#d97706',
          silver:    '#94a3b8',
          gold:      '#fbbf24',
          mythic:    '#a78bfa',
        },
        // Monster tiers
        tier: {
          common:    '#6b7280',
          rare:      '#3b82f6',
          epic:      '#8b5cf6',
          legendary: '#f59e0b',
          ancient:   '#dc2626',
        },
        // Keep legacy names for existing code
        iron:    { DEFAULT: '#6b7280', light: '#9ca3af', dark: '#4b5563' },
        bronze:  { DEFAULT: '#92400e', light: '#d97706', dark: '#78350f' },
        silver:  { DEFAULT: '#64748b', light: '#94a3b8', dark: '#475569' },
        mythic:  { DEFAULT: '#7c3aed', light: '#a78bfa', dark: '#5b21b6', glow: 'rgba(124,58,237,0.6)' },
      },

      fontFamily: {
        display: ['"Cinzel"', 'Palatino Linotype', 'Book Antiqua', 'serif'],
        body:    ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'monospace'],
      },

      boxShadow: {
        'purple-glow':      '0 0 20px rgba(124,58,237,0.45), 0 0 40px rgba(124,58,237,0.18)',
        'purple-glow-sm':   '0 0 10px rgba(124,58,237,0.35), 0 0 20px rgba(124,58,237,0.12)',
        'purple-glow-lg':   '0 0 35px rgba(124,58,237,0.6),  0 0 70px rgba(124,58,237,0.25)',
        'gold-glow':        '0 0 20px rgba(245,158,11,0.45), 0 0 40px rgba(245,158,11,0.18)',
        'gold-glow-sm':     '0 0 10px rgba(245,158,11,0.35), 0 0 20px rgba(245,158,11,0.12)',
        'blood-glow':       '0 0 20px rgba(220,38,38,0.45),  0 0 40px rgba(220,38,38,0.18)',
        'blood-glow-sm':    '0 0 10px rgba(220,38,38,0.35),  0 0 20px rgba(220,38,38,0.12)',
        'ice-glow':         '0 0 20px rgba(56,189,248,0.4),  0 0 40px rgba(56,189,248,0.15)',
        'ice-glow-sm':      '0 0 10px rgba(56,189,248,0.3),  0 0 20px rgba(56,189,248,0.1)',
        // Discipline glows
        'power-glow':       '0 0 16px rgba(239,68,68,0.4),   0 0 32px rgba(239,68,68,0.15)',
        'titan-glow':       '0 0 16px rgba(245,158,11,0.4),  0 0 32px rgba(245,158,11,0.15)',
        'precision-glow':   '0 0 16px rgba(56,189,248,0.4),  0 0 32px rgba(56,189,248,0.15)',
        'endurance-glow':   '0 0 16px rgba(16,185,129,0.4),  0 0 32px rgba(16,185,129,0.15)',
        'vitality-glow':    '0 0 16px rgba(236,72,153,0.4),  0 0 32px rgba(236,72,153,0.15)',
        'synthesis-glow':   '0 0 16px rgba(139,92,246,0.4),  0 0 32px rgba(139,92,246,0.15)',
        // Card states
        'card-glow':        '0 0 0 1px rgba(124,58,237,0.2), 0 4px 24px rgba(0,0,0,0.55)',
        'card-glow-hover':  '0 0 0 1px rgba(124,58,237,0.4), 0 8px 32px rgba(124,58,237,0.18)',
        'card-lift':        '0 16px 48px rgba(0,0,0,0.65),   0 0 0 1px rgba(255,255,255,0.04)',
        // Monster tier glows
        'rare-glow':        '0 0 24px rgba(59,130,246,0.35)',
        'epic-glow':        '0 0 24px rgba(139,92,246,0.4)',
        'legendary-glow':   '0 0 28px rgba(245,158,11,0.45)',
        'ancient-glow':     '0 0 36px rgba(220,38,38,0.55)',
        // Combat feedback
        'combat-hit':       '0 0 0 3px rgba(124,58,237,0.85), 0 0 30px rgba(124,58,237,0.6)',
        'combat-pr':        '0 0 0 4px rgba(245,158,11,0.85), 0 0 40px rgba(245,158,11,0.65)',
        // Legacy
        'red-glow':         '0 0 20px rgba(239,68,68,0.4),   0 0 40px rgba(239,68,68,0.15)',
        'green-glow':       '0 0 20px rgba(16,185,129,0.4),  0 0 40px rgba(16,185,129,0.15)',
        'inset':            'inset 0 2px 4px rgba(0,0,0,0.4)',
      },

      backgroundImage: {
        'purple-gradient':   'linear-gradient(135deg, #7c3aed, #4f46e5)',
        'gold-gradient':     'linear-gradient(135deg, #f59e0b, #d97706)',
        'blood-gradient':    'linear-gradient(135deg, #dc2626, #991b1b)',
        'dark-gradient':     'linear-gradient(135deg, #0f0f1a, #0a0a0f)',
        'card-gradient':     'linear-gradient(160deg, #16162a 0%, #0f0f1a 100%)',
        'mythic-gradient':   'linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f59e0b 100%)',
        'power-gradient':    'linear-gradient(135deg, #ef4444, #b91c1c)',
        'titan-gradient':    'linear-gradient(135deg, #f59e0b, #b45309)',
        'precision-gradient':'linear-gradient(135deg, #38bdf8, #0ea5e9)',
        'endurance-gradient':'linear-gradient(135deg, #10b981, #059669)',
        'vitality-gradient': 'linear-gradient(135deg, #ec4899, #db2777)',
        'synthesis-gradient':'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        'skeleton-shimmer':  'linear-gradient(90deg, #13131f 25%, #1c1c30 50%, #13131f 75%)',
      },

      animation: {
        'glow-pulse':       'glow-pulse 2s ease-in-out infinite',
        'glow-pulse-fast':  'glow-pulse 0.9s ease-in-out infinite',
        'float':            'float 3s ease-in-out infinite',
        'level-up':         'level-up 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'fade-in':          'fade-in 0.3s ease-out forwards',
        'fade-in-up':       'fade-in-up 0.4s ease-out forwards',
        'slide-up':         'slide-up 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
        'scale-in':         'scale-in 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'shimmer':          'shimmer 1.8s linear infinite',
        'skeleton':         'skeleton-sweep 1.6s linear infinite',
        'combat-flash':     'combat-flash 0.32s ease-out forwards',
        'combat-pr-flash':  'combat-pr-flash 0.4s ease-out forwards',
        'damage-text':      'damage-text 0.8s ease-out forwards',
        'particle-burst':   'particle-burst 1s ease-out forwards',
        'radar-pulse':      'radar-pulse 3s ease-in-out infinite',
        'number-pop':       'number-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'xp-fill':          'xp-fill 1s cubic-bezier(0.4,0,0.2,1) forwards',
        'stat-fill':        'stat-fill 0.8s cubic-bezier(0.4,0,0.2,1) forwards',
        'spin-slow':        'spin 4s linear infinite',
        'bounce-soft':      'bounce-soft 1.2s ease-in-out infinite',
        'ping-slow':        'ping 2s cubic-bezier(0,0,0.2,1) infinite',
      },

      keyframes: {
        'glow-pulse': {
          '0%,100%': { boxShadow: '0 0 8px rgba(124,58,237,0.3)' },
          '50%':     { boxShadow: '0 0 25px rgba(124,58,237,0.65), 0 0 50px rgba(124,58,237,0.3)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        'level-up': {
          '0%':   { transform: 'scale(0.3) rotate(-10deg)', opacity: '0' },
          '50%':  { transform: 'scale(1.25) rotate(2deg)',  opacity: '1' },
          '75%':  { transform: 'scale(0.96)',               opacity: '1' },
          '100%': { transform: 'scale(1)',                   opacity: '1' },
        },
        'fade-in':    { from: { opacity: '0' },    to: { opacity: '1' } },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(24px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.85)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        'skeleton-sweep': {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition:  '400px 0' },
        },
        'combat-flash': {
          '0%':   { boxShadow: '0 0 0 0 rgba(124,58,237,0)',    transform: 'scale(1)' },
          '30%':  { boxShadow: '0 0 0 4px rgba(124,58,237,0.85)', transform: 'scale(1.013)' },
          '100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0)',    transform: 'scale(1)' },
        },
        'combat-pr-flash': {
          '0%':   { boxShadow: '0 0 0 0 rgba(245,158,11,0)',    transform: 'scale(1)' },
          '30%':  { boxShadow: '0 0 0 5px rgba(245,158,11,0.9)', transform: 'scale(1.018)' },
          '100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0)',    transform: 'scale(1)' },
        },
        'damage-text': {
          '0%':   { transform: 'translateY(0) scale(1)',         opacity: '1' },
          '60%':  { transform: 'translateY(-32px) scale(1.2)',   opacity: '1' },
          '100%': { transform: 'translateY(-52px) scale(0.8)',   opacity: '0' },
        },
        'particle-burst': {
          '0%':   { transform: 'translate(0,0) scale(1)',                    opacity: '1' },
          '100%': { transform: 'translate(var(--tx),var(--ty)) scale(0.2)', opacity: '0' },
        },
        'radar-pulse': {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.6' },
        },
        'number-pop': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.22)' },
          '100%': { transform: 'scale(1)' },
        },
        'xp-fill':   { from: { width: '0%' }, to: { width: 'var(--xp-width)' } },
        'stat-fill': { from: { width: '0%' }, to: { width: 'var(--stat-width)' } },
        'bounce-soft': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
      },

      borderRadius: { '4xl': '2rem' },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      screens: { xs: '390px' },
    },
  },
  plugins: [],
}
