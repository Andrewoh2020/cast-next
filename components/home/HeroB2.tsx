'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import LivingMarquee from './LivingMarquee';
import ExportReel, { type ReelCharacter } from './ExportReel';

const PLACEHOLDER_EXAMPLES = [
  '30-year-old Korean man, detective in a rumpled blazer',
  'Elderly Nigerian grandmother from Lagos in a crimson sari',
  '45-year-old American firefighter, man, weathered hands',
  'French woman, 25, violinist in a midnight-blue gown',
  'Retired American male astronaut with silver hair, Mojave',
  'Teenage Japanese boy skateboarder in Tokyo, bleached hair',
  '38-year-old Nigerian male architect, tailored charcoal suit',
  'Brazilian woman, 26, barista with ink-dark curls and hoop earrings',
  '52-year-old Scottish fisherman, man, weathered face',
  'Vietnamese woman chef in a linen apron, sweat on her brow',
  '29-year-old Persian woman photojournalist, leather jacket',
  'Elderly Polish grandfather in a wool newsboy cap',
  '34-year-old Indian male AI researcher in rimless glasses',
  'French woman pastry chef dusted with flour, smiling, 38',
  '40-year-old Ethiopian male marathoner in race-day kit',
  'Swedish woman, 33, architect in a minimalist cream turtleneck',
];

/**
 * Archetype chips — curated casting archetypes that translate across film, ad,
 * and editorial work. Each chip has 10 distinct prompt variations. Clicking a
 * chip multiple times cycles through variants so users get fresh inspiration
 * instead of the same prompt every time.
 */
