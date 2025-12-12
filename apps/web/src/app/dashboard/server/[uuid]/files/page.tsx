'use client';

import { use } from 'react';
import { FileManager } from '../../../../components/file-manager';

interface PageProps {
  params: Promise<{ uuid: string }>;
  searchParams?: Promise<{ path?: string }>;
}

export default function ServerFilesPage({ params, searchParams }: PageProps) {
  const { uuid } = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : {};
  const initialPath = resolvedSearchParams.path || '/';

  return (
    <div className="h-screen w-full">
      <FileManager serverUuid={uuid} initialPath={initialPath} />
    </div>
  );
}

