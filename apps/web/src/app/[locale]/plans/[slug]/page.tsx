'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'hourly'>('monthly');

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/plans/public/${slug}`);
        if (!res.ok) {
          router.push('/plans');
          return;
        }
        const data = await res.json();
        setPlan(data);
      } catch (err) {
        console.error('Failed to fetch plan:', err);
        router.push('/plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-default flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-text-secondary mt-4">Csomag betöltése...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const currentPrice =
    billingCycle === 'monthly' ? plan.monthlyPrice : plan.hourlyPrice;

  return (
    <div className="min-h-screen bg-background-default">
      <div className="container max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-text-secondary">
            <Link href="/" className="hover:text-primary-400 transition">
              Főoldal
            </Link>
            <span className="mx-2">/</span>
            <Link href="/plans" className="hover:text-primary-400 transition">
              Csomagok
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text-primary">{plan.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Details */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2 text-text-primary">
                    {plan.name}
                  </h1>
                  <p className="text-xl text-text-secondary uppercase tracking-wide">
                    {plan.gameType}
                  </p>
                </div>
                {plan.isPopular && (
                  <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Népszerű
                  </div>
                )}
              </div>

              {plan.description && (
                <p className="text-lg text-text-secondary leading-relaxed">
                  {plan.description}
                </p>
              )}
            </div>

            {/* Specifications */}
            <Card className="p-8 bg-background-surface mb-8">
              <h2 className="text-2xl font-bold mb-6 text-text-primary">
                Specifikációk
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">💾</span>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">RAM</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {plan.ramMb >= 1024
                        ? `${plan.ramMb / 1024} GB`
                        : `${plan.ramMb} MB`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">CPU</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {plan.cpuCores} {plan.cpuCores > 1 ? 'cores' : 'core'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">📀</span>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Storage</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {plan.diskGb} GB NVMe SSD
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Max Slots</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {plan.maxSlots} játékos
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Features */}
            {plan.features.length > 0 && (
              <Card className="p-8 bg-background-surface">
                <h2 className="text-2xl font-bold mb-6 text-text-primary">
                  Funkciók
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-green-400 mr-3 mt-1 text-lg">✓</span>
                      <span className="text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Order Card */}
          <div className="lg:col-span-1">
            <Card className="p-8 bg-gradient-to-br from-background-surface to-background-elevated border-2 border-primary-500/30 sticky top-24">
              {/* Billing Cycle Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-text-primary">
                  Számlázási ciklus
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`py-2 px-4 rounded-lg font-semibold transition ${
                      billingCycle === 'monthly'
                        ? 'bg-primary-500 text-white'
                        : 'bg-background-elevated text-text-secondary hover:bg-background-elevated/80'
                    }`}
                  >
                    Havi
                  </button>
                  <button
                    onClick={() => setBillingCycle('hourly')}
                    className={`py-2 px-4 rounded-lg font-semibold transition ${
                      billingCycle === 'hourly'
                        ? 'bg-primary-500 text-white'
                        : 'bg-background-elevated text-text-secondary hover:bg-background-elevated/80'
                    }`}
                  >
                    Óránként
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-text-secondary">
                    {billingCycle === 'monthly' ? 'Havi díj' : 'Óradíj'}
                  </span>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-text-primary">
                      {(currentPrice / 100).toLocaleString('hu-HU')}
                    </span>
                    <span className="text-text-secondary ml-2">
                      Ft/{billingCycle === 'monthly' ? 'hó' : 'óra'}
                    </span>
                  </div>
                </div>
                {plan.setupFee > 0 && (
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-text-secondary">Telepítési díj</span>
                    <span className="text-text-secondary">
                      {(plan.setupFee / 100).toLocaleString('hu-HU')} Ft
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-semibold text-text-primary">
                    Első fizetés
                  </span>
                  <span className="text-2xl font-bold text-primary-400">
                    {((currentPrice + plan.setupFee) / 100).toLocaleString(
                      'hu-HU'
                    )}{' '}
                    Ft
                  </span>
                </div>
              </div>

              {/* Order Button */}
              <Link
                href={`/checkout?plan=${plan.slug}&billing=${billingCycle}`}
                className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center py-4 rounded-lg font-bold text-lg transition shadow-lg hover:shadow-xl"
              >
                Megrendelem
              </Link>

              <p className="text-xs text-text-secondary text-center mt-4">
                Kattintással elfogadod az{' '}
                <Link href="/terms" className="text-primary-400 hover:underline">
                  ÁSZF-et
                </Link>{' '}
                és az{' '}
                <Link
                  href="/privacy"
                  className="text-primary-400 hover:underline"
                >
                  Adatvédelmi szabályzatot
                </Link>
                .
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
