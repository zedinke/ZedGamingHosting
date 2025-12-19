/**
 * Error Logger Service
 * Sends errors to backend logging service and Sentry
 */

interface ErrorLog {
  message: string;
  stack?: string;
  context?: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  userId?: string;
  userAgent: string;
  timestamp: string;
  url: string;
  metadata?: Record<string, any>;
}

class ErrorLoggerService {
  private static instance: ErrorLoggerService;
  private apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  private logQueue: ErrorLog[] = [];
  private isProcessing = false;

  private constructor() {
    // Initialize service
    if (typeof window !== 'undefined') {
      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        this.logError({
          message: event.message,
          stack: event.error?.stack,
          context: 'uncaught-error',
          severity: 'critical',
        });
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
          context: 'unhandled-rejection',
          severity: 'error',
        });
      });

      // Batch process logs
      setInterval(() => this.processBatch(), 30000);
    }
  }

  static getInstance(): ErrorLoggerService {
    if (!ErrorLoggerService.instance) {
      ErrorLoggerService.instance = new ErrorLoggerService();
    }
    return ErrorLoggerService.instance;
  }

  /**
   * Log an error with context
   */
  logError(error: Partial<ErrorLog>): void {
    const errorLog: ErrorLog = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: error.context || 'unknown',
      severity: error.severity || 'error',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      metadata: error.metadata,
    };

    // Add user ID if available
    if (typeof window !== 'undefined' && localStorage.getItem('userId')) {
      errorLog.userId = localStorage.getItem('userId') || undefined;
    }

    this.logQueue.push(errorLog);

    // If it's critical, send immediately
    if (error.severity === 'critical') {
      this.processBatch();
    }
  }

  /**
   * Process and send batched errors
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      const response = await fetch(`${this.apiEndpoint}/api/logs/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: JSON.stringify({
          errors: logsToSend,
          batchId: this.generateBatchId(),
        }),
      });

      if (!response.ok) {
        console.error('Failed to send error logs:', response.status);
        // Re-queue failed logs
        this.logQueue.push(...logsToSend);
      }
    } catch (error) {
      console.error('Error sending logs:', error);
      // Re-queue failed logs
      this.logQueue.push(...logsToSend);
    } finally {
      this.isProcessing = false;
    }
  }

  private generateBatchId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.logQueue.length;
  }

  /**
   * Force flush all pending logs
   */
  async flush(): Promise<void> {
    if (this.logQueue.length > 0) {
      await this.processBatch();
    }
  }
}

export const errorLogger = ErrorLoggerService.getInstance();
