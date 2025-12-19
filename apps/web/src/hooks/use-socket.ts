"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const DEFAULT_WS_PATH = '/ws';

const getDefaultWsUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${DEFAULT_WS_PATH}`;
  }

  // On the server we don't have a window; return empty to avoid ReferenceErrors
  return '';
};

export interface UseSocketOptions {
  url?: string;
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export interface SocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

/**
 * Custom hook for WebSocket (socket.io) connection management
 * Handles authentication, reconnection, event subscription
 */
export function useSocket({
  url,
  enabled = true,
  onConnect,
  onDisconnect,
  onError,
  autoReconnect = true,
  reconnectDelay = 5000,
}: UseSocketOptions = {}) {
  const socketUrl = url || getDefaultWsUrl();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<SocketMessage[]>([]);
  const subscriptionsRef = useRef<Map<string, Set<(data: any) => void>>>(
    new Map()
  );

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(async () => {
    if (!enabled) return;

    try {
      setConnectionStatus('connecting');

      // Get token from localStorage
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('accessToken') 
        : null;

      if (!token) {
        console.warn('No access token found for WebSocket connection');
        setConnectionStatus('error');
        return;
      }

      // Create socket connection
      const socket = io(socketUrl, {
        auth: {
          token,
        },
        reconnection: autoReconnect,
        reconnectionDelay,
        transports: ['websocket', 'polling'],
        autoConnect: false,
      });

      // Connection event
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message) {
            socket.emit(message.type, message.data);
          }
        }

        onConnect?.();
      });

      // Disconnection event
      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();
      });

      // Error event
      socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        onError?.(error);
      });

      // Generic message handler
      socket.on('message', (data: any) => {
        triggerSubscription('message', data);
      });

      // Support ticket events
      socket.on('support:newComment', (data: any) => {
        triggerSubscription('support:newComment', data);
      });

      socket.on('support:statusChanged', (data: any) => {
        triggerSubscription('support:statusChanged', data);
      });

      socket.on('support:userTyping', (data: any) => {
        triggerSubscription('support:userTyping', data);
      });

      socket.on('support:subscribed', (data: any) => {
        triggerSubscription('support:subscribed', data);
      });

      socket.on('support:unsubscribed', (data: any) => {
        triggerSubscription('support:unsubscribed', data);
      });

      // Server status events
      socket.on('server:statusChanged', (data: any) => {
        triggerSubscription('server:statusChanged', data);
      });

      socket.on('server:metricsUpdate', (data: any) => {
        triggerSubscription('server:metricsUpdate', data);
      });

      socket.on('server:consoleOutput', (data: any) => {
        triggerSubscription('server:consoleOutput', data);
      });

      socket.on('server:subscribed', (data: any) => {
        triggerSubscription('server:subscribed', data);
      });

      socket.on('server:unsubscribed', (data: any) => {
        triggerSubscription('server:unsubscribed', data);
      });

      // Staff events
      socket.on('staff:online', (data: any) => {
        triggerSubscription('staff:online', data);
      });

      socket.on('staff:offline', (data: any) => {
        triggerSubscription('staff:offline', data);
      });

      // Notifications
      socket.on('notification', (data: any) => {
        triggerSubscription('notification', data);
      });

      // Connection confirmation
      socket.on('connected', (data: any) => {
        triggerSubscription('connected', data);
      });

      // Pong response
      socket.on('pong', (data: any) => {
        triggerSubscription('pong', data);
      });

      socketRef.current = socket;
      socket.connect();
    } catch (error: any) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionStatus('error');
      onError?.(error);
    }
  }, [enabled, socketUrl, autoReconnect, reconnectDelay, onConnect, onDisconnect, onError]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  /**
   * Subscribe to an event
   */
  const subscribe = useCallback(
    (eventType: string, callback: (data: any) => void) => {
      if (!subscriptionsRef.current.has(eventType)) {
        subscriptionsRef.current.set(eventType, new Set());
      }
      subscriptionsRef.current.get(eventType)!.add(callback);

      // Return unsubscribe function
      return () => {
        const subscribers = subscriptionsRef.current.get(eventType);
        if (subscribers) {
          subscribers.delete(callback);
        }
      };
    },
    []
  );

  /**
   * Unsubscribe from an event
   */
  const unsubscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    const subscribers = subscriptionsRef.current.get(eventType);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }, []);

  /**
   * Trigger all subscribers for an event
   */
  const triggerSubscription = (eventType: string, data: any) => {
    const subscribers = subscriptionsRef.current.get(eventType);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscription for ${eventType}:`, error);
        }
      });
    }
  };

  /**
   * Emit an event
   */
  const emit = useCallback((eventType: string, data?: any) => {
    if (!socketRef.current) {
      // Queue message if not connected
      messageQueueRef.current.push({
        type: eventType,
        data: data || {},
        timestamp: Date.now(),
      });
      return;
    }

    if (socketRef.current.connected) {
      socketRef.current.emit(eventType, data || {});
    } else {
      messageQueueRef.current.push({
        type: eventType,
        data: data || {},
        timestamp: Date.now(),
      });
    }
  }, []);

  /**
   * Send heartbeat/ping
   */
  const ping = useCallback(() => {
    emit('ping');
  }, [emit]);

  /**
   * Subscribe to support ticket
   */
  const subscribeToTicket = useCallback((ticketId: string) => {
    emit('support:subscribeTicket', { ticketId });
  }, [emit]);

  /**
   * Unsubscribe from support ticket
   */
  const unsubscribeFromTicket = useCallback((ticketId: string) => {
    emit('support:unsubscribeTicket', { ticketId });
  }, [emit]);

  /**
   * Send typing indicator for support comment
   */
  const sendTypingIndicator = useCallback(
    (ticketId: string, isTyping: boolean) => {
      emit('support:typingComment', { ticketId, isTyping });
    },
    [emit]
  );

  /**
   * Subscribe to server status
   */
  const subscribeToServer = useCallback((serverUuid: string) => {
    emit('server:subscribeStatus', { serverUuid });
  }, [emit]);

  /**
   * Unsubscribe from server status
   */
  const unsubscribeFromServer = useCallback((serverUuid: string) => {
    emit('server:unsubscribeStatus', { serverUuid });
  }, [emit]);

  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  /**
   * Periodic heartbeat
   */
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      ping();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, ping]);

  return {
    isConnected,
    connectionStatus,
    socket: socketRef.current,
    emit,
    subscribe,
    unsubscribe,
    ping,
    connect,
    disconnect,
    // Support ticket helpers
    subscribeToTicket,
    unsubscribeFromTicket,
    sendTypingIndicator,
    // Server status helpers
    subscribeToServer,
    unsubscribeFromServer,
  };
}
