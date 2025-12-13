import * as React from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-app)]',
          'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Primary - Modern Blue
            'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg focus-visible:ring-[var(--color-primary)]':
              variant === 'primary',
            // Secondary - Subtle Gray
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-main)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] focus-visible:ring-[var(--color-border-light)]':
              variant === 'secondary',
            // Destructive - Red
            'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-light)] shadow-md hover:shadow-lg focus-visible:ring-[var(--color-danger)]':
              variant === 'destructive',
            // Outline - Transparent with border
            'border border-[var(--color-border-light)] bg-transparent text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] focus-visible:ring-[var(--color-primary)]':
              variant === 'outline',
            // Ghost - No background
            'text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] focus-visible:ring-[var(--color-border-light)]':
              variant === 'ghost',
            // Sizes
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };


