'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Card } from '@zed-hosting/ui-kit';
import { BackButton } from '../../../../components/back-button';

const GAME_TYPES = ['MINECRAFT', 'RUST', 'CS2', 'PALWORLD', 'ARK', 'ATLAS'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];

type FormState = {
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
  featuresText: string;
  description: string;
  isPopular: boolean;
  sortOrder: number;
  status: string;
};

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
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emptyForm: FormState = useMemo(
    () => ({
      name: '',
      slug: '',
      gameType: GAME_TYPES[0],
      ramMb: 2048,
      cpuCores: 2,
      diskGb: 20,
      maxSlots: 10,
      monthlyPrice: 0,
      hourlyPrice: 0,
      setupFee: 0,
      featuresText: '',
      description: '',
      isPopular: false,
      sortOrder: plans.length + 1,
      status: 'ACTIVE',
    }),
    [plans.length],
  );
  const [form, setForm] = useState<FormState>(emptyForm);

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

  const handleInput = (key: keyof FormState, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const startCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
  };

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      gameType: plan.gameType,
      ramMb: plan.ramMb,
      cpuCores: plan.cpuCores,
      diskGb: plan.diskGb,
      maxSlots: plan.maxSlots,
      monthlyPrice: plan.monthlyPrice,
      hourlyPrice: plan.hourlyPrice,
      setupFee: plan.setupFee,
      featuresText: (plan.features || []).join('\n'),
      description: plan.description || '',
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder ?? 0,
      status: plan.status,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const features = form.featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      gameType: form.gameType,
      ramMb: Number(form.ramMb),
      cpuCores: Number(form.cpuCores),
      diskGb: Number(form.diskGb),
      maxSlots: Number(form.maxSlots),
      monthlyPrice: Number(form.monthlyPrice),
      hourlyPrice: Number(form.hourlyPrice),
      setupFee: Number(form.setupFee),
      features,
      description: form.description,
      isPopular: Boolean(form.isPopular),
      sortOrder: Number(form.sortOrder) || 0,
      status: form.status,
    };

    try {
      const method = editingPlan ? 'PUT' : 'POST';
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Hiba mentés közben');
      }

      await fetchPlans();
      startCreate();
    } catch (err) {
      console.error('Save failed', err);
      alert('Hiba a mentésnél. Részletek a konzolon.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a csomagot?')) return;

    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  if (loading) {
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
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/admin" />
            <h1 className="text-4xl font-bold text-text-primary mb-2">
              Csomagok kezelése
            </h1>
            <p className="text-text-secondary">
              Játékszerver csomagok létrehozása, szerkesztése és törlése
            </p>
          </div>
          <button
            onClick={startCreate}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition"
          >
            + Új csomag
          </button>
        </div>

        {/* Editor */}
        <Card className="mb-8 p-6 bg-background-surface">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Név</label>
              <input
                className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                value={form.name}
                onChange={(e) => handleInput('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Slug</label>
              <input
                className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                value={form.slug}
                onChange={(e) => handleInput('slug', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Játék</label>
              <select
                className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                value={form.gameType}
                onChange={(e) => handleInput('gameType', e.target.value)}
              >
                {GAME_TYPES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Státusz</label>
              <select
                className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                value={form.status}
                onChange={(e) => handleInput('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-text-secondary mb-1">RAM (MB)</label>
                <input
                  type="number"
                  className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                  value={form.ramMb}
                  onChange={(e) => handleInput('ramMb', Number(e.target.value))}
                  min={256}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">CPU (mag)</label>
                <input
                  type="number"
                  className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                  value={form.cpuCores}
                  onChange={(e) => handleInput('cpuCores', Number(e.target.value))}
                  min={1}
                  step={0.5}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Lemez (GB)</label>
                <input
                  type="number"
                  className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                  value={form.diskGb}
                  onChange={(e) => handleInput('diskGb', Number(e.target.value))}
                  min={5}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Slot</label>
                <input
                  type="number"
                  className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                  value={form.maxSlots}
                  onChange={(e) => handleInput('maxSlots', Number(e.target.value))}
                  min={1}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Havi ár (Ft, bruttó fillér)</label>
                <input
                  type="number"
                  className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                  value={form.monthlyPrice}
                  onChange={(e) => handleInput('monthlyPrice', Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Órás ár (Ft, bruttó fillér)</label>
                <input
                  type="number"
                  className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                  value={form.hourlyPrice}
                  onChange={(e) => handleInput('hourlyPrice', Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Belépési díj (Ft, bruttó fillér)</label>
                <input
                  type="number"
                  className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                  value={form.setupFee}
                  onChange={(e) => handleInput('setupFee', Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Sorrend</label>
                <input
                  type="number"
                  className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                  value={form.sortOrder}
                  onChange={(e) => handleInput('sortOrder', Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-text-secondary mb-1">Leírás</label>
              <textarea
                className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                value={form.description}
                onChange={(e) => handleInput('description', e.target.value)}
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-text-secondary mb-1">Funkciók (soronként egy)</label>
              <textarea
                className="w-full rounded border border-white/10 bg-background-elevated px-3 py-2"
                value={form.featuresText}
                onChange={(e) => handleInput('featuresText', e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="isPopular"
                type="checkbox"
                checked={form.isPopular}
                onChange={(e) => handleInput('isPopular', e.target.checked)}
              />
              <label htmlFor="isPopular" className="text-sm text-text-secondary">
                Népszerű csomag
              </label>
            </div>
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white rounded-lg font-semibold"
              >
                {submitting ? 'Mentés...' : editingPlan ? 'Módosítás mentése' : 'Új csomag mentése'}
              </button>
              {editingPlan && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="px-4 py-2 border border-white/20 text-text-secondary rounded-lg"
                >
                  Mégse
                </button>
              )}
            </div>
          </form>
        </Card>

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
                          onClick={() => startEdit(plan)}
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
