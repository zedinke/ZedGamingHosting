'use client';

// Simple routing without next-intl for now
// This avoids webpack createClientModuleProxy errors
import { useRouter as useNextRouter } from 'next/navigation';
import { usePathname as useNextPathname } from 'next/navigation';
import React from 'react';
import NextLink from 'next/link';

export const routing = {
  locales: ['hu', 'en'],
  defaultLocale: 'hu',
  localePrefix: 'as-needed',
};

// Re-export Next.js navigation functions directly
export const useRouter = useNextRouter;
export const usePathname = useNextPathname;

export const redirect = (path: string) => {
  // Fallback redirect
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
};

export const Link = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => {
  return React.createElement(NextLink, { href, ...props }, children);
};


