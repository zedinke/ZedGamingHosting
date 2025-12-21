"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LayoutDashboard, LogIn } from "lucide-react";
import { Locale } from "@i18n/translations";

interface HeaderBarProps {
  locale: Locale;
}

const NAV_ITEMS = [
  { href: "#plans", label: "Csomagok" },
  { href: "#features", label: "Funkciok" },
  { href: "#contact", label: "Kapcsolat" },
];

export function HeaderBar({ locale }: HeaderBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-background-surface/80 border-b border-white/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg">Z</span>
          </div>
          <div className="leading-tight">
            <div className="text-lg font-semibold text-text-primary">ZedGaming</div>
            <div className="text-sm text-text-muted">Game Server Hosting</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-text-secondary hover:text-primary-400 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href={`/${locale}/login`}
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition"
          >
            <LogIn className="w-4 h-4" />
            Belepes
          </Link>
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-transform hover:-translate-y-0.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            Iranyitopult
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-text-primary"
          aria-label="Menu megnyitasa"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-background-surface/95 backdrop-blur">
          <nav className="px-4 py-3 flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-text-secondary hover:text-primary-400 transition-colors"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-white/10" />
            <Link
              href={`/${locale}/login`}
              className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition"
              onClick={() => setOpen(false)}
            >
              <LogIn className="w-4 h-4" />
              Belepes
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/30"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="w-4 h-4" />
              Iranyitopult
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
