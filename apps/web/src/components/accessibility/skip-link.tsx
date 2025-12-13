'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'absolute -top-10 left-0 z-[100] bg-primary-500 text-white px-4 py-2 rounded-md',
        'focus:top-4 focus:left-4 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className
      )}
    >
      {children}
    </a>
  );
}