const ARCHETYPE_CHIPS: { label: string; prompts: string[] }[] = [
  {
    label: 'CEO',
    prompts: [
      'Japanese-American woman CEO, 42, tailored navy suit, sharp side part, composed expression',
      'Nigerian male tech CEO, 35, charcoal bespoke suit, clean-shaven, steady gaze',
      'Swedish woman CEO, 52, cream turtleneck under a gray blazer, silver-streaked bob',
      'Brazilian male fintech founder, 41, navy suit without a tie, warm confident smile',
      'Korean woman CEO, 38, tailored cream suit, slicked-back ponytail, minimal jewelry',
      'Indian male venture capitalist, 45, charcoal three-piece suit, pocket square, salt-and-pepper hair',
      'Mexican woman startup CEO, 33, rolled-up oxford sleeves, arms crossed, quiet confidence',
      'British man CEO, 58, navy pinstripe suit, silver hair, direct expression',
      'Kenyan woman CEO, 47, emerald blazer over a silk blouse, gold hoop earrings',
      'French man CEO, 50, cuffed dress shirt, tortoiseshell glasses, poised stance',
    ],
  },
  {
    label: 'Athlete',
    prompts: [
      'Kenyan male marathoner, 28, race-day singlet, lean build, sweat on his brow',
      'Brazilian woman gymnast, 22, fitted leotard, hair in a tight bun, chalked hands',
      'Japanese male surfer, 26, wetsuit half-zipped, damp salt-tangled hair, tanned skin',
      'Nigerian woman sprinter, 25, track kit, braided hair, taut athletic posture',
      'Norwegian male cross-country skier, 32, ski kit, goggles up on his forehead, windburned cheeks',
      'American woman pro boxer, 30, fitted tank top, wrapped hands, defined shoulders',
      'Italian male road cyclist, 35, team kit jersey, salt-crusted fabric, close-cropped hair',
      'Australian woman surfer, 24, rash guard, sun-bleached hair, freckled skin',
      'Moroccan male rock climber, 29, tank top, chalk bag on hip, lean muscular forearms',
      'South African woman triathlete, 31, tri-suit, wet hair slicked back, shoulder tan lines',
    ],
  },
  {
    label: 'Chef',
    prompts: [
      'French woman chef, 38, white linen apron dusted with flour, small knowing smile',
      'Japanese male sushi chef, 55, pristine white jacket, kitchen headband, focused expression',
      'Mexican woman pastry chef, 34, blue apron over a white tee, hair pulled back, warm gaze',
      'Italian male pasta chef, 48, flour-dusted forearms, rolled sleeves, thick mustache',
      'Ethiopian woman chef, 42, colorful apron, headwrap, bright wide smile',
      'American male barbecue pitmaster, 50, apron smeared with sauce, thick beard, trucker cap',
      'Thai woman street-food chef, 45, rolled bandana, light cotton apron, steady gaze',
      'Spanish male tapas chef, 39, red apron over a black tee, tattooed forearms',
      'Korean woman kimchi chef, 60, rolled sleeves and blue apron, graying bun',
      'New Zealand male chef, 36, pressed chef whites, short beard, tanned skin',
    ],
  },
  {
    label: 'Artist',
    prompts: [
      'Moroccan woman textile artist, 42, indigo-dyed hands, embroidered smock, silver earrings',
      'Nigerian male painter, 30, paint-smeared denim smock, short dreadlocks, thoughtful expression',
      'Japanese woman ceramicist, 48, canvas apron, clay on her forearms, hair tied back',
      'French male sculptor, 55, dusty linen apron, weathered hands, salt-and-pepper stubble',
      'Indian woman illustrator, 27, paint-splattered jeans and cardigan, ink-stained fingers',
      'Peruvian male weaver, 65, handmade wool vest, silver-streaked hair, calm expression',
      'Italian woman fresco painter, 35, paint-flecked overalls, hair tied with a stained cloth',
      'Mexican male muralist, 40, spray-paint-splattered jacket, bandana, intense look',
      'Korean woman calligrapher, 52, simple linen tunic, ink marks on her fingers',
      'Scottish male photographer-artist, 33, wool sweater, camera strap across his chest',
    ],
  },
  {
    label: 'Musician',
    prompts: [
      'Black male jazz pianist, 55, velvet blazer over an open collar, fedora, silver goatee',
      'Cuban woman salsa singer, 32, sequined dress, bold red lip, large hoop earrings',
      'Icelandic male cellist, 40, cream wool sweater, windswept hair, quiet focus',
      'Indian woman sitar player, 60, traditional silk sari, gold jewelry, serene expression',
      'Brazilian male samba drummer, 29, colorful carnival costume, sweat-shined skin, wide grin',
      'German woman techno DJ, 30, headphones around her neck, platinum-blonde pixie cut, all black',
      'Irish male fiddler, 45, waistcoat over a rolled-sleeve shirt, ginger beard',
      'Korean woman K-pop artist, 24, bold stage makeup, glittered crop top, confident pose',
      'American woman folk guitarist, 38, denim jacket, loose braids, warm smile',
      'Malian male kora player, 52, embroidered boubou, quiet grin, weathered hands',
    ],
  },
  {
    label: 'Journalist',
    prompts: [
      'Persian woman photojournalist, 29, leather jacket, camera strap across her chest',
      'American male war correspondent, 44, flak jacket over a field shirt, graying stubble',
      'Japanese woman news anchor, 36, tailored blazer, sleek bob, sharp eyeliner',
      'Nigerian male investigative reporter, 41, rolled-up oxford sleeves, loosened tie, tired intense eyes',
      'French woman magazine editor, 50, tailored black suit, silver bob, red lip',
      'British male foreign correspondent, 38, beige field shirt, khaki vest, weathered face',
      'Mexican woman crime reporter, 33, blazer over a tee, press lanyard around her neck',
      'Korean male tech journalist, 29, minimalist oxford and chinos, wire-frame glasses',
      'Ukrainian woman journalist, 42, press vest, windblown hair, set jaw',
      'Argentine male sports journalist, 48, polo shirt, press lanyard, warm smile',
    ],
  },
];

export type HeroVariant = 'marquee' | 'export-reel';

interface HeroB2Props {
  /** Bottom half of the hero. `marquee` (default) = character procession;
   *  `export-reel` = narrative strip showing Cast → Kling/Higgsfield/Artlist → video. */
  variant?: HeroVariant;
  /** Characters to rotate through when variant === 'export-reel'. Ignored
   *  for the marquee variant. */
  reelCharacters?: ReelCharacter[];
}

/**
 * Variant B:2 — Text at top, dynamic section below.
 * Bottom section is either the LivingMarquee (default) or the ExportReel
 * pipeline narrative, controlled by the `variant` prop.
 */
