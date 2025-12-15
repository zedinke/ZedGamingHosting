'use client';

import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { ReactNode, useEffect } from 'react';

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
    <div className="min-h-screen bg-background-surface">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader title={title} actions={actions} />
        <main className="p-6 bg-background-surface min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
