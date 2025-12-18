'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Card, Button, Input, Badge } from '@zed-hosting/ui-kit';
import { useRouter } from '../../../../i18n/routing';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { BackButton } from '../../../../components/back-button';
import { apiClient } from '../../../../lib/api-client';

type PromotionScope = 'GLOBAL' | 'GAME' | 'PLAN';
type GameType = 'MINECRAFT' | 'RUST' | 'CS2' | 'PALWORLD' | 'ARK' | 'ATLAS';

interface Promotion {
  id: string;
  name: string;
  description?: string;
  scope: PromotionScope;
  discountPercent: number;
  gameType?: GameType;
  planId?: string;
  startDate: string;
  endDate?: string;
  active: boolean;
}

interface PlanOption {
  id: string;
  name: string;
  gameType: GameType;
}

interface PromotionForm {
  name: string;
  description: string;
  scope: PromotionScope;
  gameType: GameType | '';
  planId: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

const GAME_TYPES: GameType[] = ['MINECRAFT', 'RUST', 'CS2', 'PALWORLD', 'ARK', 'ATLAS'];

const createEmptyForm = (): PromotionForm => ({
  name: '',
  description: '',
  scope: 'GLOBAL',
  gameType: '',
  planId: '',
  discountPercent: 10,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  active: true,
});

const toInputDate = (value?: string) => (value ? value.slice(0, 10) : '');

export default function PromotionsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'hu';
  const { user, isAuthenticated, accessToken } = useAuthStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionForm>(createEmptyForm());

