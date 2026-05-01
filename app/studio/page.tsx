import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { listProjects } from '@/lib/studio.server';
import StudioCreateButton from './StudioCreateButton';

/**
 * Studio project list — entry point for the chat-driven studio surface.
 * Replaces the smoke-test stub now that the project data layer exists.
 *
 * On pivot/studio-v1. Production /workshop is unaffected.
 */
export const metadata = {
  title: 'Studio — Cast',
  robots: { index: false, follow: false },
};

export default async function StudioListPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/studio');

  const projects = await listProjects(userId);

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Pivot · studio-v1</p>
            <h1 className="text-3xl font-black tracking-tight text-black">Your projects</h1>
            <p className="text-sm text-gray-500 mt-1">
              Each project is its own creative space — characters, products, shots, voices, conversation.
            </p>
          </div>
          <StudioCreateButton />
        </div>

        {projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h2 className="text-xl font-black tracking-tight text-black mb-1">No projects yet</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
              Start a new project to cast characters, generate scenes, and direct video — all in one chat workflow.
            </p>
            <StudioCreateButton variant="primary" />
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/studio/${p.id}`}
                  className="block bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 mb-3 overflow-hidden">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${p.thumbnailUrl}${p.thumbnailUrl.includes('?') ? '&' : '?'}w=400`} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-black truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {p.assetCount} {p.assetCount === 1 ? 'asset' : 'assets'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
