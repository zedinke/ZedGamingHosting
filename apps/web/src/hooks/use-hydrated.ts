'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if persist has rehydrated by checking if the store has been initialized
    const unsubscribe = useAuthStore.subscribe(
      (state) => state.accessToken,
      () => {
        // Force a re-check after state changes
        setHydrated(true);
      }
    );

    // Also set hydrated immediately if already loaded
    const currentToken = useAuthStore.getState().accessToken;
    if (currentToken !== null || typeof window === 'undefined') {
      setHydrated(true);
    } else {
      // Give persist middleware time to rehydrate
      const timer = setTimeout(() => setHydrated(true), 100);
      return () => {
        clearTimeout(timer);
        unsubscribe();
      };
    }

    return () => unsubscribe();
  }, []);

  return hydrated;
}
