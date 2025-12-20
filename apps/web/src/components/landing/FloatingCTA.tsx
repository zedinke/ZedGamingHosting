'use client';

import { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling down 500px
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Link
            href="/plans"
            className="group relative flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-full shadow-2xl hover:shadow-primary-500/50 transition-all transform hover:scale-105"
          >
            {/* Pulse Animation */}
            <span className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-75" />
            
            {/* Content */}
            <div className="relative flex items-center gap-2">
              <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline">Rendelj Most!</span>
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400/50 to-primary-600/50 blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
