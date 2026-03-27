export const dynamic = 'force-dynamic';

import { readCharacters } from '@/lib/characters.server';
import DashboardClient from '@/components/admin/DashboardClient';

export default async function DashboardPage() {
  const characters = await readCharacters();
  return <DashboardClient initialCharacters={characters} />;
}
