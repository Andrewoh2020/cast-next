import Link from 'next/link';

const STEPS = [
  {
    num: '01',
    title: 'Describe or browse',
    desc: 'Type what you need, or pick from 130+ ready-made characters.',
  },
  {
    num: '02',
    title: 'Preview instantly',
    desc: 'See a photoreal profile in about 60 seconds.',
  },
  {
    num: '03',
    title: 'License commercially',
    desc: 'From free with attribution to $1,000 exclusive ownership.',
  },
  {
    num: '04',
    title: 'Use in AI video',
    desc: 'Drop any reference panel into Kling, Runway, or Veo.',
  },
];

export default function HowItWorksTimeline() {
  return (
    <section className="relative py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">The Workflow</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-4">
            Four steps. Ninety seconds. Done.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-[22px] left-[calc(50%+24px)] right-[calc(-50%+24px)] h-px bg-gradient-to-r from-indigo-300 to-indigo-100" />
              )}
              <div className="relative bg-white rounded-2xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-indigo-500 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/30">
                  {step.num}
                </div>
                <h3 className="font-black text-black mb-2 tracking-tight">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI tool partners */}
        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Works with</p>
              <p className="text-base font-bold text-black">Every major AI video tool</p>
            </div>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <a href="https://klingai.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 font-black text-lg tracking-tight hover:text-black transition-colors">
                Kling
              </a>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <a href="https://runwayml.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 font-black text-lg tracking-tight hover:text-black transition-colors">
                Runway
              </a>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <a href="https://deepmind.google/models/veo/" target="_blank" rel="noopener noreferrer" className="text-gray-700 font-black text-lg tracking-tight hover:text-black transition-colors">
                Veo
              </a>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <a href="https://seed.bytedance.com/en/seedance2_0" target="_blank" rel="noopener noreferrer" className="text-gray-700 font-black text-lg tracking-tight hover:text-black transition-colors">
                Seedance
              </a>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            See the full guide →
          </Link>
        </div>
      </div>
    </section>
  );
}
