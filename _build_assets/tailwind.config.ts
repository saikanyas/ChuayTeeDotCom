import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: '#FF3478',
          dark:    '#E0205E',
          light:   '#FF6B9D',
          tint:    '#FFF0F5',
        },
        // Finance semantic
        income:  '#34C759',
        expense: '#FF3D30',
        // Backgrounds
        bg: {
          DEFAULT: '#F7F7F8',
          elevated: '#FFFFFF',
          muted:    '#F2F2F7',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          tint:    '#FFF0F5',
          muted:   '#F2F2F7',
        },
        // Text
        text: {
          primary:   '#1C1C1E',
          second:    '#6C6C70',
          tertiary:  '#8E8E93',
          inverse:   '#FFFFFF',
        },
        // Border
        border: {
          DEFAULT: '#E5E5EA',
          divider: '#F2F2F7',
        },
        // Category icons
        cat: {
          food:      '#FFB800',
          transport: '#5AC8FA',
          shopping:  '#AF52DE',
          entertain: '#FF3478',
          health:    '#FF3D30',
          edu:       '#34C759',
          rent:      '#FF9500',
          phone:     '#5856D6',
          other:     '#8E8E93',
          salary:    '#34C759',
          bonus:     '#FFB800',
          refund:    '#5AC8FA',
        },
      },
      fontFamily: {
        display: ['Prompt', 'sans-serif'],
        body:    ['IBM Plex Sans Thai', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '20px',
        '2xl': '24px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        fab:   '0 4px 16px rgba(255,52,120,0.35)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'scan-line': {
          '0%':   { top: '0%',   opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        'pulse-pink': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,52,120,0.3)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(255,52,120,0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'slide-up':   'slide-up 0.3s ease forwards',
        'scan-line':  'scan-line 1.8s ease-in-out infinite',
        'pulse-pink': 'pulse-pink 2s infinite',
        'fade-in':    'fade-in 0.25s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config
