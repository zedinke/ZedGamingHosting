'use client';

import { useTranslations } from '@i18n/translations';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@zed-hosting/ui-kit';

interface Plan {
  id: string;
  name: string;
  slug: string;
  gameType: string;
  ramMb: number;
  cpuCores: number;
  diskGb: number;
  maxSlots: number;
  monthlyPrice: number;
  hourlyPrice: number;
  setupFee: number;
  features: string[];
  description: string;
  isPopular: boolean;
}

export function FeaturedPlans() {
  const t = useTranslations();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/plans/public')
      .then((res) => res.json())
      .then((data) => {
        const featured = data.filter((p: Plan) => p.isPopular).slice(0, 3);
        setPlans(featured);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch plans:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-6 bg-background-elevated">
        <div className="container max-w-7xl mx-auto text-center">
          <div className="animate-pulse text-text-secondary">Loading plans...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 bg-background-elevated">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            {t('plans.featured.title')}
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            {t('plans.featured.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="p-8 bg-gradient-to-br from-background-surface to-background-elevated border-2 border-primary-500/30 hover:border-primary-500 transition-all duration-300 relative overflow-hidden group"
            >
              {plan.isPopular && (
                <div className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {t('plans.popular')}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-text-primary">
                  {plan.name}
                </h3>
                <p className="text-text-secondary text-sm uppercase tracking-wide">
                  {plan.gameType}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-text-primary">
                    {(plan.monthlyPrice / 100).toLocaleString('hu-HU')}
                  </span>
                  <span className="text-text-secondary ml-2">Ft/hó</span>
                </div>
                {plan.setupFee > 0 && (
                  <p className="text-sm text-text-secondary mt-1">
                    + {(plan.setupFee / 100).toLocaleString('hu-HU')} Ft telepítési díj
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-text-secondary">
                  <span className="text-primary-400 mr-2">💾</span>
                  {plan.ramMb >= 1024 ? `${plan.ramMb / 1024} GB RAM` : `${plan.ramMb} MB RAM`}
                </div>
                <div className="flex items-center text-text-secondary">
                  <span className="text-primary-400 mr-2">⚡</span>
                  {plan.cpuCores} CPU {plan.cpuCores > 1 ? 'cores' : 'core'}
                </div>
                <div className="flex items-center text-text-secondary">
                  <span className="text-primary-400 mr-2">📀</span>
                  {plan.diskGb} GB NVMe SSD
                </div>
                <div className="flex items-center text-text-secondary">
                  <span className="text-primary-400 mr-2">👥</span>
                  {plan.maxSlots} max slots
                </div>
              </div>

              {plan.features.length > 0 && (
                <div className="mb-8 space-y-2">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-start text-sm text-text-secondary">
                      <span className="text-green-400 mr-2 mt-0.5">✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
              )}

              <Link
                href={`/plans/${plan.slug}`}
                className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center py-3 rounded-lg font-semibold transition group-hover:scale-105"
              >
                {t('plans.selectPlan')}
              </Link>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/plans"
            className="inline-block px-8 py-3 bg-background-surface border-2 border-primary-500 text-primary-400 rounded-lg font-semibold hover:bg-primary-500 hover:text-white transition"
          >
            {t('plans.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
