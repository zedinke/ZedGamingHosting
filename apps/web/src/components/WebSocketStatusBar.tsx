'use client';

import { useWebSocket, WebSocketStatus } from '../contexts/WebSocketContext';

/**
 * WebSocket Status Bar - Shows connection status in header
 */
export function WebSocketStatusBar() {
  const { isConnected, isConnecting, error } = useWebSocket();

  return (
    <div
      style={{
        padding: '8px 16px',
        fontSize: '12px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isConnected ? '#f0fdf4' : isConnecting ? '#fffbeb' : '#fef2f2',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <WebSocketStatus />
        {error && <span style={{ color: '#dc2626', marginLeft: 8 }}>({error})</span>}
      </div>
      <span style={{ fontSize: '10px', color: '#999' }}>Real-time updates enabled</span>
    </div>
  );
}
