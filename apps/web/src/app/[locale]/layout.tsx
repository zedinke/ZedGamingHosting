import '../global.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '../../i18n/routing';
import { QueryProvider } from '../../providers/query-provider';
import { ThemeProvider } from '../../lib/theme';
import { geistSans, jetbrainsMono } from '../../lib/fonts';

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
      <body 
        className={`${geistSans.variable} ${jetbrainsMono.variable} font-sans`}
        style={{ 
          backgroundColor: '#0a0a0a',
          color: '#f8fafc',
          margin: 0,
          padding: 0,
          minHeight: '100vh'
        }}
      >
        <ThemeProvider>
          <QueryProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

