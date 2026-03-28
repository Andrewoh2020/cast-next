'use client';

import { useState } from 'react';
import { Talent, AGE_LABELS, BUILD_LABELS, RACE_LABELS } from '@/lib/talent';

interface Props {
  characters: Talent[];
  onEdit: (t: Talent) => void;
  onDelete: (id: number) => void;
  onBatchDelete: (ids: number[]) => void;
}

export default function CharacterTable({ characters, onEdit, onDelete, onBatchDelete }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmBatch, setConfirmBatch] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);

  const allSelected = characters.length > 0 && selected.size === characters.length;
  const someSelected = selected.size > 0;

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(characters.map((c) => c.id)));

  const handleBatchDelete = () => {
    onBatchDelete(Array.from(selected));
    setSelected(new Set());
    setConfirmBatch(false);
  };

  if (characters.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
        <div className="text-4xl mb-3">🎭</div>
        <p className="font-semibold text-gray-600">No characters yet</p>
        <p className="text-sm text-gray-400 mt-1">Click &quot;Add Character&quot; to get started</p>
      </div>
    );
  }

  return (
    <>
      {/* Batch action bar */}
      {someSelected && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 mb-3">
          <span className="text-sm font-semibold text-indigo-700">
            {selected.size} character{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setConfirmBatch(true)}
              className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete {selected.size}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3.5 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400">Character</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400 hidden md:table-cell">Attributes</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Race</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Ethnicity</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400 hidden md:table-cell">Age</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400">Price</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {characters.map((c) => (
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${selected.has(c.id) ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-semibold text-black">{c.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5 max-w-[180px] line-clamp-1">{c.vibe}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{AGE_LABELS[c.ageRange]}</span>
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{BUILD_LABELS[c.build]}</span>
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{c.height}</span>
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{c.sex}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.race.map((r) => (
                        <span key={r} className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                          {RACE_LABELS[r]}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-4 hidden lg:table-cell">
                    {c.ethnicity ? (
                      <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {c.ethnicity}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-300">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4 hidden md:table-cell">
                    {c.age ? (
                      <span className="text-sm font-medium text-gray-700">{c.age}</span>
                    ) : (
                      <span className="text-[11px] text-gray-300">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-black">{c.prices[0].price}</div>
                    <div className="text-xs text-gray-400">{c.prices[0].name}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        disabled={downloading === c.id}
                        onClick={() => {
                          const links = [
                            c.img && { url: `${c.img}${c.img.includes('?') ? '&' : '?'}download=1&filename=${c.slug}-profile`, name: `${c.slug}-profile` },
                            c.referenceSheetUrl && { url: `${c.referenceSheetUrl}${c.referenceSheetUrl.includes('?') ? '&' : '?'}download=1&filename=${c.slug}-reference-sheet`, name: `${c.slug}-reference-sheet` },
                          ].filter(Boolean) as { url: string; name: string }[];
                          setDownloading(c.id);
                          links.forEach(({ url, name }, i) => {
                            setTimeout(() => {
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = name;
                              a.click();
                            }, i * 800);
                          });
                          setTimeout(() => setDownloading(null), links.length * 800 + 1000);
                        }}
                        className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {downloading === c.id ? (
                          <>
                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Downloading…
                          </>
                        ) : 'Download'}
                      </button>
                      <button
                        onClick={() => onEdit(c)}
                        className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(c.id)}
                        className="text-xs font-semibold text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch delete confirmation */}
      {confirmBatch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-black mb-2">Delete {selected.size} characters?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBatch(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-gray-400 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"
              >
                Delete {selected.size}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
