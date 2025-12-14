'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../../stores/auth-store';
import { Navigation } from '../../../../components/navigation';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';

export default function ChangePasswordPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { isAuthenticated, accessToken } = useAuthStore();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setIsHydrated(true);
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isHydrated, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Az új jelszavak nem egyeznek');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Az új jelszónak legalább 8 karakter hosszúnak kell lennie');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      setSuccess(true);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        router.push(`/${locale}/profile`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Jelszó változtatás sikertelen');
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen" style={{ 
        backgroundColor: '#0a0a0a', 
        background: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), #0a0a0a',
        color: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Jelszó Változtatása</h1>
            <p style={{ color: '#cbd5e1' }}>
              Új jelszó beállítása a fiókodhoz
            </p>
          </header>

          <Card className="glass elevation-2 p-6 max-w-md mx-auto">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold mb-2" style={{ color: '#10b981' }}>
                  Jelszó sikeresen megváltoztatva!
                </p>
                <p className="text-sm" style={{ color: '#cbd5e1' }}>
                  Átirányítás a profil oldalra...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Jelenlegi jelszó *
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Új jelszó *
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, newPassword: e.target.value });
                      if (fieldErrors.newPassword) {
                        setFieldErrors({ ...fieldErrors, newPassword: '' });
                      }
                    }}
                    required
                    minLength={8}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      fieldErrors.newPassword ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: fieldErrors.newPassword ? '#ef4444' : 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
                    Legalább 8 karakter
                  </p>
                  {fieldErrors.newPassword && (
                    <p className="text-sm mt-1 text-red-400">{fieldErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Új jelszó megerősítése *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                      }
                    }}
                    required
                    minLength={8}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      fieldErrors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: fieldErrors.confirmPassword ? '#ef4444' : 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm mt-1 text-red-400">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Mentés...' : 'Jelszó Módosítása'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/${locale}/profile`)}
                    disabled={loading}
                  >
                    Mégse
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}

