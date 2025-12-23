'use client';

import { QueryProvider } from '../../providers/query-provider';
import { ThemeProvider } from '../../lib/theme';
import { ErrorBoundary } from '../../components/error-boundary';
import { NotificationProvider } from '../../context/notification-context';
import { ErrorLoggerInitializer } from '../../components/error-logger-initializer';
import { SocketProvider } from '../../contexts/socket-context';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import { NotificationCenter } from '../../components/NotificationCenter';

// Mark as dynamic to avoid static generation
export const dynamic = 'force-dynamic';

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
      }}
    >
      <ErrorLoggerInitializer />
      <ErrorBoundary>
        <ThemeProvider>
          <QueryProvider>
            <WebSocketProvider autoConnect={true}>
              <SocketProvider>
                <NotificationProvider>
                  <NotificationCenter />
                  {children}
                </NotificationProvider>
              </SocketProvider>
            </WebSocketProvider>
          </QueryProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

