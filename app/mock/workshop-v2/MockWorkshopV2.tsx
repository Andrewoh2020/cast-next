'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Mock data ───────────────────────────────────────────────────────────

const CHARACTER = {
  name: 'Min-ji Park',
  slug: 'min-ji-park',
  img: '/api/media?p=custom%2Fuser_3CM1Wxh6LIF4NfkCwMyfn1qZUkp%2Fmin-ji-park-profile-1776180802444.jpg',
  referenceSheetUrl: '/api/media?p=custom%2Fuser_3CM1Wxh6LIF4NfkCwMyfn1qZUkp%2Fmin-ji-park-refsheet-1776181227543.jpg',
};

type Asset = { id: string; kind: 'outfit' | 'scene'; prompt: string; img: string };

const MOCK_LIBRARY: Asset[] = [
  { id: 'a1', kind: 'scene', prompt: 'Seoul at blue hour', img: '/api/media?p=scene-portraits%2Fmin-ji-park-1776252882422.jpg' },
  { id: 'a2', kind: 'outfit', prompt: 'Oversized cable-knit sweater', img: '/api/media?p=scene-portraits%2Fakira-shimizu-1776253612303.jpg' },
  { id: 'a3', kind: 'scene', prompt: 'Modern research lab', img: '/api/media?p=scene-portraits%2Fvera-liang-1776255518193.jpg' },
];

// ── Mock existing workshops for the switcher ────────────────────────────
const MOCK_WORKSHOPS = [
  { id: 'w1', name: 'Min-ji Park', img: CHARACTER.img, detail: '3 outfits · 2 scenes' },
  { id: 'w2', name: 'Marcus Stewart', img: '/api/media?p=characters%2Fblack-man-profile-1774443406061.jpg', detail: '1 outfit' },
];

type Mode = 'outfit' | 'scene';
type Stage = 'idle' | 'generating';

// ── Component ───────────────────────────────────────────────────────────

