'use client';

import { FileManager } from '../../../../../../components/file-manager';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@zed-hosting/ui-kit';
import Link from 'next/link';

export default function ServerFilesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const serverUuid = params.uuid as string;
  const initialPath = searchParams.get('path') || '/';

  return (
    <ProtectedRoute>
      <div className="h-screen w-full flex flex-col" style={{ backgroundColor: 'var(--color-bg-app)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                size="sm"
              >
                ← {t('back') || 'Back'}
              </Button>
              <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
                {t('dashboard.server.tabs.files') || 'Files'}
              </h1>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/server/${serverUuid}`}>
                <Button variant="outline" size="sm">
                  {t('dashboard.server.tabs.overview') || 'Overview'}
                </Button>
              </Link>
              <Link href={`/dashboard/server/${serverUuid}/console`}>
                <Button variant="outline" size="sm">
                  {t('dashboard.server.tabs.console') || 'Console'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <FileManager serverUuid={serverUuid} initialPath={initialPath} />
        </div>
      </div>
    </ProtectedRoute>
  );
}

