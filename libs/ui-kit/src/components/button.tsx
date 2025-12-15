'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../utils/cn';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const buttonVariants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-app)]',
          'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Primary - Sky Blue (2025 Modern)
            'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg focus-visible:ring-[var(--color-primary)]':
              variant === 'primary',
            // Secondary - Subtle Gray
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-main)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] focus-visible:ring-[var(--color-border-light)]':
              variant === 'secondary',
            // Destructive - Red
            'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-light)] shadow-md hover:shadow-lg focus-visible:ring-[var(--color-danger)]':
              variant === 'destructive',
            // Outline - Transparent with border
            'border border-[var(--color-border)] bg-transparent text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] focus-visible:ring-[var(--color-primary)]':
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
        disabled={isDisabled}
        variants={buttonVariants}
        whileHover={!isDisabled ? 'hover' : undefined}
        whileTap={!isDisabled ? 'tap' : undefined}
        {...(props as any)}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export { Button };


