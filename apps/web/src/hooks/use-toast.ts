'use client';

import { useState, useCallback } from 'react';
import { Toast } from '../components/toast';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  id: number;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = toastId++;
    setToasts((prev) => [...prev, { message, type, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { showToast, removeToast, toasts };
}

