/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--ui-background) / <alpha-value>)',
        foreground: 'rgb(var(--ui-foreground) / <alpha-value>)',
        'card-foreground': 'rgb(var(--ui-foreground) / <alpha-value>)',
        'popover-foreground': 'rgb(var(--ui-foreground) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--ui-foreground) / <alpha-value>)',
        destructive: { DEFAULT: '#dc2626', foreground: '#ffffff' },
        card: 'rgb(var(--ui-card) / <alpha-value>)',
        popover: 'rgb(var(--ui-popover) / <alpha-value>)',
        muted: { DEFAULT: 'rgb(var(--ui-muted) / <alpha-value>)', foreground: 'rgb(var(--ui-muted-foreground) / <alpha-value>)' },
        accent: 'rgb(var(--ui-accent) / <alpha-value>)',
        border: 'rgb(var(--ui-border) / <alpha-value>)',
        input: 'rgb(var(--ui-border) / <alpha-value>)',
        ring: 'rgb(var(--ui-primary) / <alpha-value>)',
        brand: 'rgb(var(--ui-primary) / <alpha-value>)',
        primary: {
          foreground: '#ffffff',
          DEFAULT: 'var(--color-primary)',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: 'var(--color-primary)',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        secondary: {
          foreground: '#ffffff',
          DEFAULT: 'var(--color-secondary)',
          600: 'var(--color-secondary)',
        },
        gray: {
          50: '#fafafa', 100: '#f1f3f7', 200: '#e1e4eb', 300: '#cbd0da',
          400: '#a0a8b7', 500: '#727a89', 600: '#444b59', 700: '#2b303b',
          800: '#181b23', 900: '#0b0d12', 950: '#07090d',
          750: '#2d3748',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'loading-bar': 'loadingBar 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        loadingBar: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}

