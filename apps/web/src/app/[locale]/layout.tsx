import { QueryProvider } from '../../providers/query-provider';
import { ThemeProvider } from '../../lib/theme';
import { ErrorBoundary } from '../../components/error-boundary';
import { NotificationProvider } from '../../context/notification-context';
import { ErrorLoggerInitializer } from '../../components/error-logger-initializer';
import { SocketProvider } from '../../contexts/socket-context';

export default async function LocaleLayout({
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
            <SocketProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </SocketProvider>
          </QueryProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

