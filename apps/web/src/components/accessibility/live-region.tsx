'use client';

import * as React from 'react';

interface LiveRegionProps {
  children: React.ReactNode;
  level?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  level = 'polite',
  atomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={level}
      aria-atomic={atomic}
      className={className}
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

// Hook for announcing messages to screen readers
export function useAnnounce() {
  const [announcement, setAnnouncement] = React.useState<string>('');

  const announce = React.useCallback((message: string) => {
    setAnnouncement('');
    // Force re-render by clearing and setting
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  return {
    announcement,
    announce,
  };
}

