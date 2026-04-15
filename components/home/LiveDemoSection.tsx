'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Talent, thumbUrl } from '@/lib/talent';

type Stage = 'idle' | 'typing' | 'generating' | 'revealed';

const NUM_DEMOS = 3;
const REVEAL_HOLD_MS = 4000;

/**
 * Reverse-engineer a simple, realistic prompt from a character's stored vibe.
 * Takes the first sentence so it feels like a casual description a user
 * would actually type.
 */
function vibeToPrompt(vibe: string): string {
  if (!vibe) return '';
  const trimmed = vibe.trim();
  const firstSentence = trimmed.match(/^[^.!?]+[.!?]/)?.[0] ?? trimmed.slice(0, 160);
  return firstSentence.trim();
}

export default function LiveDemoSection() {
  const [typedText, setTypedText] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [demoIdx, setDemoIdx] = useState(0);
  const [characters, setCharacters] = useState<Talent[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const startedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Fetch 3 characters with reference sheets, deterministic but varied daily
  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then((data: Talent[]) => {
        const candidates = data.filter(t =>
          !t.exclusive &&
          t.referenceSheetUrl &&
          t.vibe &&
          t.vibe.length > 30
        );
        if (candidates.length === 0) return;
        const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        const picks: Talent[] = [];
        for (let i = 0; i < NUM_DEMOS; i++) {
          picks.push(candidates[(dayOffset + i * 17) % candidates.length]);
        }
        setCharacters(picks);
      })
      .catch(() => {});
  }, []);

  // Start the cycle when scrolled into view
  useEffect(() => {
    if (!sectionRef.current || characters.length === 0) return;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      runDemo(0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters]);

  const runDemo = (idx: number) => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const character = characters[idx];
    if (!character) return;

    setDemoIdx(idx);
    setStage('typing');
    setTypedText('');

    const prompt = vibeToPrompt(character.vibe);
    let i = 0;
    const type = () => {
      if (i <= prompt.length) {
        setTypedText(prompt.slice(0, i));
        i++;
        timersRef.current.push(setTimeout(type, 18));
      } else {
        timersRef.current.push(setTimeout(() => setStage('generating'), 300));
      }
    };
    type();
  };

  // Generating → revealed → next demo
  useEffect(() => {
    if (stage === 'generating') {
      const t = setTimeout(() => setStage('revealed'), 1100);
      timersRef.current.push(t);
    } else if (stage === 'revealed') {
      const t = setTimeout(() => {
        const next = (demoIdx + 1) % characters.length;
        runDemo(next);
      }, REVEAL_HOLD_MS);
      timersRef.current.push(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
  }, []);

  const character = characters[demoIdx];

  return (
    <section ref={sectionRef} className="relative py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">How it works</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-4">
            From idea to cast, in 90 seconds.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Type a description. Cast generates a photoreal character with an 8-panel reference sheet — ready for commercial use, ready for AI video.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: prompt */}
          <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-black">1</div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Describe the character</p>
            </div>
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 min-h-[200px]">
              <p className="text-lg text-gray-800 leading-relaxed">
                {typedText}
                {/* Cursor blinks always once demo starts — typing, generating, and revealed */}
                {stage !== 'idle' && <span className="animate-blink">|</span>}
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-gray-400">
              <span>Natural language — no prompt engineering.</span>
              <span>{typedText.length} chars</span>
            </div>
          </div>

          {/* Right: character + reference sheet */}
          <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-black">2</div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Cast delivers</p>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {/* Profile photo — top, prominent */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-200 mx-auto w-full max-w-[200px] aspect-[3/4]">
                <p className="absolute top-2 left-2 z-10 text-[9px] font-black uppercase tracking-widest text-white bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">Profile</p>
                {character && (stage === 'generating' || stage === 'revealed') && (
                  <div
                    key={`profile-${character.id}-${demoIdx}`}
                    className={`absolute inset-0 ${stage === 'generating' ? 'opacity-30 blur-md' : 'opacity-100 blur-0 transition-all duration-700'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(character.img, 1200)}
                      alt={character.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}
                {stage === 'generating' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-indigo-300 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Full reference sheet — wide strip below, higher resolution */}
              <div className={`relative rounded-2xl overflow-hidden bg-gray-200 ${
                stage === 'revealed' ? 'opacity-100 translate-y-0 transition-all duration-700' : 'opacity-0 translate-y-3'
              }`} style={{ aspectRatio: '21/9' }}>
                <p className="absolute top-2 left-2 z-10 text-[9px] font-black uppercase tracking-widest text-white bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">8-Panel Reference Sheet · 4K</p>
                {character?.referenceSheetUrl && stage === 'revealed' && (
                  <div
                    key={`ref-${character.id}-${demoIdx}`}
                    className="absolute inset-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(character.referenceSheetUrl, 2000)}
                      alt={`${character.name} reference sheet`}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs">
              <span className="text-gray-400">2K profile + 4K 8-panel reference sheet</span>
              <Link href="/create" className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                Try it yourself →
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle progress indicator (no clickable slider) */}
        <div className="flex justify-center gap-1.5 mt-8" aria-hidden="true">
          {Array.from({ length: NUM_DEMOS }).map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === demoIdx ? 'w-8 bg-indigo-500' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
