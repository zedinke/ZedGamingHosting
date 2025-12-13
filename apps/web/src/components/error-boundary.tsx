'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Button } from '@zed-hosting/ui-kit';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0a0a0a' }}>
          <Card className="glass elevation-2 p-8 max-w-2xl w-full">
            <div className="flex items-center gap-4 mb-6">
              <AlertTriangle className="h-12 w-12" style={{ color: '#ef4444' }} />
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#f8fafc' }}>
                  Hiba történt
                </h2>
                <p style={{ color: '#cbd5e1' }}>
                  Sajnáljuk, váratlan hiba történt az alkalmazásban.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#1f2937' }}>
                <p className="text-sm font-mono mb-2" style={{ color: '#ef4444' }}>
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm" style={{ color: '#9ca3af' }}>
                      Részletek
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto" style={{ color: '#6b7280' }}>
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Újrapróbálás
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Főoldal
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

