'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { Navigation } from '../../../../components/navigation';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { exportToCSV, formatDateForFilename } from '../../../../utils/export';
import { ListSkeleton } from '../../../../components/loading-skeleton';
import { Pagination } from '../../../../components/pagination';

interface User {
  id: string;
  email: string;
  role: string;
  balance: number;
  createdAt: string;
  tenantId?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const params = useParams();
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

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      return await apiClient.get<User[]>('/admin/users');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = !searchQuery || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

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
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Felhasználók</h1>
                <p style={{ color: '#cbd5e1' }}>
                  Felhasználók kezelése és jogosultságok beállítása
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (filteredUsers && filteredUsers.length > 0) {
                      exportToCSV(
                        filteredUsers.map(u => ({
                          ID: u.id,
                          Email: u.email,
                          Szerepkör: u.role,
                          Egyenleg: u.balance,
                          Létrehozva: u.createdAt ? new Date(u.createdAt).toLocaleString('hu-HU') : '',
                        })),
                        `felhasznalok_${formatDateForFilename()}.csv`
                      );
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  CSV export
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => router.push(`/${locale}/admin/users/create`)}
                >
                  Új felhasználó
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Keresés email vagy ID alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              >
                <option value="all">Minden szerepkör</option>
                <option value="USER">USER</option>
                <option value="SUPPORT">SUPPORT</option>
                <option value="RESELLER_ADMIN">RESELLER_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
              </select>
            </div>
          </header>

          {isLoading ? (
            <ListSkeleton items={5} />
          ) : filteredUsers.length === 0 ? (
            <Card className="glass elevation-2 p-12 text-center">
              <p style={{ color: '#cbd5e1' }}>
                {searchQuery || roleFilter !== 'all' ? 'Nincs találat' : 'Nincs felhasználó'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4 mb-6">
              {paginatedUsers.map((user) => (
                <Card key={user.id} className="glass elevation-2 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: '#f8fafc' }}>
                        {user.email}
                      </h3>
                      <p className="text-sm" style={{ color: '#cbd5e1' }}>
                        Szerepkör: {user.role} | Egyenleg: {user.balance.toFixed(2)} €
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/${locale}/admin/users/${user.id}`)}
                      >
                        Szerkesztés
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          )}
        </div>
      </main>
    </>
  );
}

