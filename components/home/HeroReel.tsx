'use client';

export default function HeroReel() {
  return (
    <section className="relative bg-black overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: '1920/800' }}>
        <video
          src="/hero-videos/reel.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle top + bottom vignette for text legibility if we ever add overlays */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Caption */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/80 mb-1">In action</p>
            <p className="text-white font-bold text-lg sm:text-2xl tracking-tight leading-tight max-w-xl">
              Stop waiting for the right actor. Build them.<br className="hidden sm:inline" />
              <span className="text-white/70 font-medium">Cast any character in 90 seconds — and take them anywhere.</span>
            </p>
          </div>
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/50 hidden sm:block">
            Reel · 19s · Loop
          </p>
        </div>
      </div>
    </section>
  );
}
