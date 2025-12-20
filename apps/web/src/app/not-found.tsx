'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NotFound() {
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
          color: '#3b82f6', 
          marginBottom: '1rem' 
        }}>404</h1>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: '600', 
          color: '#e2e8f0', 
          marginBottom: '1rem' 
        }}>
          Az oldal nem található
        </h2>
        <p style={{ 
          color: '#94a3b8', 
          marginBottom: '2rem' 
        }}>
          A keresett oldal nem létezik vagy át lett helyezve.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            transition: 'background 0.2s'
          }}
        >
          Vissza a főoldalra
        </a>
      </div>
    </div>
  );
}
