import * as React from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium',
          'border transition-colors',
          {
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-main)] border-[var(--color-border)]':
              variant === 'default',
            'bg-green-500/10 text-green-400 border-green-500/20': variant === 'success',
            'bg-red-500/10 text-red-400 border-red-500/20': variant === 'danger',
            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': variant === 'warning',
            'bg-blue-500/10 text-blue-400 border-blue-500/20': variant === 'info',
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-3 py-1 text-sm': size === 'md',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };

