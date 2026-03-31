'use client';

import { useRef, useState } from 'react';
import { Talent, thumbUrl } from '@/lib/talent';

interface Props {
  talent: Talent;
  onClick: (talent: Talent) => void;
  index?: number;
  isFavorited?: boolean;
  onToggleFavorite?: (talent: Talent) => void;
}

export default function TalentCard({ talent, onClick, index = 0, isFavorited = false, onToggleFavorite }: Props) {

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, active: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateY = ((x - cx) / cx) * 12;
    const rotateX = -((y - cy) / cy) * 12;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setTilt({ rotateX, rotateY, glareX, glareY, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, active: false });
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(talent)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative w-full overflow-hidden rounded-2xl cursor-pointer bg-gray-100 animate-fade-in-up"
      style={{
        paddingBottom: '133%',
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.active ? 1.02 : 1})`,
        transition: tilt.active ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        willChange: 'transform',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbUrl(talent.img, 400)}
        alt={talent.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />

      {/* Gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350" />

      {/* Holographic glare */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: tilt.active ? 0.18 : 0,
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.85) 0%, rgba(180,160,255,0.3) 30%, transparent 65%)`,
        }}
      />

      {/* Top row: favorite button */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-end">
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
