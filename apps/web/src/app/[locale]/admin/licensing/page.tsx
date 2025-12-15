'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card, Badge } from '@zed-hosting/ui-kit';
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
  // const t = useTranslations();
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Betöltés...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Átirányítás...</p>
      </div>
    );
  }

  const getStatusVariant = (status: string): 'success' | 'danger' | 'warning' | 'default' => {
    switch (status) {
      case 'HEALTHY':
      case 'ACTIVE':
        return 'success';
      case 'UNHEALTHY':
      case 'EXPIRED':
        return 'danger';
      case 'SUSPENDED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="light">
      <AdminLayout title="Licencelés">
        <div>
          <div className="mb-6">
            <p style={{ color: 'var(--color-text-muted)' }}>
              Licenc kezelés és validáció
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-muted)' }}>Betöltés...</p>
            </div>
          ) : !licenseInfo ? (
            <Card className="p-12 text-center">
              <p style={{ color: 'var(--color-text-muted)' }}>
                Licenc információ nem elérhető
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                  Licenc Státusz
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Állapot:</span>
                    <Badge variant={getStatusVariant(licenseInfo.status)}>
                      {licenseInfo.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Licenc Státusz:</span>
                    <Badge variant={getStatusVariant(licenseInfo.licenseStatus)}>
                      {licenseInfo.licenseStatus}
                    </Badge>
                  </div>
                  {licenseInfo.validUntil && (
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'var(--color-text-muted)' }}>Érvényes:</span>
                      <span style={{ color: 'var(--color-text-main)' }}>
                        {new Date(licenseInfo.validUntil).toLocaleDateString('hu-HU')}
                      </span>
                    </div>
                  )}
                  {licenseInfo.daysUntilExpiry !== undefined && (
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'var(--color-text-muted)' }}>Napok lejáratig:</span>
                      <Badge 
                        variant={licenseInfo.daysUntilExpiry < 30 ? 'danger' : licenseInfo.daysUntilExpiry < 90 ? 'warning' : 'success'}
                      >
                        {licenseInfo.daysUntilExpiry} nap
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                  Licenc Korlátok
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Max. Node-ok:</span>
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>
                      {licenseInfo.maxNodesAllowed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>White-label:</span>
                    <Badge variant={licenseInfo.whitelabelEnabled ? 'success' : 'default'}>
                      {licenseInfo.whitelabelEnabled ? 'Engedélyezve' : 'Letiltva'}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </div>
  );
}

