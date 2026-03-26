/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0a0a0f',
          secondary: '#0f0f1a',
          card: '#13131f',
          border: '#1e1e2e',
        },
        purple: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          glow: 'rgba(139,92,246,0.4)',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          glow: 'rgba(245,158,11,0.4)',
        },
        // Tier colors
        iron: {
          DEFAULT: '#6b7280',
          light: '#9ca3af',
          dark: '#4b5563',
        },
        bronze: {
          DEFAULT: '#92400e',
          light: '#d97706',
          dark: '#78350f',
        },
        silver: {
          DEFAULT: '#64748b',
          light: '#94a3b8',
          dark: '#475569',
        },
        mythic: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
          dark: '#5b21b6',
          glow: 'rgba(124,58,237,0.6)',
        },
        // Discipline colors
        strength: '#ef4444',
        endurance: '#3b82f6',
        power: '#f59e0b',
        speed: '#10b981',
        recovery: '#06b6d4',
        flexibility: '#ec4899',
      },
      fontFamily: {
        display: ['"Cinzel"', 'Palatino Linotype', 'Book Antiqua', 'Palatino', 'serif'],
        body: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'purple-glow': '0 0 20px rgba(139,92,246,0.4), 0 0 40px rgba(139,92,246,0.15)',
        'purple-glow-sm': '0 0 10px rgba(139,92,246,0.3), 0 0 20px rgba(139,92,246,0.1)',
        'gold-glow': '0 0 20px rgba(245,158,11,0.4), 0 0 40px rgba(245,158,11,0.15)',
        'gold-glow-sm': '0 0 10px rgba(245,158,11,0.3), 0 0 20px rgba(245,158,11,0.1)',
        'card-glow': '0 0 0 1px rgba(139,92,246,0.2), 0 4px 24px rgba(0,0,0,0.5)',
        'card-glow-hover':
          '0 0 0 1px rgba(139,92,246,0.4), 0 8px 32px rgba(139,92,246,0.15)',
        'red-glow': '0 0 20px rgba(239,68,68,0.4), 0 0 40px rgba(239,68,68,0.15)',
        'green-glow': '0 0 20px rgba(16,185,129,0.4), 0 0 40px rgba(16,185,129,0.15)',
        inset: 'inset 0 2px 4px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        'gold-gradient': 'linear-gradient(135deg, #f59e0b, #d97706)',
        'dark-gradient': 'linear-gradient(135deg, #0f0f1a, #0a0a0f)',
        'card-gradient': 'linear-gradient(135deg, #13131f, #0f0f1a)',
        'mythic-gradient': 'linear-gradient(135deg, #7c3aed, #ec4899, #f59e0b)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'level-up': 'level-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
        'particle-burst': 'particle-burst 1s ease-out forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139,92,246,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(139,92,246,0.6), 0 0 50px rgba(139,92,246,0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'level-up': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'particle-burst': {
          '0%': { transform: 'translate(0,0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--tx),var(--ty)) scale(0)', opacity: '0' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
