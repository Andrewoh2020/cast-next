import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-36 pb-28 px-6 text-center bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* Radial glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
          100% Copyright Safe · AI-Generated Talent
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-none text-black mb-6">
          Your next lead actor<br />is already perfect.
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Browse our curated roster of AI-generated characters — ready to cast, license,
          and bring to screen. No prompts. No uncertainty. No rights issues.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap mb-16">
          <Link
            href="#roster"
            className="bg-indigo-500 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200"
          >
            Browse the Talent
          </Link>
          <Link
            href="#how"
            className="text-gray-700 font-semibold px-7 py-3.5 rounded-xl border border-gray-200 hover:border-gray-400 transition-all"
          >
            See How It Works
          </Link>
        </div>

        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-black text-black tracking-tight">500+</div>
            <div className="text-xs font-medium text-gray-400 mt-0.5">AI Characters</div>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-black text-black tracking-tight">100%</div>
            <div className="text-xs font-medium text-gray-400 mt-0.5">Copyright Safe</div>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-black text-black tracking-tight">Instant</div>
            <div className="text-xs font-medium text-gray-400 mt-0.5">License Delivery</div>
          </div>
        </div>
      </div>
    </section>
  );
}
