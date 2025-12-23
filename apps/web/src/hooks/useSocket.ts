'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type SocketEventHandler<T = any> = (data: T) => void;

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  reconnectionAttempts?: number;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

/**
 * useSocket Hook - Manages WebSocket connection and event subscriptions
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Event subscription/unsubscription management
 * - Connection status tracking
 * - Error handling
 */
export function useSocket(options: UseSocketOptions = {}): SocketContextType {
  const {
    autoConnect = true,
    reconnectionDelay = 1000,
    reconnectionDelayMax = 5000,
    reconnectionAttempts = 5,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionsRef = useRef<Map<string, Set<SocketEventHandler>>>(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    const initSocket = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Get JWT token from localStorage
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setError('No authentication token found');
          setIsConnecting(false);
          return;
        }

        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const socket = io(`${socketUrl}/ws`, {
          auth: {
            token,
          },
          reconnection: true,
          reconnectionDelay,
          reconnectionDelayMax,
          reconnectionAttempts,
          transports: ['websocket', 'polling'],
        });

        // Connection handlers
        socket.on('connect', () => {
          console.log('[useSocket] Connected:', socket.id);
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
        });

        socket.on('disconnect', (reason) => {
          console.log('[useSocket] Disconnected:', reason);
          setIsConnected(false);
          if (reason === 'io server disconnect') {
            setError('Server disconnected');
          }
        });

        socket.on('connect_error', (error) => {
          console.error('[useSocket] Connection error:', error);
          setError(`Connection error: ${error.message}`);
          setIsConnecting(false);
        });

        socket.on('error', (error) => {
          console.error('[useSocket] Socket error:', error);
          setError(`Socket error: ${error}`);
        });

        // Reconnection events
        socket.on('reconnect', (attemptNumber) => {
          console.log('[useSocket] Reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
        });

        socket.on('reconnect_attempt', () => {
          console.log('[useSocket] Attempting to reconnect...');
          setIsConnecting(true);
        });

        socket.on('reconnect_failed', () => {
          console.error('[useSocket] Reconnection failed');
          setError('Failed to reconnect after multiple attempts');
          setIsConnecting(false);
        });

        socketRef.current = socket;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setIsConnecting(false);
      }
    };

    initSocket();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [autoConnect, reconnectionDelay, reconnectionDelayMax, reconnectionAttempts]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
  };
}

/**
 * Hook to subscribe to socket events with automatic cleanup
 */
export function useSocketEvent<T = any>(
  socket: Socket | null,
  event: string,
  handler: SocketEventHandler<T>,
  dependencies: any[] = []
): void {
  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler, ...dependencies]);
}

/**
 * Hook to emit socket events
 */
export function useSocketEmit(socket: Socket | null) {
  return useCallback(
    <T = any>(event: string, data?: T) => {
      if (!socket) {
        console.warn('[useSocketEmit] Socket not connected');
        return;
      }
      socket.emit(event, data);
    },
    [socket]
  );
}

/**
 * Hook to subscribe to support ticket events
 */
export function useTicketSocket(socket: Socket | null, ticketId: string) {
  const emit = useSocketEmit(socket);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Subscribe to ticket
  useEffect(() => {
    if (!socket || !ticketId) return;
    emit('support:subscribeTicket', { ticketId });
    return () => {
      emit('support:unsubscribeTicket', { ticketId });
    };
  }, [socket, ticketId, emit]);

  // Listen for comment events (server emits 'support:newComment' to ticket room)
  useSocketEvent(socket, 'support:newComment', (comment) => {
    console.log('[useTicketSocket] New comment:', comment);
  });

  // Listen for typing events (server emits 'support:userTyping')
  useSocketEvent(socket, 'support:userTyping', (data: { userId: string; username: string }) => {
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.add(data.username);
      return newSet;
    });

    // Clear after 3 seconds
    setTimeout(() => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
    }, 3000);
  });

  // Listen for status changes (server emits 'support:statusChanged')
  useSocketEvent(socket, 'support:statusChanged', (data) => {
    console.log('[useTicketSocket] Status changed:', data);
  });

  const sendTyping = useCallback(() => {
    emit('support:typingComment', { ticketId });
  }, [ticketId, emit]);

  return { typingUsers, sendTyping };
}

/**
 * Hook to subscribe to server status updates
 */
export function useServerStatusSocket(socket: Socket | null, serverUuid: string) {
  const emit = useSocketEmit(socket);

  // Subscribe to server
  useEffect(() => {
    if (!socket || !serverUuid) return;
    emit('server:subscribeStatus', { serverUuid });
    return () => {
      emit('server:unsubscribeStatus', { serverUuid });
    };
  }, [socket, serverUuid, emit]);

  // Listen for metrics
  useSocketEvent(socket, `server:${serverUuid}:metrics`, (metrics) => {
    console.log('[useServerStatusSocket] Metrics:', metrics);
  });

  // Listen for console output
  useSocketEvent(socket, `server:${serverUuid}:console`, (log) => {
    console.log('[useServerStatusSocket] Console:', log);
  });

  return { emit };
}

/**
 * Hook for notification subscription
 */
export function useNotifications(socket: Socket | null) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useSocketEvent(socket, 'notification', (notification) => {
    console.log('[useNotifications] New notification:', notification);
    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
  });

  useSocketEvent(socket, 'support:newTicket', (data) => {
    console.log('[useNotifications] New support ticket:', data);
    setNotifications((prev) => [
      { type: 'support:newTicket', ...data, id: Date.now() },
      ...prev,
    ].slice(0, 50));
  });

  useSocketEvent(socket, 'support:ticketAssigned', (data) => {
    console.log('[useNotifications] Ticket assigned:', data);
    setNotifications((prev) => [
      { type: 'support:ticketAssigned', ...data, id: Date.now() },
      ...prev,
    ].slice(0, 50));
  });

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, clearNotifications, removeNotification };
}
