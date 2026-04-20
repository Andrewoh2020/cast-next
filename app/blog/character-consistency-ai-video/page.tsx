import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

const TITLE = 'How to Keep the Same Character Consistent Across AI Video Shots';
const DESCRIPTION =
  'Why AI video tools generate different faces every shot, what the common workarounds are, and how reference sheets solve the problem for good.';
const SLUG = 'character-consistency-ai-video';
const DATE = '2026-04-13';
const URL = `https://www.castability.ai/blog/${SLUG}`;

export const metadata: Metadata = {
  title: `${TITLE} — Cast`,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: 'article',
    publishedTime: `${DATE}T00:00:00Z`,
    siteName: 'Cast',
    images: ['https://www.castability.ai/blog/consistency-problem.jpg'],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  alternates: { canonical: URL },
};

export default function BlogPost() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: TITLE,
    description: DESCRIPTION,
    image: 'https://www.castability.ai/blog/consistency-problem.jpg',
    datePublished: `${DATE}T00:00:00Z`,
    author: { '@type': 'Organization', name: 'Cast', url: 'https://www.castability.ai' },
    publisher: {
      '@type': 'Organization',
      name: 'Cast',
      logo: { '@type': 'ImageObject', url: 'https://www.castability.ai/og-cast-v2.png' },
    },
    mainEntityOfPage: URL,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Why does my AI character look different in every shot?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AI image and video generators don\'t have memory. Each generation starts from scratch, producing a different interpretation of your text prompt every time.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is a character reference sheet?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A character reference sheet is an 8-panel image showing a character from every angle: front, left side, right side, back (full body), plus front face, 3/4 right, 3/4 left, and back of head (close-ups). It locks visual identity so AI video tools can reproduce the character consistently.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I use a reference sheet in Kling, Runway, or Veo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Crop the angle you need from the reference sheet, upload it as the starting frame in your AI video tool, then write your motion prompt. The tool animates from your reference image, preserving the character\'s appearance.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are AI-generated characters safe for commercial use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Characters created with Cast are 100% AI-generated with no real-person training data, which means no likeness risk and no model releases needed.',
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white pt-24 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <article className="max-w-3xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-gray-600">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">Character Consistency</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full mb-4">Guide</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[1.05] mb-5">
            {TITLE}
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">{DESCRIPTION}</p>
          <div className="mt-5 flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-black">C</div>
            <div>
              <p className="text-sm font-semibold text-black">Cast Team</p>
              <time className="text-xs text-gray-400">April 13, 2026</time>
            </div>
          </div>
        </header>

        {/* Hero image */}
        <div className="mb-12 rounded-2xl overflow-hidden border border-gray-100">
          <Image
            src="/blog/consistency-problem.jpg"
            alt="Four AI-generated faces from the same character description — each looks like a different person, illustrating the consistency problem"
            width={1200}
            height={675}
            className="w-full"
            priority
          />
          <p className="text-xs text-gray-400 px-4 py-2 bg-gray-50 italic">
            Same prompt, four different people. This is the core problem with AI-generated characters.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-16">

          {/* Intro */}
          <section>
            <p className="text-lg text-gray-600 leading-relaxed mb-5">
              If you&apos;ve ever tried to make a short film, ad, or social media video using AI tools like{' '}
              <a href="https://klingai.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-medium">Kling</a>,{' '}
              <a href="https://runwayml.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-medium">Runway</a>, or{' '}
              <a href="https://deepmind.google/technologies/veo" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-medium">Veo</a>,
              you&apos;ve hit this wall: <strong className="text-black">your character looks like a different person in every shot.</strong>
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Same prompt. Same description. Same seed. Eight different strangers wearing similar outfits. Character consistency is the single biggest unsolved problem in AI video production — and until recently, the only workarounds required serious technical skill.
            </p>
          </section>

          {/* Why section */}
          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-6">Why AI video tools can&apos;t keep characters consistent</h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              AI image and video generators are trained to create single images or short clips from text prompts. <strong className="text-black">They don&apos;t have memory.</strong> Each generation starts from scratch.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              When you type &ldquo;a 30-year-old Korean man in a navy blazer walking down a street,&rdquo; the model generates a plausible interpretation. Ask it again and you get a different plausible interpretation — different jawline, different hair part, different skin tone. Both are valid. Neither is the same person.
            </p>

            {/* Visual callout */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-6">
              <p className="text-sm font-bold text-red-800 mb-3">The result in your video:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Close-up shot', 'Wide shot', 'Walking shot', 'Side angle'].map((label, i) => (
                  <div key={label} className="bg-white rounded-xl p-3 text-center border border-red-100">
                    <div className="text-2xl font-black text-red-300 mb-1">Face {i + 1}</div>
                    <p className="text-xs text-red-600 font-medium">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-red-700 mt-4">Your 60-second video now stars four strangers who vaguely look alike.</p>
            </div>
          </section>

          {/* Workarounds */}
          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-6">The common workarounds (and why they fall short)</h2>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-black text-gray-300 shrink-0">01</span>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">Seed locking</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Some generators let you lock the random seed to reproduce similar results. This helps with minor variations but <strong className="text-black">breaks completely when you change the camera angle, pose, or framing.</strong> A front-facing seed doesn&apos;t produce a consistent side profile.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-black text-gray-300 shrink-0">02</span>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">LoRA training</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      You can train a lightweight model on 10-20 photos of a face to teach the AI a specific identity. This works well but requires: <strong className="text-black">a real person&apos;s photos</strong> (which introduces likeness and copyright risk), ML expertise, and hours of compute time. Not viable for most production timelines.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-black text-gray-300 shrink-0">03</span>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">ControlNet / IP-Adapter</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Tools like ControlNet and IP-Adapter let you pass a reference face to guide generation. Results vary wildly — <strong className="text-black">the face often drifts, especially in full-body or profile shots.</strong> Setup requires ComfyUI or Automatic1111, which have steep learning curves.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-black text-gray-300 shrink-0">04</span>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">Frame-by-frame editing</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Some creators generate each frame separately and manually fix inconsistencies in Photoshop. This is <strong className="text-black">painstaking, expensive, and defeats the purpose of using AI</strong> in the first place.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* The solution */}
          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-6">The reference sheet approach</h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              Professional animation studios solved this problem decades ago with <strong className="text-black">character reference sheets</strong> — a single document showing a character from every angle. Animators reference the sheet to keep the character consistent across hundreds of frames.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              The same principle works for AI video. Instead of describing your character in text (which is inherently ambiguous), you provide the AI with an <strong className="text-black">image</strong> of your character as the starting frame. But one image isn&apos;t enough — you need the character from <strong className="text-black">every angle</strong>.
            </p>

            {/* Reference sheet image */}
            <div className="mb-8 rounded-2xl overflow-hidden border border-gray-100">
              <Image
                src="/blog/reference-sheet-example.jpg"
                alt="An 8-panel character reference sheet showing a woman from front, side, back, and close-up angles"
                width={1200}
                height={675}
                className="w-full"
              />
              <p className="text-xs text-gray-400 px-4 py-2 bg-gray-50 italic">
                An 8-panel reference sheet: 4 full-body angles + 4 close-up angles = consistent identity from every direction.
              </p>
            </div>

            {/* What's in a ref sheet */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
              <p className="text-sm font-bold text-indigo-800 mb-4">What&apos;s in an 8-panel reference sheet:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Full-body (4 panels)</p>
                  <ul className="space-y-1">
                    {['Front view', 'Left side', 'Right side', 'Back view'].map(v => (
                      <li key={v} className="text-sm text-indigo-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Close-up (4 panels)</p>
                  <ul className="space-y-1">
                    {['Front face', '3/4 right', '3/4 left', 'Back of head'].map(v => (
                      <li key={v} className="text-sm text-indigo-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How to use */}
          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-6">How to use a reference sheet in Kling, Runway, or Veo</h2>

            {/* Workflow image */}
            <div className="mb-8 rounded-2xl overflow-hidden border border-gray-100">
              <Image
                src="/blog/workflow-demo.jpg"
                alt="A filmmaker using Runway with a character reference sheet pinned next to the monitor"
                width={1200}
                height={675}
                className="w-full"
              />
              <p className="text-xs text-gray-400 px-4 py-2 bg-gray-50 italic">
                The workflow: reference sheet on the left, AI video tool on the right. Pick an angle, upload, animate.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { step: '1', title: 'Pick the angle you need', desc: 'Walking-toward-camera shot? Use the front-facing full-body panel. Side profile conversation? Use the left or right side panel.' },
                { step: '2', title: 'Crop that panel', desc: 'Extract the specific panel from the reference sheet as a standalone image.' },
                { step: '3', title: 'Upload as starting frame', desc: 'Use Kling\'s "Image to Video", Runway\'s "Image Input", or Veo\'s reference image upload.' },
                { step: '4', title: 'Write your motion prompt', desc: '"The man walks confidently down a busy sidewalk" — the tool animates from your reference image, preserving the character\'s appearance.' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0">{s.step}</div>
                  <div className="pt-1">
                    <h3 className="font-bold text-black mb-1">{s.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-green-50 border border-green-100 rounded-2xl p-6">
              <p className="text-sm text-green-800 leading-relaxed">
                <strong>The result:</strong> your character&apos;s face, hair, clothing, and proportions stay locked across every shot because the AI is always starting from the same visual source, just from different angles.
              </p>
            </div>
          </section>

          {/* Where to get */}
          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-6">Where to get reference sheets</h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              You can try to create reference sheets manually using Midjourney or Flux, but the challenge is getting all 8 panels to look like the same person. AI generators struggle with multi-panel consistency just as much as single-shot consistency — it&apos;s the same underlying problem.
            </p>
            <p className="text-gray-600 leading-relaxed mb-5">
              <a href="https://www.castability.ai" className="text-indigo-500 hover:underline font-medium">Cast</a> is an AI character casting agency that solves this. Every character comes with a <strong className="text-black">4K 8-panel reference sheet</strong> generated alongside their profile photo, ensuring consistent identity across all angles. Browse 100+ existing characters or describe your own — Cast generates them in about 90 seconds.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Every Cast character is 100% AI-generated with no real-person training data — <strong className="text-black">no likeness risk, no model releases needed</strong> — a critical consideration for commercial productions.
            </p>
          </section>

          {/* Comparison table */}
          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-6">Comparison</h2>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-bold text-black">Approach</th>
                    <th className="text-left py-3 px-4 font-bold text-black">Consistency</th>
                    <th className="text-left py-3 px-4 font-bold text-black hidden sm:table-cell">Skill required</th>
                    <th className="text-left py-3 px-4 font-bold text-black">Copyright safe</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Text prompts only', 'Poor', 'Low', 'Yes'],
                    ['Seed locking', 'Fair', 'Low', 'Yes'],
                    ['LoRA training', 'Good', 'High', 'Risky'],
                    ['ControlNet / IP-Adapter', 'Fair-Good', 'High', 'Depends'],
                  ].map(([approach, consistency, skill, copyright]) => (
                    <tr key={approach} className="border-t border-gray-100">
                      <td className="py-3 px-4 text-gray-700">{approach}</td>
                      <td className="py-3 px-4 text-gray-500">{consistency}</td>
                      <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">{skill}</td>
                      <td className="py-3 px-4 text-gray-500">{copyright}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-indigo-200 bg-indigo-50/50">
                    <td className="py-3 px-4 font-bold text-black">Reference sheets (Cast)</td>
                    <td className="py-3 px-4 font-bold text-green-600">Excellent</td>
                    <td className="py-3 px-4 font-bold text-black hidden sm:table-cell">Low</td>
                    <td className="py-3 px-4 font-bold text-green-600">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Closing */}
          <section>
            <div className="border-l-4 border-indigo-500 pl-6 py-2">
              <p className="text-xl font-bold text-black leading-relaxed">
                Character consistency in AI video isn&apos;t a model problem — it&apos;s an input problem.
              </p>
              <p className="text-gray-600 mt-2 leading-relaxed">
                Give the AI a clear visual reference from every angle, and it produces consistent results. Reference sheets are the simplest, most production-ready way to do that today.
              </p>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8 sm:p-10 text-center border border-gray-100">
          <h3 className="text-2xl font-black text-black mb-2">Ready to try it?</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Browse 100+ AI characters or create your own with a full 8-panel reference sheet.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="bg-black text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-colors">
              Browse Characters
            </Link>
            <Link href="/create" className="border border-gray-200 text-gray-700 font-semibold text-sm px-8 py-3.5 rounded-xl hover:border-gray-400 transition-colors">
              Create Your Own
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
