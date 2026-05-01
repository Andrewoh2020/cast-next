import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { readProject } from '@/lib/studio.server';

/**
 * Per-project Studio workspace.
 * Week 1: placeholder showing the project metadata + asset count.
 * Week 2 will replace this with the chat surface and asset sidebar.
 */
interface Props {
  params: Promise<{ projectId: string }>;
}

export const metadata = {
  title: 'Studio · Project — Cast',
  robots: { index: false, follow: false },
};

export default async function StudioProjectPage({ params }: Props) {
  const { projectId } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/studio/${projectId}`);

  const project = await readProject(userId, projectId);
  if (!project) redirect('/studio');

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Link href="/studio" className="hover:text-black underline underline-offset-2">Projects</Link>
          <span>·</span>
          <span className="text-gray-400">{project.name}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-black mb-1">{project.name}</h1>
        <p className="text-sm text-gray-500 mb-8">
          {project.assets.length} {project.assets.length === 1 ? 'asset' : 'assets'} · created {new Date(project.createdAt).toLocaleDateString()}
        </p>

        <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Week 1 placeholder</p>
          <h2 className="text-xl font-black tracking-tight text-black mb-1">Chat surface coming next</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Project shell is wired up. The chat surface, asset sidebar, and agent-driven generation flow ship in Week 2.
          </p>
        </div>
      </div>
    </main>
  );
}
