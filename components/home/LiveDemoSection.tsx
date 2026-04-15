'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Talent, thumbUrl } from '@/lib/talent';

const DEMO_PROMPT = 'A 32-year-old Mexican marine biologist with sun-bleached hair, wearing a navy polo and a vintage dive watch.';

type Stage = 'idle' | 'typing' | 'generating' | 'revealed';

export default function LiveDemoSection() {
  const [typedText, setTypedText] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [character, setCharacter] = useState<Talent | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const startedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Fetch a single character with a real reference sheet
  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then((data: Talent[]) => {
        const candidates = data.filter(t => !t.exclusive && t.referenceSheetUrl && (t.refSheetThumbnail || t.referenceSheetUrl));
        if (candidates.length > 0) {
          // Deterministic pick that varies daily so demo isn't always identical
          const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % candidates.length;
          setCharacter(candidates[idx]);
        }
      })
      .catch(() => {});
  }, []);

  // Start the demo when scrolled into view
  useEffect(() => {
    if (!sectionRef.current || !character) return;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      runDemo();
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
  }, [character]);

  const runDemo = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setStage('typing');
    setTypedText('');

    let i = 0;
    const type = () => {
      if (i <= DEMO_PROMPT.length) {
        setTypedText(DEMO_PROMPT.slice(0, i));
        i++;
        timersRef.current.push(setTimeout(type, 18));
      } else {
        timersRef.current.push(setTimeout(() => setStage('generating'), 300));
      }
    };
    type();
  };

  // Move from generating → revealed
  useEffect(() => {
    if (stage === 'generating') {
      const t = setTimeout(() => setStage('revealed'), 1100);
      timersRef.current.push(t);
    }
  }, [stage]);

  // Cleanup on unmount
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
  }, []);

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
                {stage === 'typing' && <span className="animate-blink">|</span>}
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

            <div className="flex-1 grid grid-cols-3 gap-3">
              {/* Big profile photo */}
              <div className="col-span-1 row-span-2 relative rounded-2xl overflow-hidden bg-gray-200 aspect-[3/4]">
                {character && stage !== 'idle' && stage !== 'typing' && (
                  <div className={`absolute inset-0 transition-all duration-700 ${stage === 'generating' ? 'opacity-30 blur-md' : 'opacity-100 blur-0'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(character.imgThumbnail || character.img, 400)}
                      alt={character.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}
                {stage === 'generating' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                )}
                {stage === 'revealed' && character && (
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1.5">
                    <p className="text-[10px] font-bold text-black truncate">{character.name}</p>
                  </div>
                )}
              </div>

              {/* 6 reference sheet panel thumbnails */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl overflow-hidden bg-gray-200 aspect-square transition-all duration-500 ${
                    stage === 'revealed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                  style={{ transitionDelay: stage === 'revealed' ? `${i * 70}ms` : '0ms' }}
                >
                  {character && (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${thumbUrl(character.refSheetThumbnail || character.referenceSheetUrl || '', 800)})`,
                        backgroundPosition: `${(i % 3) * 50}% ${Math.floor(i / 3) * 100}%`,
                        backgroundSize: '300% 200%',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between text-xs">
              <span className="text-gray-400">2K profile + 4K 8-panel reference sheet</span>
              <Link href="/create" className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                Try it yourself →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
