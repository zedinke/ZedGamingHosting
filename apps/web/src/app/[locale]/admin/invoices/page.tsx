'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Számlák</h1>
        <p className="text-muted-foreground mt-2">
          Kifizetett rendelések és számlák kezelése
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Összes számla</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Összes bevétel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue, 'HUF')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Legutóbbi hónap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.revenueByMonth?.[0]
                  ? formatCurrency(Number(stats.revenueByMonth[0].revenue), 'HUF')
                  : '0 Ft'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.revenueByMonth?.[0]?.count || 0} számla
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Szűrők
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Dátumtól</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Dátumig</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Min összeg</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max összeg</label>
              <Input
                type="number"
                placeholder="Nincs limit"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value, page: 1 })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select
              value={filters.sortBy}
              onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paidAt">Fizetés dátuma</SelectItem>
                <SelectItem value="createdAt">Létrehozás dátuma</SelectItem>
                <SelectItem value="totalAmount">Összeg</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortOrder}
              onValueChange={(value: any) => setFilters({ ...filters, sortOrder: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Csökkenő</SelectItem>
                <SelectItem value="asc">Növekvő</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Frissítés
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Számlák listája</CardTitle>
          <CardDescription>
            {invoicesData?.pagination.total || 0} számla összesen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Betöltés...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Számla ID</TableHead>
                    <TableHead>Felhasználó</TableHead>
                    <TableHead>Csomag</TableHead>
                    <TableHead>Összeg</TableHead>
                    <TableHead>Fizetve</TableHead>
                    <TableHead>Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicesData?.data.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.user.email}</div>
                          {invoice.user.tenant && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {invoice.user.tenant.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.plan.name}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(invoice.paidAt).toLocaleDateString('hu-HU')}
                          <div className="text-xs text-muted-foreground">
                            {formatDistance(new Date(invoice.paidAt), new Date(), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Letöltés
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {invoicesData && invoicesData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
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
        </CardContent>
      </Card>
    </div>
  );
}
