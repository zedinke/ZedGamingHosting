'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface SlaMetrics {
  total: number;
  onTime: number;
  breached: number;
  approaching: number;
  onTimePercentage: number;
  complianceStatus: 'EXCELLENT' | 'GOOD' | 'POOR';
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  slaStatus: 'ON_TIME' | 'APPROACHING' | 'BREACHED';
  hoursRemaining: number;
  priority: string;
}

export default function SlaMetricsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch SLA metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['sla-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/support/sla/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json() as Promise<SlaMetrics>;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30s
  });

  // Fetch breached tickets
  const { data: breachedTickets = [], isLoading: breachedLoading } = useQuery({
    queryKey: ['sla-breached'],
    queryFn: async () => {
      const res = await fetch('/api/support/tickets?status=BREACHED&limit=10');
      if (!res.ok) throw new Error('Failed to fetch breached tickets');
      return res.json() as Promise<Ticket[]>;
    },
  });

  // Fetch approaching tickets
  const { data: approachingTickets = [], isLoading: approachingLoading } = useQuery({
    queryKey: ['sla-approaching'],
    queryFn: async () => {
      const res = await fetch('/api/support/tickets?status=APPROACHING&limit=10');
      if (!res.ok) throw new Error('Failed to fetch approaching tickets');
      return res.json() as Promise<Ticket[]>;
    },
  });

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchMetrics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refetchMetrics]);

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'GOOD':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'POOR':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceLabel = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'Kiváló (≥95%)';
      case 'GOOD':
        return 'Jó (≥90%)';
      case 'POOR':
        return 'Gyenge (<90%)';
      default:
        return 'Ismeretlen';
    }
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">SLA metrikák betöltése...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SLA Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Támogatási jegyek SLA megfelelőségének nyomon követése
          </p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            autoRefresh
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {autoRefresh ? '🔄 Auto-refresh bekapcsolt' : '⏸️ Auto-refresh kikapcsolt'}
        </button>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Tickets */}
          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Összes jegy</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics.total}
                </p>
              </div>
              <Clock className="w-12 h-12 text-gray-400 opacity-50" />
            </div>
          </div>

          {/* On Time */}
          <div className="p-6 bg-white rounded-lg border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Időben</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {metrics.onTime}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400 opacity-50" />
            </div>
          </div>

          {/* Approaching */}
          <div className="p-6 bg-white rounded-lg border border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Közeledik</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {metrics.approaching}
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-yellow-400 opacity-50" />
            </div>
          </div>

          {/* Breached */}
          <div className="p-6 bg-white rounded-lg border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Megsértett</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {metrics.breached}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-400 opacity-50" />
            </div>
          </div>

          {/* Compliance */}
          <div className={`p-6 rounded-lg border shadow-sm bg-opacity-50 ${getComplianceColor(metrics.complianceStatus)}`}>
            <div>
              <p className="text-sm font-medium">Megfelelőség</p>
              <p className="text-3xl font-bold mt-2">
                {metrics.onTimePercentage.toFixed(1)}%
              </p>
              <p className="text-sm font-medium mt-2">
                {getComplianceLabel(metrics.complianceStatus)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breached Tickets */}
      <div className="p-6 bg-white rounded-lg border border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Megsértett SLA ({breachedTickets.length})
          </h2>
        </div>

        {breachedLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          </div>
        ) : breachedTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Cím
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Prioritás
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Státusz
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Akció
                  </th>
                </tr>
              </thead>
              <tbody>
                {breachedTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-100 hover:bg-red-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      #{ticket.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {ticket.title}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded font-medium ${
                          ticket.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : ticket.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {ticket.status}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <a
                        href={`/dashboard/support/${ticket.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Megnyitás
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            Nincsenek megsértett SLA jegyek ✅
          </div>
        )}
      </div>

      {/* Approaching Tickets */}
      <div className="p-6 bg-white rounded-lg border border-yellow-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Közeledik az SLA határidő ({approachingTickets.length})
          </h2>
        </div>

        {approachingLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
          </div>
        ) : approachingTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Cím
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Prioritás
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Hátra lévő
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Akció
                  </th>
                </tr>
              </thead>
              <tbody>
                {approachingTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-100 hover:bg-yellow-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      #{ticket.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {ticket.title}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded font-medium ${
                          ticket.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : ticket.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-yellow-600">
                      {ticket.hoursRemaining}h
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <a
                        href={`/dashboard/support/${ticket.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Megnyitás
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            Nincsenek közeledő határidejű jegyek ✅
          </div>
        )}
      </div>
    </div>
  );
}
