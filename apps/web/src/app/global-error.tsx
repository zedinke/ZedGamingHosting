'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
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
            }}>500</h1>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: '600', 
              color: '#e2e8f0', 
              marginBottom: '1rem' 
            }}>
              Szerverhiba
            </h2>
            <p style={{ 
              color: '#94a3b8', 
              marginBottom: '2rem' 
            }}>
              Váratlan hiba történt a szerveren.
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
      </body>
    </html>
  );
}
