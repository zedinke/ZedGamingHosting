'use client';

import { useTheme } from '../lib/theme-provider';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@zed-hosting/ui-kit';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Váltás világos módra' : 'Váltás sötét módra'}
      title={theme === 'dark' ? 'Váltás világos módra' : 'Váltás sötét módra'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

