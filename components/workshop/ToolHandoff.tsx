'use client';

import { useState } from 'react';
import { WORKSHOP_TOOLS, type WorkshopTool } from '@/lib/workshop-tools';

interface Props {
  /** Public-facing URL of the profile photo to copy to clipboard. Pass the
   *  Vercel-hosted URL (the one served by /api/media), not the raw blob path. */
  profileImageUrl?: string;
  /** Used to build a fully-qualified URL when profileImageUrl is a relative
   *  /api/media path (so the URL works after the user pastes into Kling). */
  origin?: string;
}

/**
 * Active handoff section inside the export modal. Each tool button:
 *  1. Copies the public profile URL to clipboard
 *  2. Opens the tool's image-to-video page in a new tab
 *  3. Shows a small toast confirming what to do next
 *
 * Each tool has a collapsible 4-step guide below the button row, sourced
 * from `WORKSHOP_TOOLS` so it stays in lockstep with the README in the ZIP.
 */
export default function ToolHandoff({ profileImageUrl, origin }: Props) {
  const [openTool, setOpenTool] = useState<WorkshopTool['slug'] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const absoluteProfileUrl = (() => {
    if (!profileImageUrl) return '';
    if (profileImageUrl.startsWith('http')) return profileImageUrl;
    if (origin) return `${origin}${profileImageUrl}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${profileImageUrl}`;
    return profileImageUrl;
  })();

  const handleOpen = async (tool: WorkshopTool) => {
    if (absoluteProfileUrl && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(absoluteProfileUrl);
        setToast(`Profile URL copied — paste it into ${tool.name}'s image input.`);
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
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Send to your video tool</p>
      <div className="space-y-1.5">
        {WORKSHOP_TOOLS.map((tool) => (
          <div key={tool.slug} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black">{tool.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{tool.tagline}</p>
              </div>
              <button
                onClick={() => setOpenTool(openTool === tool.slug ? null : tool.slug)}
                className="text-[11px] font-semibold text-gray-500 hover:text-indigo-600 px-2 py-1 rounded-md transition-colors"
                aria-expanded={openTool === tool.slug}
              >
                {openTool === tool.slug ? 'Hide' : 'How'}
              </button>
              <button
                onClick={() => handleOpen(tool)}
                className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                Open
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path d="M7 17L17 7M17 7H8M17 7v9" />
                </svg>
              </button>
            </div>
            {openTool === tool.slug && (
              <ol className="border-t border-gray-100 px-4 py-3 space-y-1 text-xs text-gray-600 bg-gray-50/60">
                {tool.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-indigo-500 shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
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
