'use client';

import { use } from 'react';
import { TerminalConsole } from '../../../../../../components/terminal-console';

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default function ServerConsolePage({ params }: PageProps) {
  const { uuid } = use(params);

  return (
    <div className="h-screen w-full">
      <TerminalConsole
        serverUuid={uuid}
        onClose={() => {
          window.history.back();
        }}
      />
    </div>
  );
}

