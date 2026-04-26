/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef6ff',
          100: '#d9ebff',
          200: '#bbdbff',
          300: '#8ac4ff',
          400: '#52a3ff',
          500: '#2979ff',
          600: '#1558f5',
          700: '#1043e1',
          800: '#1437b6',
          900: '#16338f',
          950: '#111f57',
        },
        surface: {
          DEFAULT: '#0b0f1a',
          card:    '#111827',
          border:  '#1e2a3a',
          hover:   '#1a2436',
        }
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'particle':     'particle 20s linear infinite',
        'fade-in':      'fadeIn 0.4s ease forwards',
        'slide-in':     'slideIn 0.35s ease forwards',
      },
      keyframes: {
        float:    { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn:  { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        particle: { '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: 0 }, '10%': { opacity: 1 }, '90%': { opacity: 1 }, '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: 0 } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
