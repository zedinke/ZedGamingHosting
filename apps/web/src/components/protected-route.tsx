'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../stores/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give zustand a moment to hydrate from localStorage
    const timer = setTimeout(() => {
      setIsChecking(false);
      if (!isAuthenticated) {
        // Get locale from pathname
        const locale = pathname.split('/')[1] || 'hu';
        router.push(`/${locale}/login`);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router, pathname]);

  if (isChecking || !isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-app, #0f172a)' }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: 'var(--color-primary, #6366f1)' }}
          ></div>
          <p 
            className="mt-4"
            style={{ color: 'var(--color-text-muted, #9ca3af)' }}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

