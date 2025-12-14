'use client';

import { Toast } from './toast';
import { useToast } from '../hooks/use-toast';
import { useCallback } from 'react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const handleClose = useCallback((id: number) => {
    removeToast(id);
  }, [removeToast]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => handleClose(toast.id)}
        />
      ))}
    </div>
  );
}

