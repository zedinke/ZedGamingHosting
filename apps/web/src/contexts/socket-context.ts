'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

interface SocketContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    // Stub implementation
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    // Stub implementation
  }, []);

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    // Stub implementation
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        emit,
        on,
        off,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    return {
      isConnected: false,
      connect: () => {},
      disconnect: () => {},
      emit: () => {},
      on: () => {},
      off: () => {},
    };
  }
  return context;
};
