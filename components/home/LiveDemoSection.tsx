'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Talent } from '@/lib/talent';
import { thumbUrl } from '@/lib/talent';

const DEMO_PROMPTS = [
  'A 32-year-old Mexican marine biologist with sun-bleached hair, wearing a navy polo and a vintage dive watch.',
  'A 58-year-old Japanese ramen chef with a kind face and flour-dusted apron, standing in a Kyoto alley at dusk.',
  'A 27-year-old Kenyan-British pilot in a leather flight jacket, confident smile, gold chain at her collar.',
];

export default function LiveDemoSection() {
  const [demoIdx, setDemoIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [stage, setStage] = useState<'typing' | 'generating' | 'revealed'>('typing');
  const [featured, setFeatured] = useState<Talent[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch characters to use as "generated" results
  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then((data: Talent[]) => {
        setFeatured(data.filter(t => !t.exclusive && t.referenceSheetUrl).slice(0, 3));
      })
      .catch(() => {});
  }, []);

  // Drive the demo cycle
  useEffect(() => {
    const target = DEMO_PROMPTS[demoIdx];

    // Reset
    setTypedText('');
    setStage('typing');

    // Typewriter
    let i = 0;
    const type = () => {
      if (i <= target.length) {
        setTypedText(target.slice(0, i));
        i++;
        timerRef.current = setTimeout(type, 25);
      } else {
        // Start generating
        timerRef.current = setTimeout(() => setStage('generating'), 500);
      }
    };
    type();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [demoIdx]);

  useEffect(() => {
    if (stage === 'generating') {
      timerRef.current = setTimeout(() => setStage('revealed'), 1500);
    } else if (stage === 'revealed') {
      timerRef.current = setTimeout(() => setDemoIdx(idx => (idx + 1) % DEMO_PROMPTS.length), 4500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stage]);

  const currentCharacter = featured[demoIdx];

  return (
    <section className="relative py-24 px-6 bg-white">
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
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 min-h-[280px]">
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
              <div className="col-span-1 row-span-2 relative rounded-2xl overflow-hidden bg-gray-200">
                {currentCharacter && stage !== 'typing' && (
                  <div className={`absolute inset-0 transition-all duration-700 ${stage === 'generating' ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(currentCharacter.imgThumbnail || currentCharacter.img, 400)}
                      alt={currentCharacter.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {stage === 'generating' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                )}
                {stage === 'revealed' && currentCharacter && (
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1.5">
                    <p className="text-[10px] font-bold text-black truncate">{currentCharacter.name}</p>
                  </div>
                )}
              </div>

              {/* 6 reference sheet panel thumbnails */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl overflow-hidden bg-gray-200 transition-all duration-500 ${
                    stage === 'revealed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                  style={{ transitionDelay: stage === 'revealed' ? `${i * 80}ms` : '0ms' }}
                >
                  {currentCharacter && (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${thumbUrl(currentCharacter.refSheetThumbnail || currentCharacter.referenceSheetUrl || '', 800)})`,
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

        {/* Demo progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {DEMO_PROMPTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setDemoIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === demoIdx ? 'w-8 bg-indigo-500' : 'w-1.5 bg-gray-300'}`}
              aria-label={`Demo ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
