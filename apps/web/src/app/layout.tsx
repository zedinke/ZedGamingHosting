import './global.css';
import { geistSans, jetbrainsMono } from '../lib/fonts';

export const metadata = {
  title: 'ZedGamingHosting',
  description: 'Premium Game Server Hosting Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${jetbrainsMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
