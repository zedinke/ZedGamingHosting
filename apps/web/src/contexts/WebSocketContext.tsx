'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket as useSocketHook } from './useSocket';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

/**
 * WebSocketProvider - Provides socket connection to all child components
 */
export function WebSocketProvider({ children, autoConnect = true }: WebSocketProviderProps) {
  const { socket, isConnected, isConnecting, error } = useSocketHook({
    autoConnect,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  const value: WebSocketContextType = {
    socket,
    isConnected,
    isConnecting,
    error,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use WebSocket context
 */
export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}

/**
 * Connection status indicator component
 */
export function WebSocketStatus() {
  const { isConnected, isConnecting, error } = useWebSocket();

  if (!isConnected && !isConnecting) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span>Offline{error ? ` - ${error}` : ''}</span>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-500">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-500">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span>Connected</span>
    </div>
  );
}
