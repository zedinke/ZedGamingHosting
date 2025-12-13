'use client';

import { useState } from 'react';
import { Button } from '@zed-hosting/ui-kit';
import { Trash2, Power, PowerOff, RotateCw } from 'lucide-react';

interface BulkActionsProps {
  selectedItems: string[];
  onDelete?: (items: string[]) => void;
  onStart?: (items: string[]) => void;
  onStop?: (items: string[]) => void;
  onRestart?: (items: string[]) => void;
  itemType?: 'server' | 'user' | 'node';
}

export function BulkActions({
  selectedItems,
  onDelete,
  onStart,
  onStop,
  onRestart,
  itemType = 'server',
}: BulkActionsProps) {
  const [loading, setLoading] = useState(false);

  if (selectedItems.length === 0) {
    return null;
  }

  const handleAction = async (action: () => void | Promise<void>) => {
    setLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="glass elevation-3 p-4 rounded-lg flex items-center gap-4 shadow-lg">
        <span style={{ color: '#f8fafc' }}>
          {selectedItems.length} {itemType === 'server' ? 'szerver' : itemType === 'user' ? 'felhasználó' : 'node'} kiválasztva
        </span>
        
        <div className="flex gap-2">
          {onStart && itemType === 'server' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(() => onStart(selectedItems))}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Power className="h-4 w-4" />
              Indítás
            </Button>
          )}
          
          {onStop && itemType === 'server' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(() => onStop(selectedItems))}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <PowerOff className="h-4 w-4" />
              Leállítás
            </Button>
          )}
          
          {onRestart && itemType === 'server' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(() => onRestart(selectedItems))}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Újraindítás
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm(`Biztosan törölni szeretnéd a kiválasztott ${selectedItems.length} ${itemType === 'server' ? 'szervert' : itemType === 'user' ? 'felhasználót' : 'node-ot'}?`)) {
                  handleAction(() => onDelete(selectedItems));
                }
              }}
              disabled={loading}
              className="flex items-center gap-2"
              style={{ color: '#ef4444' }}
            >
              <Trash2 className="h-4 w-4" />
              Törlés
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

