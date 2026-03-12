'use client';

import { Talent, ROLE_LABELS } from '@/lib/talent';

interface Props {
  talent: Talent;
  onClick: (talent: Talent) => void;
  index?: number;
  isFavorited?: boolean;
  onToggleFavorite?: (talent: Talent) => void;
}

const ASPECT_STYLES = [
  { paddingBottom: '133%' },
  { paddingBottom: '120%' },
  { paddingBottom: '150%' },
  { paddingBottom: '125%' },
  { paddingBottom: '110%' },
];

export default function TalentCard({ talent, onClick, index = 0, isFavorited = false, onToggleFavorite }: Props) {
  const aspectStyle = ASPECT_STYLES[index % ASPECT_STYLES.length];
  const primaryRole = talent.roles[0] ? ROLE_LABELS[talent.roles[0]] : null;

  return (
    <div
      onClick={() => onClick(talent)}
      className="group relative w-full overflow-hidden rounded-2xl cursor-pointer bg-gray-100 animate-fade-in-up"
      style={{ paddingBottom: aspectStyle.paddingBottom }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={talent.img}
        alt={talent.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />

      {/* Gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350" />

      {/* Top row: role chip + favorite button */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        {primaryRole && (
          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/90 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded-full">
            {primaryRole}
          </span>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(talent); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${
              isFavorited
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-white/80 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
        <p className="text-white font-bold text-base tracking-tight leading-tight mb-1">{talent.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-xs">
            From <span className="text-white font-semibold">{talent.prices[0]?.price}</span>
          </span>
          <span className="text-[11px] font-bold bg-white text-black px-3 py-1 rounded-full">
            View Profile →
          </span>
        </div>
      </div>
    </div>
  );
}
