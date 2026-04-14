import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog — Cast',
  description: 'Guides, tutorials, and insights on AI video production, character consistency, and copyright-safe AI actors.',
  openGraph: {
    title: 'Blog — Cast',
    description: 'Guides, tutorials, and insights on AI video production, character consistency, and copyright-safe AI actors.',
  },
};

const posts = [
  {
    slug: 'best-ai-video-generators',
    title: 'The Best AI Video Generators in 2026: Seedance, Kling, Runway, and Veo Compared',
    description: 'An in-depth comparison of the top AI video generators — which one is best for your production?',
    date: '2026-04-14',
  },
  {
    slug: 'character-consistency-ai-video',
    title: 'How to Keep the Same Character Consistent Across AI Video Shots',
    description: 'Why AI video tools generate different faces every shot, what the workarounds are, and how reference sheets solve the problem for good.',
    date: '2026-04-13',
  },
];

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogIndex() {
  return (
    <main className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Blog</p>
        <h1 className="text-5xl font-black tracking-tighter text-black leading-[1.05] mb-6">
          Guides & Insights
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-16 max-w-xl">
          Everything you need to know about AI video production, character consistency, and building with Cast.
        </p>

        <div className="space-y-10">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <time className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                  {formatDate(post.date)}
                </time>
                <h2 className="text-2xl font-black tracking-tight text-black mb-2 leading-snug group-hover:text-indigo-500 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-500 leading-relaxed">{post.description}</p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
