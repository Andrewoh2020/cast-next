import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works — Cast',
  description: 'Learn how to browse, license, and create AI characters on Cast. From finding the right actor to using your reference sheet in Kling, Higgsfield, and Artlist.',
};

const steps = [
  {
    num: '01',
    title: 'Browse or Create',
    desc: 'Explore 100+ photorealistic AI characters in the marketplace, filtered by age, ethnicity, build, and style. If you don\'t see the right fit, describe your ideal character and Cast generates them in ~90 seconds.',
  },
  {
    num: '02',
    title: 'Choose a License',
    desc: 'Every character offers flexible licensing: free with attribution, $50 for a single project, $250 for unlimited productions, or $1,000 for exclusive ownership. No subscription, no hidden fees.',
  },
  {
    num: '03',
    title: 'Download Your Assets',
    desc: 'Instantly download a high-res profile photo and a 4K 8-panel reference sheet showing your character from every angle — front, side, back, and close-ups.',
  },
  {
    num: '04',
    title: 'Use in Your AI Video Tool',
    desc: '',
    richDesc: true,
  },
];

const faqs = [
  {
    q: 'What is a reference sheet?',
    a: 'A reference sheet is an 8-panel image showing your character from 4 full-body angles (front, left, right, back) and 4 close-up angles. It locks the character\'s visual identity so AI video tools can reproduce them consistently across different shots.',
  },
  {
    q: 'How do I use the reference sheet in Kling or Higgsfield?',
    a: 'Crop the angle you need from the reference sheet (e.g. the front-facing full-body shot), then upload it as the starting frame / image input in your AI video tool. The tool will animate from that exact frame, preserving the character\'s appearance.',
  },
  {
    q: 'What does "create your own character" mean?',
    a: 'If none of our marketplace characters fit your vision, you can describe exactly who you need — age, ethnicity, build, wardrobe, vibe — and Cast generates a brand-new character with their full profile photo and 8-panel reference sheet. Each creation costs 1 credit.',
  },
  {
    q: 'Are these characters safe for commercial use?',
    a: 'Yes. Every Cast character is 100% AI-generated with no real-person training data. There are no likeness claims, no model releases needed, and no copyright risk. Your license is your proof of rights.',
  },
  {
    q: 'What\'s the difference between the license tiers?',
    a: 'Free (with attribution) lets you use the character if you credit Cast. Single Project ($50) covers one production. Studio License ($250) covers unlimited productions for 12 months. Exclusive Rights ($1,000) gives you permanent sole ownership — we remove the character from the marketplace.',
  },
  {
    q: 'Can I regenerate my reference sheet?',
    a: 'Yes. After creating a custom character, you get up to 3 free regenerations of the reference sheet if the first result isn\'t quite right. If you\'re still not satisfied, contact us at admin@castability.ai.',
  },
];

export default function HowItWorksPage() {
  return (
    <main className="pt-24 pb-16">
      {/* Hero */}
      <section className="px-6 mb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">How It Works</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-4">
            From browse to broadcast<br />in minutes.
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Cast gives you production-ready AI characters with consistent visual identity across every shot. Here&apos;s how.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 mb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="relative bg-gray-50 rounded-2xl p-9 border border-gray-100">
              <div className="text-xs font-bold tracking-widest text-indigo-500 mb-4">{step.num}</div>
              <h3 className="text-xl font-bold text-black mb-2 tracking-tight">{step.title}</h3>
              {'richDesc' in step && step.richDesc ? (
                <p className="text-sm text-gray-500 leading-relaxed">
                  Drop any panel from the reference sheet into{' '}
                  <a href="https://klingai.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-medium">Kling</a>,{' '}
                  <a href="https://higgsfield.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-medium">Higgsfield</a>, or{' '}
                  <a href="https://artlist.io" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-medium">Artlist</a>{' '}
                  as your starting frame. The character stays visually consistent across every shot — same face, same wardrobe, every angle.
                </p>
              ) : (
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black tracking-tight text-black mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-gray-100 pb-6">
                <h3 className="text-base font-bold text-black mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400 mb-4">Still have questions?</p>
            <a
              href="mailto:admin@castability.ai"
              className="inline-block text-sm font-semibold bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
