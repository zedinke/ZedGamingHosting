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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      padding: '1rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ 
          fontSize: '6rem', 
          fontWeight: 'bold', 
          color: '#ef4444', 
          marginBottom: '1rem' 
        }}>Hiba</h1>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: '600', 
          color: '#e2e8f0', 
          marginBottom: '1rem' 
        }}>
          Valami hiba történt
        </h2>
        <p style={{ 
          color: '#94a3b8', 
          marginBottom: '2rem' 
        }}>
          {error.message || 'Ismeretlen hiba történt'}
        </p>
        <button
          onClick={reset}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
