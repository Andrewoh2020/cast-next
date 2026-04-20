'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { WorkshopData, OutfitVariant, SceneShot } from '@/lib/workshop.server';
import BuyCreditsModal from '@/components/BuyCreditsModal';

export interface WorkshopCharacter {
  id: number | string;
  slug: string;
  name: string;
  ageRange?: string;
  ethnicity?: string;
  img: string;
  referenceSheetUrl?: string;
  licenseName: string;
  isUploadedImage?: boolean;
}

export interface WorkshopSummary {
  id: string;
  name: string;
  img: string;
  detail: string;
  href: string;
}

interface Props {
  character?: WorkshopCharacter | null;
  initialWorkshop?: WorkshopData;
  initialCredits: number;
  apiBase?: string;
  workshops?: WorkshopSummary[];
  /** Whether this is a roster character (needs license gate) vs custom upload (no gate) */
  isRosterCharacter?: boolean;
  /** Whether the user already has a license for this roster character */
  hasLicense?: boolean;
}

type Mode = 'outfit' | 'scene';
type Stage = 'idle' | 'uploading' | 'generating';
type Asset = { kind: 'outfit' | 'scene'; data: OutfitVariant | SceneShot };

export default function WorkshopClient({ character: initChar, initialWorkshop, initialCredits, apiBase: initApi, workshops = [], isRosterCharacter = false, hasLicense: initHasLicense = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [character, setCharacter] = useState<WorkshopCharacter | null>(initChar ?? null);
  const [apiBase, setApiBase] = useState(initApi ?? '');
  const [hasLicense, setHasLicense] = useState(initHasLicense);
  const [showLicenseGate, setShowLicenseGate] = useState(isRosterCharacter && !initHasLicense && !!initChar);
  const [acceptingLicense, setAcceptingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('outfit');
  const [workshop, setWorkshop] = useState<WorkshopData>(initialWorkshop ?? { characterId: 0, outfits: [], shots: [], updatedAt: '' });
  const [credits, setCredits] = useState(initialCredits);
  const [canvasImg, setCanvasImg] = useState(initChar?.img ?? '');
  const [canvasLabel, setCanvasLabel] = useState(initChar ? (initChar.isUploadedImage ? 'Uploaded image' : 'Profile headshot') : '');
  const [prompt, setPrompt] = useState('');
  const [referenceFile, setReferenceFile] = useState<{ url: string; name: string } | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [stageText, setStageText] = useState('');
  const [improving, setImproving] = useState(false);
  const [showRefSheet, setShowRefSheet] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(searchParams.get('buy') === '1');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [promptCollapsed, setPromptCollapsed] = useState(false);

  // Auto-resize the prompt textarea: starts as a single line, grows with content
  // up to ~6 lines. When collapsed, forced to a single visible line so the image
  // stays in view after generating.
  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = promptCollapsed
      ? '44px'
      : `${Math.min(el.scrollHeight, 160)}px`;
  }, [prompt, mode, promptCollapsed]);

  const hasCharacter = !!character;
  const creditConfirmedRef = useRef(false);

  // Restore prompt + mode from sessionStorage after Stripe redirect
  useEffect(() => {
    try {
      const savedPrompt = sessionStorage.getItem('workshop_prompt');
      const savedMode = sessionStorage.getItem('workshop_mode');
      if (savedPrompt) {
        setPrompt(savedPrompt);
        sessionStorage.removeItem('workshop_prompt');
      }
      if (savedMode === 'scene' || savedMode === 'outfit') {
        setMode(savedMode);
        sessionStorage.removeItem('workshop_mode');
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle credit purchase return from Stripe
  useEffect(() => {
    const purchased = searchParams.get('credits');
    const sessionId = searchParams.get('session_id');
    if (purchased === 'purchased' && sessionId && !creditConfirmedRef.current) {
      creditConfirmedRef.current = true;
      (async () => {
        try {
          const res = await fetch('/api/create/confirm-credits', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          if (res.ok) {
            const data = await res.json();
            setCredits(data.credits);
          } else {
            // Confirmation failed — still sync credits in case they were already granted
            await refreshCredits();
          }
        } catch {
          await refreshCredits();
        }
        // Clean up URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('credits');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, '', url.toString());
      })();
    } else if (!creditConfirmedRef.current) {
      // No Stripe params but page just loaded — sync credits in case they're stale
      refreshCredits();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const library: Asset[] = [
    ...workshop.outfits.map((o): Asset => ({ kind: 'outfit', data: o })),
    ...workshop.shots.map((s): Asset => ({ kind: 'scene', data: s })),
  ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());

  useEffect(() => { setReferenceFile(null); }, [mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA') return;
      if (e.key === '1') setMode('outfit');
      if (e.key === '2') setMode('scene');
      if (e.key === 'r' && hasCharacter) setShowRefSheet(true);
      if (e.key === 'd' && hasCharacter) setShowDownload(true);
      if (e.key === 'Escape') { setShowRefSheet(false); setShowDownload(false); setShowSwitcher(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasCharacter]);

  const canGenerate = hasCharacter && !!(prompt.trim() || referenceFile) && stage === 'idle' && credits > 0;

  const improve = async () => {
    if (!prompt.trim() || improving) return;
    setImproving(true);
    try {
      const res = await fetch('/api/workshop/improve-prompt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), mode }),
      });
      if (res.ok) {
        const { improved } = await res.json();
        if (improved) setPrompt(improved);
      }
    } catch {}
    setImproving(false);
  };

  const uploadReference = async (file: File) => {
    if (!apiBase) return;
    setStage('uploading');
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', mode === 'outfit' ? 'garment' : 'scene');
      const res = await fetch(`${apiBase}/uploads`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json())?.error || 'Upload failed');
      const json = await res.json();
      setReferenceFile({ url: json.url, name: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStage('idle');
    }
  };

  const deletedIdsRef = useRef<Set<string>>(new Set());

  const refreshCredits = async () => {
    try {
      const res = await fetch('/api/create/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits ?? 0);
      }
    } catch {}
  };

  const generate = async () => {
    if (!character || !apiBase || !canGenerate) return;
    setStage('generating');
    setError(null);

    const isOutfit = mode === 'outfit';
    const firstName = character.name.split(' ')[0];

    // Real-event-linked status messages with honest pacing
    setStageText('Uploading to generation engine…');
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStageText(isOutfit ? `Generating ${firstName}'s new look…` : `Placing ${firstName} in the scene…`), 3000));
    timers.push(setTimeout(() => setStageText('Matching identity and rendering fabric details…'), 20000));
    timers.push(setTimeout(() => setStageText('Refining lighting and skin texture…'), 40000));
    timers.push(setTimeout(() => setStageText('Running final quality checks…'), 60000));
    timers.push(setTimeout(() => setStageText('Switching to backup engine…'), 120000));
    timers.push(setTimeout(() => setStageText('Still working on it — hang tight…'), 200000));

    // Determine source type based on what's on the canvas
    const isRefSheetSource = character?.referenceSheetUrl ? canvasImg === character.referenceSheetUrl : false;
    const sourceType = isRefSheetSource ? 'refsheet' : (character?.isUploadedImage && canvasImg === character.img ? 'other' : 'profile');

    const endpoint = isOutfit ? `${apiBase}/outfits` : `${apiBase}/shots`;
    const bodyPayload = isOutfit
      ? { prompt, sourceImageUrl: canvasImg, garmentRefUrl: referenceFile?.url, sourceType }
      : { prompt, sourceImageUrl: canvasImg, sceneRefUrl: referenceFile?.url };

    // 300s timeout — generation can take up to 3min with Fal timeout + fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      timers.forEach(clearTimeout);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const err = new Error(errBody?.error || `Failed (${res.status})`);
        (err as Error & { moderation?: boolean }).moderation = !!errBody?.moderation;
        throw err;
      }
      const json = await res.json();
      const result = (isOutfit ? json.outfit : json.shot) as OutfitVariant | SceneShot;
      // Filter out any previously deleted items from the server response
      const serverWorkshop = json.workshop as WorkshopData;
      const deleted = deletedIdsRef.current;
      setWorkshop({
        ...serverWorkshop,
        outfits: serverWorkshop.outfits.filter((o) => !deleted.has(o.id)),
        shots: serverWorkshop.shots.filter((s) => !deleted.has(s.id)),
      });
      setCanvasImg(result.imageUrl);
      setCanvasLabel(result.prompt || (isOutfit ? 'New outfit' : 'New scene'));
      setReferenceFile(null);
      // Collapse the prompt field so the freshly generated image is fully visible
      setPromptCollapsed(true);
    } catch (err) {
      clearTimeout(timeoutId);
      timers.forEach(clearTimeout);

      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      const isModeration = !!(err as Error & { moderation?: boolean })?.moderation;

      if (isTimeout) {
        // Server may have completed — refresh workshop data to check
        setError('Generation took longer than expected. This can happen if the prompt was flagged as inappropriate. Checking…');
        try {
          const checkRes = await fetch(`${apiBase}/outfits`);
          if (checkRes.ok) {
            const data = await checkRes.json();
            if (data.outfits?.length > workshop.outfits.length) {
              // It DID complete — update state
              const freshWorkshop = await fetch(`${apiBase}/outfits`).then(r => r.json());
              setWorkshop((prev) => ({ ...prev, outfits: freshWorkshop.outfits ?? prev.outfits }));
              setCanvasImg(freshWorkshop.outfits?.[0]?.imageUrl ?? canvasImg);
              setCanvasLabel(freshWorkshop.outfits?.[0]?.prompt ?? canvasLabel);
              setError(null);
              setReferenceFile(null);
            } else {
              setError('Generation is still processing, or may have failed due to an inappropriate prompt. Try a different description or refresh in a moment.');
            }
          }
        } catch {
          setError('Generation is still processing, or may have failed due to an inappropriate prompt. Try a different description or refresh in a moment.');
        }
      } else {
        const errMsg = err instanceof Error ? err.message : String(err);
        const message = isModeration ? errMsg : `${errMsg}. Your credit has been refunded. Please try again.`;
        setError(message);
        // Notify admin of persistent failure (non-blocking)
        fetch('/api/workshop/notify-failure', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ characterName: character.name, mode, prompt, error: errMsg }),
        }).catch(() => {});
      }
    } finally {
      setStage('idle');
      refreshCredits(); // Always sync credits with server after any generation attempt
    }
  };

  const handleUploadCharacter = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', file.name.replace(/\.[^.]+$/, ''));
      const res = await fetch('/api/workshop/custom', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Upload failed');
      const json = await res.json();
      const w = json.workshop;
      // Redirect to the new workshop route so URL updates
      router.push(`/workshop/custom/${w.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setUploading(false);
    }
  };

  const isRefSheet = character ? canvasImg === character.referenceSheetUrl : false;
  // Use contain mode for: ref sheets, uploaded images, and ANY generated variant
  // (generated variants from ref sheets may have different aspect ratios than the profile).
  // Only the profile headshot uses cover mode with 3:4 crop.
  const isProfileImg = character ? canvasImg === character.img : false;
  const isUploadedSource = !isProfileImg || !!character?.isUploadedImage;

  return (
    <div className={`flex flex-col bg-[#faf7f2] text-gray-900 ${hasCharacter ? 'fixed inset-0 overflow-hidden' : 'min-h-screen'}`}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-gray-100 bg-white shrink-0 z-20 relative">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="text-xl font-black tracking-tight text-black shrink-0">Cast<span className="text-indigo-500">.</span></Link>
          <span className="text-gray-300 hidden sm:inline">·</span>
          {hasCharacter ? (
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              aria-expanded={showSwitcher}
              aria-haspopup="menu"
              aria-label={`Switch workshop (current: ${character.name})`}
              className="flex items-center gap-2 min-w-0 px-2 py-1 -ml-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${character.img}${character.img.includes('?') ? '&' : '?'}w=96`} alt="" className="w-6 h-6 rounded-full object-cover object-top shrink-0" />
              <span className="text-sm font-semibold truncate text-black hidden sm:inline">{character.name}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-gray-400 shrink-0" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          ) : (
            <span className="text-sm text-gray-400">Workshop</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasCharacter && (
            <>
              <button onClick={() => setShowDownload(true)} className="hidden sm:flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                Export package
              </button>
              <button onClick={() => setShowDownload(true)} aria-label="Export package" className="sm:hidden flex items-center justify-center w-11 h-11 bg-black text-white rounded-lg hover:bg-gray-800 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              </button>
            </>
          )}
          <div className="h-7 w-px bg-gray-200" />
          <CreditsChip credits={credits} onClick={() => setShowBuyCredits(true)} />
        </div>
      </header>

      {/* Character switcher */}
      {showSwitcher && (
        <>
        <div className="fixed inset-0 z-20" onClick={() => setShowSwitcher(false)} />
        <div className="absolute top-14 left-24 z-30 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl p-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 pt-2 pb-1">Your workshops</p>
          {workshops.map((w) => (
            <Link key={w.id} href={w.href} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${w.img}${w.img.includes('?') ? '&' : '?'}w=96`} alt="" className="w-8 h-8 rounded-lg object-cover object-top" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">{w.name}</p>
                <p className="text-[10px] text-gray-500">{w.detail}</p>
              </div>
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <Link href="/workshop" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-semibold text-indigo-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New workshop
            </Link>
          </div>
        </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
        {hasCharacter ? (
          <>
            {/* Library — horizontal on mobile, vertical rail on desktop */}
            <div className="w-full md:w-[120px] shrink-0 border-b md:border-b-0 md:border-r border-gray-100 bg-white flex md:flex-col overflow-hidden">
              <div className="p-3 pb-2 shrink-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-tight">Library</p>
                  <Link href="/workshop" title="New workshop" aria-label="Start a new workshop" className="w-7 h-7 rounded-md bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 text-gray-500 flex items-center justify-center transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </Link>
                </div>
                <p className="text-[10px] text-gray-500 hidden md:block">{library.length} looks & shots</p>
              </div>
              <div className="flex-1 px-3 pt-1 pb-3 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto">
                <div className="flex md:flex-col gap-2">
                  <ThumbBtn img={character.img} label={character.isUploadedImage ? 'Upload' : 'Profile'} active={canvasImg === character.img} onClick={() => { setCanvasImg(character.img); setCanvasLabel(character.isUploadedImage ? 'Uploaded image' : 'Profile headshot'); }} />
                  {character.referenceSheetUrl && (
                    <ThumbBtn img={character.referenceSheetUrl} label="Ref sheet" active={canvasImg === character.referenceSheetUrl} onClick={() => { setCanvasImg(character.referenceSheetUrl!); setCanvasLabel('8-panel reference sheet'); }} />
                  )}
                  <div className="my-1 border-t border-gray-100" />
                  {library.length === 0 ? (
                    <div className="text-[10px] text-gray-400 py-2 px-1">Generate your first look.</div>
                  ) : library.map((a) => (
                    <ThumbBtn
                      key={a.data.id}
                      img={a.data.imageUrl}
                      label={a.kind === 'outfit' ? 'Look' : 'Shot'}
                      active={canvasImg === a.data.imageUrl}
                      onClick={() => { setCanvasImg(a.data.imageUrl); setCanvasLabel(a.data.prompt); setPrompt(a.data.prompt); }}
                      onDelete={async () => {
                        const endpoint = a.kind === 'outfit'
                          ? `${apiBase}/outfits/${a.data.id}`
                          : `${apiBase}/shots/${a.data.id}`;
                        try {
                          deletedIdsRef.current.add(a.data.id);
                          await fetch(endpoint, { method: 'DELETE' });
                          setWorkshop((prev) => ({
                            ...prev,
                            outfits: prev.outfits.filter((o) => o.id !== a.data.id),
                            shots: prev.shots.filter((s) => s.id !== a.data.id),
                          }));
                          // If the deleted item was on canvas, switch to the source image
                          if (canvasImg === a.data.imageUrl && character) {
                            setCanvasImg(character.img);
                            setCanvasLabel(character.isUploadedImage ? 'Uploaded image' : 'Profile headshot');
                          }
                        } catch {}
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-start justify-center p-4 md:p-8 min-w-0 overflow-y-auto">
              <CanvasArea img={canvasImg} label={canvasLabel} stage={stage} stageText={stageText} isRefSheet={isRefSheet} isWide={isUploadedSource} />
            </div>

            {/* Tool panel */}
            <aside className="w-full md:w-[440px] shrink-0 border-t md:border-t-0 md:border-l border-gray-100 bg-white flex flex-col">
              <div className="p-5 pb-3">
                <div role="tablist" aria-label="Generation mode" className="relative flex bg-gray-50 border border-gray-100 rounded-xl p-1">
                  <button role="tab" aria-selected={mode === 'outfit'} onClick={() => setMode('outfit')} className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${mode === 'outfit' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>Outfit</button>
                  <button role="tab" aria-selected={mode === 'scene'} onClick={() => setMode('scene')} className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${mode === 'scene' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>Scene</button>
                  <button role="tab" aria-selected={false} aria-disabled="true" disabled aria-label="Voice mode (coming soon)" className="flex-1 text-sm font-semibold py-2 rounded-lg opacity-40 text-gray-400 cursor-not-allowed">Voice · soon</button>
                </div>
                <p className="text-xs text-gray-500 mt-2 px-1">{mode === 'outfit' ? 'Swap the outfit. Identity stays locked.' : 'Place into any scene. Identity stays locked.'}</p>
              </div>

              <div className="flex-1 px-5 overflow-y-auto">
                <div className="relative">
                  <label htmlFor="workshop-prompt" className="sr-only">
                    {mode === 'outfit' ? 'Describe the outfit' : 'Describe the scene'}
                  </label>
                  <textarea
                    id="workshop-prompt"
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setPromptCollapsed(false)}
                    placeholder={mode === 'outfit' ? 'Charcoal three-piece suit with a silk pocket square' : 'Shibuya crossing at dusk, neon billboards'}
                    aria-label={mode === 'outfit' ? 'Describe the outfit' : 'Describe the scene'}
                    className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 pt-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:bg-white resize-none transition-colors ${promptCollapsed ? 'pr-10 pb-3 overflow-hidden whitespace-nowrap' : 'pb-12 overflow-y-auto'}`}
                    rows={1}
                  />
                  {prompt.trim() && (
                    <button
                      type="button"
                      onClick={() => setPromptCollapsed((v) => !v)}
                      aria-label={promptCollapsed ? 'Expand prompt' : 'Collapse prompt'}
                      aria-expanded={!promptCollapsed}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-indigo-600 hover:bg-white transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true" className={`transition-transform ${promptCollapsed ? '' : 'rotate-180'}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                  {!promptCollapsed && (
                    <button onClick={improve} disabled={!prompt.trim() || improving}
                      className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 shadow-sm text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md disabled:text-gray-300 disabled:border-gray-100 disabled:shadow-none disabled:cursor-not-allowed transition-all rounded-full px-3 py-1.5">
                      {improving ? (<><div className="w-3 h-3 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />Improving…</>) : (<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" /></svg>Improve</>)}
                    </button>
                  )}
                </div>

                <div className="mt-5">
                  <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadReference(f); e.currentTarget.value = ''; }} />
                  <button onClick={() => { if (referenceFile) setReferenceFile(null); else fileInputRef.current?.click(); }}
                    className={`w-full border-2 border-dashed rounded-xl p-3 transition-all text-left ${referenceFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    {referenceFile ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${referenceFile.url}${referenceFile.url.includes('?') ? '&' : '?'}w=200`} alt="" className="w-8 h-8 rounded-md object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-black">{referenceFile.name}</p>
                          <p className="text-[10px] text-gray-500">Click to remove</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                        <span className="text-xs">{mode === 'outfit' ? 'Or reference a garment photo' : 'Or reference a scene photo'}</span>
                      </div>
                    )}
                  </button>
                </div>
                {error && <div className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</div>}
              </div>

              <div className="p-5 pt-3 border-t border-gray-100 shrink-0">
                {credits === 0 ? (
                <button onClick={() => setShowBuyCredits(true)}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-3.5 rounded-xl transition-all shadow-sm shadow-amber-500/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Top up credits to generate
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!prompt.trim() && !referenceFile) {
                      setError(mode === 'outfit'
                        ? 'Describe an outfit or upload a garment photo to generate.'
                        : 'Describe a scene or upload a scene photo to generate.');
                      return;
                    }
                    generate();
                  }}
                  disabled={stage !== 'idle'}
                  className={`w-full flex items-center justify-center gap-2 font-bold text-sm px-5 py-3.5 rounded-xl transition-all ${
                    canGenerate
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : stage !== 'idle'
                        ? 'bg-indigo-400 text-white/70 cursor-not-allowed'
                        : 'bg-indigo-200 text-white hover:bg-indigo-300 cursor-pointer'
                  }`}
                >
                  {stage === 'generating' ? (<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Generating…</>) :
                   stage === 'uploading' ? (<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading…</>) :
                   (<>Generate <span className="text-white/80">· 1 credit</span></>)}
                </button>
              )}
              </div>
            </aside>
          </>
        ) : (
          /* ── Empty state: workshop shell with upload/pick in the canvas ── */
          <>
            {/* Left rail — horizontal on mobile, vertical on desktop */}
            <div className="w-full md:w-[120px] shrink-0 border-b md:border-b-0 md:border-r border-gray-100 bg-white flex md:flex-col">
              <div className="p-3 pb-2 shrink-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 leading-tight">Your characters</p>
              </div>
              <div className="flex-1 px-3 pt-1 pb-3 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto">
                <div className="flex md:flex-col gap-2">
                  {workshops.length === 0 ? (
                    <div className="text-[10px] text-gray-400 py-2 px-1">Upload or pick a character to start.</div>
                  ) : workshops.map((w) => (
                    <Link key={w.id} href={w.href} className="w-16 md:w-full shrink-0 relative rounded-lg overflow-hidden ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-sm transition-all" style={{ aspectRatio: '3/4' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${w.img}${w.img.includes('?') ? '&' : '?'}w=300`} alt={w.name} className="w-full h-full object-cover object-top" />
                      <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-[10px] font-bold text-white truncate">{w.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Center — upload CTA in the canvas area */}
            <div className="flex-1 flex items-start justify-center pt-[15vh] p-8 min-w-0">
              <div className="w-full max-w-md text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                </div>
                <h2 className="text-xl font-black tracking-tight text-black mb-1">Upload your character</h2>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mb-5">
                  Change their outfit, place them in scenes, and export for your AI video tool.
                </p>

                <input type="file" ref={uploadInputRef} accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadCharacter(f); e.currentTarget.value = ''; }} />

                <button onClick={() => uploadInputRef.current?.click()} disabled={uploading}
                  className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white font-bold text-sm px-5 py-3.5 rounded-xl transition-all shadow-sm shadow-indigo-500/20 mb-3">
                  {uploading ? (<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading…</>) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>Upload your character</>
                  )}
                </button>

                {error && <p className="text-xs text-amber-700 mb-2">{error}</p>}

                <div className="flex items-center gap-3 justify-center my-4">
                  <div className="h-px w-10 bg-gray-200" /><span className="text-[10px] text-gray-400 uppercase tracking-widest">or</span><div className="h-px w-10 bg-gray-200" />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Link href="/#roster" className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black border border-gray-200 hover:border-gray-300 px-3.5 py-2 rounded-lg transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 00-16 0" /></svg>
                    Browse roster
                  </Link>
                  <Link href="/create" className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black border border-gray-200 hover:border-gray-300 px-3.5 py-2 rounded-lg transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" /></svg>
                    Generate new
                  </Link>
                </div>
              </div>
            </div>

            {/* Right — tool panel dimmed */}
            <aside className="hidden md:flex w-[440px] shrink-0 border-l border-gray-100 bg-white flex-col opacity-40 pointer-events-none select-none">
              <div className="p-5 pb-3">
                <div className="relative flex bg-gray-50 border border-gray-100 rounded-xl p-1">
                  <div className="flex-1 text-sm font-semibold py-2 rounded-lg bg-white text-black shadow-sm text-center">Outfit</div>
                  <div className="flex-1 text-sm font-semibold py-2 rounded-lg text-gray-500 text-center">Scene</div>
                  <div className="flex-1 text-sm font-semibold py-2 rounded-lg text-gray-400 text-center">Voice</div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 px-1">Load a character to start.</p>
              </div>
              <div className="flex-1 px-5">
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-400 h-40">
                  Describe an outfit…
                </div>
              </div>
              <div className="p-5 pt-3 border-t border-gray-100">
                <div className="w-full bg-indigo-200 text-white/70 font-bold text-sm px-5 py-3.5 rounded-xl text-center">Generate · 1 credit</div>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Modals */}
      {showRefSheet && character?.referenceSheetUrl && <RefSheetModal url={character.referenceSheetUrl} onClose={() => setShowRefSheet(false)} />}
      {showDownload && <DownloadModal workshop={workshop} apiBase={apiBase} characterName={character?.name ?? 'cast'} onClose={() => setShowDownload(false)} />}
      {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}


      {/* License gate modal — roster characters only */}
      {showLicenseGate && character && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => router.push(`/characters/${character.slug}`)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md border border-gray-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${character.img}${character.img.includes('?') ? '&' : '?'}w=200`} alt="" className="w-14 h-14 rounded-xl object-cover object-top" />
              <div>
                <h2 className="text-lg font-black tracking-tight text-black">{character.name}</h2>
                <p className="text-xs text-gray-500">{character.ageRange} · {character.ethnicity}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              To use this character in the Workshop, accept a license. The <strong>free attribution license</strong> lets you use them with credit to Cast.
            </p>
            <div className="space-y-2 mb-6">
              {[
                { name: 'Free (Attribution)', price: 'Free', amount: 0, desc: 'Credit Cast in your project' },
                { name: 'Single Project', price: '$50', amount: 50, desc: 'One commercial project, no attribution' },
                { name: 'Studio License', price: '$250', amount: 250, desc: 'Unlimited projects for 1 year' },
                { name: 'Exclusive Rights', price: '$1,000', amount: 1000, desc: 'Full ownership, removed from roster' },
              ].map((tier) => (
                <button
                  key={tier.name}
                  disabled={acceptingLicense}
                  onClick={async () => {
                    setAcceptingLicense(true);
                    try {
                      if (tier.amount === 0) {
                        // Free tier — record directly
                        await fetch('/api/purchases', {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify({
                            characterId: character.id,
                            characterName: character.name,
                            characterSlug: character.slug,
                            characterImg: character.img,
                            licenseName: 'Free (Attribution)',
                            licensePrice: 'Free',
                            purchasedAt: new Date().toISOString(),
                            referenceSheetUrl: character.referenceSheetUrl ?? null,
                          }),
                        });
                        setHasLicense(true);
                        setShowLicenseGate(false);
                      } else {
                        // Paid tier — route to Stripe checkout
                        const res = await fetch('/api/checkout', {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify({
                            characterId: character.id,
                            characterName: character.name,
                            characterSlug: character.slug,
                            characterImg: character.img,
                            licenseName: tier.name,
                            licensePrice: tier.price,
                            amount: tier.amount,
                            referenceSheetUrl: character.referenceSheetUrl ?? null,
                            isExclusive: tier.name === 'Exclusive Rights',
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed');
                        window.location.href = data.url;
                      }
                    } catch (err) {
                      setLicenseError(err instanceof Error ? err.message : 'Something went wrong. Try the free license or go back.');
                      setAcceptingLicense(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                    tier.amount === 0
                      ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-black">{tier.name}</p>
                    <p className="text-[10px] text-gray-500">{tier.desc}</p>
                  </div>
                  <span className={`text-sm font-bold ${tier.amount === 0 ? 'text-indigo-600' : 'text-black'}`}>{tier.price}</span>
                </button>
              ))}
            </div>
            {licenseError && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                {licenseError}
              </div>
            )}
            <Link href={`/characters/${character.slug}`} className="block text-center text-xs text-gray-500 hover:text-black transition-colors">
              ← Back to character page
            </Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes workshop-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        @keyframes workshop-progress { 0% { width: 0%; } 10% { width: 15%; } 30% { width: 40%; } 60% { width: 65%; } 80% { width: 80%; } 100% { width: 88%; } }
        .animate-workshop-shimmer { animation: workshop-shimmer 2s ease-in-out infinite; }
        .animate-workshop-progress { animation: workshop-progress 240s cubic-bezier(0.1, 0.5, 0.2, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .animate-workshop-shimmer { animation: none; }
          .animate-workshop-progress { animation: none; width: 40%; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function CreditsChip({ credits, onClick }: { credits: number; onClick: () => void }) {
  const low = credits <= 3;
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${low ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${low ? 'bg-amber-500' : 'bg-indigo-500'}`} />
      <span className="text-sm font-semibold tabular-nums text-black">{credits}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">credits</span>
    </button>
  );
}

function CanvasArea({ img, label, stage, stageText, isRefSheet, isWide }: { img: string; label: string; stage: Stage; stageText: string; isRefSheet?: boolean; isWide?: boolean }) {
  const useContain = isRefSheet || isWide;
  const cClass = useContain
    ? 'relative w-fit max-w-5xl mx-auto rounded-3xl overflow-hidden bg-white shadow-xl shadow-gray-200/70 ring-1 ring-gray-100'
    : 'relative w-full max-w-[520px] rounded-3xl overflow-hidden bg-white shadow-xl shadow-gray-200/70 ring-1 ring-gray-100';
  const iClass = useContain
    ? 'max-w-full max-h-[80vh] w-auto h-auto block'
    : 'w-full h-auto';
  return (
    <div className={`relative ${useContain ? 'w-full max-w-5xl' : 'w-full max-w-[520px]'}`}>
      <div className="absolute -inset-12 bg-gradient-to-br from-indigo-100/30 via-gray-100/40 to-amber-50/30 blur-3xl pointer-events-none" />
      <div className={cClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${img}${img.includes('?') ? '&' : '?'}w=2000`} alt={label}
          className={`${iClass} transition-all duration-500 ${stage === 'generating' ? 'blur-xl opacity-40 scale-105' : 'blur-0 opacity-100 scale-100'}`} />
        {stage === 'generating' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="absolute inset-0 overflow-hidden"><div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-workshop-shimmer" /></div>
            <div className="relative bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-lg">
              <p className="text-sm font-semibold text-black">{stageText}</p>
              <div className="h-1 w-48 bg-gray-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-workshop-progress" /></div>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent hidden md:block">
          <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-0.5">Working from</p>
          <p className="text-white font-semibold text-sm truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ThumbBtn({ img, label, active, onClick, onDelete }: { img: string; label: string; active: boolean; onClick: () => void; onDelete?: () => void }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="w-16 md:w-full shrink-0 relative group">
      <button onClick={onClick} disabled={deleting} className={`w-full relative rounded-lg overflow-hidden transition-all ${deleting ? 'opacity-40' : ''} ${active ? 'ring-2 ring-indigo-500 shadow-md shadow-indigo-500/20' : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-sm'}`} style={{ aspectRatio: '3/4' }} title={label}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${img}${img.includes('?') ? '&' : '?'}w=300`} alt={label} className="w-full h-full object-cover object-top" />
        <div className="absolute top-1 left-1 text-[10px] font-black uppercase tracking-widest text-white px-1.5 py-0.5 rounded bg-black/70 backdrop-blur">{label}</div>
        {deleting && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}
      </button>
      {onDelete && !deleting && (
        <button
          onClick={async (e) => { e.stopPropagation(); setDeleting(true); await onDelete(); }}
          aria-label={`Delete ${label}`}
          title="Delete"
          className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity shadow-sm z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-1"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
    </div>
  );
}

function RefSheetModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8" onClick={onClose}>
      <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-8 right-0 text-white/80 hover:text-white text-sm font-medium">Close · Esc</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${url}${url.includes('?') ? '&' : '?'}w=2000`} alt="Reference sheet" className="w-full rounded-2xl shadow-2xl" />
      </div>
    </div>
  );
}

function DownloadModal({ workshop, apiBase, characterName, onClose }: { workshop: WorkshopData; apiBase: string; characterName: string; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const o = workshop.outfits.length, s = workshop.shots.length;

  const handleDownload = async () => {
    if (!apiBase) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(`${apiBase}/package`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = characterName.replace(/[\\/:*?"<>|]/g, '-').trim() || 'cast';
      a.download = `${safeName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setDownloadError('Download failed — please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8" onClick={onClose}>
      <div className="relative bg-white rounded-3xl p-8 w-full max-w-md border border-gray-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xs font-medium">Esc</button>
        <h2 className="text-xl font-black tracking-tight mb-1 text-black">Your package</h2>
        <p className="text-xs text-gray-500 mb-5">Ready for Kling, Runway, and Veo.</p>
        <div className="space-y-1.5">
          <PkgRow label="Profile photo" />
          <PkgRow label="4K 8-panel reference sheet" />
          <PkgRow label={`${o} outfit${o === 1 ? '' : 's'}`} muted={o === 0} />
          <PkgRow label={`${s} scene${s === 1 ? '' : 's'}`} muted={s === 0} />
          <PkgRow label="Kling / Runway / Veo guide (README)" />
        </div>
        {downloadError && (
          <div role="alert" className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {downloadError}
          </div>
        )}
        <button
          onClick={handleDownload}
          disabled={downloading || !apiBase}
          className="w-full mt-5 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm px-5 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {downloading ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Building package…</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              Download package (Free)
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function PkgRow({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-sm ${muted ? 'opacity-40' : 'text-black'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${muted ? 'bg-gray-200' : 'bg-indigo-500'}`}>
        {!muted && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>}
      </div>
      <span>{label}</span>
    </div>
  );
}
