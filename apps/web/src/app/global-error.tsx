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
        <div className="min-h-screen flex items-center justify-center bg-background-app px-4">
          <div className="text-center max-w-md">
            <h1 className="text-6xl font-bold text-error-500 mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              Szerverhiba
            </h2>
            <p className="text-text-muted mb-8">
              Váratlan hiba történt a szerveren.
            </p>
            <button
              onClick={reset}
              className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Újrapróbálás
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
