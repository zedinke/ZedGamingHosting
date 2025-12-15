'use client';

import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { ReactNode, useEffect } from 'react';
import { css } from '../../styled-system/css';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, actions }: AdminLayoutProps) {
  useEffect(() => {
    // Apply light theme to html tag for admin pages
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    
    return () => {
      // Cleanup: remove light class when leaving admin pages
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    };
  }, []);

  return (
    <div className={css({ minHeight: '100vh', backgroundColor: 'var(--color-bg-surface)' })}>
      <AdminSidebar />
      <div className={css({ paddingLeft: { base: 0, lg: '16rem' } })}>
        <AdminHeader title={title} actions={actions} />
        <main
          className={css({
            padding: '1.5rem',
            backgroundColor: 'var(--color-bg-surface)',
            minHeight: 'calc(100vh - 4rem)',
          })}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
