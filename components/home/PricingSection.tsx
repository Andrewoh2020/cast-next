import Link from 'next/link';

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'With attribution',
    description: 'Perfect for personal projects and testing. Credit Cast in your production.',
    features: [
      'Full 2K profile photo',
      '4K 8-panel reference sheet',
      'Use with attribution',
      'No commercial restrictions with credit',
    ],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Single Project',
    price: '$50',
    tagline: 'One production',
    description: 'License a character for a single commercial project, 12-month validity.',
    features: [
      'Everything in Free',
      'One commercial production',
      'No attribution required',
      '12-month license validity',
    ],
    cta: 'Buy single license',
    highlight: false,
  },
  {
    name: 'Studio',
    price: '$250',
    tagline: 'Unlimited productions',
    description: 'For agencies and studios with ongoing production needs.',
    features: [
      'Everything in Single Project',
      'Unlimited productions',
      '12-month license validity',
      'Priority support',
    ],
    cta: 'Buy studio license',
    highlight: true,
  },
  {
    name: 'Exclusive',
    price: '$1,000',
    tagline: 'Permanent ownership',
    description: 'Own a character outright — we remove them from the marketplace.',
    features: [
      'Everything in Studio',
      'Permanent ownership',
      'Character removed from marketplace',
      'Full IP transfer',
    ],
    cta: 'Buy exclusive rights',
    highlight: false,
  },
];

const COMPARISONS = [
  { label: 'Traditional stock photo shoot', price: '$500+', note: 'per shoot, limited use' },
  { label: 'Hiring a real actor for a day', price: '$5,000+', note: 'per day, residuals, releases' },
  { label: 'Cast Single Project License', price: '$50', note: 'full commercial rights, ready now', highlight: true },
];

export default function PricingSection() {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-4">
            Transparent, simple, no subscription.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Four tiers. Pay once per character, per use case. No hidden fees.
          </p>
        </div>

        {/* Pricing tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-7 ${
                tier.highlight
                  ? 'bg-black text-white border-2 border-black shadow-2xl scale-[1.02]'
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Most popular
                </div>
              )}
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${tier.highlight ? 'text-indigo-300' : 'text-indigo-500'}`}>
                {tier.name}
              </p>
              <div className="mb-3">
                <span className={`text-4xl font-black tracking-tighter ${tier.highlight ? 'text-white' : 'text-black'}`}>{tier.price}</span>
              </div>
              <p className={`text-sm font-semibold mb-4 ${tier.highlight ? 'text-white/90' : 'text-black'}`}>{tier.tagline}</p>
              <p className={`text-xs leading-relaxed mb-5 ${tier.highlight ? 'text-white/70' : 'text-gray-500'}`}>
                {tier.description}
              </p>
              <ul className="space-y-2 mb-6">
                {tier.features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-xs ${tier.highlight ? 'text-white/90' : 'text-gray-700'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 mt-0.5 ${tier.highlight ? 'text-indigo-300' : 'text-indigo-500'}`}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/#roster"
                className={`block text-center text-sm font-bold py-3 rounded-xl transition-colors ${
                  tier.highlight
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">How Cast compares</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {COMPARISONS.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between px-6 py-5 border-b border-gray-100 last:border-b-0 ${row.highlight ? 'bg-indigo-50' : ''}`}
              >
                <div>
                  <p className={`font-semibold text-sm ${row.highlight ? 'text-black' : 'text-gray-700'}`}>{row.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{row.note}</p>
                </div>
                <p className={`font-black text-xl ${row.highlight ? 'text-indigo-600' : 'text-gray-600'}`}>{row.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
