'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card, Button, Input } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { Download, Plus, Search } from 'lucide-react';
import { exportToCSV, formatDateForFilename } from '../../../../utils/export';
import { ListSkeleton } from '../../../../components/loading-skeleton';
import { Pagination } from '../../../../components/pagination';
import { BackButton } from '../../../../components/back-button';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const actions = (
    <>
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
      >
        <Download className="h-4 w-4 mr-2" />
        CSV export
      </Button>
      <Button 
        variant="primary"
        onClick={() => router.push(`/${locale}/admin/users/create`)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Új felhasználó
      </Button>
    </>
  );

  return (
    <AdminLayout title="Felhasználók" actions={actions}>
      <div>
        <div className="mb-4 flex justify-end">
          <BackButton fallbackHref={`/${locale}/admin`} />
        </div>
        <div className="mb-6">
          <p className="text-text-muted">
            Felhasználók kezelése és jogosultságok beállítása
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Keresés email vagy ID alapján..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border text-sm bg-background-card text-text-primary"
          >
            <option value="all">Minden szerepkör</option>
            <option value="USER">USER</option>
            <option value="SUPPORT">SUPPORT</option>
            <option value="RESELLER_ADMIN">RESELLER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
          </select>
        </div>

        {isLoading ? (
          <ListSkeleton items={5} />
        ) : filteredUsers.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-text-muted">
              {searchQuery || roleFilter !== 'all' ? 'Nincs találat' : 'Nincs felhasználó'}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {paginatedUsers.map((user) => (
                <Card key={user.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-text-primary">
                        {user.email}
                      </h3>
                      <p className="text-sm text-text-muted">
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}

