'use client';

import { useState } from 'react';
import { getServerTranslations, Locale, useLocale } from '@i18n/translations';
import Link from 'next/link';
import { Check, X, Zap, Shield, Users, HardDrive, Cpu, Server } from 'lucide-react';

const pricingTiers = [
  {
    name: 'Starter',
    price: 2990,
    description: 'Tökéletes kis közösségeknek és kezdőknek',
    color: 'from-blue-500 to-blue-600',
    features: {
      ram: '2-4 GB',
      cpu: '2 vCPU',
      storage: '10 GB NVMe SSD',
      backup: 'Napi automatikus',
      ddos: true,
      support: '24/7 Email',
      mods: true,
      players: '10-20',
      uptime: '99.5%',
      priority: false,
      dedicated: false,
    },
    recommended: false,
  },
  {
    name: 'Pro',
    price: 5990,
    description: 'Közösségek és közepes szerverek',
    color: 'from-primary-500 to-primary-600',
    features: {
      ram: '8-12 GB',
      cpu: '4 vCPU',
      storage: '50 GB NVMe SSD',
      backup: 'Napi + Heti',
      ddos: true,
      support: '24/7 Chat & Email',
      mods: true,
      players: '50-100',
      uptime: '99.9%',
      priority: true,
      dedicated: false,
    },
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: 14990,
    description: 'Nagy közösségek és professzionális szerverek',
    color: 'from-purple-500 to-purple-600',
    features: {
      ram: '16-32 GB',
      cpu: '8 vCPU',
      storage: '200 GB NVMe SSD',
      backup: 'Óránként + Custom',
      ddos: true,
      support: '24/7 Priority Support',
      mods: true,
      players: '200+',
      uptime: '99.99%',
      priority: true,
      dedicated: true,
    },
    recommended: false,
  },
];

const featuresList = [
  { key: 'ram', label: 'RAM', icon: Cpu },
  { key: 'cpu', label: 'CPU Mag', icon: Server },
  { key: 'storage', label: 'Tárhely', icon: HardDrive },
  { key: 'players', label: 'Max Játékosok', icon: Users },
  { key: 'uptime', label: 'Uptime Garancia', icon: Zap },
  { key: 'backup', label: 'Mentések', icon: Shield },
  { key: 'ddos', label: 'DDoS Védelem', icon: Shield, boolean: true },
  { key: 'mods', label: 'Mod/Plugin Támogatás', icon: Zap, boolean: true },
  { key: 'priority', label: 'Priority Support', icon: Users, boolean: true },
  { key: 'dedicated', label: 'Dedikált Erőforrások', icon: Server, boolean: true },
];

export default function PricingPage({ params }: { params: { locale: Locale } }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
              💰 Átlátható Árazás
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
              Válaszd Ki a <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Megfelelő Csomagot</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Nincs rejtett költség. Nincs setup díj. Bármikor lemondható.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm p-2 rounded-full border border-gray-700">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Havi
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full font-semibold transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Éves
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6 bg-gray-950">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingTiers.map((tier) => {
              const finalPrice = billingCycle === 'yearly' ? Math.round(tier.price * 0.8) : tier.price;
              
              return (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl border ${
                    tier.recommended
                      ? 'border-primary-500 shadow-xl shadow-primary-500/20 scale-105'
                      : 'border-gray-700/50'
                  } bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden group hover:shadow-2xl transition-all`}
                >
                  {/* Recommended Badge */}
                  {tier.recommended && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-4 py-2 rounded-bl-xl">
                      AJÁNLOTT
                    </div>
                  )}

                  {/* Gradient Accent */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

                  <div className="relative p-8">
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                      <p className="text-gray-400 text-sm">{tier.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold text-white">
                          {finalPrice.toLocaleString('hu-HU')}
                        </span>
                        <span className="text-gray-400">Ft / {billingCycle === 'monthly' ? 'hó' : 'év'}</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-sm text-green-400 mt-2">
                          Éves számlázással {(tier.price * 12 * 0.2).toLocaleString('hu-HU')} Ft megtakarítás!
                        </p>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8">
                      {Object.entries(tier.features).map(([key, value]) => {
                        const feature = featuresList.find((f) => f.key === key);
                        if (!feature) return null;
                        
                        const Icon = feature.icon;
                        const isBoolean = feature.boolean;

                        return (
                          <li key={key} className="flex items-center gap-3 text-sm">
                            {isBoolean ? (
                              value ? (
                                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                              ) : (
                                <X className="w-5 h-5 text-gray-600 flex-shrink-0" />
                              )
                            ) : (
                              <Icon className="w-5 h-5 text-primary-400 flex-shrink-0" />
                            )}
                            <span className={value ? 'text-gray-300' : 'text-gray-600'}>
                              <span className="font-semibold text-white">{feature.label}:</span>{' '}
                              {isBoolean ? (value ? 'Igen' : 'Nem') : value}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* CTA */}
                    <Link
                      href={`/hu/plans`}
                      className={`block w-full text-center px-6 py-4 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 ${
                        tier.recommended
                          ? `bg-gradient-to-r ${tier.color} text-white hover:shadow-primary-500/50`
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                    >
                      Indulás →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">
            Részletes Összehasonlítás
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-400 font-semibold">Funkció</th>
                  {pricingTiers.map((tier) => (
                    <th key={tier.name} className="p-4 text-center">
                      <div className={`inline-block px-4 py-2 rounded-lg bg-gradient-to-r ${tier.color} text-white font-bold`}>
                        {tier.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featuresList.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <tr key={feature.key} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 text-white font-medium flex items-center gap-3">
                        <Icon className="w-5 h-5 text-primary-400" />
                        {feature.label}
                      </td>
                      {pricingTiers.map((tier) => {
                        const value = tier.features[feature.key as keyof typeof tier.features];
                        return (
                          <td key={tier.name} className="p-4 text-center">
                            {feature.boolean ? (
                              value ? (
                                <Check className="w-6 h-6 text-green-400 mx-auto" />
                              ) : (
                                <X className="w-6 h-6 text-gray-600 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-300">{value}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-900/20 to-fuchsia-900/20">
        <div className="container text-center max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Kérdésed van az árakkal kapcsolatban?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Segítünk kiválasztani a számodra legmegfelelőbb csomagot!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/hu/dashboard/support"
              className="px-10 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold text-lg rounded-lg shadow-xl hover:shadow-primary-500/50 transition-all transform hover:scale-105"
            >
              Kapcsolatfelvétel
            </Link>
            <Link
              href="/hu/knowledge-base"
              className="px-10 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg rounded-lg shadow-xl transition-all transform hover:scale-105"
            >
              Tudásbázis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
