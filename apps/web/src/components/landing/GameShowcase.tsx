'use client';

import { useTranslations, useLocale } from '@i18n/translations';
import Link from 'next/link';
import { Card } from '@zed-hosting/ui-kit';

const GAMES = [
  {
    id: 'MINECRAFT',
    icon: '⛏️',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'RUST',
    icon: '🏹',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    id: 'CS2',
    icon: '🎯',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'PALWORLD',
    icon: '🦊',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    id: 'ARK',
    icon: '🦖',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'ATLAS',
    icon: '⚓',
    gradient: 'from-sky-500 to-blue-600',
  }
];

export function GameShowcase() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="py-20 px-6 bg-background-default">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            {t('games.title')}
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            {t('games.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => (
            <Link key={game.id} href={`/${locale}/plans?game=${game.id}`}>
              <Card className="group p-6 hover:scale-105 transition-all duration-300 cursor-pointer h-full bg-gradient-to-br from-background-surface to-background-elevated border border-white/10 hover:border-primary-500/50">
                <div className={`text-6xl mb-4 bg-gradient-to-br ${game.gradient} bg-clip-text text-transparent`}>
                  {game.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2 text-text-primary group-hover:text-primary-400 transition">
                  {t(`games.name.${game.id}`)}
                </h3>
                <p className="text-text-secondary">
                  {t(`games.description.${game.id}`)}
                </p>
                <div className="mt-4 flex items-center text-primary-400 font-semibold group-hover:translate-x-2 transition-transform">
                  {t('games.viewPlans')} >
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
