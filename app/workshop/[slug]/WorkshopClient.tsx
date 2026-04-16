'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { WorkshopData, OutfitVariant, SceneShot } from '@/lib/workshop.server';

export interface WorkshopCharacter {
  id: number | string;
  slug: string;
  name: string;
  ageRange?: string;
  ethnicity?: string;
  img: string;
  referenceSheetUrl?: string;
  licenseName: string;
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
  const [canvasLabel, setCanvasLabel] = useState(initChar ? 'Profile headshot' : '');
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

  const hasCharacter = !!character;
  const creditConfirmedRef = useRef(false);

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
          }
        } catch {}
        // Clean up URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('credits');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, '', url.toString());
      })();
    }
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
    const suffix = mode === 'outfit'
      ? ', fine fabric texture, editorial styling, soft window light, 35mm film grain'
      : ', cinematic composition, shallow depth of field, ambient natural light, 35mm film look';
    await new Promise((r) => setTimeout(r, 400));
    setPrompt((p) => (p.endsWith(suffix) ? p : p + suffix));
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

  const generate = async () => {
    if (!canGenerate || !character || !apiBase) return;
    setStage('generating');
    setError(null);

    const isOutfit = mode === 'outfit';
    const firstName = character.name.split(' ')[0];
    setStageText(isOutfit ? 'Sketching the wardrobe…' : 'Building the scene…');
    const t1 = setTimeout(() => setStageText(isOutfit ? `Dressing ${firstName}…` : `Placing ${firstName}…`), 1500);
    const t2 = setTimeout(() => setStageText('Final polish…'), 3500);

    const endpoint = isOutfit ? `${apiBase}/outfits` : `${apiBase}/shots`;
    const bodyPayload = isOutfit
      ? { prompt, sourceImageUrl: canvasImg, garmentRefUrl: referenceFile?.url }
      : { prompt, sourceImageUrl: canvasImg, sceneRefUrl: referenceFile?.url };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      clearTimeout(t1); clearTimeout(t2);
      if (!res.ok) throw new Error((await res.json())?.error || `Failed (${res.status})`);
      const json = await res.json();
      const result = (isOutfit ? json.outfit : json.shot) as OutfitVariant | SceneShot;
      setWorkshop(json.workshop as WorkshopData);
      setCredits((c) => c - 1);
      setCanvasImg(result.imageUrl);
      setCanvasLabel(result.prompt || (isOutfit ? 'New outfit' : 'New scene'));
      setPrompt('');
      setReferenceFile(null);
    } catch (err) {
      clearTimeout(t1); clearTimeout(t2);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStage('idle');
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

  return (
    <div className={`flex flex-col bg-[#faf7f2] text-gray-900 ${hasCharacter ? 'fixed inset-0 overflow-hidden' : 'min-h-screen'}`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-gray-100 bg-white shrink-0 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="text-xl font-black tracking-tight text-black shrink-0">Cast<span className="text-indigo-500">.</span></Link>
          <span className="text-gray-300">·</span>
          {hasCharacter ? (
            <button onClick={() => setShowSwitcher(!showSwitcher)} className="flex items-center gap-2 min-w-0 px-2 py-1 -ml-2 rounded-lg hover:bg-gray-50 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${character.img}${character.img.includes('?') ? '&' : '?'}w=96`} alt="" className="w-6 h-6 rounded-full object-cover object-top shrink-0" />
              <span className="text-sm font-semibold truncate text-black">{character.name}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-gray-400 shrink-0"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          ) : (
            <span className="text-sm text-gray-400">Workshop</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasCharacter && (
            <>
              <button onClick={() => setShowDownload(true)} className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                Export package
              </button>
            </>
          )}
          <div className="h-7 w-px bg-gray-200" />
          <CreditsChip credits={credits} onClick={() => setShowBuyCredits(true)} />
        </div>
      </header>

      {/* Character switcher */}
      {showSwitcher && (
        <div className="absolute top-14 left-24 z-30 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl p-2" onClick={() => setShowSwitcher(false)}>
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
      )}

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {hasCharacter ? (
          <>
            {/* Library rail */}
            <div className="w-[120px] shrink-0 border-r border-gray-100 bg-white flex flex-col">
              <div className="p-3 pb-2 shrink-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 leading-tight">Library</p>
                <p className="text-[9px] text-gray-400 mt-0.5">{library.length} looks & shots</p>
              </div>
              <div className="flex-1 px-3 pb-3 overflow-y-auto">
                <div className="flex flex-col gap-2">
                  <ThumbBtn img={character.img} label="Profile" active={canvasImg === character.img} onClick={() => { setCanvasImg(character.img); setCanvasLabel('Profile headshot'); }} />
                  {character.referenceSheetUrl && (
                    <ThumbBtn img={character.referenceSheetUrl} label="Ref sheet" active={canvasImg === character.referenceSheetUrl} onClick={() => { setCanvasImg(character.referenceSheetUrl!); setCanvasLabel('8-panel reference sheet'); }} />
                  )}
                  <div className="my-1 border-t border-gray-100" />
                  {library.length === 0 ? (
                    <div className="text-[10px] text-gray-400 py-2 px-1">Generate your first look.</div>
                  ) : library.map((a) => (
                    <ThumbBtn key={a.data.id} img={a.data.imageUrl} label={a.kind === 'outfit' ? 'Look' : 'Shot'} active={canvasImg === a.data.imageUrl} onClick={() => { setCanvasImg(a.data.imageUrl); setCanvasLabel(a.data.prompt); }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-8 min-w-0">
              <CanvasArea img={canvasImg} label={canvasLabel} stage={stage} stageText={stageText} isRefSheet={isRefSheet} />
            </div>

            {/* Tool panel */}
            <aside className="w-[440px] shrink-0 border-l border-gray-100 bg-white flex flex-col">
              <div className="p-5 pb-3">
                <div className="relative flex bg-gray-50 border border-gray-100 rounded-xl p-1">
                  <button onClick={() => setMode('outfit')} className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${mode === 'outfit' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>Outfit</button>
                  <button onClick={() => setMode('scene')} className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${mode === 'scene' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>Scene</button>
                  <button disabled className="flex-1 text-sm font-semibold py-2 rounded-lg opacity-40 text-gray-400 cursor-not-allowed">Voice · soon</button>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 px-1">{mode === 'outfit' ? 'Swap the outfit. Identity stays locked.' : 'Place into any scene. Identity stays locked.'}</p>
              </div>

              <div className="flex-1 px-5 overflow-y-auto">
                <div className="relative">
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === 'outfit' ? 'Charcoal three-piece suit with a silk pocket square' : 'Shibuya crossing at dusk, neon billboards'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pb-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white resize-none transition-colors" rows={6} autoFocus />
                  <button onClick={improve} disabled={!prompt.trim() || improving}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 shadow-sm text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md disabled:text-gray-300 disabled:border-gray-100 disabled:shadow-none disabled:cursor-not-allowed transition-all rounded-full px-3 py-1.5">
                    {improving ? (<><div className="w-3 h-3 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />Improving…</>) : (<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" /></svg>Improve</>)}
                  </button>
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
          /* ── Empty state ──────────────────────────────────────────── */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-xl text-center">
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-black mb-2">Upload your character</h2>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Change their outfit, place them in any scene, and export a package ready for your AI video tools.
                </p>
              </div>

              <input type="file" ref={uploadInputRef} accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadCharacter(f); e.currentTarget.value = ''; }} />

              <button onClick={() => uploadInputRef.current?.click()} disabled={uploading}
                className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white font-bold text-sm px-6 py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 mb-4">
                {uploading ? (<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading…</>) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>Upload your character</>
                )}
              </button>

              {error && <p className="text-xs text-amber-700 mb-2">{error}</p>}

              <div className="flex items-center gap-3 justify-center mb-8">
                <div className="h-px w-12 bg-gray-200" /><span className="text-xs text-gray-400 uppercase tracking-widest">or</span><div className="h-px w-12 bg-gray-200" />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/#roster" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black border border-gray-200 hover:border-gray-400 px-5 py-3 rounded-xl transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 00-16 0" /></svg>
                  Pick from the roster
                </Link>
                <Link href="/create" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black border border-gray-200 hover:border-gray-400 px-5 py-3 rounded-xl transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" /></svg>
                  Generate from scratch
                </Link>
              </div>

              {/* What you'll get */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">What you&apos;ll get</p>
                <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-2">
                  <div className="text-center">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/api/media?p=custom%2Fuser_3CM1Wxh6LIF4NfkCwMyfn1qZUkp%2Fmin-ji-park-refsheet-1776181227543.jpg&w=400" alt="" className="w-full h-full object-cover object-left-top" />
                      <div className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase tracking-widest text-white bg-black/70 backdrop-blur rounded px-1.5 py-0.5">8 angles</div>
                    </div>
                    <p className="text-xs font-semibold text-black">Change their outfit</p>
                    <p className="text-[10px] text-gray-500">Same identity, new wardrobe</p>
                  </div>
                  <div className="text-center">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/api/media?p=scene-portraits%2Fmin-ji-park-1776252882422.jpg&w=400" alt="" className="w-full h-full object-cover object-top" />
                      <div className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase tracking-widest text-white bg-black/70 backdrop-blur rounded px-1.5 py-0.5">Scene</div>
                    </div>
                    <p className="text-xs font-semibold text-black">Place in any scene</p>
                    <p className="text-[10px] text-gray-500">Any location, matched lighting</p>
                  </div>
                  <div className="text-center">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-200 mb-2 flex flex-col items-center justify-center p-3 gap-1.5">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                      <div className="space-y-1 w-full">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-[9px] text-gray-600 text-left">Profile + ref sheet</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-[9px] text-gray-600 text-left">All outfit variants</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-[9px] text-gray-600 text-left">All scene shots</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-300" /><span className="text-[9px] text-gray-400 text-left">Voice · coming soon</span></div>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-black">Export package</p>
                    <p className="text-[10px] text-gray-500">Ready for Kling, Runway, Veo</p>
                  </div>
                </div>
              </div>

              {/* Continue a workshop */}
              {workshops.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-100">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Continue a workshop</p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {workshops.map((w) => (
                      <Link key={w.id} href={w.href}
                        className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-md hover:border-gray-200 transition-all text-left">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${w.img}${w.img.includes('?') ? '&' : '?'}w=96`} alt="" className="w-10 h-10 rounded-lg object-cover object-top" />
                        <div>
                          <p className="text-sm font-semibold text-black">{w.name}</p>
                          <p className="text-[10px] text-gray-500">{w.detail}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRefSheet && character?.referenceSheetUrl && <RefSheetModal url={character.referenceSheetUrl} onClose={() => setShowRefSheet(false)} />}
      {showDownload && <DownloadModal workshop={workshop} apiBase={apiBase} onClose={() => setShowDownload(false)} />}
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
        @keyframes workshop-progress { 0% { width: 0%; } 100% { width: 100%; } }
        .animate-workshop-shimmer { animation: workshop-shimmer 2s ease-in-out infinite; }
        .animate-workshop-progress { animation: workshop-progress 5s ease-out forwards; }
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

function BuyCreditsModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<number | null>(null);

  const packages = [
    { credits: 1, price: '$10', label: '1 credit', desc: '1 outfit or scene generation', index: 0 },
    { credits: 7, price: '$50', label: '7 credits', desc: 'Best value — 7 generations', index: 1 },
  ];

  const handleBuy = async (pkgIndex: number) => {
    setLoading(pkgIndex);
    try {
      const returnUrl = window.location.pathname;
      const res = await fetch('/api/create/purchase-credits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ packageIndex: pkgIndex, returnUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed');
      window.location.href = data.url;
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8" onClick={onClose}>
      <div className="relative bg-white rounded-3xl p-8 w-full max-w-sm border border-gray-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xs font-medium">Esc</button>
        <h2 className="text-xl font-black tracking-tight mb-1 text-black">Get more credits</h2>
        <p className="text-xs text-gray-500 mb-6">Each credit generates one outfit or scene variant.</p>
        <div className="space-y-3">
          {packages.map((pkg) => (
            <button
              key={pkg.index}
              onClick={() => handleBuy(pkg.index)}
              disabled={loading !== null}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all text-left ${
                pkg.index === 1
                  ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 ring-1 ring-indigo-200'
                  : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-black">{pkg.label}</span>
                  {pkg.index === 1 && <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">Best value</span>}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{pkg.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                {loading === pkg.index && <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />}
                <span className="text-lg font-black text-black">{pkg.price}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CanvasArea({ img, label, stage, stageText, isRefSheet }: { img: string; label: string; stage: Stage; stageText: string; isRefSheet?: boolean }) {
  const cClass = isRefSheet
    ? 'relative w-full max-w-5xl rounded-3xl overflow-hidden bg-white shadow-xl shadow-gray-200/70 ring-1 ring-gray-100'
    : 'relative w-full max-w-[520px] aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-xl shadow-gray-200/70 ring-1 ring-gray-100';
  const iClass = isRefSheet ? 'w-full h-auto object-contain' : 'w-full h-full object-cover object-top';
  return (
    <div className={`relative ${isRefSheet ? 'w-full max-w-5xl' : 'w-full max-w-[520px]'}`}>
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
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-0.5">Working from</p>
          <p className="text-white font-semibold text-sm truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ThumbBtn({ img, label, active, onClick }: { img: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full relative rounded-lg overflow-hidden transition-all ${active ? 'ring-2 ring-indigo-500 shadow-md shadow-indigo-500/20' : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-sm'}`} style={{ aspectRatio: '3/4' }} title={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${img}${img.includes('?') ? '&' : '?'}w=300`} alt={label} className="w-full h-full object-cover object-top" />
      <div className="absolute top-1 left-1 text-[8px] font-black uppercase tracking-widest text-white px-1.5 py-0.5 rounded bg-black/70 backdrop-blur">{label}</div>
    </button>
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

function DownloadModal({ workshop, apiBase, onClose }: { workshop: WorkshopData; apiBase: string; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const o = workshop.outfits.length, s = workshop.shots.length;

  const handleDownload = async () => {
    if (!apiBase) return;
    setDownloading(true);
    try {
      const res = await fetch(`${apiBase}/package`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cast-package.zip';
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      alert('Download failed — please try again.');
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
        <button
          onClick={handleDownload}
          disabled={downloading || !apiBase}
          className="w-full mt-5 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm px-5 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {downloading ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Building package…</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
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
