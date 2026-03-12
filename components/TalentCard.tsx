'use client';

import { Talent, ROLE_LABELS } from '@/lib/talent';

interface Props {
  talent: Talent;
  onClick: (talent: Talent) => void;
  index?: number;
}

// Vary card aspect ratios to create masonry rhythm
const ASPECT_STYLES = [
  { paddingBottom: '133%' }, // 3:4 portrait
  { paddingBottom: '120%' }, // slightly shorter portrait
  { paddingBottom: '150%' }, // tall portrait
  { paddingBottom: '125%' }, // 4:5
  { paddingBottom: '110%' }, // near square-ish portrait
];

export default function TalentCard({ talent, onClick, index = 0 }: Props) {
  const aspectStyle = ASPECT_STYLES[index % ASPECT_STYLES.length];
  const primaryRole = talent.roles[0] ? ROLE_LABELS[talent.roles[0]] : null;

  return (
    <div
      onClick={() => onClick(talent)}
      className="group relative w-full overflow-hidden rounded-2xl cursor-pointer bg-gray-100 animate-fade-in-up"
      style={{ paddingBottom: aspectStyle.paddingBottom }}
    >
      {/* Photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={talent.img}
        alt={talent.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />

      {/* Gradient scrim — slides in from bottom on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350" />

      {/* Top role chip — always visible */}
      {primaryRole && (
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/90 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded-full">
            {primaryRole}
          </span>
        </div>
      )}

      {/* Bottom overlay — slides up on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
        <p className="text-white font-bold text-base tracking-tight leading-tight mb-1">
          {talent.name}
        </p>
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
