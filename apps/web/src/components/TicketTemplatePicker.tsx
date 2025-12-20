import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Zap, Plus, Search, Tag } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
  tags: string[];
  description?: string;
  usageCount: number;
}

interface TicketTemplatePickerProps {
  onSelectTemplate: (template: Template, processed: { subject: string; content: string }) => void;
  ticketData?: {
    userId?: string;
    staffName?: string;
    ticketId?: string;
    ticketTitle?: string;
  };
  compact?: boolean;
}

export const TicketTemplatePicker: React.FC<TicketTemplatePickerProps> = ({
  onSelectTemplate,
  ticketData,
  compact = false,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['template-categories'],
    queryFn: async () => {
      const res = await fetch('/api/support/templates/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Fetch popular templates
  const { data: popularTemplates = [], isLoading: popularLoading } = useQuery({
    queryKey: ['popular-templates'],
    queryFn: async () => {
      const res = await fetch('/api/support/templates/popular?limit=5');
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
  });

  // Search templates
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['search-templates', searchKeyword],
    queryFn: async () => {
      if (!searchKeyword.trim()) return [];
      const res = await fetch(
        `/api/support/templates/search/${encodeURIComponent(searchKeyword)}`
      );
      if (!res.ok) throw new Error('Failed to search templates');
      return res.json();
    },
    enabled: searchKeyword.length > 1,
  });

  // Apply template mutation
  const applyMutation = useMutation({
    mutationFn: async (template: Template) => {
      const res = await fetch(
        `/api/support/templates/${template.id}/apply/${ticketData?.ticketId || 'new'}`
      );
      if (!res.ok) throw new Error('Failed to apply template');
      return res.json();
    },
    onSuccess: (data, template) => {
      onSelectTemplate(template, data);
      setShowTemplates(false);
      setSearchKeyword('');
    },
  });

  const handleSelectTemplate = (template: Template) => {
    applyMutation.mutate(template);
  };

  const displayTemplates =
    searchKeyword.length > 1
      ? searchResults
      : selectedCategory
        ? popularTemplates.filter((t) => t.category === selectedCategory)
        : popularTemplates;

  if (compact) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Zap className="w-4 h-4" />
          Sablonok
        </button>

        {showTemplates && (
          <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-80 max-h-96 overflow-y-auto">
            {/* Search Input */}
            <div className="p-3 border-b sticky top-0 bg-white">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Sablon keresése..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Templates List */}
            {(searchLoading || popularLoading) ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            ) : displayTemplates.length > 0 ? (
              <div className="divide-y">
                {displayTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full text-left p-3 hover:bg-blue-50 transition-colors text-sm"
                    disabled={applyMutation.isPending}
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{template.category}</div>
                    {applyMutation.isPending && (
                      <div className="mt-2 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs text-blue-600">Alkalmazás...</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                Nincsenek sablonok
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">VálaszSablonok</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Sablon keresése..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              !selectedCategory
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Összes
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-2">
        {searchLoading || popularLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : displayTemplates.length > 0 ? (
          displayTemplates.map((template) => (
            <div
              key={template.id}
              className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {template.description}
                  </div>
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {template.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSelectTemplate(template)}
                  disabled={applyMutation.isPending}
                  className="ml-2 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:bg-gray-400 flex items-center gap-1"
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Alkalmazás...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Használat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchKeyword ? 'Nincsenek megfelelő sablonok' : 'Nincsenek sablonok'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketTemplatePicker;
