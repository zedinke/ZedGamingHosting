import { JetBrains_Mono, Inter } from 'next/font/google';
import localFont from 'next/font/local';

// Geist Sans - Vercel's modern sans-serif font (Variable Font)
// Fallback to Inter if Geist files are not available
export const geistSans = localFont({
  src: [
    {
      path: '../../public/fonts/GeistVF.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-geist-sans',
  display: 'swap',
  fallback: ['Inter', 'system-ui', 'sans-serif'],
  preload: true,
});

// Inter as fallback (if Geist is not available)
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: false, // Only load if Geist fails
});

// JetBrains Mono - Modern monospace font (Variable Font)
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  fallback: ['Monaco', 'Courier New', 'monospace'],
  preload: true,
});

