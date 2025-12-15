import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-app">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Az oldal nem található
        </h2>
        <p className="text-text-muted mb-8">
          A keresett oldal nem létezik vagy át lett helyezve.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          Vissza a főoldalra
        </Link>
      </div>
    </div>
  );
}