export default function MockWorkshopV2() {
  // hasCharacter simulates whether user has loaded a character
  const [hasCharacter, setHasCharacter] = useState(false);
  const [mode, setMode] = useState<Mode>('outfit');
  const [canvasImg, setCanvasImg] = useState(CHARACTER.img);
  const [canvasLabel, setCanvasLabel] = useState('Profile headshot');
  const [library, setLibrary] = useState<Asset[]>(MOCK_LIBRARY);
  const [credits, setCredits] = useState(23);
  const [prompt, setPrompt] = useState('');
  const [referenceFile, setReferenceFile] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [stageText, setStageText] = useState('');
  const [improving, setImproving] = useState(false);
  const [showRefSheet, setShowRefSheet] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showTooltips, setShowTooltips] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA') return;
      if (e.key === '1') setMode('outfit');
      if (e.key === '2') setMode('scene');
      if (e.key === 'r' && hasCharacter) setShowRefSheet(true);
      if (e.key === 'Escape') { setShowRefSheet(false); setShowSwitcher(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasCharacter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setReferenceFile(null); }, [mode]);

  const canGenerate = !!(prompt.trim() || referenceFile) && stage === 'idle' && credits > 0;

  const improve = () => {
    if (!prompt.trim() || improving) return;
    setImproving(true);
    setTimeout(() => {
      const suffix = mode === 'outfit'
        ? ', fine fabric texture, editorial styling, soft window light, 35mm film grain'
        : ', cinematic composition, shallow depth of field, ambient natural light, 35mm film look';
      setPrompt((p) => (p.endsWith(suffix) ? p : p + suffix));
      setImproving(false);
    }, 800);
  };

  const generate = () => {
    if (!canGenerate) return;
    setStage('generating');
    setStageText(mode === 'outfit' ? 'Sketching the wardrobe…' : 'Building the scene…');
    setTimeout(() => setStageText(mode === 'outfit' ? 'Dressing Min-ji…' : 'Placing Min-ji…'), 1500);
    setTimeout(() => setStageText('Final polish…'), 3200);
    setTimeout(() => {
      const samples = [
        '/api/media?p=scene-portraits%2Fmin-ji-park-1776252882422.jpg',
        '/api/media?p=scene-portraits%2Fakira-shimizu-1776253612303.jpg',
        '/api/media?p=scene-portraits%2Fblack-woman-amara-okonkwo-santos-1776255803474.jpg',
      ];
      const img = samples[Math.floor(Math.random() * samples.length)];
      const newAsset: Asset = { id: `a-${Date.now()}`, kind: mode, prompt: prompt || 'Uploaded reference', img };
      setLibrary((prev) => [newAsset, ...prev]);
      setCanvasImg(img);
      setCanvasLabel(newAsset.prompt);
      setCredits((c) => c - 1);
      setStage('idle');
      setPrompt('');
      setReferenceFile(null);
    }, 4800);
  };

  // Simulate "loading" a character
  const loadCharacter = () => {
    setHasCharacter(true);
    setCanvasImg(CHARACTER.img);
    setCanvasLabel('Profile headshot');
    // Dismiss tooltips after a few seconds
    setTimeout(() => setShowTooltips(false), 6000);
  };

  const isRefSheet = canvasImg === CHARACTER.referenceSheetUrl;

  return (
    <div className={`flex flex-col bg-[#faf7f2] text-gray-900 ${hasCharacter ? 'fixed inset-0 overflow-hidden' : 'min-h-screen'}`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-gray-100 bg-white shrink-0 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="text-xl font-black tracking-tight text-black shrink-0">
            Cast<span className="text-indigo-500">.</span>
          </Link>
          <span className="text-gray-300">·</span>

          {hasCharacter ? (
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="flex items-center gap-2 min-w-0 px-2 py-1 -ml-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${CHARACTER.img}&w=96`} alt="" className="w-6 h-6 rounded-full object-cover object-top shrink-0" />
              <span className="text-sm font-semibold truncate text-black">{CHARACTER.name}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-gray-400 shrink-0">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          ) : (
            <span className="text-sm text-gray-400">No character loaded</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasCharacter && (
            <>
              <button
                onClick={() => setShowRefSheet(true)}
                title="Reference sheet · R"
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                Ref sheet
              </button>
              <button
                className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                Download
              </button>
            </>
          )}
          <div className="h-7 w-px bg-gray-200" />
          <CreditsChip credits={credits} />
        </div>
      </header>

      {/* Character switcher dropdown */}
      {showSwitcher && (
        <div className="absolute top-14 left-24 z-30 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl p-2" onClick={() => setShowSwitcher(false)}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 pt-2 pb-1">Your workshops</p>
          {MOCK_WORKSHOPS.map((w) => (
            <button
              key={w.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${w.img}${w.img.includes('?') ? '&' : '?'}w=96`} alt="" className="w-8 h-8 rounded-lg object-cover object-top" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">{w.name}</p>
                <p className="text-[10px] text-gray-500">{w.detail}</p>
              </div>
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => { setHasCharacter(false); setShowSwitcher(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-semibold text-indigo-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New workshop
            </button>
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
                  <LibraryThumb
                    img={CHARACTER.img}
                    label="Profile"
                    active={canvasImg === CHARACTER.img}
                    onClick={() => { setCanvasImg(CHARACTER.img); setCanvasLabel('Profile headshot'); }}
                  />
                  <LibraryThumb
                    img={CHARACTER.referenceSheetUrl}
                    label="Ref sheet"
                    active={canvasImg === CHARACTER.referenceSheetUrl}
                    onClick={() => { setCanvasImg(CHARACTER.referenceSheetUrl); setCanvasLabel('8-panel reference sheet'); }}
                  />
                  <div className="my-1 border-t border-gray-100" />
                  {library.length === 0 ? (
                    <div className="text-[10px] text-gray-400 py-2 px-1">Generate your first look.</div>
                  ) : (
                    library.map((a) => (
                      <LibraryThumb
                        key={a.id}
                        img={a.img}
                        label={a.kind === 'outfit' ? 'Look' : 'Shot'}
                        active={canvasImg === a.img}
                        onClick={() => { setCanvasImg(a.img); setCanvasLabel(a.prompt); }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-8 min-w-0 relative">
              <CanvasArea img={canvasImg} label={canvasLabel} stage={stage} stageText={stageText} isRefSheet={isRefSheet} />

              {/* First-time tooltip overlay */}
              {showTooltips && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-3 z-10" onClick={() => setShowTooltips(false)}>
                  <span className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  Describe an outfit on the right
                  <span className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  Hit Generate
                  <button className="text-white/60 hover:text-white ml-1">Dismiss</button>
                </div>
              )}
            </div>

            {/* Tool panel */}
            <aside className="w-[440px] shrink-0 border-l border-gray-100 bg-white flex flex-col">
              <div className="p-5 pb-3">
                <div className="relative flex bg-gray-50 border border-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setMode('outfit')}
                    className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${mode === 'outfit' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                  >
                    Outfit
                  </button>
                  <button
                    onClick={() => setMode('scene')}
                    className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${mode === 'scene' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                  >
                    Scene · soon
                  </button>
                  <button disabled className="flex-1 text-sm font-semibold py-2 rounded-lg opacity-40 text-gray-400 cursor-not-allowed">Voice · soon</button>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 px-1">
                  {mode === 'outfit' ? 'Swap the outfit. Identity stays locked.' : 'Place her current look into any scene.'}
                </p>
              </div>

              <div className="flex-1 px-5 overflow-y-auto">
                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === 'outfit'
                      ? 'Charcoal three-piece suit with a silk pocket square'
                      : 'Shibuya crossing at dusk, neon billboards'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pb-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white resize-none transition-colors"
                    rows={6}
                    autoFocus
                  />
                  <button
                    onClick={improve}
                    disabled={!prompt.trim() || improving}
                    title="Enrich your description"
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 shadow-sm text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md disabled:text-gray-300 disabled:border-gray-100 disabled:shadow-none disabled:cursor-not-allowed transition-all rounded-full px-3 py-1.5"
                  >
                    {improving ? (
                      <><div className="w-3 h-3 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />Improving…</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" /></svg>Improve</>
                    )}
                  </button>
                </div>

                <div className="mt-5">
                  <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={() => { setReferenceFile('silk-blouse.jpg'); }} />
                  <button
                    onClick={() => { if (referenceFile) setReferenceFile(null); else fileInputRef.current?.click(); }}
                    className={`w-full border-2 border-dashed rounded-xl p-3 transition-all text-left ${referenceFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {referenceFile ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">IMG</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-black">{referenceFile}</p>
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
              </div>

              <div className="p-5 pt-3 border-t border-gray-100 shrink-0">
                <button
                  onClick={generate}
                  disabled={!canGenerate}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-sm px-5 py-3.5 rounded-xl transition-all shadow-sm shadow-indigo-500/30 disabled:shadow-none"
                >
                  {stage === 'generating' ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Generating…</>
                  ) : (
                    <>Generate <span className="text-white/80">· 5 credits</span></>
                  )}
                </button>
              </div>
            </aside>
          </>
        ) : (
          /* ── Empty state: no character loaded ─────────────────────── */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-lg text-center">
              {/* Upload area as the hero */}
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-black mb-2">Upload your character</h2>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Change their outfit, place them in any scene, and export a package ready for your AI video tools.
                </p>
              </div>

              <input type="file" ref={uploadInputRef} accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={() => loadCharacter()} />

              <button
                onClick={() => uploadInputRef.current?.click()}
                className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm px-6 py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload your character
              </button>

              <div className="flex items-center gap-3 justify-center mb-8">
                <div className="h-px w-12 bg-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-widest">or</span>
                <div className="h-px w-12 bg-gray-200" />
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

              {/* What you'll get — visual proof */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">What you&apos;ll get</p>
                <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-2">
                  {/* Step 1: Outfit variants — reference sheet */}
                  <div className="text-center">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${CHARACTER.referenceSheetUrl}&w=600`} alt="8-panel reference sheet" className="w-full h-full object-cover object-left-top" />
                      <div className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase tracking-widest text-white bg-black/70 backdrop-blur rounded px-1.5 py-0.5">8 angles</div>
                    </div>
                    <p className="text-xs font-semibold text-black">Change their outfit</p>
                    <p className="text-[10px] text-gray-500">Same identity, new wardrobe</p>
                  </div>

                  {/* Step 2: Scene shots */}
                  <div className="text-center">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/api/media?p=scene-portraits%2Fmin-ji-park-1776252882422.jpg&w=400" alt="" className="w-full h-full object-cover object-top" />
                      <div className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase tracking-widest text-white bg-black/70 backdrop-blur rounded px-1.5 py-0.5">Scene</div>
                    </div>
                    <p className="text-xs font-semibold text-black">Scene placement</p>
                    <p className="text-[10px] text-gray-500">Any location, matched lighting</p>
                  </div>

                  {/* Step 3: Export package */}
                  <div className="text-center">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-200 mb-2 flex flex-col items-center justify-center p-3 gap-1.5">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.5}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
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

              {/* Existing workshops */}
              {MOCK_WORKSHOPS.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-100">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Continue a workshop</p>
                  <div className="flex justify-center gap-3">
                    {MOCK_WORKSHOPS.map((w) => (
                      <button
                        key={w.id}
                        onClick={loadCharacter}
                        className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-md hover:border-gray-200 transition-all text-left"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${w.img}${w.img.includes('?') ? '&' : '?'}w=96`} alt="" className="w-10 h-10 rounded-lg object-cover object-top" />
                        <div>
                          <p className="text-sm font-semibold text-black">{w.name}</p>
                          <p className="text-[10px] text-gray-500">{w.detail}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRefSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setShowRefSheet(false)}>
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowRefSheet(false)} className="absolute -top-8 right-0 text-white/80 hover:text-white text-sm font-medium">Close · Esc</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${CHARACTER.referenceSheetUrl}&w=2000`} alt="Reference sheet" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes ws2-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        @keyframes ws2-progress { 0% { width: 0%; } 100% { width: 100%; } }
        .animate-ws2-shimmer { animation: ws2-shimmer 2s ease-in-out infinite; }
        .animate-ws2-progress { animation: ws2-progress 4.5s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function CreditsChip({ credits }: { credits: number }) {
  const low = credits <= 3;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${low ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${low ? 'bg-amber-500' : 'bg-indigo-500'}`} />
      <span className="text-sm font-semibold tabular-nums text-black">{credits}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">credits</span>
    </div>
  );
}

function CanvasArea({ img, label, stage, stageText, isRefSheet }: { img: string; label: string; stage: Stage; stageText: string; isRefSheet?: boolean }) {
  const containerClass = isRefSheet
    ? 'relative w-full max-w-5xl rounded-3xl overflow-hidden bg-white shadow-xl shadow-gray-200/70 ring-1 ring-gray-100'
    : 'relative w-full max-w-[520px] aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-xl shadow-gray-200/70 ring-1 ring-gray-100';
  const imgClass = isRefSheet ? 'w-full h-auto object-contain' : 'w-full h-full object-cover object-top';

  return (
    <div className={`relative ${isRefSheet ? 'w-full max-w-5xl' : 'w-full max-w-[520px]'}`}>
      <div className="absolute -inset-12 bg-gradient-to-br from-indigo-100/30 via-gray-100/40 to-amber-50/30 blur-3xl pointer-events-none" />
      <div className={containerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${img}${img.includes('?') ? '&' : '?'}w=2000`}
          alt={label}
          className={`${imgClass} transition-all duration-500 ${stage === 'generating' ? 'blur-xl opacity-40 scale-105' : 'blur-0 opacity-100 scale-100'}`}
        />
        {stage === 'generating' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="absolute inset-0 overflow-hidden"><div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-ws2-shimmer" /></div>
            <div className="relative bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-lg">
              <p className="text-sm font-semibold text-black">{stageText}</p>
              <div className="h-1 w-48 bg-gray-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-ws2-progress" /></div>
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

function LibraryThumb({ img, label, active, onClick }: { img: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full group relative rounded-lg overflow-hidden transition-all ${active ? 'ring-2 ring-indigo-500 shadow-md shadow-indigo-500/20' : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-sm'}`}
      style={{ aspectRatio: '3 / 4' }}
      title={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${img}${img.includes('?') ? '&' : '?'}w=300`} alt={label} className="w-full h-full object-cover object-top" />
      <div className="absolute top-1 left-1 text-[8px] font-black uppercase tracking-widest text-white px-1.5 py-0.5 rounded bg-black/70 backdrop-blur">{label}</div>
    </button>
  );
}
