'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSocket, UseSocketOptions } from '../hooks/use-socket';

interface SocketContextType {
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  emit: (eventType: string, data?: any) => void;
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
  unsubscribe: (eventType: string, callback: (data: any) => void) => void;
  subscribeToTicket: (ticketId: string) => void;
  unsubscribeFromTicket: (ticketId: string) => void;
  sendTypingIndicator: (ticketId: string, isTyping: boolean) => void;
  subscribeToServer: (serverUuid: string) => void;
  unsubscribeFromServer: (serverUuid: string) => void;
  ping: () => void;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
  options?: Omit<UseSocketOptions, 'onConnect' | 'onDisconnect' | 'onError'>;
}

/**
 * Socket Provider - Wraps the app with WebSocket context
 */
export function SocketProvider({ children, options }: SocketProviderProps) {
  const socket = useSocket({
    enabled: true,
    autoReconnect: true,
    ...options,
    onConnect: () => {
      console.log('Socket provider connected');
    },
    onDisconnect: () => {
      console.log('Socket provider disconnected');
    },
    onError: (error) => {
      console.error('Socket provider error:', error);
    },
  });

  const value: SocketContextType = {
    isConnected: socket.isConnected,
    connectionStatus: socket.connectionStatus,
    emit: socket.emit,
    subscribe: socket.subscribe,
    unsubscribe: socket.unsubscribe,
    subscribeToTicket: socket.subscribeToTicket,
    unsubscribeFromTicket: socket.unsubscribeFromTicket,
    sendTypingIndicator: socket.sendTypingIndicator,
    subscribeToServer: socket.subscribeToServer,
    unsubscribeFromServer: socket.unsubscribeFromServer,
    ping: socket.ping,
    connect: socket.connect,
    disconnect: socket.disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * useSocketContext - Hook to use socket context
 */
export function useSocketContext(): SocketContextType {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  
  return context;
}
