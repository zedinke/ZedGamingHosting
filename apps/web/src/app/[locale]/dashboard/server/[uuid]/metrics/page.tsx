'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { Button } from '@zed-hosting/ui-kit';
import { ServerMetrics } from '../../../../../../components/server-metrics';
import Link from 'next/link';

export default function ServerMetricsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const serverUuid = params.uuid as string;

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-app)' }}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              ← {t('back') || 'Back'}
            </Button>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>
              {t('dashboard.server.metrics.title') || 'Server Metrics'}
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-700 mb-6">
            <nav className="flex gap-4">
              <Link
                href={`/dashboard/server/${serverUuid}`}
                className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {t('dashboard.server.tabs.overview') || 'Overview'}
              </Link>
              <Link
                href={`/dashboard/server/${serverUuid}/console`}
                className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {t('dashboard.server.tabs.console') || 'Console'}
              </Link>
              <Link
                href={`/dashboard/server/${serverUuid}/files`}
                className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {t('dashboard.server.tabs.files') || 'Files'}
              </Link>
              <Link
                href={`/dashboard/server/${serverUuid}/settings`}
                className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {t('dashboard.server.tabs.settings') || 'Settings'}
              </Link>
              <Link
                href={`/dashboard/server/${serverUuid}/metrics`}
                className="pb-4 px-2 border-b-2 border-blue-500 text-blue-400 font-medium"
              >
                {t('dashboard.server.tabs.metrics') || 'Metrics'}
              </Link>
            </nav>
          </div>

          {/* Metrics Charts */}
          <ServerMetrics serverUuid={serverUuid} refreshInterval={30000} />
        </div>
      </div>
    </ProtectedRoute>
  );
}

