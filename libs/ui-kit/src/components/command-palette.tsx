'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { Search, Command } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  group?: string;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  items,
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!search) return items;
    const lowerSearch = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerSearch) ||
        item.description?.toLowerCase().includes(lowerSearch)
    );
  }, [items, search]);

  // Group items
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      const group = item.group || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keyboard shortcut (⌘K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // This will be handled by parent component
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/4 z-50 w-full max-w-2xl -translate-x-1/2"
          >
            <div className="glass rounded-xl border border-border shadow-elevation-4 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Search className="h-5 w-5 text-text-tertiary" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary outline-none"
                />
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background-elevated px-1.5 font-mono text-[10px] font-medium text-text-tertiary">
                  <Command className="h-3 w-3" />K
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto p-2">
                {Object.keys(groupedItems).length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                    No results found
                  </div>
                ) : (
                  Object.entries(groupedItems).map(([group, groupItems]) => (
                    <div key={group} className="mb-2">
                      <div className="px-3 py-2 text-xs font-semibold text-text-tertiary uppercase">
                        {group}
                      </div>
                      {groupItems.map((item) => {
                        const globalIndex = filteredItems.indexOf(item);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <motion.button
                            key={item.id}
                            onClick={() => {
                              item.onSelect();
                              onClose();
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                              isSelected
                                ? 'bg-background-elevated text-text-primary'
                                : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary'
                            )}
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.15 }}
                          >
                            {item.icon && (
                              <div className="flex-shrink-0 text-text-tertiary">
                                {item.icon}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{item.label}</div>
                              {item.description && (
                                <div className="text-xs text-text-tertiary truncate">
                                  {item.description}
                                </div>
                              )}
                            </div>
                            {item.shortcut && (
                              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background-elevated px-1.5 font-mono text-[10px] font-medium text-text-tertiary">
                                {item.shortcut}
                              </kbd>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook for using Command Palette
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [items, setItems] = React.useState<CommandItem[]>([]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    setIsOpen,
    items,
    setItems,
  };
};

