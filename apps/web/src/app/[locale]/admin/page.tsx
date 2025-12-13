'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../stores/auth-store';
import { Navigation } from '../../../components/navigation';
import { Card } from '@zed-hosting/ui-kit';

export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { user, isAuthenticated } = useAuthStore();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    // Check if user is admin - handle both uppercase and lowercase, and different formats
    // Prisma schema uses: SUPERADMIN, RESELLER_ADMIN, USER, SUPPORT
    const userRole = user?.role?.toUpperCase();
    if (isHydrated && isAuthenticated && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [isAuthenticated, isHydrated, user, router, locale]);

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const userRole = user?.role?.toUpperCase();
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
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Admin Panel</h1>
            <p style={{ color: '#cbd5e1' }}>
              Rendszerfelügyelet és konfiguráció
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="glass elevation-2 p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push(`/${locale}/admin/users`)}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
                Felhasználók
              </h3>
              <p className="text-sm" style={{ color: '#cbd5e1' }}>
                Felhasználók kezelése és jogosultságok beállítása
              </p>
            </Card>

            <Card 
              className="glass elevation-2 p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push(`/${locale}/admin/nodes`)}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
                Node-ok
              </h3>
              <p className="text-sm" style={{ color: '#cbd5e1' }}>
                Szerver node-ok kezelése és monitorozása
              </p>
            </Card>

            <Card 
              className="glass elevation-2 p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push(`/${locale}/admin/servers`)}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
                Szerverek
              </h3>
              <p className="text-sm" style={{ color: '#cbd5e1' }}>
                Összes szerver áttekintése és kezelése
              </p>
            </Card>

            <Card 
              className="glass elevation-2 p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push(`/${locale}/admin/settings`)}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
                Rendszerbeállítások
              </h3>
              <p className="text-sm" style={{ color: '#cbd5e1' }}>
                Platform konfiguráció és beállítások
              </p>
            </Card>

            <Card 
              className="glass elevation-2 p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push(`/${locale}/admin/logs`)}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
                Naplók
              </h3>
              <p className="text-sm" style={{ color: '#cbd5e1' }}>
                Rendszernaplók és audit trail
              </p>
            </Card>

            <Card 
              className="glass elevation-2 p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push(`/${locale}/admin/licensing`)}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
                Licencelés
              </h3>
              <p className="text-sm" style={{ color: '#cbd5e1' }}>
                Licenc kezelés és validáció
              </p>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
