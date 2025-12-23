import { JetBrains_Mono, Inter } from 'next/font/google';

// Inter - Primary sans-serif font (Google Fonts)
// This is the main font, Geist can be added later if needed
export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-geist-sans', // Using same variable name for compatibility
  display: 'swap',
  preload: true,
});

// Geist Sans - Vercel's modern sans-serif font (Variable Font)
// Optional: Only loads if font file exists in public/fonts/
// For now, we use Inter as the primary font
export const geistSans = inter; // Use Inter as Geist for now

// JetBrains Mono - Modern monospace font (Variable Font)
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  fallback: ['Monaco', 'Courier New', 'monospace'],
  preload: true,
});

