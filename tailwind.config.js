/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Accent themeable (CSS var: teal dark / rouge light) ──────────
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          hover:   'rgb(var(--accent-hover-rgb) / <alpha-value>)',
          light:   'rgb(var(--accent-light-rgb) / <alpha-value>)',
        },
        // ── Dark palette ──────────────────────────────────────────────────
        dark: {
          bg:     '#0A0B10',
          card:   '#14151E',
          border: '#252637',
          hover:  '#1E1F2E',
        },
      },
      animation: {
        'progress-fill': 'progress-fill 1.5s ease-out forwards',
        'fade-up':       'fade-up 0.6s ease-out forwards',
        'pulse-accent':  'pulse-accent 2s ease-in-out infinite',
      },
      keyframes: {
        'progress-fill': {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-accent': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--accent-rgb) / 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgb(var(--accent-rgb) / 0)' },
        },
      },
    },
  },
  plugins: [],
}
