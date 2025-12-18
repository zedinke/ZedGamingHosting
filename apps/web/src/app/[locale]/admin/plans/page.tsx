'use client';

import { useEffect, useState } from 'react';
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
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  // const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  // const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a csomagot?')) return;

    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background-default flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-text-secondary mt-4">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-default">
      <div className="container max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">
              Csomagok kezelése
            </h1>
            <p className="text-text-secondary">
              Játékszerver csomagok létrehozása, szerkesztése és törlése
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition"
          >
            + Új csomag
          </button>
        </div>

        {/* Plans Table */}
        <Card className="bg-background-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-elevated border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Csomag
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Játék
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Specifikációk
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Havi ár
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Státusz
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-background-elevated/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-text-primary">
                          {plan.name}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {plan.slug}
                        </p>
                        {plan.isPopular && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded">
                            Népszerű
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-text-secondary">{plan.gameType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-secondary space-y-1">
                        <div>
                          {plan.ramMb >= 1024
                            ? `${plan.ramMb / 1024} GB RAM`
                            : `${plan.ramMb} MB RAM`}
                        </div>
                        <div>{plan.cpuCores} CPU cores</div>
                        <div>{plan.diskGb} GB SSD</div>
                        <div>{plan.maxSlots} slots</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-text-primary">
                          {(plan.monthlyPrice / 100).toLocaleString('hu-HU')} Ft
                        </p>
                        {plan.setupFee > 0 && (
                          <p className="text-sm text-text-secondary">
                            + {(plan.setupFee / 100).toLocaleString('hu-HU')} Ft
                            telepítés
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          plan.status === 'ACTIVE'
                            ? 'bg-green-500/20 text-green-400'
                            : plan.status === 'INACTIVE'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingPlan(plan)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition"
                        >
                          Szerkesztés
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition"
                        >
                          Törlés
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {plans.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-text-secondary">
                Még nincs egy csomag sem. Hozz létre egyet!
              </p>
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card className="p-6 bg-background-surface">
            <p className="text-text-secondary text-sm mb-2">Összes csomag</p>
            <p className="text-3xl font-bold text-text-primary">{plans.length}</p>
          </Card>
          <Card className="p-6 bg-background-surface">
            <p className="text-text-secondary text-sm mb-2">Aktív</p>
            <p className="text-3xl font-bold text-green-400">
              {plans.filter((p) => p.status === 'ACTIVE').length}
            </p>
          </Card>
          <Card className="p-6 bg-background-surface">
            <p className="text-text-secondary text-sm mb-2">Inaktív</p>
            <p className="text-3xl font-bold text-yellow-400">
              {plans.filter((p) => p.status === 'INACTIVE').length}
            </p>
          </Card>
          <Card className="p-6 bg-background-surface">
            <p className="text-text-secondary text-sm mb-2">Népszerű</p>
            <p className="text-3xl font-bold text-primary-400">
              {plans.filter((p) => p.isPopular).length}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
