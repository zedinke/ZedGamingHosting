'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, Badge, Button, Input } from '@zed-hosting/ui-kit';
import { Download, Filter, RefreshCcw } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface Invoice {
  id: string;
  totalAmount: number;
  currency: string;
  paidAt: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    tenant?: {
      id: string;
      name: string;
    };
  };
  plan: {
    id: string;
    name: string;
  };
}

interface InvoiceListResponse {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminInvoicesPage() {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    tenantId: '',
    minAmount: '',
    maxAmount: '',
    page: 1,
    limit: 50,
    sortBy: 'paidAt' as 'paidAt' | 'createdAt' | 'totalAmount',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const { data: invoicesData, isLoading, refetch } = useQuery<InvoiceListResponse>({
    queryKey: ['admin', 'invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      const res = await apiClient.get(`/admin/invoices?${params.toString()}`);
      return res.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin', 'invoices', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/invoices/stats');
      return res.data;
    },
  });

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const response = await apiClient.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency || 'HUF',
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Számlák</h1>
        <p className="text-gray-400 mt-2">
          Kifizetett rendelések és számlák kezelése
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Összes számla</div>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Összes bevétel</div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue, 'HUF')}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Legutóbbi hónap</div>
            <div className="text-2xl font-bold">
              {stats.revenueByMonth?.[0]
                ? formatCurrency(Number(stats.revenueByMonth[0].revenue), 'HUF')
                : '0 Ft'}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stats.revenueByMonth?.[0]?.count || 0} számla
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Szűrők</h2>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium block mb-1">Dátumtól</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Dátumig</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Min összeg</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Max összeg</label>
              <Input
                type="number"
                placeholder="Nincs limit"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value, page: 1 })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={filters.sortBy}
              onChange={(e: any) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-3 py-2 border border-gray-700 rounded bg-gray-800 text-white"
            >
              <option value="paidAt">Fizetés dátuma</option>
              <option value="createdAt">Létrehozás dátuma</option>
              <option value="totalAmount">Összeg</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e: any) => setFilters({ ...filters, sortOrder: e.target.value })}
              className="px-3 py-2 border border-gray-700 rounded bg-gray-800 text-white"
            >
              <option value="desc">Csökkenő</option>
              <option value="asc">Növekvő</option>
            </select>

            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Frissítés
            </Button>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Számlák listája</h2>
        <p className="text-gray-400 mb-4">
          {invoicesData?.pagination.total || 0} számla összesen
        </p>
        {isLoading ? (
          <div className="text-center py-8">Betöltés...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Számla ID</th>
                    <th className="text-left py-3 px-4">Felhasználó</th>
                    <th className="text-left py-3 px-4">Csomag</th>
                    <th className="text-left py-3 px-4">Összeg</th>
                    <th className="text-left py-3 px-4">Fizetve</th>
                    <th className="text-left py-3 px-4">Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesData?.data.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="py-3 px-4 font-mono text-sm">
                        {invoice.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{invoice.user.email}</div>
                          {invoice.user.tenant && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {invoice.user.tenant.name}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{invoice.plan.name}</td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {new Date(invoice.paidAt).toLocaleDateString('hu-HU')}
                          <div className="text-xs text-gray-400">
                            {formatDistance(new Date(invoice.paidAt), new Date(), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Letöltés
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {invoicesData && invoicesData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-400">
                  {filters.page}. oldal / {invoicesData.pagination.totalPages} összesen
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page === 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    Előző
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page >= invoicesData.pagination.totalPages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    Következő
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
