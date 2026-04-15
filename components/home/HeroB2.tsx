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
      'Japanese-American woman CEO, 42, tailored navy suit, glass-walled office with soft backlight',
      'Nigerian male tech CEO, 35, charcoal bespoke suit, minimalist high-rise boardroom',
      'Swedish woman CEO, 52, cream turtleneck under a gray blazer, sunlit corner office',
      'Brazilian male fintech founder, 41, navy suit without a tie, warm dusk light through floor-to-ceiling windows',
      'Korean woman CEO, 38, tailored cream suit, slicked-back ponytail, modern lobby',
      'Indian male venture capitalist, 45, charcoal three-piece suit, leather armchair in a wood-paneled library',
      'Mexican woman startup CEO, 33, rolled-up oxford sleeves, standup desk cluttered with laptops',
      'British man CEO, 58, navy pinstripe, standing on a Thames-facing terrace at dusk',
      'Kenyan woman CEO, 47, emerald blazer over a silk blouse, warm-lit rooftop bar',
      'French man CEO, 50, cuffed dress shirt, leaning on a marble conference table',
    ],
  },
  {
    label: 'Athlete',
    prompts: [
      'Kenyan male marathoner, 28, mid-stride in race-day kit, golden-hour track light, sweat on his brow',
      'Brazilian woman gymnast, 22, chalked hands, stadium floodlights, preparing for her routine',
      'Japanese male surfer, 26, wetsuit half-zipped, dawn light on wet sand, board under his arm',
      'Nigerian woman sprinter, 25, tensed in the starting blocks, rain streaks on the track',
      'Norwegian male cross-country skier, 32, goggles up, breath visible, backdrop of snow and pine',
      'American woman pro boxer, 30, wrapped hands, gym with a heavy bag behind her',
      'Italian male road cyclist, 35, salt-crusted kit after a long climb, Dolomites behind him',
      'Australian woman surfer, 24, walking out of shore break with her board, sunset light',
      'Moroccan male rock climber, 29, chalk bag on hip, sunset in the High Atlas',
      'South African woman triathlete, 31, wet hair, swim cap in hand, stepping off the beach',
    ],
  },
  {
    label: 'Chef',
    prompts: [
      'French woman chef, 38, white linen apron dusted with flour, warm kitchen lighting, small smile',
      'Japanese male sushi chef, 55, pristine white jacket, bamboo counter, plating a nigiri with tweezers',
      'Mexican woman pastry chef, 34, piping delicate icing onto a cake in a bright prep kitchen',
      'Italian male pasta chef, 48, flour-dusted forearms rolling fresh dough, rustic kitchen with hanging pots',
      'Ethiopian woman chef, 42, colorful apron, ladling stew from a clay pot, sunlit cafe kitchen',
      'American male barbecue pitmaster, 50, wood smoke rising, apron smeared with sauce',
      'Thai woman street-food chef, 45, steaming wok, night-market neon signs behind her',
      'Spanish male tapas chef, 39, red apron over a black tee, open-flame tapas bar service',
      'Korean woman kimchi chef, 60, rolled sleeves and blue apron, ceramic jars lined behind her',
      'New Zealand male chef, 36, inspecting fresh greens from a kitchen garden at sunrise',
    ],
  },
  {
    label: 'Artist',
    prompts: [
      'Moroccan woman textile artist, 42, indigo-dyed hands, sunlit studio with hanging kaftans',
      'Nigerian male painter, 30, paint-smeared smock, oversized canvas in a converted warehouse studio',
      'Japanese woman ceramicist, 48, clay on her forearms, at a wheel in a wooden studio',
      'French male sculptor, 55, stone dust on his apron, working a marble bust in an open-air atelier',
      'Indian woman illustrator, 27, tablet and stylus, golden-hour window light in a home studio',
      'Peruvian male weaver, 65, hand-loom on his lap, traditional textiles around him',
      'Italian woman fresco painter, 35, on scaffolding under a chapel ceiling, brushes in hand',
      'Mexican male muralist, 40, spraying paint on a Brooklyn alley wall, evening light',
      'Korean woman calligrapher, 52, brush mid-stroke over handmade paper, quiet tea-lit studio',
      'Scottish male photographer-artist, 33, large-format camera on a tripod, moody Highlands behind him',
    ],
  },
  {
    label: 'Musician',
    prompts: [
      'Black male jazz pianist, 55, at a grand piano, dim club lighting, fedora on the bench beside him',
      'Cuban woman salsa singer, 32, microphone in hand, stage lights, sequined dress',
      'Icelandic male cellist, 40, lone performance on a volcanic cliff, wool sweater',
      'Indian woman sitar player, 60, traditional sari, seated on a rug under warm lamplight',
      'Brazilian male samba drummer, 29, sweating at carnival, colorful costume, stage pink',
      'German woman techno DJ, 30, headphones on, Berlin club blue-and-magenta haze',
      'Irish male fiddler, 45, small pub stage, pint of stout on the stool beside him',
      'Korean woman K-pop artist, 24, mid-choreography, stage smoke and spotlight',
      'American woman folk guitarist, 38, on a porch at golden hour, acoustic guitar on her lap',
      'Malian male kora player, 52, seated in an earth-walled courtyard, strings catching morning light',
    ],
  },
  {
    label: 'Journalist',
    prompts: [
      'Persian woman photojournalist, 29, leather jacket, camera slung across her chest, rain-slick Istanbul street',
      'American male war correspondent, 44, flak jacket, notebook in hand, dust-kicked Middle Eastern street',
      'Japanese woman news anchor, 36, tailored blazer, studio lights, monitors glowing behind her',
      'Nigerian male investigative reporter, 41, rolled-up sleeves, standing in a chaotic newsroom',
      'French woman magazine editor, 50, pen in hand, glass-walled office, stack of back issues on her desk',
      'British male foreign correspondent, 38, beige field shirt, Moleskine in hand, Mumbai market background',
      'Mexican woman crime reporter, 33, voice recorder raised, dimly lit press conference',
      'Korean male tech journalist, 29, MacBook open at a Tokyo cafe, skyline through the window',
      'Ukrainian woman journalist, 42, helmet in hand, sunrise over a defiant city skyline',
      'Argentine male sports journalist, 48, press pass around his neck, roaring stadium behind him',
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
          2 free credits for the first 200 signups
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-black leading-[0.95] mb-5 max-w-3xl mx-auto">
          Cast any character.<br />
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">In 90 seconds.</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-7 leading-relaxed">
          Photorealistic AI actors for commercial video. Browse the roster below or describe your own — ready for Kling, Runway, and Veo.
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
              className="bg-black text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Generate Character
            </button>
          </div>
        </form>

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
