import type { Config } from 'tailwindcss';

/**
 * Nayacura's palette is intentionally strict. The default Tailwind spectrum is
 * replaced rather than extended so blue, orange, yellow and green cannot enter
 * the product accidentally through a stock utility class.
 */
const config: Config = {
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{ts,tsx}'],
  },
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      black: '#000000',
      white: '#FFFFFF',
      midnight: '#09060F',
      plum: '#190D23',
      royal: '#6E35A4',
      burgundy: '#571A37',
      rose: '#E8A0B7',
      lavender: '#C9A7F5',
      ivory: '#F8F2F6',
      mauve: '#A78BA8',
    },
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 80px rgba(201,167,245,0.16)',
        rose: '0 20px 80px -24px rgba(232,160,183,0.35)',
        card: '0 24px 80px -36px rgba(0,0,0,0.85)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(circle at 60% 42%, rgba(110,53,164,0.36) 0%, rgba(87,26,55,0.22) 34%, rgba(9,6,15,0) 70%)',
        'rose-glow':
          'radial-gradient(circle at 50% 0%, rgba(232,160,183,0.16), transparent 62%)',
        'lavender-line':
          'linear-gradient(90deg, transparent, rgba(201,167,245,0.55), transparent)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-14px,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.06)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        gradientBorder: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-soft': 'pulseSoft 6s ease-in-out infinite',
        orbit: 'orbit 28s linear infinite',
        marquee: 'marquee 38s linear infinite',
        'gradient-border': 'gradientBorder 8s ease infinite',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
