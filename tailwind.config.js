/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        golf: {
          dark:   '#0a1a0a',
          darker: '#0d1117',
          green:  '#1a3a1a',
          mid:    '#2a4a2a',
          light:  '#3a5a3a',
        },
        gold: {
          DEFAULT: '#FFD700',
          dark:    '#b8860b',
          muted:   '#a07820',
          pale:    '#f5d060',
        },
        'team-a': {
          DEFAULT: '#22c55e',
          light:   '#4ade80',
          bg:      'rgba(34,197,94,0.15)',
        },
        'team-b': {
          DEFAULT: '#3b82f6',
          light:   '#60a5fa',
          bg:      'rgba(59,130,246,0.15)',
        },
        score: {
          eagle:  '#FFD700',
          birdie: '#4CAF50',
          par:    '#94a3b8',
          bogey:  '#e88c4f',
          double: '#e85d5d',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-gold':  'linear-gradient(135deg, #FFD700, #b8860b)',
        'gradient-green': 'linear-gradient(135deg, #1a3a1a, #0a1a0a)',
        'gradient-dark':  'linear-gradient(180deg, #0a1a0a, #0d1117)',
      },
      keyframes: {
        'slide-down': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,215,0,0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(255,215,0,0)' },
        },
      },
      animation: {
        'slide-down':  'slide-down 0.35s ease-out',
        'fade-in':     'fade-in 0.25s ease-out',
        'pulse-gold':  'pulse-gold 2s infinite',
      },
    },
  },
  plugins: [],
}
