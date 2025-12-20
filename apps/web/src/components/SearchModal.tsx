'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, X, Gamepad2, Package, BookOpen, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'game' | 'plan' | 'kb' | 'server';
  url: string;
  icon: any;
}

// Mock data - replace with actual API calls
const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Minecraft Hosting',
    description: 'Vanilla és Modded szerverek, Forge, Fabric, Paper támogatás',
    type: 'game',
    url: '/hu/games#minecraft',
    icon: Gamepad2,
  },
  {
    id: '2',
    title: 'Rust Hosting',
    description: 'Teljes szerver kontroll, Oxide/uMod plugin támogatás',
    type: 'game',
    url: '/hu/games#rust',
    icon: Gamepad2,
  },
  {
    id: '3',
    title: 'Starter Csomag',
    description: '2-4 GB RAM, 10 GB NVMe SSD, 2990 Ft/hó',
    type: 'plan',
    url: '/hu/pricing',
    icon: Package,
  },
  {
    id: '4',
    title: 'Pro Csomag',
    description: '8-12 GB RAM, 50 GB NVMe SSD, 5990 Ft/hó',
    type: 'plan',
    url: '/hu/pricing',
    icon: Package,
  },
  {
    id: '5',
    title: 'Szerver telepítése',
    description: 'Hogyan telepíts új game szervert?',
    type: 'kb',
    url: '/hu/knowledge-base/setup',
    icon: BookOpen,
  },
  {
    id: '6',
    title: 'FTP hozzáférés',
    description: 'FTP kapcsolódás és fájlkezelés útmutató',
    type: 'kb',
    url: '/hu/knowledge-base/ftp',
    icon: BookOpen,
  },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      // Mock search - replace with actual API call
      const filtered = mockResults.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSelectedIndex(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        router.push(results[selectedIndex].url);
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [results, selectedIndex, router, onClose]
  );

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.url);
    onClose();
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'game':
        return 'Játék';
      case 'plan':
        return 'Csomag';
      case 'kb':
        return 'Tudásbázis';
      case 'server':
        return 'Szerver';
      default:
        return '';
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'game':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'plan':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'kb':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'server':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Keresés szerverek, játékok, csomagok között..."
                  className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                />
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {results.length > 0 ? (
                  <div className="p-2">
                    {results.map((result, index) => {
                      const Icon = result.icon;
                      const isSelected = index === selectedIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                            isSelected
                              ? 'bg-primary-500/10 border border-primary-500/20'
                              : 'hover:bg-gray-800/50 border border-transparent'
                          }`}
                        >
                          {/* Icon */}
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-primary-500/20' : 'bg-gray-800'
                            }`}
                          >
                            <Icon className="w-6 h-6 text-primary-400" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white truncate">
                                {result.title}
                              </h3>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full border ${getTypeColor(
                                  result.type
                                )}`}
                              >
                                {getTypeLabel(result.type)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {result.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : query.trim() ? (
                  <div className="p-12 text-center">
                    <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Nincs találat erre: "{query}"</p>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
                      <Command className="w-5 h-5" />
                      <span className="text-sm">Gyors keresés</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Kezdj el gépelni szerverek, játékok vagy csomagok kereséséhez
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {results.length > 0 && (
                <div className="p-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">↑</kbd>
                      <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">↓</kbd>
                      navigálás
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">↵</kbd>
                      kiválaszt
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">esc</kbd>
                    bezár
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
