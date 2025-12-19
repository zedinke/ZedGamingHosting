'use client';

import { useEffect } from 'react';
import { errorLogger } from '../lib/error-logger';

/**
 * Error Logger Initializer
 * Initializes the error logging service on app startup
 */
export function ErrorLoggerInitializer() {
  useEffect(() => {
     if (typeof window === 'undefined') return;
   
    // Initialize error logger
    console.log('✅ Error logger initialized');

    // Flush logs on page unload
    const handleBeforeUnload = async () => {
      await errorLogger.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
}
