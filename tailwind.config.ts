import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Akiiko/Aarvee Neutral Palette
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Warm Milk background
        cream: {
          50: '#FDFBF7',
          100: '#FBF9F6',
          200: '#F5F1EB',
          300: '#ECE5D9',
          400: '#E0D6C2',
          500: '#D1C3A6',
        },
        // Accent gold for CTAs
        gold: {
          50: '#FBF7EF',
          100: '#F5ECD9',
          200: '#EBD9B8',
          300: '#DDBF8F',
          400: '#C9A876',
          500: '#B8956A',
          600: '#A6835E',
          700: '#8F6E4E',
        },
      },
      fontFamily: {
        // Serif for headings - Cormorant Garamond / Playfair Display
        heading: ['var(--font-cormorant)', 'Georgia', 'serif'],
        // Sans for body - Inter / Montserrat
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Editorial scale
        'display-xl': ['clamp(3.5rem, 8vw, 6rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-sm': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '0' }],
        'heading-lg': ['1.75rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-md': ['1.375rem', { lineHeight: '1.35', letterSpacing: '0' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
        'body': ['1rem', { lineHeight: '1.65' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],
        'caption': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.05em' }],
        'overline': ['0.7rem', { lineHeight: '1.5', letterSpacing: '0.15em' }],
      },
      spacing: {
        // 4px base scale with editorial spacing
        'space-px': '1px',
        '0': '0',
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        '7': '1.75rem',   // 28px
        '8': '2rem',      // 32px
        '9': '2.25rem',   // 36px
        '10': '2.5rem',   // 40px
        '11': '2.75rem',  // 44px
        '12': '3rem',     // 48px
        '14': '3.5rem',   // 56px
        '16': '4rem',     // 64px
        '20': '5rem',     // 80px
        '24': '6rem',     // 96px
        '28': '7rem',     // 112px
        '32': '8rem',     // 128px
        '36': '9rem',     // 144px
        '40': '10rem',    // 160px
        '48': '12rem',    // 192px
        '56': '14rem',    // 224px
        '64': '16rem',    // 256px
      },
      maxWidth: {
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1440px',
        'prose': '65ch',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 1px rgb(0 0 0 / 0.05)',
        'soft': '0 2px 8px -2px rgb(0 0 0 / 0.06), 0 4px 16px -4px rgb(0 0 0 / 0.08)',
        'medium': '0 4px 16px -4px rgb(0 0 0 / 0.08), 0 8px 32px -8px rgb(0 0 0 / 0.1)',
        'strong': '0 8px 32px -8px rgb(0 0 0 / 0.12), 0 16px 48px -16px rgb(0 0 0 / 0.15)',
        'inner-subtle': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.03)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
        'slower': '500ms',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'hero-zoom': 'heroZoom 7s ease-out',
      },
      keyframes: {
        heroZoom: {
          '0%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1.12)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.ease-out-expo': { 'transition-timing-function': 'cubic-bezier(0.16, 1, 0.3, 1)' },
        '.ease-in-out-expo': { 'transition-timing-function': 'cubic-bezier(0.87, 0, 0.13, 1)' },
      });
    },
  ],
};

export default config;