export default function HeroB2({ variant = 'marquee', reelCharacters = [] }: HeroB2Props) {
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [cursorOn, setCursorOn] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [uploadStartedAt, setUploadStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const router = useRouter();
  const { isSignedIn } = useUser();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Track per-chip click count so each click cycles to the next prompt variant
  const chipClickCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (query) return;
    if (reduceMotion) {
      setTypedPlaceholder(PLACEHOLDER_EXAMPLES[placeholderIdx]);
      return;
    }
    const target = PLACEHOLDER_EXAMPLES[placeholderIdx];
    let i = 0;
    const type = () => {
      if (i <= target.length) {
        setTypedPlaceholder(target.slice(0, i));
        i++;
        typingTimerRef.current = setTimeout(type, 40);
      } else {
        typingTimerRef.current = setTimeout(() => {
          setPlaceholderIdx(p => (p + 1) % PLACEHOLDER_EXAMPLES.length);
        }, 2500);
      }
    };
    type();
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); };
  }, [placeholderIdx, query, reduceMotion]);

  // Blink the placeholder cursor every 530ms (respects reduced motion)
  useEffect(() => {
    if (query || reduceMotion) {
      setCursorOn(false);
      return;
    }
    const interval = setInterval(() => setCursorOn(c => !c), 530);
    return () => clearInterval(interval);
  }, [query, reduceMotion]);

  // Tick a clock once per second while uploading so the elapsed timer +
  // progress bar update smoothly. No-op when idle.
  useEffect(() => {
    if (!uploading) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [uploading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/create?prompt=${encodeURIComponent(q)}`);
  };

  const handleUploadClick = () => {
    setUploadError('');
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent('/workshop'));
      return;
    }
    fileInputRef.current?.click();
  };

  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    setUploadStartedAt(Date.now());
    setUploadStatus('Uploading your photo…');

    // Stash a local preview so the overlay can show what's being processed
    const previewUrl = URL.createObjectURL(file);
    setUploadPreview(previewUrl);

    // Cycle status copy so the wait reads as forward motion. Each stage maps
    // roughly to where the server is in the pipeline.
    const stages: { at: number; label: string }[] = [
      { at: 0,    label: 'Uploading your photo…' },
      { at: 8,    label: 'Locking the character’s identity…' },
      { at: 25,   label: 'Generating studio profile photo…' },
      { at: 80,   label: 'Building 4K 8-panel reference sheet…' },
      { at: 140,  label: 'Almost there — finishing up…' },
    ];
    const startedAt = Date.now();
    const stageInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const stage = stages.filter((s) => s.at <= elapsed).pop();
      if (stage) setUploadStatus(stage.label);
    }, 1000);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^.]+$/, '').slice(0, 60) || 'My character');
      const res = await fetch('/api/workshop/custom', { method: 'POST', body: formData });
      const data = (await res.json()) as { workshop?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      if (!data.workshop?.id) throw new Error('Upload succeeded but no workshop returned');
      router.push(`/workshop/custom/${data.workshop.id}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setUploadStartedAt(null);
      URL.revokeObjectURL(previewUrl);
      setUploadPreview('');
    } finally {
      clearInterval(stageInterval);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Upload progress overlay calculations ──────────────────────────────
  // Conversion runs 2 i2i generations on Fal at 4K — typical end-to-end is
  // 90–150s. We cap the visible progress bar at 95% until the request
  // actually returns, so a slow generation never shows "100%" before the
  // workshop is ready. The bar fills against an estimate; the timer beneath
  // it shows the true elapsed time.
  const UPLOAD_ETA_SECONDS = 150;
  const elapsedMs = uploadStartedAt ? Math.max(0, now - uploadStartedAt) : 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const percent = Math.min(95, (elapsedSec / UPLOAD_ETA_SECONDS) * 100);
  const remaining = Math.max(0, UPLOAD_ETA_SECONDS - elapsedSec);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <section className="relative bg-white overflow-hidden">
      {/* ── Upload progress overlay ────────────────────────────────────── */}
      {uploading && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-overlay-title"
          className="fixed inset-0 z-50 bg-white/85 backdrop-blur-md flex items-center justify-center px-6"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-2xl p-7 sm:p-8">
            <div className="flex items-start gap-4 mb-5">
              {uploadPreview && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={uploadPreview}
                  alt="Your upload"
                  className="w-16 h-20 object-cover rounded-xl ring-1 ring-black/5 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">
                  Building your character
                </p>
                <h2 id="upload-overlay-title" className="text-lg font-black tracking-tight text-black leading-tight mb-1">
                  Cleaning up your photo + generating a 4K reference sheet
                </h2>
                <p className="text-xs text-gray-500 leading-snug">
                  Takes about <span className="font-semibold text-gray-700">2&ndash;3 minutes</span>.
                  Don&apos;t close this tab — we&apos;ll drop you in the studio when it&apos;s ready.
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[width] duration-1000 ease-linear"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] font-medium text-gray-500">
                <span>{Math.round(percent)}%</span>
                <span>
                  {fmt(elapsedSec)} elapsed{remaining > 0 ? ` · ~${fmt(remaining)} remaining` : ''}
                </span>
              </div>
            </div>

            {/* Stage label */}
            <p className="text-sm font-semibold text-gray-800 mt-4 flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" aria-hidden="true" />
              <span>{uploadStatus}</span>
            </p>

            <p className="text-[10px] text-gray-400 mt-5 leading-relaxed">
              Cast runs Fal&apos;s nano-banana-2 image-to-image at 4K. Both the
              profile photo and the 8-panel reference sheet are generated from
              your upload to lock identity.
            </p>
          </div>
        </div>
      )}

      {/* Top text block */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-5">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full motion-safe:animate-pulse" aria-hidden="true" />
          Make your first character free — no card needed
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-black leading-[0.95] mb-5 max-w-3xl mx-auto">
          Cast any character.<br />
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">In 90 seconds.</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-7 leading-relaxed">
          Photorealistic actors for films, ads, and stock photography. Made for every AI video tool. No shoot days required.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-4">
          <label htmlFor="hero-character-prompt" className="sr-only">
            Describe the character to generate
          </label>
          <div className="flex items-center bg-white rounded-2xl border border-black/10 shadow-xl shadow-indigo-500/5 pl-5 pr-2 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:ring-offset-1 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="hero-character-prompt"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={typedPlaceholder + (!query && cursorOn ? '|' : '')}
              aria-label="Describe the character to generate"
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-base font-medium px-3 py-2 outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="hidden sm:block bg-black text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Generate Character
            </button>
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="sm:hidden w-full mt-3 bg-black text-white font-bold text-sm px-5 py-3.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            Generate Character
          </button>
        </form>

        <div className="mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUploadChange}
            className="hidden"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-60 disabled:cursor-wait transition-colors"
          >
            {uploading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" aria-hidden="true" />
                <span>{uploadStatus}</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Already have a character? <span className="underline underline-offset-2">Upload a photo</span> — first conversion free</span>
              </>
            )}
          </button>
          {uploadError && (
            <p role="alert" className="mt-2 text-xs text-red-600">{uploadError}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-2 max-w-xl mx-auto">
          <span className="text-xs text-gray-500 font-medium self-center mr-1">Cast a:</span>
          {ARCHETYPE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                // Cycle through the chip's prompt variants. First click picks a
                // random start so refreshing the page feels fresh, subsequent
                // clicks step forward through the list.
                const counts = chipClickCountRef.current;
                const seen = counts[chip.label] ?? -1;
                const nextIdx = seen === -1
                  ? Math.floor(Math.random() * chip.prompts.length)
                  : (seen + 1) % chip.prompts.length;
                counts[chip.label] = nextIdx;
                const nextPrompt = chip.prompts[nextIdx];
                setQuery(nextPrompt);
                // Move focus to input with caret at end so screen readers
                // announce the new value and users can edit immediately.
                const el = inputRef.current;
                if (el) {
                  el.focus();
                  requestAnimationFrame(() => {
                    el.setSelectionRange(nextPrompt.length, nextPrompt.length);
                  });
                }
              }}
              className="text-sm sm:text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 sm:px-3.5 sm:py-1.5 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom section — either the character marquee or the export-pipeline reel */}
      <div className="pb-6">
        {variant === 'export-reel' ? (
          <ExportReel characters={reelCharacters} />
        ) : (
          <LivingMarquee />
        )}
        <div className="text-center mt-4">
          <Link href="#roster" className="inline-block text-sm font-semibold text-gray-500 hover:text-black px-3 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 transition-colors">
            or cast from the roster ↓
          </Link>
        </div>
      </div>
    </section>
  );
}
