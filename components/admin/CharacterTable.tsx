'use client';

import { Talent, AGE_LABELS, BUILD_LABELS, ETHNICITY_LABELS } from '@/lib/talent';

interface Props {
  characters: Talent[];
  onEdit: (t: Talent) => void;
  onDelete: (id: number) => void;
}

export default function CharacterTable({ characters, onEdit, onDelete }: Props) {
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
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400">Character</th>

              <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400 hidden md:table-cell">Attributes</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Ethnicity</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-400">Price</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {characters.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                {/* Character */}
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


                {/* Attributes */}
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{AGE_LABELS[c.ageRange]}</span>
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{BUILD_LABELS[c.build]}</span>
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{c.height}</span>
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{c.sex}</span>
                  </div>
                </td>

                {/* Ethnicity */}
                <td className="px-5 py-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {c.ethnicities.map((e) => (
                      <span key={e} className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {ETHNICITY_LABELS[e]}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Price */}
                <td className="px-5 py-4">
                  <div className="font-bold text-black">{c.prices[0].price}</div>
                  <div className="text-xs text-gray-400">{c.prices[0].name}</div>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 justify-end">
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
  );
}
