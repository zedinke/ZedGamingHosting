/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../libs/ui-kit/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic Colors (2025 Modern Design)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: {
          DEFAULT: 'hsl(var(--background))',
          primary: 'var(--color-bg-app)',
          secondary: 'var(--color-bg-surface)',
          tertiary: 'var(--color-bg-card)',
          elevated: 'var(--color-bg-elevated)',
        },
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          DEFAULT: 'var(--color-danger)',
          500: '#ef4444',
          600: '#dc2626',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        text: {
          primary: 'var(--color-text-main)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-muted)',
          disabled: 'var(--color-text-disabled)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'var(--font-mono)', 'Monaco', 'monospace'],
      },
      fontSize: {
        // Fluid Typography Scale
        xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
        lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.5rem)',
        xl: 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
        '2xl': 'clamp(2rem, 1.7rem + 1.5vw, 3rem)',
        '3xl': 'clamp(2.5rem, 2rem + 2.5vw, 4.5rem)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'glass': 'var(--radius-lg)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(14, 165, 233, 0.3)',
        'glow-lg': '0 0 40px rgba(14, 165, 233, 0.2)',
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
  ],
};


