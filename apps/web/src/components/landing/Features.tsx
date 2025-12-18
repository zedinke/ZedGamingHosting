'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@zed-hosting/ui-kit';

const FEATURES = [
  {
    icon: '🚀',
    titleKey: 'features.instantDeploy.title',
    descriptionKey: 'features.instantDeploy.description',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: '🛡️',
    titleKey: 'features.ddosProtection.title',
    descriptionKey: 'features.ddosProtection.description',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: '⚡',
    titleKey: 'features.highPerformance.title',
    descriptionKey: 'features.highPerformance.description',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: '💾',
    titleKey: 'features.autoBackups.title',
    descriptionKey: 'features.autoBackups.description',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: '🎮',
    titleKey: 'features.oneClick.title',
    descriptionKey: 'features.oneClick.description',
    gradient: 'from-red-500 to-pink-500'
  },
  {
    icon: '💬',
    titleKey: 'features.support247.title',
    descriptionKey: 'features.support247.description',
    gradient: 'from-indigo-500 to-purple-500'
  }
];

export function Features() {
  const t = useTranslations();

  return (
    <section className="py-20 px-6 bg-background-default">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            {t('features.title')}
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <Card
              key={index}
              className="p-6 bg-gradient-to-br from-background-surface to-background-elevated border border-white/10 hover:border-primary-500/50 transition-all duration-300 hover:scale-105"
            >
              <div className={`text-5xl mb-4 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">
                {t(feature.titleKey)}
              </h3>
              <p className="text-text-secondary">
                {t(feature.descriptionKey)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
