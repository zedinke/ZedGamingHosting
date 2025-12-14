'use client';

import { useState, useEffect } from 'react';
import { Input } from '@zed-hosting/ui-kit';

interface ServerNameInputProps {
  value: string;
  onChange: (value: string) => void;
  gameType?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  label?: string;
}

export function ServerNameInput({
  value,
  onChange,
  gameType,
  placeholder = 'Szerver neve...',
  className = '',
  error,
  label = 'Szerver neve (opcionális)',
}: ServerNameInputProps) {
  const [suggestedName, setSuggestedName] = useState('');

  useEffect(() => {
    if (gameType && !value) {
      const gameTypeNames: Record<string, string> = {
        ARK: 'Ark Server',
        RUST: 'Rust Server',
        MINECRAFT: 'Minecraft Server',
        CS2: 'CS2 Server',
        PALWORLD: 'Palworld Server',
        ATLAS: 'Atlas Server',
      };
      const baseName = gameTypeNames[gameType] || 'Game Server';
      const timestamp = new Date().toLocaleDateString('hu-HU', {
        month: '2-digit',
        day: '2-digit',
      }).replace(/\./g, '-');
      setSuggestedName(`${baseName} ${timestamp}`);
    } else {
      setSuggestedName('');
    }
  }, [gameType, value]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
        {label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${error ? 'border-red-500' : ''}`}
        style={{
          borderColor: error ? '#ef4444' : undefined,
        }}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {suggestedName && !value && !error && (
        <button
          type="button"
          onClick={() => onChange(suggestedName)}
          className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Használd a javasolt nevet: <span className="font-semibold">{suggestedName}</span>
        </button>
      )}
    </div>
  );
}

