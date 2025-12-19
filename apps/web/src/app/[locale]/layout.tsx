import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '../../i18n/routing';
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
  const { locale } = params;
  const messages = await getMessages();

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
              <NextIntlClientProvider messages={messages} locale={locale || routing.defaultLocale}>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </NextIntlClientProvider>
            </SocketProvider>
          </QueryProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

