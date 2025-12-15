'use client';

import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, actions }: AdminLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader title={title} actions={actions} />
        <main
          className="p-6"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            minHeight: 'calc(100vh - 4rem)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

