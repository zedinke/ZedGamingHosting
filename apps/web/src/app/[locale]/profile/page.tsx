'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../stores/auth-store';
import { Navigation } from '../../../components/navigation';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, accessToken, logout } = useAuthStore();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);

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

  // Fetch user profile from API
  const { data: profile, isLoading } = useQuery<{ email?: string; role?: string; id?: string; balance?: number; createdAt?: string }>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      return await apiClient.get<{ email?: string; role?: string; id?: string; balance?: number; createdAt?: string }>('/auth/me');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
  });

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

  const userData: { email?: string; role?: string; id?: string; balance?: number; createdAt?: string } | null = profile || user || null;

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen" style={{ 
        backgroundColor: '#0a0a0a', 
        background: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), #0a0a0a',
        color: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Profil</h1>
            <p style={{ color: '#cbd5e1' }}>
              Felhasználói adatok és beállítások
            </p>
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : !userData ? (
            <Card className="glass elevation-2 p-12 text-center">
              <p style={{ color: '#cbd5e1' }}>Nem sikerült betölteni a felhasználói adatokat.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass elevation-2 p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                  Alapinformációk
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm" style={{ color: '#cbd5e1' }}>Email</label>
                    <p className="text-base font-medium" style={{ color: '#f8fafc' }}>
                      {userData?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm" style={{ color: '#cbd5e1' }}>Szerepkör</label>
                    <p className="text-base font-medium" style={{ color: '#f8fafc' }}>
                      {userData?.role || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm" style={{ color: '#cbd5e1' }}>Felhasználó ID</label>
                    <p className="text-base font-mono text-sm" style={{ color: '#cbd5e1' }}>
                      {userData?.id || 'N/A'}
                    </p>
                  </div>
                  {userData?.balance !== undefined && (
                    <div>
                      <label className="text-sm" style={{ color: '#cbd5e1' }}>Egyenleg</label>
                      <p className="text-base font-medium" style={{ color: '#f8fafc' }}>
                        {userData.balance.toFixed(2)} €
                      </p>
                    </div>
                  )}
                  {userData?.createdAt && (
                    <div>
                      <label className="text-sm" style={{ color: '#cbd5e1' }}>Regisztráció dátuma</label>
                      <p className="text-base font-medium" style={{ color: '#f8fafc' }}>
                        {new Date(userData.createdAt).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="glass elevation-2 p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                  Fiók beállítások
                </h2>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/${locale}/profile/change-password`)}
                  >
                    Jelszó változtatása
                  </Button>
                  <Button variant="outline" className="w-full">
                    Kétfaktoros hitelesítés
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      logout();
                      router.push(`/${locale}/login`);
                    }}
                  >
                    Kijelentkezés
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

