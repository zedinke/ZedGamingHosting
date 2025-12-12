'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../stores/auth-store';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Login endpoint expects form-data (email, password) via LocalStrategy
      const formData = new URLSearchParams();
      formData.append('email', email);
      formData.append('password', password);

      // Use relative URL for API in production, or env var for development
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
      const apiBase = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const data = await response.json();
      
      // Store tokens and user info
      login(data.accessToken, data.refreshToken, data.user);
      
      // Redirect to dashboard (with locale)
      const locale = window.location.pathname.split('/')[1] || 'hu';
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--color-bg-app)' }}>
      <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
        <div className="rounded-xl p-8 shadow-2xl" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-main)' }}>ZedGamingHosting</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('subtitle') || 'Sign in to your account'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-main)' }}>
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-main)',
                  fontSize: 'var(--text-sm)',
                }}
                placeholder={t('emailPlaceholder') || 'email@example.com'}
                disabled={loading}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 3px var(--color-primary-glow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-main)' }}>
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-main)',
                  fontSize: 'var(--text-sm)',
                }}
                placeholder={t('passwordPlaceholder') || '••••••••'}
                disabled={loading}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 3px var(--color-primary-glow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded focus:ring-2"
                  style={{
                    accentColor: 'var(--color-primary)',
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                />
                <span className="ml-2" style={{ color: 'var(--color-text-muted)' }}>{t('rememberMe') || 'Remember me'}</span>
              </label>
              <a href="/forgot-password" className="transition-colors hover:underline" style={{ color: 'var(--color-primary)' }}>
                {t('forgotPassword')}
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: loading ? 'var(--color-muted)' : 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
                boxShadow: loading ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                marginTop: '1rem',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                  e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(0, 0, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.3)';
                }
              }}
            >
              {loading ? (t('loggingIn') || 'Logging in...') : t('submit')}
            </button>
          </form>

          <div className="mt-5 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <p>
              {t('noAccount') || "Don't have an account?"}{' '}
              <a href="/register" className="transition-colors hover:underline" style={{ color: 'var(--color-primary)' }}>
                {t('signUp') || 'Sign up'}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

