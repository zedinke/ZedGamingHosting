import { useEffect, useRef, useState } from 'react';

interface UseSSEOptions {
  url: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
}

/**
 * Hook for Server-Sent Events (SSE)
 */
export function useSSE({ url, enabled = true, onMessage, onError }: UseSSEOptions) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Event | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !url) return;

    // Create EventSource with headers if needed
    // Note: EventSource doesn't support custom headers, so we'll use fetch with EventSource-like behavior
    // For now, we'll use a simple EventSource if headers aren't needed
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
        if (onMessage) {
          onMessage(parsedData);
        }
      } catch (err) {
        // If not JSON, use raw data
        setData(event.data);
        if (onMessage) {
          onMessage(event.data);
        }
      }
    };

    eventSource.onerror = (err) => {
      setError(err);
      setIsConnected(false);
      if (onError) {
        onError(err);
      }
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [url, enabled, onMessage, onError]);

  const close = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  };

  return { data, error, isConnected, close };
}

