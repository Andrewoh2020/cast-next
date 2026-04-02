import Link from 'next/link';
import Image from 'next/image';

export default function HeroBannerOption1() {
  return (
    <section className="relative h-[85vh] sm:h-[70vh] min-h-[420px] sm:min-h-[500px] max-h-[700px] w-full overflow-hidden">
      {/* Background image */}
      <Image
        src="/hero-banner.png"
        alt="AI character in cinematic city scene"
        fill
        className="object-cover object-top"
        priority
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full max-w-5xl mx-auto px-6 pb-16">
        <div className="hidden sm:inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5 w-fit border border-white/20">
          100% Copyright Safe &middot; AI-Generated Talent
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-white mb-4">
          Your next lead actor<br />is already perfect.
        </h1>

        <p className="text-base sm:text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
          Browse our curated roster of AI-generated characters in 4K — ready to cast, license,
          and bring to screen. No prompts. No uncertainty. No rights issues.
        </p>

        <div className="flex items-center gap-3 flex-wrap mb-10">
          <Link
            href="#roster"
            className="bg-indigo-500 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
          >
            Browse the Talent
          </Link>
          <Link
            href="/create"
            className="text-white font-semibold px-7 py-3.5 rounded-xl border border-white/30 hover:border-white/60 hover:bg-white/10 transition-all"
          >
            Create Your Own
          </Link>
        </div>

        <div className="flex items-center gap-8 flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-black text-white tracking-tight">100+</div>
            <div className="text-xs font-medium text-white/50 mt-0.5">AI Characters</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-black text-white tracking-tight">100%</div>
            <div className="text-xs font-medium text-white/50 mt-0.5">Copyright Safe</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-black text-white tracking-tight">Instant</div>
            <div className="text-xs font-medium text-white/50 mt-0.5">License Delivery</div>
          </div>
        </div>
      </div>
    </section>
  );
}
