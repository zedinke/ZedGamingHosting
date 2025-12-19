import '../global.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '../../i18n/routing';
import { QueryProvider } from '../../providers/query-provider';
import { ThemeProvider } from '../../lib/theme';
import { geistSans, jetbrainsMono } from '../../lib/fonts';
import { ErrorBoundary } from '../../components/error-boundary';
import { NotificationProvider } from '../../context/notification-context';
import { ErrorLoggerInitializer } from '../../components/error-logger-initializer';

export const metadata = {
  title: 'ZedGamingHosting',
  description: 'Premium Game Server Hosting Platform',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale || routing.defaultLocale} className="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body 
        className={`${geistSans.variable} ${jetbrainsMono.variable} font-sans`}
        style={{ 
          margin: 0,
          padding: 0,
          minHeight: '100vh'
        }}
      >
        <ErrorLoggerInitializer />
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <NextIntlClientProvider messages={messages}>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </NextIntlClientProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

