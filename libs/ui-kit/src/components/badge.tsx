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
            'bg-background-elevated text-text-primary border-border':
              variant === 'default',
            'bg-success-500/10 text-success-500 border-success-500/20': variant === 'success',
            'bg-error-500/10 text-error-500 border-error-500/20': variant === 'danger',
            'bg-warning-500/10 text-warning-500 border-warning-500/20': variant === 'warning',
            'bg-primary-500/10 text-primary-500 border-primary-500/20': variant === 'info',
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