  const isAdmin = useMemo(() => {
    const role = user?.role?.toUpperCase();
    return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPERADMIN' || role === 'RESELLER_ADMIN';
  }, [user]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isHydrated, isAdmin, router]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    apiClient.setAccessToken(accessToken);
    void loadData();
  }, [accessToken, isAuthenticated, isHydrated]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [promoData, planData] = await Promise.all([
        apiClient.get<Promotion[]>('/promotions'),
        apiClient.get<PlanOption[]>('/plans'),
      ]);

      setPromotions(promoData);
      setPlans((planData || []).map((p) => ({ id: p.id, name: p.name, gameType: p.gameType })));
    } catch (err) {
      console.error('Failed to load promotions', err);
      setError('Nem sikerült betölteni az akciókat.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      scope: form.scope,
      discountPercent: Number(form.discountPercent),
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      active: form.active,
    };

    if (form.scope === 'GAME') {
      payload.gameType = form.gameType;
    }

    if (form.scope === 'PLAN') {
      payload.planId = form.planId;
    }

    try {
      if (editingId) {
        await apiClient.put(`/promotions/${editingId}`, payload);
      } else {
        await apiClient.post('/promotions', payload);
      }

      await loadData();
      resetForm();
    } catch (err) {
      console.error('Failed to save promotion', err);
      setError('Mentés nem sikerült. Ellenőrizd az adatokat.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törlöd az akciót?')) return;

    try {
      await apiClient.delete(`/promotions/${id}`);
      await loadData();
    } catch (err) {
      console.error('Failed to delete promotion', err);
      setError('Törlés nem sikerült.');
    }
  };

  const handleToggle = async (promo: Promotion) => {
    try {
      await apiClient.put(`/promotions/${promo.id}`, { active: !promo.active });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle promotion', err);
      setError('Nem sikerült módosítani az akció állapotát.');
    }
  };

  const handleEdit = (promo: Promotion) => {
    setEditingId(promo.id);
    setForm({
      name: promo.name,
      description: promo.description || '',
      scope: promo.scope,
      gameType: promo.scope === 'GAME' ? (promo.gameType || '') : '',
      planId: promo.scope === 'PLAN' ? promo.planId || '' : '',
      discountPercent: promo.discountPercent,
      startDate: toInputDate(promo.startDate),
      endDate: toInputDate(promo.endDate),
      active: promo.active,
    });
  };

  if (!isHydrated || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminLayout title="Akciók">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Akció beállítások</h1>
            <p className="text-text-muted">Kedvezmények mindenre, játékokra vagy csomagokra.</p>
          </div>
          <BackButton fallbackHref={`/${locale}/admin`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold text-text-primary mb-4">{editingId ? 'Akció szerkesztése' : 'Új akció'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-text-muted block mb-1">Név *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Pl. Téli akció"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-text-muted block mb-1">Leírás</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Rövid megjegyzés"
                />
              </div>

              <div>
                <label className="text-sm text-text-muted block mb-1">Scope *</label>
                <select
                  value={form.scope}
                  onChange={(e) => {
                    const scope = e.target.value as PromotionScope;
                    setForm({
                      ...form,
                      scope,
                      gameType: scope === 'GAME' ? form.gameType : '',
                      planId: scope === 'PLAN' ? form.planId : '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)' }}
                >
                  <option value="GLOBAL">Mindenre</option>
                  <option value="GAME">Játék típus</option>
                  <option value="PLAN">Csomag</option>
                </select>
              </div>

              {form.scope === 'GAME' && (
                <div>
                  <label className="text-sm text-text-muted block mb-1">Játék *</label>
                  <select
                    value={form.gameType}
                    onChange={(e) => setForm({ ...form, gameType: e.target.value as GameType })}
                    className="w-full px-3 py-2 rounded border text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)' }}
                    required
                  >
                    <option value="" disabled>Válassz játékot</option>
                    {GAME_TYPES.map((game) => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.scope === 'PLAN' && (
                <div>
                  <label className="text-sm text-text-muted block mb-1">Csomag *</label>
                  <select
                    value={form.planId}
                    onChange={(e) => setForm({ ...form, planId: e.target.value })}
                    className="w-full px-3 py-2 rounded border text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)' }}
                    required
                  >
                    <option value="" disabled>Válassz csomagot</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.gameType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm text-text-muted block mb-1">Kedvezmény (%) *</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-text-muted block mb-1">Kezdés *</label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1">Vége (opcionális)</label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <span className="text-sm text-text-muted">Aktív</span>
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                  {submitting ? 'Mentés...' : editingId ? 'Módosítás mentése' : 'Akció mentése'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm} className="w-full">
                    Mégse
                  </Button>
                )}
              </div>
            </form>

            {error && (
              <div className="mt-3 text-sm text-red-400" role="alert">
                {error}
              </div>
            )}
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Akciók</h2>
                <p className="text-sm text-text-muted">Összesen: {promotions.length}</p>
              </div>
              <div className="text-sm text-text-muted">{loading ? 'Betöltés...' : ''}</div>
            </div>

            {promotions.length === 0 ? (
              <p className="text-text-muted">Még nincs akció.</p>
            ) : (
              <div className="space-y-3">
                {promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-semibold text-text-primary">{promo.name}</h3>
                        <Badge variant={promo.active ? 'success' : 'default'} size="sm">{promo.active ? 'Aktív' : 'Inaktív'}</Badge>
                        <Badge variant="default" size="sm">{promo.scope}</Badge>
                        <Badge variant="info" size="sm">{promo.discountPercent}%</Badge>
                      </div>
                      <p className="text-sm text-text-muted">
                        {promo.scope === 'GLOBAL' && 'Minden csomagra érvényes'}
                        {promo.scope === 'GAME' && promo.gameType && `Játék: ${promo.gameType}`}
                        {promo.scope === 'PLAN' && promo.planId && `Cél csomag: ${plans.find((p) => p.id === promo.planId)?.name || promo.planId}`}
                      </p>
                      <p className="text-xs text-text-muted">
                        Kezdés: {format(new Date(promo.startDate), 'yyyy.MM.dd')}
                        {promo.endDate ? ` • Vége: ${format(new Date(promo.endDate), 'yyyy.MM.dd')}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggle(promo)}>
                        {promo.active ? 'Kikapcsol' : 'Bekapcsol'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(promo)}>
                        Szerkesztés
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(promo.id)}>
                        Törlés
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}
