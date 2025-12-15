import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: [
    './src/**/*.{js,jsx,ts,tsx}',
    '../../libs/ui-kit/src/**/*.{js,jsx,ts,tsx}',
  ],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: {
            50: { value: '#e0f2fe' },
            100: { value: '#cfe8fb' },
            200: { value: '#a5d8f5' },
            300: { value: '#74c5ee' },
            400: { value: '#3cb0e6' },
            500: { value: '#0ea5e9' },
            600: { value: '#0284c7' },
            700: { value: '#0369a1' },
            800: { value: '#064f73' },
            900: { value: '#0c4a6e' },
          },
          success: {
            50: { value: '#ecfdf3' },
            100: { value: '#d1fadf' },
            200: { value: '#a6f0c3' },
            500: { value: '#22c55e' },
            600: { value: '#16a34a' },
            700: { value: '#15803d' },
          },
          warning: {
            50: { value: '#fff7e6' },
            100: { value: '#ffedc2' },
            200: { value: '#ffd98a' },
            500: { value: '#f59e0b' },
            600: { value: '#d97706' },
            700: { value: '#b45309' },
          },
          error: {
            50: { value: '#fff1f1' },
            100: { value: '#ffe0e0' },
            200: { value: '#ffc7c7' },
            500: { value: '#ef4444' },
            600: { value: '#dc2626' },
            700: { value: '#b91c1c' },
          },
          background: {
            app: { value: '#07090f' },
            surface: { value: '#0c111a' },
            card: { value: '#111827' },
            elevated: { value: '#131c2b' },
            hover: { value: '#1c2637' },
          },
          text: {
            primary: { value: '#e8edf5' },
            secondary: { value: '#c4cbd8' },
            muted: { value: '#94a3b8' },
            disabled: { value: '#6b7383' },
          },
          border: {
            DEFAULT: { value: '#1f2a3c' },
            light: { value: '#2c3a52' },
          },
          divider: { value: 'rgba(148, 163, 184, 0.12)' },
        },
        radii: {
          sm: { value: '0.375rem' },
          md: { value: '0.5rem' },
          lg: { value: '0.75rem' },
          xl: { value: '1rem' },
          '2xl': { value: '1.25rem' },
        },
        shadows: {
          xs: { value: '0 1px 2px rgba(0,0,0,0.25)' },
          sm: { value: '0 2px 6px rgba(0,0,0,0.3)' },
          md: { value: '0 6px 16px rgba(0,0,0,0.28)' },
          lg: { value: '0 12px 30px rgba(0,0,0,0.32)' },
          xl: { value: '0 20px 45px rgba(0,0,0,0.35)' },
          glow: { value: '0 0 30px rgba(14,165,233,0.25)' },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: 'src/styled-system',
  
  // JSX framework
  jsxFramework: 'react',
  
  // Emit package
  emitPackage: true,
});

