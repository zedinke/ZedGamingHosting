'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from '@i18n/translations';

export default function VerifyEmailPage({ params }: { params: { locale?: string } }) {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params?.locale && ['hu', 'en'].includes(params.locale) ? params.locale : 'hu';

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage(locale === 'hu' ? 'Hiányzó token.' : 'Missing token.');
      return;
    }

    const verify = async () => {
      setStatus('verifying');
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
        const apiBase = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');
        const res = await fetch(`${apiBase}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || (locale === 'hu' ? 'Érvénytelen vagy lejárt token.' : 'Invalid or expired token.'));
        }
        setStatus('success');
        setMessage(data?.message || (locale === 'hu' ? 'Email cím sikeresen megerősítve.' : 'Email verified successfully.'));
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || (locale === 'hu' ? 'Hiba történt a megerősítés során.' : 'Verification failed.'));
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow-xl text-center">
        <h1 className="text-2xl font-semibold mb-2">{locale === 'hu' ? 'Email megerősítés' : 'Email Verification'}</h1>
        {status === 'verifying' && (
          <p className="text-slate-300">{locale === 'hu' ? 'Megerősítés folyamatban...' : 'Verifying...'}</p>
        )}
        {status !== 'verifying' && (
          <p className="text-slate-300">{message}</p>
        )}
        <div className="mt-4">
          <a href={`/${locale}/login`} className="text-blue-400 hover:text-blue-300">
            {t('backToLogin') || (locale === 'hu' ? 'Vissza a bejelentkezéshez' : 'Back to login')}
          </a>
        </div>
      </div>
    </div>
  );
}
