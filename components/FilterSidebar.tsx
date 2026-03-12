'use client';

import { useState } from 'react';
import { FILTER_GROUPS, ActiveFilters, FilterKey } from '@/lib/talent';

interface Props {
  filters: ActiveFilters;
  onChange: (filters: ActiveFilters) => void;
  resultCount: number;
}

export default function FilterSidebar({ filters, onChange, resultCount }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(['roles', 'sex', 'ethnicities', 'ageRange'])
  );

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleValue = (key: FilterKey, value: string) => {
    const current = filters[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next.length > 0 ? next : undefined });
  };

  const clearAll = () => onChange({});

  const totalActive = Object.values(filters).reduce((acc, v) => acc + (v?.length ?? 0), 0);

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-black">Filters</span>
          {totalActive > 0 && (
            <span className="text-xs font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full">
              {totalActive}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{resultCount} results</span>
          {totalActive > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter groups */}
      <div className="space-y-1">
        {FILTER_GROUPS.map((group) => {
          const activeInGroup = filters[group.key]?.length ?? 0;
          const isExpanded = expanded.has(group.key);

          return (
            <div key={group.key} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
              {/* Group header */}
              <button
                onClick={() => toggle(group.key)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-black">{group.label}</span>
                  {activeInGroup > 0 && (
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                      {activeInGroup}
                    </span>
                  )}
                </div>
                <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Options */}
              {isExpanded && (
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  {group.options.map((opt) => {
                    const active = filters[group.key]?.includes(opt.value) ?? false;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleValue(group.key as FilterKey, opt.value)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                          active
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
