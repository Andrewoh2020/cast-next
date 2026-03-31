'use client';

import Image from 'next/image';
import { CustomCharacterDraft } from '@/lib/custom-characters.server';
import { thumbUrl } from '@/lib/talent';

interface Props {
  drafts: CustomCharacterDraft[];
  currentDraftId: string | null;
  onSelect: (draft: CustomCharacterDraft) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-500' },
  preview: { label: 'Preview', color: 'bg-blue-100 text-blue-600' },
  paid: { label: 'Paid', color: 'bg-amber-100 text-amber-600' },
  generating: { label: 'Generating', color: 'bg-indigo-100 text-indigo-600' },
  complete: { label: 'Download', color: 'bg-green-100 text-green-600' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-600' },
};

export default function DraftsList({ drafts, currentDraftId, onSelect, onDelete, onNew }: Props) {
  if (drafts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400 mb-3">No characters yet</p>
        <button
          onClick={onNew}
          className="text-sm font-semibold text-indigo-500 hover:underline"
        >
          Create your first
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">My Drafts</p>
      <div className="space-y-2">
        {drafts.map((draft) => {
          const badge = STATUS_BADGES[draft.status] ?? STATUS_BADGES.draft;
          const isActive = draft.id === currentDraftId;

          return (
            <div
              key={draft.id}
              className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                isActive ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-gray-100 hover:border-gray-200'
              }`}
              onClick={() => onSelect(draft)}
            >
              {(draft.profileThumbnailUrl || draft.previewImageUrl) ? (
                <Image
                  src={draft.profileThumbnailUrl || thumbUrl(draft.previewImageUrl!, 96)}
                  alt={draft.name}
                  width={40}
                  height={56}
                  className="w-10 h-14 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">{draft.name || 'Untitled'}</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(draft.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
