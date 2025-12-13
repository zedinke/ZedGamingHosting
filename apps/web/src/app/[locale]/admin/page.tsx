'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'hu';

  useEffect(() => {
    // Redirect to dashboard
    router.replace(`/${locale}/dashboard`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-app)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}

