'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LivingMarquee from './LivingMarquee';

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

/**
 * Variant B:2 — Text at top, marquee fills below
 * Every character visible and clickable; more utilitarian, marketplace-first
 */
export default function HeroB2() {
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [cursorOn, setCursorOn] = useState(true);
  const router = useRouter();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track per-chip click count so each click cycles to the next prompt variant
  const chipClickCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (query) return;
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
  }, [placeholderIdx, query]);

  // Blink the placeholder cursor every 530ms
  useEffect(() => {
    if (query) return;
    const interval = setInterval(() => setCursorOn(c => !c), 530);
    return () => clearInterval(interval);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/create?prompt=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative bg-white overflow-hidden">
      {/* Top text block */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-5">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          10 free credits with every signup — limited time
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-black leading-[0.95] mb-5 max-w-3xl mx-auto">
          Cast any character.<br />
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">In 90 seconds.</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-7 leading-relaxed">
          Photorealistic actors for films, ads, and stock photography. No shoot days required — ready for Kling, Runway, and Veo.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-4">
          <div className="flex items-center bg-white rounded-2xl border border-black/10 shadow-xl shadow-indigo-500/5 pl-5 pr-2 py-2 focus-within:border-indigo-300 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={typedPlaceholder + (!query && cursorOn ? '|' : '')}
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-base font-medium px-3 py-2 outline-none"
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

        <p className="text-xs text-gray-500 mb-3">
          Have a character? <Link href="/workshop" className="font-semibold text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline">Dress them, place them in scenes, and export for your AI video tool →</Link>
        </p>

        <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
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
                setQuery(chip.prompts[nextIdx]);
              }}
              className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-1.5 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Full marquee below */}
      <div className="pb-6">
        <LivingMarquee />
        <div className="text-center mt-4">
          <Link href="#roster" className="text-xs font-semibold text-gray-500 hover:text-black transition-colors">
            or browse the full roster ↓
          </Link>
        </div>
      </div>
    </section>
  );
}
