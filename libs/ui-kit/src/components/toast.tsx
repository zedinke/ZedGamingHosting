'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { X } from 'lucide-react';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  id: _id,
  title,
  description,
  variant = 'info',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for exit animation
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  const variantStyles = {
    success: 'bg-success-500 border-success-600',
    error: 'bg-error-500 border-error-600',
    warning: 'bg-warning-500 border-warning-600',
    info: 'bg-primary-500 border-primary-600',
  };

  const iconColors = {
    success: 'text-success-500',
    error: 'text-error-500',
    warning: 'text-warning-500',
    info: 'text-primary-500',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'min-w-[320px] max-w-md rounded-lg border p-4 shadow-elevation-4',
            'bg-background-elevated border-border',
            variantStyles[variant]
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn('flex-shrink-0', iconColors[variant])}>
              {variant === 'success' && '✓'}
              {variant === 'error' && '✕'}
              {variant === 'warning' && '⚠'}
              {variant === 'info' && 'ℹ'}
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <div className="text-sm font-semibold text-text-primary mb-1">
                  {title}
                </div>
              )}
              {description && (
                <div className="text-sm text-text-secondary">
                  {description}
                </div>
              )}
            </div>
            {onClose && (
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onClose(), 300);
                }}
                className="flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-2',
        positionClasses[position]
      )}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const showToast = React.useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    success: (title: string, description?: string) =>
      showToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) =>
      showToast({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) =>
      showToast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) =>
      showToast({ title, description, variant: 'info' }),
  };
};

