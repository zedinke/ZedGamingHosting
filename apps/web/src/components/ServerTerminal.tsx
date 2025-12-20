'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Send, Trash2, Copy } from 'lucide-react';

interface ServerTerminalProps {
  serverId: string;
  sessionId: string;
  onClose?: () => void;
}

export const ServerTerminal: React.FC<ServerTerminalProps> = ({
  serverId,
  sessionId,
  onClose,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      rows: 24,
      cols: 80,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
      },
      fontFamily: 'Courier New, monospace',
      fontSize: 12,
    });

    fitAddon.current = new FitAddon();
    term.loadAddon(fitAddon.current);
    term.open(terminalRef.current);
    fitAddon.current.fit();

    terminalInstance.current = term;

    // Write initial message
    term.writeln('\x1b[32m[Terminal Connected]\x1b[0m');
    term.writeln('Type commands and press Enter. Type "help" for command list.');
    term.writeln('');

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || !terminalInstance.current) return;

    setIsLoading(true);

    // Show command in terminal
    terminalInstance.current.writeln(`\x1b[33m$ ${cmd}\x1b[0m`);

    try {
      const response = await fetch(
        `/api/servers/${serverId}/terminal/${sessionId}/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd }),
        },
      );

      if (!response.ok) {
        terminalInstance.current?.writeln(
          `\x1b[31m[Error] ${response.statusText}\x1b[0m`,
        );
        return;
      }

      const { stdout, stderr } = await response.json();

      // Write output
      if (stdout) {
        terminalInstance.current?.write(stdout);
      }
      if (stderr) {
        terminalInstance.current?.writeln(`\x1b[31m${stderr}\x1b[0m`);
      }

      terminalInstance.current?.writeln('');
    } catch (error) {
      terminalInstance.current?.writeln(
        `\x1b[31m[Error] ${error}\x1b[0m`,
      );
    } finally {
      setIsLoading(false);
      setCommand('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(command);
    }
  };

  const clearTerminal = () => {
    terminalInstance.current?.clear();
  };

  const copyOutput = () => {
    const output = terminalInstance.current?.getSelection();
    if (output) {
      navigator.clipboard.writeText(output);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex-1 flex gap-2">
          <button
            onClick={clearTerminal}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={copyOutput}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden bg-black p-2"
        style={{ minHeight: '400px' }}
      />

      {/* Input */}
      <div className="border-t border-gray-700 bg-gray-800 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Enter command..."
            className="flex-1 px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
          <button
            onClick={() => executeCommand(command)}
            disabled={isLoading}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 transition-colors"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Running...' : 'Execute'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerTerminal;
