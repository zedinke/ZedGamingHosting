'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { useTranslations } from 'next-intl';
import { Button } from '@zed-hosting/ui-kit';
import { useAuthStore } from '../stores/auth-store';

interface TerminalConsoleProps {
  serverUuid: string;
  onClose?: () => void;
}

export function TerminalConsole({ serverUuid, onClose }: TerminalConsoleProps) {
  const t = useTranslations();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const terminal = new XTerm({
      theme: {
        background: '#1a1a1a',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        black: '#1e1e1e',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(terminalRef.current);

    // Fit terminal to container
    fitAddon.fit();

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/ws/console/${serverUuid}?token=${accessToken || ''}`;

    setConnectionStatus('connecting');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionStatus('connected');
      terminal.writeln('\r\n\x1b[32mConnected to server console\x1b[0m\r\n');
    };

    ws.onmessage = (event) => {
      terminal.write(event.data);
    };

    ws.onerror = (error) => {
      terminal.writeln(
        '\r\n\x1b[31mWebSocket error: ' +
          t('terminal.error.websocketError') +
          '\x1b[0m\r\n'
      );
      setConnectionStatus('disconnected');
    };

    ws.onclose = () => {
      terminal.writeln('\r\n\x1b[33mConnection closed\x1b[0m\r\n');
      setConnectionStatus('disconnected');
    };

    // Send terminal input to WebSocket
    terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    websocketRef.current = ws;

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      terminal.dispose();
    };
  }, [serverUuid, accessToken, t]);

  const handleReconnect = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    // Reconnect will happen automatically via useEffect
    window.location.reload();
  };

  const handleClear = () => {
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.clear();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">
            {t('terminal.title')}
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-400">
              {connectionStatus === 'connected'
                ? t('terminal.connected')
                : connectionStatus === 'connecting'
                ? t('terminal.connecting')
                : t('terminal.disconnected')}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {connectionStatus !== 'connected' && (
            <Button size="sm" variant="outline" onClick={handleReconnect}>
              {t('terminal.reconnect')}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleClear}>
            {t('terminal.clear')}
          </Button>
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Container */}
      <div
        ref={terminalRef}
        className="flex-1 p-4 overflow-hidden"
        style={{ height: 'calc(100% - 64px)' }}
      />
    </div>
  );
}

