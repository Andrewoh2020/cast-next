export default function CopyrightFAQPage() {
  const faqs = [
    {
      q: 'Who owns the characters on Cast?',
      a: 'All characters are created by and owned by Ability AI Technologies Private Limited. They are either fully AI-generated or created with explicit permission from any individual whose likeness was used. Ownership remains with us unless you purchase an Exclusive Rights license, at which point full intellectual property rights transfer to you.',
    },
    {
      q: 'Are AI-generated characters protected by copyright?',
      a: 'Yes. While copyright law around AI-generated content is evolving globally, the creative curation, selection, refinement, and arrangement of AI-generated characters involves sufficient human authorship to constitute original works under Singapore law. We assert copyright ownership over all character assets on Cast.',
    },
    {
      q: 'Can I use a licensed character commercially?',
      a: 'Yes. All license tiers — Free (Attribution), Single Project, and Exclusive Rights — permit commercial use, including paid advertisements, branded content, client work, and monetised video productions.',
    },
    {
      q: 'What does the Free (Attribution) license allow?',
      a: 'The Free license permits unlimited use of the character across any production, provided you visibly credit Cast in your content — for example, in the video description, end credits, or as on-screen text (e.g. "AI characters provided by Cast"). There is no fee and no production limit.',
    },
    {
      q: 'What counts as a "single project" under the Single Project license?',
      a: 'A single project is one discrete production — one video, one film, one advertisement, or one campaign. For example, a 30-second ad is one project; a series of ads for the same campaign may be considered one project if they share a unified concept and brief. The license is valid for 12 months from the date of purchase, within which you must complete and publish your production. If you need the character across multiple productions, consider the Studio License instead.',
    },
    {
      q: 'What is the Studio License?',
      a: 'The Studio License grants you the right to use the character across unlimited productions within a 12-month period from the date of purchase. It is non-exclusive — the character remains available to other creators — and no attribution is required. It is ideal for studios, agencies, or creators who plan to use the same character across multiple videos or campaigns.',
    },
    {
      q: 'Can two creators use the same character?',
      a: 'Yes, unless one of them has purchased an Exclusive Rights license. Free, Single Project, and Studio licenses are all non-exclusive — the same character can be licensed to multiple creators simultaneously. Exclusive Rights permanently removes the character from the marketplace for any new licenses.',
    },
    {
      q: 'What happens after someone buys Exclusive Rights?',
      a: 'The character is immediately removed from the Cast marketplace and no new licenses are issued. All intellectual property rights transfer to the buyer. However, any existing Single Project licenses purchased before the exclusive sale remain valid — those creators may continue using the character until their 12-month license term expires. Before completing an Exclusive Rights purchase, buyers are shown how many active licenses currently exist for the character.',
    },
    {
      q: 'What happens to my Single Project license if someone buys Exclusive Rights?',
      a: 'Your license is fully protected. If you purchased a Single Project license before an exclusive sale, you retain the right to use the character for the remainder of your 12-month license term. Your purchase is honoured regardless of any subsequent exclusive sale.',
    },
    {
      q: 'Can I modify or animate the characters?',
      a: 'Yes. All license tiers permit modification, animation, and adaptation of the character within the context of your licensed production. You may not resell or redistribute the raw character assets themselves.',
    },
    {
      q: 'Can I resell a character I\'ve licensed?',
      a: 'No. Reselling, sublicensing, or redistributing character assets — in their original or modified form — is prohibited under all license tiers. You may only use characters within a finished production. The exception is Exclusive Rights: the buyer owns the character and may transfer those rights as part of a business acquisition or assignment.',
    },
    {
      q: 'What if I want to use a character on multiple platforms?',
      a: 'All licenses are worldwide and platform-agnostic. A Single Project license allows distribution of that production across any number of platforms — YouTube, TikTok, Instagram, Netflix, broadcast television, and others — with no additional fees.',
    },
    {
      q: 'How do I report unauthorised use of a character?',
      a: 'If you believe a Cast character is being used without a valid license, or in violation of our Terms, please contact us at admin@ability.new with details of the alleged infringement. We take intellectual property violations seriously and will investigate promptly.',
    },
    {
      q: 'Does Cast contain any real people\'s likenesses without permission?',
      a: 'No. All characters on Cast are either fully AI-generated with no reference to real individuals, or created with the explicit, documented consent of the individual whose likeness was used. We do not use the likeness of any real person without permission.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Legal</p>
        <h1 className="text-4xl font-black tracking-tighter text-black mb-2">Copyright FAQ</h1>
        <p className="text-gray-400 text-sm mb-12">Last updated: March 2026</p>

        <div className="space-y-5">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-black mb-2">{faq.q}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-400 mt-12 text-center">
          Still have questions?{' '}
          <a href="mailto:admin@ability.new" className="text-indigo-500 hover:underline">
            Contact us at admin@ability.new
          </a>
        </p>

        <p className="text-gray-400 text-xs mt-4 text-center">
          Ability AI Technologies Private Limited · UEN 202548889G · Singapore
        </p>
      </div>
    </div>
  );
}
