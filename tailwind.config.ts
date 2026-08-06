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
        // Akiiko Neutral Charcoal Palette
        neutral: {
          50: '#FAF9F6',
          100: '#F4F1EA',
          200: '#EAE6E1',
          300: '#D6D0C7',
          400: '#A8A095',
          500: '#7A7267',
          600: '#5C544A',
          700: '#423B33',
          800: '#2B2621',
          900: '#1A1815',
          950: '#11100E',
        },
        // Akiiko Warm Linen Cream background
        cream: {
          50: '#FAF8F5',
          100: '#F7F4EF',
          200: '#F0EBE1',
          300: '#E5DDCF',
          400: '#D4C9B8',
          500: '#C2B49F',
        },
        // Akiiko Signature Chestnut Brown / Gold accent
        gold: {
          50: '#FBF7F4',
          100: '#F5ECE5',
          200: '#E9D6C7',
          300: '#D5B7A0',
          400: '#B58E72',
          500: '#977257', // Primary Akiiko Chestnut Brown
          600: '#846147',
          700: '#6D4E37',
          800: '#563C29',
        },
      },
      fontFamily: {
        heading: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3.2rem, 7vw, 5.5rem)', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.4rem, 5vw, 3.8rem)', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.8rem, 3.5vw, 2.75rem)', { lineHeight: '1.18', letterSpacing: '-0.01em' }],
        'display-sm': ['clamp(1.4rem, 2.5vw, 2rem)', { lineHeight: '1.25', letterSpacing: '0' }],
        'heading-lg': ['1.65rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-md': ['1.3rem', { lineHeight: '1.35', letterSpacing: '0' }],
        'heading-sm': ['1.1rem', { lineHeight: '1.4', letterSpacing: '0' }],
        'body-lg': ['1.1rem', { lineHeight: '1.7' }],
        'body': ['0.95rem', { lineHeight: '1.65' }],
        'body-sm': ['0.85rem', { lineHeight: '1.6' }],
        'caption': ['0.72rem', { lineHeight: '1.5', letterSpacing: '0.08em' }],
        'overline': ['0.68rem', { lineHeight: '1.5', letterSpacing: '0.18em' }],
      },
      maxWidth: {
        'container-2xl': '1380px',
        'prose': '65ch',
      },
      borderRadius: {
        'none': '0',
        'sm': '3px',
        'DEFAULT': '5px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'soft': '0 4px 12px -2px rgb(0 0 0 / 0.05), 0 2px 6px -1px rgb(0 0 0 / 0.03)',
        'medium': '0 8px 24px -4px rgb(0 0 0 / 0.08), 0 4px 12px -2px rgb(0 0 0 / 0.04)',
        'strong': '0 16px 40px -8px rgb(0 0 0 / 0.12), 0 8px 20px -4px rgb(0 0 0 / 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;