"use client";

import { useEffect, useState } from 'react';
import { useRouter } from '../i18n/routing';

export function BackButton({
  fallbackHref,
  label = 'Vissza',
  className = '',
}: {
  fallbackHref?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Heurisztika: ha van history, próbáljuk a back-et
    setCanGoBack(typeof window !== 'undefined' && window.history.length > 1);
  }, []);

  return (
    <button
      type="button"
      onClick={() => (canGoBack ? router.back() : fallbackHref ? router.push(fallbackHref) : router.push('/dashboard'))}
      className={
        className ||
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm hover:bg-[var(--color-bg-elevated)]'
      }
      style={{
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-main)',
      }}
    >
      ← {label}
    </button>
  );
}
