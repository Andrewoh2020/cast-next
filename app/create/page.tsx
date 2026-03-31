import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CreateClient from '@/components/create/CreateClient';

export const metadata: Metadata = {
  title: 'Create Your Own Character',
  description: 'Design and generate your own AI character for film and video production. Describe, preview, and download — powered by AI.',
};

export default async function CreatePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return <CreateClient />;
}
