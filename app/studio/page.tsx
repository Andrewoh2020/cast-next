import Link from 'next/link';

/**
 * Stub for the new chat-driven Studio surface — being built on
 * pivot/studio-v1. Nothing real here yet; this exists to verify the
 * Vercel preview deployment pipeline before we layer in the real
 * project / agent / chat surface in Week 1+.
 *
 * Production /workshop is unaffected — this branch never merges to
 * main without explicit approval.
 */
export const metadata = {
  title: 'Studio — Cast',
  robots: { index: false, follow: false },
};

export default function StudioStubPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Pivot · studio-v1</p>
        <h1 className="text-3xl font-black tracking-tight text-black mb-3">
          Studio is being built<span className="text-indigo-500">.</span>
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          A chat-driven AI content studio with Kling 3.0 Pro, Seedance 2.0, and voice — orchestrated under one workflow.
          This preview deploy is private to the pivot branch; production is unaffected.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-xs">
          <Link href="/" className="text-gray-500 hover:text-black underline underline-offset-2">Home</Link>
          <span className="text-gray-300">·</span>
          <Link href="/workshop" className="text-gray-500 hover:text-black underline underline-offset-2">Legacy Workshop</Link>
        </div>
      </div>
    </main>
  );
}
