'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../stores/auth-store';
import { Button } from '@zed-hosting/ui-kit';
import { Input } from '@zed-hosting/ui-kit';

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
      const formData = new URLSearchParams();
      formData.append('email', email);
      formData.append('password', password);

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
      
      login(data.accessToken, data.refreshToken, data.user);
      
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
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] mb-4 shadow-lg shadow-[var(--color-primary-glow)]">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>
            ZedGamingHosting
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('subtitle') || 'Sign in to your account'}
          </p>
        </div>

        {/* Login Card */}
        <div 
          className="rounded-2xl p-8 border shadow-xl"
          style={{ 
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div 
                className="rounded-lg p-4 text-sm border"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger-light)'
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium"
                style={{ color: 'var(--color-text-main)' }}
              >
                {t('email')}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder') || 'email@example.com'}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium"
                style={{ color: 'var(--color-text-main)' }}
              >
                {t('password')}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder') || '••••••••'}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border transition-colors cursor-pointer"
                  style={{
                    accentColor: 'var(--color-primary)',
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                />
                <span 
                  className="ml-2 transition-colors group-hover:text-[var(--color-text-main)]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t('rememberMe') || 'Remember me'}
                </span>
              </label>
              <a 
                href="/forgot-password" 
                className="transition-colors hover:underline font-medium"
                style={{ color: 'var(--color-primary)' }}
              >
                {t('forgotPassword')}
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (t('loggingIn') || 'Logging in...') : t('submit')}
            </Button>
          </form>

          <div 
            className="mt-6 text-center text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <p>
              {t('noAccount') || "Don't have an account?"}{' '}
              <a 
                href="/register" 
                className="font-medium transition-colors hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                {t('signUp') || 'Sign up'}
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p 
          className="mt-8 text-center text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          © {new Date().getFullYear()} ZedGamingHosting. All rights reserved.
        </p>
      </div>
    </div>
  );
}
