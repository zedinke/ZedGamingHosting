'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Globe,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react';

interface Subdomain {
  id: string;
  subdomain: string;
  fullDomain: string;
  ipAddress: string;
  isActive: boolean;
  createdAt: string;
}

interface SubdomainManagerProps {
  serverId: string;
  readonly?: boolean;
}

export const SubdomainManager: React.FC<SubdomainManagerProps> = ({
  serverId,
  readonly = false,
}) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ subdomain: '', ipAddress: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch subdomains
  const { data: subdomains = [], isLoading } = useQuery({
    queryKey: ['server-subdomains', serverId],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}/subdomains`);
      if (!res.ok) throw new Error('Failed to fetch subdomains');
      return res.json() as Promise<Subdomain[]>;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/servers/${serverId}/subdomains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create subdomain');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-subdomains', serverId] });
      setFormData({ subdomain: '', ipAddress: '' });
      setShowForm(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; ipAddress: string }) => {
      const res = await fetch(
        `/api/servers/${serverId}/subdomains/${data.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ipAddress: data.ipAddress }),
        },
      );
      if (!res.ok) throw new Error('Failed to update subdomain');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-subdomains', serverId] });
      setEditingId(null);
      setFormData({ subdomain: '', ipAddress: '' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (subdomainId: string) => {
      const res = await fetch(
        `/api/servers/${serverId}/subdomains/${subdomainId}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error('Failed to delete subdomain');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-subdomains', serverId] });
    },
  });

  // Check DNS status
  const dnsMutation = useMutation({
    mutationFn: async (subdomainId: string) => {
      const res = await fetch(
        `/api/servers/${serverId}/subdomains/${subdomainId}/dns-status`
      );
      if (!res.ok) throw new Error('Failed to check DNS status');
      return res.json();
    },
  });

  const handleAddSubdomain = () => {
    if (formData.subdomain && formData.ipAddress) {
      createMutation.mutate(formData);
    }
  };

  const handleUpdateSubdomain = (subdomainId: string) => {
    if (formData.ipAddress) {
      updateMutation.mutate({ id: subdomainId, ipAddress: formData.ipAddress });
    }
  };

  const handleCopyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopiedId(domain);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Aldomainek betöltése...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Aldomainek</h2>
        </div>
        {!readonly && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ subdomain: '', ipAddress: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Új aldomain
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && !readonly && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Új aldomain létrehozása</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aldomain neve
              </label>
              <input
                type="text"
                value={formData.subdomain}
                onChange={(e) =>
                  setFormData({ ...formData, subdomain: e.target.value })
                }
                placeholder="pl: server-1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP cím
              </label>
              <input
                type="text"
                value={formData.ipAddress}
                onChange={(e) =>
                  setFormData({ ...formData, ipAddress: e.target.value })
                }
                placeholder="pl: 192.168.1.100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddSubdomain}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Létrehozás...</span>
                  </>
                ) : (
                  'Létrehozás'
                )}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({ subdomain: '', ipAddress: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subdomains List */}
      {subdomains.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Aldomain
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  IP cím
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  DNS Status
                </th>
                {!readonly && (
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Műveletek
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {subdomains.map((subdomain) => (
                <tr
                  key={subdomain.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          {subdomain.fullDomain}
                        </div>
                        <div className="text-sm text-gray-600">
                          {subdomain.subdomain}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyDomain(subdomain.fullDomain)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copiedId === subdomain.fullDomain ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {subdomain.ipAddress}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => dnsMutation.mutate(subdomain.id)}
                      disabled={dnsMutation.isPending}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {dnsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Ellenőrzés
                    </button>
                  </td>
                  {!readonly && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(subdomain.id);
                            setFormData({
                              subdomain: subdomain.subdomain,
                              ipAddress: subdomain.ipAddress,
                            });
                            setShowForm(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(subdomain.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:text-gray-400"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600">Nincsenek aldomainek konfigurálva</p>
        </div>
      )}
    </div>
  );
};

export default SubdomainManager;
