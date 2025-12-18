'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../../stores/auth-store';
import { Navigation } from '../../../../../components/navigation';
import { BackButton } from '../../../../../components/back-button';
import { Card, Button } from '@zed-hosting/ui-kit';
import { useNotificationContext } from '../../../../../context/notification-context';
import { apiClient } from '../../../../../lib/api-client';

export default function CreateUserPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const locale = (params?.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    balance: 0,
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
      return;
    }

    const userRole = currentUser?.role?.toUpperCase();
    if (isHydrated && isAuthenticated && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [isAuthenticated, isHydrated, currentUser, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('A jelszavak nem egyeznek');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('A jelszónak legalább 8 karakter hosszúnak kell lennie');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post('/admin/users', {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        balance: formData.balance,
      });
      
      notifications.addNotification({
        type: 'success',
        title: 'Felhasználó létrehozva',
        message: `A felhasználó sikeresen létrehozva: ${formData.email}`,
      });
      
      router.push(`/${locale}/admin/users`);
    } catch (err: any) {
      const errorMessage = err.message || 'Felhasználó létrehozása sikertelen';
      setError(errorMessage);
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: errorMessage,
      });
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

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
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
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Új Felhasználó Létrehozása</h1>
              <p style={{ color: '#cbd5e1' }}>
                Új felhasználó hozzáadása a rendszerhez
              </p>
            </div>
            <BackButton fallbackHref={`/${locale}/admin/users`} />
          </header>

          <Card className="glass elevation-2 p-6 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                  Email *
                </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: '' });
                  }
                }}
                required
                className={`w-full px-4 py-2 rounded-lg border ${
                  fieldErrors.email ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: fieldErrors.email ? '#ef4444' : 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              />
              {fieldErrors.email && (
                <p className="text-sm mt-1 text-red-400">{fieldErrors.email}</p>
              )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                  Jelszó *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (fieldErrors.password) {
                      setFieldErrors({ ...fieldErrors, password: '' });
                    }
                  }}
                  required
                  minLength={8}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.password ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
                <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
                  Legalább 8 karakter
                </p>
                {fieldErrors.password && (
                  <p className="text-sm mt-1 text-red-400">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                  Jelszó megerősítése *
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

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                  Szerepkör *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                >
                  <option value="USER">USER</option>
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="RESELLER_ADMIN">RESELLER_ADMIN</option>
                  {currentUser?.role?.toUpperCase() === 'SUPERADMIN' && (
                    <option value="SUPERADMIN">SUPERADMIN</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                  Kezdeti egyenleg (€)
                </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.balance}
                onChange={(e) => {
                  setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 });
                  if (fieldErrors.balance) {
                    setFieldErrors({ ...fieldErrors, balance: '' });
                  }
                }}
                className={`w-full px-4 py-2 rounded-lg border ${
                  fieldErrors.balance ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: fieldErrors.balance ? '#ef4444' : 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              />
              {fieldErrors.balance && (
                <p className="text-sm mt-1 text-red-400">{fieldErrors.balance}</p>
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
                  {loading ? 'Létrehozás...' : 'Felhasználó Létrehozása'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/admin/users`)}
                  disabled={loading}
                >
                  Mégse
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}

