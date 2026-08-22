import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Canvas & Surfaces
        linen: {
          DEFAULT: '#FBF9F6',
          50: '#FEFDFB',
          100: '#FBF9F6',
          200: '#F5F0E8',
          300: '#EFEBE4',
          400: '#E5DDD1',
          500: '#D9CEBC',
        },
        // Sidebar / Dark panels
        ink: {
          DEFAULT: '#121314',
          50: '#2A2C2F',
          100: '#1E2022',
          200: '#121314',
          300: '#0A0B0C',
        },
        // Primary accent — Terracotta Rust
        terracotta: {
          DEFAULT: '#BC5E3E',
          50: '#F8EDE8',
          100: '#F0D4C7',
          200: '#E2A98F',
          300: '#D47E58',
          400: '#C96645',
          500: '#BC5E3E',
          600: '#A34E32',
          700: '#8A3F27',
          800: '#71301C',
          900: '#582211',
        },
        // Supporting — Muted Olive Sage
        sage: {
          DEFAULT: '#5F6B5F',
          50: '#EEF0EE',
          100: '#D3D9D3',
          200: '#A8B3A8',
          300: '#7D8D7D',
          400: '#6A796A',
          500: '#5F6B5F',
          600: '#4E5A4E',
          700: '#3D473D',
          800: '#2C342C',
          900: '#1B211B',
        },
        // Warm Ochre / Gold — warnings
        ochre: {
          DEFAULT: '#D1A153',
          50: '#FBF4E6',
          100: '#F5E3BE',
          200: '#E9C87A',
          300: '#DDB163',
          400: '#D1A153',
          500: '#C08A3A',
          600: '#A57330',
          700: '#8A5C26',
          800: '#6F451C',
          900: '#542E12',
        },
        // Dusty Rose — over-budget alerts
        dusty: {
          DEFAULT: '#A34C48',
          50: '#F7EEED',
          100: '#EDCFCE',
          200: '#D9908E',
          300: '#C5605D',
          400: '#B35250',
          500: '#A34C48',
          600: '#8A3D3A',
          700: '#712E2C',
          800: '#581F1D',
          900: '#3F100E',
        },
        // Sand borders
        sand: {
          DEFAULT: '#EFEBE4',
          100: '#FAF8F4',
          200: '#F5F0E8',
          300: '#EFEBE4',
          400: '#E5DDD1',
          500: '#D9CEBC',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        'full': '9999px',
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(18, 19, 20, 0.04), 0 1px 2px -1px rgba(18, 19, 20, 0.04)',
        'warm': '0 4px 12px -2px rgba(18, 19, 20, 0.06), 0 2px 4px -2px rgba(18, 19, 20, 0.04)',
        'warm-lg': '0 10px 30px -5px rgba(18, 19, 20, 0.10), 0 4px 8px -4px rgba(18, 19, 20, 0.06)',
        'warm-xl': '0 20px 50px -10px rgba(18, 19, 20, 0.14), 0 8px 16px -8px rgba(18, 19, 20, 0.08)',
        'terracotta': '0 4px 20px -4px rgba(188, 94, 62, 0.30)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'pulse-warm': 'pulseWarm 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseWarm: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      backgroundImage: {
        'shimmer-warm': 'linear-gradient(90deg, #F5F0E8 25%, #EFEBE4 50%, #F5F0E8 75%)',
        'hero-gradient': 'linear-gradient(135deg, rgba(18,19,20,0.7) 0%, rgba(18,19,20,0.2) 100%)',
        'terracotta-gradient': 'linear-gradient(135deg, #BC5E3E 0%, #A34E32 100%)',
        'ink-gradient': 'linear-gradient(180deg, #121314 0%, #1E2022 100%)',
      },
      backgroundSize: {
        '200%': '200%',
      },
    },
  },
  plugins: [],
}

export default config
