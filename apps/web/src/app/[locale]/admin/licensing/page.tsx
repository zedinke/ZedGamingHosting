'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../../stores/auth-store';
import { Navigation } from '../../../../components/navigation';
import { Card } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';

interface LicenseInfo {
  status: string;
  licenseStatus: string;
  validUntil?: string;
  daysUntilExpiry?: number;
  maxNodesAllowed: number;
  whitelabelEnabled: boolean;
}

export default function AdminLicensingPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
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
      return;
    }

    const userRole = currentUser?.role?.toUpperCase();
    if (isHydrated && isAuthenticated && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [isAuthenticated, isHydrated, currentUser, router, locale]);

  const { data: licenseInfo, isLoading } = useQuery<LicenseInfo>({
    queryKey: ['license-info'],
    queryFn: async () => {
      return await apiClient.get<LicenseInfo>('/licensing/health');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
    refetchInterval: 60000, // Refetch every minute
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
      case 'ACTIVE':
        return '#10b981';
      case 'UNHEALTHY':
      case 'EXPIRED':
        return '#ef4444';
      case 'SUSPENDED':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

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
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Licencelés</h1>
            <p style={{ color: '#cbd5e1' }}>
              Licenc kezelés és validáció
            </p>
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : !licenseInfo ? (
            <Card className="glass elevation-2 p-12 text-center">
              <p style={{ color: '#cbd5e1' }}>
                Licenc információ nem elérhető
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass elevation-2 p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#f8fafc' }}>
                  Licenc Státusz
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#cbd5e1' }}>Állapot:</span>
                    <span 
                      className="font-semibold"
                      style={{ color: getStatusColor(licenseInfo.status) }}
                    >
                      {licenseInfo.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#cbd5e1' }}>Licenc Státusz:</span>
                    <span 
                      className="font-semibold"
                      style={{ color: getStatusColor(licenseInfo.licenseStatus) }}
                    >
                      {licenseInfo.licenseStatus}
                    </span>
                  </div>
                  {licenseInfo.validUntil && (
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#cbd5e1' }}>Érvényes:</span>
                      <span style={{ color: '#f8fafc' }}>
                        {new Date(licenseInfo.validUntil).toLocaleDateString('hu-HU')}
                      </span>
                    </div>
                  )}
                  {licenseInfo.daysUntilExpiry !== undefined && (
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#cbd5e1' }}>Napok lejáratig:</span>
                      <span 
                        className="font-semibold"
                        style={{ 
                          color: licenseInfo.daysUntilExpiry < 30 ? '#ef4444' : licenseInfo.daysUntilExpiry < 90 ? '#f59e0b' : '#10b981'
                        }}
                      >
                        {licenseInfo.daysUntilExpiry} nap
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="glass elevation-2 p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#f8fafc' }}>
                  Licenc Korlátok
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#cbd5e1' }}>Max. Node-ok:</span>
                    <span className="text-2xl font-bold" style={{ color: '#f8fafc' }}>
                      {licenseInfo.maxNodesAllowed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#cbd5e1' }}>White-label:</span>
                    <span 
                      className="font-semibold"
                      style={{ color: licenseInfo.whitelabelEnabled ? '#10b981' : '#6b7280' }}
                    >
                      {licenseInfo.whitelabelEnabled ? 'Engedélyezve' : 'Letiltva'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

