'use client';

import { WebSocketProvider } from '../contexts/WebSocketContext';
import { NotificationCenter } from '../components/NotificationCenter';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <WebSocketProvider autoConnect={true}>
      <NotificationCenter />
      {children}
    </WebSocketProvider>
  );
}
