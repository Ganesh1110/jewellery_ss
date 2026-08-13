import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * SSS Design Token System
 * -----------------------------------------------------------------
 * One source of truth shared by the customer storefront and the
 * admin console. Customer uses the editorial end of the scale; the
 * admin console applies a denser rhythm (see `.admin-console` in
 * globals.css) using the *same* color / type / radius / shadow
 * tokens — not a second palette.
 */

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ---- Brand: Akiiko warm ivory / charcoal --------------------
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
        cream: {
          50: '#FAF8F5',
          100: '#F7F4EF',
          200: '#F0EBE1',
          300: '#E5DDCF',
          400: '#D4C9B8',
          500: '#C2B49F',
        },
        gold: {
          50: '#FBF7F4',
          100: '#F5ECE5',
          200: '#E9D6C7',
          300: '#D5B7A0',
          400: '#B58E72',
          500: '#977257',
          600: '#846147',
          700: '#6D4E37',
          800: '#563C29',
        },

        // ---- Semantic surfaces (aliases over the brand palette) -----
        canvas: '#FAF8F5',
        surface: '#FFFFFF',
        sunken: '#F4F1EA',
        ink: '#1A1815',
        faint: '#A8A095',

        // ---- Status (desaturated warm pastels — muted, non-neon) ----
        status: {
          ok: {
            bg: '#EDF3EC',
            text: '#346538',
            border: 'rgba(52, 101, 56, 0.22)',
          },
          warn: {
            bg: '#FBF3DB',
            text: '#956400',
            border: 'rgba(149, 100, 0, 0.24)',
          },
          danger: {
            bg: '#FDEBEC',
            text: '#9F2F2D',
            border: 'rgba(159, 47, 45, 0.22)',
          },
          info: {
            bg: '#E1F3FE',
            text: '#1F6C9F',
            border: 'rgba(31, 108, 159, 0.24)',
          },
        },
      },

      fontFamily: {
        heading: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Instrument Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        // ---- Editorial display scale (customer) ---------------------
        'display-xl': ['clamp(3.2rem, 7vw, 5.5rem)', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.4rem, 5vw, 3.8rem)', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.8rem, 3.5vw, 2.75rem)', { lineHeight: '1.18', letterSpacing: '-0.01em' }],
        'display-sm': ['clamp(1.4rem, 2.5vw, 2rem)', { lineHeight: '1.25', letterSpacing: '0' }],
        'heading-lg': ['1.65rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-md': ['1.3rem', { lineHeight: '1.35', letterSpacing: '0' }],
        'heading-sm': ['1.1rem', { lineHeight: '1.4', letterSpacing: '0' }],
        'body-lg': ['1.1rem', { lineHeight: '1.7' }],
        body: ['0.95rem', { lineHeight: '1.65' }],
        'body-sm': ['0.85rem', { lineHeight: '1.6' }],
        caption: ['0.72rem', { lineHeight: '1.5', letterSpacing: '0.08em' }],
        overline: ['0.68rem', { lineHeight: '1.5', letterSpacing: '0.18em' }],

        // ---- Dense admin scale (table + form + meta) ----------------
        'table': ['0.875rem', { lineHeight: '1.45' }],
        'table-sm': ['0.8125rem', { lineHeight: '1.45' }],
        'meta': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'meta-xs': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.04em' }],
      },

      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1600px',
      },

      maxWidth: {
        'container-2xl': '1380px',
        'container-wide': '1680px',
        prose: '65ch',
      },

      borderRadius: {
        none: '0',
        sm: '3px',
        DEFAULT: '5px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },

      boxShadow: {
        // Hairline-adjacent, ultra-diffuse near-zero opacity shadows
        hairline: '0 0 0 1px rgba(17,16,14,0.04)',
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 12px -2px rgb(0 0 0 / 0.05)',
        medium: '0 2px 6px -1px rgb(0 0 0 / 0.04), 0 12px 24px -4px rgb(0 0 0 / 0.06)',
        strong: '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 20px 40px -8px rgb(0 0 0 / 0.12)',
      },

      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      transitionDuration: {
        fast: '150ms',
        DEFAULT: '250ms',
        normal: '250ms',
        slower: '700ms',
      },

      zIndex: {
        sticky: '30',
        header: '50',
        drawer: '50',
        overlay: '100',
        lightbox: '100',
        toast: '120',
      },

      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
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
  plugins: [typography],
};

export default config;