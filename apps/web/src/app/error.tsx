'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-app px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-error-500 mb-4">Hiba</h1>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Valami hiba történt
        </h2>
        <p className="text-text-muted mb-8">
          {error.message || 'Ismeretlen hiba történt'}
        </p>
        <button
          onClick={reset}
          className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
