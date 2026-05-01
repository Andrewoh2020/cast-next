'use client';

import { useEffect, useState } from 'react';

interface Props {
  src: string;
  characterName: string;
  canDownload: boolean;
}

/**
 * Cuts the existing 21:9 reference sheet into 8 grabbable cards via CSS
 * background positioning. Sheet layout (matches lib/generation.server.ts
 * REFERENCE_SHEET_PROMPT):
 *
 *   Left 4/6 of width: 4 full-body standing panels, each 1/6 wide × full height
 *     P1 Front · P2 Left side · P3 Right side · P4 Back
 *   Right 2/6 of width: 2x2 close-up grid, each 1/6 wide × 1/2 height
 *     P5 TL Front · P6 TR 3/4-right · P7 BL 3/4-left · P8 BR Back-of-head
 *
 * No regeneration needed — single source image, just CSS slicing.
 *
 * Click any panel → lightbox with the panel zoomed in + (sub-gated)
 * download-full-sheet action. Per-panel cropped downloads are a follow-up.
 */
const FULL_BODY_PANELS = [
  { id: 1, label: 'Front', xPct: 0 },
  { id: 2, label: 'Left side', xPct: 20 },
  { id: 3, label: 'Right side', xPct: 40 },
  { id: 4, label: 'Back', xPct: 60 },
] as const;

const CLOSEUP_PANELS = [
  { id: 5, label: 'Front close-up', xPct: 80, yPct: 0 },
  { id: 6, label: '3/4 Right', xPct: 100, yPct: 0 },
  { id: 7, label: '3/4 Left', xPct: 80, yPct: 100 },
  { id: 8, label: 'Back of head', xPct: 100, yPct: 100 },
] as const;

interface OpenPanel {
  id: number;
  label: string;
  xPct: number;
  yPct: number;
  variant: 'fullbody' | 'closeup';
}

export default function RefSheetGrid({ src, characterName, canDownload }: Props) {
  const [open, setOpen] = useState<OpenPanel | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div className="space-y-3">
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FULL_BODY_PANELS.map((p) => (
            <li key={p.id}>
              <PanelCard
                src={src}
                label={p.label}
                aspectRatio="3.5 / 9"
                bgSizeWidthPct={600}
                bgSizeHeightPct={100}
                xPct={p.xPct}
                yPct={0}
                onClick={() => setOpen({ id: p.id, label: p.label, xPct: p.xPct, yPct: 0, variant: 'fullbody' })}
              />
            </li>
          ))}
        </ul>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CLOSEUP_PANELS.map((p) => (
            <li key={p.id}>
              <PanelCard
                src={src}
                label={p.label}
                aspectRatio="3.5 / 4.5"
                bgSizeWidthPct={600}
                bgSizeHeightPct={200}
                xPct={p.xPct}
                yPct={p.yPct}
                onClick={() => setOpen({ id: p.id, label: p.label, xPct: p.xPct, yPct: p.yPct, variant: 'closeup' })}
              />
            </li>
          ))}
        </ul>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${characterName} — ${open.label}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex-1"
              style={{
                aspectRatio: open.variant === 'fullbody' ? '3.5 / 9' : '3.5 / 4.5',
                backgroundImage: `url('${src}')`,
                backgroundSize: open.variant === 'fullbody' ? '600% 100%' : '600% 200%',
                backgroundPosition: `${open.xPct}% ${open.yPct}%`,
                backgroundRepeat: 'no-repeat',
                maxHeight: '85vh',
              }}
              aria-hidden
            />
            <div className="mt-3 flex items-center justify-between gap-2 text-white">
              <p className="text-sm font-bold">{open.label}</p>
              <div className="flex items-center gap-2">
                <a
                  href={canDownload ? src : '#'}
                  onClick={(e) => { if (!canDownload) e.preventDefault(); }}
                  target={canDownload ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  aria-disabled={!canDownload}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                    canDownload ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/30 text-white/70 cursor-not-allowed'
                  }`}
                >
                  {canDownload ? 'Open full sheet' : 'Download (subscribe)'}
                </a>
                <button
                  onClick={() => setOpen(null)}
                  className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PanelCard({
  src, label, aspectRatio, bgSizeWidthPct, bgSizeHeightPct, xPct, yPct, onClick,
}: {
  src: string;
  label: string;
  aspectRatio: string;
  bgSizeWidthPct: number;
  bgSizeHeightPct: number;
  xPct: number;
  yPct: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl bg-gray-100 border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all"
      style={{ aspectRatio }}
      aria-label={`Open ${label} panel`}
    >
      <div
        className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02]"
        style={{
          backgroundImage: `url('${src}')`,
          backgroundSize: `${bgSizeWidthPct}% ${bgSizeHeightPct}%`,
          backgroundPosition: `${xPct}% ${yPct}%`,
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden
      />
      <span className="absolute bottom-2 left-2 inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-black bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
        {label}
      </span>
    </button>
  );
}
