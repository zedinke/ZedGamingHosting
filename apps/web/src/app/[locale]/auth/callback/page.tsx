'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from '@i18n/translations';

// Force Next.js to include this route in the build
export const dynamic = 'force-dynamic';

export default function SocialAuthCallbackPage({ params }: { params: { locale?: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.social');
  const locale = params?.locale && ['hu', 'en'].includes(params.locale) ? params.locale : 'hu';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we only run on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ensure we only run on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Dynamic import to avoid SSR issues
    import('../../../../stores/auth-store').then(({ useAuthStore }) => {
      const { login } = useAuthStore.getState();

      const fragmentParams = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
        : new URLSearchParams();

      const accessToken = fragmentParams.get('accessToken') || searchParams.get('accessToken');
      const refreshToken = fragmentParams.get('refreshToken') || searchParams.get('refreshToken');
      const userId = fragmentParams.get('userId') || undefined;
      const email = fragmentParams.get('email') || undefined;
      const role = (fragmentParams.get('role') || 'USER') as string;
      const tenantId = fragmentParams.get('tenantId') || undefined;
      const provider = searchParams.get('provider') || fragmentParams.get('provider') || 'social';

      const twoFactor = searchParams.get('twoFactor');
      const tempToken = searchParams.get('tempToken');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(decodeURIComponent(error));
        return;
      }

      if (twoFactor === '1' && tempToken) {
        const loginUrl = `/${locale}/login?twoFactor=1&tempToken=${encodeURIComponent(tempToken)}${
          email ? `&email=${encodeURIComponent(email)}` : ''
        }&provider=${encodeURIComponent(provider)}`;
        router.replace(loginUrl);
        return;
      }

      if (accessToken && refreshToken && email && userId) {
        login(accessToken, refreshToken, {
          id: userId,
          email,
          role,
          tenantId: tenantId || undefined,
        });
        setStatus('success');
        setMessage(t('success') || 'Sikeres bejelentkezés, átirányítás...');
        const target = searchParams.get('redirect') || `/${locale}/dashboard`;
        setTimeout(() => router.replace(target), 400);
        return;
      }

      setStatus('error');
      setMessage(t('missingTokens') || 'Nem sikerült a tokeneket feldolgozni. Próbáld újra.');
    });
  }, [isMounted, locale, router, searchParams, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-xl text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-200">{t('processing') || 'Bejelentkezés feldolgozása...'}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="h-10 w-10 rounded-full bg-green-500/20 border border-green-400 text-green-300 flex items-center justify-center mx-auto mb-4">
              ✓
            </div>
            <p className="text-slate-200">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-10 w-10 rounded-full bg-red-500/20 border border-red-400 text-red-300 flex items-center justify-center mx-auto mb-4">
              !
            </div>
            <p className="text-slate-200 mb-2">{message}</p>
            <button
              onClick={() => router.replace(`/${locale}/login`)}
              className="mt-2 inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
            >
              {t('backToLogin') || 'Vissza a bejelentkezéshez'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
