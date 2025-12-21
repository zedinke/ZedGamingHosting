'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@i18n/translations';
import { Input } from '@zed-hosting/ui-kit';

export default function RegisterPage({ params }: { params: { locale?: string } }) {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const locale = params?.locale && ['hu', 'en'].includes(params.locale) ? params.locale : 'hu';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(locale === 'hu' ? 'A jelszavak nem egyeznek.' : 'Passwords do not match.');
      return;
    }
    if (!email || !password) {
      setError(locale === 'hu' ? 'E-mail és jelszó szükséges.' : 'Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
      const apiBase = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');

      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName: displayName || undefined }),
        credentials: 'include',
      });

      if (!res.ok) {
        let msg = locale === 'hu' ? 'Regisztráció sikertelen.' : 'Registration failed.';
        try {
          const errData = await res.json();
          if (Array.isArray(errData.message)) {
            msg = errData.message[0] || msg;
          } else if (errData.message) {
            msg = errData.message;
          } else if (errData.error) {
            msg = errData.error;
          }
        } catch {}
        throw new Error(msg);
      }

      // On success, redirect to login
      router.push(`/${locale}/login`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || (locale === 'hu' ? 'Ismeretlen hiba történt.' : 'Unknown error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-4">
          {t('title') || (locale === 'hu' ? 'Regisztráció' : 'Sign Up')}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {t('subtitle') || (locale === 'hu' ? 'Hozz létre új fiókot.' : 'Create a new account.')}
        </p>

        {error && (
          <div className="mb-4 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">{t('email') || (locale === 'hu' ? 'E-mail cím' : 'Email address')}</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('displayName') || (locale === 'hu' ? 'Megjelenített név (opcionális)' : 'Display name (optional)')}</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={locale === 'hu' ? 'Pl. Játékos' : 'e.g., Player'} />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('password') || (locale === 'hu' ? 'Jelszó' : 'Password')}</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="********" />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('confirmPassword') || (locale === 'hu' ? 'Jelszó megerősítése' : 'Confirm password')}</label>
            <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="********" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-lg font-medium"
          >
            {loading
              ? (t('submitting') || (locale === 'hu' ? 'Feldolgozás...' : 'Submitting...'))
              : (t('submit') || (locale === 'hu' ? 'Regisztrálok' : 'Sign Up'))}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-400">
          <a href={`/${locale}/login`} className="text-blue-400 hover:text-blue-300">
            {t('backToLogin') || (locale === 'hu' ? 'Vissza a bejelentkezéshez' : 'Back to login')}
          </a>
        </div>
      </div>
    </div>
  );
}
