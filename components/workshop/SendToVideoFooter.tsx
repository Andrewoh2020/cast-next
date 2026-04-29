'use client';

import { useState } from 'react';
import { WORKSHOP_TOOLS, type WorkshopTool } from '@/lib/workshop-tools';

interface Props {
  /** Public-facing URL of the profile photo to copy to clipboard when the
   *  user clicks a tool button. Pass the Vercel-hosted URL (the one served
   *  by /api/media), not the raw blob path. */
  profileImageUrl?: string;
  /** Called when the user wants the full .zip package (fallback path). */
  onDownloadZip: () => void;
  /** Outfit + shot counts for the .zip secondary line. */
  outfitCount: number;
  shotCount: number;
}

/**
 * Persistent "Take your character to video" footer that lives below the
 * canvas. Three brand-accented tool cards are the primary CTA; the .zip
 * download is demoted to a quiet secondary link.
 *
 * Click on any tool card:
 *   1. Copies the public profile photo URL to clipboard
 *   2. Opens the tool's image-to-video page in a new tab
 *   3. Shows a toast confirming what to paste
 */
export default function SendToVideoFooter({ profileImageUrl, onDownloadZip, outfitCount, shotCount }: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const absoluteProfileUrl = (() => {
    if (!profileImageUrl) return '';
    if (profileImageUrl.startsWith('http')) return profileImageUrl;
    if (typeof window !== 'undefined') return `${window.location.origin}${profileImageUrl}`;
    return profileImageUrl;
  })();

  const handleSend = async (tool: WorkshopTool) => {
    if (absoluteProfileUrl && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(absoluteProfileUrl);
        setToast(`Profile URL copied — paste into ${tool.name}'s image input.`);
      } catch {
        setToast(`Opening ${tool.name} — upload the profile photo from your downloaded package.`);
      }
    } else {
      setToast(`Opening ${tool.name} — upload the profile photo from your downloaded package.`);
    }
    window.open(tool.url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="w-full mt-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500">
          Take your character to video
        </p>
        <button
          onClick={onDownloadZip}
          className="text-[11px] text-gray-400 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1"
          title="Download the full character package as a .zip"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
          Download character package ({outfitCount} outfits · {shotCount} scenes)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {WORKSHOP_TOOLS.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} onClick={() => handleSend(tool)} />
        ))}
      </div>

      {toast && (
        <div role="status" aria-live="polite" className="mt-3 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
          {toast}
        </div>
      )}
    </div>
  );
}

function ToolCard({ tool, onClick }: { tool: WorkshopTool; onClick: () => void }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = tool.logo && !logoFailed;

  return (
    <button
      onClick={onClick}
      className="group relative bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-gray-300 hover:shadow-md transition-all overflow-hidden"
    >
      {/* Brand accent strip on the left */}
      <span aria-hidden="true" className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: tool.accent }} />
      <div className="pl-2 flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {showLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tool.logo}
              alt={`${tool.name} logo`}
              className="w-full h-full object-contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="text-base sm:text-lg font-black tracking-tight" style={{ color: tool.accent }}>
              {tool.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black tracking-tight text-black truncate">{tool.name}</p>
          <p className="text-[11px] text-gray-500 truncate">{tool.tagline}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </div>
      <p className="pl-2 mt-2 text-xs font-semibold text-gray-700 group-hover:text-black">
        Send to {tool.name} <span className="text-indigo-500 group-hover:translate-x-0.5 inline-block transition-transform">→</span>
      </p>
    </button>
  );
}
