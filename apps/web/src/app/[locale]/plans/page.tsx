'use client';

// import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

const GAME_TYPES = ['MINECRAFT', 'RUST', 'CS2', 'PALWORLD', 'ARK', 'ATLAS'];

export default function PlansPage() {
  // const t = useTranslations();
  const searchParams = useSearchParams();
  const gameFilter = searchParams.get('game');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(gameFilter);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const url = selectedGame
          ? `/api/plans/public/game/${selectedGame}`
          : '/api/plans/public';
        const res = await fetch(url);
        const data = await res.json();
        setPlans(data);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [selectedGame]);

  const filteredPlans = plans.filter((plan) => {
    const price = plan.monthlyPrice / 100;
    return price >= priceRange[0] && price <= priceRange[1];
  });

  return (
    <div className="min-h-screen bg-background-default">
      <div className="container max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            Hosting Csomagok
          </h1>
          <p className="text-xl text-text-secondary">
            Válassz a nagy teljesítményű game server csomagjaink közül
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-background-surface sticky top-24">
              <h3 className="text-xl font-bold mb-4 text-text-primary">
                Szűrők
              </h3>

              {/* Game Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-text-primary">
                  Játék típus
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedGame(null)}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      selectedGame === null
                        ? 'bg-primary-500 text-white'
                        : 'bg-background-elevated text-text-secondary hover:bg-background-elevated/80'
                    }`}
                  >
                    Összes
                  </button>
                  {GAME_TYPES.map((game) => (
                    <button
                      key={game}
                      onClick={() => setSelectedGame(game)}
                      className={`w-full text-left px-3 py-2 rounded transition ${
                        selectedGame === game
                          ? 'bg-primary-500 text-white'
                          : 'bg-background-elevated text-text-secondary hover:bg-background-elevated/80'
                      }`}
                    >
                      {game}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-text-primary">
                  Ár (Ft/hó)
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="20000"
                    step="500"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-text-secondary">
                    <span>{priceRange[0].toLocaleString('hu-HU')} Ft</span>
                    <span>{priceRange[1].toLocaleString('hu-HU')} Ft</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Plans Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="text-text-secondary mt-4">Csomagok betöltése...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-secondary text-lg">
                  Nem található csomag a kiválasztott szűrőkkel.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className="p-6 bg-gradient-to-br from-background-surface to-background-elevated border border-white/10 hover:border-primary-500/50 transition-all duration-300 hover:scale-105 relative"
                  >
                    {plan.isPopular && (
                      <div className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Népszerű
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-1 text-text-primary">
                        {plan.name}
                      </h3>
                      <p className="text-text-secondary text-sm uppercase tracking-wide">
                        {plan.gameType}
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-text-primary">
                          {(plan.monthlyPrice / 100).toLocaleString('hu-HU')}
                        </span>
                        <span className="text-text-secondary ml-2">Ft/hó</span>
                      </div>
                      {plan.setupFee > 0 && (
                        <p className="text-sm text-text-secondary mt-1">
                          + {(plan.setupFee / 100).toLocaleString('hu-HU')} Ft
                          telepítési díj
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-sm text-text-secondary">
                        <span className="text-primary-400 mr-2">💾</span>
                        {plan.ramMb >= 1024
                          ? `${plan.ramMb / 1024} GB RAM`
                          : `${plan.ramMb} MB RAM`}
                      </div>
                      <div className="flex items-center text-sm text-text-secondary">
                        <span className="text-primary-400 mr-2">⚡</span>
                        {plan.cpuCores} CPU {plan.cpuCores > 1 ? 'cores' : 'core'}
                      </div>
                      <div className="flex items-center text-sm text-text-secondary">
                        <span className="text-primary-400 mr-2">📀</span>
                        {plan.diskGb} GB NVMe SSD
                      </div>
                      <div className="flex items-center text-sm text-text-secondary">
                        <span className="text-primary-400 mr-2">👥</span>
                        {plan.maxSlots} max slots
                      </div>
                    </div>

                    {plan.features.length > 0 && (
                      <div className="mb-6 space-y-1.5">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-start text-xs text-text-secondary"
                          >
                            <span className="text-green-400 mr-2 mt-0.5">✓</span>
                            {feature}
                          </div>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/plans/${plan.slug}`}
                      className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center py-2.5 rounded-lg font-semibold transition"
                    >
                      Részletek megtekintése
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
