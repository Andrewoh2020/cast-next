const steps = [
  {
    num: '01',
    title: 'Browse the Roster',
    desc: 'Explore hundreds of carefully designed AI characters. Filter by style, vibe, and role type.',
  },
  {
    num: '02',
    title: 'Pick Your Character',
    desc: 'View full profiles, aesthetic references, and sample scenes before committing.',
  },
  {
    num: '03',
    title: 'License Instantly',
    desc: 'Purchase the license. Your unwatermarked reference sheet arrives in your inbox immediately.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Simple Process</div>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-16">
          From browse to broadcast<br />in minutes.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative bg-gray-50 rounded-2xl p-9 border border-gray-100">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-gray-300 text-xl z-10">→</div>
              )}
              <div className="text-xs font-bold tracking-widest text-indigo-500 mb-4">{step.num}</div>
              <h3 className="text-xl font-bold text-black mb-2 tracking-tight">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
